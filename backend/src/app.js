const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Rate limiting solo en login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos. Intente en 15 minutos.' }
});

// Rutas
app.use('/api/auth', loginLimiter, require('./routes/auth.routes'));
app.use('/api/internos', require('./routes/internos.routes'));

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
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Sistema: Asilo Cabeza de Algodón`);
});

module.exports = app;