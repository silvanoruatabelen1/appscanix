# 🛒 SCANIX - Smart Shop System

**Sistema inteligente de reconocimiento de productos y gestión de inventario**

## 📋 Descripción

SCANIX es una aplicación web completa que permite el reconocimiento automático de productos mediante inteligencia artificial, gestión de inventario, transferencias entre depósitos, generación de tickets de venta y reportes detallados.

## 🚀 Características Principales

### ✅ Funcionalidades Implementadas

- **🔍 Reconocimiento de Productos**: IA para identificar productos por imagen
- **📦 Gestión de Inventario**: Control completo de stock por depósito
- **🏪 Gestión de Depósitos**: CRUD completo de depósitos
- **🔄 Transferencias**: Sistema de transferencias entre depósitos con remitos
- **🧾 Tickets de Venta**: Generación y gestión de tickets
- **📊 Reportes**: Dashboard con KPIs, reportes de ventas y stock
- **📄 Exportación CSV**: Exportación de reportes en formato CSV
- **🖨️ Impresión**: Sistema de impresión optimizado para tickets y remitos
- **💰 Tiers de Precios**: Sistema de precios escalonados por cantidad

### 🛠️ Stack Tecnológico

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- React Router (navegación)
- Zustand (state management)
- Tailwind CSS + shadcn/ui (UI components)
- Date-fns (manejo de fechas)

**Backend:**
- Node.js + Express
- SQLite3 (base de datos)
- CORS, Helmet (seguridad)
- Morgan (logging)
- Multer (file uploads)

## 🏗️ Arquitectura del Proyecto

```
scanix-smart-shop-main/
├── src/                          # Frontend (React + TypeScript)
│   ├── components/              # Componentes reutilizables
│   ├── pages/                   # Páginas principales
│   ├── store/                   # Zustand stores
│   ├── services/                # APIs y servicios
│   ├── types/                   # Definiciones TypeScript
│   └── utils/                   # Utilidades
├── backend/                     # Backend (Node.js + Express)
│   ├── src/                     # Código fuente del servidor
│   ├── routes/                  # Rutas de la API
│   └── dev.db                   # Base de datos SQLite
└── docs/                        # Documentación
```

## 🚦 Instalación y Ejecución

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/silvanoruatabelen1/appscanix.git
cd appscanix
```

### 2. Instalar dependencias

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
```

### 3. Configurar base de datos

```bash
cd backend
npm run init-db
```

### 4. Ejecutar la aplicación

**Backend (Terminal 1):**
```bash
cd backend
npm run dev
# Servidor corriendo en http://localhost:3001
```

**Frontend (Terminal 2):**
```bash
npm run dev
# Aplicación corriendo en http://localhost:5173
```

## 📚 Uso del Sistema

### 1. Escaneo de Productos
- Ve a la página "Escanear"
- Sube una imagen o usa la cámara
- El sistema reconocerá automáticamente los productos
- Agrega productos al carrito

### 2. Gestión de Depósitos
- Accede a "Depósitos" en el menú
- Crea, edita o elimina depósitos
- Visualiza información de stock por depósito

### 3. Transferencias
- Ve a "Transferencias"
- Crea nueva transferencia
- Selecciona depósito origen y destino
- Agrega productos y cantidades
- Genera remito imprimible

### 4. Reportes
- Accede a "Dashboard de Reportes"
- Visualiza KPIs del sistema
- Filtra reportes por fechas y depósitos
- Exporta datos en formato CSV

## 🎯 Historias de Usuario Implementadas

### Sprint 1: Core Functionality
- ✅ HU01: Reconocimiento de productos
- ✅ HU02: Gestión de productos
- ✅ HU03: Gestión de depósitos
- ✅ HU04: Control de stock

### Sprint 2: Transactions
- ✅ HU05: Generación de tickets
- ✅ HU06: Gestión de carrito
- ✅ HU14: Transferencias entre depósitos
- ✅ HU15: Remitos de transferencia

### Sprint 3: Reports & Analytics
- ✅ HU17: Reportes de ventas
- ✅ HU18: Exportación CSV
- ✅ KPIs del sistema
- ✅ Dashboard analytics

## 🔧 Configuración

### Variables de Entorno

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001/api
```

**Backend (.env):**
```env
DATABASE_URL="file:./dev.db"
PORT=3001
```

## 🧪 Testing

### Backend API Testing
```bash
cd backend
node test-sprint1.js  # Pruebas Sprint 1
node test-sprint2.js  # Pruebas Sprint 2
node test-sprint3.js  # Pruebas Sprint 3
```

### Endpoints Principales

- `GET /api/health` - Health check
- `GET /api/products` - Listar productos
- `GET /api/deposits` - Listar depósitos
- `GET /api/stock/:depositId` - Stock por depósito
- `POST /api/tickets` - Crear ticket
- `GET /api/transfers` - Listar transferencias
- `GET /api/reports/kpis` - KPIs del sistema

## 📊 Modelo de Datos

### Entidades Principales

- **Products**: Productos con tiers de precios
- **Deposits**: Depósitos/almacenes
- **Stock**: Inventario por producto y depósito
- **Tickets**: Tickets de venta
- **Transfers**: Transferencias entre depósitos
- **Stock Movements**: Movimientos de stock

## 🚀 Despliegue

### Producción
1. Build del frontend: `npm run build`
2. Configurar variables de entorno
3. Inicializar base de datos
4. Ejecutar: `npm start`

## 🤝 Contribución

Este proyecto fue desarrollado como trabajo integrador para la materia "Ingeniería y Calidad de Software" en UTN San Francisco.

### Desarrollado por:
- **Silvano Ruata Belén**
- Universidad Tecnológica Nacional - San Francisco

## 📄 Licencia

Este proyecto es para fines educativos y académicos.

## 🔮 Roadmap

### Próximas Funcionalidades
- [ ] Sprint 4: Reconocimiento IA avanzado
- [ ] Autenticación y usuarios
- [ ] Notificaciones push
- [ ] Modo offline
- [ ] App móvil

## 📞 Soporte

Para soporte técnico o consultas:
- GitHub Issues: [https://github.com/silvanoruatabelen1/appscanix/issues](https://github.com/silvanoruatabelen1/appscanix/issues)

---

⭐ **¡Dale una estrella al proyecto si te resultó útil!** ⭐