const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');
const { listarSolicitudes, crearSolicitud, asignarCita, cancelarSolicitud } = require('../controllers/solicitudes.controller');

router.get('/', verificarToken, listarSolicitudes);
router.post('/', verificarToken, verificarRol('administrador', 'medico_general'), crearSolicitud);
router.put('/:id/asignar', verificarToken, verificarRol('administrador', 'fundacion'), asignarCita);
router.put('/:id/cancelar', verificarToken, verificarRol('administrador', 'fundacion', 'medico_general'), cancelarSolicitud);

module.exports = router;
