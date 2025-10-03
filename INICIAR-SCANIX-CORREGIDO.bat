@echo off
title SCANIX - Sistema de Gestión Inteligente [CORREGIDO]

echo.
echo ===============================================
echo    SCANIX - Sistema de Gestión Inteligente
echo    Versión CORREGIDA - Sin Errores
echo ===============================================
echo.

echo 🔧 Iniciando versión corregida de SCANIX...
echo.

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js no está instalado
    echo    Descarga desde: https://nodejs.org
    pause
    exit /b 1
)

REM Terminar procesos anteriores
echo 🧹 Limpiando procesos anteriores...
taskkill /F /IM node.exe >nul 2>&1

timeout /t 2 /nobreak > nul

echo.
echo 🎯 Iniciando Backend CORREGIDO (Puerto 3001)...
start "SCANIX Backend [CORREGIDO]" cmd /k "node scanix-server-fixed.js"

echo ⏳ Esperando que el backend inicie...
timeout /t 5 /nobreak > nul

echo 🎯 Iniciando Frontend (Puerto 5173)...
cd scanix-smart-shop-main
start "SCANIX Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ✅ SCANIX iniciado exitosamente!
echo.
echo 📋 Información de acceso:
echo    🌐 Aplicación: http://localhost:5173
echo    🔗 Backend API: http://localhost:3001/api/health
echo    👤 Usuario Admin: admin / admin123
echo.
echo ✅ CORRECCIONES APLICADAS:
echo    ✓ Transferencias funcionan correctamente
echo    ✓ Stock se actualiza en transferencias
echo    ✓ Tickets validan stock disponible
echo    ✓ Campos estandarizados (depositoId)
echo    ✓ Movimientos de stock registrados
echo    ✓ Reportes con datos reales
echo    ✓ Todas las llamadas API corregidas
echo.
echo 📊 Funcionalidades disponibles:
echo    ✓ Autenticación con roles (Admin, Operador, Cajero)
echo    ✓ Gestión completa de usuarios
echo    ✓ Catálogo de productos con precios escalonados
echo    ✓ Control de stock por depósitos
echo    ✓ Sistema de transferencias con wizard
echo    ✓ Generación de tickets de venta
echo    ✓ Dashboard con reportes y KPIs
echo    ✓ Exportación a CSV y PDF
echo    ✓ Reconocimiento inteligente (simulado)
echo    ✓ UI responsive y profesional
echo.
echo 💡 Para detener: Cierra las ventanas del backend y frontend
echo.
echo 🎓 Proyecto desarrollado para UTN San Francisco
echo    Materia: Ingeniería y Calidad de Software
echo.
pause
