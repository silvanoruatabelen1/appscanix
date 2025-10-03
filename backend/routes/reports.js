const express = require('express');
const { allQuery, getQuery, runQuery } = require('../src/database');
const router = express.Router();

// GET /api/reports/sales - Reporte de ventas
router.get('/sales', async (req, res) => {
  try {
    const { startDate, endDate, depositId } = req.query;
    
    // Validar fechas
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate y endDate son requeridos' });
    }

    // Query base para tickets
    let ticketsQuery = `
      SELECT t.*, d.nombre as deposito_nombre
      FROM tickets t
      JOIN deposits d ON t.deposit_id = d.id
      WHERE t.fecha_iso >= ? AND t.fecha_iso <= ?
    `;
    let params = [startDate, endDate];

    // Filtrar por depósito si se especifica
    if (depositId) {
      ticketsQuery += ' AND t.deposit_id = ?';
      params.push(depositId);
    }

    ticketsQuery += ' ORDER BY t.fecha_iso DESC';

    const tickets = await allQuery(ticketsQuery, params);

    // Obtener líneas de tickets para análisis detallado
    const ticketIds = tickets.map(t => t.id);
    let ticketLines = [];
    
    if (ticketIds.length > 0) {
      const placeholders = ticketIds.map(() => '?').join(',');
      ticketLines = await allQuery(`
        SELECT tl.*, p.nombre as producto_nombre
        FROM ticket_lines tl
        JOIN products p ON tl.product_id = p.id
        WHERE tl.ticket_id IN (${placeholders})
      `, ticketIds);
    }

    // Calcular KPIs
    const totalVentas = tickets.reduce((sum, t) => sum + t.total, 0);
    const cantidadTickets = tickets.length;
    const promedioTicket = cantidadTickets > 0 ? totalVentas / cantidadTickets : 0;

    // Top 5 productos más vendidos
    const productSales = {};
    ticketLines.forEach(line => {
      const key = line.product_id;
      if (!productSales[key]) {
        productSales[key] = {
          productId: line.product_id,
          sku: line.sku,
          nombre: line.producto_nombre || line.nombre,
          cantidadVendida: 0,
          totalVentas: 0
        };
      }
      productSales[key].cantidadVendida += line.cantidad;
      productSales[key].totalVentas += line.subtotal;
    });

    const topProductos = Object.values(productSales)
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
      .slice(0, 5);

    // Ventas por día
    const ventasPorDia = {};
    tickets.forEach(ticket => {
      const fecha = ticket.fecha_iso.split('T')[0]; // Solo la fecha
      if (!ventasPorDia[fecha]) {
        ventasPorDia[fecha] = {
          fecha,
          totalVentas: 0,
          cantidadTickets: 0
        };
      }
      ventasPorDia[fecha].totalVentas += ticket.total;
      ventasPorDia[fecha].cantidadTickets += 1;
    });

    const ventasPorDiaArray = Object.values(ventasPorDia)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    res.json({
      periodo: { startDate, endDate },
      kpis: {
        totalVentas,
        cantidadTickets,
        promedioTicket: Math.round(promedioTicket * 100) / 100
      },
      topProductos,
      ventasPorDia: ventasPorDiaArray,
      tickets: tickets.map(t => ({
        id: t.id,
        fecha: t.fecha_iso,
        total: t.total,
        deposito: t.deposito_nombre,
        items: ticketLines.filter(line => line.ticket_id === t.id)
      }))
    });

  } catch (error) {
    console.error('Error en reporte de ventas:', error);
    res.status(500).json({ error: 'Error generando reporte de ventas' });
  }
});

// GET /api/reports/stock - Reporte de movimientos de stock
router.get('/stock', async (req, res) => {
  try {
    const { startDate, endDate, depositId, tipo } = req.query;

    // Query base para movimientos
    let movementsQuery = `
      SELECT sm.*, d.nombre as deposito_nombre, p.nombre as producto_nombre
      FROM stock_movements sm
      JOIN deposits d ON sm.deposit_id = d.id
      JOIN products p ON sm.product_id = p.id
      WHERE 1=1
    `;
    let params = [];

    // Filtros opcionales
    if (startDate) {
      movementsQuery += ' AND sm.fecha_iso >= ?';
      params.push(startDate);
    }
    if (endDate) {
      movementsQuery += ' AND sm.fecha_iso <= ?';
      params.push(endDate);
    }
    if (depositId) {
      movementsQuery += ' AND sm.deposit_id = ?';
      params.push(depositId);
    }
    if (tipo) {
      movementsQuery += ' AND sm.tipo = ?';
      params.push(tipo);
    }

    movementsQuery += ' ORDER BY sm.fecha_iso DESC';

    const movements = await allQuery(movementsQuery, params);

    // Stock actual por depósito
    let stockQuery = `
      SELECT s.*, p.nombre as producto_nombre, p.sku, d.nombre as deposito_nombre
      FROM stock s
      JOIN products p ON s.product_id = p.id
      JOIN deposits d ON s.deposit_id = d.id
      WHERE s.cantidad > 0
    `;
    let stockParams = [];

    if (depositId) {
      stockQuery += ' AND s.deposit_id = ?';
      stockParams.push(depositId);
    }

    stockQuery += ' ORDER BY d.nombre, p.nombre';

    const stockActual = await allQuery(stockQuery, stockParams);

    // Resumen por tipo de movimiento
    const resumenTipos = {};
    movements.forEach(mov => {
      if (!resumenTipos[mov.tipo]) {
        resumenTipos[mov.tipo] = {
          tipo: mov.tipo,
          cantidad: 0,
          entradas: 0,
          salidas: 0
        };
      }
      resumenTipos[mov.tipo].cantidad += 1;
      if (mov.delta > 0) {
        resumenTipos[mov.tipo].entradas += mov.delta;
      } else {
        resumenTipos[mov.tipo].salidas += Math.abs(mov.delta);
      }
    });

    // Stock por depósito
    const stockPorDeposito = {};
    stockActual.forEach(item => {
      if (!stockPorDeposito[item.deposit_id]) {
        stockPorDeposito[item.deposit_id] = {
          depositoId: item.deposit_id,
          depositoNombre: item.deposito_nombre,
          productos: [],
          totalProductos: 0,
          valorTotal: 0
        };
      }
      stockPorDeposito[item.deposit_id].productos.push({
        productId: item.product_id,
        sku: item.sku,
        nombre: item.producto_nombre,
        cantidad: item.cantidad,
        valorUnitario: item.precio_base || 0,
        valorTotal: (item.precio_base || 0) * item.cantidad
      });
      stockPorDeposito[item.deposit_id].totalProductos += item.cantidad;
      stockPorDeposito[item.deposit_id].valorTotal += (item.precio_base || 0) * item.cantidad;
    });

    res.json({
      filtros: { startDate, endDate, depositId, tipo },
      resumenTipos: Object.values(resumenTipos),
      stockPorDeposito: Object.values(stockPorDeposito),
      movimientos: movements.map(m => ({
        id: m.id,
        fecha: m.fecha_iso,
        deposito: m.deposito_nombre,
        producto: m.producto_nombre,
        tipo: m.tipo,
        delta: m.delta,
        stockAnterior: m.stock_anterior,
        stockActual: m.stock_actual,
        motivo: m.motivo,
        referencia: m.referencia
      })),
      totalMovimientos: movements.length
    });

  } catch (error) {
    console.error('Error en reporte de stock:', error);
    res.status(500).json({ error: 'Error generando reporte de stock' });
  }
});

// GET /api/reports/kpis - KPIs generales del sistema
router.get('/kpis', async (req, res) => {
  try {
    // Total productos
    const [totalProductos] = await allQuery('SELECT COUNT(*) as count FROM products');
    
    // Total depósitos
    const [totalDepositos] = await allQuery('SELECT COUNT(*) as count FROM deposits');
    
    // Tickets del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const ticketsDelMes = await allQuery(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM tickets 
      WHERE fecha_iso >= ?
    `, [inicioMes.toISOString()]);

    // Transferencias del mes
    const transferenciasDelMes = await allQuery(`
      SELECT COUNT(*) as count
      FROM transfers 
      WHERE fecha_iso >= ?
    `, [inicioMes.toISOString()]);

    // Productos con stock bajo (menos de 10)
    const stockBajo = await allQuery(`
      SELECT COUNT(*) as count
      FROM stock s
      JOIN products p ON s.product_id = p.id
      WHERE s.cantidad < 10
    `);

    // Valor total del inventario
    const valorInventario = await allQuery(`
      SELECT COALESCE(SUM(s.cantidad * p.precio_base), 0) as valor
      FROM stock s
      JOIN products p ON s.product_id = p.id
    `);

    res.json({
      productos: {
        total: totalProductos.count,
        stockBajo: stockBajo[0].count
      },
      depositos: {
        total: totalDepositos.count
      },
      ventasDelMes: {
        cantidad: ticketsDelMes[0].count,
        total: ticketsDelMes[0].total
      },
      transferenciasDelMes: {
        cantidad: transferenciasDelMes[0].count
      },
      inventario: {
        valorTotal: valorInventario[0].valor
      },
      fecha: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo KPIs:', error);
    res.status(500).json({ error: 'Error obteniendo KPIs del sistema' });
  }
});

module.exports = router;
