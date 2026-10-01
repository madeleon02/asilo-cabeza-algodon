const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');
const {
    listarVisitas,
    iniciarVisita,
    finalizarVisita,
    agregarExamen,
    agregarPrescripcion
} = require('../controllers/visitas.controller');

router.get('/', verificarToken, listarVisitas);
router.post('/', verificarToken, verificarRol('administrador', 'medico_especialista'), iniciarVisita);
router.put('/:id/finalizar', verificarToken, verificarRol('administrador', 'medico_especialista'), finalizarVisita);
router.post('/:id/examenes', verificarToken, verificarRol('administrador', 'medico_especialista'), agregarExamen);
router.post('/:id/prescripciones', verificarToken, verificarRol('administrador', 'medico_especialista'), agregarPrescripcion);

module.exports = router;