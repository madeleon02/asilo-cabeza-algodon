const router = require('express').Router();
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');
const { listarPrescripciones, despacharPrescripcion, cancelarPrescripcion } = require('../controllers/farmacia.controller');

router.use(verificarToken);

router.get('/', verificarRol('farmaceutico', 'administrador', 'director'), listarPrescripciones);
router.post('/:id/despachar', verificarRol('farmaceutico', 'administrador'), despacharPrescripcion);
router.put('/:id/cancelar', verificarRol('farmaceutico', 'administrador'), cancelarPrescripcion);

module.exports = router;
