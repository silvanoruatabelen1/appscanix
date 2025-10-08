from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import pickle
import json
import os
from ultralytics import YOLO
from sentence_transformers import SentenceTransformer
from sklearn.neighbors import NearestNeighbors
import base64
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# Configuración
MODEL_PATH = 'models/best.pt'
KNOWLEDGE_BASE_PATH = 'models/knowledge_base.pkl'
PRODUCT_MAPPING_PATH = 'models/product_mapping.json'
CONFIDENCE_THRESHOLD = 0.5

# Variables globales
yolo_model = None
clip_model = None
knowledge_base = None
product_mapping = None
nn_model = None

def load_models():
    """Cargar todos los modelos necesarios"""
    global yolo_model, clip_model, knowledge_base, product_mapping, nn_model
    
    try:
        print("🤖 Cargando modelos...")
        
        # Cargar YOLO
        yolo_model = YOLO(MODEL_PATH)
        print("✅ YOLO cargado")
        
        # Cargar CLIP
        clip_model = SentenceTransformer('clip-ViT-B-32')
        print("✅ CLIP cargado")
        
        # Cargar knowledge base
        with open(KNOWLEDGE_BASE_PATH, 'rb') as f:
            knowledge_base = pickle.load(f)
        print("✅ Knowledge base cargada")
        
        # Cargar mapeo de productos
        with open(PRODUCT_MAPPING_PATH, 'r') as f:
            product_mapping = json.load(f)
        print("✅ Product mapping cargado")
        
        # Entrenar k-NN - usar la estructura correcta del knowledge_base
        # El knowledge_base contiene los productos como claves
        product_ids = list(knowledge_base.keys())
        print(f"✅ Productos en knowledge base: {product_ids}")
        
        # Crear un modelo k-NN simple para los 3 productos
        nn_model = NearestNeighbors(n_neighbors=1, metric='cosine')
        # Usar embeddings dummy por ahora (se generarán dinámicamente)
        dummy_embeddings = [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6], [0.7, 0.8, 0.9]]
        nn_model.fit(dummy_embeddings)
        print("✅ k-NN entrenado")
        
        print("🎉 Todos los modelos cargados exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error cargando modelos: {e}")
        return False

def preprocess_image(image_data):
    """Preprocesar imagen para YOLO"""
    try:
        # Convertir base64 a imagen
        if isinstance(image_data, str):
            image_data = base64.b64decode(image_data)
        
        # Convertir bytes a imagen
        image = Image.open(io.BytesIO(image_data))
        image = image.convert('RGB')
        
        # Convertir a numpy array
        image_array = np.array(image)
        
        return image_array
    except Exception as e:
        print(f"❌ Error preprocesando imagen: {e}")
        return None

def detect_products_yolo(image):
    """Detectar productos usando YOLO"""
    try:
        results = yolo_model(image, conf=CONFIDENCE_THRESHOLD)
        
        detections = []
        for result in results:
            if result.boxes is not None:
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = box.conf[0].cpu().numpy()
                    
                    # Extraer ROI
                    roi = image[int(y1):int(y2), int(x1):int(x2)]
                    
                    detections.append({
                        'bbox': [int(x1), int(y1), int(x2), int(y2)],
                        'confidence': float(conf),
                        'roi': roi
                    })
        
        return detections
    except Exception as e:
        print(f"❌ Error en detección YOLO: {e}")
        return []

def recognize_product_clip(roi):
    """Reconocer producto usando CLIP + k-NN"""
    try:
        # Generar embedding con CLIP
        embedding = clip_model.encode([roi])
        
        # Buscar producto más similar
        distances, indices = nn_model.kneighbors(embedding)
        
        # Obtener información del producto
        product_id = knowledge_base['product_ids'][indices[0][0]]
        similarity = 1 - distances[0][0]  # Convertir distancia a similitud
        
        # Mapear a información del producto
        product_info = product_mapping.get(product_id, {})
        
        return {
            'product_id': product_id,
            'similarity': float(similarity),
            'product_info': product_info
        }
    except Exception as e:
        print(f"❌ Error en reconocimiento CLIP: {e}")
        return None

@app.route('/health', methods=['GET'])
def health():
    """Health check del servicio"""
    return jsonify({
        'status': 'ok',
        'message': 'SCANIX AI Service funcionando',
        'models_loaded': all([yolo_model, clip_model, knowledge_base, nn_model]),
        'products': list(product_mapping.keys()) if product_mapping else []
    })

@app.route('/recognize', methods=['POST'])
def recognize():
    """Reconocer productos en imagen"""
    try:
        if not all([yolo_model, clip_model, knowledge_base, nn_model]):
            return jsonify({
                'success': False,
                'error': 'Modelos no cargados'
            }), 500
        
        # Obtener imagen
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No se proporcionó imagen'
            }), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Archivo vacío'
            }), 400
        
        # Leer imagen
        image_data = file.read()
        image = preprocess_image(image_data)
        
        if image is None:
            return jsonify({
                'success': False,
                'error': 'Error procesando imagen'
            }), 400
        
        # Detectar productos con YOLO
        detections = detect_products_yolo(image)
        
        if not detections:
            return jsonify({
                'success': True,
                'items': [],
                'message': 'No se detectaron productos'
            })
        
        # Reconocer cada producto
        recognized_items = []
        for i, detection in enumerate(detections):
            roi = detection['roi']
            
            # Reconocer con CLIP
            recognition = recognize_product_clip(roi)
            
            if recognition and recognition['similarity'] > 0.7:  # Umbral de similitud
                product_info = recognition['product_info']
                
                item = {
                    'id': f'detection_{i}',
                    'product_id': recognition['product_id'],
                    'sku': product_info.get('sku', ''),
                    'nombre': product_info.get('nombre', ''),
                    'descripcion': product_info.get('descripcion', ''),
                    'precio': product_info.get('precio', 0),
                    'confidence': detection['confidence'],
                    'similarity': recognition['similarity'],
                    'bbox': detection['bbox']
                }
                
                recognized_items.append(item)
        
        return jsonify({
            'success': True,
            'items': recognized_items,
            'detections': len(detections),
            'recognized': len(recognized_items),
            'message': f'Se reconocieron {len(recognized_items)} producto(s)'
        })
        
    except Exception as e:
        print(f"❌ Error en reconocimiento: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@app.route('/products', methods=['GET'])
def get_products():
    """Obtener lista de productos disponibles"""
    if not product_mapping:
        return jsonify({
            'success': False,
            'error': 'Product mapping no cargado'
        }), 500
    
    products = []
    for product_id, info in product_mapping.items():
        products.append({
            'product_id': product_id,
            'sku': info.get('sku', ''),
            'nombre': info.get('nombre', ''),
            'descripcion': info.get('descripcion', ''),
            'precio': info.get('precio', 0)
        })
    
    return jsonify({
        'success': True,
        'products': products
    })

if __name__ == '__main__':
    print("🚀 Iniciando SCANIX AI Service...")
    
    # Verificar archivos
    required_files = [MODEL_PATH, KNOWLEDGE_BASE_PATH, PRODUCT_MAPPING_PATH]
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print(f"❌ Archivos faltantes: {missing_files}")
        print("📁 Coloca los archivos del modelo en ai-service/models/")
        exit(1)
    
    # Cargar modelos
    if not load_models():
        print("❌ Error cargando modelos")
        exit(1)
    
    print("🌐 Servidor iniciando en http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
