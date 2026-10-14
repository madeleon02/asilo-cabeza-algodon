const router = require('express').Router();
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');
const { reporteInternos, reporteSolicitudes, reporteFinanciero, reporteFarmacia } = require('../controllers/reportes.controller');

router.use(verificarToken);
router.use(verificarRol('administrador', 'director'));

router.get('/internos', reporteInternos);
router.get('/solicitudes', reporteSolicitudes);
router.get('/financiero', reporteFinanciero);
router.get('/farmacia', reporteFarmacia);

module.exports = router;
