/**
 * Utilidades para transformar datos de ventas/gastos en formatos para gráficos
 */

export function transformToTimeSeries(sales = [], expenses = [], dateRange = {}) {
  const { start, end } = dateRange
  const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30))
  const endDate = end ? new Date(end) : new Date()

  const dailyData = {}
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const key = currentDate.toISOString().slice(0, 10)
    dailyData[key] = { date: key, sales: 0, expenses: 0, profit: 0 }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Agregar ventas
  (sales || []).forEach(sale => {
    if (sale.date) {
      const dateKey = typeof sale.date === 'string' ? sale.date.slice(0, 10) : new Date(sale.date).toISOString().slice(0, 10)
      if (dailyData[dateKey]) {
        const saleTotal = (sale.items || []).reduce((sum, item) => {
          const price = Number(item.price || 0)
          const qty = Number(item.qty || item.quantity || 0)
          return sum + (price * qty)
        }, 0)
        // Si la venta tiene un total, usar eso como fallback
        const total = saleTotal || Number(sale.total || 0)
        dailyData[dateKey].sales += total
      }
    }
  })

  // Agregar gastos
  (expenses || []).forEach(expense => {
    if (expense.date) {
      const dateKey = typeof expense.date === 'string' ? expense.date.slice(0, 10) : new Date(expense.date).toISOString().slice(0, 10)
      if (dailyData[dateKey]) {
        dailyData[dateKey].expenses += Number(expense.amount || 0)
      }
    }
  })

  // Calcular ganancia
  Object.values(dailyData).forEach(day => {
    day.profit = day.sales - day.expenses
  })

  return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date))
}

export function transformToCategories(products = [], sales = []) {
  const categoryMap = {}

  ;(sales || []).forEach(sale => {
    (sale.items || []).forEach(item => {
      const product = products.find(p => String(p.id) === String(item.id))
      const category = (product && product.category) || 'Sin categoría'
      const price = Number(item.price || 0)
      const qty = Number(item.qty || item.quantity || 0)
      const amount = price * qty

      if (!categoryMap[category]) {
        categoryMap[category] = { category, value: 0, count: 0 }
      }
      categoryMap[category].value += amount
      categoryMap[category].count += qty
    })
  })

  return Object.values(categoryMap).sort((a, b) => b.value - a.value)
}

export function getTopProducts(sales = [], products = []) {
  const productMap = {}

  ;(sales || []).forEach(sale => {
    (sale.items || []).forEach(item => {
      const product = products.find(p => String(p.id) === String(item.id))
      const productName = (product && product.name) || `Producto #${item.id}`
      const price = Number(item.price || 0)
      const qty = Number(item.qty || item.quantity || 0)
      const amount = price * qty

      if (!productMap[item.id]) {
        productMap[item.id] = { id: item.id, name: productName, value: 0, quantity: 0 }
      }
      productMap[item.id].value += amount
      productMap[item.id].quantity += qty
    })
  })

  return Object.values(productMap)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
}

export function calculateKPIs(sales = [], expenses = [], products = []) {
  const totalSales = (sales || []).reduce((sum, s) => {
    const saleTotal = (s.items || []).reduce((itemSum, item) => itemSum + (Number(item.price || 0) * Number(item.quantity || 0)), 0)
    return sum + saleTotal
  }, 0)
  const totalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const profit = totalSales - totalExpenses
  const marginVal = totalSales > 0 ? ((profit / totalSales) * 100) : 0
  const saleCount = (sales || []).length
  const avgTicketVal = saleCount > 0 ? (totalSales / saleCount) : 0

  return {
    totalSales,
    totalExpenses,
    profit,
    margin: Number(marginVal.toFixed(2)) + '%',
    saleCount,
    avgTicket: Number(avgTicketVal.toFixed(2))
  }
}

export function transformExpensesByType(expenses = []) {
  const typeMap = {}

  ;(expenses || []).forEach(expense => {
    const type = expense.type || 'Otros'
    if (!typeMap[type]) {
      typeMap[type] = { type, value: 0, count: 0 }
    }
    typeMap[type].value += Number(expense.amount || 0)
    typeMap[type].count += 1
  })

  return Object.values(typeMap).sort((a, b) => b.value - a.value)
}

export function getPaymentMethods(sales = []) {
  const methodMap = {}

  ;(sales || []).forEach(sale => {
    const method = (sale.paymentMethod && sale.paymentMethod.toUpperCase()) || 'OTRO'
    if (!methodMap[method]) {
      methodMap[method] = { method, count: 0, total: 0 }
    }
    methodMap[method].count += 1
    const saleTotal = (sale.items || []).reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0)
    methodMap[method].total += saleTotal
  })

  return Object.values(methodMap).sort((a, b) => b.count - a.count)
}

export function compareWithPreviousPeriod(sales = [], expenses = [], dateRange = {}) {
  const { start, end } = dateRange
  const startDate = new Date(start)
  const endDate = new Date(end)
  const daysInPeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))

  const previousStart = new Date(startDate)
  previousStart.setDate(previousStart.getDate() - daysInPeriod)

  const currentPeriodSales = (sales || [])
    .filter(s => {
      const saleDate = new Date(s.date)
      return saleDate >= startDate && saleDate <= endDate
    })
    .reduce((sum, s) => sum + (s.items || []).reduce((itemSum, item) => itemSum + (Number(item.price || 0) * Number(item.quantity || 0)), 0), 0)

  const previousPeriodSales = (sales || [])
    .filter(s => {
      const saleDate = new Date(s.date)
      return saleDate >= previousStart && saleDate < startDate
    })
    .reduce((sum, s) => sum + (s.items || []).reduce((itemSum, item) => itemSum + (Number(item.price || 0) * Number(item.quantity || 0)), 0), 0)

  const changePercentVal = previousPeriodSales > 0 ? (((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100) : 0

  return {
    current: Number(currentPeriodSales.toFixed(2)),
    previous: Number(previousPeriodSales.toFixed(2)),
    changePercent: Number(changePercentVal.toFixed(1)),
    trend: changePercentVal >= 0 ? 'up' : 'down'
  }
}
