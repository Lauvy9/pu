/**
 * memoryResponseGenerator.js
 * Genera respuestas basadas en datos recordados de la memoria conversacional.
 * Se integra con memoryManager para recuperar y guardar información.
 */

import * as memory from './memoryManager'

/**
 * Genera respuesta para recordar/guardar una compra
 * Intenta extraer: cliente, producto, cantidad, precio
 * Ej: "Ana compró vidrio templado 8mm" o "Le vendimos 10 metros de cable a Juan"
 */
export function generateRememberPurchaseResponse(rawInput) {
  // Intentar extraer nombre de cliente y producto
  // Simplificado: buscar palabras capitalizadas (nombres propios)

  const words = rawInput.split(/\s+/)
  let clientName = null
  let product = null
  let quantity = 1
  let price = null

  // Búsqueda heurística de nombre (primera palabra capitalizada)
  for (let i = 0; i < words.length; i++) {
    if (words[i][0] === words[i][0].toUpperCase() && words[i].length > 2) {
      clientName = words[i]
      break
    }
  }

  // Buscar números (cantidad/precio)
  const numberMatches = rawInput.match(/\d+/g)
  if (numberMatches && numberMatches.length > 0) {
    quantity = Number(numberMatches[0])
    if (numberMatches.length > 1 && rawInput.includes('$')) {
      price = Number(numberMatches[1])
    }
  }

  // Extraer producto: palabras después de "compró", "pidió", "vendimos"
  const actionKeywords = ['compró', 'compro', 'pidió', 'pidio', 'vendimos', 'vendí']
  for (const keyword of actionKeywords) {
    const idx = rawInput.toLowerCase().indexOf(keyword)
    if (idx !== -1) {
      const afterAction = rawInput.slice(idx + keyword.length).trim()
      product = afterAction.split(/[,;.]/)[0].trim() // Hasta el primer separador
      break
    }
  }

  // Si encontramos datos, guardarlos
  if (clientName && product) {
    const saved = memory.rememberClientPurchase(clientName, product, quantity, price)
    if (saved) {
      const priceStr = price ? ` por $${price}` : ''
      return {
        response: `✅ Guardado: ${clientName} compró ${quantity}x ${product}${priceStr}. Lo recordaré.`,
        saved: true,
        data: { clientName, product, quantity, price }
      }
    }
  }

  return {
    response: `⚠️ No pude extraer todos los datos. Intenta con: "Nombre compró producto"`,
    saved: false,
    data: null
  }
}

/**
 * Genera respuesta para consulta de historial de compra
 * Ej: "¿Qué compró Ana la última vez?"
 */
export function generateAskPurchaseHistoryResponse(rawInput) {
  // Extraer nombre del cliente de la consulta
  const words = rawInput.split(/\s+/)
  let clientName = null

  // Buscar palabra capitalizada
  for (let i = 0; i < words.length; i++) {
    if (words[i][0] === words[i][0].toUpperCase() && words[i].length > 2) {
      clientName = words[i]
      break
    }
  }

  if (!clientName) {
    return {
      response: `¿De cuál cliente quieres el historial? Dime el nombre.`,
      found: false
    }
  }

  // Buscar en memoria
  const history = memory.getClientHistory(clientName)

  if (!history || history.purchases.length === 0) {
    return {
      response: `📍 No tengo historial de compras para ${clientName}. ¿Es la primera vez que compra?`,
      found: false,
      clientName
    }
  }

  // Última compra
  const lastPurchase = history.purchases[history.purchases.length - 1]
  const priceStr = lastPurchase.price ? ` a $${lastPurchase.price}` : ''
  const timestamp = new Date(lastPurchase.timestamp).toLocaleDateString()

  const response = `📋 **Última compra de ${history.displayName}:**\n${lastPurchase.quantity}x ${lastPurchase.product}${priceStr}\n(${timestamp})`

  return {
    response,
    found: true,
    clientName,
    history
  }
}

/**
 * Genera respuesta para consulta de valor recordado
 * Ej: "¿Qué precio tenía el marco roble del que te hablé?"
 */
export function generateAskMemoryValueResponse(rawInput) {
  // Extraer producto/clave de la consulta
  // Simplificado: última palabra antes de "del que" o palabra clave
  let productName = null

  // Buscar palabras relevantes
  const words = rawInput.split(/\s+/)
  const relevantIdx = Math.max(
    rawInput.toLowerCase().indexOf('precio'),
    rawInput.toLowerCase().indexOf('cómo era'),
    rawInput.toLowerCase().indexOf('cuál era'),
    rawInput.toLowerCase().indexOf('del que')
  )

  if (relevantIdx > 0) {
    // Tomar palabras antes del marcador relevante
    const beforeRelevant = rawInput.slice(0, relevantIdx)
    productName = beforeRelevant.split(/\s+/).slice(-2).join(' ').trim()
  }

  if (!productName) {
    return {
      response: `🤔 No sé de cuál producto me hablas. ¿Cuál era el nombre?`,
      found: false
    }
  }

  // Buscar en memoria
  const priceData = memory.recallPrice(productName)

  if (!priceData) {
    return {
      response: `📝 No recuerdo haber guardado información sobre "${productName}". ¿Quizás con otro nombre?`,
      found: false,
      productName
    }
  }

  const dateStr = new Date(priceData.lastUpdated).toLocaleDateString()
  return {
    response: `💾 **${priceData.originalName || productName}:** $${priceData.price} (recordado el ${dateStr})`,
    found: true,
    productName,
    data: priceData
  }
}

/**
 * Genera respuesta para actualizar/guardar un precio
 * Ej: "El cuaderno ahora sale $50"
 */
export function generateUpdateKnownPriceResponse(rawInput) {
  // Extraer producto y precio
  const priceMatch = rawInput.match(/\$?(\d+)/)
  if (!priceMatch) {
    return {
      response: `⚠️ No encontré un precio en tu mensaje. Incluye un número o $50.`,
      saved: false
    }
  }

  const price = Number(priceMatch[1])

  // Extraer nombre del producto
  // Simplificado: primera parte de la frase (antes del precio)
  const productName = rawInput.split(/\$?\d+/)[0].trim()
    .replace(/^el\s+/i, '')
    .replace(/\s+(ahora|sale|cuesta|nuevo)$/i, '')
    .trim()

  if (!productName || productName.length < 2) {
    return {
      response: `⚠️ Necesito el nombre del producto. Ej: "El cuaderno ahora sale $50"`,
      saved: false
    }
  }

  const saved = memory.rememberPrice(productName, price)

  if (saved) {
    return {
      response: `✅ Guardado: ${productName} → $${price}. Voy a recordar este precio.`,
      saved: true,
      data: { productName, price }
    }
  }

  return {
    response: `⚠️ No pude guardar el precio. Intenta nuevamente.`,
    saved: false
  }
}

/**
 * Genera respuesta para consulta de precio conocido
 * Ej: "¿Cuánto cuesta el cuaderno del que me hablaste?"
 */
export function generateAskKnownPriceResponse(rawInput) {
  // Extraer nombre del producto
  const words = rawInput.split(/\s+/)
  let productName = null

  // Buscar después de "cuaderno", "el", "la", etc.
  const keywordIdx = Math.max(
    rawInput.toLowerCase().indexOf('cuaderno'),
    rawInput.toLowerCase().indexOf('precio del'),
    rawInput.toLowerCase().indexOf('cuesta')
  )

  if (keywordIdx > 0) {
    const afterKeyword = rawInput.slice(keywordIdx).split(/\s+/)[1]
    if (afterKeyword) productName = afterKeyword.trim().replace(/[?,;.]/g, '')
  }

  // Fallback: última palabra
  if (!productName || productName.length < 2) {
    productName = words[words.length - 1].replace(/[?,;.]/g, '')
  }

  // Buscar en memoria
  const priceData = memory.recallPrice(productName)

  if (!priceData) {
    return {
      response: `🤷 No tengo guardado el precio de "${productName}". ¿Cuál es?`,
      found: false,
      productName
    }
  }

  const dateStr = new Date(priceData.lastUpdated).toLocaleDateString()
  return {
    response: `💰 **${priceData.originalName || productName}** sale **$${priceData.price}** (actualizado: ${dateStr})`,
    found: true,
    productName,
    data: priceData
  }
}

export default {
  generateRememberPurchaseResponse,
  generateAskPurchaseHistoryResponse,
  generateAskMemoryValueResponse,
  generateUpdateKnownPriceResponse,
  generateAskKnownPriceResponse
}
