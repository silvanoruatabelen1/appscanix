const express = require('express');
const { authenticateToken } = require('./auth');
const { allQuery, getQuery, runQuery } = require('../src/database');
const router = express.Router();

// Middleware para verificar que sea admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores pueden gestionar usuarios' });
  }
  next();
};

// GET /api/users - Listar todos los usuarios (solo admins)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await allQuery(`
      SELECT id, username, email, nombre, apellido, role, is_active, 
             depositos_asignados, created_at, last_access
      FROM users 
      ORDER BY created_at DESC
    `);

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
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/users/:id - Obtener usuario específico
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getQuery(`
      SELECT id, username, email, nombre, apellido, role, is_active, 
             depositos_asignados, created_at, last_access
      FROM users 
      WHERE id = ?
    `, [id]);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const formattedUser = {
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
    };

    res.json(formattedUser);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, role, depositosAsignados, isActive } = req.body;

    // Verificar que el usuario existe
    const existingUser = await getQuery('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que no se está desactivando a sí mismo
    if (id === req.user.id && isActive === false) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email) {
      const emailExists = await getQuery(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      if (emailExists) {
        return res.status(400).json({ error: 'El email ya está en uso por otro usuario' });
      }
    }

    const depositosAsignadosJson = depositosAsignados ? JSON.stringify(depositosAsignados) : null;

    await runQuery(`
      UPDATE users 
      SET nombre = COALESCE(?, nombre),
          apellido = COALESCE(?, apellido),
          email = COALESCE(?, email),
          role = COALESCE(?, role),
          depositos_asignados = ?,
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nombre, apellido, email, role, depositosAsignadosJson, isActive, id]);

    // Obtener usuario actualizado
    const updatedUser = await getQuery(`
      SELECT id, username, email, nombre, apellido, role, is_active, 
             depositos_asignados, created_at, last_access
      FROM users WHERE id = ?
    `, [id]);

    const formattedUser = {
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
      message: 'Usuario actualizado exitosamente',
      user: formattedUser
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/users/:id/deactivate - Desactivar usuario
router.put('/:id/deactivate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const existingUser = await getQuery('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que no se está desactivando a sí mismo
    if (id === req.user.id) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }

    await runQuery(`
      UPDATE users 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    res.json({ message: 'Usuario desactivado exitosamente' });
  } catch (error) {
    console.error('Error desactivando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/users/:id/activate - Reactivar usuario
router.put('/:id/activate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const existingUser = await getQuery('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await runQuery(`
      UPDATE users 
      SET is_active = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    res.json({ message: 'Usuario reactivado exitosamente' });
  } catch (error) {
    console.error('Error reactivando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/users/:id - Eliminar usuario (solo en casos extremos)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const existingUser = await getQuery('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que no se está eliminando a sí mismo
    if (id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    // En lugar de eliminar, mejor desactivar
    await runQuery(`
      UPDATE users 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    res.json({ message: 'Usuario eliminado (desactivado) exitosamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
