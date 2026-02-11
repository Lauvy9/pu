/**
 * businessAnalyzer.js
 * Análisis inteligente de datos de negocio: stock, fiados, ventas, patrones, estrategias.
 * Sin dependencias externas, basado en lógica pura.
 */
import { formatCurrency } from './helpers'

/**
 * Analiza stock y devuelve productos críticos
 * @param {Array} products - Lista de productos con stock
 * @param {number} threshold - Límite de stock bajo (default 5)
 * @returns {Object} { critical, low, normal, recommendations }
 */
export function analyzeStock(products = [], threshold = 5) {
  const critical = []
  const low = []
  const normal = []

  products.forEach(p => {
    const stock = Number(p.stock || 0)
    const name = p.name || p.titulo || p.id || 'Producto'

    if (stock === 0) {
      critical.push({ ...p, name, stock, status: 'SIN STOCK' })
    } else if (stock <= threshold) {
      low.push({ ...p, name, stock, status: 'BAJO' })
    } else {
      normal.push({ ...p, name, stock, status: 'OK' })
    }
  })

  // Recomendaciones
  const recommendations = []
  if (critical.length > 0) {
    recommendations.push({
      priority: 'URGENTE',
      message: `${critical.length} producto(s) sin stock. Reposición inmediata.`,
      products: critical.map(p => p.name)
    })
  }
  if (low.length > 0) {
    recommendations.push({
      priority: 'ALTA',
      message: `${low.length} producto(s) con stock bajo.`,
      products: low.map(p => p.name)
    })
  }
  if (critical.length === 0 && low.length === 0) {
    recommendations.push({
      priority: 'INFO',
      message: 'Stock en buen estado.',
      products: []
    })
  }

  return { critical, low, normal, recommendations }
}

/**
 * Consulta sobre un producto específico
 * @param {string} productQuery - Nombre del producto a buscar
 * @param {Array} products - Lista de productos
 * @returns {Object|null} Producto encontrado o null
 */
export function findProduct(productQuery = '', products = []) {
  if (!productQuery) return null

  const normalized = productQuery.toLowerCase().trim()

  // Búsqueda exacta
  const exact = products.find(p => {
    const name = (p.name || p.titulo || p.id || '').toLowerCase()
    return name === normalized
  })
  if (exact) return exact

  // Búsqueda parcial
  const partial = products.find(p => {
    const name = (p.name || p.titulo || p.id || '').toLowerCase()
    return name.includes(normalized)
  })

  return partial || null
}

/**
 * Analiza fiados y devuelve información
 * @param {Array} fiados - Lista de clientes con fiados
 * @param {Object} options - { filterByDate, minAmount }
 * @returns {Object} { total, byClient, analysis }
 */
export function analyzeFiados(fiados = [], options = {}) {
  const { filterByDate = null, minAmount = 0 } = options

  let totalFiados = 0
  const byClient = {}
  const details = []

  fiados.forEach(cliente => {
    const clientName = cliente.nombre || cliente.name || cliente.id || 'Cliente'
    const deuda = Number(cliente.monto || cliente.deuda || cliente.total || 0)

    if (deuda > minAmount) {
      totalFiados += deuda
      if (!byClient[clientName]) {
        byClient[clientName] = { nombre: clientName, monto: 0, items: [] }
      }
      byClient[clientName].monto += deuda
      details.push({
        cliente: clientName,
        monto: deuda,
        fecha: cliente.fecha || cliente.date || 'N/A'
      })
    }
  })

  // Análisis
  const deudaPromedioVal = Object.keys(byClient).length > 0 ? (totalFiados / Object.keys(byClient).length) : 0
  const analysis = {
    totalDeuda: totalFiados,
    clientesEnDeuda: Object.keys(byClient).length,
    deudaPromedio: Number(deudaPromedioVal.toFixed(2)),
    mayorDeudor: Object.entries(byClient).sort((a, b) => b[1].monto - a[1].monto)[0] || null,
    riesgo: totalFiados > 50000 ? 'ALTO' : totalFiados > 20000 ? 'MEDIO' : 'BAJO'
  }

  return { totalFiados, byClient, details, analysis }
}

/**
 * Analiza ventas de un período
 * @param {Array} sales - Lista de ventas
 * @param {string} period - 'today', 'yesterday', 'week', 'month'
 * @returns {Object} { count, total, items, topProducts }
 */
export function analyzeSales(sales = [], period = 'today') {
  const now = new Date()
  let startDate, endDate = new Date()

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'yesterday':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7))
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }

  const filtered = sales.filter(s => {
    const saleDate = new Date(s.date || s.fecha || 0)
    return saleDate >= startDate && saleDate <= endDate
  })

  let totalRevenue = 0
  let totalItems = 0
  const productCount = {}

  filtered.forEach(sale => {
    totalRevenue += Number(sale.total || 0)
    ;(sale.items || []).forEach(item => {
      const productName = item.name || item.title || item.productName || item.id
      const qty = Number(item.qty || item.quantity || 1)
      totalItems += qty
      productCount[productName] = (productCount[productName] || 0) + qty
    })
  })

  // Top productos
  const topProducts = Object.entries(productCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }))

  return {
    count: filtered.length,
    total: totalRevenue,
    items: totalItems,
    topProducts,
    average: filtered.length > 0 ? Number((totalRevenue / filtered.length).toFixed(2)) : 0,
    period
  }
}

/**
 * Analiza ventas por periodo flexible: day, week, month, quarter
 */
export function analyzeSalesByPeriod(sales = [], period = 'day') {
  const now = new Date()
  let filteredSales = []
  let periodLabel = ''

  switch ((period || '').toString().toLowerCase()) {
    case 'day':
    case 'hoy':
    case 'today':
      const today = new Date().toISOString().slice(0, 10)
      filteredSales = (sales || []).filter(s => s.date && s.date.slice(0, 10) === today)
      periodLabel = 'hoy'
      break
    case 'week':
    case 'semana':
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      filteredSales = (sales || []).filter(s => new Date(s.date) >= weekAgo)
      periodLabel = 'esta semana'
      break
    case 'month':
    case 'mes':
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      filteredSales = (sales || []).filter(s => new Date(s.date) >= monthAgo)
      periodLabel = 'este mes'
      break
    case 'quarter':
    case 'trimestre':
      const quarterAgo = new Date()
      quarterAgo.setMonth(quarterAgo.getMonth() - 3)
      filteredSales = (sales || []).filter(s => new Date(s.date) >= quarterAgo)
      periodLabel = 'este trimestre'
      break
    default:
      filteredSales = sales || []
      periodLabel = 'total'
  }

  const totalRevenue = (filteredSales || []).reduce((sum, sale) => sum + (Number(sale.total || 0)), 0)
  const totalItems = (filteredSales || []).reduce((sum, sale) => sum + ((sale.items || []).reduce((is, it) => is + (Number(it.qty || it.quantity || 1)), 0)), 0)

  const productSales = {}
  (filteredSales || []).forEach(sale => {
    (sale.items || []).forEach(item => {
      const productId = item.id || item.productId || item.name || item.title
      productSales[productId] = (productSales[productId] || 0) + (Number(item.qty || item.quantity || 1))
    })
  })

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return {
    period: periodLabel,
    salesCount: (filteredSales || []).length,
    totalRevenue,
    totalItems,
    averageSale: (filteredSales || []).length > 0 ? totalRevenue / (filteredSales || []).length : 0,
    topProducts,
    filteredSales
  }
}

/**
 * Detecta patrones en datos de ventas
 * @param {Array} sales - Lista de ventas completa
 * @param {Array} products - Lista de productos
 * @returns {Object} { insights, patterns, recommendations }
 */
export function detectPatterns(sales = [], products = []) {
  const insights = []
  const recommendations = []

  // Patrón 1: Productos no vendidos
  const soldos = new Set()
  sales.forEach(s => {
    ;(s.items || []).forEach(item => {
      soldos.add(item.id || item.productId)
    })
  })

  const noVendidos = products.filter(p => !soldos.has(p.id))
  if (noVendidos.length > 0) {
    insights.push({
      type: 'NO_VENTA',
      message: `${noVendidos.length} producto(s) nunca se vendió.`,
      products: noVendidos.slice(0, 3).map(p => p.name || p.titulo || p.id)
    })
    recommendations.push({
      action: 'PROMOCION',
      message: `Considerá promocionar o discontinuar: ${noVendidos.slice(0, 2).map(p => p.name || p.id).join(', ')}`
    })
  }

  // Patrón 2: Bestsellers
  const productSales = {}
  sales.forEach(s => {
    ;(s.items || []).forEach(item => {
      const id = item.id || item.productId
      productSales[id] = (productSales[id] || 0) + (item.qty || item.quantity || 1)
    })
  })

  const bestsellers = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  if (bestsellers.length > 0) {
    insights.push({
      type: 'BESTSELLER',
      message: 'Estos productos lideran las ventas:',
      data: bestsellers
    })
    recommendations.push({
      action: 'STOCK',
      message: 'Aumentá stock de bestsellers para no perder ventas.'
    })
  }

  // Patrón 3: Venta baja
  const today = analyzeSales(sales, 'today')
  const lastWeekAvg = analyzeSales(sales, 'week').total / 7
  if (today.total < lastWeekAvg * 0.7 && today.count > 0) {
    recommendations.push({
      action: 'ALERTA',
      message: `Venta baja hoy (${Math.round(today.total)}). Promedio semanal: ${Math.round(lastWeekAvg)}`
    })
  }

  return { insights, recommendations }
}

/**
 * Calcula métricas de ganancia
 * @param {Array} sales - Lista de ventas
 * @param {Array} expenses - Lista de gastos (opcional)
 * @returns {Object} { revenue, expenses, profit, margin }
 */
export function calculateProfit(sales = [], expenses = []) {
  const revenue = sales.reduce((sum, s) => sum + (Number(s.total || 0)), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.monto || e.amount || 0)), 0)
  const profit = revenue - totalExpenses
  const marginVal = revenue > 0 ? ((profit / revenue) * 100) : 0

  return {
    revenue: Number(revenue.toFixed(2)),
    expenses: Number(totalExpenses.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    margin: `${Number(marginVal.toFixed(2))}%`,
    status: profit > 0 ? 'Ganancia' : 'Pérdida'
  }
}

/**
 * Genera sugerencias estratégicas basadas en datos
 * @param {Object} params - { stock, fiados, sales, products }
 * @returns {Array} Array de sugerencias
 */
export function generateStrategies(params = {}) {
  const { stock = {}, fiados = {}, sales = [], products = [] } = params
  const suggestions = []

  // Sugerencia 1: Stock crítico
  if (stock.critical && stock.critical.length > 0) {
    suggestions.push({
      priority: 'URGENTE',
      emoji: '🚨',
      text: `Reposición urgente: ${stock.critical.slice(0, 2).map(p => p.name).join(', ')}`
    })
  }

  // Sugerencia 2: Deuda alta
  if (fiados.analysis && fiados.analysis.riesgo === 'ALTO') {
    suggestions.push({
      priority: 'ALTA',
      emoji: '💰',
      text: `Deuda total: ${formatCurrency(fiados.totalFiados)}. Considera cobrar a ${fiados.analysis.mayorDeudor?.[0] || 'clientes'}.`
    })
  }

  // Sugerencia 3: Venta del día
  const todaySales = analyzeSales(sales, 'today')
  if (todaySales.count === 0) {
    suggestions.push({
      priority: 'MEDIA',
      emoji: '📊',
      text: 'Hoy sin ventas aún. ¿Promociona algo?'
    })
  } else {
    suggestions.push({
      priority: 'INFO',
      emoji: '✅',
      text: `Hoy: ${todaySales.count} ventas, ${formatCurrency(todaySales.total)}`
    })
  }

  return suggestions
}

export default {
  analyzeStock,
  findProduct,
  analyzeFiados,
  analyzeSales,
  analyzeSalesByPeriod,
  detectPatterns,
  calculateProfit,
  generateStrategies
}
