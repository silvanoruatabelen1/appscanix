"""
SCANIX AI Service - YOLO Recognition
Flask API para reconocimiento de bebidas con YOLOv8
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from PIL import Image
import io
import base64
import os
from ultralytics import YOLO
import json
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuración
MODEL_PATH = 'models/best.pt'
DB_PATH = 'beverages.db'
CONFIDENCE_THRESHOLD = 0.5

# Inicializar modelo YOLO
print("🤖 Cargando modelo YOLO...")
model = None
try:
    model = YOLO(MODEL_PATH)
    print("✅ Modelo YOLO cargado exitosamente")
except Exception as e:
    print(f"❌ Error cargando modelo: {e}")
    print("⚠️ Asegúrate de que best.pt esté en ai-service/models/")

# Base de datos de bebidas argentinas
BEVERAGES_DB = {
    # Gaseosas Cola
    'coca_cola': {'sku': 'COCA-500', 'nombre': 'Coca Cola 500ml', 'precio': 650},
    'coca_cola_1.5l': {'sku': 'COCA-1.5L', 'nombre': 'Coca Cola 1.5L', 'precio': 1450},
    'coca_cola_zero': {'sku': 'COCA-ZERO-500', 'nombre': 'Coca Cola Zero 500ml', 'precio': 650},
    'pepsi': {'sku': 'PEPSI-500', 'nombre': 'Pepsi 500ml', 'precio': 600},
    'pepsi_1.5l': {'sku': 'PEPSI-1.5L', 'nombre': 'Pepsi 1.5L', 'precio': 1350},
    
    # Lima-Limón
    'sprite': {'sku': 'SPRITE-500', 'nombre': 'Sprite 500ml', 'precio': 620},
    '7up': {'sku': '7UP-500', 'nombre': '7UP 500ml', 'precio': 600},
    
    # Naranja
    'fanta': {'sku': 'FANTA-500', 'nombre': 'Fanta Naranja 500ml', 'precio': 620},
    'mirinda': {'sku': 'MIRINDA-500', 'nombre': 'Mirinda Naranja 500ml', 'precio': 600},
    
    # Agua Mineral
    'agua_villa': {'sku': 'AGUA-VILLA-500', 'nombre': 'Agua Villa del Sur 500ml', 'precio': 400},
    'agua_villa_1.5l': {'sku': 'AGUA-VILLA-1.5L', 'nombre': 'Agua Villa del Sur 1.5L', 'precio': 750},
    'agua_eco': {'sku': 'AGUA-ECO-500', 'nombre': 'Agua Eco de los Andes 500ml', 'precio': 380},
    'villavicencio': {'sku': 'VILLAVICENCIO-500', 'nombre': 'Villavicencio 500ml', 'precio': 420},
    
    # Agua Saborizada
    'cunita': {'sku': 'CUNITA-500', 'nombre': 'Cunita 500ml', 'precio': 450},
    'levite': {'sku': 'LEVITE-500', 'nombre': 'Levité Pomelo 500ml', 'precio': 480},
    
    # Isotónicas
    'aquarius': {'sku': 'AQUARIUS-500', 'nombre': 'Aquarius Pomelo 500ml', 'precio': 550},
    'gatorade': {'sku': 'GATORADE-500', 'nombre': 'Gatorade Naranja 500ml', 'precio': 650},
    'powerade': {'sku': 'POWERADE-500', 'nombre': 'Powerade Mountain Blast 500ml', 'precio': 620},
    
    # Energizantes
    'speed': {'sku': 'SPEED-250', 'nombre': 'Speed Energy Drink 250ml', 'precio': 800},
    'red_bull': {'sku': 'REDBULL-250', 'nombre': 'Red Bull 250ml', 'precio': 1200},
    'monster': {'sku': 'MONSTER-473', 'nombre': 'Monster Energy 473ml', 'precio': 1350},
    
    # Cervezas
    'quilmes': {'sku': 'QUILMES-1L', 'nombre': 'Quilmes Cerveza 1L', 'precio': 950},
    'brahma': {'sku': 'BRAHMA-1L', 'nombre': 'Brahma Cerveza 1L', 'precio': 900},
    'andes': {'sku': 'ANDES-1L', 'nombre': 'Andes Cerveza 1L', 'precio': 850},
    'stella': {'sku': 'STELLA-473', 'nombre': 'Stella Artois 473ml', 'precio': 1100},
    'corona': {'sku': 'CORONA-355', 'nombre': 'Corona Extra 355ml', 'precio': 1300},
    
    # Jugos
    'cepita': {'sku': 'CEPITA-1L', 'nombre': 'Cepita Naranja 1L', 'precio': 850},
    'baggio': {'sku': 'BAGGIO-1L', 'nombre': 'Baggio Multifruta 1L', 'precio': 750},
    'bc': {'sku': 'BC-1L', 'nombre': 'BC Naranja 1L', 'precio': 700}
}

def preprocess_image(image_data):
    """Preprocesar imagen para YOLO"""
    try:
        # Decodificar imagen base64
        if isinstance(image_data, str):
            image_data = base64.b64decode(image_data.split(',')[1])
        
        # Convertir a PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convertir a RGB si es necesario
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convertir a numpy array
        image_array = np.array(image)
        
        return image_array
    except Exception as e:
        print(f"❌ Error preprocesando imagen: {e}")
        return None

def detect_beverages(image):
    """Detectar bebidas en la imagen usando YOLO"""
    if model is None:
        return []
    
    try:
        # Ejecutar detección
        results = model(image, conf=CONFIDENCE_THRESHOLD)
        
        detections = []
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    # Obtener coordenadas y confianza
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = box.conf[0].cpu().numpy()
                    class_id = int(box.cls[0].cpu().numpy())
                    
                    # Obtener nombre de la clase
                    class_name = model.names[class_id]
                    
                    detections.append({
                        'class_name': class_name,
                        'confidence': float(confidence),
                        'bbox': [float(x1), float(y1), float(x2), float(y2)]
                    })
        
        return detections
    except Exception as e:
        print(f"❌ Error en detección: {e}")
        return []

def map_detection_to_beverage(detection):
    """Mapear detección YOLO a bebida en nuestro catálogo"""
    class_name = detection['class_name'].lower()
    confidence = detection['confidence']
    
    # Mapeo inteligente de clases YOLO a bebidas
    mapping = {
        'coca_cola': ['coca', 'cola', 'coca-cola'],
        'coca_cola_1.5l': ['coca', 'cola', 'coca-cola', '1.5l', 'litro'],
        'coca_cola_zero': ['coca', 'zero', 'coca-cola', 'zero'],
        'pepsi': ['pepsi'],
        'pepsi_1.5l': ['pepsi', '1.5l', 'litro'],
        'sprite': ['sprite'],
        '7up': ['7up', '7-up'],
        'fanta': ['fanta'],
        'mirinda': ['mirinda'],
        'agua_villa': ['agua', 'villa', 'water'],
        'agua_villa_1.5l': ['agua', 'villa', 'water', '1.5l', 'litro'],
        'agua_eco': ['agua', 'eco', 'water'],
        'villavicencio': ['villavicencio', 'agua', 'water'],
        'cunita': ['cunita'],
        'levite': ['levite'],
        'aquarius': ['aquarius'],
        'gatorade': ['gatorade'],
        'powerade': ['powerade'],
        'speed': ['speed'],
        'red_bull': ['red', 'bull', 'redbull'],
        'monster': ['monster'],
        'quilmes': ['quilmes', 'cerveza', 'beer'],
        'brahma': ['brahma', 'cerveza', 'beer'],
        'andes': ['andes', 'cerveza', 'beer'],
        'stella': ['stella', 'artois', 'cerveza', 'beer'],
        'corona': ['corona', 'cerveza', 'beer'],
        'cepita': ['cepita', 'jugo', 'juice'],
        'baggio': ['baggio', 'jugo', 'juice'],
        'bc': ['bc', 'jugo', 'juice']
    }
    
    # Buscar coincidencia
    for beverage_key, keywords in mapping.items():
        for keyword in keywords:
            if keyword in class_name:
                beverage_info = BEVERAGES_DB.get(beverage_key)
                if beverage_info:
                    return {
                        'sku': beverage_info['sku'],
                        'nombre': beverage_info['nombre'],
                        'precio': beverage_info['precio'],
                        'confidence': confidence,
                        'detection': detection
                    }
    
    # Si no hay coincidencia exacta, devolver genérico
    return {
        'sku': 'UNKNOWN',
        'nombre': f'Producto detectado: {class_name}',
        'precio': 0,
        'confidence': confidence,
        'detection': detection
    }

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/recognize', methods=['POST'])
def recognize():
    """Reconocer bebidas en imagen"""
    try:
        # Obtener imagen
        if 'image' not in request.files:
            return jsonify({'error': 'No se proporcionó imagen'}), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({'error': 'Archivo de imagen vacío'}), 400
        
        # Leer imagen
        image_data = image_file.read()
        
        # Preprocesar imagen
        image_array = preprocess_image(image_data)
        if image_array is None:
            return jsonify({'error': 'Error procesando imagen'}), 400
        
        # Detectar bebidas
        detections = detect_beverages(image_array)
        
        if not detections:
            return jsonify({
                'success': True,
                'items': [],
                'message': 'No se detectaron bebidas en la imagen'
            })
        
        # Mapear detecciones a bebidas
        recognized_items = []
        for detection in detections:
            beverage = map_detection_to_beverage(detection)
            if beverage['sku'] != 'UNKNOWN':
                recognized_items.append({
                    'sku': beverage['sku'],
                    'nombre': beverage['nombre'],
                    'precio': beverage['precio'],
                    'confidence': beverage['confidence'],
                    'cantidad': 1
                })
        
        return jsonify({
            'success': True,
            'items': recognized_items,
            'detections': len(detections),
            'recognized': len(recognized_items)
        })
        
    except Exception as e:
        print(f"❌ Error en reconocimiento: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@app.route('/classes', methods=['GET'])
def get_classes():
    """Obtener clases disponibles del modelo"""
    if model is None:
        return jsonify({'error': 'Modelo no cargado'}), 500
    
    return jsonify({
        'classes': list(model.names.values()),
        'num_classes': len(model.names)
    })

if __name__ == '__main__':
    print("🚀 Iniciando SCANIX AI Service...")
    print(f"📁 Modelo: {MODEL_PATH}")
    print(f"🎯 Confianza mínima: {CONFIDENCE_THRESHOLD}")
    print("🌐 Servidor en http://localhost:5000")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
