const express = require('express');
const { allQuery, getQuery, runQuery } = require('../src/database');
const router = express.Router();

// GET /api/transfers - Listar transferencias
router.get('/', async (req, res) => {
  try {
    const transfers = await allQuery(`
      SELECT t.*, 
             do.nombre as origen_nombre,
             dd.nombre as destino_nombre
      FROM transfers t
      JOIN deposits do ON t.origen_id = do.id
      JOIN deposits dd ON t.destino_id = dd.id
      ORDER BY t.created_at DESC
    `);

    // Obtener items para cada transferencia
    const transfersWithItems = await Promise.all(
      transfers.map(async (transfer) => {
        const items = await allQuery(`
          SELECT * FROM transfer_lines WHERE transfer_id = ?
        `, [transfer.id]);
        
        return { ...transfer, items };
      })
    );

    res.json(transfersWithItems);
  } catch (error) {
    console.error('Error obteniendo transferencias:', error);
    res.status(500).json({ error: 'Error obteniendo transferencias' });
  }
});

// GET /api/transfers/:id - Obtener transferencia por ID
router.get('/:id', async (req, res) => {
  try {
    const transfer = await getQuery(`
      SELECT t.*, 
             do.nombre as origen_nombre,
             dd.nombre as destino_nombre
      FROM transfers t
      JOIN deposits do ON t.origen_id = do.id
      JOIN deposits dd ON t.destino_id = dd.id
      WHERE t.id = ?
    `, [req.params.id]);

    if (!transfer) {
      return res.status(404).json({ error: 'Transferencia no encontrada' });
    }

    // Obtener items
    const items = await allQuery(`
      SELECT * FROM transfer_lines WHERE transfer_id = ?
    `, [req.params.id]);

    res.json({ ...transfer, items });
  } catch (error) {
    console.error('Error obteniendo transferencia:', error);
    res.status(500).json({ error: 'Error obteniendo transferencia' });
  }
});

// POST /api/transfers - Crear transferencia
router.post('/', async (req, res) => {
  try {
    const { origenId, destinoId, items } = req.body;

    if (origenId === destinoId) {
      return res.status(400).json({ error: 'Origen y destino no pueden ser iguales' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'La transferencia debe tener items' });
    }

    // Validar stock en origen
    for (const item of items) {
      const stock = await getQuery(`
        SELECT cantidad FROM stock WHERE product_id = ? AND deposit_id = ?
      `, [item.productId, origenId]);

      const stockDisponible = stock ? stock.cantidad : 0;
      if (stockDisponible < item.cantidad) {
        return res.status(400).json({ 
          error: `Stock insuficiente en origen para ${item.nombre}. Disponible: ${stockDisponible}, Solicitado: ${item.cantidad}` 
        });
      }
    }

    // Generar IDs
    const transferId = `TRF${Date.now()}`;
    const numeroRemito = `R${String(Date.now()).slice(-6)}`;
    const fechaISO = new Date().toISOString();

    // Crear transferencia
    await runQuery(`
      INSERT INTO transfers (id, numero_remito, fecha_iso, origen_id, destino_id)
      VALUES (?, ?, ?, ?, ?)
    `, [transferId, numeroRemito, fechaISO, origenId, destinoId]);

    // Procesar items
    for (const item of items) {
      // Insertar línea
      await runQuery(`
        INSERT INTO transfer_lines (transfer_id, product_id, sku, nombre, cantidad)
        VALUES (?, ?, ?, ?, ?)
      `, [transferId, item.productId, item.sku, item.nombre, item.cantidad]);

      // Retirar stock del origen
      await runQuery(`
        UPDATE stock SET cantidad = cantidad - ?, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ? AND deposit_id = ?
      `, [item.cantidad, item.productId, origenId]);

      // Agregar stock al destino
      const destStock = await getQuery(`
        SELECT cantidad FROM stock WHERE product_id = ? AND deposit_id = ?
      `, [item.productId, destinoId]);

      if (destStock) {
        await runQuery(`
          UPDATE stock SET cantidad = cantidad + ?, updated_at = CURRENT_TIMESTAMP
          WHERE product_id = ? AND deposit_id = ?
        `, [item.cantidad, item.productId, destinoId]);
      } else {
        await runQuery(`
          INSERT INTO stock (product_id, deposit_id, cantidad)
          VALUES (?, ?, ?)
        `, [item.productId, destinoId, item.cantidad]);
      }

      // Registrar movimientos
      const movOutId = `MOV${Date.now()}_OUT_${Math.random().toString(36).substr(2, 3)}`;
      const movInId = `MOV${Date.now()}_IN_${Math.random().toString(36).substr(2, 3)}`;

      // Salida
      await runQuery(`
        INSERT INTO stock_movements (
          id, fecha_iso, deposit_id, product_id, tipo, delta, motivo, referencia
        ) VALUES (?, ?, ?, ?, 'transferencia', ?, ?, ?)
      `, [movOutId, fechaISO, origenId, item.productId, -item.cantidad, `Transferencia ${transferId} - Salida`, transferId]);

      // Entrada
      await runQuery(`
        INSERT INTO stock_movements (
          id, fecha_iso, deposit_id, product_id, tipo, delta, motivo, referencia
        ) VALUES (?, ?, ?, ?, 'transferencia', ?, ?, ?)
      `, [movInId, fechaISO, destinoId, item.productId, item.cantidad, `Transferencia ${transferId} - Entrada`, transferId]);
    }

    res.status(201).json({ 
      id: transferId, 
      numeroRemito, 
      fechaISO, 
      origenId, 
      destinoId, 
      items 
    });
  } catch (error) {
    console.error('Error creando transferencia:', error);
    res.status(500).json({ error: 'Error creando transferencia' });
  }
});

module.exports = router;
