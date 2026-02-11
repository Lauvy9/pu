/**
 * Proactive Response Generator
 * Genera respuestas contextuales y ofrecen opciones cuando la intención es ambigua
 * pero clara (ej: usuario dice 'stock' → ofrecer opciones)
 */

import * as businessAnalyzer from './businessAnalyzer'

/**
 * Respuesta cuando usuario pregunta por "stock" (ambiguo pero claro)
 * Ofrece opciones contextuales
 */
export const generateStockOptionsResponse = (products = []) => {
  const hasLowStock = products.some(p => (p.stock || p.cantidad || 0) <= 5)
  const hasOutOfStock = products.some(p => (p.stock || p.cantidad || 0) === 0)

  let response = "📦 **Stock**\n\n"
  response += "¿Qué querés saber?\n\n"

  if (hasOutOfStock) {
    response += "🔴 **Productos agotados** → Hay items sin stock\n"
  }
  if (hasLowStock) {
    response += "🟡 **Stock bajo** → Productos a punto de agotarse\n"
  }
  response += "📊 **Stock total** → Inventario completo\n"
  response += "🔍 **Buscar producto** → Decime el nombre\n\n"

  response += "_Ejemplo: 'stock bajo' o 'dame el inventario'_"

  return response
}

/**
 * Respuesta cuando usuario pregunta por "ventas"
 * Ofrece opciones contextuales
 */
export const generateSalesOptionsResponse = (sales = []) => {
  const hasData = sales && sales.length > 0

  let response = "💰 **Ventas**\n\n"
  response += "¿Qué querés revisar?\n\n"

  if (hasData) {
    response += "📅 **Hoy** → Ventas de este día\n"
    response += "📊 **Este mes** → Movimiento del mes\n"
  }
  response += "🏆 **Top productos** → Más vendidos\n"
  response += "💡 **Ganancias** → Análisis de ganancia\n"
  response += "📈 **Análisis** → Patrones de venta\n\n"

  response += "_Ejemplo: 'ventas de hoy' o 'qué fue lo más vendido'_"

  return response
}

/**
 * Respuesta cuando usuario pregunta por "fiados" (deudas)
 * Ofrece opciones contextuales
 */
export const generateFiadosOptionsResponse = (fiados = []) => {
  const hasFiados = fiados && fiados.length > 0

  let response = "💳 **Fiados y Deudas**\n\n"
  response += "¿Qué necesitás?\n\n"

  if (hasFiados) {
    response += "📋 **Total de fiados** → Deuda general\n"
    response += "👤 **Cliente específico** → Cuánto debe Juan, María, etc.\n"
    response += "🔴 **Mayor deudor** → Quién debe más\n"
  }
  response += "📊 **Análisis de riesgo** → Situación de créditos\n"
  response += "⚠️ **Cobranza urgente** → Deudas vencidas\n\n"

  response += "_Ejemplo: 'fiados del mes' o 'cuánto debe mario'_"

  return response
}

/**
 * Respuesta cuando usuario pregunta por un "cliente" específico
 * Mostra opciones sobre qué hacer con ese cliente
 */
export const generateClientOptionsResponse = (clientName = '', fiados = []) => {
  let response = `👤 **Cliente: ${clientName}**\n\n`
  response += "¿Qué querés saber?\n\n"

  response += "💳 **Deudas** → Cuánto debe\n"
  response += "🛍️ **Historial de compras** → Qué compró\n"
  response += "💰 **Total gastado** → Gasto total con nosotros\n"
  response += "📝 **Detalle de transacciones** → Todo movimiento\n\n"

  response += "_Ejemplo: 'deudas de mario' o 'qué compró mario'_"

  return response
}

/**
 * Respuesta cuando usuario pregunta por un "producto" específico
 * Muestra opciones sobre ese producto
 */
export const generateProductOptionsResponse = (productName = '', product = null) => {
  let response = `🏷️ **Producto: ${productName}**\n\n`
  response += "¿Qué querés saber?\n\n"

  response += "💵 **Precio** → Cuánto cuesta\n"
  response += "📦 **Stock** → Cuántos quedan\n"
  response += "📊 **Ventas** → Cuántos se vendieron\n"
  response += "📈 **Performance** → Cómo vende\n"
  response += "🏆 **Categoría** → Tipo de producto\n\n"

  if (product) {
    response += `_Disponemos: ${product.stock || product.cantidad || 0} unidades_\n`
  }

  response += "_Ejemplo: 'precio cuaderno' o 'stock cuaderno'_"

  return response
}

/**
 * Respuesta para categoría ambigua de entidad
 * Cuando hay múltiples coincidencias (¿cliente o producto?)
 */
export const generateEntityAmbiguityResponse = (candidates = [], entityType = null) => {
  if (!candidates || candidates.length === 0) {
    return "🤔 No encontré coincidencias. ¿Podés escribir el nombre completo?"
  }

  let response = "🤔 Encontré varias opciones. ¿Cuál era?\n\n"

  candidates.slice(0, 5).forEach((item, idx) => {
    const name = item.nombre || item.name || item.matchedName || item.id || 'N/A'
    const type = item.stock !== undefined ? '📦' : '👤'
    response += `${idx + 1}. ${type} **${name}**\n`
  })

  response += "\n_Decime el nombre exacto o el número_"

  return response
}

/**
 * Respuesta de fallback inteligente
 * Cuando no entiende el query
 */
export const generateFallbackResponse = (query = '') => {
  let response = "🤔 No estoy 100% segura de lo que buscás.\n\n"
  response += "Podés consultarme sobre:\n\n"
  response += "📦 **Stock** → Inventario y faltantes\n"
  response += "💰 **Ventas** → Facturación e ingresos\n"
  response += "💳 **Fiados** → Deudas y créditos\n"
  response += "👤 **Clientes** → Datos de clientes\n"
  response += "🏷️ **Productos** → Catálogo y precios\n"
  response += "💡 **Estrategias** → Sugerencias de mejora\n\n"

  response += "_O decime el nombre de un cliente o producto_ 🔍"

  return response
}

/**
 * Respuesta para palabra clave de STOCK
 * Ofrece opciones contextuales
 */
export const handleStockKeyword = (products = []) => {
  return generateStockOptionsResponse(products)
}

/**
 * Respuesta para palabra clave de STOCK_LOW
 * Muestra productos con stock bajo
 */
export const handleStockLowKeyword = (products = []) => {
  const lowStock = businessAnalyzer.analyzeStock(products, 5)

  let response = "🟡 **Stock Bajo**\n\n"

  if (lowStock.low.length === 0 && lowStock.critical.length === 0) {
    response += "✅ Todos los productos tienen stock suficiente.\n"
    return response
  }

  if (lowStock.critical.length > 0) {
    response += "🔴 **Crítico (0-3 unidades):**\n"
    lowStock.critical.forEach(p => {
      response += `• ${p.name || p.titulo || p.id} - ${p.stock || p.cantidad} unidades\n`
    })
    response += "\n"
  }

  if (lowStock.low.length > 0) {
    response += "🟡 **Bajo (4-5 unidades):**\n"
    lowStock.low.forEach(p => {
      response += `• ${p.name || p.titulo || p.id} - ${p.stock || p.cantidad} unidades\n`
    })
    response += "\n"
  }

  response += "⚠️ _Considerar reponer estos productos_"

  return response
}

/**
 * Respuesta para palabra clave de SALES
 * Ofrece opciones contextuales
 */
export const handleSalesKeyword = (sales = []) => {
  return generateSalesOptionsResponse(sales)
}

/**
 * Respuesta para palabra clave de FIADOS
 * Ofrece opciones contextuales
 */
export const handleFiadosKeyword = (fiados = []) => {
  return generateFiadosOptionsResponse(fiados)
}

/**
 * Respuesta para palabra clave de CLIENTS
 * Lista clientes o ofrece opciones
 */
export const handleClientsKeyword = (fiados = []) => {
  let response = "👥 **Clientes**\n\n"

  if (!fiados || fiados.length === 0) {
    response += "No hay clientes registrados aún.\n"
    return response
  }

  response += `Tenés ${fiados.length} cliente${fiados.length !== 1 ? 's' : ''}.\n\n`
  response += "¿Querés:\n\n"
  response += "📋 **Listar todos** → Ver la lista\n"
  response += "👤 **Buscar uno** → Decime el nombre\n"
  response += "💳 **Ver deudas** → Quién debe\n\n"
  response += "_Ejemplo: 'clientes de hoy' o 'busca mario'_"

  return response
}

/**
 * Respuesta para palabra clave de PRODUCTS
 * Lista productos o ofrece opciones
 */
export const handleProductsKeyword = (products = []) => {
  let response = "🏷️ **Productos**\n\n"

  if (!products || products.length === 0) {
    response += "No hay productos registrados aún.\n"
    return response
  }

  response += `Tenés ${products.length} producto${products.length !== 1 ? 's' : ''}.\n\n`
  response += "¿Querés:\n\n"
  response += "📊 **Catálogo** → Ver todos\n"
  response += "🔍 **Buscar uno** → Decime el nombre\n"
  response += "💵 **Precios** → Precio de cada uno\n\n"
  response += "_Ejemplo: 'precio cuaderno' o 'catálogo'_"

  return response
}

/**
 * Respuesta para palabra clave de REPORTS
 * Ofrece opciones de informes
 */
export const handleReportsKeyword = () => {
  let response = "📊 **Informes y Reportes**\n\n"
  response += "¿Qué informe querés?\n\n"
  response += "📈 **Resumen del día** → Movimiento de hoy\n"
  response += "📊 **Resumen del mes** → Facturación mensual\n"
  response += "💰 **Análisis de ganancia** → Profit y márgenes\n"
  response += "🎯 **Estrategias** → Recomendaciones\n"
  response += "🏆 **Top productos** → Más vendidos\n\n"
  response += "_Ejemplo: 'resumen de hoy' o 'análisis mensual'_"

  return response
}

/**
 * Router central para respuestas proactivas
 * Decide qué respuesta generar según análisis del query
 */
export const generateProactiveResponse = (analysis, storeContext = {}) => {
  const { category, entity, entityType, candidates, isAmbiguous } = analysis
  const { products = [], fiados = [], sales = [] } = storeContext

  // Entidad encontrada: Cliente específico
  if (category === 'ENTITY' && entityType === 'client' && entity) {
    return generateClientOptionsResponse(entity.nombre || entity.name || entity.cliente, fiados)
  }

  // Entidad encontrada: Producto específico
  if (category === 'ENTITY' && entityType === 'product' && entity) {
    return generateProductOptionsResponse(entity.name || entity.titulo || entity.id, entity)
  }

  // Entidad ambigua: múltiples opciones
  if (category === 'ENTITY_AMBIGUOUS' && isAmbiguous && candidates.length > 0) {
    return generateEntityAmbiguityResponse(candidates, entityType)
  }

  // Palabra clave: STOCK
  if (category === 'STOCK') {
    return generateStockOptionsResponse(products)
  }

  // Palabra clave: STOCK_LOW, STOCK_MINIMO, etc. (mostrar detalle real)
  if (category === 'STOCK_LOW') {
    return handleStockLowKeyword(products)
  }

  // Palabra clave: SALES
  if (category === 'SALES') {
    return generateSalesOptionsResponse(sales)
  }

  // Palabra clave: FIADOS
  if (category === 'FIADOS') {
    return generateFiadosOptionsResponse(fiados)
  }

  // Palabra clave: CLIENTS
  if (category === 'CLIENTS') {
    return handleClientsKeyword(fiados)
  }

  // Palabra clave: PRODUCTS
  if (category === 'PRODUCTS') {
    return handleProductsKeyword(products)
  }

  // Palabra clave: REPORTS
  if (category === 'REPORTS') {
    return handleReportsKeyword()
  }

  // Palabra clave: HELP
  if (category === 'HELP') {
    return generateFallbackResponse()
  }

  // Unknown: Fallback inteligente
  return generateFallbackResponse()
}

export default {
  generateStockOptionsResponse,
  generateSalesOptionsResponse,
  generateFiadosOptionsResponse,
  generateClientOptionsResponse,
  generateProductOptionsResponse,
  generateEntityAmbiguityResponse,
  generateFallbackResponse,
  handleStockKeyword,
  handleStockLowKeyword,
  handleSalesKeyword,
  handleFiadosKeyword,
  handleClientsKeyword,
  handleProductsKeyword,
  handleReportsKeyword,
  generateProactiveResponse
}
