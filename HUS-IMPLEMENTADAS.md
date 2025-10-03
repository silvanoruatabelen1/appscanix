# 📋 HISTORIAS DE USUARIO IMPLEMENTADAS - SCANIX

## 🎯 SPRINT 1: Core Functionality & Operaciones Básicas

### HU01: Escaneo de Productos
**Como** cajero  
**Quiero** escanear productos con la cámara  
**Para** agilizar el proceso de venta

**Criterios de Aceptación:**
- ✅ Puedo capturar imagen desde la cámara web
- ✅ Puedo subir una imagen desde archivo
- ✅ El sistema valida tamaño y formato de imagen
- ✅ El sistema reconoce productos automáticamente
- ✅ Los productos reconocidos se agregan al carrito

**Horas:** 27h  
**Prioridad:** Alta

---

### HU02: Gestión de Productos
**Como** administrador  
**Quiero** gestionar el catálogo de productos  
**Para** mantener información actualizada

**Criterios de Aceptación:**
- ✅ Puedo ver lista de todos los productos
- ✅ Puedo crear nuevos productos con SKU único
- ✅ Puedo editar información de productos existentes
- ✅ Puedo eliminar productos del catálogo
- ✅ Puedo buscar productos por nombre o SKU

**Horas:** 31h  
**Prioridad:** Alta

---

### HU03: Gestión de Depósitos
**Como** operador  
**Quiero** gestionar múltiples depósitos  
**Para** organizar el inventario

**Criterios de Aceptación:**
- ✅ Puedo ver lista de todos los depósitos
- ✅ Puedo crear nuevos depósitos
- ✅ Puedo editar información de depósitos
- ✅ Cada depósito tiene nombre y dirección

**Horas:** 18h  
**Prioridad:** Alta

---

### HU04: Control de Stock
**Como** operador  
**Quiero** consultar el stock por depósito  
**Para** conocer disponibilidad

**Criterios de Aceptación:**
- ✅ Puedo ver stock de cada producto por depósito
- ✅ Puedo filtrar por depósito
- ✅ Puedo ajustar stock manualmente
- ✅ El sistema registra los ajustes realizados

**Horas:** 19h  
**Prioridad:** Alta

---

### HU05: Generación de Tickets
**Como** cajero  
**Quiero** generar tickets de venta  
**Para** formalizar transacciones

**Criterios de Aceptación:**
- ✅ Puedo generar ticket desde el carrito
- ✅ El ticket muestra todos los productos y precios
- ✅ El sistema valida stock antes de crear ticket
- ✅ El stock se descuenta automáticamente
- ✅ Puedo imprimir el ticket
- ✅ El ticket tiene formato profesional

**Horas:** 29h  
**Prioridad:** Alta

---

### HU06: Carrito de Compra
**Como** cajero  
**Quiero** gestionar un carrito de compra  
**Para** acumular productos antes de vender

**Criterios de Aceptación:**
- ✅ Puedo agregar productos al carrito
- ✅ Puedo modificar cantidades
- ✅ Puedo eliminar productos del carrito
- ✅ El sistema calcula subtotales automáticamente
- ✅ Puedo seleccionar depósito de origen
- ✅ El precio se ajusta según cantidad (tiers)

**Horas:** 17h  
**Prioridad:** Alta

---

### HU07: Precios Escalonados
**Como** administrador  
**Quiero** configurar precios escalonados  
**Para** incentivar compras por volumen

**Criterios de Aceptación:**
- ✅ Puedo crear múltiples tiers por producto
- ✅ Cada tier tiene rango de cantidad y precio
- ✅ Los rangos no pueden tener gaps
- ✅ El sistema auto-ajusta rangos al editar
- ✅ El precio se aplica automáticamente según cantidad

**Horas:** 26h  
**Prioridad:** Media

---

## 🚀 SPRINT 2: Autenticación, Roles, Transferencias y Reportes

### HU08: Gestión de Usuarios
**Como** administrador  
**Quiero** gestionar usuarios del sistema  
**Para** controlar accesos

**Criterios de Aceptación:**
- ✅ Puedo ver lista de todos los usuarios
- ✅ Puedo crear usuarios con diferentes roles
- ✅ El sistema genera contraseñas temporales automáticamente
- ✅ Puedo ver detalles de cada usuario
- ✅ Puedo desactivar usuarios
- ✅ Los usuarios se persisten y no se pierden al reiniciar

**Horas:** 32h  
**Prioridad:** Alta

---

### HU09: Autenticación
**Como** usuario  
**Quiero** autenticarme con mis credenciales  
**Para** acceder al sistema

**Criterios de Aceptación:**
- ✅ Puedo iniciar sesión con usuario y contraseña
- ✅ El sistema valida mis credenciales
- ✅ Recibo un token de sesión
- ✅ Si las credenciales son incorrectas, veo un mensaje de error
- ✅ Mi sesión persiste durante mi uso

**Horas:** 22h  
**Prioridad:** Alta

---

### HU10: Cambio de Contraseña
**Como** usuario nuevo  
**Quiero** cambiar mi contraseña temporal  
**Para** personalizar mi acceso

**Criterios de Aceptación:**
- ✅ En mi primer login, se me obliga a cambiar contraseña
- ✅ Debo ingresar contraseña actual y nueva
- ✅ La nueva contraseña debe ser diferente
- ✅ La nueva contraseña se guarda correctamente
- ✅ En siguientes logins no se me pide cambiar contraseña

**Horas:** 16h  
**Prioridad:** Alta

---

### HU11: Sistema de Roles y Permisos
**Como** usuario  
**Quiero** ver solo las funcionalidades permitidas por mi rol  
**Para** una mejor experiencia

**Criterios de Aceptación:**
- ✅ El sistema tiene 3 roles: Admin, Operador, Cajero
- ✅ Admin puede acceder a todo
- ✅ Operador puede: gestionar productos, depósitos, transferencias, reportes
- ✅ Cajero puede: escanear, gestionar carrito, generar tickets
- ✅ Si intento acceder a una ruta no permitida, veo mensaje de error
- ✅ El menú lateral muestra solo mis opciones permitidas
- ✅ Al iniciar sesión, soy redirigido a mi pantalla principal

**Horas:** 23h  
**Prioridad:** Alta

---

### HU14: Transferencias entre Depósitos
**Como** operador  
**Quiero** crear transferencias entre depósitos  
**Para** redistribuir stock

**Criterios de Aceptación:**
- ✅ Puedo seleccionar depósito origen y destino
- ✅ Puedo agregar productos con cantidades
- ✅ El sistema valida que hay stock suficiente en origen
- ✅ Al confirmar, el stock se descuenta del origen
- ✅ Al confirmar, el stock se agrega al destino
- ✅ Se registra el movimiento en el historial
- ✅ Puedo ver el detalle de la transferencia

**Horas:** 35h  
**Prioridad:** Alta

---

### HU15: Detalle de Transferencias
**Como** operador  
**Quiero** ver el detalle de una transferencia  
**Para** verificar información

**Criterios de Aceptación:**
- ✅ Puedo ver lista de todas las transferencias
- ✅ Puedo filtrar transferencias
- ✅ Puedo ver detalle completo de cada transferencia
- ✅ El detalle muestra: origen, destino, productos, cantidades
- ✅ Puedo imprimir comprobante de la transferencia

**Horas:** 20h  
**Prioridad:** Media

---

### HU17: Dashboard con KPIs
**Como** administrador  
**Quiero** ver un dashboard con KPIs  
**Para** monitorear el negocio

**Criterios de Aceptación:**
- ✅ Puedo ver KPIs principales (ventas, stock, productos)
- ✅ Puedo ver gráficos de ventas
- ✅ Puedo ver top productos más vendidos
- ✅ Los datos se actualizan en tiempo real
- ✅ La información es clara y visual

**Horas:** 23h  
**Prioridad:** Media

---

### HU18: Reportes y Exportación
**Como** administrador  
**Quiero** generar reportes de ventas y stock  
**Para** análisis

**Criterios de Aceptación:**
- ✅ Puedo generar reporte de ventas
- ✅ Puedo generar reporte de stock
- ✅ Puedo filtrar por fecha
- ✅ Puedo filtrar por depósito
- ✅ Puedo exportar reportes a CSV
- ✅ Puedo exportar reportes a PDF
- ✅ Los reportes incluyen: tablas, gráficos, métricas

**Horas:** 37h  
**Prioridad:** Media

---

## 📊 RESUMEN

### Por Sprint

**Sprint 1:**
- 7 HUs implementadas
- 167 horas estimadas
- Enfoque: Operaciones básicas y core functionality

**Sprint 2:**
- 7 HUs implementadas
- 208 horas estimadas
- Enfoque: Autenticación, roles, transferencias y reportes

### Por Prioridad

| Prioridad | HUs | Horas |
|-----------|-----|-------|
| Alta | 11 | 294h |
| Media | 3 | 80h |
| **Total** | **14** | **374h** |

### Por Módulo

| Módulo | HUs | Horas |
|--------|-----|-------|
| Operaciones | 3 | 73h |
| Administración | 4 | 96h |
| Autenticación | 3 | 61h |
| Transferencias | 2 | 55h |
| Reportes | 2 | 60h |
| **Total** | **14** | **345h** |

---

**Fecha:** Octubre 2025  
**Proyecto:** SCANIX  
**Estado:** ✅ Todas las HUs completadas

