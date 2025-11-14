// Utilidades para agregación y cálculo financiero
export function parseISO(dateLike){
  if (!dateLike) return null
  return new Date(dateLike)
}

// Convierte valores a número de forma segura
// Implementación interna segura para convertir a número
function _safeNumber(v){
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return v
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

// Exportar una función estable que delega a la interna
export function safeNumber(v){ return _safeNumber(v) }

// Alias backwards-compatible
export const toNum = safeNumber

export function inRange(dateStr, from, to){
  const d = parseISO(dateStr)
  if (!d) return false
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}

export function filterByRange(items, dateProp, from, to){
  return (items||[]).filter(it => inRange(it[dateProp], from, to))
}

export function aggregateSales(sales, from, to){
  const sel = (sales||[]).filter(s => {
    try{
      const raw = s.date || s.fecha || s.createdAt || s.timestamp || s.created || null
      const d = new Date(raw)
      if (isNaN(d)) return false
      return (!from || d >= from) && (!to || d <= to)
    }catch(e){return false}
  })

  let totalSales = 0
  let totalProducts = 0
  let totalServices = 0
  let cogs = 0
  const byDay = {}

  sel.forEach(s => {
    const totalField = s.total || s.totalVenta || s.totalAmount || s.monto || 0
    // Si no hay total explícito, calcular a partir de items (price * qty)
    let computedTotal = _safeNumber(totalField)
    if (!computedTotal && Array.isArray(s.items) && s.items.length) {
      computedTotal = s.items.reduce((acc,it) => acc + (_safeNumber(it.price || it.unitPrice || 0) * _safeNumber(it.qty || it.quantity || 0)), 0)
    }
    totalSales += computedTotal
    (s.items || []).forEach(it => {
      const qty = _safeNumber(it.qty || it.quantity || 0)
      const price = _safeNumber(it.price || it.unitPrice || 0)
      const cost = _safeNumber(it.cost || it.unitCost || 0)
      if (String(it.type || '').toLowerCase() === 'service' || String(it.id || '').startsWith('svc_')) {
        totalServices += price * qty
      } else {
        totalProducts += price * qty
      }
      cogs += cost * qty
    })
    // series por día
    try{
      const d = new Date(s.date)
      const key = d.toISOString().slice(0,10)
      const totalField2 = s.total || s.totalVenta || s.totalAmount || s.monto || 0
      let dayTotal = _safeNumber(totalField2)
      if (!dayTotal && Array.isArray(s.items) && s.items.length) {
        dayTotal = s.items.reduce((acc,it) => acc + (_safeNumber(it.price || it.unitPrice || 0) * _safeNumber(it.qty || it.quantity || 0)), 0)
      }
      byDay[key] = (byDay[key] || 0) + dayTotal
    }catch(e){}
  })

  // convertir byDay en arrays ordenadas
  const days = Object.keys(byDay).sort()
  const series = days.map(d => ({ date: d, value: byDay[d] }))

  return {
    totalSales,
    totalProducts,
    totalServices,
    cogs,
    grossProfit: totalSales - cogs,
    byDay: series
  }
}

export function aggregateExpenses(expenses, from, to){
  const sel = (expenses||[]).filter(e => {
    try{ const raw = e.fecha || e.date || e.createdAt || e.timestamp || null; const d = new Date(raw); if (isNaN(d)) return false; return (!from || d >= from) && (!to || d <= to) }catch(e){return false}
  })
  const total = sel.reduce((s, e) => s + _safeNumber(e.monto || e.amount || e.value || 0), 0)
  return { total, list: sel }
}

export function computeFinancials(sales, expenses, from, to){
  // Compat wrapper: delegar a calculateFinancialData para cálculos robustos
  try{
    const range = { start: from ? new Date(from).toISOString() : null, end: to ? new Date(to).toISOString() : null }
    const res = calculateFinancialData(range, sales || [], expenses || [], [])
    return {
      totalSales: res.totalSales,
      totalProducts: res.totalProducts || 0,
      totalServices: res.totalServices || 0,
      // backward compatible keys
      cogs: res.totalCosts || res.costoMateriales || 0,
      // términos nuevos para vidriería/mueblería
      costoMateriales: res.costoMateriales || res.totalCosts || 0,
      costoVidrio: res.costoVidrio || 0,
      costoMadera: res.costoMadera || 0,
      costoHerrajes: res.costoHerrajes || 0,
      costoManoObra: res.costoManoObra || 0,
      grossProfit: res.grossProfit || res.gananciaBruta || 0,
      gananciaBruta: res.gananciaBruta || res.grossProfit || 0,
      byDay: res.byDay || [],
      // gastos
      expensesTotal: res.totalExpenses || res.gastosOperativos || 0,
      gastosOperativos: res.gastosOperativos || res.totalExpenses || 0,
      expensesList: res.filteredExpenses || [],
      // neto
      netProfit: res.netProfit || res.gananciaNeta || 0,
      gananciaNeta: res.gananciaNeta || res.netProfit || 0,
      margin: res.profitMargin,
      roi: null
    }
  }catch(e){
    console.error('computeFinancials wrapper failed', e)
    return { totalSales:0, totalProducts:0, totalServices:0, cogs:0, grossProfit:0, byDay: [], expensesTotal:0, expensesList:[], netProfit:0, margin:0, roi:null }
  }
}

// Nueva función robusta de cálculo solicitada por el usuario
export function calculateFinancialData(dateRange, sales, expenses, purchases){
  console.log('=== CALCULATING FINANCIAL DATA ===');
  console.log('Date range:', dateRange);
  console.log('Total sales:', (sales||[]).length);
  console.log('Total expenses:', (expenses||[]).length);
  
  // Convertir fechas a objetos Date para comparación
  const startDate = dateRange && dateRange.start ? new Date(dateRange.start) : null;
  const endDate = dateRange && dateRange.end ? new Date(dateRange.end) : null;
  if (endDate) endDate.setHours(23, 59, 59, 999); // Incluir todo el día final

  console.log('Filter range:', startDate, 'to', endDate);

  // Filtrar ventas por fecha CORREGIDO
  const filteredSales = (sales||[]).filter(sale => {
    const saleDate = new Date(sale.date || sale.fecha || sale.createdAt || sale.timestamp || null);
    const isValid = (!startDate || (saleDate && saleDate >= startDate)) && (!endDate || (saleDate && saleDate <= endDate));
    console.log(`Sale ${sale && sale.id ? sale.id : '<no-id>'}: ${saleDate} - ${isValid ? 'INCLUDE' : 'EXCLUDE'}`);
    return isValid;
  });

  // Filtrar gastos por fecha CORREGIDO
  const filteredExpenses = (expenses||[]).filter(expense => {
    const expenseDate = new Date(expense.date || expense.fecha || expense.createdAt || expense.timestamp || null);
    const isValid = (!startDate || (expenseDate && expenseDate >= startDate)) && (!endDate || (expenseDate && expenseDate <= endDate));
    console.log(`Expense ${expense && expense.id ? expense.id : '<no-id>'}: ${expenseDate} - ${isValid ? 'INCLUDE' : 'EXCLUDE'}`);
    return isValid;
  });

  console.log('Filtered sales:', filteredSales.length);
  console.log('Filtered expenses:', filteredExpenses.length);

  // CÁLCULOS DIRECTOS - ELIMINAR computedTotal
  const totalSales = filteredSales.reduce((sum, sale) => {
    const saleTotal = Number(sale.total || sale.totalVenta || sale.totalAmount || sale.monto || 0) || 0;
    console.log(`Sale ${sale && sale.id ? sale.id : '<no-id>'} total:`, saleTotal);
    return sum + saleTotal;
  }, 0);

  const totalCosts = filteredSales.reduce((sum, sale) => {
    const saleCost = (sale.items || []).reduce((itemSum, item) => {
      const cost = Number(item.cost || item.unitCost || item.materialCost || 0) || 0;
      const qty = Number(item.qty || item.quantity || 0) || 0;
      const itemTotalCost = cost * (qty || 1);
      return itemSum + itemTotalCost;
    }, 0);
    console.log(`Sale ${sale && sale.id ? sale.id : '<no-id>'} cost:`, saleCost);
    return sum + saleCost;
  }, 0);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => {
    const amount = Number(expense.amount || expense.monto || expense.value || expense.cost || 0) || 0;
    console.log(`Expense ${expense && expense.id ? expense.id : '<no-id>'} amount:`, amount);
    return sum + amount;
  }, 0);

  const grossProfit = totalSales - totalCosts;
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  console.log('CALCULATION RESULTS:', {
    totalSales,
    totalCosts,
    totalExpenses,
    grossProfit,
    netProfit,
    profitMargin
  });

  return {
    totalSales,
    totalCosts,
    totalExpenses,
    grossProfit,
    netProfit,
    profitMargin,
    filteredSales,
    filteredExpenses,
    originalSalesCount: (sales||[]).length,
    originalExpensesCount: (expenses||[]).length
  };
}

// Agrega agrupación de series por periodo: 'day'|'week'|'month'
export function aggregateSeries(byDay, period = 'day'){
  if (!Array.isArray(byDay)) return []
  if (period === 'day') return byDay

  const map = {}
  byDay.forEach(({ date, value }) => {
    const d = new Date(date)
    if (isNaN(d)) return
    let key = ''
    if (period === 'week'){
      // calcular semana iniciando el lunes
      const day = d.getDay() || 7 // make Sunday 7
      const monday = new Date(d)
      monday.setDate(d.getDate() - (day - 1))
      key = monday.toISOString().slice(0,10)
    } else if (period === 'month'){
      key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    }
    map[key] = (map[key] || 0) + _safeNumber(value || 0)
  })

  const entries = Object.keys(map).sort().map(k => ({ date: k, value: map[k] }))
  return entries
}

// Calcula datos financieros integrados a partir de múltiples fuentes
export function calculateIntegratedFinancialData({ sales = [], expenses = [], purchases = [], fiados = [], products = [], clients = [], dateRange = {} }){
  try{
    const start = dateRange && dateRange.start ? new Date(dateRange.start) : null
    const end = dateRange && dateRange.end ? new Date(dateRange.end) : null
    if (end) end.setHours(23,59,59,999)

    // reutilizar calculateFinancialData para ventas/gastos básicos
    const base = calculateFinancialData(dateRange, sales || [], expenses || [], purchases || [])

    // Ventas por producto
    const byProduct = {}
    (base.filteredSales || []).forEach(sale => {
      const items = Array.isArray(sale.items) ? sale.items : []
      items.forEach(it => {
        const id = it.productId || it.id || String(it.sku || it.name || 'unknown')
        const name = it.name || it.title || it.productName || id
        const qty = _safeNumber(it.qty || it.quantity || 1)
        const price = _safeNumber(it.price || it.unitPrice || it.amount || 0)
        const cost = _safeNumber(it.cost || it.unitCost || 0)
        if (!byProduct[id]) byProduct[id] = { id, name, qty:0, revenue:0, cost:0 }
        byProduct[id].qty += qty
        byProduct[id].revenue += price * qty
        byProduct[id].cost += cost * qty
      })
    })
    const productsArray = Object.values(byProduct).sort((a,b)=> b.revenue - a.revenue)

    // Inventario: merge with products list if available
    const inventory = (products || []).map(p => ({
      id: p.id || p._id || p.sku || p.code,
      name: p.name || p.title || p.descripcion || '',
      stock: _safeNumber(p.stock || p.qty || p.quantity || p.cantidad || 0),
      cost: _safeNumber(p.cost || p.unitCost || 0)
    }))

    // agregar ventas a inventario (cantidad vendida)
    const inventoryMap = {}
    inventory.forEach(i => { inventoryMap[i.id] = { ...i, sold: 0 } })
    productsArray.forEach(p => {
      if (inventoryMap[p.id]) inventoryMap[p.id].sold = p.qty
    })

    // Clientes: nuevos vs recurrentes
    const clientSales = {}
    (base.filteredSales || []).forEach(sale => {
      const cid = sale.clientId || sale.customerId || sale.client || 'guest_' + (sale.id||sale._id||Math.random())
      clientSales[cid] = clientSales[cid] || { count:0, total:0 }
      clientSales[cid].count += 1
      clientSales[cid].total += Number(sale.total || sale.amount || 0) || 0
    })
    const clientEntries = Object.keys(clientSales).map(k=>({ id:k, count: clientSales[k].count, total: clientSales[k].total }))
    const newClients = (clients || []).filter(c => { try{ const d = new Date(c.createdAt || c.created || c.regDate || null); if (!d || isNaN(d)) return false; if (!start || !end) return false; return d >= start && d <= end }catch(e){ return false } }).length
    const recurringClients = clientEntries.filter(c=> c.count > 1).length

    // Fiados: totales, vencidos, pagos recibidos
    let totalFiados = 0, overdue = 0, paymentsReceived = 0
    ;(fiados || []).forEach(f => {
      const amt = _safeNumber(f.amount || f.monto || f.value || f.total || 0)
      const paid = !!f.paid
      totalFiados += amt
      if (!paid){
        const due = f.dueDate || f.vencimiento || f.fechaVencimiento || null
        if (due){
          const dd = new Date(due)
          if (!isNaN(dd) && end && dd < end) overdue += amt
        }
      } else {
        // consider payments in range
        const paidAt = f.paidAt || f.fechaPago || f.paymentDate || null
        if (paidAt){ const pd = new Date(paidAt); if (!isNaN(pd) && (!start || pd >= start) && (!end || pd <= end)) paymentsReceived += amt }
      }
    })

    // Compras/purchases: total
    const purchasesList = Array.isArray(purchases) ? purchases.filter(p => {
      try{ const d = new Date(p.date || p.fecha || p.createdAt || p.timestamp || null); if (isNaN(d)) return false; if (start && d < start) return false; if (end && d > end) return false; return true }catch(e){ return false }
    }) : []
    const purchasesTotal = purchasesList.reduce((s,p)=> s + _safeNumber(p.total || p.amount || p.monto || 0), 0)

    // Flujo de caja simplificado
    const cashFlow = {
      periodSales: base.totalSales || 0,
      periodExpenses: base.totalExpenses || 0,
      purchasesTotal,
      fiadosReceived: paymentsReceived,
      netCash: (base.netProfit || 0) - purchasesTotal + paymentsReceived
    }

    return {
      resumen: {
        totalSales: base.totalSales || 0,
        totalCosts: base.totalCosts || 0,
        totalExpenses: base.totalExpenses || 0,
        grossProfit: base.grossProfit || 0,
        netProfit: base.netProfit || 0,
        profitMargin: base.profitMargin || 0
      },
      ventas: {
        byProduct: productsArray,
        byDay: base.byDay || []
      },
      gastos: {
        total: base.totalExpenses || 0,
        list: base.filteredExpenses || []
      },
      inventario: {
        items: Object.values(inventoryMap),
        topSold: productsArray.slice(0,20)
      },
      clientes: {
        totalDistinct: Object.keys(clientSales).length,
        newClients,
        recurringClients,
        details: clientEntries
      },
      fiados: {
        totalFiados,
        overdue,
        paymentsReceived
      },
      compras: {
        list: purchasesList,
        total: purchasesTotal
      },
      cashFlow
    }
  }catch(e){
    console.error('calculateIntegratedFinancialData failed', e)
    return { resumen: {}, ventas:{ byProduct:[], byDay:[] }, gastos:{ total:0, list:[] }, inventario:{items:[], topSold:[]}, clientes:{}, fiados:{}, compras:{}, cashFlow:{} }
  }
}
