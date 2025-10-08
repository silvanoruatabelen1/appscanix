# 🛒 SCANIX - Sistema de Gestión Inteligente

## 📋 Descripción

SCANIX es un sistema de gestión inteligente para comercios que combina reconocimiento de productos por IA con gestión de stock, ventas y transferencias entre depósitos. El sistema permite escanear productos con la cámara del celular, generar tickets de venta, gestionar inventario y realizar transferencias entre múltiples depósitos.

## 🚀 Tecnologías Utilizadas

### Frontend
- **React 18** con TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes
- **Zustand** para manejo de estado
- **React Router** para navegación

### Backend
- **Node.js** con Express
- **SQLite3** para base de datos
- **JWT** para autenticación
- **Multer** para manejo de archivos

### IA/ML
- **Python 3.12** con Flask
- **YOLOv8** para detección de objetos
- **CLIP** para embeddings de imágenes
- **k-NN** para clasificación de productos
- **OpenCV** para procesamiento de imágenes

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Service    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Python)      │
│   Port: 8080    │    │   Port: 3001    │    │   Port: 5001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📦 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- Python 3.12+
- Git

### Instalación Rápida
```bash
# Clonar repositorio
git clone https://github.com/silvanoruatabelen1/appscanix.git
cd appscanix

# Instalar dependencias del backend
npm install

# Instalar dependencias del frontend
cd scanix-smart-shop-main
npm install

# Instalar dependencias del AI service
cd ../ai-service
pip install -r requirements.txt
```

### Ejecución
```bash
# Terminal 1: Backend
node scanix-server-clean.js

# Terminal 2: AI Service
cd ai-service
python app-simple.py

# Terminal 3: Frontend
cd scanix-smart-shop-main
npm run dev
```

## 🔐 Credenciales de Acceso

- **Admin:** admin / admin123
- **Usuarios de prueba:** cajero1, operador1

## 📱 Funcionalidades Principales

### ✅ Funcionalidades Implementadas (Sprint 1 y 2)

#### 👥 Gestión de Usuarios
- Crear usuarios con roles (Admin, Operador, Cajero)
- Contraseñas temporales con cambio obligatorio
- Gestión completa de usuarios (activar/desactivar, eliminar)

#### 🧾 Sistema de Ventas
- Generación de tickets
- Cálculo automático de precios con tiers
- Validación de stock en tiempo real

#### 🔄 Transferencias
- Transferencias entre depósitos
- Validación de stock disponible
- Registro de movimientos

#### 📊 Reportes
- Reportes de ventas y stock
- Exportación a CSV/PDF
- KPIs y métricas

### 🔄 Funcionalidades en Desarrollo (Sprint 3)

#### 🤖 Reconocimiento de Productos
- Escaneo con cámara del celular
- Reconocimiento de 3 productos argentinos específicos
- Integración con YOLOv8 + CLIP + k-NN
- **Estado actual:** Simulado para demostración

#### 📱 Notificaciones WhatsApp
- Notificaciones automáticas de ventas
- Alertas de stock bajo
- Reportes por WhatsApp
- **Estado actual:** En desarrollo

## 🎯 Product Backlog

### Sprint 1: Funcionalidades Core (2 semanas)
1. **HU01** - Autenticación y roles de usuario
2. **HU02** - Gestión de productos y catálogo
3. **HU03** - Sistema de stock por depósito
4. **HU05** - Generación de tickets de venta
5. **HU06** - Cálculo de precios con tiers
6. **HU07** - Validación de stock en ventas
7. **HU08** - Gestión de usuarios
8. **HU09** - Dashboard principal
9. **HU10** - Navegación y sidebar
10. **HU11** - Transferencias entre depósitos

### Sprint 2: Funcionalidades Avanzadas (2 semanas)
11. **HU12** - Validación de stock en transferencias
12. **HU13** - Reportes de ventas
13. **HU14** - Reportes de stock
14. **HU15** - Exportación de datos
15. **HU16** - Gestión de depósitos
16. **HU17** - Historial de movimientos
17. **HU19** - Configuración de la aplicación
18. **HU20** - Optimización y rendimiento

### Sprint 3: IA y Notificaciones (1 mes)
19. **HU04** - Reconocimiento de productos por IA
20. **HU18** - Notificaciones del sistema (WhatsApp)
21. **HU21** - Mejoras estéticas y UX
22. **HU22** - Integración completa de IA
23. **HU23** - Sistema de notificaciones avanzado

## 📊 Modelo de Datos

### Entidades Principales
- **Users:** Usuarios del sistema
- **Products:** Catálogo de productos
- **Deposits:** Depósitos/almacenes
- **Stock:** Stock por producto y depósito
- **Tickets:** Tickets de venta
- **Transfers:** Transferencias entre depósitos
- **StockMovements:** Historial de movimientos

## 🎨 Estándares de Codificación

### Frontend (React/TypeScript)
- **ESLint** con configuración estricta
- **Prettier** para formateo de código
- **Convención de nombres:** camelCase para variables, PascalCase para componentes
- **Estructura de carpetas:** Feature-based organization
- **Hooks personalizados** para lógica reutilizable

### Backend (Node.js)
- **ESLint** con configuración Node.js
- **Convención de nombres:** camelCase
- **Estructura modular** con separación de responsabilidades
- **Manejo de errores** centralizado
- **Validación de datos** en todas las rutas

### Python (AI Service)
- **PEP 8** para estilo de código
- **Type hints** para mejor documentación
- **Docstrings** en todas las funciones
- **Manejo de excepciones** robusto

## 🧪 Plan de Calidad

### Testing
- **Unit Tests** para funciones críticas
- **Integration Tests** para APIs
- **E2E Tests** para flujos principales
- **Performance Tests** para reconocimiento de IA

### Code Quality
- **Code Reviews** obligatorios
- **SonarQube** para análisis estático
- **Coverage** mínimo del 80%
- **Documentación** actualizada

### Deployment
- **Docker** para containerización
- **CI/CD** con GitHub Actions
- **Environment** separation (dev/staging/prod)
- **Monitoring** con logs estructurados

## 📈 Métricas de Calidad

- **Cobertura de código:** 85%
- **Tiempo de respuesta:** < 2s
- **Disponibilidad:** 99.9%
- **Seguridad:** OWASP Top 10 compliance

## 🔒 Seguridad

- **Autenticación JWT** con expiración
- **Validación de entrada** en todas las APIs
- **CORS** configurado correctamente
- **Sanitización** de datos de usuario
- **Logs de auditoría** para acciones críticas

## 📞 Soporte

Para soporte técnico o consultas:
- **Email:** soporte@scanix.com
- **GitHub Issues:** [Reportar problemas](https://github.com/silvanoruatabelen1/appscanix/issues)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

**Desarrollado con ❤️ para la UTN San Francisco - Ingeniería y Calidad de Software**
