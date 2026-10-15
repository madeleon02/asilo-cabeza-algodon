const prisma = require('../lib/prisma');

const listarSolicitudes = async (req, res) => {
    try {
        const { rol, id_usuario } = req.usuario;
        let where = {};
        if (rol === 'medico_general') {
            const medico = await prisma.medico.findFirst({ where: { id_usuario } });
            if (medico) where.id_medico_general = medico.id_medico;
        } else if (rol === 'fundacion') {
            where.estado = { in: ['pendiente', 'asignada'] };
        } else if (rol === 'medico_especialista') {
            const medico = await prisma.medico.findFirst({ where: { id_usuario } });
            if (medico) where.id_medico_especialista = medico.id_medico;
        } else if (rol === 'enfermero') {
            where.id_enfermero = id_usuario;
        }
        const solicitudes = await prisma.solicitudReferencia.findMany({
            where,
            include: {
                interno: { select: { id_interno: true, nombres: true, apellidos: true, dpi: true } },
                medico_general: { select: { nombre_completo: true } },
                medico_especialista: { select: { nombre_completo: true, especialidad: true } },
            },
            orderBy: { fecha_creacion: 'desc' }
        });
        res.json(solicitudes);
    } catch (error) {
        console.error('Error listarSolicitudes:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const crearSolicitud = async (req, res) => {
    try {
        const { id_usuario } = req.usuario;
        const { id_interno, especialidad_requerida, motivo_referencia } = req.body;
        if (!id_interno || !especialidad_requerida || !motivo_referencia) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        const interno = await prisma.interno.findUnique({
            where: { id_interno: parseInt(id_interno) },
            include: { familiar: true }
        });
        if (!interno) return res.status(404).json({ error: 'Interno no encontrado' });
        if (interno.estado !== 'activo') {
            return res.status(400).json({ error: 'Solo se pueden crear solicitudes para internos activos' });
        }
        const medico = await prisma.medico.findFirst({ where: { id_usuario } });
        if (!medico) return res.status(400).json({ error: 'Usuario no tiene perfil de medico' });
        const enfermero = await prisma.usuario.findFirst({
            where: { activo: true, rol: { nombre_rol: 'enfermero' } },
            include: { rol: true }
        });
        const solicitud = await prisma.solicitudReferencia.create({
            data: {
                id_interno: parseInt(id_interno),
                id_medico_general: medico.id_medico,
                id_enfermero: enfermero ? enfermero.id_usuario : null,
                especialidad_requerida,
                motivo_referencia,
                estado: 'pendiente',
                correo_enviado: false,
            },
            include: {
                interno: { include: { familiar: true } },
                medico_general: true,
            }
        });
        notificarFamiliar(solicitud).catch(e => console.error('Error notificacion:', e));
        res.status(201).json(solicitud);
    } catch (error) {
        console.error('Error crearSolicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const asignarCita = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_medico_especialista, fecha_cita } = req.body;
        if (!id_medico_especialista || !fecha_cita) {
            return res.status(400).json({ error: 'Medico especialista y fecha son obligatorios' });
        }
        const solicitud = await prisma.solicitudReferencia.findUnique({
            where: { id_solicitud: parseInt(id) }
        });
        if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
        if (solicitud.estado !== 'pendiente') {
            return res.status(400).json({ error: 'Solo se pueden asignar solicitudes pendientes' });
        }
        const actualizada = await prisma.solicitudReferencia.update({
            where: { id_solicitud: parseInt(id) },
            data: {
                id_medico_especialista: parseInt(id_medico_especialista),
                fecha_cita: new Date(fecha_cita),
                estado: 'asignada',
            },
            include: { interno: true, medico_especialista: true }
        });
        res.json(actualizada);
    } catch (error) {
        console.error('Error asignarCita:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const cancelarSolicitud = async (req, res) => {
    try {
        const { id } = req.params;
        const solicitud = await prisma.solicitudReferencia.findUnique({
            where: { id_solicitud: parseInt(id) }
        });
        if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
        if (['completada', 'cancelada'].includes(solicitud.estado)) {
            return res.status(400).json({ error: 'No se puede cancelar una solicitud en estado ' + solicitud.estado });
        }
        const cancelada = await prisma.solicitudReferencia.update({
            where: { id_solicitud: parseInt(id) },
            data: { estado: 'cancelada' }
        });
        res.json(cancelada);
    } catch (error) {
        console.error('Error cancelarSolicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

async function notificarFamiliar(solicitud) {
    const axios = require('axios');
    const API_KEY = process.env.NOTIFICACIONES_API_KEY;
    const URL = process.env.NOTIFICACIONES_URL;
    await axios.post(URL, {
        idSolicitud: solicitud.id_solicitud,
        nombreFamiliar: solicitud.interno.familiar.nombres + ' ' + solicitud.interno.familiar.apellidos,
        correoFamiliar: solicitud.interno.familiar.correo_electronico,
        nombreInterno: solicitud.interno.nombres + ' ' + solicitud.interno.apellidos,
        especialidadRequerida: solicitud.especialidad_requerida,
        motivoReferencia: solicitud.motivo_referencia,
        nombreMedicoGeneral: solicitud.medico_general.nombre_completo,
        estadoSolicitud: 'pendiente'
    }, { headers: { 'X-Api-Key': API_KEY }, timeout: 5000 });
}

module.exports = { listarSolicitudes, crearSolicitud, asignarCita, cancelarSolicitud };
