import React from 'react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function SimpleDashboard({ sales = [], expenses = [], products = [], dateRange = {} }) {
  console.log('SimpleDashboard - sales:', sales.length, sales)
  console.log('SimpleDashboard - expenses:', expenses.length, expenses)
  console.log('SimpleDashboard - dateRange:', dateRange)
  
  // Función helper para extraer número de un valor que puede ser string con moneda
  const parseNumber = (val) => {
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      // Remover moneda, espacios y comas
      const cleaned = val.replace(/[^\d.-]/g, '')
      return parseFloat(cleaned) || 0
    }
    return 0
  }
  
  // Función helper para calcular el total de una venta
  const calculateSaleTotal = (sale) => {
    if (sale.total) {
      return parseNumber(sale.total)
    }
    // Si no hay total, calcularlo desde los items
    const itemsTotal = (sale.items || []).reduce((sum, item) => {
      const qty = Number(item.qty || item.quantity || 0)
      const price = parseNumber(item.price)
      return sum + (qty * price)
    }, 0)
    return itemsTotal || 0
  }

  // Transformar ventas a serie de tiempo
  const timeSeriesData = {}
  const startDate = new Date(dateRange.start || new Date().setDate(new Date().getDate() - 30))
  const endDate = new Date(dateRange.end || new Date())
  let current = new Date(startDate)
  
  while (current <= endDate) {
    const key = current.toISOString().slice(0, 10)
    timeSeriesData[key] = { date: key, sales: 0, expenses: 0 }
    current.setDate(current.getDate() + 1)
  }

  sales.forEach(s => {
    if (s.date) {
      const sDate = typeof s.date === 'string' ? s.date.slice(0, 10) : new Date(s.date).toISOString().slice(0, 10)
      if (timeSeriesData[sDate]) {
        const saleTotal = calculateSaleTotal(s)
        console.log('Sale:', s.id, 'total:', saleTotal, 'date:', sDate)
        timeSeriesData[sDate].sales += saleTotal
      }
    }
  })

  expenses.forEach(e => {
    if (e.date) {
      const eDate = typeof e.date === 'string' ? e.date.slice(0, 10) : new Date(e.date).toISOString().slice(0, 10)
      if (timeSeriesData[eDate]) {
        const expAmount = parseNumber(e.amount)
        timeSeriesData[eDate].expenses += expAmount
      }
    }
  })

  const timeSeries = Object.values(timeSeriesData).sort((a, b) => new Date(a.date) - new Date(b.date))

  // Calcular KPIs - usando la función helper
  const totalSales = sales.reduce((sum, s) => sum + calculateSaleTotal(s), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + parseNumber(e.amount), 0)
  const profit = totalSales - totalExpenses
  const margin = totalSales > 0 ? ((profit / totalSales) * 100).toFixed(2) : 0

  console.log('KPIs calculados:', { totalSales, totalExpenses, profit, margin })

  // Gráfico por categorías
  const categoryData = {}
  sales.forEach(s => {
    (s.items || []).forEach(item => {
      const prod = products.find(p => String(p.id) === String(item.id))
      const category = prod?.category || 'Sin categoría'
      const amount = parseNumber(item.price) * Number(item.qty || item.quantity || 0)
      categoryData[category] = (categoryData[category] || 0) + amount
    })
  })
  const categories = Object.entries(categoryData).map(([name, value]) => ({ name, value }))

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4']

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginTop: 0, color: '#1e293b' }}> Dashboard Financiero</h2>
      
      {/* Mensaje de depuración si no hay ventas */}
      {sales.length === 0 && (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b' }}>
          <strong>Sin ventas</strong> - No hay ventas en el rango de fechas seleccionado ({dateRange.start} a {dateRange.end})
        </div>
      )}
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Ventas Totales</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', marginTop: '8px' }}>
            ${totalSales.toFixed(2)}
          </div>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #ef4444', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Gastos Totales</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444', marginTop: '8px' }}>
            ${totalExpenses.toFixed(2)}
          </div>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Ganancia Neta</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6', marginTop: '8px' }}>
            ${profit.toFixed(2)}
          </div>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #8b5cf6', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Margen %</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#8b5cf6', marginTop: '8px' }}>
            {margin}%
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        {/* Gráfico de línea */}
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Ventas vs Gastos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeries} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                formatter={(value) => `$${Number(value).toFixed(2)}`}
              />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={false} name="Ventas" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} name="Gastos" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de categorías */}
        {categories.length > 0 && (
          <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Ventas por Categoría</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Mensaje si no hay datos */}
      {sales.length === 0 && expenses.length === 0 && (
        <div style={{ marginTop: '24px', padding: '16px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', color: '#92400e', textAlign: 'center' }}>
          No hay datos. Los gráficos aparecerán cuando registres ventas o gastos.
        </div>
      )}
    </div>
  )
}
