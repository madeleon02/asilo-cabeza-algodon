const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');
const {
  listarInternos,
  obtenerInterno,
  crearInterno,
  actualizarInterno
} = require('../controllers/internos.controller');

router.get('/', verificarToken, listarInternos);
router.get('/:id', verificarToken, obtenerInterno);
router.post('/', verificarToken, verificarRol('administrador', 'director'), crearInterno);
router.put('/:id', verificarToken, verificarRol('administrador', 'director'), actualizarInterno);

module.exports = router;