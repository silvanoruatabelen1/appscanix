const express = require('express');
const { allQuery, getQuery, runQuery } = require('../src/database');
const router = express.Router();

// GET /api/tickets - Listar tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await allQuery(`
      SELECT t.*, d.nombre as deposito_nombre
      FROM tickets t
      JOIN deposits d ON t.deposit_id = d.id
      ORDER BY t.created_at DESC
    `);

    res.json(tickets);
  } catch (error) {
    console.error('Error obteniendo tickets:', error);
    res.status(500).json({ error: 'Error obteniendo tickets' });
  }
});

// GET /api/tickets/:id - Obtener ticket por ID
router.get('/:id', async (req, res) => {
  try {
    const ticket = await getQuery(`
      SELECT t.*, d.nombre as deposito_nombre
      FROM tickets t
      JOIN deposits d ON t.deposit_id = d.id
      WHERE t.id = ?
    `, [req.params.id]);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Obtener líneas del ticket
    const items = await allQuery(`
      SELECT * FROM ticket_lines WHERE ticket_id = ?
    `, [req.params.id]);

    res.json({ ...ticket, items });
  } catch (error) {
    console.error('Error obteniendo ticket:', error);
    res.status(500).json({ error: 'Error obteniendo ticket' });
  }
});

// POST /api/tickets - Crear ticket y descontar stock
router.post('/', async (req, res) => {
  try {
    const { items, depositId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El ticket debe tener items' });
    }

    // Generar ID de ticket
    const ticketId = `TCK${Date.now()}`;
    const fechaISO = new Date().toISOString();
    
    // Calcular total
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    // Validar stock disponible para todos los items
    for (const item of items) {
      const stock = await getQuery(`
        SELECT cantidad FROM stock WHERE product_id = ? AND deposit_id = ?
      `, [item.productId, depositId]);

      const stockDisponible = stock ? stock.cantidad : 0;
      if (stockDisponible < item.qty) {
        return res.status(400).json({ 
          error: `Stock insuficiente para ${item.nombre}. Disponible: ${stockDisponible}, Solicitado: ${item.qty}` 
        });
      }
    }

    // Crear ticket
    await runQuery(`
      INSERT INTO tickets (id, fecha_iso, deposit_id, total)
      VALUES (?, ?, ?, ?)
    `, [ticketId, fechaISO, depositId, total]);

    // Insertar líneas y descontar stock
    for (const item of items) {
      // Insertar línea
      await runQuery(`
        INSERT INTO ticket_lines (ticket_id, product_id, sku, nombre, cantidad, precio_aplicado, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [ticketId, item.productId, item.sku, item.nombre, item.qty, item.precioAplicado, item.subtotal]);

      // Descontar stock
      await runQuery(`
        UPDATE stock SET cantidad = cantidad - ?, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ? AND deposit_id = ?
      `, [item.qty, item.productId, depositId]);

      // Registrar movimiento
      const movementId = `MOV${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await runQuery(`
        INSERT INTO stock_movements (
          id, fecha_iso, deposit_id, product_id, tipo, delta, motivo, referencia
        ) VALUES (?, ?, ?, ?, 'venta', ?, ?, ?)
      `, [movementId, fechaISO, depositId, item.productId, -item.qty, `Venta ticket ${ticketId}`, ticketId]);
    }

    res.status(201).json({ 
      id: ticketId, 
      fechaISO, 
      items, 
      total, 
      depositId 
    });
  } catch (error) {
    console.error('Error creando ticket:', error);
    res.status(500).json({ error: 'Error creando ticket' });
  }
});

module.exports = router;
