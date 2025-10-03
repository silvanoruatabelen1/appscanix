@echo off
chcp 65001 >nul
title SCANIX - Sistema Completo con YOLO

echo.
echo ===============================================
echo   SCANIX - Sistema de Gestión Inteligente
echo   Versión COMPLETA con YOLO
echo ===============================================
echo.
echo 🚀 Iniciando SCANIX con reconocimiento YOLO...
echo.

echo 🧹 Limpiando procesos anteriores...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul
Start-Sleep -Seconds 2

echo.
echo 🤖 Iniciando AI Service (YOLO) - Puerto 5000...
start "SCANIX AI Service" cmd /k "cd ai-service && python app.py"
echo ⏳ Esperando que el AI service inicie...
Start-Sleep -Seconds 5

echo.
echo 🔧 Iniciando Backend (Node.js) - Puerto 3001...
start "SCANIX Backend" cmd /k "node scanix-server-fixed.js"
echo ⏳ Esperando que el backend inicie...
Start-Sleep -Seconds 3

echo.
echo 🎨 Iniciando Frontend (React) - Puerto 5173...
start "SCANIX Frontend" cmd /k "cd scanix-smart-shop-main && npm run dev"
echo ⏳ Esperando que el frontend inicie...
Start-Sleep -Seconds 5

echo.
echo ✅ SCANIX iniciado exitosamente!
echo.
echo 📱 Información de acceso:
echo    🌐 Aplicación: http://localhost:5173
echo    🔧 Backend API: http://localhost:3001/api/health
echo    🤖 AI Service: http://localhost:5000/health
echo    👤 Usuario Admin: admin / admin123
echo.
echo 🎯 FUNCIONALIDADES DISPONIBLES:
echo    ✅ Autenticación con roles (Admin, Operador, Cajero)
echo    ✅ Gestión completa de usuarios
echo    ✅ Catálogo de productos con precios escalonados
echo    ✅ Control de stock por depósitos
echo    ✅ Sistema de transferencias con wizard
echo    ✅ Generación de tickets de venta
echo    ✅ Dashboard con reportes y KPIs
echo    ✅ Exportación a CSV y PDF
echo    ✅ Reconocimiento YOLO de bebidas argentinas
echo    ✅ UI responsive y profesional
echo.
echo 🔥 NUEVAS FUNCIONALIDADES YOLO:
echo    ✅ AI Service con Flask + YOLOv8
echo    ✅ Componente BeverageRecognition
echo    ✅ Proxy en backend Node.js
echo    ✅ Mapeo de 30 bebidas argentinas
echo    ✅ Reconocimiento automático
echo.
echo 🛠️ Para detener: Cierra las ventanas del backend, frontend y AI service
echo.
echo 🎓 Proyecto desarrollado para UTN San Francisco
echo    Materia: Ingeniería y Calidad de Software
echo.
pause
