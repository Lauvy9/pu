// Helpers para reportes por unidad (archivo limpio)

// ============================
// Normalización de unidad
// ============================
export function normalizeUnit(raw) {
  if (!raw) return 'sin_especificar'
  const s = String(raw).toLowerCase()
  if (s.includes('mue') || s.includes('mobi')) return 'muebleria'
  if (s.includes('vid')) return 'vidrieria'
  return 'sin_especificar'
}

// ============================
// Stock por unidad
// ============================
export function computeStockByUnit(products = []) {
  const res = {
    muebleria: { stock: 0, value: 0 },
    vidrieria: { stock: 0, value: 0 },
    sin_especificar: { stock: 0, value: 0 }
  }

  const list = Array.isArray(products)
    ? products
    : Object.values(products || {})

  list.forEach(p => {
    const unit = normalizeUnit(p?.businessUnit || p?.unit || p?.type)
    const qty = Number(p?.stock || 0)
    const cost = Number(p?.cost || 0)

    res[unit].stock += qty
    res[unit].value += qty * cost
  })

  return res
}

// ============================
// Totales por unidad (filtrado por fecha opcional)
// ============================
export function computeTotalSalesByUnit(sales = [], products = [], dateRange = {}, paidOnly = true) {
  const prodMap = Object.fromEntries(
    (Array.isArray(products) ? products : Object.values(products || {})).map(p => [String(p.id), p])
  )

  const res = {
    muebleria: { qty: 0, total: 0 },
    vidrieria: { qty: 0, total: 0 },
    sin_especificar: { qty: 0, total: 0 }
  }

  const salesList = Array.isArray(sales) ? sales : Object.values(sales || {})
  const start = dateRange?.start ? new Date(dateRange.start) : null
  if (start && !isNaN(start)) start.setHours(0,0,0,0)
  const end = dateRange?.end ? new Date(dateRange.end) : null
  if (end && !isNaN(end)) end.setHours(23,59,59,999)

  salesList.forEach(sale => {
    try {
      const saleDate = sale?.date ? new Date(sale.date) : null
      if (saleDate && ((start && saleDate < start) || (end && saleDate > end))) return

      // Determine amountPaid for this sale (if paidOnly) or total sale amount
      const payments = Array.isArray(sale?.payments) ? sale.payments : (sale?.payments && typeof sale.payments === 'object' ? Object.values(sale.payments) : [])
      let amountPaid = 0
      if (paidOnly) {
        if (Array.isArray(payments) && payments.length) {
          amountPaid = payments.reduce((s,p) => s + (Number(p?.amount || p?.monto || p?.value || 0) || 0), 0)
        } else {
          amountPaid = Number(sale?.amountPaid || sale?.paidAmount || sale?.totalPaid || sale?.cobrado || 0) || 0
          if (!amountPaid && (sale?.paid === true || sale?.pagado === true)) {
            amountPaid = Number(sale.total || sale.totalVenta || sale.monto || 0) || 0
          }
        }
        if (!amountPaid || amountPaid <= 0) return // skip unpaid/fiado
      }

      const items = Array.isArray(sale?.items) ? sale.items : Object.values(sale?.items || {})
      // compute totals per unit to allocate
      const unitTotals = {}
      let itemsTotal = 0
      const unitQtys = {}
      items.forEach(it => {
        if (!it) return
        const qty = Number(it.qty || it.quantity || 0)
        if (!qty) return
        const price = Number(it.price || it.unitPrice || it.precio || 0)
        const total = price * qty
        const prod = prodMap[String(it.id)]
        const unit = normalizeUnit(it?.productSnapshot?.businessUnit || prod?.businessUnit || sale?.businessUnit)
        unitTotals[unit] = (unitTotals[unit] || 0) + total
        unitQtys[unit] = (unitQtys[unit] || 0) + qty
        itemsTotal += total
      })

      if (itemsTotal === 0) {
        const unit = normalizeUnit(sale?.businessUnit)
        unitTotals[unit] = amountPaid || 0
        itemsTotal = amountPaid || 0
      }

      if (paidOnly) {
        // allocate amountPaid proportionally
        Object.keys(unitTotals).forEach(unit => {
          const share = itemsTotal ? (unitTotals[unit] / itemsTotal) : 0
          const allocated = amountPaid * share
          // quantities must reflect actual items sold in the period
          res[unit].qty += unitQtys[unit] || 0
          res[unit].total += allocated
        })
      } else {
        // use full item totals
        Object.keys(unitTotals).forEach(unit => {
          res[unit].total += unitTotals[unit]
          // estimate qty by summing item qtys per unit (optional)
          // For simplicity we won't change qty here beyond previous counts
        })
      }
    } catch (e) { /* ignore */ }
  })

  return res
}

// ============================
// Ganancia neta por unidad (filtrado por fecha opcional)
// ============================
export function computeNetProfitByUnit(sales = [], products = [], expenses = [], dateRange = {}) {
  const prodMap = Object.fromEntries(
    (Array.isArray(products) ? products : Object.values(products || {})).map(p => [String(p.id), p])
  )

  const totals = {
    muebleria: { totalSales: 0, grossProfit: 0, expenses: 0, netProfit: 0 },
    vidrieria: { totalSales: 0, grossProfit: 0, expenses: 0, netProfit: 0 },
    sin_especificar: { totalSales: 0, grossProfit: 0, expenses: 0, netProfit: 0 }
  }

  const salesList = Array.isArray(sales) ? sales : Object.values(sales || {})
  const expensesList = Array.isArray(expenses) ? expenses : Object.values(expenses || {})
  const start = dateRange?.start ? new Date(dateRange.start) : null
  if (start && !isNaN(start)) start.setHours(0,0,0,0)
  const end = dateRange?.end ? new Date(dateRange.end) : null
  if (end && !isNaN(end)) end.setHours(23,59,59,999)

  salesList.forEach(sale => {
    try {
      const saleDate = sale?.date ? new Date(sale.date) : null
      if (saleDate && ((start && saleDate < start) || (end && saleDate > end))) return

      const items = Array.isArray(sale?.items) ? sale.items : Object.values(sale?.items || {})
      items.forEach(it => {
        if (!it) return
        const qty = Number(it.qty || it.quantity || 0)
        if (!qty) return
        const price = Number(it.price || it.unitPrice || it.precio || 0)
        const prod = prodMap[String(it.id)]
        const cost = Number(it?.productSnapshot?.cost ?? prod?.cost ?? 0) || 0
        const unit = normalizeUnit(it?.productSnapshot?.businessUnit || prod?.businessUnit || sale?.businessUnit)

        totals[unit].totalSales += price * qty
        totals[unit].grossProfit += (price - cost) * qty
      })
    } catch (e) { /* ignore */ }
  })

  expensesList.forEach(exp => {
    try {
      const expDate = exp?.date ? new Date(exp.date) : null
      if (expDate && ((start && expDate < start) || (end && expDate > end))) return
      const unit = normalizeUnit(exp.businessUnit || exp.unit || null)
      const amt = Number(exp.amount || exp.monto || exp.value || exp.cost || 0) || 0
      totals[unit].expenses += amt
    } catch (e) { /* ignore */ }
  })

  Object.keys(totals).forEach(k => {
    const t = totals[k]
    t.netProfit = Number(t.grossProfit || 0) - Number(t.expenses || 0)
  })

  return totals
}

// ============================
// Ventas por unidad (CLAVE)
// ============================
export function computeSalesByUnit(sales = [], products = []) {
  const res = {
    muebleria: { qty: 0, total: 0 },
    vidrieria: { qty: 0, total: 0 },
    sin_especificar: { qty: 0, total: 0 }
  }

  const prodMap = Object.fromEntries(
    (Array.isArray(products) ? products : Object.values(products || {}))
      .map(p => [String(p.id), p])
  )

  const salesList = Array.isArray(sales) ? sales : Object.values(sales || {})

  salesList.forEach(sale => {
    const unitFallback = normalizeUnit(sale?.businessUnit)

    const items = Array.isArray(sale?.items)
      ? sale.items
      : Object.values(sale?.items || {})

    items.forEach(it => {
      if (!it) return

      const qty = Number(it.qty || it.quantity || 0)
      if (!qty) return

      const price = Number(it.price || it.unitPrice || it.precio || 0)
      const total = price * qty

      const prod = prodMap[String(it.id)]
      const unit = normalizeUnit(prod?.businessUnit || unitFallback)

      res[unit].qty += qty
      res[unit].total += total
    })
  })

  return res
}




// ============================
// Top productos por unidad
// ============================
export function topProductsByUnit(sales = [], products = [], unit = 'muebleria', topN = 5) {
  const prodMap = Object.fromEntries(
    (Array.isArray(products) ? products : Object.values(products || {}))
      .map(p => [String(p.id), p])
  )

  const counts = {}
  const salesList = Array.isArray(sales) ? sales : Object.values(sales || {})

  salesList.forEach(sale => {
    const items = Array.isArray(sale?.items)
      ? sale.items
      : Object.values(sale?.items || {})

    items.forEach(it => {
      if (!it) return

      const prod = prodMap[String(it.id)]
      const unitDetected = normalizeUnit(prod?.businessUnit || sale?.businessUnit)
      if (unitDetected !== unit) return

      const qty = Number(it.qty || it.quantity || 0)
      const price = Number(it.price || it.unitPrice || it.precio || 0)
      const total = qty * price

      const key = String(it.id)
      counts[key] ||= {
        id: key,
        name: it.name || prod?.name || 'Producto',
        qty: 0,
        total: 0
      }

      counts[key].qty += qty
      counts[key].total += total
    })
  })

  return Object.values(counts)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, topN)
}

// ============================
// Métodos de pago por unidad
// ============================
export function paymentMethodsByUnit(sales = [], products = [], dateRange = {}) {
  const prodMap = Object.fromEntries(
    (Array.isArray(products) ? products : Object.values(products || {}))
      .map(p => [String(p.id), p])
  )

  const res = {
    muebleria: {},
    vidrieria: {},
    sin_especificar: {}
  }


  const salesList = Array.isArray(sales) ? sales : Object.values(sales || {})

  salesList.forEach(sale => {
    // Determinar pagos efectivamente cobrados para esta venta
    const payments = Array.isArray(sale?.payments) ? sale.payments : []
    let totalPaid = payments.reduce((s, p) => s + (Number(p?.amount || p?.monto || p?.value || 0) || 0), 0)
    if (!totalPaid && (sale?.pagado === true || sale?.paid === true)) {
      totalPaid = Number(sale.total || sale.totalVenta || sale.monto || 0) || 0
    }
    if (!totalPaid || totalPaid <= 0) return // ignorar ventas no cobradas

    // preparar totales por unidad para asignación proporcional
    const items = Array.isArray(sale?.items) ? sale.items : Object.values(sale?.items || {})
    const unitTotals = {}
    const unitQtys = {}
    let itemsTotal = 0
    items.forEach(it => {
      if (!it) return
      const qty = Number(it.qty || it.quantity || 0)
      if (!qty) return
      const price = Number(it.price || it.unitPrice || it.precio || 0)
      const total = qty * price
      const prod = prodMap[String(it.id)]
      const unit = normalizeUnit(prod?.businessUnit || sale?.businessUnit)
      unitTotals[unit] = (unitTotals[unit] || 0) + total
      unitQtys[unit] = (unitQtys[unit] || 0) + qty
      itemsTotal += total
    })

    // Si hay pagos individuales, asignar por método
    if (payments && payments.length) {
      payments.forEach(p => {
        const method = (p?.method || p?.paymentMethod || sale?.metodoPago || 'efectivo') + ''
        const amt = Number(p?.amount || p?.monto || p?.value || 0) || 0
        if (!amt || amt <= 0) return
        // asignar proporcionalmente a unidades
        Object.keys(unitTotals).forEach(unit => {
          const share = itemsTotal ? (unitTotals[unit] / itemsTotal) : 0
          const allocated = amt * share
          res[unit] ||= {}
          res[unit][method] ||= { count: 0, amount: 0 }
          res[unit][method].amount += allocated
          res[unit][method].count += unitQtys[unit] || 0
        })
      })
    } else {
      // No hay pagos individuales pero la venta está marcada como pagada: usar metodo general
      const method = sale?.metodoPago || sale?.metodo || sale?.paymentMethod || 'efectivo'
      Object.keys(unitTotals).forEach(unit => {
        const share = itemsTotal ? (unitTotals[unit] / itemsTotal) : 0
        const allocated = totalPaid * share
        res[unit] ||= {}
        res[unit][method] ||= { count: 0, amount: 0 }
        res[unit][method].amount += allocated
        res[unit][method].count += unitQtys[unit] || 0
      })
    }
  })

  return res
}
