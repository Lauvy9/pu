/**
 * Helper functions for Reportes analytics
 * Procesa transacciones y ventas para KPIs y gráficos
 * 
 * MODELO FINANCIERO:
 * ==================
 * Ganancia Neta = (Ventas - CMV) - Gastos Operativos
 * 
 * TIPOS DE TRANSACCIONES:
 * - tipo: 'venta'              → Venta de productos (incluye productSnapshot con costo)
 * - tipo: 'gasto'              → Gasto operativo (sueldos, servicios, etc.)
 * - tipo: 'compra_mercaderia'  → Compra/reposición de inventario (NO es gasto operativo)
 * 
 * CMV (Costo de Mercancías Vendidas):
 * - Se calcula SOLO de transacciones tipo 'venta'
 * - CMV = SUM(productSnapshot.cost × cantidad) para cada venta
 * - NO incluye costos de compra_mercaderia (solo impacta cuando se vende)
 * 
 * Gastos Operativos:
 * - Se calculan SOLO de transacciones tipo 'gasto'
 * - Excluye compra_mercaderia
 * - Se distribuyen: específicos 100% + compartidos 50/50 por unidad
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
  const filtered = dateRange
    ? filterByDateRange(transactions, dateRange)
    : transactions;

  return filtered
    .filter(tx => tx.tipo === 'gasto' || tx.tipo === 'expense')
    .reduce((sum, tx) => sum + Number(tx.monto || tx.total || tx.amount || 0), 0);
};

/**
 * Calcula ganancia neta = (ventas - CMV) - gastos
 * Incluye costo de productos vendidos en el cálculo
 */
export const calculateNetProfit = (transactions = [], dateRange = null) => {
  const sales = calculateTotalSales(transactions, dateRange);
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  
  // Calcular CMV: suma de (producto.costo × cantidad) para todas las ventas
  const cmv = filtered
    .filter(tx => tx.tipo === 'venta' || tx.tipo === 'sale')
    .reduce((sum, tx) => {
      const costPerUnit = Number(tx.productSnapshot?.cost || 0) || 0;
      const quantity = Number(tx.cantidad || tx.qty || 0) || 0;
      return sum + (costPerUnit * quantity);
    }, 0);
  
  const expenses = calculateTotalExpenses(transactions, dateRange);
  
  // Ganancia Neta = (Ventas - CMV) - Gastos
  return sales - cmv - expenses;
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
 * Calcula costo total de productos vendidos por unidad de negocio
 * Solo suma costos de transacciones de venta
 */
export const calculateProductCostByBusinessUnit = (transactions = [], dateRange = null, unit = 'vidrieria') => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  return filtered
    .filter(tx => {
      const isVenta = tx.tipo === 'venta' || tx.tipo === 'sale';
      const matchesUnit = tx.businessUnit === unit || tx.businessUnit === 'compartido';
      return isVenta && matchesUnit;
    })
    .reduce((sum, tx) => {
      // El costo es cantidad × costo unitario del producto vendido
      const costPerUnit = Number(tx.productSnapshot?.cost || 0) || 0;
      const quantity = Number(tx.cantidad || tx.qty || 0) || 0;
      return sum + (costPerUnit * quantity);
    }, 0);
};

/**
 * Calcula gastos compartidos por unidad (distribución 50/50)
 */
const calculateSharedExpensesByUnit = (transactions = [], dateRange = null, unit = 'vidrieria') => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  const sharedExpenses = filtered.filter(tx => {
    const isGasto = tx.tipo === 'gasto' || tx.tipo === 'expense';
    const isShared = tx.businessUnit === 'compartido' || tx.businessUnit === 'ambos';
    return isGasto && isShared;
  });

  // Sumar total de gastos compartidos y dividir entre 2
  const totalShared = sharedExpenses.reduce(
    (sum, tx) => sum + Number(tx.monto || tx.total || tx.amount || 0),
    0
  );
  return totalShared / 2;
};

/**
 * Calcula gastos específicos de una unidad (sin compartidos)
 */
const calculateUnitSpecificExpenses = (transactions = [], dateRange = null, unit = 'vidrieria') => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  return filtered
    .filter(tx => {
      const isGasto = tx.tipo === 'gasto' || tx.tipo === 'expense';
      const isSpecific = tx.businessUnit === unit;
      return isGasto && isSpecific;
    })
    .reduce((sum, tx) => sum + Number(tx.monto || tx.total || tx.amount || 0), 0);
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
    categoryMap[key].value += Number(tx.monto || tx.total || tx.amount || 0) || 0;
  });

  return Object.values(categoryMap).sort((a, b) => b.value - a.value);
};

/**
 * Retorna productos con stock crítico (bajo el mínimo)
 * Incluye productos sin stock (0) y con stock bajo
 */
export const getLowStockProducts = (products = [], limit = 5) => {
  return (products || [])
    .filter(p => {
      const stock = Number(p.stock || 0) || 0;
      const minimo = Number(p.minimo || 0) || 5; // Usar 5 como mínimo por defecto si no está definido
      return stock < minimo; // Incluir stock 0 y stock < mínimo
    })
    .map(p => ({
      id: p.id,
      name: p.name || p.title || 'Sin nombre',
      stock: Number(p.stock || 0) || 0,
      minimo: Number(p.minimo || 0) || 5,
      businessUnit: p.businessUnit || 'sin_especificar',
    }))
    .sort((a, b) => a.stock - b.stock)
    .slice(0, limit);
};

/**
 * NUEVA VERSIÓN: Calcula ganancia detallada por unidad
 * Modelo: Ganancia Neta = (Ventas - Costo Productos) - Gastos
 */
export const getProfitByBusinessUnit = (transactions = [], dateRange = null) => {
  const units = ['vidrieria', 'muebleria'];
  const results = units.map(unit => {
    const ventas = calculateSalesByBusinessUnit(transactions, dateRange, unit);
    const costProductos = calculateProductCostByBusinessUnit(transactions, dateRange, unit);
    const gastoEspecifico = calculateUnitSpecificExpenses(transactions, dateRange, unit);
    const gastoCompartido = calculateSharedExpensesByUnit(transactions, dateRange, unit);
    const gastoTotal = gastoEspecifico + gastoCompartido;
    
    const margenBruto = ventas - costProductos;
    const ganancia = margenBruto - gastoTotal;
    
    return {
      name: unit === 'vidrieria' ? 'Vidriería' : 'Mueblería',
      ventas: Math.round(ventas * 100) / 100,
      costProductos: Math.round(costProductos * 100) / 100,
      margenBruto: Math.round(margenBruto * 100) / 100,
      gastos: Math.round(gastoTotal * 100) / 100,
      ganancia: Math.round(ganancia * 100) / 100,
      // Mantener backward compatibility
      sales: Math.round(ventas * 100) / 100,
      expenses: Math.round(gastoTotal * 100) / 100,
    };
  });
  
  return results.filter(u => u.ventas > 0 || u.gastos > 0);
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
/**
 * Calcula gastos operativos por unidad de negocio
 * CORREGIDO: Aplica prorrateo de gastos "ambos" y "compartido" (50/50)
 */
export const getOperationalExpensesByBusinessUnit = (transactions = [], dateRange = null, unit = 'vidrieria') => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  
  // Gastos específicos de la unidad (100%)
  const unitSpecific = filtered
    .filter(tx => {
      const isGasto = tx.tipo === 'gasto' || tx.tipo === 'expense';
      return isGasto && tx.businessUnit === unit;
    })
    .reduce((sum, tx) => sum + Number(tx.monto || tx.total || tx.amount || 0), 0);
  
  // Gastos compartidos (50% para cada unidad)
  const sharedExpenses = filtered
    .filter(tx => {
      const isGasto = tx.tipo === 'gasto' || tx.tipo === 'expense';
      const isShared = tx.businessUnit === 'compartido' || tx.businessUnit === 'ambos';
      return isGasto && isShared;
    })
    .reduce((sum, tx) => sum + Number(tx.monto || tx.total || tx.amount || 0), 0);
  
  const unitSharedPortion = sharedExpenses / 2;
  
  return unitSpecific + unitSharedPortion;
};

/**
 * Calcula ganancia neta por unidad de negocio con modelo correcto
 * Ganancia Neta = (Ventas - Costo de Productos) - Gastos Operativos
 * 
 * Incluye:
 * - Gastos específicos de la unidad
 * - Proporción de gastos compartidos (50% si aplica)
 */
export const getNetProfitByBusinessUnit = (transactions = [], dateRange = null, unit = 'vidrieria') => {
  const sales = calculateSalesByBusinessUnit(transactions, dateRange, unit);
  const productCost = calculateProductCostByBusinessUnit(transactions, dateRange, unit);
  const unitSpecificExpenses = calculateUnitSpecificExpenses(transactions, dateRange, unit);
  const sharedExpenses = calculateSharedExpensesByUnit(transactions, dateRange, unit);
  
  const grossProfit = sales - productCost;
  const netProfit = grossProfit - unitSpecificExpenses - sharedExpenses;
  
  return netProfit;
};

/**
 * Retorna sales vs expenses por unidad de negocio
 */
export const getSalesVsExpensesByUnit = (transactions = [], dateRange = null, unit = 'vidrieria') => {
  const sales = calculateSalesByBusinessUnit(transactions, dateRange, unit);
  const unitSpecificExpenses = calculateUnitSpecificExpenses(transactions, dateRange, unit);
  const sharedExpenses = calculateSharedExpensesByUnit(transactions, dateRange, unit);
  const totalExpenses = unitSpecificExpenses + sharedExpenses;
  
  return [
    { name: 'Ventas', value: sales, fill: '#2e7d32' },
    { name: 'Gastos', value: totalExpenses, fill: '#d32f2f' },
  ];
};

/**
 * Top productos por unidad de negocio
 */
export const getTopProductsByUnit = (transactions = [], products = [], limit = 5, dateRange = null, unit = 'vidrieria') => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  const sales = filtered.filter(tx => {
    const isVenta = tx.tipo === 'venta' || tx.tipo === 'sale';
    const matchesUnit = tx.businessUnit === unit || tx.businessUnit === 'compartido' || tx.businessUnit === 'ambos';
    return isVenta && matchesUnit;
  });

  const productMap = {};
  sales.forEach(tx => {
    // Usar nombreProducto como clave principal, fallback a nombre del producto por ID
    let productName = tx.nombreProducto || 'Sin nombre';
    
    // Si no tiene nombre, buscar en la lista de productos por ID
    if (!productName || productName === 'Sin nombre') {
      const prod = products && products.find(p => String(p.id) === String(tx.productoId));
      if (prod && prod.name) {
        productName = prod.name;
      }
    }
    
    // Usar nombre de producto como clave
    const key = String(productName).trim();
    
    if (!productMap[key]) {
      productMap[key] = { name: key, cantidad: 0, total: 0, id: tx.productoId };
    }
    
    const cantidad = Number(tx.cantidad || tx.qty || 0) || 0;
    const precioUnitario = cantidad > 0 ? (Number(tx.total || 0) / cantidad) : 0;
    
    productMap[key].cantidad += cantidad;
    productMap[key].total += Number(tx.total || 0) || 0;
  });

  const result = Object.values(productMap)
    .filter(item => item.cantidad > 0) // Excluir si no hay cantidad
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limit);
  
  return result;
};

/**
 * Resumen de transacciones de gasto por unidad
 * CORREGIDO: Muestra el monto prorratizado para gastos "ambos"/"compartido"
 */
export const getExpenseTransactionsByUnit = (transactions = [], dateRange = null, unit = 'vidrieria') => {
  const filtered = dateRange ? filterByDateRange(transactions, dateRange) : transactions;
  return filtered
    .filter(tx => {
      const isGasto = tx.tipo === 'gasto';
      const matchesUnit = tx.businessUnit === unit || tx.businessUnit === 'compartido' || tx.businessUnit === 'ambos';
      return isGasto && matchesUnit;
    })
    .map(tx => {
      // Si el gasto es compartido o "ambos", mostrar 50% del monto
      const isShared = tx.businessUnit === 'compartido' || tx.businessUnit === 'ambos';
      const displayMonto = isShared 
        ? Number(tx.monto || 0) / 2 
        : Number(tx.monto || 0);
      
      return {
        id: tx.id,
        fecha: tx.fecha,
        concepto: tx.concepto || 'Sin concepto',
        pagadoA: tx.pagadoA || 'N/A',
        monto: displayMonto,
        observacion: tx.observacion || null,
        businessUnit: tx.businessUnit,
        isShared: isShared, // Para referencia interna
      };
    });
};

