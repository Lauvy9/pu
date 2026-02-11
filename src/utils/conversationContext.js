/**
 * conversationContext.js
 * Gestiona el contexto conversacional: referencias anafóricas, historial de sesión,
 * últimos productos/clientes mencionados.
 */

class ConversationContextManager {
  constructor() {
    this.reset()
  }

  reset() {
    this.sessionHistory = []     // [ { user, bot, intent, timestamp }, ... ]
    this.lastMentionedClient = null
    this.lastMentionedProduct = null
    this.lastMentionedQuery = null
    this.contextStack = []       // [ { type: 'client'|'product', value, timestamp }, ... ]
  }

  /**
   * Registra una interacción en la sesión
   */
  recordInteraction(userMessage, botResponse, intent = null, metadata = null) {
    this.sessionHistory.push({
      user: userMessage,
      bot: botResponse,
      intent,
      metadata,
      timestamp: new Date().toISOString()
    })

    // Mantener solo último 50 (evitar exceso de memoria)
    if (this.sessionHistory.length > 50) {
      this.sessionHistory.shift()
    }
  }

  /**
   * Actualiza el último cliente mencionado
   */
  setLastClient(clientName) {
    if (clientName) {
      this.lastMentionedClient = clientName
      this.contextStack.push({
        type: 'client',
        value: clientName,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Obtiene el último cliente mencionado
   */
  getLastClient() {
    return this.lastMentionedClient
  }

  /**
   * Actualiza el último producto mencionado
   */
  setLastProduct(productName) {
    if (productName) {
      this.lastMentionedProduct = productName
      this.contextStack.push({
        type: 'product',
        value: productName,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Obtiene el último producto mencionado
   */
  getLastProduct() {
    return this.lastMentionedProduct
  }

  /**
   * Detecta y resuelve referencias anafóricas
   * Ej: "ese producto", "lo que dijiste", "ese cliente"
   */
  resolveAnaphor(text, type = null) {
    const normalized = text.toLowerCase().trim()

    // Palabras que indican referencia anafórica
    const anaphoricWords = ['ese', 'eso', 'esa', 'lo', 'la', 'el', 'anterior', 'último', 'pasado', 'mencionado']

    const hasAnaphora = anaphoricWords.some(w => normalized.includes(w))
    if (!hasAnaphora) return null

    // Si se especifica tipo, devolver específico
    if (type === 'product') return this.getLastProduct()
    if (type === 'client') return this.getLastClient()

    // Inferir del contexto: si hay producto y cliente, devolver el más reciente
    if (normalized.includes('producto')) return this.getLastProduct()
    if (normalized.includes('cliente') || normalized.includes('comprador')) return this.getLastClient()

    // Fallback: más reciente en el stack
    if (this.contextStack.length > 0) {
      return this.contextStack[this.contextStack.length - 1].value
    }

    return null
  }

  /**
   * Obtiene últimas preguntas del usuario
   */
  getRecentQuestions(limit = 5) {
    return this.sessionHistory
      .slice(-limit)
      .map(i => i.user)
  }

  /**
   * Obtiene contexto para enriquecimiento de queries
   */
  enrichQuery(userMessage) {
    const result = {
      original: userMessage,
      normalized: userMessage.toLowerCase().trim(),
      anaphora: this.resolveAnaphor(userMessage),
      lastClient: this.lastMentionedClient,
      lastProduct: this.lastMentionedProduct,
      sessionContext: this.sessionHistory.slice(-3)
    }

    return result
  }

  /**
   * Obtener resumen de sesión (debug)
   */
  getSummary() {
    return {
      interactionCount: this.sessionHistory.length,
      lastClient: this.lastMentionedClient,
      lastProduct: this.lastMentionedProduct,
      contextStackSize: this.contextStack.length,
      recentInteractions: this.sessionHistory.slice(-5)
    }
  }
}

// Instancia global
let contextManager = new ConversationContextManager()

export function initializeContext() {
  contextManager.reset()
  console.log('[Context] Contexto de conversación inicializado')
}

export function recordInteraction(userMessage, botResponse, intent = null, metadata = null) {
  contextManager.recordInteraction(userMessage, botResponse, intent, metadata)
}

export function setLastClient(clientName) {
  contextManager.setLastClient(clientName)
}

export function getLastClient() {
  return contextManager.getLastClient()
}

export function setLastProduct(productName) {
  contextManager.setLastProduct(productName)
}

export function getLastProduct() {
  return contextManager.getLastProduct()
}

export function resolveAnaphor(text, type = null) {
  return contextManager.resolveAnaphor(text, type)
}

export function enrichQuery(userMessage) {
  return contextManager.enrichQuery(userMessage)
}

export function getContextSummary() {
  return contextManager.getSummary()
}

export function getSessionHistory() {
  return contextManager.sessionHistory
}

export function resetContext() {
  contextManager.reset()
  console.log('[Context] Contexto limpiado')
}

export default {
  initializeContext,
  recordInteraction,
  setLastClient,
  getLastClient,
  setLastProduct,
  getLastProduct,
  resolveAnaphor,
  enrichQuery,
  getContextSummary,
  getSessionHistory,
  resetContext
}
