#!/usr/bin/env python3
"""
Script de prueba simple para verificar que el AI service funcione
"""

import requests
import json

def test_ai_service():
    """Probar el AI service"""
    try:
        # Probar health check
        print("🔍 Probando health check...")
        response = requests.get("http://localhost:5001/health", timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Probar productos disponibles
        print("\n🔍 Probando productos disponibles...")
        response = requests.get("http://localhost:5001/products", timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Probando AI Service...")
    success = test_ai_service()
    if success:
        print("✅ AI Service funcionando correctamente")
    else:
        print("❌ AI Service no está funcionando")
