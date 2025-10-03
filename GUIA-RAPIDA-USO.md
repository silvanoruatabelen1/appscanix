# 🚀 GUÍA RÁPIDA DE USO - SCANIX

## ✅ PROBLEMAS RESUELTOS

### 🔧 Persistencia de Usuarios
- ✅ Los usuarios ahora se guardan en `scanix-users.json`
- ✅ NO se pierden al reiniciar el servidor
- ✅ Las contraseñas se guardan correctamente después del cambio

### 🔐 Validación de Contraseñas
- ✅ Login con contraseña temporal (primera vez)
- ✅ Login con contraseña nueva (después del cambio)
- ✅ Validación correcta en ambos casos

---

## 📋 CÓMO USAR LA APLICACIÓN

### 1️⃣ INICIAR LA APLICACIÓN

```bash
.\INICIAR-SCANIX-CORREGIDO.bat
```

Esto iniciará:
- 🟢 Backend en: http://localhost:3001
- 🌐 Frontend en: http://localhost:5173

---

### 2️⃣ LOGIN COMO ADMINISTRADOR

**Credenciales:**
- **Usuario:** `admin`
- **Contraseña:** `admin123`

**Qué verás:**
- Productos
- Depósitos
- Transferencias
- Reportes
- **Usuarios** (solo admin)
- Escanear
- Carrito

---

### 3️⃣ CREAR UN NUEVO USUARIO (OPERADOR O CAJERO)

1. **Estando logueado como admin**, ve a **"Usuarios"** en el menú lateral

2. Click en **"Crear Usuario"**

3. Llena el formulario:
   ```
   Nombre: Juan
   Apellido: Pérez
   Email: juan.perez@scanix.com
   Usuario: juanperez
   Contraseña: (dejar vacío para generar automática)
   Rol: operador (o cajero)
   ```

4. Click **"Crear"**

5. **¡IMPORTANTE!** 📋 Copia la contraseña temporal que aparece en el mensaje:
   ```
   Ejemplo: "Contraseña temporal: Ab3xK9pR"
   ```

6. **Guarda esta información:**
   ```
   Usuario: juanperez
   Contraseña temporal: Ab3xK9pR
   ```

---

### 4️⃣ LOGIN CON EL NUEVO USUARIO

1. **Logout** del admin (click en tu nombre → Cerrar Sesión)

2. En la pantalla de login, ingresa:
   ```
   Usuario: juanperez
   Contraseña: Ab3xK9pR (la que copiaste)
   ```

3. Click **"Iniciar Sesión"**

4. **Aparecerá un modal** pidiendo cambiar la contraseña:
   ```
   Contraseña actual: Ab3xK9pR
   Nueva contraseña: MiPassword123
   Confirmar: MiPassword123
   ```

5. Click **"Cambiar Contraseña"**

6. **¡Listo!** Ahora verás las pantallas según tu rol:

---

### 5️⃣ QUÉ VE CADA ROL

#### 👤 OPERADOR
**Usuario:** `juanperez` (ejemplo)
**Ve:**
- ✅ Productos
- ✅ Depósitos (pantalla principal)
- ✅ Transferencias
- ✅ Reportes
- ❌ NO ve: Usuarios, Escanear, Carrito

**Puede hacer:**
- Gestionar catálogo de productos
- Ver y ajustar stock en depósitos
- Crear transferencias entre depósitos
- Ver reportes y exportar datos

---

#### 🛒 CAJERO
**Usuario:** Ejemplo: `mariacajera`
**Ve:**
- ✅ Escanear (pantalla principal)
- ✅ Carrito
- ❌ NO ve: Productos, Depósitos, Transferencias, Reportes, Usuarios

**Puede hacer:**
- Escanear productos
- Gestionar carrito de compra
- Generar tickets de venta
- Imprimir tickets

---

#### 👑 ADMIN
**Usuario:** `admin`
**Ve:** TODO
- ✅ Todos los módulos
- ✅ Gestión de usuarios (exclusivo)

---

## 🔄 PRÓXIMOS LOGINS

### Con el mismo usuario:

1. **Primera vez (con contraseña temporal):**
   ```
   Usuario: juanperez
   Contraseña: Ab3xK9pR (temporal)
   → Te pide cambiar contraseña
   ```

2. **Segunda vez en adelante (con contraseña nueva):**
   ```
   Usuario: juanperez
   Contraseña: MiPassword123 (la que pusiste)
   → ✅ Entra directamente, sin cambiar contraseña
   ```

---

## 💾 PERSISTENCIA DE DATOS

### ¿Dónde se guardan los usuarios?

En el archivo: **`scanix-users.json`** (raíz del proyecto)

### ¿Qué pasa si reinicio el servidor?

✅ **Los usuarios se mantienen** (se cargan del archivo)
✅ **Las contraseñas se mantienen**
✅ **Los roles se mantienen**

### ¿Qué pasa si borro `scanix-users.json`?

❌ **Se pierden todos los usuarios creados**
✅ **El admin (`admin/admin123`) siempre existe**

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: "Credenciales incorrectas" con usuario creado

**Causa:** El servidor se reinició y el usuario no se guardó

**Solución:**
1. Verifica que existe el archivo `scanix-users.json`
2. Reinicia el backend
3. Si no existe el usuario, créalo nuevamente como admin

---

### Problema: "No puedo cambiar la contraseña"

**Causa:** Contraseña actual incorrecta

**Solución:**
1. Si es la primera vez, usa la contraseña temporal que copiaste al crear el usuario
2. Si ya cambiaste la contraseña antes, usa tu nueva contraseña

---

### Problema: "No veo las pantallas de mi rol"

**Causa:** No completaste el cambio de contraseña o hay un error de permisos

**Solución:**
1. Cierra sesión
2. Vuelve a loguearte
3. Si te pide cambiar contraseña, complétalo
4. Deberías ver las pantallas correctas

---

## 📊 PRUEBA COMPLETA

### Test del flujo completo:

1. ✅ Login como `admin`
2. ✅ Crear usuario operador: `operator1`
3. ✅ Logout
4. ✅ Login con `operator1` + contraseña temporal
5. ✅ Cambiar contraseña a: `Operator123`
6. ✅ Verificar que ves: Productos, Depósitos, Transferencias, Reportes
7. ✅ Logout
8. ✅ Login con `operator1` / `Operator123` (nueva contraseña)
9. ✅ Verificar que entra directo sin pedir cambio
10. ✅ **Reiniciar el backend**
11. ✅ Login con `operator1` / `Operator123`
12. ✅ **Debe funcionar** (usuario persistido)

---

## 🎯 RESUMEN

| Acción | Resultado |
|--------|-----------|
| Crear usuario | ✅ Se guarda en `scanix-users.json` |
| Cambiar contraseña | ✅ Se guarda la nueva contraseña |
| Reiniciar servidor | ✅ Los usuarios se mantienen |
| Login con temp password | ✅ Funciona primera vez |
| Login con new password | ✅ Funciona después del cambio |
| Persistencia | ✅ Todo se guarda en archivo |

---

**Fecha:** 2025-10-01
**Versión:** 1.0.1-persistente
**Estado:** ✅ TOTALMENTE FUNCIONAL

