const prisma = require('../lib/prisma');

// GET /api/visitas
const listarVisitas = async (req, res) => {
    try {
        const { rol, id_usuario } = req.usuario;
        let where = {};

        if (rol === 'medico_especialista') {
            const medico = await prisma.medico.findUnique({ where: { id_usuario } });
            if (medico) where.id_medico_especialista = medico.id_medico;
        }

        const visitas = await prisma.visitaMedica.findMany({
            where,
            include: {
                interno: { select: { nombres: true, apellidos: true, dpi: true } },
                solicitud: { select: { especialidad_requerida: true, motivo_referencia: true } },
                medico: { select: { nombre_completo: true, especialidad: true } },
                examenes: true,
                prescripciones: true,
            },
            orderBy: { fecha_visita: 'desc' }
        });

        res.json(visitas);
    } catch (error) {
        console.error('Error listarVisitas:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// POST /api/visitas — iniciar visita
const iniciarVisita = async (req, res) => {
    try {
        const { id_solicitud } = req.body;
        const { id_usuario } = req.usuario;

        if (!id_solicitud) return res.status(400).json({ error: 'id_solicitud es requerido' });

        const solicitud = await prisma.solicitudReferencia.findUnique({
            where: { id_solicitud: parseInt(id_solicitud) }
        });

        if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
        if (solicitud.estado !== 'asignada') {
            return res.status(400).json({ error: 'La solicitud debe estar en estado asignada' });
        }

        const medico = await prisma.medico.findUnique({ where: { id_usuario } });
        if (!medico) return res.status(400).json({ error: 'Usuario no tiene perfil de medico' });

        const [visita] = await prisma.$transaction([
            prisma.visitaMedica.create({
                data: {
                    id_solicitud: parseInt(id_solicitud),
                    id_interno: solicitud.id_interno,
                    id_medico_especialista: medico.id_medico,
                    motivo_visita: solicitud.motivo_referencia,
                    diagnostico: '',
                    costo_consulta: 150.00,
                    estado: 'en_proceso',
                },
                include: { interno: { select: { nombres: true, apellidos: true, dpi: true } } }
            }),
            prisma.solicitudReferencia.update({
                where: { id_solicitud: parseInt(id_solicitud) },
                data: { estado: 'en_proceso' }
            })
        ]);

        res.status(201).json(visita);
    } catch (error) {
        console.error('Error iniciarVisita:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// PUT /api/visitas/:id/finalizar
const finalizarVisita = async (req, res) => {
    try {
        const { id } = req.params;
        const { diagnostico, observaciones } = req.body;

        if (!diagnostico) return res.status(400).json({ error: 'El diagnostico es obligatorio' });

        const visita = await prisma.visitaMedica.findUnique({
            where: { id_visita: parseInt(id) },
            include: {
                examenes: true,
                prescripciones: true,
                solicitud: true,
                interno: { include: { familiar: true } }
            }
        });

        if (!visita) return res.status(404).json({ error: 'Visita no encontrada' });
        if (visita.estado !== 'en_proceso') {
            return res.status(400).json({ error: 'Solo se pueden finalizar visitas en proceso' });
        }

        const costoExamenes = visita.examenes.reduce((sum, e) => sum + parseFloat(e.costo_examen || 0), 0);
        const costoMedicamentos = visita.prescripciones.reduce((sum, p) => sum + parseFloat(p.costo_medicamento || 0), 0);
        const costoTotal = parseFloat(visita.costo_consulta) + costoExamenes + costoMedicamentos;

        await prisma.$transaction([
            prisma.visitaMedica.update({
                where: { id_visita: parseInt(id) },
                data: { diagnostico, observaciones, estado: 'completada' }
            }),
            prisma.solicitudReferencia.update({
                where: { id_solicitud: visita.id_solicitud },
                data: { estado: 'completada' }
            }),
            prisma.cobroFamiliar.create({
                data: {
                    id_familiar: visita.interno.id_familiar,
                    id_interno: visita.id_interno,
                    descripcion: 'Visita medica - ' + (visita.solicitud?.especialidad_requerida || 'Consulta'),
                    monto_total: costoTotal,
                    monto_pagado: 0,
                    saldo_pendiente: costoTotal,
                    estado: 'pendiente',
                }
            }),
            prisma.familiar.update({
                where: { id_familiar: visita.interno.id_familiar },
                data: { saldo_pendiente: { increment: costoTotal } }
            })
        ]);

        res.json({ mensaje: 'Visita finalizada correctamente', costo_total: costoTotal });
    } catch (error) {
        console.error('Error finalizarVisita:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// POST /api/visitas/:id/examenes
const agregarExamen = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_examen, descripcion, costo_examen } = req.body;

        if (!nombre_examen) return res.status(400).json({ error: 'nombre_examen es obligatorio' });

        const examen = await prisma.examenSolicitado.create({
            data: {
                id_visita: parseInt(id),
                nombre_examen,
                descripcion: descripcion || '',
                costo_examen: parseFloat(costo_examen) || 0,
                estado: 'pendiente'
            }
        });

        res.status(201).json(examen);
    } catch (error) {
        console.error('Error agregarExamen:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// POST /api/visitas/:id/prescripciones
const agregarPrescripcion = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_medicamento, cantidad, dosis, tiempo_aplicacion, costo_medicamento } = req.body;

        if (!nombre_medicamento || !dosis || !cantidad) {
            return res.status(400).json({ error: 'nombre_medicamento, cantidad y dosis son obligatorios' });
        }

        const prescripcion = await prisma.prescripcion.create({
            data: {
                id_visita: parseInt(id),
                nombre_medicamento,
                cantidad,
                dosis,
                tiempo_aplicacion: tiempo_aplicacion || '',
                costo_medicamento: parseFloat(costo_medicamento) || 0,
                estado_despacho: 'pendiente'
            }
        });

        res.status(201).json(prescripcion);
    } catch (error) {
        console.error('Error agregarPrescripcion:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { listarVisitas, iniciarVisita, finalizarVisita, agregarExamen, agregarPrescripcion };
