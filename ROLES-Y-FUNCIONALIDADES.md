# 👥 ROLES Y FUNCIONALIDADES - SCANIX

## 📋 RESUMEN DE ROLES

SCANIX cuenta con 3 roles principales, cada uno con funcionalidades específicas según sus responsabilidades:

### 🔐 1. ADMIN (Administrador)
**Ruta por defecto:** `/products`

#### Funcionalidades:
- ✅ **Gestión de Usuarios** (exclusivo)
  - Crear nuevos usuarios (operadores y cajeros)
  - Ver lista de usuarios
  - Desactivar usuarios
  - Generar contraseñas temporales
  - Ver detalles de usuarios

- ✅ **Gestión de Productos**
  - Crear, editar y eliminar productos
  - Configurar precios escalonados (tiers)
  - Ver catálogo completo

- ✅ **Gestión de Depósitos**
  - Crear y editar depósitos
  - Ver stock por depósito
  - Ajustar stock manualmente

- ✅ **Transferencias**
  - Crear transferencias entre depósitos
  - Ver historial de transferencias
  - Imprimir comprobantes

- ✅ **Reportes y Dashboard**
  - Ver KPIs (ventas, stock, productos)
  - Generar reportes de ventas
  - Generar reportes de stock
  - Exportar a CSV y PDF
  - Ver estadísticas detalladas

- ✅ **Operaciones de Venta**
  - Escanear productos
  - Gestionar carrito
  - Generar tickets de venta
  - Ver historial de tickets

#### Menú Lateral:
```
📦 Operaciones
  ├── Escanear
  └── Carrito

🔧 Administración
  ├── Productos
  ├── Depósitos
  ├── Transferencias
  └── Reportes

⚙️ Sistema
  └── Usuarios [Admin]
```

---

### 👷 2. OPERADOR
**Ruta por defecto:** `/deposits`

#### Funcionalidades:
- ✅ **Gestión de Productos**
  - Ver catálogo de productos
  - Editar productos existentes
  - Configurar precios escalonados (tiers)

- ✅ **Gestión de Depósitos** (principal)
  - Ver todos los depósitos
  - Consultar stock por depósito
  - Ajustar stock manualmente
  - Registrar entradas de mercadería

- ✅ **Transferencias** (principal)
  - Crear transferencias entre depósitos
  - Validar stock disponible
  - Ver historial de transferencias
  - Imprimir comprobantes

- ✅ **Reportes**
  - Ver dashboard con KPIs
  - Consultar reportes de ventas
  - Consultar reportes de stock
  - Exportar a CSV y PDF

- ✅ **Consulta de Tickets**
  - Ver tickets generados
  - Imprimir tickets históricos

#### Menú Lateral:
```
🔧 Administración
  ├── Productos [Principal]
  ├── Depósitos
  ├── Transferencias
  └── Reportes
```

---

### 🛒 3. CAJERO
**Ruta por defecto:** `/scan`

#### Funcionalidades:
- ✅ **Escaneo de Productos** (principal)
  - Escanear productos con cámara o archivo
  - Reconocimiento inteligente de productos
  - Agregar productos al carrito

- ✅ **Gestión de Carrito**
  - Ver productos en carrito
  - Modificar cantidades
  - Eliminar productos
  - Ver subtotales con precios escalonados
  - Seleccionar depósito de origen

- ✅ **Generación de Tickets**
  - Crear tickets de venta
  - Validación automática de stock
  - Descuento automático de stock
  - Imprimir tickets
  - Descargar PDF

- ✅ **Consulta de Tickets**
  - Ver tickets generados por el cajero
  - Reimprimir tickets

#### Menú Lateral:
```
📦 Operaciones
  ├── Escanear [Principal]
  └── Carrito
```

---

## 🔒 CONTROL DE ACCESO

### Matriz de Permisos

| Funcionalidad | Cajero | Operador | Admin |
|--------------|--------|----------|-------|
| Escanear productos | ✅ | ❌ | ✅ |
| Gestionar carrito | ✅ | ❌ | ✅ |
| Generar tickets | ✅ | ❌ | ✅ |
| Ver productos | ❌ | ✅ | ✅ |
| Editar productos | ❌ | ✅ | ✅ |
| Crear productos | ❌ | ❌ | ✅ |
| Gestionar depósitos | ❌ | ✅ | ✅ |
| Crear transferencias | ❌ | ✅ | ✅ |
| Ver reportes | ❌ | ✅ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |

---

## 🔄 FLUJOS DE TRABAJO

### Flujo del Cajero:
1. Login → Redirige a `/scan`
2. Escanea productos
3. Revisa carrito en `/cart`
4. Genera ticket
5. Imprime/descarga ticket

### Flujo del Operador:
1. Login → Redirige a `/deposits`
2. Revisa stock en depósitos
3. Realiza ajustes de stock si es necesario
4. Crea transferencias entre depósitos si es necesario
5. Consulta reportes de stock y ventas

### Flujo del Admin:
1. Login → Redirige a `/products`
2. Gestiona catálogo de productos
3. Crea nuevos usuarios para el sistema
4. Supervisa operaciones en reportes
5. Configura precios escalonados
6. Gestiona todos los aspectos del sistema

---

## 🎯 CARACTERÍSTICAS IMPLEMENTADAS

### ✅ Autenticación y Seguridad
- Login con usuario y contraseña
- Cambio de contraseña obligatorio en primer login
- Tokens de sesión
- Contraseñas temporales generadas automáticamente
- Cierre de sesión

### ✅ Rutas Protegidas
- Redirección automática según rol
- Mensajes de error si intenta acceder a ruta sin permisos
- Validación de permisos en cada ruta

### ✅ UI Adaptativa
- Menú lateral dinámico según rol
- Badges para indicar funcionalidades principales
- Información del usuario en header
- Diseño responsive

### ✅ Funcionalidades Completas
- Todos los CRUDs implementados
- Validaciones de negocio
- Integración frontend-backend
- Manejo de errores
- Feedback visual (toasts, loading states)

---

## 🧪 CASOS DE PRUEBA

### Probar Cajero:
1. Crear usuario con rol "cajero"
2. Login con credenciales
3. Cambiar contraseña temporal
4. Verificar que solo ve: Escanear, Carrito
5. Intentar acceder a `/products` → Debe mostrar error de permisos
6. Escanear producto y generar ticket

### Probar Operador:
1. Crear usuario con rol "operador"
2. Login con credenciales
3. Cambiar contraseña temporal
4. Verificar que ve: Productos, Depósitos, Transferencias, Reportes
5. Intentar acceder a `/users` → Debe mostrar error de permisos
6. Crear una transferencia entre depósitos

### Probar Admin:
1. Login con: admin / admin123
2. Verificar que ve TODO el menú
3. Crear un nuevo usuario
4. Acceder a todas las secciones sin restricciones
5. Ver reportes completos

---

## 📊 CREDENCIALES DE PRUEBA

### Admin (pre-configurado):
- **Usuario:** admin
- **Contraseña:** admin123
- **Permisos:** Todos

### Crear usuarios de prueba:
1. Login como admin
2. Ir a "Usuarios"
3. Crear usuario con:
   - **Cajero:** role = "cajero"
   - **Operador:** role = "operador"
4. Copiar la contraseña temporal generada
5. Logout y login con el nuevo usuario
6. Cambiar contraseña en primer login

---

## 🚀 PRÓXIMOS PASOS

### Mejoras Pendientes:
- [ ] Persistencia de sesión con refresh tokens
- [ ] Logs de auditoría (quién hizo qué y cuándo)
- [ ] Permisos granulares por depósito para operadores
- [ ] Dashboard personalizado por rol
- [ ] Notificaciones en tiempo real
- [ ] Exportación de reportes en más formatos

---

**Fecha de actualización:** 2025-10-01
**Versión:** 1.0.0-corregida

