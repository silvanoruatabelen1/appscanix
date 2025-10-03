# 🏪 SCANIX - Sistema de Gestión Inteligente

## 📋 Descripción del Proyecto

SCANIX es un sistema integral de gestión para comercios que combina tecnología moderna con funcionalidades prácticas para optimizar las operaciones diarias.

### 🎯 Objetivo
Desarrollar una aplicación web completa que permita la gestión eficiente de inventarios, ventas y operaciones comerciales, con capacidades de reconocimiento inteligente de productos.

## 🚀 Características Principales

### ✅ Funcionalidades Implementadas

#### 🔐 **Sistema de Autenticación**
- Login seguro con roles diferenciados
- Gestión de usuarios por administradores
- Cambio obligatorio de contraseña en primer acceso
- Roles: Admin, Operador, Cajero

#### 📦 **Gestión de Productos**
- Catálogo completo de productos
- Sistema de precios escalonados (tiers)
- SKU y códigos únicos
- Validaciones de negocio

#### 🏪 **Control de Depósitos**
- Múltiples ubicaciones de almacenamiento
- Gestión de stock por depósito
- Transferencias entre depósitos
- Trazabilidad completa

#### 🧾 **Sistema de Ventas**
- Generación de tickets
- Cálculo automático de precios
- Historial de transacciones
- Impresión de comprobantes

#### 📊 **Reportes y Analytics**
- Dashboard con KPIs principales
- Reportes de ventas y stock
- Exportación a CSV y PDF
- Análisis de productos más vendidos

#### 🔄 **Transferencias**
- Wizard de 2 pasos para transferencias
- Validación de stock disponible
- Registro de movimientos
- Comprobantes de transferencia

#### 🤖 **Reconocimiento Inteligente**
- Mock de reconocimiento de productos
- Preparado para integración con IA
- Interfaz de cámara web

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **React 18** - Framework principal
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **React Router** - Navegación
- **Zustand** - Gestión de estado
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes UI
- **Lucide React** - Iconografía

### **Backend**
- **Node.js** - Runtime
- **Express.js** - Framework web
- **CORS** - Configuración de seguridad
- **Helmet** - Seguridad HTTP
- **Morgan** - Logging

### **Arquitectura**
- **API REST** - Comunicación cliente-servidor
- **JWT** - Autenticación (preparado)
- **Roles y permisos** - Control de acceso
- **Responsive Design** - Adaptable a dispositivos

## 📁 Estructura del Proyecto

```
scanix-smart-shop-main1/
├── scanix-smart-shop-main/          # Frontend React
│   ├── src/
│   │   ├── components/              # Componentes reutilizables
│   │   ├── pages/                   # Páginas principales
│   │   ├── store/                   # Gestión de estado (Zustand)
│   │   ├── types/                   # Definiciones TypeScript
│   │   ├── utils/                   # Utilidades y helpers
│   │   └── services/                # Servicios API
│   ├── public/                      # Archivos estáticos
│   └── package.json                 # Dependencias frontend
├── scanix-backend-final.js          # Backend principal
├── start-scanix-final.bat           # Script de inicio
├── README-PRESENTACION.md           # Esta documentación
└── package.json                     # Dependencias backend
```

## 🚀 Instalación y Ejecución

### **Opción 1: Inicio Automático (Recomendado)**
```bash
# Ejecutar el script de inicio
start-scanix-final.bat
```

### **Opción 2: Inicio Manual**
```bash
# 1. Instalar dependencias del backend
npm install

# 2. Instalar dependencias del frontend
cd scanix-smart-shop-main
npm install
cd ..

# 3. Iniciar backend (Terminal 1)
node scanix-backend-final.js

# 4. Iniciar frontend (Terminal 2)
cd scanix-smart-shop-main
npm run dev
```

### **Acceso a la Aplicación**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/health
- **Usuario Admin**: `admin` / `admin123`

## 👥 Roles y Permisos

### **🔴 Administrador**
- Acceso completo al sistema
- Gestión de usuarios
- Configuración de productos y precios
- Acceso a todos los reportes

### **🔵 Operador**
- Gestión de productos y stock
- Transferencias entre depósitos
- Consulta de reportes básicos

### **🟢 Cajero**
- Sistema de ventas y tickets
- Escaneo de productos
- Consulta de stock

## 📊 Flujos de Trabajo Principales

### **1. Gestión de Usuarios**
1. Admin crea usuario con datos básicos
2. Sistema genera contraseña temporal
3. Admin comunica credenciales al empleado
4. Usuario cambia contraseña en primer login
5. Acceso según rol asignado

### **2. Proceso de Venta**
1. Cajero escanea o busca productos
2. Sistema calcula precios (incluye tiers)
3. Genera ticket con total
4. Imprime comprobante
5. Actualiza stock automáticamente

### **3. Transferencia de Stock**
1. Operador selecciona depósitos origen/destino
2. Agrega productos y cantidades
3. Sistema valida stock disponible
4. Confirma transferencia
5. Genera comprobante de remito

## 🎨 Características de UI/UX

- **Diseño Moderno**: Interfaz limpia y profesional
- **Responsive**: Adaptable a desktop, tablet y móvil
- **Navegación Intuitiva**: Sidebar con iconos claros
- **Feedback Visual**: Toasts, badges y estados
- **Accesibilidad**: Contraste adecuado y navegación por teclado

## 🔧 Configuración Técnica

### **Variables de Entorno**
```env
PORT=3001                    # Puerto del backend
NODE_ENV=development         # Entorno de ejecución
FRONTEND_URL=http://localhost:5173  # URL del frontend
```

### **Endpoints Principales**
- `GET /api/health` - Estado del servidor
- `POST /api/auth/login` - Autenticación
- `GET /api/products` - Catálogo de productos
- `GET /api/reports/kpis` - KPIs del dashboard
- `POST /api/tickets` - Crear ticket de venta

## 📈 Métricas y KPIs

El sistema proporciona métricas en tiempo real:
- **Productos**: Total, stock bajo
- **Ventas**: Total del mes, cantidad de tickets
- **Transferencias**: Movimientos del mes
- **Inventario**: Valor total del stock
- **Top Productos**: Más vendidos

## 🔮 Funcionalidades Futuras

### **Próximas Implementaciones**
- **Reconocimiento IA**: Integración con OpenAI Vision
- **WhatsApp Business**: Sistema de ofertas automáticas
- **Base de Datos**: Migración a PostgreSQL/MySQL
- **Autenticación Avanzada**: JWT con refresh tokens
- **Notificaciones**: Push notifications
- **Backup Automático**: Respaldo de datos

## 📞 Información del Proyecto

**Desarrollado para**: Ingeniería y Calidad de Software - UTN San Francisco  
**Tecnología**: React + Node.js + TypeScript  
**Arquitectura**: SPA con API REST  
**Estado**: Versión de presentación completa  

---

### 🎯 **Lista para Demostración**
✅ Todas las funcionalidades core implementadas  
✅ UI/UX profesional y responsive  
✅ Datos de demostración cargados  
✅ Flujos de trabajo completos  
✅ Documentación técnica  
✅ Scripts de inicio automatizados  

**¡Sistema listo para presentación!** 🚀
