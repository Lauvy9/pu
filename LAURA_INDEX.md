# 📇 ÍNDICE COMPLETO - MOTOR LAURA

## 🆕 Archivos Nuevos (6)

### 1. `src/utils/lauraTextNormalizer.js`
   - **Propósito:** Normalización de texto con análisis lingüístico
   - **Tamaño:** ~250 líneas
   - **Función Principal:** `normalizeText(text)`
   - **Otros Exports:** `wordSimilarity`, `fuzzyMatch`, `levenshteinDistance`, `extractKeywords`, `containsAnyWord`, `extractNumbers`, `extractIds`
   - **Tecnología:** Algoritmo de Levenshtein distance
   - **Dependencias:** Ninguna (solo JavaScript vanilla)

### 2. `src/utils/intentDetector.js`
   - **Propósito:** Detección de intenciones del usuario
   - **Tamaño:** ~300 líneas
   - **Función Principal:** `detectIntent(userInput)`
   - **Exports:** `INTENT_TYPES` (constantes), `detectIntent()`
   - **Intenciones:** GREETING, TOP_SALES, TODAY_SALES, LOW_STOCK, RECOMMEND, COMBOS, TOTAL_REVENUE, CATEGORY_STATS, LIST_PRODUCTS, LIST_CLIENTS, HELP, UNKNOWN
   - **Dependencias:** `lauraTextNormalizer`

### 3. `src/utils/lauraResponseGenerator.js`
   - **Propósito:** Generación de respuestas personalizadas
   - **Tamaño:** ~400 líneas
   - **Función Principal:** `generateResponse(intent, data)`
   - **Exports:** `generateResponse()`, `frequencyTracker` (QueryFrequencyTracker)
   - **Features:** Feedback learning, emojis contextuales, respuestas variables
   - **Dependencias:** `intentDetector` (INTENT_TYPES)

### 4. `src/utils/lauraEngine.js`
   - **Propósito:** Motor central que orquesta todo
   - **Tamaño:** ~400 líneas
   - **Función Principal:** `processQuery(userInput, storeContext)`
   - **Exports:** `processQuery()`
   - **Subfunciones:** `extractBusinessData()`, `extractTopSalesData()`, `extractTodaySalesData()`, `extractLowStockData()`, etc.
   - **Dependencias:** `intentDetector`, `lauraResponseGenerator`

### 5. `src/utils/LAURA_GUIDE.js`
   - **Propósito:** Documentación y guía completa
   - **Tamaño:** ~300 líneas (comentarios)
   - **Contenido:** Explicación de cada módulo, ejemplos de uso, estructura de datos
   - **Dependencias:** Ninguna (solo referencia)

### 6. `src/utils/LAURA_TEST_EXAMPLES.js`
   - **Propósito:** Ejemplos de pruebas y scripts de debug
   - **Tamaño:** ~350 líneas
   - **Contenido:** Casos de prueba, ejemplos de consultas, scripts de debug
   - **Uso:** Copiar/pegar en consola del navegador
   - **Dependencias:** Todos los módulos LAURA

---

## 🔄 Archivos Modificados (3)

### 1. `src/hooks/useLauraChatBot.jsx`
   - **Cambio Principal:** Rediseñado para usar `lauraEngine` en lugar de `ChatBotContext`
   - **Antes:** Dependía de múltiples funciones de `lauraLogic` y `ChatBotContext`
   - **Después:** Función única `askLAURA()` que devuelve `{text, intent, params, metadata}`
   - **Líneas:** ~50 (simplificado de ~80)
   - **Mejoras:** Mejor manejo de errores, código más limpio

### 2. `src/components/LauraAssistant.jsx`
   - **Cambio Principal:** Integración directa con `lauraEngine` (sin depender de hooks)
   - **Antes:** Usaba `useLauraChatBot` hook
   - **Después:** Importa `processQuery` directamente
   - **UI:** Actualizada a tema violeta (#6e4cb9)
   - **Líneas:** ~250 (antes ~225)
   - **Nuevas Features:** Estado de carga, mejor mensaje inicial, transiciones suaves

### 3. `src/App.jsx`
   - **Cambio:** Reposicionamiento de `<LauraAssistant usuario={usuario} />`
   - **Antes:** Dentro de `ChatBotProvider`, fuera de `StoreProvider`
   - **Después:** Dentro de `StoreProvider`, después del contenido principal
   - **Razón:** Acceso correcto a `useStore()`
   - **Props:** Ahora recibe `usuario` como parámetro

---

## 📄 Documentación Nueva (3 archivos raíz)

### 1. `LAURA_IMPLEMENTATION.md`
   - **Propósito:** Resumen ejecutivo completo
   - **Contenido:**
     - Módulos creados con resumen
     - Tabla de intenciones
     - Ejemplos reales de uso
     - Guía de integración
     - Estructura de datos
     - Capacidades actuales
     - Mejoras futuras
   - **Tamaño:** ~350 líneas

### 2. `LAURA_CHANGELOG.js`
   - **Propósito:** Registro de cambios y estadísticas
   - **Contenido:**
     - Lista de archivos nuevos
     - Cambios en archivos existentes
     - Estadísticas de código
     - Features implementadas
     - Cómo usar
     - Próximos pasos
   - **Tamaño:** ~300 líneas

### 3. `LAURA_SUMMARY.txt`
   - **Propósito:** Resumen visual ASCII
   - **Contenido:**
     - Vista general del proyecto
     - Tabla de intenciones
     - Características principales
     - Flujo de procesamiento
     - Técnicas implementadas
     - Checklist de requisitos
   - **Tamaño:** ~200 líneas

---

## 🎯 Estructura de Flujo de Datos

```
Usuario Input (con errores)
        ↓
lauraTextNormalizer
   (normalizeText)
        ↓
Texto Normalizado
        ↓
intentDetector
  (detectIntent)
        ↓
{intent, params, hasGreeting}
        ↓
lauraEngine
(extractBusinessData)
        ↓
{topProducts, salesCount, ...}
        ↓
lauraResponseGenerator
(generateResponse)
        ↓
Response String + Metadata
        ↓
LauraAssistant Component
    (renderiza)
```

---

## 🔗 Dependencias Entre Módulos

```
LauraAssistant.jsx
    ├─ processQuery (from lauraEngine)
    ├─ useStore (from StoreContext)
    └─ useState, useRef, useEffect (React)

lauraEngine.js
    ├─ detectIntent (from intentDetector)
    ├─ generateResponse (from lauraResponseGenerator)
    └─ helper functions

intentDetector.js
    ├─ normalizeText (from lauraTextNormalizer)
    ├─ extractKeywords (from lauraTextNormalizer)
    ├─ containsAnyWord (from lauraTextNormalizer)
    ├─ extractNumbers (from lauraTextNormalizer)
    └─ extractIds (from lauraTextNormalizer)

lauraResponseGenerator.js
    └─ INTENT_TYPES (from intentDetector)

lauraTextNormalizer.js
    └─ (Sin dependencias externas)
```

---

## 📊 Tamaño de Código

| Archivo | Líneas | Funciones | Complejidad |
|---------|--------|-----------|-------------|
| lauraTextNormalizer.js | ~250 | 8 | Media |
| intentDetector.js | ~300 | 12 | Media |
| lauraResponseGenerator.js | ~400 | 15 | Alta (genera respuestas) |
| lauraEngine.js | ~400 | 10+ | Alta (orquestación) |
| useLauraChatBot.jsx | ~50 | 1 | Baja |
| LauraChatBot.jsx | ~250 | 1 | Media |
| **TOTAL** | **~1,650** | **~45** | - |

---

## 🚀 Cómo Empezar

1. **Verificar que todo está importado correctamente:**
   ```javascript
   // En LauraChatBot.jsx
   import { processQuery } from '../utils/lauraEngine'
   
   // En App.jsx
   import LauraAssistant from './components/LauraAssistant'
   ```

2. **Asegurar que StoreContext devuelve sales, products, fiados:**
   ```javascript
   const { sales, products, fiados } = useStore()
   ```

3. **Abrir el chat flotante 🤖 en esquina inferior derecha**

4. **Probar consultas:**
   - "¿Qué se vendió más?"
   - "Que vendimso hoy"
   - "Stock bajo"
   - "Mostrar clientes"

---

## 🔍 Cómo Navegar el Código

### Para entender la normalización:
```
→ src/utils/lauraTextNormalizer.js
```

### Para ver cómo se detectan intenciones:
```
→ src/utils/intentDetector.js
→ Línea ~50-100 para detectar cada tipo
```

### Para ver cómo se generan respuestas:
```
→ src/utils/lauraResponseGenerator.js
→ Busca generateTopSalesResponse(), generateTodaySalesResponse(), etc.
```

### Para ver el flujo completo:
```
→ src/utils/lauraEngine.js
→ Función processQuery() es el punto de entrada
```

### Para ver cómo se usa en React:
```
→ src/components/LauraAssistant.jsx
→ handleSendMessage() llama a processQuery()
```

---

## 📝 Checklist de Requisitos Implementados

- [x] Normalización de texto (minúsculas, signos, espacios)
- [x] Corrección de errores comunes (diccionario)
- [x] Reducción de duplicaciones (regex)
- [x] Fuzzy matching con Levenshtein distance
- [x] Extracción de palabras clave
- [x] Detección de saludo
- [x] Detección de 11 tipos de intenciones
- [x] Manejo de múltiples intenciones
- [x] Extracción de parámetros (IDs, números)
- [x] Respuestas personalizadas
- [x] Tono conversacional
- [x] Emojis relevantes
- [x] Feedback learning (3+ consultas)
- [x] Respuestas variables
- [x] Código modularizado
- [x] Comentarios en español
- [x] Fácil de mantener
- [x] UI mejorada
- [x] Tema violeta
- [x] Avatar emoji

---

## 🎓 Para Aprender Más

1. **Levenshtein Distance:** [Wikipedia](https://en.wikipedia.org/wiki/Levenshtein_distance)
   - Implementada en `lauraTextNormalizer.js`

2. **NLP Básico:** Normalización de texto y detección de intenciones
   - Explicación en `LAURA_GUIDE.js`

3. **Patrones de React:** Hooks, useState, useContext
   - Usados en `LauraAssistant.jsx` y `useLauraChatBot.jsx`

4. **Feedback Learning:** Sistema simple en memoria
   - Implementado en `QueryFrequencyTracker` de `lauraResponseGenerator.js`

---

## 🐛 Debugging

Para debugging rápido, abre la consola (F12) y:

```javascript
// Prueba normalización
import { normalizeText } from './utils/lauraTextNormalizer'
normalizeText("holaa que vendimso mas")

// Prueba detección
import { detectIntent } from './utils/intentDetector'
detectIntent("hola que se vendio mas")

// Prueba motor completo
import { processQuery } from './utils/lauraEngine'
// Necesita storeContext con sales, products, fiados
```

Ver más ejemplos en `src/utils/LAURA_TEST_EXAMPLES.js`

---

## 📞 Soporte

Todos los archivos tienen:
- ✅ Comentarios en español
- ✅ Funciones documentadas
- ✅ Ejemplos de uso
- ✅ Manejo de errores

Consulta `LAURA_GUIDE.js` para dudas sobre módulos específicos.

---

## 📦 Distribución de Funcionalidad

```
NORMALIZACIÓN (lauraTextNormalizer.js)
├─ normalizeText() → string
├─ extractKeywords() → string[]
├─ wordSimilarity() → 0-1
├─ fuzzyMatch() → string
├─ containsAnyWord() → boolean
├─ extractNumbers() → number[]
└─ levenshteinDistance() → number

DETECCIÓN (intentDetector.js)
├─ detectIntent() → {intent, params, hasGreeting}
├─ detectGreeting() → boolean
├─ detectTopSales() → boolean
├─ detectTodaySales() → boolean
├─ detectLowStock() → boolean
├─ detectRecommend() → {clientId}
├─ detectCombos() → boolean
├─ detectTotalRevenue() → boolean
├─ detectCategoryStats() → boolean
├─ detectListProducts() → boolean
├─ detectListClients() → boolean
└─ detectHelp() → boolean

RESPUESTAS (lauraResponseGenerator.js)
├─ generateResponse() → string
├─ frequencyTracker.track() → void
├─ frequencyTracker.isFrequent() → boolean
├─ frequencyTracker.getFrequency() → number
└─ frequencyTracker.reset() → void

MOTOR (lauraEngine.js)
├─ processQuery() → {response, intent, params, metadata}
└─ extractBusinessData() → datos procesados
```

---

**Última Actualización:** 16 de Noviembre de 2025
**Estado:** ✅ Completo y Funcional
**Próxima Revisión:** Cuando agregues nuevas intenciones o datos
