const prisma = require("../lib/prisma");

const listarExamenesPendientes = async (req, res) => {
  try {
    const examenes = await prisma.examenSolicitado.findMany({
      where: { estado: "pendiente" },
      include: {
        visita: {
          include: {
            interno: { select: { nombres: true, apellidos: true, dpi: true } },
            medico: { select: { nombre_completo: true } },
          }
        }
      },
      orderBy: { id_examen: "desc" }
    });
    res.json(examenes);
  } catch (error) {
    console.error("Error listarExamenesPendientes:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const registrarResultado = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_usuario } = req.usuario;
    const { resultado_texto, valores_referencia, observaciones } = req.body;

    if (!resultado_texto) return res.status(400).json({ error: "El resultado es obligatorio" });

    const examen = await prisma.examenSolicitado.findUnique({
      where: { id_examen: parseInt(id) }
    });

    if (!examen) return res.status(404).json({ error: "Examen no encontrado" });
    if (examen.estado !== "pendiente") {
      return res.status(400).json({ error: "El examen ya fue procesado" });
    }

    const [resultado] = await prisma.$transaction([
      prisma.resultadoLaboratorio.create({
        data: {
          id_examen: parseInt(id),
          id_laboratorista: id_usuario,
          resultado_texto,
          valores_referencia: valores_referencia || "",
          observaciones: observaciones || "",
        }
      }),
      prisma.examenSolicitado.update({
        where: { id_examen: parseInt(id) },
        data: { estado: "realizado" }
      })
    ]);

    res.status(201).json(resultado);
  } catch (error) {
    console.error("Error registrarResultado:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const listarExamenesRealizados = async (req, res) => {
  try {
    const examenes = await prisma.examenSolicitado.findMany({
      where: { estado: "realizado" },
      include: {
        visita: {
          include: {
            interno: { select: { nombres: true, apellidos: true } },
          }
        },
        resultado: true,
      },
      orderBy: { id_examen: "desc" }
    });
    res.json(examenes);
  } catch (error) {
    console.error("Error listarExamenesRealizados:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = { listarExamenesPendientes, registrarResultado, listarExamenesRealizados };
