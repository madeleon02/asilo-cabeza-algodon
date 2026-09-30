const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

// Rutas de visitas (por implementar)
router.get('/', verificarToken, (req, res) => {
    res.json([]);
});

module.exports = router;