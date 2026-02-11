#!/usr/bin/env node
/**
 * 🚀 QUICK START - MOTOR LAURA
 * 
 * Guía rápida para empezar a usar LAURA en 5 minutos
 */

// ============================================================================
// PASO 1: VERIFICAR INTEGRACIÓN
// ============================================================================

/**
 * Abre: src/App.jsx
 * 
 * Busca estas líneas (deben estar):
 * 
 * import LauraAssistant from './components/LauraAssistant'
 * 
 * export default function App() {
 *   ...
 *   <StoreProvider>
 *     ...
 *     {usuario && <LauraAssistant usuario={usuario} />}
 *   </StoreProvider>
 * }
 * 
 * ✅ Si ves esto, está bien configurado
 * ❌ Si no, revisa que `LauraAssistant.jsx` exista
 */

// ============================================================================
// PASO 2: PROBAR EN NAVEGADOR
// ============================================================================

/**
 * 1. Inicia la app: npm run dev
 * 2. Abre http://localhost:5173
 * 3. Inicia sesión
 * 4. Busca el botón 🤖 en esquina inferior derecha
 * 5. Haz clic para abrir el chat
 */

// ============================================================================
// PASO 3: PRUEBAS BÁSICAS
// ============================================================================

/**
 * Copia estas frases en el chat de LAURA:
 * 
 * ✅ FUNCIONA:
 * - "hola"
 * - "que se vendio mas"
 * - "que vendimos hoy"
 * - "stock bajo"
 * - "mostrar productos"
 * - "mostrar clientes"
 * 
 * ✅ TAMBIÉN FUNCIONA (CON ERRORES):
 * - "holaa que se vendimso mas???"
 * - "vendimos hoy cuanto vendste"
 * - "stock baajo"
 * - "mostrar clinetes"
 * 
 * Laura normalizará el texto automáticamente
 */

// ============================================================================
// PASO 4: DEBUG EN CONSOLA
// ============================================================================

/**
 * Abre consola: F12 → Console
 * 
 * Prueba estos comandos:
 * 
 * // Test 1: Normalización
 * import { normalizeText } from './utils/lauraTextNormalizer'
 * normalizeText("HOLAA??? QUE VENDIMSO MAS!!!")
 * // Resultado: "hola que vendimos mas"
 * 
 * // Test 2: Detección
 * import { detectIntent } from './utils/intentDetector'
 * detectIntent("hola que se vendio mas")
 * // Resultado: { intent: "topSales", params: {}, hasGreeting: true }
 * 
 * // Test 3: Similitud
 * import { wordSimilarity } from './utils/lauraTextNormalizer'
 * wordSimilarity("cervze", "cerveza")
 * // Resultado: 0.857 (muy similar, > 0.75)
 */

// ============================================================================
// PASO 5: PERSONALIZAR
// ============================================================================

/**
 * Para agregar nuevas intenciones:
 * 
 * 1. Abre src/utils/intentDetector.js
 * 2. Busca INTENT_TYPES
 * 3. Agrega tu intención:
 *    export const INTENT_TYPES = {
 *      ...
 *      MY_NEW_INTENT: 'myNewIntent'
 *    }
 * 4. Crea detectMyNewIntent(text) función
 * 5. Agregala en detectIntent()
 * 
 * 6. Abre src/utils/lauraResponseGenerator.js
 * 7. Crea generateMyNewIntentResponse(data)
 * 8. Agrega en generateResponse() switch
 * 
 * ✅ Listo, LAURA entiende tu nueva intención
 */

// ============================================================================
// PASO 6: ESTRUCTURA DE DATOS MÍNIMA
// ============================================================================

/**
 * LAURA necesita estos datos de useStore():
 * 
 * {
 *   sales: [
 *     {
 *       id: "1",
 *       date: "2025-11-16T10:30:00Z",
 *       items: [
 *         { id: "prod1", name: "Cerveza", qty: 2, price: 5 }
 *       ],
 *       total: 10
 *     }
 *   ],
 *   products: [
 *     {
 *       id: "prod1",
 *       name: "Cerveza",
 *       price: 5,
 *       stock: 15,
 *       category: "Bebidas"
 *     }
 *   ],
 *   fiados: [
 *     {
 *       id: "client1",
 *       nombre: "Juan García",
 *       deuda: 500
 *     }
 *   ]
 * }
 * 
 * Si tienes estos datos, LAURA funcionará perfectamente.
 * Si no tienes todos, LAURA igualmente responderá amablemente.
 */

// ============================================================================
// PASO 7: SOLUCIÓN DE PROBLEMAS
// ============================================================================

/**
 * ❌ "No veo el botón 🤖"
 * → Revisa que hayas iniciado sesión
 * → Busca en esquina inferior derecha
 * → F12 → Console para ver errores
 * 
 * ❌ "El chat no responde"
 * → Verifica que sales, products, fiados no sean undefined
 * → Revisa console para errores
 * → Prueba recargar página
 * 
 * ❌ "Las respuestas están vacías"
 * → LAURA no tiene datos (sales, products vacíos es normal)
 * → Agrega algunos datos de prueba en StoreContext
 * → O prueba consultas que no necesitan datos (ayuda, etc)
 * 
 * ❌ "Error: Cannot read property 'split'"
 * → Probablemente storeContext es null
 * → Verifica que useStore() devuelva los datos correctos
 * → Revisa que `LauraAssistant` esté dentro de `StoreProvider`
 */

// ============================================================================
// PASO 8: FLUJO DE UNA CONSULTA
// ============================================================================

/**
 * Usuario: "holaa que vendimso mas???"
 * 
 * 1️⃣ NORMALIZACIÓN
 *    "holaa que vendimso mas???" 
 *    → "hola que vendimos mas"
 * 
 * 2️⃣ DETECCIÓN DE INTENCIÓN
 *    "hola que vendimos mas"
 *    → intent: "topSales", hasGreeting: true
 * 
 * 3️⃣ EXTRACCIÓN DE DATOS
 *    Busca en sales los productos más vendidos
 *    → topProducts: [{name: "Cerveza", salesCount: 25}, ...]
 * 
 * 4️⃣ GENERACIÓN DE RESPUESTA
 *    Combina: saludo + respuesta de topSales
 *    → "¡Hola! 👋 ... 📈 **Productos más vendidos:** ..."
 * 
 * 5️⃣ RENDERIZAR EN CHAT
 *    Muestra en interfaz con tema violeta
 *    → Mensaje de bot aparece en chat
 * 
 * 6️⃣ FEEDBACK LEARNING
 *    Rastrea que "topSales" fue consultado
 *    → Si se repite 3+, próxima respuesta incluye tips
 */

// ============================================================================
// PASO 9: EJEMPLOS AVANZADOS
// ============================================================================

/**
 * Estos funcionan:
 * 
 * 1. "para cliente 123, recomiendame algo"
 *    → Detecta RECOMMEND + cliente 123
 *    → Muestra productos recomendados para ese cliente
 * 
 * 2. "hola buenos dias dame los clientes"
 *    → Detecta saludo + LIST_CLIENTS
 *    → Combina respuesta con lista
 * 
 * 3. "cuanto vendiste hoy vendiste hoy cuanto vendiste"
 *    → Normaliza duplicaciones
 *    → Detecta TODAY_SALES
 *    → Feedback learning nota que se repite
 * 
 * 4. "vendimso masss" (con errores)
 *    → Normaliza a "vendimos mas"
 *    → Fuzzy matching entiende "masss" = "más"
 *    → Detecta TOP_SALES
 */

// ============================================================================
// PASO 10: MEJORAR CONTINUAMENTE
// ============================================================================

/**
 * Cosas que puedes hacer:
 * 
 * 1. Agregar más correcciones en CORRECTION_MAP
 *    → src/utils/lauraTextNormalizer.js línea ~13
 * 
 * 2. Agregar más palabras clave para intenciones
 *    → src/utils/intentDetector.js línea ~50+
 * 
 * 3. Cambiar respuestas
 *    → src/utils/lauraResponseGenerator.js línea ~45+
 * 
 * 4. Ajustar threshold de similitud
 *    → src/utils/lauraTextNormalizer.js línea ~138
 *    → Cambiar 0.75 a 0.8 para ser más estricto
 * 
 * 5. Agregar más emojis o cambiar tema
 *    → src/components/LauraAssistant.jsx para UI
 */

// ============================================================================
// PASO 11: COMANDOS ÚTILES
// ============================================================================

/**
 * En consola del navegador (F12 → Console):
 * 
 * // Resetear feedback learning
 * import { frequencyTracker } from './utils/lauraResponseGenerator'
 * frequencyTracker.reset()
 * console.log("Feedback learning reseteado")
 * 
 * // Ver frecuencia de consultas
 * frequencyTracker.queries
 * 
 * // Simular procesamiento
 * import { processQuery } from './utils/lauraEngine'
 * const result = processQuery(
 *   "hola que se vendio mas",
 *   { sales: [], products: [], fiados: [] }
 * )
 * console.log(result.response)
 */

// ============================================================================
// PASO 12: DOCUMENTACIÓN COMPLETA
// ============================================================================

/**
 * Archivos de documentación:
 * 
 * 📄 LAURA_IMPLEMENTATION.md
 *    → Guía completa de integración
 *    → Tabla de intenciones
 *    → Ejemplos de uso
 * 
 * 📄 LAURA_INDEX.md
 *    → Índice de todos los archivos
 *    → Relaciones entre módulos
 *    → Checklist de requisitos
 * 
 * 📄 LAURA_GUIDE.js (en código)
 *    → Documentación técnica
 *    → Explicación de algoritmos
 *    → Estructura de datos
 * 
 * 📄 LAURA_TEST_EXAMPLES.js (en código)
 *    → Ejemplos de pruebas
 *    → Scripts de debug
 *    → Casos de uso reales
 * 
 * 📄 LAURA_SUMMARY.txt
 *    → Resumen visual ASCII
 *    → Características principales
 *    → Técnicas implementadas
 */

// ============================================================================
// RESUMEN RÁPIDO
// ============================================================================

console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                   🚀 LAURA - QUICK START                         ║
╚═══════════════════════════════════════════════════════════════════╝

✅ VERIFICACIÓN:
   1. LauraAssistant.jsx existe en src/components/
   2. App.jsx tiene <LauraAssistant usuario={usuario} />
   3. StoreProvider envuelve la app

✅ PRUEBA:
   1. npm run dev
   2. Inicia sesión
   3. Busca botón 🤖 esquina inferior derecha
   4. Abre chat y escribe "hola"

✅ PERSONALIZACIÓN:
   1. Agrega más correcciones en lauraTextNormalizer.js
   2. Agrega más palabras clave en intentDetector.js
   3. Modifica respuestas en lauraResponseGenerator.js

✅ DOCUMENTACIÓN:
   • LAURA_IMPLEMENTATION.md → Resumen completo
   • LAURA_INDEX.md → Índice de archivos
   • LAURA_GUIDE.js → Documentación técnica
   • LAURA_TEST_EXAMPLES.js → Ejemplos y debug

╔═══════════════════════════════════════════════════════════════════╗
║            Listo para usar. ¡Que disfrutes LAURA! 🤖             ║
╚═══════════════════════════════════════════════════════════════════╝
`)
