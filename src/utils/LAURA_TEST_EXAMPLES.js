/**
 * LAURA_TEST_EXAMPLES.js
 * 
 * Ejemplos de cómo probar el motor LAURA directamente
 * desde la consola o en pruebas unitarias.
 * 
 * Para usar: copia y pega cualquier sección en la consola del navegador
 */

// ============================================================================
// PRUEBA 1: Normalización de Texto
// ============================================================================

import {
  normalizeText,
  extractKeywords,
  wordSimilarity,
  containsAnyWord,
  extractNumbers,
  fuzzyMatch
} from './utils/lauraTextNormalizer'

console.log('=== PRUEBA 1: Normalización ===')

// Test 1a: Minúsculas y puntuación
console.log(normalizeText("HOLAA??? QUE SE VENDIO MAS!!!"))
// → "hola que se vendio mas"

// Test 1b: Errores comunes
console.log(normalizeText("que vendimso mas"))
// → "que vendimos mas"

// Test 1c: Duplicaciones
console.log(normalizeText("bueeenas diasss"))
// → "buenos dias"

// Test 1d: Fuzzy matching
console.log(wordSimilarity("cervze", "cerveza"))
// → 0.857 (muy similar)

console.log(wordSimilarity("vendimo", "vendimos"))
// → 0.857

// Test 1e: Extracción de números
console.log(extractNumbers("cliente 123 producto 456"))
// → [123, 456]

// ============================================================================
// PRUEBA 2: Detección de Intenciones
// ============================================================================

import { detectIntent, INTENT_TYPES } from './utils/intentDetector'

console.log('=== PRUEBA 2: Detección de Intenciones ===')

// Test 2a: Saludo simple
console.log(detectIntent("holaa"))
// → { intent: "greeting", params: {}, hasGreeting: true }

// Test 2b: Saludo + otra intención
console.log(detectIntent("hola que se vendio mas?"))
// → { intent: "topSales", params: {}, hasGreeting: true }

// Test 2c: Productos más vendidos (con errores)
console.log(detectIntent("que vendimso mas"))
// → { intent: "topSales", params: {}, hasGreeting: false }

// Test 2d: Ventas de hoy
console.log(detectIntent("que vendimos hoy"))
// → { intent: "todaySales", params: {}, hasGreeting: false }

// Test 2e: Stock bajo
console.log(detectIntent("productos por quedarse sin stock"))
// → { intent: "lowStock", params: {}, hasGreeting: false }

// Test 2f: Recomendación con ID
console.log(detectIntent("recomiendame para cliente 123"))
// → { intent: "recommend", params: { clientId: 123 }, hasGreeting: false }

// Test 2g: Ayuda
console.log(detectIntent("que puedo hacer"))
// → { intent: "help", params: {}, hasGreeting: false }

// Test 2h: Intención desconocida
console.log(detectIntent("asdfghjkl"))
// → { intent: "unknown", params: {}, hasGreeting: false }

// ============================================================================
// PRUEBA 3: Generación de Respuestas
// ============================================================================

import { generateResponse, frequencyTracker } from './utils/lauraResponseGenerator'

console.log('=== PRUEBA 3: Generación de Respuestas ===')

// Test 3a: Saludo
console.log(generateResponse(INTENT_TYPES.GREETING, {}))
// → "¡Hola! Estoy acá para ayudarte..."

// Test 3b: Top ventas
console.log(generateResponse(INTENT_TYPES.TOP_SALES, {
  topProducts: [
    { name: "Cerveza", salesCount: 25 },
    { name: "Vino", salesCount: 18 },
    { name: "Whisky", salesCount: 12 }
  ]
}))
// → "📈 **Productos más vendidos:**..."

// Test 3c: Ventas de hoy
console.log(generateResponse(INTENT_TYPES.TODAY_SALES, {
  salesCount: 5,
  totalRevenue: 2500,
  itemsCount: 23
}))
// → "📅 **Hoy:**\n✅ 5 ventas..."

// Test 3d: Stock bajo
console.log(generateResponse(INTENT_TYPES.LOW_STOCK, {
  lowStockProducts: [
    { name: "Cerveza", stock: 3 },
    { name: "Whisky", stock: 0 }
  ]
}))
// → "📉 **Stock bajo:**..."

// Test 3e: Feedback learning
frequencyTracker.track(INTENT_TYPES.TOP_SALES)
frequencyTracker.track(INTENT_TYPES.TOP_SALES)
frequencyTracker.track(INTENT_TYPES.TOP_SALES)

console.log(generateResponse(INTENT_TYPES.TOP_SALES, {
  topProducts: [{ name: "Cerveza", salesCount: 25 }]
}))
// → Incluye tip adicional porque se consultó 3 veces

// ============================================================================
// PRUEBA 4: Motor Completo
// ============================================================================

import { processQuery } from './utils/lauraEngine'

console.log('=== PRUEBA 4: Motor Completo ===')

// Datos de ejemplo
const mockStoreContext = {
  sales: [
    {
      id: "1",
      date: new Date().toISOString(),
      items: [
        { id: "prod1", name: "Cerveza", qty: 2, price: 5 },
        { id: "prod2", name: "Vino", qty: 1, price: 8 }
      ],
      total: 18
    },
    {
      id: "2",
      date: new Date().toISOString(),
      items: [
        { id: "prod1", name: "Cerveza", qty: 3, price: 5 }
      ],
      total: 15
    }
  ],
  products: [
    { id: "prod1", name: "Cerveza", price: 5, stock: 8, category: "Bebidas" },
    { id: "prod2", name: "Vino", price: 8, stock: 2, category: "Bebidas" },
    { id: "prod3", name: "Whisky", price: 12, stock: 0, category: "Destilados" }
  ],
  fiados: [
    { id: "client1", nombre: "Juan García", deuda: 500 },
    { id: "client2", nombre: "María López", deuda: 0 }
  ]
}

// Test 4a: Consulta simple
const result1 = processQuery("que se vendio mas", mockStoreContext)
console.log('Entrada:', "que se vendio mas")
console.log('Respuesta:', result1.response)
console.log('Intención:', result1.intent)
// Resultado:
// Entrada: que se vendio mas
// Respuesta: 📈 **Productos más vendidos:**
//            1. Cerveza (5 ventas)
//            2. Vino (1 ventas)
// Intención: topSales

// Test 4b: Saludo + consulta
const result2 = processQuery("hola que vendimos hoy", mockStoreContext)
console.log('Entrada:', "hola que vendimos hoy")
console.log('Respuesta:', result2.response)
// Resultado:
// Entrada: hola que vendimos hoy
// Respuesta: ¡Hola! ...
//            📅 **Hoy:**
//            ✅ 2 ventas
//            📦 5 items vendidos
//            💰 $33

// Test 4c: Stock bajo
const result3 = processQuery("stock bajo", mockStoreContext)
console.log('Respuesta para "stock bajo":')
console.log(result3.response)
// Resultado:
// 📉 **Stock bajo:**
// ⚠️ Vino → 2 unidades
// 🚨 Whisky → 0 unidades

// Test 4d: Con errores ortográficos
const result4 = processQuery("vendimso mas", mockStoreContext)
console.log('Entrada con error:', "vendimso mas")
console.log('Respuesta:', result4.response)
// Aún así detecta correctamente como TOP_SALES

// ============================================================================
// PRUEBA 5: Casos Especiales
// ============================================================================

console.log('=== PRUEBA 5: Casos Especiales ===')

// Test 5a: Múltiples errores
const result5 = processQuery("holaaaa qu se vendiooo maass???", mockStoreContext)
console.log('Entrada con múltiples errores:')
console.log(result5.response)
// Debería normalizar y responder correctamente

// Test 5b: Consulta desconocida
const result6 = processQuery("asdfghjkl", mockStoreContext)
console.log('Entrada desconocida:', "asdfghjkl")
console.log(result6.response)
// → Respuesta amigable indicando que no entiende

// Test 5c: Stock bajo con productos
const result7 = processQuery("productos que se acaban", mockStoreContext)
console.log('Entrada: "productos que se acaban"')
console.log(result7.response)
// Debería detectar como LOW_STOCK

// Test 5d: Listar productos
const result8 = processQuery("mostrar productos", mockStoreContext)
console.log('Entrada: "mostrar productos"')
console.log(result8.response)
// Debería listar los 3 productos con detalles

// ============================================================================
// CÓMO COPIAR Y PEGAR EN CONSOLA
// ============================================================================

/*
1. Abre la consola del navegador (F12 → Console)

2. Vaya a Reportes.jsx o cualquier página donde se usa LauraAssistant

3. En la consola, pega lo siguiente para importar:

import { processQuery } from './utils/lauraEngine'
import { detectIntent } from './utils/intentDetector'
import { normalizeText, wordSimilarity } from './utils/lauraTextNormalizer'

4. Luego prueba:

normalizeText("holaa que se vendiooo")

detectIntent("hola que se vendio mas")

// Para el motor completo, necesitas los datos de useStore()
// Así que es mejor testear desde un componente que ya tenga acceso
*/

// ============================================================================
// SCRIPT PARA DEBUG COMPLETO
// ============================================================================

/*
// Copia esto en cualquier componente que use LauraAssistant:

import { processQuery } from './utils/lauraEngine'
import { useStore } from './context/StoreContext'

export function DebugLaura() {
  const { sales, products, fiados } = useStore()

  const testQuery = (input) => {
    const result = processQuery(input, { sales, products, fiados: fiados })
    console.log('─'.repeat(60))
    console.log('📥 INPUT:', input)
    console.log('🎯 INTENT:', result.intent)
    console.log('💬 RESPONSE:', result.response)
    console.log('─'.repeat(60))
    return result
  }

  return (
    <div style={{ padding: 20, background: '#f0f0f0', borderRadius: 8 }}>
      <h3>🧪 Debug LAURA</h3>
      <button onClick={() => testQuery("hola que se vendio mas")}>
        Test 1: Saludo + TOP_SALES
      </button>
      <button onClick={() => testQuery("productos por quedarse sin stock")}>
        Test 2: LOW_STOCK
      </button>
      <button onClick={() => testQuery("vendimso hoy")}>
        Test 3: TODAY_SALES (con error)
      </button>
    </div>
  )
}

// Luego renderiza en Reportes.jsx:
// <DebugLaura />
*/

export default {}
