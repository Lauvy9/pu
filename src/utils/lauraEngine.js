/**
 * lauraEngine.js
 * Motor central de LAURA. Orquesta normalizador, detector de intenciones,
 * lógica de negocio, análisis inteligente y generación de respuestas.
 */

import { detectIntent, INTENT_TYPES } from './intentDetector'
import { generateResponse } from './lauraResponseGenerator'
import * as memoryManager from './memoryManager'
import * as memoryResponseGen from './memoryResponseGenerator'
import * as analyzer from './businessAnalyzer'
import * as businessGen from './businessResponseGenerator'
import * as context from './conversationContext'
import * as entityDetector from './entityDetector'
import * as proactiveGen from './proactiveResponseGenerator'
import * as lauraLogic from '../context/lauraLogic'

// Cargar memoria al iniciar el módulo
memoryManager.loadMemory()
context.initializeContext()

/**
 * Procesa una consulta completa
 * 1. Normaliza el texto
 * 2. NUEVO: Analiza query mínimo (palabra clave o entidad)
 * 3. Detecta intención
 * 4. Ejecuta lógica de negocio según la intención
 * 5. Genera respuesta personalizada (puede ser proactiva si es ambigua)
 *
 * @param userInput - Texto del usuario
 * @param storeContext - Contexto con datos (sales, products, clients, etc)
 * @returns { response: string, intent: string, metadata: {} }
 */
export function processQuery(userInput, storeContext = {}) {
  try {
    // 1. Enriquecer query con contexto conversacional
    const enrichedContext = context.enrichQuery(userInput)

    // 2. NUEVO: Analizar query mínimo (detectar entidades/palabras clave)
    const minimalAnalysis = entityDetector.analyzeMinimalQuery(userInput, storeContext)
    const isMinimalQuery = userInput.trim().split(' ').length <= 2

    // 3. Detectar intención
    const { intent, params, hasGreeting, addressedToLaura } = detectIntent(userInput)

    // 4. Preparar datos según la intención
    const businessData = extractBusinessData(intent, params, storeContext)

    // 5. Generar respuesta (puede ser proactiva, de memoria, negocio o análisis)
    let response = ''

    // NUEVO: Si es query mínimo con análisis, generar respuesta proactiva
    if (isMinimalQuery && minimalAnalysis.category !== 'UNKNOWN') {
      const proactiveResponse = proactiveGen.generateProactiveResponse(minimalAnalysis, storeContext)
      response = proactiveResponse
    } else if (intent === INTENT_TYPES.GREETING) {
      // Saludo puro: generar respuesta amigable
      response = getGreetingResponse()
    } else if (businessData.response) {
      // Respuesta pre-generada por análisis
      response = businessData.response
    } else if (businessData.memoryResult) {
      // Intent de memoria
      response = businessData.memoryResult.response
    } else if (businessData.helpResponse) {
      // Help
      response = businessData.helpResponse
    } else {
      // Intent de negocio original
      response = generateResponse(intent, businessData)
    }

    // 6. Combinar saludo + acción si corresponde
    let finalResponse = response
    if (addressedToLaura && intent === INTENT_TYPES.GREETING) {
      // Saludado por nombre: respuesta personalizada
      finalResponse = getNameGreetingResponse()
    } else if (intent === INTENT_TYPES.GREETING) {
      // Saludo puro sin mencionar a Laura: usar respuesta genérica (ya está en response)
      finalResponse = response
    } else if (hasGreeting && addressedToLaura && intent !== INTENT_TYPES.GREETING) {
      // Saludo + otra intención, mencionando a Laura
      const greetingPrefix = getNameGreetingResponseShort()
      finalResponse = `${greetingPrefix}\n\n${response}`
    } else if (hasGreeting && intent !== INTENT_TYPES.GREETING) {
      // Saludo + otra intención, sin mencionar a Laura
      const greetingPrefix = getGreetingResponse()
      finalResponse = `${greetingPrefix}\n\n${response}`
    }

    // 7. Registrar interacción en memoria y contexto
    memoryManager.logConversation(userInput, finalResponse, intent, {
      hasGreeting,
      addressedToLaura,
      analysisType: businessData.analysisType,
      minimalQuery: isMinimalQuery,
      minimalAnalysis: minimalAnalysis
    })

    context.recordInteraction(userInput, finalResponse, intent, {
      analysisType: businessData.analysisType,
      context: enrichedContext
    })

    return {
      response: finalResponse,
      intent,
      params,
      metadata: {
        hasGreeting,
        addressedToLaura,
        dataUsed: businessData,
        context: enrichedContext,
        minimalQuery: isMinimalQuery,
        minimalAnalysis: minimalAnalysis
      },
    }
  } catch (err) {
    // Manejo de errores: devolver fallback amigable y loggear el error (incluye stack)
    const errorStack = err && err.stack ? err.stack : String(err)
    console.error('[LAURA ENGINE] Error processing query:', errorStack)
    const fallback = (proactiveGen && proactiveGen.generateFallbackResponse)
      ? proactiveGen.generateFallbackResponse()
      : 'Disculpa, tuve un problema interno. Intenta de nuevo.'

    try {
      memoryManager.logConversation(userInput, fallback, INTENT_TYPES.UNKNOWN, { error: String(err), stack: errorStack })
    } catch (e) {
      // No hacer fallar más el engine por logging
      console.warn('[LAURA ENGINE] Error logging fallback:', e)
    }

    return {
      response: fallback,
      intent: INTENT_TYPES.UNKNOWN,
      params: {},
      metadata: { error: String(err), stack: errorStack }
    }
  }
}


/**
 * Extrae y procesa datos del contexto según la intención
 */
function extractBusinessData(intent, params, storeContext) {
  const { sales = [], products = [], fiados = [], expenses = [] } = storeContext

  // Intents de análisis de negocio NUEVO
  if (intent === INTENT_TYPES.QUERY_STOCK) {
    const analysis = analyzer.analyzeStock(products, 5)
    return {
      analysisType: 'STOCK',
      data: analysis,
      response: businessGen.generateStockAnalysisResponse(products)
    }
  }

  if (intent === INTENT_TYPES.QUERY_FIADOS) {
    const analysis = analyzer.analyzeFiados(fiados)
    return {
      analysisType: 'FIADOS',
      data: analysis,
      response: businessGen.generateFiadosResponse(fiados)
    }
  }

  if (intent === INTENT_TYPES.QUERY_SALES) {
    // Soportar periodos (hoy, semana, mes, trimestre)
    const periodText = (params && params.rawInput) ? params.rawInput : ''
    const period = extractPeriodFromText(periodText)
    const analysis = analyzer.analyzeSalesByPeriod(sales, period)
    return {
      analysisType: 'SALES_PERIOD',
      data: analysis,
      response: businessGen.generateSalesPeriodResponse(analysis, period)
    }
  }

  // Detalle de cliente (cliente <nombre>)
  if (intent === INTENT_TYPES.CLIENT_DETAILS) {
    const clientName = params && params.clientName ? params.clientName : null
    return {
      clients: fiados,
      clientName,
      response: businessGen.generateClientDetailsResponse(fiados, clientName)
    }
  }

  // Lista de clientes -> usar handler que combina ventas/fiados/clientes
  if (intent === INTENT_TYPES.LIST_CLIENTS) {
    const res = lauraLogic.handleClientesList({ sales, clients: fiados, fiados })
    return {
      analysisType: 'CLIENTS_LIST',
      data: res.meta,
      response: res.text
    }
  }

  // Lista de fiados (clientes con deuda)
  if (intent === INTENT_TYPES.LIST_FIADOS) {
    return {
      fiados: fiados,
      response: businessGen.generateFiadosListResponse(fiados)
    }
  }

  // Detalle de fiado específico (fiado <nombre>, deuda <nombre>)
  if (intent === INTENT_TYPES.FIADO_DETAILS) {
    const clientName = params && params.clientName ? params.clientName : null
    return {
      clientName,
      response: businessGen.generateFiadoDetailsResponse(clientName, fiados)
    }
  }

  // Clientes que compraron hoy
  if (intent === INTENT_TYPES.TODAY_CLIENTS) {
    // Usar handler que extrae hora, total, productos, tipo de pago
    const res = lauraLogic.handleClientesHoy({ sales })
    return { analysisType: 'CLIENTS_TODAY', data: res.meta, response: res.text }
  }

  // Clientes nuevos (primera compra últimos 7 días)
  if (intent === INTENT_TYPES.CLIENTS_NEW) {
    const res = lauraLogic.handleClientesNuevos({ sales, clients: fiados })
    return { analysisType: 'CLIENTS_NEW', data: res.meta, response: res.text }
  }

  // Clientes frecuentes
  if (intent === INTENT_TYPES.CLIENTS_FREQUENT) {
    const res = lauraLogic.handleClientesFrecuentes({ sales, clients: fiados })
    return { analysisType: 'CLIENTS_FREQUENT', data: res.meta, response: res.text }
  }

  // Clientes recientes / registrados -> reutilizar listado
  if (intent === INTENT_TYPES.CLIENTS_RECENT) {
    const res = lauraLogic.handleClientesList({ sales, clients: fiados, fiados })
    return { analysisType: 'CLIENTS_RECENT', data: res.meta, response: res.text }
  }

  if (intent === INTENT_TYPES.PROFIT_ANALYSIS) {
    const analysis = analyzer.calculateProfit(sales, expenses)
    return {
      analysisType: 'PROFIT',
      data: analysis,
      response: businessGen.generateProfitAnalysisResponse(sales, expenses)
    }
  }

  if (intent === INTENT_TYPES.STRATEGY_SUGGESTIONS) {
    const stock = analyzer.analyzeStock(products, 5)
    const fiados_data = analyzer.analyzeFiados(fiados)
    return {
      analysisType: 'STRATEGY',
      data: { stock, fiados_data },
      response: businessGen.generateStrategySuggestionsResponse({ stock, fiados: fiados_data, sales, products })
    }
  }

  if (intent === INTENT_TYPES.PATTERN_ANALYSIS) {
    const patterns = analyzer.detectPatterns(sales, products)
    return {
      analysisType: 'PATTERNS',
      data: patterns,
      response: businessGen.generatePatternInsightsResponse(sales, products)
    }
  }

  // Intents de memoria
  if (intent === INTENT_TYPES.REMEMBER_PURCHASE) {
    const result = memoryResponseGen.generateRememberPurchaseResponse(params.rawInput)
    return { memoryResult: result }
  }

  if (intent === INTENT_TYPES.ASK_PURCHASE_HISTORY) {
    const result = memoryResponseGen.generateAskPurchaseHistoryResponse(params.rawInput)
    return { memoryResult: result }
  }

  if (intent === INTENT_TYPES.ASK_MEMORY_VALUE) {
    const result = memoryResponseGen.generateAskMemoryValueResponse(params.rawInput)
    return { memoryResult: result }
  }

  if (intent === INTENT_TYPES.UPDATE_KNOWN_PRICE) {
    const result = memoryResponseGen.generateUpdateKnownPriceResponse(params.rawInput)
    return { memoryResult: result }
  }

  if (intent === INTENT_TYPES.ASK_KNOWN_PRICE) {
    const result = memoryResponseGen.generateAskKnownPriceResponse(params.rawInput)
    return { memoryResult: result }
  }

  // Intents de negocio (originales)
  switch (intent) {
    case INTENT_TYPES.TOP_SALES:
      return extractTopSalesData(sales, products)

    case INTENT_TYPES.TODAY_SALES:
      return extractTodaySalesData(sales)

    case INTENT_TYPES.LOW_STOCK:
      return extractLowStockData(products)

    case INTENT_TYPES.RECOMMEND:
      return extractRecommendationData(params, sales, products, fiados)

    case INTENT_TYPES.COMBOS:
      return extractCombosData(sales, products)

    case INTENT_TYPES.TOTAL_REVENUE:
      return extractTotalRevenueData(sales)

    case INTENT_TYPES.CATEGORY_STATS:
      return extractCategoryStatsData(sales, products)

    case INTENT_TYPES.LIST_PRODUCTS:
      return {
        products: products.slice(0, 10),
        count: products.length,
        response: businessGen.generateHelpResponse()
      }

    case INTENT_TYPES.LIST_CLIENTS:
      return {
        clients: fiados,
        response: businessGen.generateClientListResponse(fiados)
      }

    case INTENT_TYPES.HELP:
      return { helpResponse: businessGen.generateHelpResponse() }

    default:
      return {}
  }
}

/**
 * Extrae datos de productos más vendidos
 */
function extractTopSalesData(sales, products) {
  const salesCount = {}

  // Contar ventas por producto
  sales.forEach(sale => {
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        const id = item.id || item.productId
        salesCount[id] = (salesCount[id] || 0) + (item.qty || item.quantity || 1)
      })
    }
  })

  // Mapear a productos con contexto
  const topProducts = products
    .map(p => ({
      ...p,
      salesCount: salesCount[p.id] || 0,
    }))
    .filter(p => p.salesCount > 0)
    .sort((a, b) => b.salesCount - a.salesCount)

  return { topProducts }
}

/**
 * Extrae datos de ventas de hoy
 */
function extractTodaySalesData(sales) {
  const today = new Date().toISOString().slice(0, 10)

  const todaySales = sales.filter(s => {
    const saleDate = s.date ? s.date.slice(0, 10) : ''
    return saleDate === today
  })

  let totalRevenue = 0
  let itemsCount = 0

  todaySales.forEach(sale => {
    totalRevenue += sale.total || 0
    if (sale.items && Array.isArray(sale.items)) {
      itemsCount += sale.items.reduce((sum, item) => sum + (item.qty || item.quantity || 1), 0)
    }
  })

  return {
    salesCount: todaySales.length,
    totalRevenue,
    itemsCount,
  }
}

/**
 * Extrae productos con stock bajo
 */
function extractLowStockData(products, threshold = 5) {
  const lowStockProducts = products
    .filter(p => {
      const stock = Number(p.stock || 0)
      return stock <= threshold && stock >= 0
    })
    .sort((a, b) => (a.stock || 0) - (b.stock || 0))

  return { lowStockProducts }
}

/**
 * Extrae recomendaciones para un cliente
 */
function extractRecommendationData(params, sales, products, fiados) {
  const { clientId } = params

  if (!clientId) {
    return { clientName: 'Cliente', recommendation: null }
  }

  // Buscar cliente
  const client = fiados.find(c => c.id == clientId)
  const clientName = client?.nombre || client?.name || `Cliente ${clientId}`

  // Buscar productos que ha comprado
  const clientSaleIds = new Set()
  const clientProducts = new Set()

  sales.forEach(sale => {
    if (sale.clienteFiado == clientId || sale.clientId == clientId) {
      clientSaleIds.add(sale.id)
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          clientProducts.add(item.id || item.productId)
        })
      }
    }
  })

  // Recomendar productos no comprados
  const recommendation = {
    products: products
      .filter(p => !clientProducts.has(p.id) && (p.stock || 0) > 0)
      .slice(0, 3)
      .map(p => ({
        ...p,
        reason: 'Complementa bien',
      })),
  }

  return { clientName, recommendation }
}

/**
 * Extrae combos frecuentes
 */
function extractCombosData(sales, products) {
  const comboPairs = new Map()

  // Identificar pares de productos que se venden juntos
  sales.forEach(sale => {
    if (sale.items && Array.isArray(sale.items) && sale.items.length >= 2) {
      for (let i = 0; i < sale.items.length; i++) {
        for (let j = i + 1; j < sale.items.length; j++) {
          const id1 = sale.items[i].id || sale.items[i].productId
          const id2 = sale.items[j].id || sale.items[j].productId
          const key = [id1, id2].sort().join(',')

          comboPairs.set(key, (comboPairs.get(key) || 0) + 1)
        }
      }
    }
  })

  // Crear objetos de combo
  const combos = Array.from(comboPairs.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, frequency]) => {
      const [id1, id2] = key.split(',')
      const p1 = products.find(p => p.id == id1)
      const p2 = products.find(p => p.id == id2)

      return {
        products: [p1, p2].filter(Boolean),
        frequency,
      }
    })

  return { combos }
}

/**
 * Extrae ingresos totales
 */
function extractTotalRevenueData(sales) {
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)

  return {
    totalRevenue,
    period: 'total',
  }
}

/**
 * Extrae estadísticas por categoría
 */
function extractCategoryStatsData(sales, products) {
  const categoryStats = new Map()

  // Agrupar ventas por categoría
  sales.forEach(sale => {
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        const product = products.find(p => p.id == (item.id || item.productId))
        if (product) {
          const category = product.category || product.categoria || 'Sin categoría'
          const stats = categoryStats.get(category) || {
            name: category,
            salesCount: 0,
            totalRevenue: 0,
          }

          stats.salesCount += 1
          stats.totalRevenue += (product.price || product.precio || 0) * (item.qty || item.quantity || 1)

          categoryStats.set(category, stats)
        }
      })
    }
  })

  // Top categoría
  const topCategory = Array.from(categoryStats.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)[0] || null

  return { topCategory }
}

/**
 * Importar respuesta de saludo desde generador
 */
function extractPeriodFromText(text) {
  if (!text) return 'day'
  const t = text.toLowerCase()
  if (t.match(/hoy|today|diario|día|dia/)) return 'day'
  if (t.match(/semana|week/)) return 'week'
  if (t.match(/mes|month/)) return 'month'
  if (t.match(/trimestre|quarter/)) return 'quarter'
  return 'day'
}

function getGreetingResponse() {
  const responses = [
    '¡Hola! Estoy acá para ayudarte con tu negocio. ¿Qué necesitas saber?',
    '¡Hola! ¿Qué te traes? Cuéntame qué necesitas.',
    '¡Hey! Listos para algunos números? 📊',
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

function getNameGreetingResponse() {
  const responses = [
    '¡Acá estoy, Lau!\nDecime, ¿qué necesitás?',
    '¡Presente! Soy Laura, ¿en qué te puedo ayudar hoy?',
    '¡A tu orden! Contame qué necesitás y lo vemos.'
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

function getNameGreetingResponseShort() {
  // Versión corta para prefijo cuando se añadirá la respuesta a la consulta
  const responses = [
    '¡Acá estoy, Lau!',
    '¡Presente!',
    '¡A tu orden!'
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

export default {
  processQuery,
}
