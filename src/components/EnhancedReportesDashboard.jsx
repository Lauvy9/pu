import React, { useState, useMemo, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import {
  transformToTimeSeries,
  transformToCategories,
  getTopProducts,
  calculateKPIs,
  transformExpensesByType,
  getPaymentMethods,
  compareWithPreviousPeriod
} from '../utils/dashboardChartHelpers'
import {
  StatsGrid,
  SalesExpenseTrendChart,
  CategoryDistributionChart,
  BarChartComponent,
  TopProductsChart,
  KPICard
} from '../components/DashboardCharts'
import '../styles/dashboard-enhanced.css'

export default function EnhancedReportesDashboard({ externalRange = {} }) {
  const { sales = [], expenses = [], products = [], fiados = [] } = useStore()
  const [dateRange, setDateRange] = useState(externalRange || {
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10)
  })

  // Actualizar dateRange si externalRange cambia
  useEffect(() => {
    if (externalRange && (externalRange.start || externalRange.end)) {
      setDateRange(externalRange)
    }
  }, [externalRange])

  // Filtrar ventas por rango de fechas
  const filteredSales = useMemo(() => {
    const startDate = new Date(dateRange.start)
    if (!isNaN(startDate)) startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(dateRange.end)
    if (!isNaN(endDate)) endDate.setHours(23, 59, 59, 999)
    return (sales || []).filter(s => {
      const saleDate = new Date(s.date || new Date())
      return saleDate >= startDate && saleDate <= endDate
    })
  }, [sales, dateRange])

  // Filtrar gastos por rango de fechas
  const filteredExpenses = useMemo(() => {
    const startDate = new Date(dateRange.start)
    if (!isNaN(startDate)) startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(dateRange.end)
    if (!isNaN(endDate)) endDate.setHours(23, 59, 59, 999)
    return (expenses || []).filter(e => {
      const expenseDate = new Date(e.date || new Date())
      return expenseDate >= startDate && expenseDate <= endDate
    })
  }, [expenses, dateRange])

  // Calcular datos para gráficos
  const chartData = useMemo(() => {
    try {
      return {
        timeSeries: transformToTimeSeries(filteredSales, filteredExpenses, dateRange),
        categories: transformToCategories(products, filteredSales),
        topProducts: getTopProducts(filteredSales, products),
        expensesByType: transformExpensesByType(filteredExpenses),
        paymentMethods: getPaymentMethods(filteredSales),
        kpis: calculateKPIs(filteredSales, filteredExpenses, products),
        comparison: compareWithPreviousPeriod(sales, expenses, dateRange)
      }
    } catch (e) {
      console.error('Error calculating chart data:', e)
      return {
        timeSeries: [],
        categories: [],
        topProducts: [],
        expensesByType: [],
        paymentMethods: [],
        kpis: { totalSales: '0', totalExpenses: '0', profit: '0', margin: '0%', saleCount: 0, avgTicket: '0' },
        comparison: null
      }
    }
  }, [filteredSales, filteredExpenses, products, dateRange])

  // Calcular clientes activos (únicos por DNI/telefono en fiados)
  const activeClients = useMemo(() => {
    const fiados_clients = (fiados || []).map(f => f.id).length
    const sales_clients = new Set()
    ;(filteredSales || []).forEach(s => {
      if (s.clienteDNI) sales_clients.add(s.clienteDNI)
      else if (s.clienteFiado) sales_clients.add(s.clienteFiado)
    })
    return fiados_clients + sales_clients.size
  }, [fiados, filteredSales])

  return (
    <div style={{
      background: '#f8fafc',
      padding: '24px',
      borderRadius: '12px',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 16px 0', fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
          📊 Dashboard Financiero
        </h1>
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: '#fff',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>
            {filteredSales.length} ventas | {filteredExpenses.length} gastos | {activeClients} clientes activos
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <StatsGrid stats={chartData.kpis} />

      {/* Main Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '24px',
        marginBottom: '24px',
        marginTop: '24px'
      }}>
        {/* Línea de Tiempo */}
        <div style={{ gridColumn: '1 / -1' }}>
          <SalesExpenseTrendChart data={chartData.timeSeries} height={400} />
        </div>

        {/* Distribución por Categoría */}
        {chartData.categories.length > 0 && (
          <CategoryDistributionChart
            data={chartData.categories}
            height={300}
            title="Ventas por Categoría"
          />
        )}

        {/* Gastos por Tipo */}
        {chartData.expensesByType.length > 0 && (
          <CategoryDistributionChart
            data={chartData.expensesByType.map(e => ({ category: e.type, value: e.value }))}
            height={300}
            title="Gastos por Tipo"
          />
        )}
      </div>

      {/* Secondary Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {/* Top Productos */}
        {chartData.topProducts.length > 0 && (
          <TopProductsChart data={chartData.topProducts} height={350} />
        )}

        {/* Métodos de Pago */}
        {chartData.paymentMethods.length > 0 && (
          <BarChartComponent
            data={chartData.paymentMethods}
            dataKey="count"
            height={350}
            title="Transacciones por Método de Pago"
            xKey="method"
          />
        )}
      </div>

      {/* Info si no hay datos */}
      {filteredSales.length === 0 && filteredExpenses.length === 0 && (
        <div style={{
          marginTop: '32px',
          padding: '24px',
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#92400e'
        }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            ℹ️ No hay datos para mostrar en el período seleccionado. Los gráficos aparecerán cuando hayas registrado ventas o gastos.
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div style={{
        marginTop: '32px',
        padding: '16px',
        background: '#f1f5f9',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#64748b',
        textAlign: 'center'
      }}>
        Dashboard actualizado en tiempo real • Los datos se filtran automáticamente según el rango de fechas seleccionado
      </div>
    </div>
  )
}
