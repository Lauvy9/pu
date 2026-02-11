/**
 * intentDetector.js
 * Detecta intenciones del usuario a partir del texto normalizado.
 * Retorna intención + parámetros extraídos.
 */

import {
  normalizeText,
  extractKeywords,
  containsAnyWord,
  extractNumbers,
  extractIds,
  isGreeting,
  isAddressedToLaura,
} from './lauraTextNormalizer'

// Tipos de intenciones detectables
export const INTENT_TYPES = {
  GREETING: 'greeting',
  // Intents originales de negocio
  TOP_SALES: 'topSales',           // "qué se vendió más", "productos más vendidos"
  TODAY_SALES: 'todaySales',       // "qué vendimos hoy"
  LOW_STOCK: 'lowStock',           // "productos por quedarse sin stock"
  RECOMMEND: 'recommend',          // "recomiéndame para cliente X"
  COMBOS: 'combos',                // "sugerime combos"
  TOTAL_REVENUE: 'totalRevenue',   // "venta total de hoy"
  CATEGORY_STATS: 'categoryStats', // "qué categoría vende más"
  LIST_PRODUCTS: 'listProducts',   // "mostrar productos"
  LIST_CLIENTS: 'listClients',     // "mostrar clientes"
  HELP: 'help',                    // "ayuda", "qué puedes hacer"
  // Intents de memoria conversacional
  REMEMBER_PURCHASE: 'rememberPurchase',    // "Ana compró vidrio templado 8mm"
  ASK_PURCHASE_HISTORY: 'askPurchaseHistory', // "¿Qué compró Ana la última vez?"
  ASK_MEMORY_VALUE: 'askMemoryValue',      // "¿Qué precio tenía el marco roble del que te hablé?"
  UPDATE_KNOWN_PRICE: 'updateKnownPrice',  // "El cuaderno ahora sale $50"
  ASK_KNOWN_PRICE: 'askKnownPrice',        // "¿Cuánto cuesta el cuaderno del que me hablaste?"
  // Nuevos intents de análisis de negocio
  QUERY_STOCK: 'queryStock',               // "¿Cuál es el stock más bajo?", "¿Qué producto [X]?"
  QUERY_FIADOS: 'queryFiados',             // "¿Quién debe?", "¿Cuánto debe [cliente]?"
  QUERY_SALES: 'querySales',               // "¿Qué vendimos hoy?", "Resumen de hoy"
  PROFIT_ANALYSIS: 'profitAnalysis',       // "¿Cuál es la ganancia?", "Análisis de ganancias"
  STRATEGY_SUGGESTIONS: 'strategySuggestions', // "Dame sugerencias", "¿Qué debería hacer?"
  PATTERN_ANALYSIS: 'patternAnalysis',     // "Patrones de venta", "Análisis de datos"
  LIST_CLIENTS: 'listClients',             // "listar clientes", "todos los clientes"
  CLIENTS_NEW: 'clientsNew',               // "clientes nuevos"
  CLIENTS_FREQUENT: 'clientsFrequent',     // "clientes frecuentes"
  CLIENTS_RECENT: 'clientsRecent',         // "clientes recientes / registrados"
  LIST_FIADOS: 'listFiados',               // "listar fiados", "todos los fiados"
  CLIENT_DETAILS: 'clientDetails',         // "cliente <nombre>", "detalle cliente"
  FIADO_DETAILS: 'fiadoDetails',           // "fiado <nombre>", "cuánto debe <nombre>"
  TODAY_CLIENTS: 'todayClients',           // "clientes de hoy"
  UNKNOWN: 'unknown'
}

/**
 * Detecta si el texto es un saludo
 */
function detectGreeting(text) {
  // Delegar a isGreeting del normalizador (fuzzy + activadores por nombre)
  return isGreeting(text)
}

/**
 * Detecta si es solicitud de productos más vendidos
 */
function detectTopSales(text) {
  const keywords = [
    'vendió más', 'vendio mas', 'más vendido', 'mas vendido',
    'producto más vendido', 'productos más vendidos',
    'top productos', 'mejores ventas', 'qué se vendió'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta clientes nuevos (primera compra en últimos 7 días)
 */
function detectClientsNew(text) {
  const keywords = [
    'clientes nuevos', 'clientes nuevo', 'nuevos clientes',
    'clientes recientes', 'clientes del día', 'clientes nuevos esta semana'
  ]
  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta clientes frecuentes (más de 3 compras históricas)
 */
function detectClientsFrequent(text) {
  const keywords = [
    'clientes frecuentes', 'clientes mas frecuentes', 'clientes más frecuentes',
    'clientes habituales', 'clientes que más compran', 'clientes frecuentes'
  ]
  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta "clientes recientes" / "clientes registrados"
 */
function detectClientsRecent(text) {
  const keywords = [
    'clientes recientes', 'clientes registrados', 'clientes del mes',
    'clientes del dia', 'clientes del día', 'clientes hoy'
  ]
  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta si es consulta de ventas de hoy
 */
function detectTodaySales(text) {
  const keywords = [
    'vendimos hoy', 'que vendimos', 'ventas de hoy',
    'vendí hoy', 'vendiste hoy', 'qué vendimos',
    'resumen de hoy', 'hoy vendimos'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta si es consulta de stock bajo
 */
function detectLowStock(text) {
  const keywords = [
    'stock bajo', 'sin stock', 'quedarse sin stock',
    'por quedarse sin stock', 'se acaba', 'se agotan',
    'productos que se acaban', 'inventario bajo',
    'stock mínimo', 'reposición'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta si es solicitud de recomendación para cliente
 */
function detectRecommend(text) {
  const keywords = [
    'recomiéndame', 'recomienda', 'qué venderle',
    'qué puedo vender', 'sugerir para', 'producto para',
    'cliente', 'recomendación'
  ]

  if (!containsAnyWord(text, keywords, true)) return null

  // Intentar extraer ID de cliente
  const ids = extractIds(text)
  return { clientId: ids.length > 0 ? ids[0] : null }
}

/**
 * Extrae un posible nombre de cliente desde el texto
 */
function extractClientName(text) {
  if (!text) return null
  const words = text.toLowerCase().replace(/[^a-z0-9áéíóúñ\s]/g, '').split(' ').filter(Boolean)
  const clientKeywords = ['cliente', 'clientes', 'comprador', 'usuario', 'detalle']

  // Buscar palabra que no sea una keyword y que tenga al menos 3 letras
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    if (clientKeywords.includes(w)) continue
    if (w.length > 2) {
      return w.charAt(0).toUpperCase() + w.slice(1)
    }
  }
  return null
}

/**
 * Detecta si es solicitud de combos
 */
function detectCombos(text) {
  const keywords = [
    'combos', 'combo', 'sugerir combos', 'sugerime combos',
    'combos recomendados', 'bundled', 'paquetes',
    'productos que van juntos'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta si es consulta de ingresos totales
 */
function detectTotalRevenue(text) {
  const keywords = [
    'venta total', 'total vendido', 'ingresos', 'ingresos totales',
    'cuánto vendimos', 'cuánto vendí', 'total de ventas',
    'ganancia', 'ganancia total'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta si es consulta de categorías
 */
function detectCategoryStats(text) {
  const keywords = [
    'categoría', 'categoria', 'categoría vende más',
    'categoria vende mas', 'qué categoría', 'categoria que vende',
    'rubro', 'tipo de producto'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta si quiere ver lista de productos
 */
function detectListProducts(text) {
  const keywords = [
    'mostrar productos', 'productos', 'listar productos',
    'dame los productos', 'cuáles son los productos',
    'cuales son los productos', 'inventario'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta si quiere ver lista de clientes
 */
function detectListClients(text) {
  const keywords = [
    'mostrar clientes', 'clientes', 'listar clientes',
    'dame los clientes', 'cuáles son los clientes',
    'cuales son los clientes', 'lista de clientes'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta si pide ayuda
 */
function detectHelp(text) {
  const keywords = [
    'ayuda', 'help', 'qué puedes hacer', 'qué puedo hacer',
    'quiero saber', 'explícame', 'explica', 'cómo funciona',
    'opciones', 'comandos'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta si el usuario quiere recordar una compra
 * Ej: "Ana compró vidrio templado 8mm", "Juan pidió 10 metros de cable"
 */
function detectRememberPurchase(text) {
  const keywords = [
    'compró', 'compro', 'comprar', 'pidió', 'pidio', 'pedir',
    'le vendí', 'le vendi', 'vendimos a', 'cliente', 'necesita'
  ]

  // Buscar patrón: [Nombre] [verbo] [producto]
  // Simplificado: contiene nombre propio + verbo
  const hasAction = containsAnyWord(text, keywords, true)
  const hasNumber = /\d+/.test(text) // Número de unidades o medida
  
  return hasAction && (hasNumber || text.length > 20)
}

/**
 * Detecta si pregunta por historial de compra de cliente
 * Ej: "¿Qué compró Ana la última vez?", "Historial de Juan", "Qué pidió María?"
 */
function detectAskPurchaseHistory(text) {
  const keywords = [
    'compró', 'compro', 'qué compró', 'que compro', 'historial',
    'última vez', 'ultima vez', 'pidió', 'pidio', 'qué pidió',
    'qué cliente', 'que cliente', 'historial de'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta si pregunta por algo recordado previamente
 * Ej: "¿Qué precio tenía el marco roble del que te hablé ayer?"
 */
function detectAskMemoryValue(text) {
  const keywords = [
    'qué precio', 'que precio', 'del que te hablé', 'del que me hablaste',
    'precio de', 'cómo era', 'como era', 'cuál era', 'cual era',
    'recordás', 'recordas', 'te acuerdas', 'te acordas', 'mencioné',
    'mencione', 'dijiste', 'dijiste'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta si el usuario actualiza o informa un precio conocido
 * Ej: "El cuaderno ahora sale $50", "Precio nuevo: vidrio templado $1200"
 */
function detectUpdateKnownPrice(text) {
  const keywords = [
    'ahora sale', 'sale', 'cuesta', 'precio nuevo', 'precio de',
    'cambié a', 'cambie a', 'actualizar precio', 'nuevo precio'
  ]

  return containsAnyWord(text, keywords, true) && /\$|\d+/.test(text)
}

/**
 * Detecta si pregunta por precio conocido
 * Ej: "¿Cuánto cuesta el cuaderno del que me hablaste?"
 */
function detectAskKnownPrice(text) {
  const keywords = [
    'cuánto cuesta', 'cuanto cuesta', 'cuál es el precio', 'cual es el precio',
    'qué cuesta', 'que cuesta', 'precio del', 'precio de',
    'cuánto sale', 'cuanto sale', 'del que me hablaste', 'que mencionaste'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta si es consulta sobre stock específico
 * Ej: "¿Cuál es el stock más bajo?", "Stock del cuaderno", "¿Tengo que reponer algo?"
 */
function detectQueryStock(text) {
  const keywords = [
    'stock', 'inventario', 'qué tengo', 'reponer', 'reposición',
    'bajo', 'falta', 'acaba', 'se acaba', 'sin stock', 'cantidad',
    'cuántos quedan', 'cuantos quedan', 'hay en stock'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta consulta sobre fiados/deudas
 * Ej: "¿Quién debe?", "¿Cuánto debe Ana?", "Deudas"
 */
function detectQueryFiados(text) {
  const keywords = [
    'fiado', 'debe', 'deuda', 'adeuda', 'pagar', 'crédito',
    'quién debe', 'quien debe', 'cuánto debe', 'cuanto debe',
    'cobranza', 'pendiente', 'cliente debe'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta consulta sobre ventas del día/período
 * Ej: "¿Qué vendimos hoy?", "Resumen de hoy", "Ventas"
 */
function detectQuerySales(text) {
  const keywords = [
    'vendimos', 'vendí', 'ventas', 'vendió', 'vendido', 'hoy',
    'ayer', 'esta semana', 'este mes', 'resumen', 'facturación',
    'facturé', 'facturas', 'movimiento de hoy', 'lo que se vendió'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta consulta sobre ganancia/profit
 * Ej: "¿Cuál es la ganancia?", "Análisis de ganancias", "¿Ganancia?"
 */
function detectProfitAnalysis(text) {
  const keywords = [
    'ganancia', 'ganancia', 'ganancia total', 'profit', 'rentable',
    'ganancia hoy', 'ganancia del día', 'cuánto gané', 'cuanto gane',
    'ingreso', 'análisis financiero', 'financiero', 'margen'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta solicitud de sugerencias/estrategias
 * Ej: "Dame sugerencias", "¿Qué debería hacer?", "Necesito ideas"
 */
function detectStrategySuggestions(text) {
  const keywords = [
    'sugerencia', 'sugerir', 'qué debería', 'que deberia', 'ideas',
    'recomendación', 'recomenda', 'estrategia', 'optimizar',
    'mejorar', 'qué hago', 'que hago', 'consejo'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta solicitud de análisis de patrones
 * Ej: "Patrones de venta", "Análisis", "Qué productos son populares"
 */
function detectPatternAnalysis(text) {
  const keywords = [
    'patrón', 'patron', 'análisis', 'analisis', 'datos', 'tendencia',
    'popular', 'más vendido', 'mas vendido', 'bestseller', 'insights',
    'qué vende', 'que vende', 'ventas altas'
  ]

  return containsAnyWord(text, keywords, true)
}

/**
 * Detecta intención principal + extrae parámetros
 * Retorna: { intent: INTENT_TYPES.XXX, params: { ... }, hasGreeting: boolean, addressedToLaura: boolean }
 */
export function detectIntent(userInput) {
  const normalized = normalizeText(userInput)

  // Detectar saludo (puede estar combinado con otra intención)
  const hasGreeting = detectGreeting(normalized)
  const addressedToLaura = isAddressedToLaura(normalized)

  // Detectar intención principal (se verifica en orden de especificidad)
  // Prioridad: intents de memoria > intents de negocio > general

  // Intents de negocio avanzado (NUEVA PRIORIDAD - PRIMEROS)
  if (detectQueryStock(normalized)) {
    return {
      intent: INTENT_TYPES.QUERY_STOCK,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectQueryFiados(normalized)) {
    return {
      intent: INTENT_TYPES.QUERY_FIADOS,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectQuerySales(normalized)) {
    return {
      intent: INTENT_TYPES.QUERY_SALES,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  // Nuevos intents específicos sobre "clientes" (evaluar antes de extracción por nombre)
  if (detectClientsFrequent(normalized)) {
    return {
      intent: INTENT_TYPES.CLIENTS_FREQUENT,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectClientsNew(normalized)) {
    return {
      intent: INTENT_TYPES.CLIENTS_NEW,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectClientsRecent(normalized)) {
    return {
      intent: INTENT_TYPES.CLIENTS_RECENT,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectProfitAnalysis(normalized)) {
    return {
      intent: INTENT_TYPES.PROFIT_ANALYSIS,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectStrategySuggestions(normalized)) {
    return {
      intent: INTENT_TYPES.STRATEGY_SUGGESTIONS,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectPatternAnalysis(normalized)) {
    return {
      intent: INTENT_TYPES.PATTERN_ANALYSIS,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  // Intents de memoria (segundo)
  if (detectRememberPurchase(normalized)) {
    return {
      intent: INTENT_TYPES.REMEMBER_PURCHASE,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectAskPurchaseHistory(normalized)) {
    return {
      intent: INTENT_TYPES.ASK_PURCHASE_HISTORY,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectAskMemoryValue(normalized)) {
    return {
      intent: INTENT_TYPES.ASK_MEMORY_VALUE,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectUpdateKnownPrice(normalized)) {
    return {
      intent: INTENT_TYPES.UPDATE_KNOWN_PRICE,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectAskKnownPrice(normalized)) {
    return {
      intent: INTENT_TYPES.ASK_KNOWN_PRICE,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  // Intents de negocio originales (tercero)
  if (detectLowStock(normalized)) {
    return {
      intent: INTENT_TYPES.LOW_STOCK,
      params: {},
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectRecommend(normalized)) {
    const params = detectRecommend(normalized)
    return {
      intent: INTENT_TYPES.RECOMMEND,
      params,
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectCombos(normalized)) {
    return {
      intent: INTENT_TYPES.COMBOS,
      params: {},
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectTopSales(normalized)) {
    return {
      intent: INTENT_TYPES.TOP_SALES,
      params: {},
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectTodaySales(normalized)) {
    return {
      intent: INTENT_TYPES.TODAY_SALES,
      params: {},
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectTotalRevenue(normalized)) {
    return {
      intent: INTENT_TYPES.TOTAL_REVENUE,
      params: {},
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectCategoryStats(normalized)) {
    return {
      intent: INTENT_TYPES.CATEGORY_STATS,
      params: {},
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectListProducts(normalized)) {
    return {
      intent: INTENT_TYPES.LIST_PRODUCTS,
      params: {},
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectListClients(normalized)) {
    return {
      intent: INTENT_TYPES.LIST_CLIENTS,
      params: {},
      hasGreeting,
      addressedToLaura,
    }
  }

  // Detectar variantes más explícitas de listar clientes
  if (normalized.match(/listar clientes|todos los clientes|lista de clientes|mostrar clientes|ver clientes|clientes todos|listar todos|lista completa|ver todos/)) {
    return {
      intent: INTENT_TYPES.LIST_CLIENTS,
      params: {},
      hasGreeting,
      addressedToLaura,
    }
  }

  // Detectar listar fiados
  if (normalized.match(/listar fiados|todos los fiados|lista de fiados|mostrar fiados|ver fiados|fiados todos/)) {
    return {
      intent: INTENT_TYPES.LIST_FIADOS,
      params: {},
      hasGreeting,
      addressedToLaura,
    }
  }

  // Detectar detalle de cliente: "cliente <nombre>", "buscar cliente <nombre>", "información del cliente <nombre>"
  const clientMatch = normalized.match(/(?:cliente|clientes|buscar cliente|información del cliente|info cliente)\s+([\wáéíóúñ]+)/i)
  if (clientMatch && clientMatch[1]) {
    return {
      intent: INTENT_TYPES.CLIENT_DETAILS,
      params: { clientName: clientMatch[1], rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  // Detectar detalle de fiado: "fiado <nombre>", "deuda <nombre>", "cuánto debe <nombre>"
  const fiadoMatch = normalized.match(/(?:fiado|deuda|cuánto debe|cuanto debe)\s+([\wáéíóúñ]+)/i)
  if (fiadoMatch && fiadoMatch[1]) {
    return {
      intent: INTENT_TYPES.FIADO_DETAILS,
      params: { clientName: fiadoMatch[1], rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  // Detectar "clientes de hoy" → mapear a TODAY_CLIENTS
  if (normalized.match(/clientes de hoy|clientes hoy|clientes del día|clientes del dia/)) {
    return {
      intent: INTENT_TYPES.TODAY_CLIENTS,
      params: { rawInput: userInput },
      hasGreeting,
      addressedToLaura,
    }
  }

  if (detectHelp(normalized)) {
    return {
      intent: INTENT_TYPES.HELP,
      params: {},
      hasGreeting,
      addressedToLaura,
    }
  }

  if (hasGreeting && normalized.length < 20) {
    // Solo saludo sin otra intención clara
    return {
      intent: INTENT_TYPES.GREETING,
      params: {},
      hasGreeting: true,
      addressedToLaura,
    }
  }

  return {
    intent: INTENT_TYPES.UNKNOWN,
    params: {},
    hasGreeting,
    addressedToLaura,
  }
}

export default {
  detectIntent,
  INTENT_TYPES,
}
