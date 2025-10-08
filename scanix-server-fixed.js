/**
 * SCANIX - Sistema de Gestión Inteligente
 * Backend Final CORREGIDO - Sin Errores
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

console.log('🚀 Iniciando SCANIX - Versión Corregida');

// Archivo de persistencia de usuarios
const USERS_FILE = path.join(__dirname, 'scanix-users.json');

// =================== MIDDLEWARES ===================
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:8080', 
    'http://localhost:8081', 
    'http://localhost:8082', 
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8082'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware para archivos (multer)
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// =================== DATOS DE DEMOSTRACIÓN ===================

// Usuario administrador
const adminUser = {
  id: 'admin-001',
  username: 'admin',
  email: 'admin@scanix.com',
  nombre: 'Administrador',
  apellido: 'Sistema',
  role: 'admin',
  isActive: true,
  depositosAsignados: [],
  fechaCreacion: new Date().toISOString(),
  ultimoAcceso: new Date().toISOString(),
  requiresPasswordChange: false
};

// Productos de bebidas argentinas (30 productos)
const mockProducts = [
  { productId: 'COCA-500', sku: 'COCA-500', nombre: 'Coca Cola 500ml', descripcion: 'Gaseosa Cola - Coca-Cola', precioBase: 650, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 650 }, { id: '2', minQty: 6, maxQty: 12, precio: 605 }, { id: '3', minQty: 13, maxQty: null, precio: 553 }] },
  { productId: 'COCA-1.5L', sku: 'COCA-1.5L', nombre: 'Coca Cola 1.5L', descripcion: 'Gaseosa Cola - Coca-Cola', precioBase: 1450, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 1450 }, { id: '2', minQty: 6, maxQty: 12, precio: 1349 }, { id: '3', minQty: 13, maxQty: null, precio: 1233 }] },
  { productId: 'COCA-ZERO-500', sku: 'COCA-ZERO-500', nombre: 'Coca Cola Zero 500ml', descripcion: 'Gaseosa Cola Light - Coca-Cola', precioBase: 650, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 650 }, { id: '2', minQty: 6, maxQty: 12, precio: 605 }, { id: '3', minQty: 13, maxQty: null, precio: 553 }] },
  { productId: 'SPRITE-500', sku: 'SPRITE-500', nombre: 'Sprite 500ml', descripcion: 'Gaseosa Lima-Limón - Coca-Cola', precioBase: 620, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 620 }, { id: '2', minQty: 6, maxQty: 12, precio: 577 }, { id: '3', minQty: 13, maxQty: null, precio: 527 }] },
  { productId: 'FANTA-500', sku: 'FANTA-500', nombre: 'Fanta Naranja 500ml', descripcion: 'Gaseosa Sabor Naranja - Coca-Cola', precioBase: 620, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 620 }, { id: '2', minQty: 6, maxQty: 12, precio: 577 }, { id: '3', minQty: 13, maxQty: null, precio: 527 }] },
  { productId: 'PEPSI-500', sku: 'PEPSI-500', nombre: 'Pepsi 500ml', descripcion: 'Gaseosa Cola - PepsiCo', precioBase: 600, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 600 }, { id: '2', minQty: 6, maxQty: 12, precio: 558 }, { id: '3', minQty: 13, maxQty: null, precio: 510 }] },
  { productId: 'PEPSI-1.5L', sku: 'PEPSI-1.5L', nombre: 'Pepsi 1.5L', descripcion: 'Gaseosa Cola - PepsiCo', precioBase: 1350, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 1350 }, { id: '2', minQty: 6, maxQty: 12, precio: 1256 }, { id: '3', minQty: 13, maxQty: null, precio: 1148 }] },
  { productId: '7UP-500', sku: '7UP-500', nombre: '7UP 500ml', descripcion: 'Gaseosa Lima-Limón - PepsiCo', precioBase: 600, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 600 }, { id: '2', minQty: 6, maxQty: 12, precio: 558 }, { id: '3', minQty: 13, maxQty: null, precio: 510 }] },
  { productId: 'MIRINDA-500', sku: 'MIRINDA-500', nombre: 'Mirinda Naranja 500ml', descripcion: 'Gaseosa Sabor Naranja - PepsiCo', precioBase: 600, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 600 }, { id: '2', minQty: 6, maxQty: 12, precio: 558 }, { id: '3', minQty: 13, maxQty: null, precio: 510 }] },
  { productId: 'AGUA-VILLA-500', sku: 'AGUA-VILLA-500', nombre: 'Agua Villa del Sur 500ml', descripcion: 'Agua Mineral - Danone', precioBase: 400, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 400 }, { id: '2', minQty: 6, maxQty: 12, precio: 372 }, { id: '3', minQty: 13, maxQty: null, precio: 340 }] },
  { productId: 'AGUA-VILLA-1.5L', sku: 'AGUA-VILLA-1.5L', nombre: 'Agua Villa del Sur 1.5L', descripcion: 'Agua Mineral - Danone', precioBase: 750, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 750 }, { id: '2', minQty: 6, maxQty: 12, precio: 698 }, { id: '3', minQty: 13, maxQty: null, precio: 638 }] },
  { productId: 'AGUA-VILLA-6L', sku: 'AGUA-VILLA-6L', nombre: 'Agua Villa del Sur 6L', descripcion: 'Agua Mineral - Danone', precioBase: 1800, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 1800 }, { id: '2', minQty: 6, maxQty: 12, precio: 1674 }, { id: '3', minQty: 13, maxQty: null, precio: 1530 }] },
  { productId: 'AGUA-ECO-500', sku: 'AGUA-ECO-500', nombre: 'Agua Eco de los Andes 500ml', descripcion: 'Agua Mineral - Eco de los Andes', precioBase: 380, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 380 }, { id: '2', minQty: 6, maxQty: 12, precio: 353 }, { id: '3', minQty: 13, maxQty: null, precio: 323 }] },
  { productId: 'VILLAVICENCIO-500', sku: 'VILLAVICENCIO-500', nombre: 'Villavicencio 500ml', descripcion: 'Agua Mineral - Danone', precioBase: 420, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 420 }, { id: '2', minQty: 6, maxQty: 12, precio: 391 }, { id: '3', minQty: 13, maxQty: null, precio: 357 }] },
  { productId: 'CUNITA-500', sku: 'CUNITA-500', nombre: 'Cunita 500ml', descripcion: 'Agua Saborizada - Danone', precioBase: 450, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 450 }, { id: '2', minQty: 6, maxQty: 12, precio: 419 }, { id: '3', minQty: 13, maxQty: null, precio: 383 }] },
  { productId: 'LEVITE-500', sku: 'LEVITE-500', nombre: 'Levité Pomelo 500ml', descripcion: 'Agua Saborizada - Coca-Cola', precioBase: 480, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 480 }, { id: '2', minQty: 6, maxQty: 12, precio: 446 }, { id: '3', minQty: 13, maxQty: null, precio: 408 }] },
  { productId: 'AQUARIUS-500', sku: 'AQUARIUS-500', nombre: 'Aquarius Pomelo 500ml', descripcion: 'Bebida Isotónica - Coca-Cola', precioBase: 550, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 550 }, { id: '2', minQty: 6, maxQty: 12, precio: 512 }, { id: '3', minQty: 13, maxQty: null, precio: 468 }] },
  { productId: 'GATORADE-500', sku: 'GATORADE-500', nombre: 'Gatorade Naranja 500ml', descripcion: 'Bebida Isotónica - PepsiCo', precioBase: 650, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 650 }, { id: '2', minQty: 6, maxQty: 12, precio: 605 }, { id: '3', minQty: 13, maxQty: null, precio: 553 }] },
  { productId: 'POWERADE-500', sku: 'POWERADE-500', nombre: 'Powerade Mountain Blast 500ml', descripcion: 'Bebida Isotónica - Coca-Cola', precioBase: 620, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 620 }, { id: '2', minQty: 6, maxQty: 12, precio: 577 }, { id: '3', minQty: 13, maxQty: null, precio: 527 }] },
  { productId: 'SPEED-250', sku: 'SPEED-250', nombre: 'Speed Energy Drink 250ml', descripcion: 'Energizante - Coca-Cola', precioBase: 800, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 800 }, { id: '2', minQty: 6, maxQty: 12, precio: 744 }, { id: '3', minQty: 13, maxQty: null, precio: 680 }] },
  { productId: 'REDBULL-250', sku: 'REDBULL-250', nombre: 'Red Bull 250ml', descripcion: 'Energizante - Red Bull', precioBase: 1200, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 1200 }, { id: '2', minQty: 6, maxQty: 12, precio: 1116 }, { id: '3', minQty: 13, maxQty: null, precio: 1020 }] },
  { productId: 'MONSTER-473', sku: 'MONSTER-473', nombre: 'Monster Energy 473ml', descripcion: 'Energizante - Monster', precioBase: 1350, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 1350 }, { id: '2', minQty: 6, maxQty: 12, precio: 1256 }, { id: '3', minQty: 13, maxQty: null, precio: 1148 }] },
  { productId: 'QUILMES-1L', sku: 'QUILMES-1L', nombre: 'Quilmes Cerveza 1L', descripcion: 'Cerveza - Quilmes', precioBase: 950, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 950 }, { id: '2', minQty: 6, maxQty: 12, precio: 884 }, { id: '3', minQty: 13, maxQty: null, precio: 808 }] },
  { productId: 'BRAHMA-1L', sku: 'BRAHMA-1L', nombre: 'Brahma Cerveza 1L', descripcion: 'Cerveza - Brahma', precioBase: 900, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 900 }, { id: '2', minQty: 6, maxQty: 12, precio: 837 }, { id: '3', minQty: 13, maxQty: null, precio: 765 }] },
  { productId: 'ANDES-1L', sku: 'ANDES-1L', nombre: 'Andes Cerveza 1L', descripcion: 'Cerveza - Andes', precioBase: 850, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 850 }, { id: '2', minQty: 6, maxQty: 12, precio: 791 }, { id: '3', minQty: 13, maxQty: null, precio: 723 }] },
  { productId: 'STELLA-473', sku: 'STELLA-473', nombre: 'Stella Artois 473ml', descripcion: 'Cerveza Premium - Stella Artois', precioBase: 1100, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 1100 }, { id: '2', minQty: 6, maxQty: 12, precio: 1023 }, { id: '3', minQty: 13, maxQty: null, precio: 935 }] },
  { productId: 'CORONA-355', sku: 'CORONA-355', nombre: 'Corona Extra 355ml', descripcion: 'Cerveza Premium - Corona', precioBase: 1300, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 1300 }, { id: '2', minQty: 6, maxQty: 12, precio: 1209 }, { id: '3', minQty: 13, maxQty: null, precio: 1105 }] },
  { productId: 'CEPITA-1L', sku: 'CEPITA-1L', nombre: 'Cepita Naranja 1L', descripcion: 'Jugo - Coca-Cola', precioBase: 850, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 850 }, { id: '2', minQty: 6, maxQty: 12, precio: 791 }, { id: '3', minQty: 13, maxQty: null, precio: 723 }] },
  { productId: 'BAGGIO-1L', sku: 'BAGGIO-1L', nombre: 'Baggio Multifruta 1L', descripcion: 'Jugo - Baggio', precioBase: 750, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 750 }, { id: '2', minQty: 6, maxQty: 12, precio: 698 }, { id: '3', minQty: 13, maxQty: null, precio: 638 }] },
  { productId: 'BC-1L', sku: 'BC-1L', nombre: 'BC Naranja 1L', descripcion: 'Jugo - BC', precioBase: 700, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 700 }, { id: '2', minQty: 6, maxQty: 12, precio: 651 }, { id: '3', minQty: 13, maxQty: null, precio: 595 }] }
];

// Depósitos
const mockDeposits = [
  { id: 'DEP001', nombre: 'Depósito Central', direccion: 'Av. Principal 123', isActive: true },
  { id: 'DEP002', nombre: 'Sucursal Norte', direccion: 'Calle Norte 456', isActive: true },
  { id: 'DEP003', nombre: 'Sucursal Sur', direccion: 'Calle Sur 789', isActive: true }
];

// Stock por depósito (inicializado con todos los productos)
const mockStockByDeposit = {};
// Inicializar stock para todos los depósitos con todos los productos
['DEP001', 'DEP002', 'DEP003'].forEach(depositId => {
  mockStockByDeposit[depositId] = {};
  mockProducts.forEach(product => {
    mockStockByDeposit[depositId][product.productId] = {
      cantidad: Math.floor(Math.random() * 50) + 20, // Stock aleatorio entre 20-70
      nombre: product.nombre,
      sku: product.sku,
      precioBase: product.precioBase
    };
  });
});

// Arrays dinámicos
let mockTickets = [];
let mockTransfers = [];
let mockStockMovements = [];

// =================== PERSISTENCIA DE USUARIOS ===================

// Cargar usuarios del archivo
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      const savedUsers = JSON.parse(data);
      console.log(`📂 Cargados ${savedUsers.length} usuarios del archivo`);
      return savedUsers;
    }
  } catch (error) {
    console.error('❌ Error cargando usuarios:', error.message);
  }
  console.log('📝 Iniciando con usuario admin por defecto');
  return [adminUser];
}

// Guardar usuarios en el archivo
function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(mockUsers, null, 2), 'utf8');
    console.log(`💾 Usuarios guardados: ${mockUsers.length}`);
  } catch (error) {
    console.error('❌ Error guardando usuarios:', error.message);
  }
}

// Inicializar usuarios
let mockUsers = loadUsers();

// =================== UTILIDADES ===================

const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const generateId = (prefix = 'ID') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// =================== RUTAS PRINCIPALES ===================

// Health check
app.get('/api/health', (req, res) => {
  console.log('📡 Health check');
  res.json({ 
    status: 'OK', 
    message: 'SCANIX Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0-fixed',
    port: PORT
  });
});

// Debug (solo desarrollo)
app.get('/api/debug/users', (req, res) => {
  console.log('🔍 Debug usuarios');
  res.json({
    totalUsers: mockUsers.length,
    users: mockUsers.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      requiresPasswordChange: u.requiresPasswordChange,
      temporaryPassword: u.temporaryPassword
    }))
  });
});

// =================== AUTENTICACIÓN ===================

app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login:', req.body?.username);
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  // Admin hardcodeado
  if (username === 'admin' && password === 'admin123') {
    console.log('✅ Login admin exitoso');
    return res.json({
      message: 'Login exitoso',
      user: adminUser,
      token: 'jwt-token-' + Date.now()
    });
  }

  // Usuarios creados
  const user = mockUsers.find(u => u.username === username && u.isActive);
  if (user) {
    // Verificar contraseña
    let isValidPassword = false;
    
    if (user.requiresPasswordChange) {
      // Si necesita cambiar contraseña, validar contra temporaryPassword
      isValidPassword = password === user.temporaryPassword;
      console.log('🔍 Validando contraseña temporal:', { 
        providedPassword: password, 
        temporaryPassword: user.temporaryPassword,
        match: isValidPassword 
      });
    } else if (user.password) {
      // Si ya cambió la contraseña, validar contra password guardado
      isValidPassword = password === user.password;
      console.log('🔍 Validando contraseña guardada:', { 
        hasPassword: !!user.password,
        match: isValidPassword 
      });
    } else {
      // Si no tiene contraseña guardada ni requiresPasswordChange, algo está mal
      console.log('⚠️ Usuario sin contraseña configurada');
      isValidPassword = false;
    }

    if (isValidPassword) {
      console.log('✅ Login exitoso:', username);
      user.ultimoAcceso = new Date().toISOString();
      saveUsers(); // Guardar último acceso
      
      return res.json({
        message: 'Login exitoso',
        user: user,
        token: 'jwt-token-' + Date.now()
      });
    }
    
    console.log('❌ Contraseña incorrecta para:', username);
  } else {
    console.log('❌ Usuario no encontrado:', username);
  }

  res.status(401).json({ error: 'Credenciales incorrectas' });
});

app.post('/api/auth/register', (req, res) => {
  console.log('📝 Registro:', req.body?.username);
  const { username, email, nombre, apellido, password, role } = req.body;

  if (!username || !email || !nombre || !apellido) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  // Validar rol (solo roles válidos del sistema)
  const VALID_ROLES = ['admin', 'operador', 'cajero'];
  const userRole = role || 'operador';
  
  if (!VALID_ROLES.includes(userRole)) {
    console.log('❌ Rol inválido:', userRole);
    return res.status(400).json({ 
      error: `Rol inválido. Roles válidos: ${VALID_ROLES.join(', ')}` 
    });
  }

  // Verificar si existe
  const existingUser = mockUsers.find(u => u.username === username || u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'El usuario o email ya existe' });
  }

  // Generar contraseña temporal
  const tempPassword = password || generateTemporaryPassword();
  
  const newUser = {
    id: generateId('USER'),
    username,
    email,
    nombre,
    apellido,
    role: userRole,
    isActive: true,
    depositosAsignados: [],
    fechaCreacion: new Date().toISOString(),
    ultimoAcceso: null,
    requiresPasswordChange: true,
    temporaryPassword: tempPassword
  };

  mockUsers.push(newUser);
  saveUsers(); // Guardar en archivo

  console.log('✅ Usuario creado:', username, '| Rol:', userRole);
  console.log('🔑 Contraseña temporal:', tempPassword);

  res.status(201).json({
    message: 'Usuario registrado exitosamente',
    user: newUser,
    temporaryPassword: tempPassword
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: adminUser });
});

app.post('/api/auth/change-password', (req, res) => {
  console.log('🔐 Cambio de contraseña:', req.body?.username);
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  const user = mockUsers.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // Validar contraseña actual
  const isCurrentPasswordValid = user.requiresPasswordChange 
    ? currentPassword === user.temporaryPassword
    : currentPassword === user.password;

  if (!isCurrentPasswordValid) {
    console.log('❌ Contraseña actual incorrecta');
    return res.status(400).json({ error: 'Contraseña actual incorrecta' });
  }

  // Validar que la nueva contraseña sea diferente
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual' });
  }

  // Guardar la nueva contraseña
  user.password = newPassword;
  user.requiresPasswordChange = false;
  user.temporaryPassword = null;
  user.ultimoAcceso = new Date().toISOString();
  
  saveUsers(); // Guardar en archivo
  
  console.log('✅ Contraseña cambiada para:', username);
  console.log('🔒 Nueva contraseña guardada');
  
  res.json({ 
    message: 'Contraseña cambiada exitosamente',
    user: user
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Sesión cerrada exitosamente' });
});

// =================== USUARIOS ===================

app.get('/api/users', (req, res) => {
  console.log('👥 Obteniendo usuarios');
  res.json(mockUsers);
});

// =================== PRODUCTOS ===================

app.get('/api/products', (req, res) => {
  console.log('📦 Obteniendo productos');
  res.json(mockProducts);
});

app.post('/api/products', (req, res) => {
  console.log('📦 Creando producto:', req.body);
  const { sku, nombre, descripcion, precioBase, tiers } = req.body;
  
  const newProduct = {
    productId: generateId('P'),
    sku,
    nombre,
    descripcion: descripcion || '',
    precioBase,
    tiers: tiers || []
  };
  
  mockProducts.push(newProduct);
  
  // Inicializar stock en todos los depósitos
  Object.keys(mockStockByDeposit).forEach(depositId => {
    mockStockByDeposit[depositId][newProduct.productId] = {
      cantidad: 0,
      nombre: newProduct.nombre,
      sku: newProduct.sku,
      precioBase: newProduct.precioBase
    };
  });
  
  res.status(201).json({
    message: 'Producto creado exitosamente',
    product: newProduct
  });
});

app.get('/api/products/:id', (req, res) => {
  console.log('📦 Obteniendo producto:', req.params.id);
  const product = mockProducts.find(p => p.productId === req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

app.put('/api/products/:id/tiers', (req, res) => {
  console.log('📦 Actualizando tiers del producto:', req.params.id);
  const { tiers } = req.body;
  const product = mockProducts.find(p => p.productId === req.params.id);
  
  if (product) {
    product.tiers = tiers;
    res.json({ 
      message: 'Tiers actualizados exitosamente',
      product: product
    });
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

// =================== DEPÓSITOS ===================

app.get('/api/deposits', (req, res) => {
  console.log('🏪 Obteniendo depósitos');
  res.json(mockDeposits);
});

app.post('/api/deposits', (req, res) => {
  console.log('🏪 Creando depósito:', req.body);
  const { nombre, direccion } = req.body;
  
  const newDeposit = {
    id: generateId('DEP'),
    nombre,
    direccion: direccion || '',
    isActive: true
  };
  
  mockDeposits.push(newDeposit);
  
  // Inicializar stock para el nuevo depósito
  mockStockByDeposit[newDeposit.id] = {};
  mockProducts.forEach(product => {
    mockStockByDeposit[newDeposit.id][product.productId] = {
      cantidad: 0,
      nombre: product.nombre,
      sku: product.sku,
      precioBase: product.precioBase
    };
  });
  
  res.status(201).json({
    message: 'Depósito creado exitosamente',
    deposit: newDeposit
  });
});

// =================== STOCK ===================

app.get('/api/stock/:depositId', (req, res) => {
  console.log('📊 Obteniendo stock para:', req.params.depositId);
  const { depositId } = req.params;
  
  const depositStock = mockStockByDeposit[depositId] || {};
  
  const stockArray = Object.entries(depositStock).map(([productId, data]) => ({
    productId,
    depositoId: depositId,
    sku: data.sku,
    nombre: data.nombre,
    cantidad: data.cantidad,
    precioBase: data.precioBase
  }));
  
  res.json(stockArray);
});

app.post('/api/stock/adjust', (req, res) => {
  console.log('📊 Ajustando stock:', req.body);
  const { depositoId, productId, cantidad, tipo } = req.body;
  
  if (!mockStockByDeposit[depositoId]) {
    mockStockByDeposit[depositoId] = {};
  }
  
  const product = mockProducts.find(p => p.productId === productId);
  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  
  if (!mockStockByDeposit[depositoId][productId]) {
    mockStockByDeposit[depositoId][productId] = {
      cantidad: 0,
      nombre: product.nombre,
      sku: product.sku,
      precioBase: product.precioBase
    };
  }
  
  if (tipo === 'entrada') {
    mockStockByDeposit[depositoId][productId].cantidad += cantidad;
  } else if (tipo === 'ajuste') {
    mockStockByDeposit[depositoId][productId].cantidad = cantidad;
  }
  
  // Registrar movimiento
  mockStockMovements.push({
    id: generateId('MOV'),
    depositoId,
    productId,
    producto: product.nombre,
    tipo,
    delta: tipo === 'entrada' ? cantidad : cantidad - mockStockByDeposit[depositoId][productId].cantidad,
    fechaISO: new Date().toISOString(),
    motivo: `Ajuste de stock - ${tipo}`
  });
  
  res.json({ message: 'Stock ajustado exitosamente' });
});

// =================== TICKETS ===================

app.post('/api/tickets', (req, res) => {
  console.log('🧾 Creando ticket:', req.body);
  const { items, depositoId } = req.body;
  
  // Validar depositoId
  if (!depositoId) {
    return res.status(400).json({ error: 'depositoId es requerido' });
  }
  
  if (!mockStockByDeposit[depositoId]) {
    return res.status(404).json({ error: 'Depósito no encontrado' });
  }
  
  // Validar stock disponible
  for (const item of items) {
    const stockItem = mockStockByDeposit[depositoId][item.productId];
    if (!stockItem || stockItem.cantidad < item.qty) {
      return res.status(400).json({ 
        error: `Stock insuficiente para ${item.nombre}. Disponible: ${stockItem?.cantidad || 0}, Solicitado: ${item.qty}` 
      });
    }
  }
  
  // Calcular total
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  
  const newTicket = {
    id: generateId('TKT'),
    fechaISO: new Date().toISOString(),
    total,
    depositoId,
    items
  };
  
  // Descontar stock
  items.forEach(item => {
    mockStockByDeposit[depositoId][item.productId].cantidad -= item.qty;
    
    // Registrar movimiento
    mockStockMovements.push({
      id: generateId('MOV'),
      depositoId,
      productId: item.productId,
      producto: item.nombre,
      tipo: 'venta',
      delta: -item.qty,
      fechaISO: newTicket.fechaISO,
      motivo: `Venta - Ticket ${newTicket.id}`,
      referencia: newTicket.id
    });
  });
  
  mockTickets.push(newTicket);
  
  res.status(201).json({
    message: 'Ticket creado exitosamente',
    ticket: newTicket
  });
});

app.get('/api/tickets', (req, res) => {
  console.log('🧾 Obteniendo tickets');
  res.json(mockTickets);
});

app.get('/api/tickets/:id', (req, res) => {
  console.log('🧾 Obteniendo ticket:', req.params.id);
  const ticket = mockTickets.find(t => t.id === req.params.id);
  if (ticket) {
    res.json(ticket);
  } else {
    res.status(404).json({ error: 'Ticket no encontrado' });
  }
});

// =================== TRANSFERENCIAS ===================

app.post('/api/transfers', (req, res) => {
  console.log('🔄 Creando transferencia:', req.body);
  const { depositoOrigenId, depositoDestinoId, items } = req.body;
  
  // Validar depósitos
  if (!mockStockByDeposit[depositoOrigenId]) {
    return res.status(404).json({ error: 'Depósito origen no encontrado' });
  }
  
  if (!mockStockByDeposit[depositoDestinoId]) {
    return res.status(404).json({ error: 'Depósito destino no encontrado' });
  }
  
  // Validar stock en origen
  for (const item of items) {
    const stockItem = mockStockByDeposit[depositoOrigenId][item.productId];
    if (!stockItem || stockItem.cantidad < item.cantidad) {
      return res.status(400).json({ 
        error: `Stock insuficiente en origen para ${item.nombre}. Disponible: ${stockItem?.cantidad || 0}, Solicitado: ${item.cantidad}` 
      });
    }
  }
  
  const newTransfer = {
    id: generateId('TRF'),
    fechaISO: new Date().toISOString(),
    depositoOrigenId,
    depositoDestinoId,
    estado: 'completado',
    items
  };
  
  // Actualizar stocks
  items.forEach(item => {
    // Descontar del origen
    mockStockByDeposit[depositoOrigenId][item.productId].cantidad -= item.cantidad;
    
    // Agregar al destino
    if (!mockStockByDeposit[depositoDestinoId][item.productId]) {
      const product = mockProducts.find(p => p.productId === item.productId);
      mockStockByDeposit[depositoDestinoId][item.productId] = {
        cantidad: 0,
        nombre: product.nombre,
        sku: product.sku,
        precioBase: product.precioBase
      };
    }
    mockStockByDeposit[depositoDestinoId][item.productId].cantidad += item.cantidad;
    
    // Registrar movimientos
    mockStockMovements.push({
      id: generateId('MOV'),
      depositoId: depositoOrigenId,
      productId: item.productId,
      producto: item.nombre,
      tipo: 'transferencia',
      delta: -item.cantidad,
      fechaISO: newTransfer.fechaISO,
      motivo: `Transferencia ${newTransfer.id} - Salida`,
      referencia: newTransfer.id
    });
    
    mockStockMovements.push({
      id: generateId('MOV'),
      depositoId: depositoDestinoId,
      productId: item.productId,
      producto: item.nombre,
      tipo: 'transferencia',
      delta: item.cantidad,
      fechaISO: newTransfer.fechaISO,
      motivo: `Transferencia ${newTransfer.id} - Entrada`,
      referencia: newTransfer.id
    });
  });
  
  mockTransfers.push(newTransfer);
  
  console.log('✅ Transferencia creada:', newTransfer.id);
  res.status(201).json({
    message: 'Transferencia creada exitosamente',
    transfer: newTransfer
  });
});

app.get('/api/transfers', (req, res) => {
  console.log('🔄 Obteniendo transferencias');
  res.json(mockTransfers);
});

app.get('/api/transfers/:id', (req, res) => {
  console.log('🔄 Obteniendo transferencia:', req.params.id);
  const transfer = mockTransfers.find(t => t.id === req.params.id);
  if (transfer) {
    res.json(transfer);
  } else {
    res.status(404).json({ error: 'Transferencia no encontrada' });
  }
});

// =================== REPORTES ===================

app.get('/api/reports/kpis', (req, res) => {
  console.log('📈 Obteniendo KPIs');
  
  // Calcular stock total
  let valorTotalInventario = 0;
  let productosConStockBajo = 0;
  
  Object.values(mockStockByDeposit).forEach(depositStock => {
    Object.entries(depositStock).forEach(([productId, data]) => {
      valorTotalInventario += data.cantidad * data.precioBase;
      if (data.cantidad < 10) productosConStockBajo++;
    });
  });
  
  const totalVentas = mockTickets.reduce((sum, t) => sum + t.total, 0);
  
  res.json({
    productos: { 
      total: mockProducts.length, 
      stockBajo: productosConStockBajo 
    },
    depositos: { 
      total: mockDeposits.length 
    },
    ventasDelMes: { 
      total: totalVentas, 
      cantidad: mockTickets.length 
    },
    transferenciasDelMes: { 
      cantidad: mockTransfers.length 
    },
    inventario: { 
      valorTotal: Math.round(valorTotalInventario * 100) / 100
    }
  });
});

app.get('/api/reports/sales', (req, res) => {
  console.log('📈 Obteniendo reporte de ventas');
  const totalVentas = mockTickets.reduce((sum, ticket) => sum + ticket.total, 0);
  
  // Top productos
  const productSales = new Map();
  mockTickets.forEach(ticket => {
    ticket.items?.forEach(item => {
      if (!productSales.has(item.productId)) {
        productSales.set(item.productId, { productId: item.productId, nombre: item.nombre, cantidad: 0 });
      }
      productSales.get(item.productId).cantidad += item.qty;
    });
  });
  
  const topProductos = Array.from(productSales.values())
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 3);

  res.json({
    tickets: mockTickets,
    kpis: {
      totalVentas,
      cantidadTickets: mockTickets.length,
      promedioTicket: mockTickets.length > 0 ? Math.round((totalVentas / mockTickets.length) * 100) / 100 : 0
    },
    topProductos
  });
});

app.get('/api/reports/stock', (req, res) => {
  console.log('📈 Obteniendo reporte de stock');
  
  // Consolidar stock por depósito
  const stockPorDeposito = [];
  
  Object.entries(mockStockByDeposit).forEach(([depositId, depositStock]) => {
    const deposit = mockDeposits.find(d => d.id === depositId);
    
    Object.entries(depositStock).forEach(([productId, data]) => {
      stockPorDeposito.push({
        productId,
        depositoId: depositId,
        producto: data.nombre,
        deposito: deposit?.nombre || depositId,
        cantidad: data.cantidad
      });
    });
  });
  
  res.json({
    movimientos: mockStockMovements,
    stockPorDeposito
  });
});


// =================== INICIO DEL SERVIDOR ===================

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎉 SCANIX - Sistema de Gestión Inteligente [CORREGIDO]');
  console.log('📍 Puerto:', PORT);
  console.log('🌐 Health: http://localhost:' + PORT + '/api/health');
  console.log('🔐 Admin: admin / admin123');
  console.log('');
  console.log('📋 Endpoints Disponibles:');
  console.log('  🔐 Autenticación: /api/auth/*');
  console.log('  👥 Usuarios: /api/users');
  console.log('  📦 Productos: /api/products');
  console.log('  🏪 Depósitos: /api/deposits');
  console.log('  📊 Stock: /api/stock/:depositId');
  console.log('  🧾 Tickets: /api/tickets');
  console.log('  🔄 Transferencias: /api/transfers');
  console.log('  📈 Reportes: /api/reports/*');
  console.log('');
  console.log('✅ Todas las funcionalidades corregidas:');
  console.log('  ✓ Transferencias con actualización de stock');
  console.log('  ✓ Tickets con validación de stock');
  console.log('  ✓ Nombres de campos estandarizados (depositoId)');
  console.log('  ✓ Movimientos de stock registrados');
  console.log('  ✓ Reportes con datos reales');
  console.log('');
  console.log('🟢 Sistema listo para demostración');
  console.log('');
});

app.post('/api/recognition/recognize', upload.single('image'), async (req, res) => {
  try {
    console.log('🤖 Procesando reconocimiento YOLO...');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó imagen'
      });
    }
    
    const axios = require('axios');
    const FormData = require('form-data');
    
    // Crear FormData para enviar al servicio de IA
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Enviar al servicio de IA
    const aiResponse = await axios.post('http://localhost:5000/recognize', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });
    
    console.log('✅ Respuesta del AI service:', aiResponse.data);
    
    // Transformar respuesta al formato esperado por el frontend
    const transformedResponse = {
      success: aiResponse.data.success,
      items: aiResponse.data.items?.map(item => ({
        productId: item.sku,
        sku: item.sku,
        nombre: item.nombre,
        qty: item.cantidad || 1,
        confianza: item.confidence,
        precio: item.precio
      })) || [],
      metadata: {
        detections: aiResponse.data.detections || 0,
        recognized: aiResponse.data.recognized || 0,
        ai_service: 'YOLO',
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(transformedResponse);
    
  } catch (error) {
    console.error('❌ Error en reconocimiento:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Servicio de IA no disponible',
        message: 'El servicio de reconocimiento no está funcionando. Verifica que el AI service esté ejecutándose.'
      });
    }
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        error: 'Timeout en reconocimiento',
        message: 'El procesamiento de la imagen tardó demasiado. Intenta con una imagen más pequeña.'
      });
    }
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data.error || 'Error en servicio de IA',
        message: error.response.data.message || 'Error procesando imagen'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error procesando la imagen'
    });
  }
});

// Obtener clases del modelo YOLO
app.get('/api/recognition/classes', async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.get('http://localhost:5000/classes', {
      timeout: 5000
    });
    
    res.json({
      success: true,
      classes: response.data.classes,
      num_classes: response.data.num_classes
    });
  } catch (error) {
    console.error('❌ Error obteniendo clases:', error.message);
    res.status(503).json({
      success: false,
      error: 'No se pudieron obtener las clases del modelo'
    });
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando SCANIX...');
  process.exit(0);
});

module.exports = app;
