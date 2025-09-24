const express = require('express');
const multer = require('multer');
const path = require('path');
const { allQuery } = require('../src/database');
const router = express.Router();

// Configurar multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

// POST /api/recognition/recognize - Reconocer productos en imagen
router.post('/recognize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }

    console.log(`📸 Procesando imagen: ${req.file.filename}`);

    // MOCK INTELIGENTE - Simular reconocimiento basado en nombre de archivo
    const items = await mockRecognition(req.file);

    res.json({ items });
  } catch (error) {
    console.error('Error en reconocimiento:', error);
    res.status(500).json({ error: error.message || 'Error procesando imagen' });
  }
});

// Función MOCK para simular reconocimiento de IA
async function mockRecognition(file) {
  // Simular delay realista
  const delay = Math.random() * 1200 + 800; // 800-2000ms
  await new Promise(resolve => setTimeout(resolve, delay));

  // Obtener productos disponibles
  const products = await allQuery('SELECT * FROM products ORDER BY nombre');
  
  if (products.length === 0) {
    throw new Error('No hay productos en la base de datos');
  }

  const fileName = file.originalname.toLowerCase();
  let recognitionScenario = 'random';
  let baseConfidence = 0.75;
  let numProducts = 1;

  // Lógica inteligente basada en nombre de archivo
  if (fileName.includes('multiple') || fileName.includes('varios')) {
    recognitionScenario = 'multiple';
    numProducts = Math.min(3, products.length);
    baseConfidence = 0.70;
  } else if (fileName.includes('single') || fileName.includes('uno')) {
    recognitionScenario = 'single';
    numProducts = 1;
    baseConfidence = 0.85;
  } else if (fileName.includes('blurry') || fileName.includes('borroso')) {
    recognitionScenario = 'low_quality';
    baseConfidence = 0.45;
    if (Math.random() < 0.3) {
      throw new Error('Imagen muy borrosa. Intente con una imagen más clara.');
    }
  } else if (fileName.includes('clear') || fileName.includes('hd')) {
    recognitionScenario = 'high_quality';
    baseConfidence = 0.92;
  } else {
    // Escenario aleatorio
    numProducts = Math.random() < 0.7 ? 1 : Math.min(2, products.length);
    baseConfidence = 0.65 + Math.random() * 0.25;
  }

  // Si confianza muy baja, no reconocer nada
  if (baseConfidence < 0.5) {
    throw new Error('No se pudieron reconocer productos. Intente con una imagen más clara.');
  }

  const items = [];
  const usedProducts = new Set();

  for (let i = 0; i < numProducts; i++) {
    let product;
    let attempts = 0;
    
    // Seleccionar producto no usado
    do {
      product = products[Math.floor(Math.random() * products.length)];
      attempts++;
    } while (usedProducts.has(product.id) && attempts < 10);

    if (usedProducts.has(product.id)) continue;
    usedProducts.add(product.id);

    // Calcular confianza con variación
    let confidence = baseConfidence + (Math.random() - 0.5) * 0.15;
    confidence = Math.max(0.4, Math.min(0.98, confidence));

    // Calcular cantidad detectada
    let qty = 1;
    if (recognitionScenario === 'multiple') {
      qty = Math.floor(Math.random() * 4) + 1; // 1-4
    } else if (Math.random() < 0.3) {
      qty = Math.floor(Math.random() * 3) + 1; // 1-3
    }

    items.push({
      productId: product.id,
      sku: product.sku,
      nombre: product.nombre,
      qty,
      confianza: Math.round(confidence * 100) / 100
    });
  }

  // Ordenar por confianza descendente
  items.sort((a, b) => b.confianza - a.confianza);

  console.log(`🤖 Mock reconocimiento: ${items.length} productos detectados`);
  return items;
}

module.exports = router;
