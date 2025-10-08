@echo off
echo ========================================
echo    SCANIX - Sistema Completo con IA
echo ========================================
echo.

echo 🚀 Iniciando todos los servicios...

:: Verificar que Python esté instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no está instalado o no está en el PATH
    echo 📥 Instala Python desde https://python.org
    pause
    exit /b 1
)

:: Verificar que Node.js esté instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado o no está en el PATH
    echo 📥 Instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Python y Node.js encontrados

:: Crear directorio ai-service si no existe
if not exist "ai-service" (
    echo 📁 Creando directorio ai-service...
    mkdir ai-service
    mkdir ai-service\models
)

:: Verificar archivos del modelo
echo 🔍 Verificando archivos del modelo...
if not exist "ai-service\models\best.pt" (
    echo ❌ Archivo best.pt no encontrado en ai-service\models\
    echo 📥 Coloca el archivo best.pt en ai-service\models\
    pause
    exit /b 1
)

if not exist "ai-service\models\knowledge_base.pkl" (
    echo ❌ Archivo knowledge_base.pkl no encontrado en ai-service\models\
    echo 📥 Coloca el archivo knowledge_base.pkl en ai-service\models\
    pause
    exit /b 1
)

if not exist "ai-service\models\product_mapping.json" (
    echo ❌ Archivo product_mapping.json no encontrado en ai-service\models\
    echo 📥 Coloca el archivo product_mapping.json en ai-service\models\
    pause
    exit /b 1
)

echo ✅ Archivos del modelo encontrados

:: Instalar dependencias del AI service
echo 📦 Instalando dependencias del AI service...
cd ai-service
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Error instalando dependencias de Python
    pause
    exit /b 1
)
cd ..

:: Instalar dependencias del frontend
echo 📦 Instalando dependencias del frontend...
cd scanix-smart-shop-main
npm install
if errorlevel 1 (
    echo ❌ Error instalando dependencias de Node.js
    pause
    exit /b 1
)
cd ..

:: Instalar dependencias del backend
echo 📦 Instalando dependencias del backend...
npm install multer axios form-data
if errorlevel 1 (
    echo ❌ Error instalando dependencias del backend
    pause
    exit /b 1
)

echo ✅ Todas las dependencias instaladas

:: Iniciar AI Service
echo 🤖 Iniciando AI Service (Puerto 5001)...
start "SCANIX AI Service" cmd /k "cd ai-service && python app.py"

:: Esperar un momento
timeout /t 5 /nobreak >nul

:: Iniciar Backend
echo 🚀 Iniciando Backend (Puerto 3001)...
start "SCANIX Backend" cmd /k "node scanix-server-clean.js"

:: Esperar un momento
timeout /t 5 /nobreak >nul

:: Iniciar Frontend
echo 🌐 Iniciando Frontend (Puerto 8080)...
start "SCANIX Frontend" cmd /k "cd scanix-smart-shop-main && npm run dev"

echo.
echo ========================================
echo ✅ SCANIX - Sistema Completo Iniciado
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:8080
echo 🚀 Backend:  http://localhost:3001
echo 🤖 AI Service: http://localhost:5001
echo.
echo 📋 Productos reconocibles:
echo   • Sal Celusal
echo   • Leche La Serenísima
echo   • Mayonesa Hellmann's
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
