/**
 * Entity Detector
 * Identifica entidades del negocio en queries mínimas (clientes, productos, etc.)
 * Usa fuzzy matching para robustez
 */

const levenshteinDistance = (a, b) => {
  const lenA = a.length
  const lenB = b.length
  const matrix = Array(lenB + 1).fill(null).map(() => Array(lenA + 1).fill(0))

  for (let i = 0; i <= lenA; i++) matrix[0][i] = i
  for (let j = 0; j <= lenB; j++) matrix[j][0] = j

  for (let j = 1; j <= lenB; j++) {
    for (let i = 1; i <= lenA; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      )
    }
  }

  return matrix[lenB][lenA]
}

const fuzzyMatch = (query, target, threshold = 0.75) => {
  const queryNorm = query.toLowerCase().trim()
  const targetNorm = target.toLowerCase().trim()

  if (queryNorm === targetNorm) return 1

  const maxLen = Math.max(queryNorm.length, targetNorm.length)
  const distance = levenshteinDistance(queryNorm, targetNorm)
  const similarity = 1 - (distance / maxLen)

  return similarity >= threshold ? similarity : 0
}

/**
 * Busca cliente en lista por nombre (fuzzy matching)
 * @param {string} query - Nombre a buscar
 * @param {Array} fiados - Lista de clientes/fiados
 * @returns {Object|null} Cliente encontrado o null
 */
export const findClient = (query, fiados = []) => {
  if (!query || !fiados || fiados.length === 0) return null

  let bestMatch = null
  let bestScore = 0

  fiados.forEach(client => {
    const clientName = (client.nombre || client.name || client.cliente || '').toString().trim()
    if (!clientName) return

    const score = fuzzyMatch(query, clientName, 0.7)
    if (score > bestScore) {
      bestScore = score
      bestMatch = { ...client, matchScore: score, matchedName: clientName }
    }
  })

  return bestScore > 0.7 ? bestMatch : null
}

/**
 * Busca producto en lista por nombre (fuzzy matching)
 * @param {string} query - Nombre a buscar
 * @param {Array} products - Lista de productos
 * @returns {Object|null} Producto encontrado o null
 */
export const findProduct = (query, products = []) => {
  if (!query || !products || products.length === 0) return null

  let bestMatch = null
  let bestScore = 0

  products.forEach(product => {
    const productName = (product.name || product.titulo || product.title || product.id || '').toString().trim()
    const productCategory = (product.category || product.categoria || '').toString().toLowerCase().trim()
    if (!productName) return

    const nameScore = fuzzyMatch(query, productName, 0.7)
    const categoryScore = fuzzyMatch(query, productCategory, 0.75)
    const score = Math.max(nameScore, categoryScore)

    if (score > bestScore) {
      bestScore = score
      bestMatch = { ...product, matchScore: score, matchedName: productName }
    }
  })

  return bestScore > 0.7 ? bestMatch : null
}

/**
 * Busca múltiples coincidencias de clientes
 * @param {string} query - Término a buscar
 * @param {Array} fiados - Lista de clientes
 * @returns {Array} Lista de clientes con score de coincidencia
 */
export const findClients = (query, fiados = []) => {
  if (!query || !fiados || fiados.length === 0) return []

  const results = fiados
    .map(client => {
      const clientName = (client.nombre || client.name || client.cliente || '').toString().trim()
      if (!clientName) return null

      const score = fuzzyMatch(query, clientName, 0.6)
      return score > 0.6 ? { ...client, matchScore: score, matchedName: clientName } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.matchScore - a.matchScore)

  return results
}

/**
 * Busca múltiples coincidencias de productos
 * @param {string} query - Término a buscar
 * @param {Array} products - Lista de productos
 * @returns {Array} Lista de productos con score de coincidencia
 */
export const findProducts = (query, products = []) => {
  if (!query || !products || products.length === 0) return []

  const results = products
    .map(product => {
      const productName = (product.name || product.titulo || product.title || product.id || '').toString().trim()
      const productCategory = (product.category || product.categoria || '').toString().toLowerCase().trim()
      if (!productName) return null

      const nameScore = fuzzyMatch(query, productName, 0.6)
      const categoryScore = fuzzyMatch(query, productCategory, 0.7)
      const score = Math.max(nameScore, categoryScore)

      return score > 0.6 ? { ...product, matchScore: score, matchedName: productName } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.matchScore - a.matchScore)

  return results
}

/**
 * Detecta si el query es una entidad (cliente o producto)
 * Retorna tipo de entidad encontrada
 * @param {string} query - Query a analizar
 * @param {Object} storeContext - {sales, products, fiados}
 * @returns {Object} {type: 'client'|'product'|null, entity: Object|null, candidates: Array}
 */
export const detectEntity = (query, storeContext = {}) => {
  if (!query || !query.trim()) return { type: null, entity: null, candidates: [] }

  const queryLower = query.toLowerCase().trim()
  const { fiados = [], products = [] } = storeContext

  // Intenta buscar cliente primero
  const clientMatch = findClient(queryLower, fiados)
  if (clientMatch && clientMatch.matchScore > 0.75) {
    return {
      type: 'client',
      entity: clientMatch,
      candidates: findClients(queryLower, fiados).slice(0, 3)
    }
  }

  // Intenta buscar producto
  const productMatch = findProduct(queryLower, products)
  if (productMatch && productMatch.matchScore > 0.75) {
    return {
      type: 'product',
      entity: productMatch,
      candidates: findProducts(queryLower, products).slice(0, 3)
    }
  }

  // Si no hay match fuerte, retorna candidatos
  const clientCandidates = findClients(queryLower, fiados).slice(0, 3)
  const productCandidates = findProducts(queryLower, products).slice(0, 3)
  const allCandidates = [...clientCandidates, ...productCandidates].sort((a, b) => b.matchScore - a.matchScore)

  if (allCandidates.length > 0) {
    return {
      type: allCandidates[0].nombre || allCandidates[0].name ? 'client' : 'product',
      entity: null,
      candidates: allCandidates
    }
  }

  return { type: null, entity: null, candidates: [] }
}

/**
 * Detecta si el query es una palabra clave simple (stock, ventas, fiado, etc.)
 * @param {string} query - Query a analizar
 * @returns {string|null} Palabra clave detectada o null
 */
export const detectKeywordCategory = (query) => {
  if (!query) return null

  const queryLower = query.toLowerCase().trim()

  // PRIMERO: Detectar combinaciones específicas (más específico primero)
  // "stock bajo", "stock mínimo", "stock bajo", "poco stock", etc.
  if ((queryLower.includes('stock') && (queryLower.includes('bajo') || queryLower.includes('poco') || queryLower.includes('mínimo') || queryLower.includes('critico') || queryLower.includes('crítico') || queryLower.includes('agotado'))) ||
      (queryLower.includes('bajo') && queryLower.includes('stock')) ||
      queryLower.includes('stock bajo') ||
      queryLower.includes('stock mínimo') ||
      queryLower.includes('stock critico')) {
    return 'STOCK_LOW'
  }

  // SEGUNDO: Detectar palabras clave simples (más general)
  const keywords = {
    STOCK: ['stock', 'inventario', 'reponer', 'faltantes', 'existencias', 'tengo', 'quedan', 'hay'],
    STOCK_LOW: ['bajo', 'poco', 'agotado', 'falta', 'acabó', 'reponer', 'crítico', 'urgente'],
    SALES: ['ventas', 'vendido', 'facturación', 'vendí', 'ingresos', 'facturé', 'movimiento'],
    FIADOS: ['fiado', 'deuda', 'deben', 'debe', 'crédito', 'cobranza', 'deudores'],
    CLIENTS: ['clientes', 'cliente', 'gente', 'personas', 'contactos'],
    PRODUCTS: ['productos', 'producto', 'artículos', 'items', 'catálogo'],
    REPORTS: ['informe', 'reporte', 'resumen', 'análisis', 'conclusión'],
    HELP: ['ayuda', 'qué puedo', 'cómo', 'qué hago', 'opciones', 'menú']
  }

  for (const [category, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (queryLower.includes(word)) {
        return category
      }
    }
  }

  return null
}

/**
 * Analiza un query muy corto y retorna información sobre qué busca
 * @param {string} query - Query a analizar
 * @param {Object} storeContext - {sales, products, fiados}
 * @returns {Object} {category, entity, entityType, isAmbiguous}
 */
export const analyzeMinimalQuery = (query, storeContext = {}) => {
  const trimmed = query.trim()

  // Primero detecta entidad
  const entityResult = detectEntity(trimmed, storeContext)
  if (entityResult.entity && entityResult.type) {
    return {
      category: 'ENTITY',
      entity: entityResult.entity,
      entityType: entityResult.type,
      candidates: [],
      isAmbiguous: false
    }
  }

  // Si hay candidatos de entidad ambigua
  if (entityResult.candidates && entityResult.candidates.length > 0) {
    return {
      category: 'ENTITY_AMBIGUOUS',
      entity: null,
      entityType: entityResult.type,
      candidates: entityResult.candidates,
      isAmbiguous: true
    }
  }

  // Detecta categoría de palabra clave
  const keywordCategory = detectKeywordCategory(trimmed)
  if (keywordCategory) {
    return {
      category: keywordCategory,
      entity: null,
      entityType: null,
      candidates: [],
      isAmbiguous: false
    }
  }

  // No entendió
  return {
    category: 'UNKNOWN',
    entity: null,
    entityType: null,
    candidates: [],
    isAmbiguous: false
  }
}

export default {
  findClient,
  findProduct,
  findClients,
  findProducts,
  detectEntity,
  detectKeywordCategory,
  analyzeMinimalQuery
}
