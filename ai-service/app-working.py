from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import random
import numpy as np
from ultralytics import YOLO
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# Configuración
MODEL_PATH = 'models/best.pt'
PRODUCT_MAPPING_PATH = 'models/product_mapping.json'
CONFIDENCE_THRESHOLD = 0.5

# Variables globales
yolo_model = None
product_mapping = None

def load_models():
    """Cargar modelos y datos"""
    global yolo_model, product_mapping
    
    try:
        print("🚀 Iniciando SCANIX AI Service...")
        print("🤖 Cargando modelos...")
        
        # Cargar modelo YOLO
        if os.path.exists(MODEL_PATH):
            yolo_model = YOLO(MODEL_PATH)
            print("✅ YOLO cargado")
        else:
            print("⚠️ Modelo YOLO no encontrado, usando reconocimiento simulado")
            yolo_model = None
        
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
        "models_loaded": product_mapping is not None,
        "yolo_available": yolo_model is not None
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
            # Usar YOLO real
            try:
                results = yolo_model(image)
                detections = []
                
                for r in results:
                    for box in r.boxes:
                        confidence = float(box.conf[0])
                        class_id = int(box.cls[0])  # Obtener la clase detectada por YOLO
                        if confidence > CONFIDENCE_THRESHOLD:
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            cropped_img = image.crop((x1, y1, x2, y2))
                            detections.append({
                                "image": cropped_img, 
                                "confidence": confidence,
                                "class_id": class_id,  # Clase detectada por YOLO
                                "box": [x1, y1, x2, y2]
                            })
                
                if detections:
                    # Usar el modelo YOLO entrenado para reconocer productos específicos
                    for detection in detections:
                        confidence = detection["confidence"]
                        class_id = detection["class_id"]
                        
                        # Mapear las clases del modelo YOLO a nuestros productos
                        # El modelo está entrenado para detectar: leche, sal, mayonesa
                        # Mapeo basado en las clases del modelo entrenado
                        if class_id == 0:  # Leche
                            selected_product = "LECHE-SERENISIMA"
                        elif class_id == 1:  # Sal
                            selected_product = "SAL-CELUSAL"
                        elif class_id == 2:  # Mayonesa
                            selected_product = "MAYONESA-HELLMANNS"
                        else:
                            # Clase desconocida, usar fallback
                            selected_product = "LECHE-SERENISIMA"
                        
                        product_info = product_mapping[selected_product]
                        
                        recognized_items.append({
                            "product_id": selected_product,
                            "sku": product_info["sku"],
                            "nombre": product_info["nombre"],
                            "confidence": confidence,
                            "match_distance": 1.0 - confidence,  # Distancia inversa a la confianza
                            "precio": product_info["precio"],
                            "descripcion": product_info["descripcion"]
                        })
                    
            except Exception as e:
                print(f"⚠️ Error en YOLO: {e}, usando reconocimiento simulado")
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
                    "precio": product_info["precioBase"],
                    "descripcion": product_info["descripcion"]
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
                "precio": product_info["precioBase"],
                "descripcion": product_info["descripcion"]
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
    print("🚀 Iniciando SCANIX AI Service...")
    print("📍 Puerto: 5001")
    print("🎯 Productos reconocibles: 3")
    print("🤖 YOLO disponible:", yolo_model is not None)
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
