// ===============================
// 🧠 Helpers numéricos seguros
// ===============================
function _safeNumber(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

// ===============================
// 📊 Cálculo financiero principal
// ===============================
export function calculateFinancialData(dateRange, sales = [], expenses = [], purchases = []) {
  const startDate = dateRange?.start ? new Date(dateRange.start) : null;
  if (startDate && !isNaN(startDate)) startDate.setHours(0, 0, 0, 0);

  const endDate = dateRange?.end ? new Date(dateRange.end) : null;
  if (endDate && !isNaN(endDate)) endDate.setHours(23, 59, 59, 999);

  // ===============================
  // ✅ FILTRADO POR FECHA
  // ===============================
  const filteredSales = sales.filter(sale => {
    const d = new Date(
      sale.date ||
      sale.fecha ||
      sale.createdAt ||
      sale.timestamp ||
      null
    );
    if (isNaN(d)) return false;
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });

  const filteredExpenses = expenses.filter(exp => {
    const d = new Date(
      exp.date ||
      exp.fecha ||
      exp.createdAt ||
      exp.timestamp ||
      null
    );
    if (isNaN(d)) return false;
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });

  // ===============================
  // 💰 TOTALES GENERALES
  // ===============================
  const totalSales = filteredSales.reduce((sum, sale) => {
    return sum + _safeNumber(
      sale.total ||
      sale.totalVenta ||
      sale.totalAmount ||
      sale.monto ||
      0
    );
  }, 0);

  const totalCosts = filteredSales.reduce((sum, sale) => {
    const saleCost = (sale.items || []).reduce((acc, item) => {
      return acc + (
        _safeNumber(item.cost || item.unitCost || 0) *
        _safeNumber(item.qty || item.quantity || 0)
      );
    }, 0);
    return sum + saleCost;
  }, 0);

  const totalExpenses = filteredExpenses.reduce((sum, exp) => {
    return sum + _safeNumber(
      exp.amount ||
      exp.monto ||
      exp.value ||
      exp.cost ||
      0
    );
  }, 0);

  const grossProfit = totalSales - totalCosts;
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalSales > 0
    ? (netProfit / totalSales) * 100
    : 0;

  // ===============================
  // 🏪 AGRUPACIÓN POR UNIDAD
  // ===============================
  const totalsByUnit = {
    muebleria: { totalSales: 0, totalCosts: 0, grossProfit: 0, netProfit: 0 },
    vidrieria: { totalSales: 0, totalCosts: 0, grossProfit: 0, netProfit: 0 },
    sin_especificar: { totalSales: 0, totalCosts: 0, grossProfit: 0, netProfit: 0 }
  };

  filteredSales.forEach(sale => {
    const rawUnit =
      sale.businessUnit ||
      sale.unit ||
      sale.unidad ||
      sale.items?.[0]?.unit ||
      sale.items?.[0]?.category ||
      '';

    const unit = rawUnit.toString().toLowerCase();
    let key = 'sin_especificar';

    if (unit.includes('mue') || unit.includes('mobi')) key = 'muebleria';
    else if (unit.includes('vid')) key = 'vidrieria';

    const saleTotal = _safeNumber(
      sale.total ||
      sale.totalVenta ||
      sale.totalAmount ||
      sale.monto ||
      0
    );

    const saleCost = (sale.items || []).reduce((acc, item) => {
      return acc + (
        _safeNumber(item.cost || item.unitCost || 0) *
        _safeNumber(item.qty || item.quantity || 0)
      );
    }, 0);

    totalsByUnit[key].totalSales += saleTotal;
    totalsByUnit[key].totalCosts += saleCost;
  });

  // ===============================
  // 🧾 GASTOS POR UNIDAD
  // ===============================
  const expensesByUnit = {
    muebleria: 0,
    vidrieria: 0,
    sin_especificar: 0
  };

  filteredExpenses.forEach(exp => {
    const rawUnit = exp.businessUnit || exp.unit || exp.unidad || '';
    const unit = rawUnit.toString().toLowerCase();
    let key = 'sin_especificar';

    if (unit.includes('mue') || unit.includes('mobi')) key = 'muebleria';
    else if (unit.includes('vid')) key = 'vidrieria';

    expensesByUnit[key] += _safeNumber(
      exp.amount ||
      exp.monto ||
      exp.value ||
      exp.cost ||
      0
    );
  });

  // ===============================
  // 📈 CÁLCULO FINAL POR UNIDAD
  // ===============================
  Object.keys(totalsByUnit).forEach(key => {
    totalsByUnit[key].grossProfit =
      totalsByUnit[key].totalSales - totalsByUnit[key].totalCosts;

    totalsByUnit[key].netProfit =
      totalsByUnit[key].grossProfit - (expensesByUnit[key] || 0);
  });

  // ===============================
  // 🚀 RETURN FINAL
  // ===============================
  return {
    totalSales,
    totalCosts,
    totalExpenses,
    grossProfit,
    netProfit,
    profitMargin,
    totalsByUnit,
    expensesByUnit,
    filteredSales,
    filteredExpenses
  };
}

// ===============================
// 📈 Helper: Agregar/normalizar series temporales
// ===============================
export function aggregateSeries(data = [], granularity = 'day'){
  // Soporta varios formatos de entrada:
  // - Array de { date, value } o { date, total }
  // - Objeto { labels: [], datasets: [{ data: [] }] }
  // - Objeto mapa { '2025-01-01': 123, ... }

  if (!data) return []

  // Caso: estructura Chart.js { labels, datasets }
  if (!Array.isArray(data) && typeof data === 'object'){
    const labels = data.labels
    const datasets = data.datasets
    if (Array.isArray(labels) && Array.isArray(datasets) && datasets.length){
      const values = datasets[0].data || []
      return labels.map((lab, i) => ({ date: String(lab), value: Number(values[i] || 0) }))
    }

    // Caso: mapa simple { date: value }
    const keys = Object.keys(data)
    if (keys.length && typeof data[keys[0]] === 'number'){
      return keys.sort().map(k => ({ date: k, value: Number(data[k] || 0) }))
    }
  }

  // Caso: array genérico
  if (Array.isArray(data)){
    const mapped = data.map(item => {
      if (item == null) return { date: '', value: 0 }
      if (typeof item === 'number') return { date: '', value: Number(item) }
      const date = item.date || item.label || item.x || ''
      const value = Number(item.value ?? item.total ?? item.totalSales ?? item.amount ?? item.y ?? 0) || 0
      const dateStr = (date instanceof Date) ? date.toISOString().slice(0,10) : String(date || '')
      return { date: dateStr, value }
    })

    // Agregar por fecha (en caso de duplicados)
    const acc = {}
    mapped.forEach(({date, value}) => {
      acc[date] = (acc[date] || 0) + (Number(value) || 0)
    })
    return Object.keys(acc).sort().map(k => ({ date: k, value: acc[k] }))
  }

  return []
}

// Compatibilidad: wrapper con la firma usada en varias partes del proyecto
export function computeFinancials(sales = [], expenses = [], from = null, to = null){
  const range = {
    start: from ? (from instanceof Date ? from.toISOString() : String(from)) : null,
    end: to ? (to instanceof Date ? to.toISOString() : String(to)) : null
  }
  return calculateFinancialData(range, Array.isArray(sales) ? sales : [], Array.isArray(expenses) ? expenses : [], [])
}

// ===============================
// 🔗 Calculadora integrada (estructura amigable para vistas de reportes completos)
// ===============================
export function calculateIntegratedFinancialData({ sales = [], expenses = [], purchases = [], fiados = [], products = [], clients = [], dateRange = {} } = {}){
  // Reusar cálculo base
  const base = calculateFinancialData(dateRange, Array.isArray(sales) ? sales : [], Array.isArray(expenses) ? expenses : [], Array.isArray(purchases) ? purchases : [])

  // Ventas por producto
  const byProductMap = {}
  ;(base.filteredSales || []).forEach(sale => {
    (sale.items || []).forEach(it => {
      const id = it.id || it.sku || it.productId || String(it.name || JSON.stringify(it))
      const name = it.name || it.nombre || id
      const qty = Number(it.qty || it.quantity || 0) || 0
      const price = Number(it.price || it.unitPrice || it.valor || it.valorUnitario || it.total || 0) || 0
      const cost = Number(it.cost || it.unitCost || 0) || 0
      if (!byProductMap[id]) byProductMap[id] = { id, name, qty: 0, revenue: 0, cost: 0 }
      byProductMap[id].qty += qty
      byProductMap[id].revenue += qty * price
      byProductMap[id].cost += qty * cost
    })
  })
  const byProduct = Object.keys(byProductMap).map(k => byProductMap[k]).sort((a,b)=>b.revenue - a.revenue)

  // Inventario: combinar productos con ventas realizadas
  const prodMap = {}
  ;(Array.isArray(products) ? products : []).forEach(p => {
    const id = p.id || p.sku || String(p.name || JSON.stringify(p))
    prodMap[id] = { id, name: p.nombre || p.name || id, stock: Number(p.stock || p.cantidad || 0) || 0, sold: 0 }
  })
  byProduct.forEach(p => {
    if (!prodMap[p.id]) prodMap[p.id] = { id: p.id, name: p.name || p.id, stock: 0, sold: 0 }
    prodMap[p.id].sold = p.qty || 0
  })
  const inventoryItems = Object.keys(prodMap).map(k => prodMap[k])

  // Clientes: métricas simples
  const clientKeys = new Set()
  ;(Array.isArray(sales) ? sales : []).forEach(s => {
    const clientObj = s.client || s.customer || null
    const key = clientObj && (clientObj.id || clientObj._id) ? String(clientObj.id || clientObj._id) : (s.clienteFiado || s.clientId || s.clientName || s.clienteNombre || JSON.stringify(clientObj || {}))
    if (key) clientKeys.add(String(key))
  })

  const clientsSummary = {
    totalDistinct: clientKeys.size,
    newClients: 0,
    recurringClients: 0
  }

  // Fiados: totales simples
  const fiadosList = Array.isArray(fiados) ? fiados : []
  const totalFiados = fiadosList.reduce((s,f) => s + (Number(f.deuda || f.amount || f.monto || 0) || 0), 0)
  const overdue = fiadosList.reduce((s,f) => {
    try{ const due = f.dueDate || f.vencimiento || null; if (due && new Date(due) < new Date()) return s + (Number(f.deuda||f.amount||f.monto||0)||0) }catch(e){}
    return s
  }, 0)

  return {
    resumen: {
      totalSales: base.totalSales || 0,
      totalExpenses: base.totalExpenses || 0,
      totalCosts: base.totalCosts || 0,
      netProfit: base.netProfit || 0
    },
    ventas: { byProduct },
    gastos: { list: base.filteredExpenses || [] },
    clientes: clientsSummary,
    inventario: { items: inventoryItems },
    fiados: { totalFiados, overdue, list: fiadosList },
    raw: base
  }
}
