const express = require('express');
const { allQuery, getQuery, runQuery } = require('../src/database');
const router = express.Router();

// GET /api/stock/:depositId - Obtener stock de un depósito
router.get('/:depositId', async (req, res) => {
  try {
    const stock = await allQuery(`
      SELECT s.*, p.sku, p.nombre, p.precio_base
      FROM stock s
      JOIN products p ON s.product_id = p.id
      WHERE s.deposit_id = ?
      ORDER BY p.nombre
    `, [req.params.depositId]);

    res.json(stock);
  } catch (error) {
    console.error('Error obteniendo stock:', error);
    res.status(500).json({ error: 'Error obteniendo stock' });
  }
});

// POST /api/stock/adjust - Ajustar stock
router.post('/adjust', async (req, res) => {
  try {
    const { depositId, productId, qtyDelta, motivo } = req.body;

    // Obtener stock actual
    const currentStock = await getQuery(`
      SELECT cantidad FROM stock WHERE product_id = ? AND deposit_id = ?
    `, [productId, depositId]);

    const stockAnterior = currentStock ? currentStock.cantidad : 0;
    const stockActual = stockAnterior + qtyDelta;

    // Validar que no quede negativo
    if (stockActual < 0) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    // Actualizar o insertar stock
    if (currentStock) {
      await runQuery(`
        UPDATE stock SET cantidad = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE product_id = ? AND deposit_id = ?
      `, [stockActual, productId, depositId]);
    } else {
      await runQuery(`
        INSERT INTO stock (product_id, deposit_id, cantidad)
        VALUES (?, ?, ?)
      `, [productId, depositId, stockActual]);
    }

    // Registrar movimiento
    const movementId = `MOV${Date.now()}`;
    await runQuery(`
      INSERT INTO stock_movements (
        id, fecha_iso, deposit_id, product_id, tipo, delta, 
        stock_anterior, stock_actual, motivo
      ) VALUES (?, ?, ?, ?, 'ajuste', ?, ?, ?, ?)
    `, [
      movementId, 
      new Date().toISOString(),
      depositId, 
      productId, 
      qtyDelta, 
      stockAnterior, 
      stockActual, 
      motivo
    ]);

    res.json({ ok: true, stockActual });
  } catch (error) {
    console.error('Error ajustando stock:', error);
    res.status(500).json({ error: 'Error ajustando stock' });
  }
});

module.exports = router;
