# 🐛 BUGS IDENTIFICADOS EN SCANIX

## ❌ PROBLEMAS CRÍTICOS

### 1. **Backend: Inconsistencia en nombres de campos**
**Problema:** El backend usa `depositId` pero el frontend espera `depositoId`
- **Archivo:** `scanix-server.js` línea 182, 202, 256
- **Frontend espera:** `depositoId` (dataProvider.ts línea 202, 235, 256)
- **Backend responde:** `depositId` en algunos lugares

### 2. **Backend: Falta endpoint de transferencias completo**
**Problema:** El backend no registra correctamente los productos transferidos
- **Archivo:** `scanix-server.js` línea 434-448
- **Issue:** No hay lógica de actualización de stock en transferencias
- **Frontend envía:** `origenId`, `destinoId`, `items`
- **Backend debe:** Actualizar stock en ambos depósitos y registrar movimientos

### 3. **Backend: Formato de respuesta de productos inconsistente**
**Problema:** Backend devuelve `precioBase` pero debería mapear correctamente
- **Archivo:** `scanix-server.js` línea 275, mockProducts
- **Frontend espera:** `productId`, `sku`, `nombre`, `descripcion`, `precioBase`, `tiers`
- **Backend tiene:** estructura correcta pero no transforma en GET

### 4. **Backend: Falta cálculo de total en tickets**
**Problema:** Al crear ticket, no se calcula el total automáticamente
- **Archivo:** `scanix-server.js` línea 407-422
- **Issue:** Solo almacena lo que envía el frontend, no valida ni calcula

### 5. **Frontend: dataProvider hace llamadas incorrectas**
**Problema:** Varios endpoints llaman con URLs o formatos incorrectos
- **Archivo:** `dataProvider.ts`
- **Línea 182:** `depositId` debería ser `depositoId`
- **Línea 318-337:** Transformación incorrecta de productos del backend

### 6. **Frontend: productStore llama método incorrecto**
**Problema:** Llama `updateProductTiers` en lugar de `saveProductTiers`
- **Archivo:** `productStore.ts` línea 95
- **Debe llamar:** `dataProvider.saveProductTiers()`

### 7. **Frontend: UsersPage hace fetch directo sin usar authStore**
**Problema:** No usa las funciones helper de autenticación
- **Archivo:** `UsersPage.tsx` línea 53, 95
- **Issue:** Hace fetch directo a localhost:3001 sin usar API_BASE_URL constante

### 8. **Backend: No maneja CORS correctamente para todas las rutas**
**Problema:** Falta manejar preflight OPTIONS
- **Archivo:** `scanix-server.js`
- **Issue:** CORS está configurado pero puede fallar en requests complejos

### 9. **Backend: No hay validación de stock antes de ticket**
**Problema:** Se puede crear ticket sin verificar stock disponible
- **Archivo:** `scanix-server.js` línea 407
- **Issue:** No valida stock antes de crear ticket

### 10. **Frontend/Backend: Desconexión en formato de reportes**
**Problema:** El formato de respuesta de reportes no coincide
- **Frontend espera:** `totalVentas`, `cantidadTickets`, `productosMasVendidos`
- **Backend devuelve:** Estructura diferente en `/api/reports/sales`

## ⚠️ PROBLEMAS MENORES

### 11. **Frontend: Warnings de React Router**
- **Archivo:** Múltiples componentes
- **Issue:** Usar flags v7_startTransition y v7_relativeSplatPath

### 12. **Frontend: Falta manejo de errores consistente**
- **Issue:** Algunos componentes no manejan errores de red adecuadamente

### 13. **Backend: Logs muy verbosos en producción**
- **Issue:** Demasiados console.log que afectan performance

### 14. **Frontend: No hay loading states en todas las peticiones**
- **Issue:** Algunas peticiones no muestran feedback visual

## 📋 PLAN DE CORRECCIÓN

1. ✅ Corregir backend: Estandarizar nombres de campos
2. ✅ Corregir backend: Implementar lógica completa de transferencias
3. ✅ Corregir backend: Validar stock en tickets
4. ✅ Corregir frontend: dataProvider formato consistente
5. ✅ Corregir frontend: productStore usar método correcto
6. ✅ Corregir frontend: UsersPage usar API_BASE_URL
7. ✅ Probar flujo completo end-to-end
8. ✅ Documentar cambios

