const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middlewares de seguridad
app.use(helmet());

// CORS: en producción lee del .env, en desarrollo permite localhost
const origenesPermitidos = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: origenesPermitidos,
  credentials: true
}));

app.use(express.json());

// Rate limiting — solo en el endpoint de login, ventana corta
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutos
  max: 3,                    // 3 intentos máximo
  skipSuccessfulRequests: true, // H-09: no contar intentos exitosos
  message: { error: 'Demasiados intentos fallidos. Intente en 5 minutos.' }
});

// Rutas
app.use('/api/auth/login', loginLimiter);           // rate limit SOLO en login
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/internos', require('./routes/internos.routes'));
app.use('/api/solicitudes', require('./routes/solicitudes.routes'));
app.use('/api/visitas', require('./routes/visitas.routes'));
app.use('/api/laboratorio', require('./routes/laboratorio.routes'));
app.use('/api/finanzas', require('./routes/finanzas.routes'));
app.use('/api/farmacia', require('./routes/farmacia.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    estado: 'ok',
    sistema: 'Asilo Cabeza de Algodón',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Sistema: Asilo Cabeza de Algodón`);
  console.log(`CORS permitido para: ${origenesPermitidos.join(', ')}`);
});

module.exports = app;
