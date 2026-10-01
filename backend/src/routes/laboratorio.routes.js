const express = require("express");
const router = express.Router();
const { verificarToken, verificarRol } = require("../middleware/auth.middleware");
const { listarExamenesPendientes, registrarResultado, listarExamenesRealizados } = require("../controllers/laboratorio.controller");

router.get("/pendientes", verificarToken, listarExamenesPendientes);
router.get("/realizados", verificarToken, listarExamenesRealizados);
router.post("/:id/resultado", verificarToken, verificarRol("administrador", "laboratorista"), registrarResultado);

module.exports = router;
