import { aggregateSeries, calculateFinancialData } from './financeHelpers'

export function buildDailySnapshot({ date, sales = [], expenses = [], purchases = [], clients = [] } = {}){
  // date: ISO string or Date
  const day = date ? (new Date(date)).toISOString().slice(0,10) : (new Date()).toISOString().slice(0,10)
  const range = { start: day, end: day }
  const calc = calculateFinancialData(range, sales, expenses, purchases)

  const totalClients = (clients || []).length
  const totalSales = Number(calc.totalSales || 0)
  // attempt to split cash vs credit from sales payments if present
  let cashSales = 0, creditSales = 0, ventasFiado = 0
  (calc.filteredSales || []).forEach(s => {
    const total = Number(s.total || s.totalVenta || s.totalAmount || s.monto || 0)
    const isCredit = s.isCredit || s.credit || (s.payments && s.payments.length === 0) || false
    if (isCredit) { creditSales += total }
    else { cashSales += total }
    if (s.cliente || s.isFiado) ventasFiado += total
  })

  // top products
  const productMap = {}
  ;(calc.filteredSales || []).forEach(s => {
    (s.items || []).forEach(it => {
      const key = it.id || it.sku || it.name || JSON.stringify(it)
      productMap[key] = (productMap[key] || 0) + (Number(it.qty || it.quantity || 0) || 0)
    })
  })
  const topProducts = Object.keys(productMap).map(k => ({ key: k, qty: productMap[k] })).sort((a,b)=>b.qty-a.qty).slice(0,10)

  const snapshot = {
    date: day,
    metrics: {
      totalClients,
      totalSales,
      cashSales,
      creditSales,
      ventasFiado,
      totalPurchases: Number((purchases || []).reduce((s,p)=>s + Number(p.total || p.monto || p.amount || 0), 0)),
      totalExpenses: Number(calc.totalExpenses || 0),
      newClients: 0, // placeholder - UI can compute from clients list
      topProducts
    },
    raw: calc
  }
  // summary for quick listing
  const summary = {
    clients: snapshot.metrics.totalClients,
    sales: snapshot.metrics.totalSales,
    purchases: snapshot.metrics.totalPurchases,
    expenses: snapshot.metrics.totalExpenses,
    creditSales: snapshot.metrics.creditSales
  }
  return { snapshot, summary }
}

export function computeComparativeAnalysis(currentSnapshot, previousSnapshot){
  if (!currentSnapshot || !previousSnapshot) return null
  const safe = v => Number(v || 0)
  const salesChange = safe(currentSnapshot.metrics.totalSales) === 0 ? null : (((safe(currentSnapshot.metrics.totalSales) - safe(previousSnapshot.metrics.totalSales)) / (safe(previousSnapshot.metrics.totalSales) || 1)) * 100)
  const clientsChange = safe(currentSnapshot.metrics.totalClients) - safe(previousSnapshot.metrics.totalClients)
  const profitChange = (() => {
    const currProfit = safe(currentSnapshot.raw ? currentSnapshot.raw.gananciaNeta || currentSnapshot.raw.netProfit : 0)
    const prevProfit = safe(previousSnapshot.raw ? previousSnapshot.raw.gananciaNeta || previousSnapshot.raw.netProfit : 0)
    return currProfit === 0 ? null : (((currProfit - prevProfit) / (prevProfit || 1)) * 100)
  })()

  return {
    salesChange: typeof salesChange === 'number' ? (salesChange > 0 ? `+${salesChange.toFixed(1)}%` : `${salesChange.toFixed(1)}%`) : null,
    clientsChange,
    profitChange: typeof profitChange === 'number' ? (profitChange > 0 ? `+${profitChange.toFixed(1)}%` : `${profitChange.toFixed(1)}%`) : null
  }
}
