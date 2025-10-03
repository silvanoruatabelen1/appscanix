# 🚀 SCANIX - Sistema de Gestión Inteligente

## 📋 Descripción
Sistema completo de gestión de inventario con reconocimiento de productos usando YOLO. Desarrollado para UTN San Francisco - Materia: Ingeniería y Calidad de Software.

## ✨ Funcionalidades

### 🔐 Autenticación y Roles
- **Admin**: Gestión completa del sistema
- **Operador**: Gestión de productos, stock y transferencias
- **Cajero**: Escaneo y ventas

### 📦 Gestión de Productos
- Catálogo con 30 bebidas argentinas
- Precios escalonados (tiers)
- Control de stock por depósitos
- Transferencias entre depósitos

### 🤖 Reconocimiento YOLO
- AI Service con Flask + YOLOv8
- Detección automática de bebidas
- Mapeo inteligente a productos
- Componente React integrado

### 📊 Reportes y Analytics
- Dashboard con KPIs
- Exportación CSV y PDF
- Reportes de ventas y stock
- Gráficos interactivos

## 🛠️ Tecnologías

### Frontend
- **React 18** + TypeScript
- **Vite** (build tool)
- **shadcn/ui** (componentes)
- **Tailwind CSS** (estilos)
- **Zustand** (estado)

### Backend
- **Node.js** + Express
- **SQLite3** (base de datos)
- **Multer** (archivos)
- **Axios** (HTTP client)

### AI Service
- **Python 3.12**
- **Flask** (API)
- **YOLOv8** (reconocimiento)
- **OpenCV** (procesamiento)
- **Ultralytics** (modelo)

## 🚀 Instalación Rápida

### 1. Clonar Repositorio
```bash
git clone <tu-repositorio>
cd scanix-smart-shop-main1
```

### 2. Instalación Automática
```bash
# Windows
INSTALAR-SCANIX-COMPLETO.bat

# Manual
cd scanix-smart-shop-main && npm install
cd .. && npm install
cd ai-service && pip install -r requirements.txt
```

### 3. Configurar Modelo YOLO
```bash
# Colocar tu modelo entrenado
cp tu-best.pt ai-service/models/best.pt
```

### 4. Iniciar Sistema
```bash
# Windows (automático)
INICIAR-SCANIX-YOLO.bat

# Manual (3 terminales)
# Terminal 1: AI Service
cd ai-service && python app.py

# Terminal 2: Backend
node scanix-server-fixed.js

# Terminal 3: Frontend
cd scanix-smart-shop-main && npm run dev
```

## 🌐 Acceso

- **Aplicación**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/health
- **AI Service**: http://localhost:5000/health
- **Usuario Admin**: admin / admin123

## 📁 Estructura del Proyecto

```
scanix-smart-shop-main1/
├── scanix-smart-shop-main/          # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/
│   │   │   │   └── BeverageRecognition.tsx
│   │   │   └── ui/                  # shadcn/ui
│   │   ├── pages/                   # Páginas principales
│   │   ├── services/                # API calls
│   │   ├── store/                   # Zustand stores
│   │   └── utils/                   # Utilidades
│   └── package.json
├── ai-service/                      # AI Service Python
│   ├── app.py                       # Flask API
│   ├── requirements.txt             # Dependencias Python
│   └── models/
│       └── best.pt                  # Modelo YOLO
├── scanix-server-fixed.js          # Backend Node.js
├── INICIAR-SCANIX-YOLO.bat          # Script de inicio
└── INSTALAR-SCANIX-COMPLETO.bat     # Script de instalación
```

## 🔧 Comandos Útiles

### Frontend
```bash
cd scanix-smart-shop-main
npm run dev          # Desarrollo
npm run build        # Producción
npm run preview      # Preview
```

### Backend
```bash
node scanix-server-fixed.js
```

### AI Service
```bash
cd ai-service
python app.py
```

### NPM Scripts
```bash
npm run install-ai   # Instalar dependencias Python
npm run start-ai     # Iniciar AI service
npm run ai:dev       # Modo desarrollo
```

## 🎯 Funcionalidades por Rol

### 👑 Admin
- ✅ Gestión de usuarios
- ✅ Configuración del sistema
- ✅ Reportes completos
- ✅ Gestión de productos

### 🔧 Operador
- ✅ Gestión de productos
- ✅ Control de stock
- ✅ Transferencias
- ✅ Reportes

### 💰 Cajero
- ✅ Escaneo de productos
- ✅ Generación de tickets
- ✅ Ventas

## 🤖 Reconocimiento YOLO

### Configuración
1. Colocar `best.pt` en `ai-service/models/`
2. Entrenar modelo con bebidas argentinas
3. Configurar mapeo en `app.py`

### Uso
1. Subir imagen en ScanPage
2. YOLO detecta productos
3. Mapea a catálogo argentino
4. Agrega al carrito automáticamente

## 📊 Endpoints API

### Backend (Node.js - Puerto 3001)
```
GET  /api/health                    # Estado del sistema
POST /api/auth/login                # Login
POST /api/auth/register             # Registro
GET  /api/products                  # Productos
POST /api/transfers                 # Transferencias
GET  /api/reports/sales             # Reportes ventas
GET  /api/reports/stock             # Reportes stock
POST /api/recognition/recognize     # Reconocimiento YOLO
```

### AI Service (Flask - Puerto 5000)
```
GET  /health                        # Estado AI
POST /recognize                     # Reconocimiento
GET  /classes                       # Clases del modelo
```

## 🐛 Troubleshooting

### AI Service no inicia
```bash
# Verificar dependencias
cd ai-service
pip install -r requirements.txt

# Verificar modelo
ls models/best.pt

# Ejecutar en primer plano
python app.py
```

### Backend no conecta
```bash
# Verificar puerto 3001
netstat -an | findstr 3001

# Reinstalar dependencias
npm install
```

### Frontend no carga
```bash
# Verificar puerto 5173
netstat -an | findstr 5173

# Limpiar cache
npm run dev -- --force
```

## 📈 Próximas Mejoras

- [ ] Integración con WhatsApp
- [ ] Notificaciones push
- [ ] Múltiples modelos YOLO
- [ ] API REST completa
- [ ] Docker containers
- [ ] CI/CD pipeline

## 👥 Contribuidores

- **Desarrollador Principal**: SCANIX Team
- **Institución**: UTN San Francisco
- **Materia**: Ingeniería y Calidad de Software

## 📄 Licencia

Proyecto académico - UTN San Francisco

---

**🎓 Desarrollado para UTN San Francisco**  
**Materia: Ingeniería y Calidad de Software**
