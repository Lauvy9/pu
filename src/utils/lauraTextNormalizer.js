/**
 * lauraTextNormalizer.js
 * Normaliza texto para mejorar la detección de intenciones.
 * Maneja minúsculas, errores ortográficos, duplicaciones, etc.
 */

// Diccionario de correcciones comunes (errores típicos y sus correcciones)
// Este mapa cubre errores frecuentes y variantes duplicadas.
const CORRECTION_MAP = {
  // Formas de "vender"
  'vendimo': 'vendimos',
  'vendiste': 'vendiste',
  'vendimso': 'vendimos',
  'vendieramos': 'vendieron',
  'bendio': 'vendio',
  'bendieron': 'vendieron',
  
  // Formas de "qué"
  'q': 'qué',
  'ke': 'qué',
  'que': 'qué',
  
  // Adjetivos comunes
  'mas': 'más',
  'ma': 'más',
  'cuals': 'cuál',
  'cuales': 'cuál',
  'mostrar': 'mostrar',
  
  // Saludos y expresiones
  'hola': 'hola',
  'holaa': 'hola',
  'holaaa': 'hola',
  'buenas': 'buenos días',
  'buenos': 'buenos días',
  'bueno': 'buenos días',
  'buen dia': 'buenos días',
  'onda': 'onda',
  'ondaa': 'onda',
}

// Tabla adicional de errores comunes solicitados (expandible)
const COMMON_ERRORS = {
  // precio
  'presio': 'precio',
  'prezio': 'precio',
  'presioo': 'precio',

  // dirección
  'direcsion': 'direccion',
  'dijreccion': 'direccion',
  'direecion': 'direccion',

  // stock
  'estok': 'stock',
  'estoque': 'stock',
  'estokk': 'stock',

  // quedan
  'kedan': 'quedan',
  'kdan': 'quedan',

  // necesito
  'necessito': 'necesito',
  'nesesito': 'necesito',

  // tamaño
  'tañamo': 'tamaño',
  'tamano': 'tamaño',
  'tamanio': 'tamaño',
}

/**
 * Reduce duplicaciones de letras consecutivas
 * Ej: "holaaa" → "hola", "bueeenas" → "buenas"
 */
function reduceDuplicates(text) {
  // Reemplaza repeticiones largas por una sola ocurrencia
  // ej: holaaa -> hola, bueeenas -> buenas
  return text.replace(/(.)\1{2,}/g, '$1')
}

/**
 * Aplica correcciones ortográficas basadas en diccionario
 */
function applyCorrections(text) {
  if (!text || typeof text !== 'string') return ''

  // Aplicar correcciones directas
  let corrected = text
  const merged = Object.assign({}, CORRECTION_MAP, COMMON_ERRORS)
  Object.entries(merged).forEach(([wrong, right]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi')
    corrected = corrected.replace(regex, right)
  })

  // Para palabras no cubiertas, intentar fuzzy matching contra un vocabulario reducido
  const commonVocab = [
    'precio', 'direccion', 'stock', 'quedan', 'necesito', 'tamaño', 'tamano',
    'cliente', 'clientes', 'producto', 'productos', 'venta', 'ventas', 'hola', 'buenos', 'buenas',
    'laura', 'lau', 'laurita', 'ayuda', 'ayudame'
  ]

  corrected = corrected
    .split(' ')
    .map(w => {
      const lower = w.toLowerCase()
      if (merged[lower]) return merged[lower]
      const fm = fuzzyMatch(lower, commonVocab, 0.82)
      return fm || w
    })
    .join(' ')

  return corrected
}

/**
 * Calcula distancia de Levenshtein entre dos strings
 * Útil para "fuzzy matching" de palabras mal escritas
 */
export function levenshteinDistance(a, b) {
  const aLen = a.length
  const bLen = b.length
  const matrix = Array(bLen + 1).fill(null).map(() => Array(aLen + 1).fill(0))

  for (let i = 0; i <= aLen; i++) matrix[0][i] = i
  for (let j = 0; j <= bLen; j++) matrix[j][0] = j

  for (let j = 1; j <= bLen; j++) {
    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,      // inserción
        matrix[j - 1][i] + 1,      // eliminación
        matrix[j - 1][i - 1] + cost // sustitución
      )
    }
  }
  return matrix[bLen][aLen]
}

/**
 * Calcula similitud entre dos palabras (0-1)
 * 1 = idénticas, 0 = completamente diferentes
 */
export function wordSimilarity(a, b) {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase())
  return 1 - (distance / maxLen)
}

/**
 * Busca palabras similares en un array de palabras válidas
 * Retorna la coincidencia más cercana si la similitud es >= threshold
 */
export function fuzzyMatch(word, validWords, threshold = 0.75) {
  const matches = validWords
    .map(valid => ({
      word: valid,
      similarity: wordSimilarity(word, valid)
    }))
    .filter(m => m.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)

  return matches.length > 0 ? matches[0].word : null
}

/**
 * Normaliza el texto completamente
 * 1. Minúsculas
 * 2. Elimina signos raros (mantiene espacios y caracteres básicos)
 * 3. Reduce duplicaciones
 * 4. Aplica correcciones ortográficas
 * 5. Elimina espacios extra
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return ''

  let normalized = text
    .toLowerCase()
    // Elimina caracteres especiales raros (mantiene tildes, áéíóú, ñ)
    .replace(/[^\w\s\áéíóúñ]/g, '')
    // Reduce duplicaciones de letras largas
    .replace(/(.)\1{2,}/g, '$1')
    // Elimina espacios múltiples inicialmente
    .replace(/\s+/g, ' ')
    .trim()

  // Aplica un paso de corrección más inteligente
  normalized = applyCorrections(normalized)

  // Reaplicar reducción de duplicaciones por seguridad
  normalized = reduceDuplicates(normalized)

  // Limpieza final
  normalized = normalized.replace(/\s+/g, ' ').trim()

  return normalized
}

/**
 * Detecta si el texto está dirigido a LAURA (activadores por nombre)
 * Ej: 'laura', 'lau', 'laurita', 'laura estas', 'laura ayudame'
 */
export function isAddressedToLaura(text) {
  if (!text) return false
  const normalized = normalizeText(text)
  const nameTriggers = ['laura', 'lau', 'laurita', 'lauraestas', 'laura estas', 'laura ayudame', 'laura ayudame']
  // Verificar palabras compuestas y presencia directa
  if (containsAnyWord(normalized, ['laura', 'lau', 'laurita'], true)) return true
  // Frases que pueden ser pegadas sin espacio
  for (const t of nameTriggers) {
    if (normalized.includes(t)) return true
  }
  return false
}

/**
 * isGreeting(textNormalized)
 * Devuelve true si el texto contiene un saludo (incluye fuzzy matching y activadores por nombre)
 * Acepta texto sin normalizar; internamente normaliza.
 */
export function isGreeting(text) {
  if (!text) return false
  const normalized = normalizeText(text)

  const greetingWords = [
    'hola', 'buenos', 'buenas', 'buenos días', 'buenos dias', 'qué tal', 'que tal',
    'hola qué tal', 'hey', 'holi', 'saludos', 'buen día', 'buen dia', 'buenas tardes', 'buenas noches',
    'muy buenas', 'qué onda', 'que onda', 'ola', 'eey', 'ey'
  ]

  if (containsAnyWord(normalized, greetingWords, true)) return true

  // Si está dirigido a Laura también consideramos como saludo/activación
  if (isAddressedToLaura(normalized)) return true

  return false
}

/**
 * Extrae palabras clave del texto
 * Elimina stopwords comunes
 */
export function extractKeywords(text) {
  const stopwords = new Set([
    'el', 'la', 'de', 'que', 'y', 'o', 'a', 'en', 'es', 'un', 'una',
    'los', 'las', 'del', 'por', 'para', 'con', 'si', 'no', 'me', 'te',
    'se', 'le', 'les', 'nos', 'os', 'mi', 'tu', 'su', 'nuestro', 'vuestro',
    'este', 'ese', 'aquel', 'esto', 'eso', 'aquello', 'como', 'cuando',
    'donde', 'porque', 'pero', 'mas', 'sino', 'luego', 'entonces'
  ])

  return normalizeText(text)
    .split(' ')
    .filter(word => word.length > 2 && !stopwords.has(word))
}

/**
 * Detecta si un texto contiene alguna palabra de una lista
 * Usa fuzzy matching si no hay coincidencia exacta
 */
export function containsAnyWord(text, words, useFuzzy = true) {
  const normalized = normalizeText(text)
  const textWords = normalized.split(' ')

  for (const keyword of words) {
    // Búsqueda exacta primero
    if (textWords.includes(keyword)) return true

    // Búsqueda fuzzy si está habilitada
    if (useFuzzy) {
      for (const textWord of textWords) {
        if (wordSimilarity(textWord, keyword) >= 0.8) return true
      }
    }
  }

  return false
}

/**
 * Extrae valores numéricos del texto
 * Ej: "dame los últimos 5 días" → 5
 */
export function extractNumbers(text) {
  const matches = text.match(/\d+/g)
  return matches ? matches.map(Number) : []
}

/**
 * Extrae clientes o referencias de ID
 * Ej: "cliente 123" o "id 456"
 */
export function extractIds(text) {
  const numbers = extractNumbers(text)
  return numbers
}

export default {
  normalizeText,
  extractKeywords,
  containsAnyWord,
  extractNumbers,
  extractIds,
  wordSimilarity,
  fuzzyMatch,
  levenshteinDistance,
  reduceDuplicates,
  applyCorrections,
  isGreeting,
  isAddressedToLaura,
}
