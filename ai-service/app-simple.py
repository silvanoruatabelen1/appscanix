from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import random

app = Flask(__name__)
CORS(app)

# Configuración
PRODUCT_MAPPING_PATH = 'models/product_mapping.json'

# Variables globales
product_mapping = None

def load_models():
    """Cargar modelos y datos"""
    global product_mapping
    
    try:
        # Cargar mapeo de productos
        with open(PRODUCT_MAPPING_PATH, 'r', encoding='utf-8') as f:
            product_mapping = json.load(f)
        print("✅ Product mapping cargado")
        
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
        "models_loaded": product_mapping is not None
    }), 200

@app.route('/recognize', methods=['POST'])
def recognize_product():
    """Reconocer productos en la imagen"""
    try:
        if 'image' not in request.files:
            return jsonify({"success": False, "error": "No image provided"}), 400

        file = request.files['image']
        
        # Simular reconocimiento - devolver uno de los 3 productos aleatoriamente
        products = list(product_mapping.keys())
        selected_product = random.choice(products)
        product_info = product_mapping[selected_product]
        
        # Simular confianza alta
        confidence = random.uniform(0.8, 0.95)
        
        recognized_items = [{
            "product_id": selected_product,
            "sku": product_info["sku"],
            "nombre": product_info["nombre"],
            "confidence": confidence,
            "match_distance": random.uniform(0.1, 0.3),
            "precio": product_info["precioBase"],
            "descripcion": product_info["descripcion"]
        }]
        
        return jsonify({
            "success": True,
            "items": recognized_items,
            "detections": 1,
            "recognized": 1,
            "message": "Product recognized successfully"
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
    print("🚀 Iniciando SCANIX AI Service (Versión Simplificada)...")
    print("📍 Puerto: 5001")
    print("🎯 Productos reconocibles: 3")
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
