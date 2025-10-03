# SCANIX Backend - Sprint 1 Implementation Plan

## 🎯 Objetivo Sprint 1
Hacer funcional el flujo crítico: Foto → Reconocimiento → Carrito → Ticket → Stock

## 🗄️ Esquema de Base de Datos

### Tabla: products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: price_tiers
```sql
CREATE TABLE price_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER NULL, -- NULL = sin límite
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: deposits
```sql
CREATE TABLE deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: stock
```sql
CREATE TABLE stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  deposit_id UUID REFERENCES deposits(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, deposit_id)
);
```

### Tabla: tickets
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL, -- T000001
  deposit_id UUID REFERENCES deposits(id),
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: ticket_items
```sql
CREATE TABLE ticket_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: stock_movements
```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_id UUID REFERENCES deposits(id),
  product_id UUID REFERENCES products(id),
  movement_type VARCHAR(20) NOT NULL, -- 'sale', 'adjustment', 'transfer_in', 'transfer_out'
  quantity_delta INTEGER NOT NULL, -- + entrada, - salida
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reference_id UUID NULL, -- ticket_id o transfer_id
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: recognition_logs
```sql
CREATE TABLE recognition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_name VARCHAR(255),
  image_size INTEGER,
  processing_time_ms INTEGER,
  products_found INTEGER,
  confidence_avg DECIMAL(3,2),
  success BOOLEAN DEFAULT true,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 API Endpoints Sprint 1

### Reconocimiento
- `POST /api/recognition` - Procesar imagen y devolver productos

### Productos
- `GET /api/products` - Listar productos (con paginación)
- `GET /api/products/:id` - Obtener producto específico
- `GET /api/products/:id/tiers` - Obtener tiers de precio

### Tickets
- `POST /api/tickets` - Crear ticket y descontar stock
- `GET /api/tickets/:id` - Obtener ticket específico

### Stock
- `GET /api/deposits/:id/stock` - Stock de un depósito
- `POST /api/stock/validate` - Validar disponibilidad antes de venta

## 🛠️ Estructura del Proyecto Backend

```
backend/
├── src/
│   ├── controllers/
│   │   ├── recognition.controller.js
│   │   ├── products.controller.js
│   │   ├── tickets.controller.js
│   │   └── stock.controller.js
│   ├── services/
│   │   ├── recognition.service.js
│   │   ├── products.service.js
│   │   ├── tickets.service.js
│   │   └── stock.service.js
│   ├── models/
│   │   └── index.js (Prisma client)
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── upload.js
│   ├── routes/
│   │   ├── recognition.routes.js
│   │   ├── products.routes.js
│   │   ├── tickets.routes.js
│   │   └── stock.routes.js
│   ├── utils/
│   │   ├── errors.js
│   │   └── validation.js
│   └── app.js
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── uploads/ (imágenes temporales)
├── .env
├── package.json
└── README.md
```

## 🔧 Configuración de Desarrollo

### 1. Variables de Entorno (.env)
```
DATABASE_URL="postgresql://user:password@localhost:5432/scanix"
JWT_SECRET="your-secret-key"
OPENAI_API_KEY="your-openai-key" # Para reconocimiento
PORT=3000
NODE_ENV=development
UPLOAD_MAX_SIZE=5242880 # 5MB
```

### 2. Dependencias Principales
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "multer": "^1.4.5",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.0",
    "joi": "^17.9.0",
    "openai": "^4.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jest": "^29.0.0"
  }
}
```

## 📋 Checklist Sprint 1

### Setup Inicial
- [ ] Configurar PostgreSQL
- [ ] Instalar dependencias
- [ ] Configurar Prisma
- [ ] Ejecutar migraciones

### APIs Core
- [ ] POST /api/recognition (con OpenAI Vision)
- [ ] GET /api/products (con tiers)
- [ ] POST /api/tickets (con validación stock)
- [ ] Middleware de validación

### Testing
- [ ] Pruebas unitarias servicios críticos
- [ ] Pruebas de integración API
- [ ] Test de carga reconocimiento

### Integración Frontend
- [ ] Actualizar dataProvider.ts para usar API real
- [ ] Configurar variables de entorno frontend
- [ ] Testing end-to-end flujo completo

## 🎯 Criterios de Aceptación Sprint 1

1. **Reconocimiento funcional:** Subir foto → API procesa → devuelve productos reales
2. **Tickets persistentes:** Crear ticket → se guarda en BD → se puede recuperar
3. **Stock real:** Al crear ticket → stock se descuenta automáticamente
4. **Validaciones:** No permite stock negativo, productos inválidos
5. **Performance:** Reconocimiento < 5 segundos, APIs < 500ms

## 🚀 Siguientes Pasos

1. **¿Confirmas este stack tecnológico?**
2. **¿Tienes PostgreSQL instalado o prefieres Docker?**
3. **¿Qué servicio de IA prefieres para reconocimiento?**
4. **¿Empezamos con el setup del backend?**
