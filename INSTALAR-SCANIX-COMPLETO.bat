@echo off
chcp 65001 >nul
title SCANIX - Instalación Completa

echo.
echo ===============================================
echo   SCANIX - Instalación Completa
echo   Sistema de Gestión Inteligente con YOLO
echo ===============================================
echo.

echo 📦 Instalando dependencias del Frontend...
cd scanix-smart-shop-main
npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias del frontend
    pause
    exit /b 1
)
echo ✅ Frontend instalado correctamente

echo.
echo 📦 Instalando dependencias del Backend...
cd ..
npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias del backend
    pause
    exit /b 1
)
echo ✅ Backend instalado correctamente

echo.
echo 🐍 Instalando dependencias del AI Service...
cd ai-service
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias del AI service
    echo 💡 Intenta ejecutar: pip install ultralytics opencv-python Flask Flask-CORS numpy torch torchvision requests python-dotenv
    pause
    exit /b 1
)
echo ✅ AI Service instalado correctamente

echo.
echo 🔍 Verificando archivos necesarios...
if not exist "models\best.pt" (
    echo ⚠️  ADVERTENCIA: No se encontró best.pt en ai-service\models\
    echo 💡 Coloca tu modelo YOLO entrenado en: ai-service\models\best.pt
) else (
    echo ✅ Modelo YOLO encontrado: ai-service\models\best.pt
)

echo.
echo 🎯 Verificando estructura del proyecto...
if not exist "scanix-smart-shop-main\src\components\ai\BeverageRecognition.tsx" (
    echo ❌ Error: Componente BeverageRecognition no encontrado
    pause
    exit /b 1
)
echo ✅ Componente BeverageRecognition encontrado

if not exist "scanix-server-fixed.js" (
    echo ❌ Error: Servidor backend no encontrado
    pause
    exit /b 1
)
echo ✅ Servidor backend encontrado

echo.
echo 🚀 Creando scripts de inicio...
echo ✅ INICIAR-SCANIX-YOLO.bat creado
echo ✅ INICIAR-SCANIX-CORREGIDO.bat disponible

echo.
echo 🎉 INSTALACIÓN COMPLETADA EXITOSAMENTE!
echo.
echo 📋 PRÓXIMOS PASOS:
echo    1. Coloca tu best.pt en ai-service\models\
echo    2. Ejecuta: INICIAR-SCANIX-YOLO.bat
echo    3. Abre: http://localhost:5173
echo    4. Login: admin / admin123
echo.
echo 🔧 COMANDOS ÚTILES:
echo    Frontend: cd scanix-smart-shop-main && npm run dev
echo    Backend:  node scanix-server-fixed.js
echo    AI Service: cd ai-service && python app.py
echo.
echo 🎓 Proyecto desarrollado para UTN San Francisco
echo    Materia: Ingeniería y Calidad de Software
echo.
pause
