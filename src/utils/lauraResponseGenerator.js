/**
 * lauraResponseGenerator.js
 * Genera respuestas personalizadas basadas en intenciones y datos.
 * Incluye tono, emojis relevantes y feedback learning.
 */

import { INTENT_TYPES } from './intentDetector'
import { formatCurrency } from './helpers'

/**
 * Historial de consultas frecuentes (feedback learning)
 * Se mantiene en memoria durante la sesión
 */
class QueryFrequencyTracker {
  constructor() {
    this.queries = new Map() // intent -> count
  }

  track(intent) {
    const current = this.queries.get(intent) || 0
    this.queries.set(intent, current + 1)
  }

  isFrequent(intent) {
    return (this.queries.get(intent) || 0) >= 3
  }

  getFrequency(intent) {
    return this.queries.get(intent) || 0
  }

  reset() {
    this.queries.clear()
  }
}

export const frequencyTracker = new QueryFrequencyTracker()

/**
 * Respuestas de saludo con personalidad
 */
const GREETING_RESPONSES = [
  '¡Hola! Estoy acá para ayudarte con tu negocio. ¿Qué necesitas saber?',
  '¡Hola! ¿Qué te traes? Cuéntame qué necesitas.',
  '¡Hey! Listos para algunos números? 📊',
  '¡Saludos! 🎯 ¿En qué te ayudo?',
  '¡Onda! Acá estoy para lo que necesites.',
]

/**
 * Selecciona respuesta de saludo aleatoria
 */
function getGreetingResponse() {
  return GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)]
}

/**
 * Genera respuesta para productos más vendidos
 */
function generateTopSalesResponse(data) {
  const { topProducts = [] } = data
  frequencyTracker.track(INTENT_TYPES.TOP_SALES)

  if (!topProducts || topProducts.length === 0) {
    return '📊 No hay datos de ventas aún. ¡Empecemos a vender!'
  }

  const isFrequent = frequencyTracker.isFrequent(INTENT_TYPES.TOP_SALES)
  const topList = topProducts.slice(0, 3).map((p, i) => {
    const name = p.name || p.titulo || p.id || 'Producto desconocido'
    const count = p.salesCount || 0
    return `${i + 1}. ${name} (${count} ventas)`
  }).join('\n')

  const baseResponse = `📈 **Productos más vendidos:**\n${topList}`

  if (isFrequent) {
    return `${baseResponse}\n\n💡 *Tip:* Estos productos son consistentes. ¿Quizás ajustar precios o stock?`
  }

  return baseResponse
}

/**
 * Genera respuesta para ventas de hoy
 */
function generateTodaySalesResponse(data) {
  const { salesCount = 0, totalRevenue = 0, itemsCount = 0 } = data
  frequencyTracker.track(INTENT_TYPES.TODAY_SALES)

  if (salesCount === 0) {
    return '📊 Hoy aún no hay ventas. ¡Vamos a esperanzarnos!'
  }

  const totalStr = totalRevenue > 0 ? formatCurrency(totalRevenue) : '$0'
  const baseResponse = `📅 **Hoy:**\n✅ ${salesCount} ventas\n📦 ${itemsCount} items vendidos\n💰 ${totalStr}`

  const isFrequent = frequencyTracker.isFrequent(INTENT_TYPES.TODAY_SALES)
  if (isFrequent) {
    return `${baseResponse}\n\n🔔 *Seguís preguntando sobre hoy... ¿Quizás armar un resumen automático?*`
  }

  return baseResponse
}

/**
 * Genera respuesta para stock bajo
 */
function generateLowStockResponse(data) {
  const { lowStockProducts = [] } = data
  frequencyTracker.track(INTENT_TYPES.LOW_STOCK)

  if (!lowStockProducts || lowStockProducts.length === 0) {
    return '✅ Buen inventario. Todos los productos tienen stock adecuado. 📦'
  }

  const stockList = lowStockProducts.slice(0, 5).map(p => {
    const name = p.name || p.titulo || p.id || 'Producto'
    const stock = p.stock || 0
    const icon = stock === 0 ? '🚨' : '⚠️'
    return `${icon} ${name} → ${stock} unidades`
  }).join('\n')

  const isFrequent = frequencyTracker.isFrequent(INTENT_TYPES.LOW_STOCK)
  const baseResponse = `📉 **Stock bajo:**\n${stockList}`

  if (isFrequent) {
    const count = frequencyTracker.getFrequency(INTENT_TYPES.LOW_STOCK)
    return `${baseResponse}\n\n💬 *${count} veces revisaste esto. ¿Activar alertas automáticas?*`
  }

  return baseResponse
}

/**
 * Genera respuesta para recomendación a cliente
 */
function generateRecommendResponse(data) {
  const { clientName = 'Cliente', recommendation = null } = data
  frequencyTracker.track(INTENT_TYPES.RECOMMEND)

  if (!recommendation || !recommendation.products || recommendation.products.length === 0) {
    return `💭 Para ${clientName}, no tengo recomendaciones en este momento. ¿Revisamos su historial?`
  }

  const products = recommendation.products.slice(0, 3).map(p => {
    const name = p.name || p.titulo || p.id
    const reason = p.reason || 'Combina bien'
    return `• ${name} (${reason})`
  }).join('\n')

  return `🎯 **Para ${clientName}:**\n${products}\n\n💡 Estos productos suelen ir bien juntos.`
}

/**
 * Genera respuesta para sugerencias de combos
 */
function generateCombosResponse(data) {
  const { combos = [] } = data
  frequencyTracker.track(INTENT_TYPES.COMBOS)

  if (!combos || combos.length === 0) {
    return '🎁 No hay combos frecuentes en el historial. ¡Vamos a crearlos!'
  }

  const comboList = combos.slice(0, 3).map((combo, i) => {
    const items = combo.products.map(p => p.name || p.titulo || p.id).join(' + ')
    const freq = combo.frequency || 1
    return `${i + 1}. ${items} (${freq}x vendido)`
  }).join('\n')

  return `📦 **Combos frecuentes:**\n${comboList}\n\n💡 Vendé estos juntos y ahorrá tiempo.`
}

/**
 * Genera respuesta para ingresos totales
 */
function generateTotalRevenueResponse(data) {
  const { totalRevenue = 0, period = 'hoy' } = data
  frequencyTracker.track(INTENT_TYPES.TOTAL_REVENUE)

  const totalStr = totalRevenue > 0 ? formatCurrency(totalRevenue) : '$0'
  const icon = totalRevenue > 0 ? '💰' : '📊'

  return `${icon} **Total de ${period}:** ${totalStr}`
}

/**
 * Genera respuesta para estadísticas de categorías
 */
function generateCategoryStatsResponse(data) {
  const { topCategory = null } = data
  frequencyTracker.track(INTENT_TYPES.CATEGORY_STATS)

  if (!topCategory) {
    return '📊 Aún no hay datos suficientes sobre categorías.'
  }

    const categoryName = topCategory.name || topCategory.category || 'Categoría'
    const sales = topCategory.salesCount || 0
    const revenue = topCategory.totalRevenue || 0
    const revenueStr = revenue > 0 ? formatCurrency(revenue) : '$0'

  return `📈 **Categoría estrella:** ${categoryName}\n✅ ${sales} ventas\n💰 ${revenueStr}`
}

/**
 * Genera respuesta para listar productos
 */
function generateListProductsResponse(data) {
  const { products = [], count = 0 } = data
  frequencyTracker.track(INTENT_TYPES.LIST_PRODUCTS)

  if (!products || products.length === 0) {
    return '📦 No hay productos registrados aún. ¡Vamos a agregar algunos!'
  }

    const productList = products.slice(0, 5).map(p => {
    const name = p.name || p.titulo || p.id
    const price = p.price || p.precio || 0
    const stock = p.stock || 0
    return `• ${name} (${formatCurrency(price)}) - Stock: ${stock}`
  }).join('\n')

  const moreText = products.length > 5 ? `\n\n...y ${products.length - 5} más.` : ''

  return `📦 **Productos (${count}):**\n${productList}${moreText}`
}

/**
 * Genera respuesta para listar clientes
 */
function generateListClientsResponse(data) {
  const { clients = [], count = 0 } = data
  frequencyTracker.track(INTENT_TYPES.LIST_CLIENTS)

  if (!clients || clients.length === 0) {
    return '👥 No hay clientes registrados aún.'
  }

    const clientList = clients.slice(0, 5).map(c => {
    const name = c.nombre || c.name || c.id
    const debt = c.deuda || 0
    const debtText = debt > 0 ? ` (Deuda: ${formatCurrency(debt)})` : ''
    return `• ${name}${debtText}`
  }).join('\n')

  const moreText = clients.length > 5 ? `\n\n...y ${clients.length - 5} más.` : ''

  return `👥 **Clientes (${count}):**\n${clientList}${moreText}`
}

/**
 * Respuesta de ayuda
 */
function generateHelpResponse() {
  frequencyTracker.track(INTENT_TYPES.HELP)

  return `**Acá estoy para ayudarte. Puedo:**
📈 Mostrar qué se vendió más
📅 Ver ventas de hoy
📉 Avisar cuando hay stock bajo
🎯 Recomendar productos a clientes
📦 Sugerir combos frecuentes
💰 Calcular ingresos totales
📊 Analizar categorías
👥 Listar clientes y productos

¡Pregúntame cualquier cosa de tu negocio! 💼`
}

/**
 * Respuesta para intención desconocida
 */
function generateUnknownResponse() {
  const responses = [
    'Hmm, no estoy segura qué preguntás. 🤔 Probá: "¿qué se vendió más?" o "mostrar productos"',
    'No capté la intención... 😅 ¿Querés revisar vendas, stock o clientes?',
    'Eso no lo entiendo bien. 🤷‍♀️ Escribí algo como "productos más vendidos".',
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

/**
 * Genera respuesta completa basada en intención y datos
 */
export function generateResponse(intent, data = {}) {
  let response = ''

  switch (intent) {
    case INTENT_TYPES.GREETING:
      response = getGreetingResponse()
      break

    case INTENT_TYPES.TOP_SALES:
      response = generateTopSalesResponse(data)
      break

    case INTENT_TYPES.TODAY_SALES:
      response = generateTodaySalesResponse(data)
      break

    case INTENT_TYPES.LOW_STOCK:
      response = generateLowStockResponse(data)
      break

    case INTENT_TYPES.RECOMMEND:
      response = generateRecommendResponse(data)
      break

    case INTENT_TYPES.COMBOS:
      response = generateCombosResponse(data)
      break

    case INTENT_TYPES.TOTAL_REVENUE:
      response = generateTotalRevenueResponse(data)
      break

    case INTENT_TYPES.CATEGORY_STATS:
      response = generateCategoryStatsResponse(data)
      break

    case INTENT_TYPES.LIST_PRODUCTS:
      response = generateListProductsResponse(data)
      break

    case INTENT_TYPES.LIST_CLIENTS:
      response = generateListClientsResponse(data)
      break

    case INTENT_TYPES.HELP:
      response = generateHelpResponse()
      break

    case INTENT_TYPES.UNKNOWN:
    default:
      response = generateUnknownResponse()
      break
  }

  return response
}

export default {
  generateResponse,
  frequencyTracker,
}
