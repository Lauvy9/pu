// Helpers para transformar datos usados por los componentes de reportes
// Mantener simples y sin dependencias externas

function formatDateKey(date, period = 'day'){
  const d = new Date(date)
  if (period === 'month') return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  // day
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function aggregateSalesByProduct(sales = [], products = []){
  const map = new Map()
  sales.forEach(s => {
    (s.items || []).forEach(it => {
      const id = it.id || it.productId || it.sku || it.name
      const name = it.name || it.title || (products.find(p=> String(p.id) === String(it.id)) || {}).name || String(id)
      const qty = Number(it.qty || it.quantity || 0)
      const current = map.get(name) || 0
      map.set(name, current + qty)
    })
  })
  const arr = Array.from(map.entries()).map(([name, qty])=> ({ name, qty }))
  arr.sort((a,b)=> b.qty - a.qty)
  return arr
}

export function salesByDate(sales = [], period = 'day'){
  const map = new Map()
  sales.forEach(s => {
    const key = formatDateKey(s.date || s.createdAt || s.fecha || new Date(), period)
    const val = Number(s.total || s.amount || 0)
    map.set(key, (map.get(key) || 0) + val)
  })
  const arr = Array.from(map.entries()).map(([date, total])=> ({ date, total }))
  arr.sort((a,b)=> new Date(a.date) - new Date(b.date))
  return arr
}

export function profitCostsExpensesSeries(sales = [], expenses = [], period = 'month'){
  // group sales revenue and material costs by period, also expenses
  const salesMap = new Map()
  const costMap = new Map()
  const expMap = new Map()

  sales.forEach(s => {
    const key = formatDateKey(s.date || s.createdAt || new Date(), period)
    const revenue = Number(s.total || s.amount || 0)
    const cost = Number(s.cost || s.totalCost || 0)
    salesMap.set(key, (salesMap.get(key) || 0) + revenue)
    costMap.set(key, (costMap.get(key) || 0) + cost)
  })
  expenses.forEach(e => {
    const key = formatDateKey(e.date || e.createdAt || new Date(), period)
    const amt = Number(e.amount || e.monto || 0)
    expMap.set(key, (expMap.get(key) || 0) + amt)
  })

  // union keys
  const keys = new Set([...salesMap.keys(), ...costMap.keys(), ...expMap.keys()])
  const arr = Array.from(keys).map(k => ({
    period: k,
    ventas: Number(salesMap.get(k) || 0),
    costos: Number(costMap.get(k) || 0),
    gastos: Number(expMap.get(k) || 0),
    ganancia: Number((salesMap.get(k) || 0) - (costMap.get(k) || 0) - (expMap.get(k) || 0))
  }))
  arr.sort((a,b)=> new Date(a.period) - new Date(b.period))
  return arr
}

export function categoryDistribution(sales = [], products = []){
  // Agrupar ventas por TIPO DE VENTA: 'Fiado','Mayorista','Minorista'
  // No se debe devolver 'Sin categoría'. Cualquier valor desconocido se mapea a 'Minorista' por defecto.
  function normalizeSaleType(sale){
    const raw = (sale && (sale.type || sale.tipo || sale.saleType || sale.metodo || sale.method || '')) || ''
    const t = String(raw).toLowerCase()
    if (!t) {
      // intentar inferir por pago
      if (sale && (sale.pagado === false || sale.paid === false || sale.pagado === 'false')) return 'Fiado'
      return 'Minorista'
    }
    if (t.includes('fiad') || t.includes('credito') || t === 'fiado') return 'Fiado'
    if (t.includes('mayor')) return 'Mayorista'
    if (t.includes('minor') || t.includes('retail')) return 'Minorista'
    // fallback
    return 'Minorista'
  }

  const counts = { Fiado:0, Mayorista:0, Minorista:0 }
  ;(sales || []).forEach(s => {
    const cat = normalizeSaleType(s)
    counts[cat] = (counts[cat] || 0) + 1
  })

  return Object.keys(counts).map(k => ({ name: k, value: counts[k] }))
}

// Calcula Ganancia neta vs Costos operativos
export function netProfitVsOperatingCosts(sales = [], expenses = [], settings = {}){
  // total ingresos
  const totalSales = (sales || []).reduce((sum, s) => {
    const t = Number(s.total || s.totalVenta || s.totalAmount || s.monto || 0) || 0
    if (t) return sum + t
    // si no hay total, sumar items
    const items = Array.isArray(s.items) ? s.items : []
    const computed = items.reduce((acc,it) => acc + (Number(it.price || it.unitPrice || 0) * Number(it.qty || it.quantity || 0)), 0)
    return sum + computed
  }, 0)

  // intentar tomar gastos operativos desde settings o calcular a partir de expenses
  let operCosts = 0
  if (settings && (settings.gastosOperativos || settings.expensesTotal || settings.operativos)){
    operCosts = Number(settings.gastosOperativos || settings.expensesTotal || settings.operativos) || 0
  } else {
    // sumar solo aquellos gastos que parezcan operativos
    operCosts = (expenses || []).reduce((sum, e) => {
      const cat = String(e.category || e.categoria || e.type || e.tipo || '').toLowerCase()
      const amount = Number(e.amount || e.monto || e.value || e.total || 0) || 0
      if (!cat) return sum + amount // si no hay categoría asumimos que puede ser operativo
      if (cat.includes('operativ') || cat === 'operativos' || cat === 'operativo') return sum + amount
      return sum
    }, 0)
  }

  const netProfit = totalSales - operCosts
  return [
    { name: 'Ganancia neta', value: Number(netProfit) },
    { name: 'Costos operativos', value: Number(operCosts) }
  ]
}

export function newClientsSeries(sales = [], period = 'day'){
  // Count distinct new clients appearing per period based on client identifiers in sales
  const seenClients = new Set()
  const map = new Map()
  // sort sales by date ascending
  const sorted = [...(sales||[])].sort((a,b)=> new Date(a.date||a.createdAt||0) - new Date(b.date||b.createdAt||0))
  sorted.forEach(s => {
    const clientKey = s.clientId || s.cliente || (s.clienteContacto && (s.clienteContacto.value || s.clienteContacto.nombre)) || s.customerId || s.customerName || null
    const dateKey = formatDateKey(s.date || s.createdAt || new Date(), period)
    if (!clientKey) return
    if (!seenClients.has(clientKey)){
      seenClients.add(clientKey)
      map.set(dateKey, (map.get(dateKey) || 0) + 1)
    }
  })
  const arr = Array.from(map.entries()).map(([date, count])=> ({ date, count }))
  arr.sort((a,b)=> new Date(a.date) - new Date(b.date))
  return arr
}

export function lowStockTop(products = [], limit = 5){
  const arr = (products || []).map(p => ({ id: p.id, name: p.name || p.title || p.descripcion || 'Sin nombre', stock: Number(p.stock || p.cantidad || p.qty || 0), minimo: p.minimo || p.min || null }))
  arr.sort((a,b)=> a.stock - b.stock)
  return arr.slice(0, limit)
}

export default {
  aggregateSalesByProduct,
  salesByDate,
  profitCostsExpensesSeries,
  categoryDistribution,
  netProfitVsOperatingCosts,
  newClientsSeries,
  lowStockTop
}
