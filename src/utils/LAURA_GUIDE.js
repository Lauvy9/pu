/**
 * 📚 GUÍA DE USO - MOTOR LAURA MEJORADO
 * 
 * El motor de chatbot LAURA ahora tiene un sistema completo de:
 * 1. Normalización de texto (minúsculas, correcciones ortográficas, fuzzy matching)
 * 2. Detección de intenciones (saludos, análisis, consultas, etc)
 * 3. Extracción de datos del negocio
 * 4. Generación de respuestas personalizadas con feedback learning
 */

// ============================================================================
// 📂 ESTRUCTURA DE ARCHIVOS
// ============================================================================

/**
 * src/utils/lauraTextNormalizer.js
 * ================================
 * Normaliza el texto del usuario:
 * - Minúsculas
 * - Elimina signos raros
 * - Corrige errores comunes (vendimo → vendimos)
 * - Reduce duplicaciones (holaaaa → hola)
 * - Fuzzy matching con Levenshtein
 *
 * Funciones principales:
 * - normalizeText(text) → string normalizado
 * - extractKeywords(text) → array de palabras clave
 * - containsAnyWord(text, words, useFuzzy) → boolean
 * - levenshteinDistance(a, b) → número de cambios
 * - wordSimilarity(a, b) → similitud 0-1
 * - fuzzyMatch(word, validWords, threshold) → mejor coincidencia
 */

// Ejemplo:
// normalizeText("holaaa que se vendio??") 
// → "hola que se vendio"
//
// wordSimilarity("vendimo", "vendimos") 
// → 0.857 (muy similar, > threshold 0.75)

// ============================================================================

/**
 * src/utils/intentDetector.js
 * ============================
 * Detecta la intención del usuario basada en texto normalizado.
 * Soporta intenciones:
 * - GREETING: "hola", "buenas", etc
 * - TOP_SALES: "qué se vendió más", "productos más vendidos"
 * - TODAY_SALES: "qué vendimos hoy"
 * - LOW_STOCK: "productos por quedarse sin stock"
 * - RECOMMEND: "recomiéndame para cliente X"
 * - COMBOS: "sugerime combos"
 * - TOTAL_REVENUE: "venta total de hoy"
 * - CATEGORY_STATS: "qué categoría vende más"
 * - LIST_PRODUCTS: "mostrar productos"
 * - LIST_CLIENTS: "mostrar clientes"
 * - HELP: "ayuda", "qué puedes hacer"
 * - UNKNOWN: no se detectó intención clara
 *
 * Retorna: { intent, params, hasGreeting }
 */

// Ejemplo:
// detectIntent("hola que se vendio mas hoy?")
// → {
//     intent: "topSales",
//     params: {},
//     hasGreeting: true
//   }

// ============================================================================

/**
 * src/utils/lauraResponseGenerator.js
 * ====================================
 * Genera respuestas personalizadas basadas en intención y datos.
 * Incluye:
 * - Tono amable y profesional
 * - Emojis relevantes (sin excesos)
 * - Feedback learning: si una intención se repite 3+ veces,
 *   agrega tips adicionales
 *
 * Funciones principales:
 * - generateResponse(intent, data) → string de respuesta
 * - frequencyTracker.track(intent) → registra consulta
 * - frequencyTracker.isFrequent(intent) → ¿es una consulta repetida?
 * - frequencyTracker.reset() → limpia estadísticas
 *
 * Respuestas por intención:
 * - GREETING: saludos variables
 * - TOP_SALES: lista de 3 productos + tips si es frecuente
 * - TODAY_SALES: ventas del día + item count
 * - LOW_STOCK: lista de productos con poco stock
 * - RECOMMEND: productos recomendados para cliente
 * - COMBOS: productos que se venden juntos
 * - TOTAL_REVENUE: ingresos totales
 * - CATEGORY_STATS: categoría más vendida
 * - LIST_PRODUCTS: primeros 5 productos
 * - LIST_CLIENTS: primeros 5 clientes
 * - HELP: lista de comandos disponibles
 */

// Ejemplo:
// generateResponse("topSales", {
//   topProducts: [
//     { name: "Cerveza", salesCount: 25 },
//     { name: "Vino", salesCount: 18 },
//     { name: "Whisky", salesCount: 12 }
//   ]
// })
// → "📈 **Productos más vendidos:**\n1. Cerveza (25 ventas)\n2. Vino (18 ventas)\n..."

// ============================================================================

/**
 * src/utils/lauraEngine.js
 * ========================
 * Motor central que orquesta todo:
 * 1. Detecta intención del usuario
 * 2. Extrae datos relevantes del negocio
 * 3. Genera respuesta personalizada
 *
 * Función principal:
 * - processQuery(userInput, storeContext) → {response, intent, params, metadata}
 *
 * storeContext necesita:
 * {
 *   sales: [],       // Array de ventas con items, total, date, etc
 *   products: [],    // Array de productos con stock, precio, etc
 *   fiados: []       // Array de clientes con deuda, nombre, etc
 * }
 */

// Ejemplo uso:
// import { processQuery } from './utils/lauraEngine'
//
// const result = processQuery("hola que vendimos hoy?", {
//   sales: store.sales,
//   products: store.products,
//   fiados: store.fiados
// })
//
// console.log(result.response)
// → "¡Hola! Estoy acá para ayudarte...
//    📅 **Hoy:**\n✅ 5 ventas\n📦 23 items vendidos\n💰 $2,500"

// ============================================================================

/**
 * src/components/LauraAssistant.jsx
 * =============================
 * Hook que integra el motor LAURA con el ChatBotContext.
 *
 * Función principal:
 * - askLAURA(userInput) → Promise<{text, intent, params, metadata}>
 *
 * Uso en componentes:
 * const { askLAURA } = useLauraChatBot()
 * const response = await askLAURA("qué se vendió?")
 * console.log(response.text)
 */

// ============================================================================

/**
 * src/components/LauraAssistant.jsx
 * ================================
 * Nuevo componente UI flotante (recomendado):
 * - Motor de intenciones integrado (usa `lauraEngine`)
 * - Chat bidireccional
 * - Auto-scroll
 * - Estado de typing ("Laura está escribiendo...")
 * - Paleta moderna: verde agua (#00bfa6), violeta (#8a2be2), rosa (#ff6ec7)
 * - Avatar circular (SVG) y burbujas redondeadas con sombras suaves
 * - Historial por sesión en `sessionStorage` (clave `laura_history`)
 *
 * Props:
 * - usuario: objeto Firebase user (opcional) — Laura guarda el nombre en memoria de sesión
 *
 * Uso en `App.jsx` (ejemplo):
 * import LauraAssistant from './components/LauraAssistant'
 *
 * {usuario && <LauraAssistant usuario={usuario} />}
 *
 * El componente automáticamente:
 * 1. Solo se muestra si hay usuario logueado (en el ejemplo)
 * 2. Lee datos desde `useStore()` (sales, products, fiados)
 * 3. Persiste historial en `sessionStorage` bajo `laura_history`
 * 4. Llama a `lauraEngine.processQuery({ text, storeContext, sessionId })`
 * 5. Muestra indicador de escritura y anima burbujas
 */

// ============================================================================
// 🎯 EJEMPLOS DE CONSULTAS QUE LAURA ENTIENDE
// ============================================================================

/**
 * SALUDOS (con o sin errores):
 * - "hola"
 * - "holaa laura"
 * - "buenos dias"
 * - "que onda"
 * - "hey"
 * 
 * RESPUESTA: Saludo amable + pregunta
 */

/**
 * PRODUCTOS MÁS VENDIDOS:
 * - "qué se vendió más"
 * - "productos mas vendidos"
 * - "que se vendio mas hoy"
 * - "top productos"
 * 
 * RESPUESTA: 
 * 📈 **Productos más vendidos:**
 * 1. Cerveza (25 ventas)
 * 2. Vino (18 ventas)
 * 3. Whisky (12 ventas)
 */

/**
 * VENTAS DE HOY:
 * - "que vendimos hoy"
 * - "ventas de hoy"
 * - "vendí hoy cuanto"
 * 
 * RESPUESTA:
 * 📅 **Hoy:**
 * ✅ 5 ventas
 * 📦 23 items vendidos
 * 💰 $2,500
 */

/**
 * STOCK BAJO:
 * - "productos por quedarse sin stock"
 * - "stock bajo"
 * - "se acaba algo"
 * - "inventario bajo"
 * 
 * RESPUESTA:
 * 📉 **Stock bajo:**
 * ⚠️ Cerveza → 3 unidades
 * ⚠️ Vino Tinto → 1 unidades
 * 🚨 Whisky → 0 unidades
 */

/**
 * RECOMENDACIÓN POR CLIENTE:
 * - "recomiéndame para cliente 123"
 * - "qué venderle al cliente 456"
 * - "producto para cliente 789"
 * 
 * RESPUESTA:
 * 🎯 **Para Juan García:**
 * • Cerveza (Combina bien)
 * • Papas fritas (Complementa bien)
 * • Maní (Complementa bien)
 */

/**
 * COMBOS:
 * - "sugerime combos"
 * - "combos recomendados"
 * - "productos que van juntos"
 * 
 * RESPUESTA:
 * 📦 **Combos frecuentes:**
 * 1. Cerveza + Papas (23x vendido)
 * 2. Vino + Queso (12x vendido)
 * 3. Whisky + Hielo (8x vendido)
 */

/**
 * INGRESOS TOTALES:
 * - "venta total de hoy"
 * - "cuanto vendí hoy"
 * - "ganancia total"
 * 
 * RESPUESTA:
 * 💰 **Total de hoy:** $2,500
 */

/**
 * CATEGORÍAS:
 * - "qué categoría vende más"
 * - "categoria mas vendida"
 * 
 * RESPUESTA:
 * 📈 **Categoría estrella:** Bebidas
 * ✅ 45 ventas
 * 💰 $12,000
 */

/**
 * LISTAR PRODUCTOS:
 * - "mostrar productos"
 * - "que productos tengo"
 * - "inventario"
 * 
 * RESPUESTA:
 * 📦 **Productos (23):**
 * • Cerveza ($5) - Stock: 15
 * • Vino ($8) - Stock: 3
 * • Whisky ($12) - Stock: 8
 * ...y 20 más.
 */

/**
 * LISTAR CLIENTES:
 * - "mostrar clientes"
 * - "quienes son mis clientes"
 * - "lista de clientes"
 * 
 * RESPUESTA:
 * 👥 **Clientes (15):**
 * • Juan García (Deuda: $500)
 * • María López
 * • Carlos Rodríguez (Deuda: $200)
 * ...y 12 más.
 */

/**
 * AYUDA:
 * - "ayuda"
 * - "qué puedes hacer"
 * - "cómo funciona"
 * - "comandos"
 * 
 * RESPUESTA: Lista completa de capacidades
 */

// ============================================================================
// 🔧 INTEGRACIÓN EN TU APLICACIÓN
// ============================================================================

/**
 * 1. Asegúrate que StoreContext devuelve sales, products, fiados
 * 
 * 2. En App.jsx, importa LauraAssistant:
 *    import LauraAssistant from './components/LauraAssistant'
 * 
 * 3. Renderiza dentro del StoreProvider:
 *    <StoreProvider>
 *      <YourApp />
 *      <LauraAssistant usuario={usuario} />
 *    </StoreProvider>
 * 
 * 4. El usuario debe estar logueado para que se muestre
 * 
 * 5. El bot accede automáticamente a los datos de useStore()
 */

// ============================================================================
// 📊 ESTRUCTURA DE DATOS ESPERADA
// ============================================================================

/**
 * SALES (ventas):
 * {
 *   id: "123",
 *   date: "2025-11-16T10:30:00Z",
 *   items: [
 *     { id: "prod1", name: "Cerveza", qty: 2, price: 5 },
 *     { id: "prod2", name: "Vino", qty: 1, price: 8 }
 *   ],
 *   total: 18,
 *   clienteFiado: null  // si es fiado, id del cliente
 * }
 *
 * PRODUCTS (productos):
 * {
 *   id: "prod1",
 *   name: "Cerveza",
 *   titulo: "Cerveza Artesanal",
 *   price: 5,
 *   precio: 5,
 *   stock: 15,
 *   category: "Bebidas"
 * }
 *
 * FIADOS (clientes):
 * {
 *   id: "client1",
 *   nombre: "Juan García",
 *   deuda: 500,
 *   movimientos: []
 * }
 */

// ============================================================================
// 🚀 FEATURES FUTUROS
// ============================================================================

/**
 * - Integración con backend real (API)
 * - Machine learning para mejorar detección de intenciones
 * - Persistencia de preferencias del usuario
 * - Análisis de sentimiento
 * - Sugerencias proactivas
 * - Exportar reportes desde el chat
 * - Integración con WhatsApp
 * - Voz a texto
 */

export default {}
