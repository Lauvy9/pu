/**
 * memoryManager.js
 * Gestiona memoria conversacional: cliente compras, precios, historial.
 * Persiste datos en memory.json (simulación de base de datos local).
 */

// Estructura de datos en memoria
let memoryData = {
  clients: {},          // { clientName: { purchases: [], lastSeen: timestamp, notes: '' } }
  prices: {},           // { productName: { price: number, lastUpdated: timestamp, source: 'user|system' } }
  purchases: [],        // Histórico global de compras
  conversationLog: [],  // Registro de todas las conversaciones
  sessionLog: []        // Registro de sesión actual
}

/**
 * Simula carga de memoria desde JSON (en Node.js sería fs.readFileSync)
 * En navegador, usamos localStorage o estado en memoria
 */
export function loadMemory() {
  try {
    // Intentar leer de localStorage (para navegador)
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('laura_memory')
      if (stored) {
        memoryData = JSON.parse(stored)
        console.log('[LAURA Memory] Memoria cargada desde localStorage')
        return memoryData
      }
    }
  } catch (error) {
    console.warn('[LAURA Memory] Error cargando memoria:', error)
  }

  // Si no hay almacenamiento, mantener estructura vacía
  console.log('[LAURA Memory] Usando memoria en sesión (no persistida)')
  return memoryData
}

/**
 * Persiste memoria en localStorage (o simula guardado)
 */
export function saveMemory() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('laura_memory', JSON.stringify(memoryData))
      console.log('[LAURA Memory] Memoria guardada en localStorage')
    }
  } catch (error) {
    console.warn('[LAURA Memory] Error guardando memoria:', error)
  }
}

/**
 * Recordar una clave-valor genérica
 */
export function remember(key, value) {
  if (!key) return false

  // Inicializar si no existe
  if (!memoryData.prices[key]) {
    memoryData.prices[key] = {}
  }

  memoryData.prices[key] = {
    value,
    lastUpdated: new Date().toISOString(),
    source: 'user'
  }

  saveMemory()
  console.log(`[LAURA Memory] Recordado: ${key} = ${value}`)
  return true
}

/**
 * Recordar un precio específico
 */
export function rememberPrice(productName, price) {
  if (!productName || !price) return false

  const normalized = productName.toLowerCase().trim()
  memoryData.prices[normalized] = {
    price: Number(price),
    lastUpdated: new Date().toISOString(),
    source: 'user',
    originalName: productName
  }

  saveMemory()
  console.log(`[LAURA Memory] Precio recordado: ${productName} → $${price}`)
  return true
}

/**
 * Recordar compra de cliente
 */
export function rememberClientPurchase(clientName, product, quantity = 1, price = null) {
  if (!clientName || !product) return false

  const normalized = clientName.toLowerCase().trim()

  // Inicializar cliente si no existe
  if (!memoryData.clients[normalized]) {
    memoryData.clients[normalized] = {
      purchases: [],
      lastSeen: new Date().toISOString(),
      notes: '',
      displayName: clientName // Mantener nombre original para mostrar
    }
  }

  // Agregar compra
  const purchase = {
    product,
    quantity: Number(quantity),
    price: price ? Number(price) : null,
    timestamp: new Date().toISOString()
  }

  memoryData.clients[normalized].purchases.push(purchase)
  memoryData.clients[normalized].lastSeen = new Date().toISOString()

  // Agregar a histórico global
  memoryData.purchases.push({
    client: clientName,
    ...purchase
  })

  saveMemory()
  console.log(`[LAURA Memory] Compra recordada: ${clientName} compró ${product}`)
  return true
}

/**
 * Recuperar valor genérico
 */
export function recall(key) {
  if (!key) return null

  const normalized = key.toLowerCase().trim()
  const data = memoryData.prices[normalized]

  if (data) {
    console.log(`[LAURA Memory] Recordado: ${key} = ${data.value || data.price}`)
    return data
  }

  return null
}

/**
 * Recuperar precio de producto
 */
export function recallPrice(productName) {
  if (!productName) return null

  const normalized = productName.toLowerCase().trim()
  const data = memoryData.prices[normalized]

  if (data && data.price) {
    console.log(`[LAURA Memory] Precio recuperado: ${productName} = $${data.price}`)
    return data
  }

  return null
}

/**
 * Obtener historial de compras de cliente
 */
export function getClientHistory(clientName) {
  if (!clientName) return null

  const normalized = clientName.toLowerCase().trim()
  const clientData = memoryData.clients[normalized]

  if (clientData) {
    console.log(`[LAURA Memory] Historial de ${clientName}:`, clientData.purchases.length, 'compras')
    return clientData
  }

  return null
}

/**
 * Obtener última compra de cliente
 */
export function getClientLastPurchase(clientName) {
  const client = getClientHistory(clientName)

  if (client && client.purchases.length > 0) {
    return client.purchases[client.purchases.length - 1]
  }

  return null
}

/**
 * Buscar cliente por nombre (permite búsqueda parcial)
 */
export function findClient(partial) {
  if (!partial) return null

  const normalized = partial.toLowerCase().trim()
  const matches = Object.keys(memoryData.clients).filter(key =>
    key.includes(normalized) || memoryData.clients[key].displayName.toLowerCase().includes(normalized)
  )

  if (matches.length > 0) {
    return {
      key: matches[0],
      data: memoryData.clients[matches[0]]
    }
  }

  return null
}

/**
 * Agregar nota a cliente
 */
export function addClientNote(clientName, note) {
  if (!clientName || !note) return false

  const normalized = clientName.toLowerCase().trim()

  if (!memoryData.clients[normalized]) {
    memoryData.clients[normalized] = {
      purchases: [],
      lastSeen: new Date().toISOString(),
      notes: note,
      displayName: clientName
    }
  } else {
    memoryData.clients[normalized].notes += ` | ${note}`
  }

  saveMemory()
  console.log(`[LAURA Memory] Nota agregada a ${clientName}`)
  return true
}

/**
 * Obtener resumen de memoria (debug)
 */
export function getMemorySummary() {
  return {
    clientCount: Object.keys(memoryData.clients).length,
    knownPrices: Object.keys(memoryData.prices).length,
    totalPurchases: memoryData.purchases.length,
    clients: memoryData.clients,
    prices: memoryData.prices
  }
}

/**
 * Limpiar memoria (reset completo)
 */
export function clearMemory() {
  memoryData = {
    clients: {},
    prices: {},
    purchases: [],
    conversationLog: [],
    sessionLog: []
  }
  saveMemory()
  console.log('[LAURA Memory] Memoria limpiada')
}

/**
 * Registrar en log de conversación
 */
export function logConversation(userMessage, botResponse, intent = null, metadata = null) {
  const entry = {
    timestamp: new Date().toISOString(),
    user: userMessage,
    bot: botResponse,
    intent,
    metadata
  }

  memoryData.sessionLog.push(entry)
  memoryData.conversationLog.push(entry)

  // Mantener conversationLog manejable (últimas 500)
  if (memoryData.conversationLog.length > 500) {
    memoryData.conversationLog.shift()
  }

  saveMemory()
}

/**
 * Obtener logs de conversación
 */
export function getConversationLogs(limit = 10) {
  return memoryData.conversationLog.slice(-limit)
}

/**
 * Obtener logs de sesión actual
 */
export function getSessionLogs() {
  return memoryData.sessionLog
}

export default {
  loadMemory,
  saveMemory,
  remember,
  rememberPrice,
  rememberClientPurchase,
  recall,
  recallPrice,
  getClientHistory,
  getClientLastPurchase,
  findClient,
  addClientNote,
  getMemorySummary,
  clearMemory,
  logConversation,
  getConversationLogs,
  getSessionLogs
}
