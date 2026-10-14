const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// RF-32: Reporte de internos por estado
async function reporteInternos(req, res) {
  try {
    const [porEstado, total, recientes] = await Promise.all([
      prisma.interno.groupBy({
        by: ['estado'],
        _count: { id_interno: true },
      }),
      prisma.interno.count(),
      prisma.interno.findMany({
        orderBy: { fecha_ingreso: 'desc' },
        take: 10,
        select: {
          id_interno: true,
          nombres: true,
          apellidos: true,
          estado: true,
          fecha_ingreso: true,
        },
      }),
    ]);

    res.json({
      total,
      por_estado: porEstado.map(e => ({ estado: e.estado, cantidad: e._count.id_interno })),
      recientes,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error en reporte de internos' });
  }
}

// RF-33: Reporte de solicitudes y visitas
async function reporteSolicitudes(req, res) {
  try {
    const [porEstado, porEspecialidad, visitas] = await Promise.all([
      prisma.solicitudReferencia.groupBy({
        by: ['estado'],
        _count: { id_solicitud: true },
      }),
      prisma.solicitudReferencia.groupBy({
        by: ['especialidad_requerida'],
        _count: { id_solicitud: true },
        orderBy: { _count: { id_solicitud: 'desc' } },
        take: 8,
      }),
      prisma.visitaMedica.groupBy({
        by: ['estado'],
        _count: { id_visita: true },
      }),
    ]);

    const totalSolicitudes = await prisma.solicitudReferencia.count();
    const totalVisitas = await prisma.visitaMedica.count();

    res.json({
      solicitudes: {
        total: totalSolicitudes,
        por_estado: porEstado.map(e => ({ estado: e.estado, cantidad: e._count.id_solicitud })),
        por_especialidad: porEspecialidad.map(e => ({
          especialidad: e.especialidad_requerida,
          cantidad: e._count.id_solicitud,
        })),
      },
      visitas: {
        total: totalVisitas,
        por_estado: visitas.map(e => ({ estado: e.estado, cantidad: e._count.id_visita })),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error en reporte de solicitudes' });
  }
}

// RF-34: Reporte financiero
async function reporteFinanciero(req, res) {
  try {
    const [cobros, donaciones, gastos, pagosFund, donacioesPorTipo, gastosPorCategoria] = await Promise.all([
      prisma.cobroFamiliar.aggregate({
        _sum: { monto_total: true, monto_pagado: true, saldo_pendiente: true },
        _count: { id_cobro: true },
      }),
      prisma.donacion.aggregate({ _sum: { monto: true }, _count: { id_donacion: true } }),
      prisma.gastoOperativo.aggregate({ _sum: { monto: true }, _count: { id_gasto: true } }),
      prisma.pagoFundacion.aggregate({ _sum: { monto: true }, _count: { id_pago_fundacion: true } }),
      prisma.donacion.groupBy({
        by: ['tipo_donante'],
        _sum: { monto: true },
        _count: { id_donacion: true },
      }),
      prisma.gastoOperativo.groupBy({
        by: ['categoria'],
        _sum: { monto: true },
        _count: { id_gasto: true },
        orderBy: { _sum: { monto: 'desc' } },
        take: 6,
      }),
    ]);

    res.json({
      cobros: {
        total_emitido: parseFloat(cobros._sum.monto_total) || 0,
        total_cobrado: parseFloat(cobros._sum.monto_pagado) || 0,
        saldo_pendiente: parseFloat(cobros._sum.saldo_pendiente) || 0,
        cantidad: cobros._count.id_cobro,
      },
      donaciones: {
        total: parseFloat(donaciones._sum.monto) || 0,
        cantidad: donaciones._count.id_donacion,
        por_tipo: donacioesPorTipo.map(d => ({
          tipo: d.tipo_donante,
          monto: parseFloat(d._sum.monto) || 0,
          cantidad: d._count.id_donacion,
        })),
      },
      gastos: {
        total: parseFloat(gastos._sum.monto) || 0,
        cantidad: gastos._count.id_gasto,
        por_categoria: gastosPorCategoria.map(g => ({
          categoria: g.categoria,
          monto: parseFloat(g._sum.monto) || 0,
          cantidad: g._count.id_gasto,
        })),
      },
      pagos_fundacion: {
        total: parseFloat(pagosFund._sum.monto) || 0,
        cantidad: pagosFund._count.id_pago_fundacion,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error en reporte financiero' });
  }
}

// RF-35: Reporte de farmacia y laboratorio
async function reporteFarmacia(req, res) {
  try {
    const [porEstado, masPrescritos, examenesPorEstado, examenesRealizados] = await Promise.all([
      prisma.prescripcion.groupBy({
        by: ['estado_despacho'],
        _count: { id_prescripcion: true },
      }),
      prisma.prescripcion.groupBy({
        by: ['nombre_medicamento'],
        _count: { id_prescripcion: true },
        orderBy: { _count: { id_prescripcion: 'desc' } },
        take: 8,
      }),
      prisma.examenSolicitado.groupBy({
        by: ['estado'],
        _count: { id_examen: true },
      }),
      prisma.examenSolicitado.groupBy({
        by: ['nombre_examen'],
        _count: { id_examen: true },
        orderBy: { _count: { id_examen: 'desc' } },
        take: 8,
      }),
    ]);

    const totalPrescripciones = await prisma.prescripcion.count();
    const totalExamenes = await prisma.examenSolicitado.count();

    res.json({
      prescripciones: {
        total: totalPrescripciones,
        por_estado: porEstado.map(e => ({ estado: e.estado_despacho, cantidad: e._count.id_prescripcion })),
        mas_prescritos: masPrescritos.map(m => ({
          medicamento: m.nombre_medicamento,
          cantidad: m._count.id_prescripcion,
        })),
      },
      examenes: {
        total: totalExamenes,
        por_estado: examenesPorEstado.map(e => ({ estado: e.estado, cantidad: e._count.id_examen })),
        mas_solicitados: examenesRealizados.map(e => ({
          examen: e.nombre_examen,
          cantidad: e._count.id_examen,
        })),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error en reporte de farmacia' });
  }
}

module.exports = { reporteInternos, reporteSolicitudes, reporteFinanciero, reporteFarmacia };
