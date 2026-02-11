# Prueba de Nuevas Intenciones de LAURA

El servidor Vite está ejecutándose en **http://localhost:5174/**

## Pruebas Manuales en el Chat

Abre la aplicación en tu navegador y prueba estos comandos en el chat de LAURA:

### 1️⃣ Lista de Clientes
**Prueba:** Escribe `"listar todos"` o `"mostrar clientes"` o `"lista de clientes"`

**Esperado:** 
- Detecta intención: `LIST_CLIENTS`
- Respuesta: Muestra `👥 **Clientes registrados: [N]**` con lista de nombres
- Si algún cliente tiene deuda, lo indica

### 2️⃣ Lista de Fiados
**Prueba:** Escribe `"listar fiados"` o `"todos los fiados"` o `"ver fiados"`

**Esperado:**
- Detecta intención: `LIST_FIADOS`
- Respuesta: Muestra `💳 **Fiados activos: [N]**` con nombre, deuda y datos de contacto
- Suma total adeudado al final

### 3️⃣ Detalle de Cliente
**Prueba:** Escribe `"cliente Franco"` o `"información del cliente María"` o `"detalle cliente Pedro"`

**Esperado:**
- Detecta intención: `CLIENT_DETAILS`
- Extrae el nombre del cliente (ej: `Franco`, `María`, `Pedro`)
- Respuesta: Muestra detalles de ese cliente:
  ```
  👤 **Cliente: [Nombre]**
  📞 Teléfono: [tel]
  💳 Deuda: $[monto]
  📅 Última compra: [fecha]
  🛒 Total comprado: $[monto]
  ```

### 4️⃣ Detalle de Fiado
**Prueba:** Escribe `"fiado Franco"` o `"cuánto debe María"` o `"deuda Pedro"`

**Esperado:**
- Detecta intención: `FIADO_DETAILS`
- Extrae el nombre del cliente
- Respuesta: Muestra detalles de la deuda:
  ```
  💳 **Detalle de fiado: [Nombre]**
  Total adeudado: $[monto]
  Última compra: [fecha]
  Productos: [lista]
  Contacto: [tel]
  
  💡 Recomendación: Contactar y ofrecer plan de pago.
  ```

### 5️⃣ Clientes de Hoy
**Prueba:** Escribe `"clientes de hoy"` o `"clientes hoy"` o `"clientes del día"`

**Esperado:**
- Detecta intención: `TODAY_CLIENTS`
- Respuesta: Muestra `📅 **Clientes que compraron hoy: [N]**` con lista de clientes y número de compras
- Si no hay ventas hoy: `📅 Hoy no se registraron ventas.`

---

## Verificación de Errores

Si algo no funciona como se espera:

1. **Abre Developer Tools** (F12 o Ctrl+Shift+I)
2. Ve a la pestaña **Console**
3. Busca mensajes de error de `[LAURA ENGINE]`
4. Busca mensajes de warning o error en el log

### Debug en localStorage
Para ver el historial de conversación guardado:
```javascript
// En la consola del navegador:
JSON.parse(localStorage.getItem('laura_memory')).sessionLog.slice(-1)[0]
```

Esto mostrará el último registro con:
- `input`: Lo que escribiste
- `response`: La respuesta de LAURA
- `intent`: La intención detectada
- `metadata.minimalAnalysis`: Análisis de palabras clave si aplica
- `metadata.error` y `metadata.stack`: Si hubo un error

---

## Archivos Modificados

- ✅ `src/utils/intentDetector.js` — Añadidas detecciones para LIST_CLIENTS, LIST_FIADOS, CLIENT_DETAILS, FIADO_DETAILS, TODAY_CLIENTS
- ✅ `src/utils/businessResponseGenerator.js` — Añadidas funciones de generación de respuestas
- ✅ `src/utils/lauraEngine.js` — Integración de nuevas intenciones en extractBusinessData

---

## Casos de Uso Completos

### Caso 1: Información Rápida de Cliente
```
Usuario: cliente Franco
LAURA: Muestra details de Franco (teléfono, deuda, último comprado, etc.)
```

### Caso 2: Monitoreo de Fiados
```
Usuario: listar fiados
LAURA: Muestra todos los clientes con deuda + total adeudado
```

### Caso 3: Análisis del Día
```
Usuario: clientes de hoy
LAURA: Muestra quiénes compraron hoy y cuántas compras hizo cada uno
```

---

## Notas
- Los clientes y fiados se cargan desde `StoreContext` y `FiadosContext`
- La persistencia está en `localStorage` (key: `store_data`, `fiados_data`)
- Las respuestas se guardan en memoria (`laura_memory`) para debugging

---

**Estado:** ✅ Listo para pruebas manuales
**Servidor:** Corriendo en http://localhost:5174/
**Última actualización:** 18 de noviembre, 2025
