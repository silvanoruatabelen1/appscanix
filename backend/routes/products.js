const express = require('express');
const { allQuery, getQuery, runQuery } = require('../src/database');
const router = express.Router();

// GET /api/products - Listar todos los productos
router.get('/', async (req, res) => {
  try {
    // Obtener productos básicos
    const products = await allQuery(`
      SELECT * FROM products ORDER BY nombre
    `);

    // Obtener tiers para cada producto
    const productsWithTiers = await Promise.all(
      products.map(async (product) => {
        const tiers = await allQuery(`
          SELECT min_qty as min, max_qty as max, precio
          FROM price_tiers 
          WHERE product_id = ? 
          ORDER BY min_qty
        `, [product.id]);
        
        return {
          ...product,
          tiers: tiers || []
        };
      })
    );

    res.json(productsWithTiers);
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ error: 'Error obteniendo productos' });
  }
});

// GET /api/products/:id - Obtener producto por ID
router.get('/:id', async (req, res) => {
  try {
    const product = await getQuery('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Obtener tiers
    const tiers = await allQuery('SELECT * FROM price_tiers WHERE product_id = ? ORDER BY min_qty', [req.params.id]);
    
    res.json({ ...product, tiers });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ error: 'Error obteniendo producto' });
  }
});

// POST /api/products - Crear nuevo producto
router.post('/', async (req, res) => {
  try {
    const { id, sku, nombre, descripcion, precioBase, tiers = [] } = req.body;

    // Validaciones básicas
    if (!id || !sku || !nombre || !precioBase) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Insertar producto
    await runQuery(`
      INSERT INTO products (id, sku, nombre, descripcion, precio_base)
      VALUES (?, ?, ?, ?, ?)
    `, [id, sku, nombre, descripcion || '', precioBase]);

    // Insertar tiers si existen
    for (const tier of tiers) {
      await runQuery(`
        INSERT INTO price_tiers (product_id, min_qty, max_qty, precio)
        VALUES (?, ?, ?, ?)
      `, [id, tier.min, tier.max, tier.precio]);
    }

    res.status(201).json({ message: 'Producto creado', id });
  } catch (error) {
    console.error('Error creando producto:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'SKU ya existe' });
    } else {
      res.status(500).json({ error: 'Error creando producto' });
    }
  }
});

// PUT /api/products/:id - Actualizar producto
router.put('/:id', async (req, res) => {
  try {
    const { sku, nombre, descripcion, precioBase, tiers = [] } = req.body;

    // Actualizar producto
    const result = await runQuery(`
      UPDATE products 
      SET sku = ?, nombre = ?, descripcion = ?, precio_base = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [sku, nombre, descripcion || '', precioBase, req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar tiers existentes y recrear
    await runQuery('DELETE FROM price_tiers WHERE product_id = ?', [req.params.id]);
    
    for (const tier of tiers) {
      await runQuery(`
        INSERT INTO price_tiers (product_id, min_qty, max_qty, precio)
        VALUES (?, ?, ?, ?)
      `, [req.params.id, tier.min, tier.max, tier.precio]);
    }

    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ error: 'Error actualizando producto' });
  }
});

// DELETE /api/products/:id - Eliminar producto
router.delete('/:id', async (req, res) => {
  try {
    const result = await runQuery('DELETE FROM products WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ error: 'Error eliminando producto' });
  }
});

// PUT /api/products/:id/tiers - Actualizar solo los tiers de un producto
router.put('/:id/tiers', async (req, res) => {
  try {
    const { tiers } = req.body;
    const productId = req.params.id;

    // Validar que el producto existe
    const product = await getQuery('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar tiers existentes
    await runQuery('DELETE FROM price_tiers WHERE product_id = ?', [productId]);

    // Insertar nuevos tiers
    if (tiers && tiers.length > 0) {
      for (const tier of tiers) {
        await runQuery(`
          INSERT INTO price_tiers (product_id, min_qty, max_qty, precio)
          VALUES (?, ?, ?, ?)
        `, [productId, tier.min, tier.max, tier.precio]);
      }
    }

    res.json({ message: 'Tiers actualizados correctamente' });
  } catch (error) {
    console.error('Error actualizando tiers:', error);
    res.status(500).json({ error: 'Error actualizando tiers' });
  }
});

module.exports = router;
