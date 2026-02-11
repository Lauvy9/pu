# LAURA - Sistema de Queries Mínimas e Interpretación Inteligente

## 📌 Descripción General

LAURA ahora puede interpretar **una sola palabra** o frases muy cortas (2-3 palabras) y ofrecer opciones contextuales. El sistema no requiere que escribas frases completas.

---

## 🎯 Cómo Funciona

### Pipeline de Procesamiento

```
User Input (1-2 palabras)
        ↓
Análisis Mínimo (entityDetector)
        ├─ ¿Es una entidad? (cliente o producto)
        ├─ ¿Es palabra clave? (stock, ventas, fiado, etc.)
        └─ ¿Es ambiguo? (múltiples opciones)
        ↓
Respuesta Proactiva (proactiveResponseGenerator)
        └─ Ofrecer opciones contextuales
```

---

## 💬 Ejemplos de Uso

### 1️⃣ UNA PALABRA CLAVE

**Usuario escribe:** "stock"

**LAURA responde:**
```
📦 Stock

¿Qué querés saber?

🔴 Productos agotados → Hay items sin stock
🟡 Stock bajo → Productos a punto de agotarse
📊 Stock total → Inventario completo
🔍 Buscar producto → Decime el nombre

Ejemplo: 'stock bajo' o 'dame el inventario'
```

---

**Usuario escribe:** "ventas"

**LAURA responde:**
```
💰 Ventas

¿Qué querés revisar?

📅 Hoy → Ventas de este día
📊 Este mes → Movimiento del mes
🏆 Top productos → Más vendidos
💡 Ganancias → Análisis de ganancia
📈 Análisis → Patrones de venta

Ejemplo: 'ventas de hoy' o 'qué fue lo más vendido'
```

---

**Usuario escribe:** "fiado"

**LAURA responde:**
```
💳 Fiados y Deudas

¿Qué necesitás?

📋 Total de fiados → Deuda general
👤 Cliente específico → Cuánto debe Juan, María, etc.
🔴 Mayor deudor → Quién debe más
📊 Análisis de riesgo → Situación de créditos
⚠️ Cobranza urgente → Deudas vencidas

Ejemplo: 'fiados del mes' o 'cuánto debe mario'
```

---

### 2️⃣ NOMBRE DE CLIENTE

**Usuario escribe:** "mario"

**LAURA responde (si Mario es cliente):**
```
👤 Cliente: Mario

¿Qué querés saber?

💳 Deudas → Cuánto debe
🛍️ Historial de compras → Qué compró
💰 Total gastado → Gasto total con nosotros
📝 Detalle de transacciones → Todo movimiento

Ejemplo: 'deudas de mario' o 'qué compró mario'
```

---

### 3️⃣ NOMBRE DE PRODUCTO

**Usuario escribe:** "cuaderno"

**LAURA responde (si Cuaderno es producto):**
```
🏷️ Producto: Cuaderno

¿Qué querés saber?

💵 Precio → Cuánto cuesta
📦 Stock → Cuántos quedan
📊 Ventas → Cuántos se vendieron
📈 Performance → Cómo vende
🏆 Categoría → Tipo de producto

Disponemos: 45 unidades

Ejemplo: 'precio cuaderno' o 'stock cuaderno'
```

---

### 4️⃣ PALABRAS CLAVE ESPECIALES

| Palabra | Categoría | Respuesta |
|---------|-----------|-----------|
| "bajo", "poco", "agotado" | STOCK_LOW | Lista de productos con stock crítico |
| "clientes" | CLIENTS | Opciones para listar/buscar clientes |
| "productos" | PRODUCTS | Opciones para ver catálogo |
| "informe", "reporte" | REPORTS | Opciones de análisis e informes |
| "ayuda" | HELP | Fallback inteligente con opciones principales |

---

## 🔄 Flujo de Decisión

```
┌─ ¿Query muy corto (≤ 2 palabras)?
│
├─ SÍ: Análisis mínimo
│  ├─ ¿Es nombre de cliente? → Mostrar opciones de cliente
│  ├─ ¿Es nombre de producto? → Mostrar opciones de producto
│  ├─ ¿Es palabra clave? → Mostrar opciones de categoría
│  └─ ¿Múltiples opciones? → Listar candidatos
│
└─ NO: Detector de intención normal
   ├─ Query completo → Ejecutar análisis
   └─ Generar respuesta directa
```

---

## 📚 Categorías de Palabras Clave

### STOCK
- "stock", "inventario", "reponer", "faltantes", "existencias", "tengo", "quedan", "hay"

### STOCK_LOW
- "bajo", "poco", "agotado", "falta", "acabó", "reponer", "crítico", "urgente"

### SALES
- "ventas", "vendido", "facturación", "vendí", "ingresos", "facturé", "movimiento"

### FIADOS
- "fiado", "deuda", "deben", "debe", "crédito", "cobranza", "deudores"

### CLIENTS
- "clientes", "cliente", "gente", "personas", "contactos"

### PRODUCTS
- "productos", "producto", "artículos", "items", "catálogo"

### REPORTS
- "informe", "reporte", "resumen", "análisis", "conclusión"

### HELP
- "ayuda", "qué puedo", "cómo", "qué hago", "opciones", "menú"

---

## 🤔 Manejo de Ambigüedades

Si hay múltiples clientes o productos con nombres similares:

**Usuario escribe:** "ana"

**LAURA responde:**
```
🤔 Encontré varias opciones. ¿Cuál era?

1. 👤 Ana García
2. 👤 Ana López
3. 👤 Anabel Martínez

Decime el nombre exacto o el número
```

---

## ❓ Fallback Inteligente

Si LAURA no entiende el query:

**Usuario escribe:** "xyzabc"

**LAURA responde:**
```
🤔 No estoy 100% segura de lo que buscás.

Podés consultarme sobre:

📦 Stock → Inventario y faltantes
💰 Ventas → Facturación e ingresos
💳 Fiados → Deudas y créditos
👤 Clientes → Datos de clientes
🏷️ Productos → Catálogo y precios
💡 Estrategias → Sugerencias de mejora

O decime el nombre de un cliente o producto 🔍
```

---

## 🚀 Funciones Principales (Backend)

### `entityDetector.js`
- `analyzeMinimalQuery(query, storeContext)` - Analiza queries cortos
- `findClient(query, fiados)` - Busca cliente por nombre (fuzzy match)
- `findProduct(query, products)` - Busca producto por nombre (fuzzy match)
- `detectKeywordCategory(query)` - Detecta categoría de palabra clave

### `proactiveResponseGenerator.js`
- `generateProactiveResponse(analysis, storeContext)` - Router central de respuestas
- `generateClientOptionsResponse(name, fiados)` - Opciones para cliente
- `generateProductOptionsResponse(name, product)` - Opciones para producto
- `generateStockOptionsResponse(products)` - Opciones de stock
- `generateSalesOptionsResponse(sales)` - Opciones de ventas

### `lauraEngine.js` (Actualizado)
- `processQuery(userInput, storeContext)` - NUEVO: Detección de queries mínimos
- Integración con `entityDetector` y `proactiveResponseGenerator`
- Logging mejorado con `minimalQuery` y `minimalAnalysis` metadata

---

## 🔧 Configuración Fuzzy Matching

- **Threshold de similitud:** 0.75 para match fuerte, 0.70 para candidatos
- **Levenshtein distance:** Calcula diferencia de caracteres entre strings
- **Caso insensible:** Todas las búsquedas ignoran mayúsculas/minúsculas

---

## 📊 Logs y Debugging

Cada query registra:
```json
{
  "userInput": "mario",
  "timestamp": "2025-11-17T10:30:00.000Z",
  "intent": "unknown",
  "minimalQuery": true,
  "minimalAnalysis": {
    "category": "ENTITY",
    "entityType": "client",
    "entity": { "nombre": "Mario García", "monto": 5000 },
    "candidates": []
  }
}
```

Ver logs en: `memoryManager.getConversationLogs()`

---

## ✅ Casos de Uso Completos

### Caso 1: Usuario necesita stock bajo urgente
```
Usuario: "bajo"
LAURA: [Lista de productos con stock crítico]
Usuario: "cuaderno"
LAURA: [Opciones para producto "Cuaderno"]
Usuario: "precio"
LAURA: "Cuaderno: $50 - Stock: 2 unidades"
```

### Caso 2: Usuario quiere info de cliente
```
Usuario: "mario"
LAURA: [Opciones de cliente Mario]
Usuario: "deudas"
LAURA: "Mario debe: $15,000. Vencimiento: 15 días"
```

### Caso 3: Usuario revisa ventas diarias
```
Usuario: "ventas"
LAURA: [Opciones de ventas]
Usuario: "hoy"
LAURA: "Vendimos 25 items. Total: $8,500. Top: Cuaderno, Vidrio"
```

---

## 🎓 Mapa Mental

```
                    ┌─────────────────────────────┐
                    │   LAURA Input (1-2 palabras)│
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │   analyzeMinimalQuery      │
                    │   (entityDetector.js)      │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
            ┌───────▼────────┐        ┌──────────▼────────┐
            │   Entidad      │        │  Palabra Clave   │
            │ (Cliente/Prod) │        │ (Stock/Ventas)   │
            └───────┬────────┘        └──────────┬────────┘
                    │                           │
         ┌──────────▼──────────┐    ┌───────────▼────────────┐
         │ generateProactive   │    │ handleKeywordCategory  │
         │ Response            │    │ (stock/sales/fiados)   │
         └─────────────────────┘    └────────────────────────┘
                    │                           │
                    └──────────────┬────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │   User-Friendly Response   │
                    │   with Contextual Options  │
                    └────────────────────────────┘
```

---

## 🔐 Privacy & Performance

- **Query analysis:** ~2ms (fuzzy matching local)
- **Entity detection:** ~5ms (iteration through fiados/products)
- **No external APIs:** Todo cálculo local
- **Data storage:** LocalStorage con max 500 entries

---

## 📞 Soporte

Si necesitás agregar más palabras clave o categorías:

1. Edita `entityDetector.detectKeywordCategory()` - Agrega keywords
2. Edita `proactiveResponseGenerator.generateProactiveResponse()` - Agrega respuesta
3. Ejecuta `npm run dev` para testear

---

**Última actualización:** 17 de Noviembre, 2025  
**Versión:** 2.0 - Soporte para queries mínimas e interpretación proactiva
