const prisma = require('../lib/prisma');

// GET /api/farmacia — listar prescripciones pendientes de despacho
const listarPrescripciones = async (req, res) => {
    try {
        const { estado } = req.query; // pendiente | despachado | cancelado | (vacío = todos)

        const where = estado ? { estado_despacho: estado } : {};

        const prescripciones = await prisma.prescripcion.findMany({
            where,
            include: {
                visita: {
                    include: {
                        interno: { select: { nombres: true, apellidos: true, dpi: true } },
                        medico: { select: { nombre_completo: true, especialidad: true } },
                    }
                },
                despacho: true,
            },
            orderBy: { id_prescripcion: 'desc' }
        });

        res.json(prescripciones);
    } catch (error) {
        console.error('Error listarPrescripciones:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// POST /api/farmacia/:id/despachar — despachar una prescripción
const despacharPrescripcion = async (req, res) => {
    try {
        const { id } = req.params;
        const { observaciones } = req.body;
        const { id_usuario } = req.usuario;

        const prescripcion = await prisma.prescripcion.findUnique({
            where: { id_prescripcion: parseInt(id) },
            include: { despacho: true }
        });

        if (!prescripcion) {
            return res.status(404).json({ error: 'Prescripción no encontrada' });
        }
        if (prescripcion.estado_despacho !== 'pendiente') {
            return res.status(400).json({
                error: `Esta prescripción ya fue ${prescripcion.estado_despacho}`
            });
        }

        const [despacho] = await prisma.$transaction([
            prisma.despachoFarmacia.create({
                data: {
                    id_prescripcion: parseInt(id),
                    id_farmaceutico: id_usuario,
                    observaciones: observaciones || null,
                }
            }),
            prisma.prescripcion.update({
                where: { id_prescripcion: parseInt(id) },
                data: { estado_despacho: 'despachado' }
            })
        ]);

        res.status(201).json({ mensaje: 'Medicamento despachado correctamente', despacho });
    } catch (error) {
        console.error('Error despacharPrescripcion:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// PUT /api/farmacia/:id/cancelar — cancelar una prescripción
const cancelarPrescripcion = async (req, res) => {
    try {
        const { id } = req.params;

        const prescripcion = await prisma.prescripcion.findUnique({
            where: { id_prescripcion: parseInt(id) }
        });

        if (!prescripcion) {
            return res.status(404).json({ error: 'Prescripción no encontrada' });
        }
        if (prescripcion.estado_despacho !== 'pendiente') {
            return res.status(400).json({
                error: `No se puede cancelar una prescripción en estado ${prescripcion.estado_despacho}`
            });
        }

        const cancelada = await prisma.prescripcion.update({
            where: { id_prescripcion: parseInt(id) },
            data: { estado_despacho: 'cancelado' }
        });

        res.json({ mensaje: 'Prescripción cancelada', prescripcion: cancelada });
    } catch (error) {
        console.error('Error cancelarPrescripcion:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { listarPrescripciones, despacharPrescripcion, cancelarPrescripcion };
