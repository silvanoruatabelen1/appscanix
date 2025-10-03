const { runQuery } = require('./database');

async function initDatabase() {
  console.log('🏗️  Inicializando base de datos...');

  try {
    // Tabla de productos
    await runQuery(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio_base REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de tiers de precios
    await runQuery(`
      CREATE TABLE IF NOT EXISTS price_tiers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        min_qty INTEGER NOT NULL,
        max_qty INTEGER,
        precio REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      )
    `);

    // Tabla de depósitos
    await runQuery(`
      CREATE TABLE IF NOT EXISTS deposits (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        direccion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de stock por depósito
    await runQuery(`
      CREATE TABLE IF NOT EXISTS stock (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        deposit_id TEXT NOT NULL,
        cantidad INTEGER NOT NULL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, deposit_id),
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        FOREIGN KEY (deposit_id) REFERENCES deposits (id) ON DELETE CASCADE
      )
    `);

    // Tabla de tickets
    await runQuery(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        fecha_iso TEXT NOT NULL,
        deposit_id TEXT NOT NULL,
        total REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deposit_id) REFERENCES deposits (id)
      )
    `);

    // Tabla de líneas de ticket
    await runQuery(`
      CREATE TABLE IF NOT EXISTS ticket_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        nombre TEXT NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_aplicado REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);

    // Tabla de transferencias
    await runQuery(`
      CREATE TABLE IF NOT EXISTS transfers (
        id TEXT PRIMARY KEY,
        numero_remito TEXT UNIQUE NOT NULL,
        fecha_iso TEXT NOT NULL,
        origen_id TEXT NOT NULL,
        destino_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (origen_id) REFERENCES deposits (id),
        FOREIGN KEY (destino_id) REFERENCES deposits (id)
      )
    `);

    // Tabla de líneas de transferencia
    await runQuery(`
      CREATE TABLE IF NOT EXISTS transfer_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transfer_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        nombre TEXT NOT NULL,
        cantidad INTEGER NOT NULL,
        FOREIGN KEY (transfer_id) REFERENCES transfers (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);

    // Tabla de movimientos de stock
    await runQuery(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id TEXT PRIMARY KEY,
        fecha_iso TEXT NOT NULL,
        deposit_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'transferencia', 'venta')),
        delta INTEGER NOT NULL,
        stock_anterior INTEGER,
        stock_actual INTEGER,
        motivo TEXT NOT NULL,
        referencia TEXT,
        user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deposit_id) REFERENCES deposits (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);

    // Tabla de usuarios
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'operador', 'cajero')),
        is_active BOOLEAN DEFAULT 1,
        must_change_password BOOLEAN DEFAULT 0, -- Forzar cambio en primer login
        depositos_asignados TEXT, -- JSON array para operadores
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_access DATETIME
      )
    `);

    // Tabla de sesiones (opcional, para invalidar sesiones)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Auditoría básica solo para login (simple)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS login_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        success BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('✅ Base de datos inicializada correctamente');

    // Insertar datos de ejemplo
    await insertSampleData();

  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    process.exit(1);
  }
}

async function insertSampleData() {
  console.log('📦 Insertando datos de ejemplo...');

  try {
    // Depósito principal
    await runQuery(`
      INSERT OR IGNORE INTO deposits (id, nombre, direccion) 
      VALUES ('DEP001', 'Depósito Principal', 'Av. Libertador 1234')
    `);

    // Productos de ejemplo
    const products = [
      { id: 'PROD001', sku: 'COCA-350', nombre: 'Coca Cola 350ml', precio: 500 },
      { id: 'PROD002', sku: 'PEPSI-500', nombre: 'Pepsi 500ml', precio: 600 },
      { id: 'PROD003', sku: 'AGUA-500', nombre: 'Agua Mineral 500ml', precio: 300 }
    ];

    for (const product of products) {
      await runQuery(`
        INSERT OR IGNORE INTO products (id, sku, nombre, precio_base) 
        VALUES (?, ?, ?, ?)
      `, [product.id, product.sku, product.nombre, product.precio]);

      // Stock inicial
      await runQuery(`
        INSERT OR IGNORE INTO stock (product_id, deposit_id, cantidad) 
        VALUES (?, 'DEP001', 100)
      `, [product.id]);
    }

    // Crear usuario admin inicial si no existe
    const { getQuery } = require('./database');
    const adminExists = await getQuery('SELECT id FROM users WHERE role = "admin"');
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const { v4: uuidv4 } = require('uuid');
      
      const adminId = uuidv4();
      const defaultPassword = 'admin123'; // Contraseña temporal
      const passwordHash = await bcrypt.hash(defaultPassword, 12);
      
      await runQuery(`
        INSERT INTO users (
          id, username, email, password_hash, nombre, apellido, 
          role, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [adminId, 'admin', 'admin@scanix.com', passwordHash, 'Administrador', 'Sistema', 'admin', 1]);
      
      console.log('👑 Usuario admin inicial creado:');
      console.log('   Usuario: admin');
      console.log('   Contraseña: admin123');
      console.log('   ⚠️  CAMBIAR CONTRASEÑA INMEDIATAMENTE');
    }

    console.log('✅ Datos de ejemplo insertados');
  } catch (error) {
    console.error('❌ Error insertando datos de ejemplo:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase().then(() => {
    console.log('🎉 Inicialización completa');
    process.exit(0);
  });
}

module.exports = { initDatabase };
