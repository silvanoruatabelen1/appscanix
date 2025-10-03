require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Importar rutas
const { router: authRoutes } = require('../routes/auth');
const userRoutes = require('../routes/users');
const productRoutes = require('../routes/products');
const depositRoutes = require('../routes/deposits');
const stockRoutes = require('../routes/stock');
const ticketRoutes = require('../routes/tickets');
const transferRoutes = require('../routes/transfers');
const recognitionRoutes = require('../routes/recognition');
const reportRoutes = require('../routes/reports');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de seguridad y logging
app.use(helmet());
app.use(morgan('dev'));

// CORS - Permitir frontend en puerto 5173
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080', 
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/recognition', recognitionRoutes);
app.use('/api/reports', reportRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SCANIX Backend funcionando',
    timestamp: new Date().toISOString() 
  });
});

// Debug endpoint para verificar DB
app.get('/api/debug/db', async (req, res) => {
  try {
    const { allQuery } = require('../src/database');
    const products = await allQuery('SELECT COUNT(*) as count FROM products');
    const deposits = await allQuery('SELECT COUNT(*) as count FROM deposits');
    
    res.json({
      products: products[0].count,
      deposits: deposits[0].count,
      message: 'Base de datos conectada correctamente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 SCANIX Backend corriendo en puerto ${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
