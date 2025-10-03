const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { allQuery, getQuery, runQuery } = require('../src/database');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'scanix_jwt_secret_key_2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'; // Sesión de 8 horas (turno laboral)
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Middleware para verificar JWT
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

// POST /api/auth/register - Registrar nuevo usuario (SOLO ADMINS)
router.post('/register', authenticateToken, async (req, res) => {
  // Solo admins pueden crear usuarios
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores pueden crear usuarios' });
  }
  try {
    const { username, email, password, nombre, apellido, role, depositosAsignados } = req.body;

    // Validaciones básicas
    if (!username || !email || !password || !nombre || !apellido || !role) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (!['admin', 'operador', 'vendedor'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await getQuery(
      'SELECT id FROM users WHERE username = ? OR email = ?', 
      [username, email]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'El usuario o email ya están registrados' });
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const userId = uuidv4();
    const depositosAsignadosJson = depositosAsignados ? JSON.stringify(depositosAsignados) : null;

    await runQuery(`
      INSERT INTO users (
        id, username, email, password_hash, nombre, apellido, 
        role, depositos_asignados, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [userId, username, email, passwordHash, nombre, apellido, role, depositosAsignadosJson]);

    // Generar JWT
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Actualizar último acceso
    await runQuery('UPDATE users SET last_access = CURRENT_TIMESTAMP WHERE id = ?', [userId]);

    // Respuesta sin contraseña
    const user = {
      id: userId,
      username,
      email,
      nombre,
      apellido,
      role,
      isActive: true,
      depositosAsignados: depositosAsignados || [],
      fechaCreacion: new Date().toISOString(),
      ultimoAcceso: new Date().toISOString()
    };

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user,
      token
    });

  } catch (error) {
    console.error('Error registrando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    // Buscar usuario
    const user = await getQuery(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1',
      [username, username]
    );

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Generar JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Actualizar último acceso
    await runQuery('UPDATE users SET last_access = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Respuesta sin contraseña
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
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/auth/me - Obtener información del usuario actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // En el futuro podríamos invalidar el token en la base de datos
    res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/auth/profile - Actualizar perfil
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { nombre, apellido, email } = req.body;
    const userId = req.user.id;

    if (!nombre || !apellido || !email) {
      return res.status(400).json({ error: 'Nombre, apellido y email son requeridos' });
    }

    // Verificar si el email ya está en uso por otro usuario
    const existingUser = await getQuery(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está en uso por otro usuario' });
    }

    // Actualizar usuario
    await runQuery(`
      UPDATE users 
      SET nombre = ?, apellido = ?, email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nombre, apellido, email, userId]);

    // Obtener usuario actualizado
    const updatedUser = await getQuery('SELECT * FROM users WHERE id = ?', [userId]);

    const userResponse = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      nombre: updatedUser.nombre,
      apellido: updatedUser.apellido,
      role: updatedUser.role,
      isActive: !!updatedUser.is_active,
      depositosAsignados: updatedUser.depositos_asignados ? JSON.parse(updatedUser.depositos_asignados) : [],
      fechaCreacion: updatedUser.created_at,
      ultimoAcceso: updatedUser.last_access
    };

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: userResponse
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/auth/password - Cambiar contraseña
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar contraseña actual
    const user = await getQuery('SELECT password_hash FROM users WHERE id = ?', [userId]);
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hash de la nueva contraseña
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await runQuery(`
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newPasswordHash, userId]);

    res.json({ message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = { router, authenticateToken };
