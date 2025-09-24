const express = require('express');
const { allQuery, getQuery, runQuery } = require('../src/database');
const router = express.Router();

// GET /api/deposits - Listar depósitos
router.get('/', async (req, res) => {
  try {
    const deposits = await allQuery('SELECT * FROM deposits ORDER BY nombre');
    res.json(deposits);
  } catch (error) {
    console.error('Error obteniendo depósitos:', error);
    res.status(500).json({ error: 'Error obteniendo depósitos' });
  }
});

// POST /api/deposits - Crear depósito
router.post('/', async (req, res) => {
  try {
    const { id, nombre, direccion } = req.body;
    
    await runQuery(`
      INSERT INTO deposits (id, nombre, direccion)
      VALUES (?, ?, ?)
    `, [id, nombre, direccion || '']);

    res.status(201).json({ message: 'Depósito creado', id });
  } catch (error) {
    console.error('Error creando depósito:', error);
    res.status(500).json({ error: 'Error creando depósito' });
  }
});

module.exports = router;
