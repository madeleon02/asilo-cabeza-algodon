const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── COBROS FAMILIARES ───────────────────────────────────────────────
async function listarCobros(req, res) {
  try {
    const { estado } = req.query;
    const where = estado ? { estado } : {};
    const cobros = await prisma.cobroFamiliar.findMany({
      where,
      include: {
        familiar: true,
        interno: { select: { id_interno: true, nombre_completo: true } },
      },
      orderBy: { fecha_cobro: 'desc' },
    });
    res.json(cobros);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar cobros' });
  }
}

async function crearCobro(req, res) {
  try {
    const { id_familiar, id_interno, descripcion, monto_total } = req.body;
    if (!id_familiar || !id_interno || !descripcion || !monto_total)
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    const monto = parseFloat(monto_total);
    if (monto <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });

    const cobro = await prisma.cobroFamiliar.create({
      data: {
        id_familiar: parseInt(id_familiar),
        id_interno: parseInt(id_interno),
        descripcion,
        monto_total: monto,
        saldo_pendiente: monto,
      },
    });
    res.status(201).json(cobro);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear cobro' });
  }
}

async function registrarPago(req, res) {
  try {
    const { id } = req.params;
    const { monto_pago } = req.body;
    if (!monto_pago) return res.status(400).json({ error: 'Monto de pago requerido' });

    const cobro = await prisma.cobroFamiliar.findUnique({ where: { id_cobro: parseInt(id) } });
    if (!cobro) return res.status(404).json({ error: 'Cobro no encontrado' });
    if (cobro.estado === 'pagado') return res.status(400).json({ error: 'Este cobro ya está completamente pagado' });

    const pago = parseFloat(monto_pago);
    if (pago <= 0) return res.status(400).json({ error: 'El pago debe ser mayor a 0' });
    if (pago > parseFloat(cobro.saldo_pendiente))
      return res.status(400).json({ error: `El pago (Q${pago}) supera el saldo pendiente (Q${cobro.saldo_pendiente})` });

    const nuevo_pagado = parseFloat(cobro.monto_pagado) + pago;
    const nuevo_saldo = parseFloat(cobro.monto_total) - nuevo_pagado;
    const nuevo_estado = nuevo_saldo <= 0 ? 'pagado' : 'parcial';

    const actualizado = await prisma.cobroFamiliar.update({
      where: { id_cobro: parseInt(id) },
      data: {
        monto_pagado: nuevo_pagado,
        saldo_pendiente: nuevo_saldo,
        estado: nuevo_estado,
        fecha_pago_completo: nuevo_estado === 'pagado' ? new Date() : null,
      },
    });
    res.json(actualizado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
}

// ─── DONACIONES ──────────────────────────────────────────────────────
async function listarDonaciones(req, res) {
  try {
    const donaciones = await prisma.donacion.findMany({ orderBy: { fecha_donacion: 'desc' } });
    res.json(donaciones);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar donaciones' });
  }
}

async function crearDonacion(req, res) {
  try {
    const { tipo_donante, nombre_donante, monto, descripcion } = req.body;
    if (!tipo_donante || !nombre_donante || !monto)
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    const montoNum = parseFloat(monto);
    if (montoNum <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });

    const donacion = await prisma.donacion.create({
      data: {
        id_usuario_registro: req.usuario.id_usuario,
        tipo_donante,
        nombre_donante,
        monto: montoNum,
        descripcion: descripcion || null,
      },
    });
    res.status(201).json(donacion);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al registrar donación' });
  }
}

// ─── GASTOS OPERATIVOS ───────────────────────────────────────────────
async function listarGastos(req, res) {
  try {
    const gastos = await prisma.gastoOperativo.findMany({ orderBy: { fecha_gasto: 'desc' } });
    res.json(gastos);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar gastos' });
  }
}

async function crearGasto(req, res) {
  try {
    const { categoria, descripcion, monto, proveedor } = req.body;
    if (!categoria || !descripcion || !monto)
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    const montoNum = parseFloat(monto);
    if (montoNum <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });

    const gasto = await prisma.gastoOperativo.create({
      data: {
        id_usuario_registro: req.usuario.id_usuario,
        categoria,
        descripcion,
        monto: montoNum,
        proveedor: proveedor || null,
      },
    });
    res.status(201).json(gasto);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al registrar gasto' });
  }
}

// ─── PAGOS FUNDACIÓN ─────────────────────────────────────────────────
async function listarPagosFundacion(req, res) {
  try {
    const pagos = await prisma.pagoFundacion.findMany({ orderBy: { fecha_pago: 'desc' } });
    res.json(pagos);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar pagos a fundación' });
  }
}

async function crearPagoFundacion(req, res) {
  try {
    const { monto, descripcion } = req.body;
    if (!monto) return res.status(400).json({ error: 'Monto requerido' });
    const montoNum = parseFloat(monto);
    if (montoNum <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });

    const pago = await prisma.pagoFundacion.create({
      data: {
        id_usuario_registro: req.usuario.id_usuario,
        monto: montoNum,
        descripcion: descripcion || null,
      },
    });
    res.status(201).json(pago);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al registrar pago a fundación' });
  }
}

// ─── RESUMEN FINANCIERO ──────────────────────────────────────────────
async function resumenFinanciero(req, res) {
  try {
    const [cobros, donaciones, gastos, pagosFundacion] = await Promise.all([
      prisma.cobroFamiliar.aggregate({ _sum: { monto_pagado: true, monto_total: true, saldo_pendiente: true } }),
      prisma.donacion.aggregate({ _sum: { monto: true } }),
      prisma.gastoOperativo.aggregate({ _sum: { monto: true } }),
      prisma.pagoFundacion.aggregate({ _sum: { monto: true } }),
    ]);

    res.json({
      cobros: {
        total: parseFloat(cobros._sum.monto_total) || 0,
        pagado: parseFloat(cobros._sum.monto_pagado) || 0,
        pendiente: parseFloat(cobros._sum.saldo_pendiente) || 0,
      },
      donaciones: parseFloat(donaciones._sum.monto) || 0,
      gastos: parseFloat(gastos._sum.monto) || 0,
      pagos_fundacion: parseFloat(pagosFundacion._sum.monto) || 0,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener resumen financiero' });
  }
}

module.exports = {
  listarCobros, crearCobro, registrarPago,
  listarDonaciones, crearDonacion,
  listarGastos, crearGasto,
  listarPagosFundacion, crearPagoFundacion,
  resumenFinanciero,
};
