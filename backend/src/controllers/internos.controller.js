const prisma = require('../lib/prisma');

const listarInternos = async (req, res) => {
  try {
    const internos = await prisma.interno.findMany({
      include: {
        familiar: true,
        psicopatologias: { where: { activo: true } },
        medicamentos: { where: { activo: true } }
      },
      orderBy: { fecha_registro: 'desc' }
    });
    res.json(internos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener internos' });
  }
};

const obtenerInterno = async (req, res) => {
  try {
    const { id } = req.params;
    const interno = await prisma.interno.findUnique({
      where: { id_interno: parseInt(id) },
      include: {
        familiar: true,
        psicopatologias: true,
        medicamentos: true,
        solicitudes: {
          include: { visita: true },
          orderBy: { fecha_creacion: 'desc' }
        }
      }
    });
    if (!interno) return res.status(404).json({ error: 'Interno no encontrado' });
    res.json(interno);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener interno' });
  }
};

const crearInterno = async (req, res) => {
  try {
    const {
      nombres, apellidos, dpi, fecha_nacimiento, fecha_ingreso,
      estado, motivo_ingreso,
      familiar, psicopatologias, medicamentos
    } = req.body;

    // Crear familiar y interno en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      const nuevoFamiliar = await tx.familiar.create({
        data: {
          nombres: familiar.nombres,
          apellidos: familiar.apellidos,
          parentesco: familiar.parentesco,
          telefono: familiar.telefono,
          correo_electronico: familiar.correo_electronico,
          direccion: familiar.direccion || null
        }
      });

      const nuevoInterno = await tx.interno.create({
        data: {
          id_familiar: nuevoFamiliar.id_familiar,
          nombres, apellidos, dpi,
          fecha_nacimiento: new Date(fecha_nacimiento),
          fecha_ingreso: new Date(fecha_ingreso),
          estado: estado || 'activo',
          motivo_ingreso: motivo_ingreso || null,
          psicopatologias: psicopatologias?.length ? {
            create: psicopatologias.map(p => ({
              nombre_condicion: p.nombre_condicion,
              descripcion: p.descripcion || null
            }))
          } : undefined,
          medicamentos: medicamentos?.length ? {
            create: medicamentos.map(m => ({
              nombre_medicamento: m.nombre_medicamento,
              dosis: m.dosis,
              tiempo_aplicacion: m.tiempo_aplicacion || null
            }))
          } : undefined
        },
        include: { familiar: true, psicopatologias: true, medicamentos: true }
      });

      return nuevoInterno;
    });

    res.status(201).json(resultado);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El DPI ya está registrado en el sistema' });
    }
    res.status(500).json({ error: 'Error al crear interno' });
  }
};

const actualizarInterno = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivo_ingreso } = req.body;

    const interno = await prisma.interno.update({
      where: { id_interno: parseInt(id) },
      data: { estado, motivo_ingreso }
    });

    res.json(interno);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar interno' });
  }
};

module.exports = { listarInternos, obtenerInterno, crearInterno, actualizarInterno };