# 🧪 Guía Rápida de Prueba - LAURA Chatbot

## ⚡ TL;DR — Lo Esencial

✅ **Servidor está corriendo:** http://localhost:5174/  
✅ **Código compilado:** Sin errores de sintaxis  
✅ **Nuevas funciones:** 5 intenciones + 5 generadores de respuesta implementados

---

## 🎯 Qué Probar (En 5 Minutos)

Abre http://localhost:5174/ en tu navegador y en el chat de LAURA escribe estos comandos:

### 1️⃣ `listar todos`
Esperado: Ver lista de clientes registrados
```
👥 **Clientes registrados: [N]**
1. Franco
2. María
3. Pedro
```

### 2️⃣ `listar fiados`
Esperado: Ver clientes con deuda
```
💳 **Fiados activos: 2**
1. **Franco** — $5000
2. **Pedro** — $3000

**Total adeudado: $8000**
```

### 3️⃣ `cliente Franco`
Esperado: Detalle de Franco
```
👤 **Cliente: Franco**
📞 Teléfono: 1234567
💳 Deuda: $5000
📅 Última compra: 2025-11-15
🛒 Total comprado: $25000
```

### 4️⃣ `fiado María`
Esperado: Si María no tiene deuda, indica que está al día
```
❌ No encontré fiados para "María"
```

### 5️⃣ `clientes de hoy`
Esperado: Clientes que compraron hoy
```
📅 **Clientes que compraron hoy: 2**
1. **Franco** — 1 compra(s)
2. **María** — 1 compra(s)
```

---

## 🔍 Debug Si Algo Falla

### Opción A: Verificar Console (F12)
1. Abre DevTools (F12)
2. Pestaña **Console**
3. Busca errores de `[LAURA ENGINE]`

### Opción B: Ver Último Log Guardado
En la **Console**, pega:
```javascript
JSON.parse(localStorage.getItem('laura_memory')).sessionLog.slice(-1)[0]
```

Verás algo como:
```json
{
  "input": "cliente Franco",
  "response": "👤 **Cliente: Franco**...",
  "intent": "clientDetails",
  "metadata": {
    "minimalQuery": false,
    "minimalAnalysis": {...},
    "error": null
  }
}
```

---

## 📊 Resumen Técnico

| Item | Estado |
|------|--------|
| Server Vite | ✅ http://localhost:5174 |
| Sintaxis JS | ✅ Verificado |
| Intenciones | ✅ 5 nuevas + 20+ existentes |
| Respuestas | ✅ 5 generadores |
| Persistencia | ✅ localStorage |
| Errores | ✅ Try/catch + logging |

---

## 🚨 Checklist de Verificación

- [ ] Abriste http://localhost:5174 
- [ ] Chat de LAURA está visible
- [ ] Escribiste "listar todos" y viste una lista
- [ ] Escribiste "cliente Franco" y viste detalles
- [ ] No hay errores rojo en Console (F12)
- [ ] El JSON en localStorage contiene `"intent": "listClients"` (u otro intent)

---

## 💡 Tips

- **Variantes funcionan:** Puedes escribir "mostrar clientes" en lugar de "listar todos"
- **Nombres son case-insensitive:** "FRANCO", "franco", "Franco" todo funciona
- **Sin clientes?** Los datos vienen de `StoreContext` — asegúrate de haber agregado clientes en la aplicación
- **Error de módulo?** Recarga el navegador (Ctrl+F5)

---

## 📋 Variantes de Comandos

### `listar todos` (LIST_CLIENTS)
- "listar todos"
- "mostrar clientes" 
- "clientes"
- "lista de clientes"
- "ver clientes"
- "todos los clientes"

### `listar fiados` (LIST_FIADOS)
- "listar fiados"
- "todos los fiados"
- "ver fiados"
- "fiados"

### `cliente Franco` (CLIENT_DETAILS)
- "cliente Franco"
- "información del cliente Franco"
- "info cliente Franco"
- "detalle cliente Franco"

### `fiado Franco` (FIADO_DETAILS)
- "fiado Franco"
- "cuánto debe Franco"
- "deuda Franco"

### `clientes de hoy` (TODAY_CLIENTS)
- "clientes de hoy"
- "clientes hoy"
- "clientes del día"

---

## 🎉 ¡Listo!

Todo está implementado y corriendo. Abre el navegador y ¡prueba!

Si ves algo diferente a lo esperado, comparte el output de:
```javascript
JSON.parse(localStorage.getItem('laura_memory')).sessionLog.slice(-1)[0]
```

**Éxito:** ✅ Código listo, servidor activo, esperando pruebas
