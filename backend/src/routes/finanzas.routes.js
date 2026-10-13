const router = require('express').Router();
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');
const {
  listarCobros, crearCobro, registrarPago,
  listarDonaciones, crearDonacion,
  listarGastos, crearGasto,
  listarPagosFundacion, crearPagoFundacion,
  resumenFinanciero,
} = require('../controllers/finanzas.controller');

router.use(verificarToken);

const ADMIN_DIR = verificarRol('administrador', 'director');

// Resumen
router.get('/resumen', ADMIN_DIR, resumenFinanciero);

// Cobros familiares
router.get('/cobros', ADMIN_DIR, listarCobros);
router.post('/cobros', ADMIN_DIR, crearCobro);
router.put('/cobros/:id/pago', ADMIN_DIR, registrarPago);

// Donaciones
router.get('/donaciones', ADMIN_DIR, listarDonaciones);
router.post('/donaciones', ADMIN_DIR, crearDonacion);

// Gastos operativos
router.get('/gastos', ADMIN_DIR, listarGastos);
router.post('/gastos', ADMIN_DIR, crearGasto);

// Pagos a fundación
router.get('/pagos-fundacion', ADMIN_DIR, listarPagosFundacion);
router.post('/pagos-fundacion', ADMIN_DIR, crearPagoFundacion);

module.exports = router;
