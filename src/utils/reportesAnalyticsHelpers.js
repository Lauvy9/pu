/**
 * Helper functions for Reportes analytics
 * Procesa transacciones y ventas para KPIs y gráficos
 */

/**
 * Normaliza cualquier valor a Date válido
 */
const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d) ? null : d;
};

/**
 * Filtra transacciones por rango de fechas
 * Robusto: si no hay período, NO filtra (retorna todo)
 * Si hay período, filtra correctamente
 */
export const filterByDateRange = (transactions = [], dateRange) => {
  // Si no hay dateRange o está incompleto, NO filtrar
  if (!dateRange) return transactions;

  const start = toDate(dateRange.start);
  const end = toDate(dateRange.end);

  if (!start || !end) return transactions; // 👈 CLAVE: sin período válido, no filtra

  return transactions.filter(tx => {
    const txDate = toDate(tx.fecha || tx.date);
    if (!txDate) return false;
    return txDate >= start && txDate <= end;
  });
};

/**
 * Calcula ventas totales (tipo === 'venta')
 */
export const calculateTotalSales = (transactions = [], dateRange = null) => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  return filtered
    .filter(tx => tx.tipo === 'venta' || tx.tipo === 'sale')
    .reduce((sum, tx) => sum + (Number(tx.total || 0) || 0), 0);
};

/**
 * Calcula gastos totales (tipo === 'gasto' o 'expense')
 */
export const calculateTotalExpenses = (transactions = [], dateRange = null) => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  return filtered
    .filter(tx => tx.tipo === 'gasto' || tx.tipo === 'expense')
    .reduce((sum, tx) => sum + (Number(tx.total || 0) || 0), 0);
};

/**
 * Calcula ganancia neta = ventas - gastos
 */
export const calculateNetProfit = (transactions = [], dateRange = null) => {
  const sales = calculateTotalSales(transactions, dateRange);
  const expenses = calculateTotalExpenses(transactions, dateRange);
  return sales - expenses;
};

/**
 * Calcula deuda pendiente: ventas fiadas no cobradas
 */
export const calculatePendingDebt = (sales = [], dateRange = null) => {
  const filtered = dateRange ? filterByDateRange(sales, dateRange) : sales;
  return filtered
    .filter(s => s.type === 'fiado' || s.isFiado)
    .reduce((sum, s) => {
      const total = Number(s.total || 0) || 0;
      const paid = Array.isArray(s.payments)
        ? s.payments.reduce((a, p) => a + (Number(p.amount || 0) || 0), 0)
        : 0;
      return sum + Math.max(0, total - paid);
    }, 0);
};

/**
 * Agrupa ventas por producto y retorna top N
 */
export const getTopProductsBySales = (transactions = [], products = [], limit = 5, dateRange = null) => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  const sales = filtered.filter(tx => tx.tipo === 'venta' || tx.tipo === 'sale');
  
  const productMap = {};
  sales.forEach(tx => {
    const key = tx.nombreProducto || 'Sin nombre';
    if (!productMap[key]) {
      productMap[key] = { name: key, cantidad: 0, total: 0, id: tx.productoId };
    }
    productMap[key].cantidad += Number(tx.cantidad || 0) || 0;
    productMap[key].total += Number(tx.total || 0) || 0;
  });

  return Object.values(productMap)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limit);
};

/**
 * Agrupa gastos por categoría
 */
export const getExpensesByCategory = (transactions = [], dateRange = null) => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  const expenses = filtered.filter(tx => tx.tipo === 'gasto' || tx.tipo === 'expense');
  
  const categoryMap = {};
  expenses.forEach(tx => {
    const key = tx.categoria || tx.category || 'Otros';
    if (!categoryMap[key]) {
      categoryMap[key] = { name: key, value: 0 };
    }
    categoryMap[key].value += Number(tx.total || 0) || 0;
  });

  return Object.values(categoryMap).sort((a, b) => b.value - a.value);
};

/**
 * Retorna top 5 productos con stock crítico
 */
export const getLowStockProducts = (products = [], limit = 5) => {
  return (products || [])
    .filter(p => {
      const stock = Number(p.stock || 0) || 0;
      const minimo = Number(p.minimo || 0) || 0;
      return stock <= minimo && stock > 0;
    })
    .map(p => ({
      id: p.id,
      name: p.name || 'Sin nombre',
      stock: Number(p.stock || 0) || 0,
      minimo: Number(p.minimo || 0) || 0,
      businessUnit: p.businessUnit,
    }))
    .sort((a, b) => a.stock - b.stock)
    .slice(0, limit);
};

/**
 * Calcula ganancia por unidad de negocio (Vidriería / Mueblería)
 */
export const getProfitByBusinessUnit = (transactions = [], dateRange = null) => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  
  const unitMap = {
    vidrieria: { name: 'Vidriería', sales: 0, expenses: 0 },
    muebleria: { name: 'Mueblería', sales: 0, expenses: 0 },
  };

  filtered.forEach(tx => {
    const unit = (tx.businessUnit || '').toLowerCase();
    if (tx.tipo === 'venta' || tx.tipo === 'sale') {
      if (unit === 'vidrieria') unitMap.vidrieria.sales += Number(tx.total || 0) || 0;
      else if (unit === 'muebleria') unitMap.muebleria.sales += Number(tx.total || 0) || 0;
    } else if (tx.tipo === 'gasto' || tx.tipo === 'expense') {
      if (unit === 'vidrieria') unitMap.vidrieria.expenses += Number(tx.total || 0) || 0;
      else if (unit === 'muebleria') unitMap.muebleria.expenses += Number(tx.total || 0) || 0;
    }
  });

  return [
    {
      name: unitMap.vidrieria.name,
      ganancia: unitMap.vidrieria.sales - unitMap.vidrieria.expenses,
      ventas: unitMap.vidrieria.sales,
      gastos: unitMap.vidrieria.expenses,
    },
    {
      name: unitMap.muebleria.name,
      ganancia: unitMap.muebleria.sales - unitMap.muebleria.expenses,
      ventas: unitMap.muebleria.sales,
      gastos: unitMap.muebleria.expenses,
    },
  ].filter(u => u.ventas > 0 || u.gastos > 0);
};

/**
 * Agrupa transacciones por día para gráfico de ingresos
 */
export const getSalesByDay = (transactions = [], dateRange = null) => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  const sales = filtered.filter(tx => tx.tipo === 'venta' || tx.tipo === 'sale');
  
  const dayMap = {};
  sales.forEach(tx => {
    const date = tx.fecha || tx.date;
    const day = date ? date.split('T')[0] : 'Sin fecha';
    if (!dayMap[day]) dayMap[day] = { date: day, total: 0 };
    dayMap[day].total += Number(tx.total || 0) || 0;
  });

  return Object.values(dayMap).sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Cálculo rápido para gráfico Ventas vs Gastos
 */
export const getSalesVsExpenses = (transactions = [], dateRange = null) => {
  const sales = calculateTotalSales(transactions, dateRange);
  const expenses = calculateTotalExpenses(transactions, dateRange);
  return [
    { name: 'Ventas', value: sales, fill: '#2e7d32' },
    { name: 'Gastos', value: expenses, fill: '#d32f2f' },
  ];
};

/**
 * ==========================================
 * NUEVOS HELPERS POR UNIDAD DE NEGOCIO
 * ==========================================
 */

/**
 * Calcula ventas por unidad de negocio (Vidriería / Mueblería)
 */
export const calculateSalesByBusinessUnit = (transactions = [], dateRange = null, unit = 'vidrieria') => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  return filtered
    .filter(tx => {
      const isVenta = tx.tipo === 'venta' || tx.tipo === 'sale';
      const matchesUnit = tx.businessUnit === unit || tx.businessUnit === 'compartido';
      return isVenta && matchesUnit;
    })
    .reduce((sum, tx) => sum + (Number(tx.total || 0) || 0), 0);
};

/**
 * Calcula gastos operativos por unidad de negocio
 * Incluye gastos "compartido" en ambas unidades
 */
export const getOperationalExpensesByBusinessUnit = (transactions = [], dateRange = null, unit = 'vidrieria') => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  return filtered
    .filter(tx => {
      const isGasto = tx.tipo === 'gasto';
      const matchesUnit = tx.businessUnit === unit || tx.businessUnit === 'compartido';
      return isGasto && matchesUnit;
    })
    .reduce((sum, tx) => sum + (Number(tx.monto || tx.total || 0) || 0), 0);
};

/**
 * Calcula ganancia neta por unidad de negocio
 * ganancia = ventas - (gastos específicos + proporción de compartidos)
 */
export const getNetProfitByBusinessUnit = (transactions = [], dateRange = null, unit = 'vidrieria') => {
  const sales = calculateSalesByBusinessUnit(transactions, dateRange, unit);
  const expenses = getOperationalExpensesByBusinessUnit(transactions, dateRange, unit);
  return sales - expenses;
};

/**
 * Retorna sales vs expenses por unidad de negocio
 */
export const getSalesVsExpensesByUnit = (transactions = [], dateRange = null, unit = 'vidrieria') => {
  const sales = calculateSalesByBusinessUnit(transactions, dateRange, unit);
  const expenses = getOperationalExpensesByBusinessUnit(transactions, dateRange, unit);
  return [
    { name: 'Ventas', value: sales, fill: '#2e7d32' },
    { name: 'Gastos', value: expenses, fill: '#d32f2f' },
  ];
};

/**
 * Top productos por unidad de negocio
 */
export const getTopProductsByUnit = (transactions = [], products = [], limit = 5, dateRange = null, unit = 'vidrieria') => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  const sales = filtered.filter(tx => {
    const isVenta = tx.tipo === 'venta' || tx.tipo === 'sale';
    const matchesUnit = tx.businessUnit === unit || tx.businessUnit === 'compartido';
    return isVenta && matchesUnit;
  });

  const productMap = {};
  sales.forEach(tx => {
    const key = tx.nombreProducto || 'Sin nombre';
    if (!productMap[key]) {
      productMap[key] = { name: key, cantidad: 0, total: 0, id: tx.productoId };
    }
    productMap[key].cantidad += Number(tx.cantidad || 0) || 0;
    productMap[key].total += Number(tx.total || 0) || 0;
  });

  return Object.values(productMap)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limit);
};

/**
 * Resumen de transacciones de gasto por unidad
 */
export const getExpenseTransactionsByUnit = (transactions = [], dateRange = null, unit = 'vidrieria') => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  return filtered
    .filter(tx => {
      const isGasto = tx.tipo === 'gasto';
      const matchesUnit = tx.businessUnit === unit || tx.businessUnit === 'compartido';
      return isGasto && matchesUnit;
    })
    .map(tx => ({
      id: tx.id,
      fecha: tx.fecha,
      concepto: tx.concepto || 'Sin concepto',
      pagadoA: tx.pagadoA || 'N/A',
      monto: Number(tx.monto || 0),
      observacion: tx.observacion || null,
      businessUnit: tx.businessUnit,
    }));
};

