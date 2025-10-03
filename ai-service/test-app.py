"""
SCANIX AI Service - Test Version
Versión simplificada para probar Flask
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuración
MODEL_PATH = 'models/best.pt'
CONFIDENCE_THRESHOLD = 0.5

# Verificar si el modelo existe
model_exists = os.path.exists(MODEL_PATH)
print(f"🤖 Modelo YOLO: {'✅ Encontrado' if model_exists else '❌ No encontrado'}")
print(f"📁 Ruta del modelo: {MODEL_PATH}")
print(f"📁 Directorio actual: {os.getcwd()}")

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'ok',
        'model_exists': model_exists,
        'model_path': MODEL_PATH,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/recognize', methods=['POST'])
def recognize():
    """Reconocer bebidas en imagen (versión de prueba)"""
    try:
        # Obtener imagen
        if 'image' not in request.files:
            return jsonify({'error': 'No se proporcionó imagen'}), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({'error': 'Archivo de imagen vacío'}), 400
        
        # Simular reconocimiento
        mock_items = [
            {
                'sku': 'COCA-500',
                'nombre': 'Coca Cola 500ml',
                'precio': 650,
                'confidence': 0.95,
                'cantidad': 1
            },
            {
                'sku': 'SPRITE-500',
                'nombre': 'Sprite 500ml',
                'precio': 620,
                'confidence': 0.87,
                'cantidad': 1
            }
        ]
        
        return jsonify({
            'success': True,
            'items': mock_items,
            'detections': 2,
            'recognized': 2,
            'message': 'Reconocimiento simulado (modo prueba)'
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
    return jsonify({
        'classes': ['coca_cola', 'sprite', 'fanta', 'pepsi'],
        'num_classes': 4
    })

if __name__ == '__main__':
    print("🚀 Iniciando SCANIX AI Service (Modo Prueba)...")
    print(f"📁 Modelo: {MODEL_PATH}")
    print(f"🎯 Confianza mínima: {CONFIDENCE_THRESHOLD}")
    print("🌐 Servidor en http://localhost:5000")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
