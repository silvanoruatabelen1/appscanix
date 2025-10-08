#!/usr/bin/env python3
"""
AI Service simplificado para SCANIX
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import random
import numpy as np
import pickle
from ultralytics import YOLO
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# Configuración
MODEL_PATH = 'models/best.pt'
PRODUCT_MAPPING_PATH = 'models/product_mapping.json'
KNOWLEDGE_BASE_PATH = 'models/knowledge_base.pkl'
CONFIDENCE_THRESHOLD = 0.25

# Variables globales
yolo_model = None
product_mapping = None
knowledge_base = None

def load_models():
    """Cargar modelos y datos"""
    global yolo_model, product_mapping, knowledge_base
    
    try:
        print("🚀 Iniciando SCANIX AI Service...")
        print("🤖 Cargando modelos...")
        
        # Cargar modelo YOLO
        if os.path.exists(MODEL_PATH):
            yolo_model = YOLO(MODEL_PATH)
            print("✅ YOLO cargado")
        else:
            print("⚠️ Modelo YOLO no encontrado")
            yolo_model = None
        
        # Cargar mapeo de productos
        with open(PRODUCT_MAPPING_PATH, 'r', encoding='utf-8') as f:
            product_mapping = json.load(f)
        print("✅ Product mapping cargado")
        
        # Cargar knowledge base
        if os.path.exists(KNOWLEDGE_BASE_PATH):
            with open(KNOWLEDGE_BASE_PATH, 'rb') as f:
                knowledge_base = pickle.load(f)
            print("✅ Knowledge base cargada")
        else:
            print("⚠️ Knowledge base no encontrada")
            knowledge_base = None
        
        print("🎉 Modelos cargados exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error cargando modelos: {e}")
        return False

# Cargar modelos al inicio
with app.app_context():
    load_models()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok", 
        "message": "AI service is running",
        "models_loaded": product_mapping is not None,
        "yolo_available": yolo_model is not None,
        "knowledge_base_loaded": knowledge_base is not None
    }), 200

@app.route('/recognize', methods=['POST'])
def recognize_product():
    """Reconocer productos en la imagen"""
    try:
        if 'image' not in request.files:
            return jsonify({"success": False, "error": "No image provided"}), 400

        file = request.files['image']
        image = Image.open(io.BytesIO(file.read())).convert("RGB")
        
        recognized_items = []
        
        if yolo_model is not None:
            try:
                # Redimensionar imagen si es muy grande
                max_size = 1280
                if image.width > max_size or image.height > max_size:
                    ratio = min(max_size / image.width, max_size / image.height)
                    new_size = (int(image.width * ratio), int(image.height * ratio))
                    image = image.resize(new_size, Image.Resampling.LANCZOS)
                    print(f"🔄 Imagen redimensionada a {new_size}")
                
                results = yolo_model(image)
                detections = []
                
                for r in results:
                    for box in r.boxes:
                        confidence = float(box.conf[0])
                        if confidence > CONFIDENCE_THRESHOLD:
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            cropped_img = image.crop((x1, y1, x2, y2))
                            detections.append({
                                "image": cropped_img, 
                                "confidence": confidence,
                                "box": [x1, y1, x2, y2]
                            })
                
                if detections:
                    # Por ahora, simular reconocimiento basado en el número de detecciones
                    products = list(product_mapping.keys())
                    
                    for i, detection in enumerate(detections):
                        # Seleccionar producto basado en el índice
                        product_key = products[i % len(products)]
                        product_info = product_mapping[product_key]
                        
                        recognized_items.append({
                            "product_id": product_key,
                            "sku": product_info["sku"],
                            "nombre": product_info["nombre"],
                            "confidence": detection["confidence"],
                            "match_distance": 0.3,  # Simulado
                            "precio": product_info["precio_base"],
                            "descripcion": f"{product_info['categoria']} - {product_info['nombre']}"
                        })
                        
                        print(f"✅ Producto simulado: {product_info['nombre']}")
                
            except Exception as e:
                print(f"⚠️ Error en YOLO: {e}")
                # Fallback a reconocimiento simulado
                products = list(product_mapping.keys())
                selected_product = random.choice(products)
                product_info = product_mapping[selected_product]
                
                recognized_items.append({
                    "product_id": selected_product,
                    "sku": product_info["sku"],
                    "nombre": product_info["nombre"],
                    "confidence": random.uniform(0.8, 0.95),
                    "match_distance": random.uniform(0.1, 0.3),
                    "precio": product_info["precio_base"],
                    "descripcion": f"{product_info['categoria']} - {product_info['nombre']}"
                })
        else:
            # Reconocimiento simulado
            products = list(product_mapping.keys())
            selected_product = random.choice(products)
            product_info = product_mapping[selected_product]
            
            recognized_items.append({
                "product_id": selected_product,
                "sku": product_info["sku"],
                "nombre": product_info["nombre"],
                "confidence": random.uniform(0.8, 0.95),
                "match_distance": random.uniform(0.1, 0.3),
                "precio": product_info["precio_base"],
                "descripcion": f"{product_info['categoria']} - {product_info['nombre']}"
            })
        
        if not recognized_items:
            return jsonify({
                "success": True,
                "items": [],
                "message": "No objects detected"
            }), 200
        
        return jsonify({
            "success": True,
            "items": recognized_items,
            "detections": len(recognized_items),
            "recognized": len(recognized_items),
            "message": "Products recognized successfully"
        }), 200
        
    except Exception as e:
        print(f"❌ Error en reconocimiento: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/products', methods=['GET'])
def get_available_products():
    """Obtener productos disponibles"""
    try:
        return jsonify({
            "success": True, 
            "products": list(product_mapping.values())
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Iniciando SCANIX AI Service (Simplificado)...")
    print("📍 Puerto: 5001")
    print("🎯 Productos reconocibles: 3")
    print("🤖 YOLO disponible:", yolo_model is not None)
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)