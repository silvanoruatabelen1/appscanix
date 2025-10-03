console.log('🚀 Iniciando SCANIX Backend Completo...');

// Importaciones
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { allQuery, getQuery, runQuery } = require('./src/database');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'scanix_jwt_secret_2025';

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

console.log('✅ Middlewares configurados');

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getQuery('SELECT * FROM users WHERE id = ? AND is_active = 1', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no válido' });
    }

    req.user = {
      ...user,
      depositosAsignados: user.depositos_asignados ? JSON.parse(user.depositos_asignados) : []
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// =================== RUTAS DE AUTENTICACIÓN ===================

// Health Check
app.get('/api/health', (req, res) => {
  console.log('📡 Health check solicitado');
  res.json({ 
    status: 'OK', 
    message: 'SCANIX Backend funcionando',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Intento de login:', req.body?.username);
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const user = await getQuery(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1',
      [username, username]
    );

    if (!user) {
      console.log('❌ Usuario no encontrado:', username);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta para:', username);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8h' });
    await runQuery('UPDATE users SET last_access = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    console.log('✅ Login exitoso para:', username);

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      role: user.role,
      isActive: !!user.is_active,
      depositosAsignados: user.depositos_asignados ? JSON.parse(user.depositos_asignados) : [],
      fechaCreacion: user.created_at,
      ultimoAcceso: new Date().toISOString()
    };

    res.json({
      message: 'Inicio de sesión exitoso',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const userResponse = {
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    nombre: req.user.nombre,
    apellido: req.user.apellido,
    role: req.user.role,
    isActive: !!req.user.is_active,
    depositosAsignados: req.user.depositosAsignados,
    fechaCreacion: req.user.created_at,
    ultimoAcceso: req.user.last_access
  };

  res.json({ user: userResponse });
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Sesión cerrada exitosamente' });
});

// =================== RUTAS DE PRODUCTOS ===================

// Obtener productos
app.get('/api/products', async (req, res) => {
  try {
    const products = await allQuery('SELECT * FROM products ORDER BY nombre');

    const formattedProducts = products.map(product => ({
      productId: product.id,
      sku: product.sku,
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      precioBase: product.precio_base,
      tiers: []
    }));

    res.json(formattedProducts);
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ error: 'Error obteniendo productos' });
  }
});

// Crear producto
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear productos' });
    }

    const { sku, nombre, descripcion, precioBase, tiers } = req.body;
    const productId = uuidv4();

    await runQuery(`
      INSERT INTO products (id, sku, nombre, descripcion, precio_base)
      VALUES (?, ?, ?, ?, ?)
    `, [productId, sku, nombre, descripcion || '', precioBase]);

    res.status(201).json({
      message: 'Producto creado exitosamente',
      product: { productId, sku, nombre, descripcion, precioBase, tiers: [] }
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ error: 'Error creando producto' });
  }
});

// =================== RUTAS DE DEPÓSITOS ===================

// Obtener depósitos
app.get('/api/deposits', async (req, res) => {
  try {
    const deposits = await allQuery('SELECT * FROM deposits WHERE is_active = 1 ORDER BY nombre');
    
    const formattedDeposits = deposits.map(deposit => ({
      id: deposit.id,
      nombre: deposit.nombre,
      direccion: deposit.direccion || '',
      isActive: !!deposit.is_active
    }));

    res.json(formattedDeposits);
  } catch (error) {
    console.error('Error obteniendo depósitos:', error);
    res.status(500).json({ error: 'Error obteniendo depósitos' });
  }
});

// Crear depósito
app.post('/api/deposits', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'operador'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sin permisos para crear depósitos' });
    }

    const { nombre, direccion } = req.body;
    const depositId = uuidv4();

    await runQuery(`
      INSERT INTO deposits (id, nombre, direccion, is_active)
      VALUES (?, ?, ?, 1)
    `, [depositId, nombre, direccion || '']);

    res.status(201).json({
      message: 'Depósito creado exitosamente',
      deposit: { id: depositId, nombre, direccion: direccion || '', isActive: true }
    });
  } catch (error) {
    console.error('Error creando depósito:', error);
    res.status(500).json({ error: 'Error creando depósito' });
  }
});

// =================== RUTAS DE STOCK ===================

// Obtener stock de un depósito
app.get('/api/stock/:depositId', async (req, res) => {
  try {
    const { depositId } = req.params;

    const stockEntries = await allQuery(`
      SELECT s.*, p.sku, p.nombre, p.precio_base
      FROM stock s
      JOIN products p ON s.product_id = p.id
      WHERE s.deposit_id = ?
      ORDER BY p.nombre
    `, [depositId]);

    const formattedStock = stockEntries.map(entry => ({
      productId: entry.product_id,
      sku: entry.sku,
      nombre: entry.nombre,
      cantidad: entry.cantidad,
      precioBase: entry.precio_base
    }));

    res.json(formattedStock);
  } catch (error) {
    console.error('Error obteniendo stock:', error);
    res.status(500).json({ error: 'Error obteniendo stock' });
  }
});

// =================== RUTAS DE TICKETS ===================

// Crear ticket
app.post('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { items, depositoId, total } = req.body;
    const ticketId = `TKT-${Date.now()}`;

    await runQuery(`
      INSERT INTO tickets (id, fecha_iso, total, deposit_id, user_id)
      VALUES (?, ?, ?, ?, ?)
    `, [ticketId, new Date().toISOString(), total, depositoId, req.user.id]);

    for (const item of items) {
      await runQuery(`
        INSERT INTO ticket_lines (ticket_id, product_id, sku, nombre, cantidad, precio_aplicado, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [ticketId, item.productId, item.sku, item.nombre, item.qty, item.precioAplicado, item.subtotal]);
    }

    res.status(201).json({
      message: 'Ticket creado exitosamente',
      ticket: {
        id: ticketId,
        fechaISO: new Date().toISOString(),
        total,
        depositoId,
        items
      }
    });
  } catch (error) {
    console.error('Error creando ticket:', error);
    res.status(500).json({ error: 'Error creando ticket' });
  }
});

// Obtener tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await allQuery(`
      SELECT t.*, tl.product_id, tl.sku, tl.nombre, tl.cantidad, tl.precio_aplicado, tl.subtotal
      FROM tickets t
      LEFT JOIN ticket_lines tl ON t.id = tl.ticket_id
      ORDER BY t.fecha_iso DESC
    `);

    const ticketMap = new Map();
    tickets.forEach(row => {
      if (!ticketMap.has(row.id)) {
        ticketMap.set(row.id, {
          id: row.id,
          fechaISO: row.fecha_iso,
          total: row.total,
          depositoId: row.deposit_id,
          items: []
        });
      }
      
      if (row.product_id) {
        ticketMap.get(row.id).items.push({
          productId: row.product_id,
          sku: row.sku,
          nombre: row.nombre,
          qty: row.cantidad,
          precioAplicado: row.precio_aplicado,
          subtotal: row.subtotal
        });
      }
    });

    res.json(Array.from(ticketMap.values()));
  } catch (error) {
    console.error('Error obteniendo tickets:', error);
    res.status(500).json({ error: 'Error obteniendo tickets' });
  }
});

// =================== RUTAS DE TRANSFERENCIAS ===================

// Crear transferencia
app.post('/api/transfers', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'operador'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sin permisos para crear transferencias' });
    }

    const { depositoOrigenId, depositoDestinoId, items } = req.body;
    const transferId = `TRF-${Date.now()}`;

    await runQuery(`
      INSERT INTO transfers (id, fecha_iso, origen_id, destino_id, estado, user_id)
      VALUES (?, ?, ?, ?, 'completado', ?)
    `, [transferId, new Date().toISOString(), depositoOrigenId, depositoDestinoId, req.user.id]);

    for (const item of items) {
      await runQuery(`
        INSERT INTO transfer_lines (transfer_id, product_id, sku, nombre, cantidad)
        VALUES (?, ?, ?, ?, ?)
      `, [transferId, item.productId, item.sku, item.nombre, item.cantidad]);
    }

    res.status(201).json({
      message: 'Transferencia creada exitosamente',
      transfer: {
        id: transferId,
        fechaISO: new Date().toISOString(),
        depositoOrigenId,
        depositoDestinoId,
        estado: 'completado',
        items
      }
    });
  } catch (error) {
    console.error('Error creando transferencia:', error);
    res.status(500).json({ error: 'Error creando transferencia' });
  }
});

// Obtener transferencias
app.get('/api/transfers', async (req, res) => {
  try {
    const transfers = await allQuery(`
      SELECT t.*, tl.product_id, tl.sku, tl.nombre, tl.cantidad
      FROM transfers t
      LEFT JOIN transfer_lines tl ON t.id = tl.transfer_id
      ORDER BY t.fecha_iso DESC
    `);

    const transferMap = new Map();
    transfers.forEach(row => {
      if (!transferMap.has(row.id)) {
        transferMap.set(row.id, {
          id: row.id,
          fechaISO: row.fecha_iso,
          depositoOrigenId: row.origen_id,
          depositoDestinoId: row.destino_id,
          estado: row.estado,
          items: []
        });
      }
      
      if (row.product_id) {
        transferMap.get(row.id).items.push({
          productId: row.product_id,
          sku: row.sku,
          nombre: row.nombre,
          cantidad: row.cantidad
        });
      }
    });

    res.json(Array.from(transferMap.values()));
  } catch (error) {
    console.error('Error obteniendo transferencias:', error);
    res.status(500).json({ error: 'Error obteniendo transferencias' });
  }
});

// =================== RUTAS DE REPORTES ===================

// KPIs del sistema
app.get('/api/reports/kpis', async (req, res) => {
  try {
    const [products] = await allQuery('SELECT COUNT(*) as count FROM products');
    const [deposits] = await allQuery('SELECT COUNT(*) as count FROM deposits WHERE is_active = 1');
    const [salesThisMonth] = await allQuery(`
      SELECT COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total 
      FROM tickets 
      WHERE fecha_iso >= date('now', 'start of month')
    `);

    res.json({
      productos: { total: products.count, stockBajo: 0 },
      depositos: { total: deposits.count },
      ventasDelMes: { total: salesThisMonth.total, cantidad: salesThisMonth.cantidad },
      transferenciasDelMes: { cantidad: 0 },
      inventario: { valorTotal: 0 }
    });
  } catch (error) {
    console.error('Error obteniendo KPIs:', error);
    res.status(500).json({ error: 'Error obteniendo KPIs' });
  }
});

// Reporte de ventas
app.get('/api/reports/sales', async (req, res) => {
  try {
    const { startDate, endDate, depositId } = req.query;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (startDate) {
      whereClause += ' AND date(t.fecha_iso) >= date(?)';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND date(t.fecha_iso) <= date(?)';
      params.push(endDate);
    }
    if (depositId) {
      whereClause += ' AND t.deposit_id = ?';
      params.push(depositId);
    }

    const tickets = await allQuery(`
      SELECT t.*, tl.product_id, tl.sku, tl.nombre, tl.cantidad, tl.precio_aplicado, tl.subtotal
      FROM tickets t
      LEFT JOIN ticket_lines tl ON t.id = tl.ticket_id
      ${whereClause}
      ORDER BY t.fecha_iso DESC
    `, params);

    const ticketMap = new Map();
    const productSales = new Map();
    let totalVentas = 0;

    tickets.forEach(row => {
      if (!ticketMap.has(row.id)) {
        ticketMap.set(row.id, {
          id: row.id,
          fechaISO: row.fecha_iso,
          total: row.total,
          depositoId: row.deposit_id,
          items: []
        });
        totalVentas += row.total;
      }
      
      if (row.product_id) {
        ticketMap.get(row.id).items.push({
          productId: row.product_id,
          sku: row.sku,
          nombre: row.nombre,
          qty: row.cantidad,
          precioAplicado: row.precio_aplicado,
          subtotal: row.subtotal
        });

        const key = row.product_id;
        if (!productSales.has(key)) {
          productSales.set(key, { productId: row.product_id, nombre: row.nombre, cantidad: 0 });
        }
        productSales.get(key).cantidad += row.cantidad;
      }
    });

    const topProductos = Array.from(productSales.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3);

    res.json({
      tickets: Array.from(ticketMap.values()),
      kpis: {
        totalVentas,
        cantidadTickets: ticketMap.size
      },
      topProductos
    });
  } catch (error) {
    console.error('Error en reporte de ventas:', error);
    res.status(500).json({ error: 'Error generando reporte de ventas' });
  }
});

// Reporte de stock
app.get('/api/reports/stock', async (req, res) => {
  try {
    res.json({
      movimientos: [],
      stockPorDeposito: []
    });
  } catch (error) {
    console.error('Error en reporte de stock:', error);
    res.status(500).json({ error: 'Error generando reporte de stock' });
  }
});

// =================== RUTAS DE USUARIOS ===================

// Obtener usuarios
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden ver usuarios' });
    }

    const users = await allQuery('SELECT * FROM users ORDER BY nombre, apellido');
    
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      role: user.role,
      isActive: !!user.is_active,
      depositosAsignados: user.depositos_asignados ? JSON.parse(user.depositos_asignados) : [],
      fechaCreacion: user.created_at,
      ultimoAcceso: user.last_access
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

// Crear usuario
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear usuarios' });
    }

    const { username, email, password, nombre, apellido, role, depositosAsignados } = req.body;
    
    if (!username || !email || !password || !nombre || !apellido || !role) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (!['admin', 'operador', 'cajero'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const existing = await getQuery('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing) {
      return res.status(400).json({ error: 'Usuario o email ya existen' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    await runQuery(`
      INSERT INTO users (id, username, email, password_hash, nombre, apellido, role, depositos_asignados, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [userId, username, email, passwordHash, nombre, apellido, role, depositosAsignados ? JSON.stringify(depositosAsignados) : null]);

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: userId,
        username,
        email,
        nombre,
        apellido,
        role,
        isActive: true,
        depositosAsignados: depositosAsignados || []
      }
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error creando usuario' });
  }
});

// =================== MANEJO DE ERRORES ===================

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ Ruta no encontrada:', req.method, req.originalUrl);
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    method: req.method,
    url: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error en servidor:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// =================== INICIAR SERVIDOR ===================

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎉 ¡SCANIX Backend Completo funcionando!');
  console.log('📍 Puerto:', PORT);
  console.log('🌐 Health: http://localhost:' + PORT + '/api/health');
  console.log('🔐 Login: POST http://localhost:' + PORT + '/api/auth/login');
  console.log('👤 Usuario: admin / admin123');
  console.log('');
  console.log('📋 Endpoints disponibles:');
  console.log('  🔐 Auth: /api/auth/*');
  console.log('  📦 Products: /api/products');
  console.log('  🏪 Deposits: /api/deposits');
  console.log('  📊 Stock: /api/stock/:depositId');
  console.log('  🧾 Tickets: /api/tickets');
  console.log('  🔄 Transfers: /api/transfers');
  console.log('  📈 Reports: /api/reports/*');
  console.log('  👥 Users: /api/users');
  console.log('');
});

module.exports = app;
