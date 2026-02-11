/**
 * MEMORIA_CONVERSACIONAL.md
 * Documentación técnica de la integración de memoria en LAURA
 */

# Memoria Conversacional en LAURA

## Resumen

Se agregó un sistema de **memoria conversacional** que permite a LAURA:
- Recordar compras de clientes
- Consultar historial de compras
- Guardar precios mencionados
- Recuperar precios guardados
- Recordar información contextual

**Nota importante**: Todo se mantiene sincronizado con la funcionalidad existente (saludos, intents de negocio, normalización, etc.).

---

## Módulos Nuevos

### 1. `src/utils/memoryManager.js` (~250 líneas)

**Gestor central de memoria. Maneja persistencia en localStorage.**

Funciones principales:
- `loadMemory()` - Cargar memoria desde localStorage
- `saveMemory()` - Guardar memoria en localStorage
- `remember(key, value)` - Guardar clave-valor genérico
- `rememberPrice(productName, price)` - Guardar precio de producto
- `rememberClientPurchase(clientName, product, qty, price)` - Guardar compra de cliente
- `recall(key)` - Recuperar valor genérico
- `recallPrice(productName)` - Recuperar precio de producto
- `getClientHistory(clientName)` - Obtener todas las compras de cliente
- `getClientLastPurchase(clientName)` - Última compra de cliente
- `findClient(partial)` - Buscar cliente por nombre parcial
- `addClientNote(clientName, note)` - Agregar nota a cliente
- `getMemorySummary()` - Debug: ver estado de memoria
- `clearMemory()` - Limpiar todo

**Estructura de datos**:
```javascript
{
  clients: {
    "ana": {
      purchases: [
        { product: "vidrio templado", quantity: 1, price: 1200, timestamp: "..." }
      ],
      lastSeen: "...",
      notes: "Cliente importante",
      displayName: "Ana"
    }
  },
  prices: {
    "cuaderno": { price: 50, lastUpdated: "...", source: "user", originalName: "Cuaderno" }
  },
  purchases: [ /* histórico global */ ],
  conversationLog: []
}
```

---

### 2. `src/utils/memoryResponseGenerator.js` (~400 líneas)

**Genera respuestas basadas en datos de memoria.**

Funciones:
- `generateRememberPurchaseResponse(rawInput)` - Extraer y guardar compra
- `generateAskPurchaseHistoryResponse(rawInput)` - Responder con historial
- `generateAskMemoryValueResponse(rawInput)` - Responder con dato recordado
- `generateUpdateKnownPriceResponse(rawInput)` - Guardar precio nuevo
- `generateAskKnownPriceResponse(rawInput)` - Responder con precio guardado

Cada función:
1. Extrae entidades (nombres, números, productos)
2. Consulta/actualiza memoria
3. Devuelve respuesta formateada

---

## Nuevos Intents en `intentDetector.js`

Se agregaron 5 intents de memoria a `INTENT_TYPES`:

```javascript
REMEMBER_PURCHASE: 'rememberPurchase'      // "Ana compró vidrio 8mm"
ASK_PURCHASE_HISTORY: 'askPurchaseHistory' // "¿Qué compró Ana?"
ASK_MEMORY_VALUE: 'askMemoryValue'         // "¿Qué precio tenía...?"
UPDATE_KNOWN_PRICE: 'updateKnownPrice'    // "El cuaderno sale $50"
ASK_KNOWN_PRICE: 'askKnownPrice'           // "¿Cuánto cuesta el cuaderno?"
```

**Detectores** (incluyen fuzzy matching):
- `detectRememberPurchase(text)` - Tiene verbo de compra + cantidad
- `detectAskPurchaseHistory(text)` - Pregunta sobre compra pasada
- `detectAskMemoryValue(text)` - "¿Qué precio tenía...?"
- `detectUpdateKnownPrice(text)` - Menciona precio nuevo + número
- `detectAskKnownPrice(text)` - "¿Cuánto cuesta...?"

---

## Integración en `lauraEngine.js`

**Cambios**:

1. **Import de memoria**:
```javascript
import * as memoryManager from './memoryManager'
import * as memoryResponseGen from './memoryResponseGenerator'
```

2. **Cargar memoria al iniciar**:
```javascript
memoryManager.loadMemory()
```

3. **Actualizar `extractBusinessData()`** para detectar intents de memoria:
```javascript
if (intent === INTENT_TYPES.REMEMBER_PURCHASE) {
  const result = memoryResponseGen.generateRememberPurchaseResponse(params.rawInput)
  return { memoryResult: result }
}
// ... (similar para otros 4 intents de memoria)
```

4. **Actualizar `processQuery()`** para usar `memoryResult`:
```javascript
let response = ''
if (businessData.memoryResult) {
  response = businessData.memoryResult.response
} else {
  response = generateResponse(intent, businessData)
}
```

**Resultado**: Los intents de memoria se procesan dentro del flujo existente sin romper nada.

---

## Características Preservadas

✅ **Normalización de texto** - Sigue funcionando
✅ **Detección de saludos** - Sigue funcionando
✅ **Invocación por nombre** - Sigue funcionando
✅ **Corrección ortográfica** - Sigue funcionando
✅ **Intents de negocio** (TOP_SALES, etc.) - Siguen funcionando
✅ **Combinación saludo + acción** - Sigue funcionando

---

## Ejemplos de Uso

### Recordar compra:
```
Usuario: "Ana compró 5 vidrios templados"
LAURA: "✅ Guardado: Ana compró 5x vidrios templados. Lo recordaré."
```

### Consultar historial:
```
Usuario: "¿Qué compró Ana la última vez?"
LAURA: "📋 **Última compra de Ana:** 5x vidrios templados (16/11/2025)"
```

### Guardar precio:
```
Usuario: "El cuaderno ahora sale $50"
LAURA: "✅ Guardado: cuaderno → $50. Voy a recordar este precio."
```

### Consultar precio:
```
Usuario: "¿Cuánto cuesta el cuaderno?"
LAURA: "💰 **cuaderno** sale **$50** (actualizado: 16/11/2025)"
```

### Combinación saludo + memoria:
```
Usuario: "Hola, ¿qué compró Ana?"
LAURA: "¡Hola! Qué alegría verte por acá 😊

📋 **Última compra de Ana:** 5x vidrios templados (16/11/2025)"
```

---

## Persistencia

- **Navegador (Frontend)**: `localStorage` con clave `'laura_memory'`
- **Node.js (Backend - Opcional)**: Puede remplazarse con `fs.readFileSync()` para leer de archivos

Para implementar en Node.js:
```javascript
// En memoryManager.js
import fs from 'fs'

export function loadMemory() {
  try {
    const data = fs.readFileSync('./memory.json', 'utf-8')
    memoryData = JSON.parse(data)
  } catch (error) {
    // archivo no existe o error
  }
}

export function saveMemory() {
  fs.writeFileSync('./memory.json', JSON.stringify(memoryData, null, 2))
}
```

---

## Extracción de Entidades (Heurística)

El sistema usa patrones simples para extraer información:

1. **Nombres de cliente**: Primera palabra capitalizada
2. **Productos**: Palabras después de verbos ("compró", "pidió", etc.)
3. **Cantidades**: Primeros números en el texto
4. **Precios**: Números después de "$" o en contexto de precios

Para casos más complejos, se recomienda usar un NLP backend (ej: OpenAI API, Hugging Face).

---

## Mejoras Futuras

1. **Persistencia backend**: Guardar en base de datos (Firebase, PostgreSQL)
2. **NLP avanzado**: Usar OpenAI API para extracción de entidades más precisa
3. **Análisis de patrones**: Detectar si cliente compra regularmente ciertos productos
4. **Recomendaciones automáticas**: "Ana siempre compra vidrios, ¿le ofrecemos descuento?"
5. **Feedback learning con memoria**: Combinar con `frequencyTracker` para sugerir mejoras

---

## Compatibilidad

- ✅ React Hooks (useState, useContext, etc.)
- ✅ Firebase Auth + Firestore
- ✅ StoreContext existente
- ✅ LauraChatBot UI component
- ✅ Todos los intents existentes

No hay cambios breaking. La memoria es una capa adicional que se integra sin modificar el código existente.
