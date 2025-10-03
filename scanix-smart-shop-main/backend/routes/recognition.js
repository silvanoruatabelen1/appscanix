/**
 * SCANIX Backend - AI Recognition Routes
 * Proxy para el servicio de IA con YOLO
 */

const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const router = express.Router();

// Configuración del servicio de IA
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
const AI_SERVICE_TIMEOUT = 30000; // 30 segundos

/**
 * Health check del servicio de IA
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000
    });
    
    res.json({
      status: 'ok',
      ai_service: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error conectando con AI service:', error.message);
    res.status(503).json({
      status: 'error',
      error: 'AI Service no disponible',
      message: 'El servicio de reconocimiento no está funcionando'
    });
  }
});

/**
 * Reconocer bebidas en imagen usando YOLO
 */
router.post('/recognize', async (req, res) => {
  try {
    console.log('🤖 Procesando reconocimiento con YOLO...');
    
    // Verificar que se envió una imagen
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó imagen'
      });
    }
    
    const imageFile = req.files.image;
    console.log(`📸 Imagen recibida: ${imageFile.name} (${imageFile.size} bytes)`);
    
    // Crear FormData para enviar al servicio de IA
    const formData = new FormData();
    formData.append('image', imageFile.data, {
      filename: imageFile.name,
      contentType: imageFile.mimetype
    });
    
    // Enviar al servicio de IA
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/recognize`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: AI_SERVICE_TIMEOUT
    });
    
    console.log('✅ Respuesta del AI service:', aiResponse.data);
    
    // Transformar respuesta al formato esperado por el frontend
    const transformedResponse = {
      success: aiResponse.data.success,
      items: aiResponse.data.items?.map(item => ({
        productId: item.sku, // Usar SKU como ID temporal
        sku: item.sku,
        nombre: item.nombre,
        qty: item.cantidad || 1,
        confianza: item.confidence,
        precio: item.precio
      })) || [],
      metadata: {
        detections: aiResponse.data.detections || 0,
        recognized: aiResponse.data.recognized || 0,
        ai_service: 'YOLO',
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(transformedResponse);
    
  } catch (error) {
    console.error('❌ Error en reconocimiento:', error.message);
    
    // Manejar diferentes tipos de errores
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Servicio de IA no disponible',
        message: 'El servicio de reconocimiento no está funcionando. Verifica que el AI service esté ejecutándose.'
      });
    }
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        error: 'Timeout en reconocimiento',
        message: 'El procesamiento de la imagen tardó demasiado. Intenta con una imagen más pequeña.'
      });
    }
    
    if (error.response) {
      // Error del servicio de IA
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data.error || 'Error en servicio de IA',
        message: error.response.data.message || 'Error procesando imagen'
      });
    }
    
    // Error genérico
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error procesando la imagen'
    });
  }
});

/**
 * Obtener clases disponibles del modelo YOLO
 */
router.get('/classes', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/classes`, {
      timeout: 5000
    });
    
    res.json({
      success: true,
      classes: response.data.classes,
      num_classes: response.data.num_classes
    });
  } catch (error) {
    console.error('❌ Error obteniendo clases:', error.message);
    res.status(503).json({
      success: false,
      error: 'No se pudieron obtener las clases del modelo'
    });
  }
});

/**
 * Configurar el servicio de IA
 */
router.post('/config', async (req, res) => {
  try {
    const { confidence_threshold } = req.body;
    
    if (confidence_threshold && (confidence_threshold < 0 || confidence_threshold > 1)) {
      return res.status(400).json({
        success: false,
        error: 'Confidence threshold debe estar entre 0 y 1'
      });
    }
    
    // Aquí podrías implementar configuración dinámica
    res.json({
      success: true,
      message: 'Configuración actualizada',
      config: {
        confidence_threshold: confidence_threshold || 0.5
      }
    });
  } catch (error) {
    console.error('❌ Error configurando AI service:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error actualizando configuración'
    });
  }
});

module.exports = router;