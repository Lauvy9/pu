import React, { useMemo } from 'react'
import KPICard from './KPICard'
import { Doughnut } from 'react-chartjs-2'
import { formatCurrency } from '../utils/helpers'
import { useStore } from '../context/StoreContext'

export default function UnitDashboard({ unit, title, dashboardData: dashboardProp }){
  const store = useStore()
  const dashboardData = dashboardProp || (store && typeof store.getDashboardData === 'function' ? store.getDashboardData({ start: '1970-01-01', end: new Date().toISOString().slice(0,10) }) : {}) || {}

  const unitValue = (group, key) => {
    try{
      const raw = group?.[key]
      if (raw == null) return 0
      if (typeof raw === 'number') return raw
      if (typeof raw === 'object') return Number(raw.totalSales ?? raw.total ?? raw.netProfit ?? raw.value ?? 0) || 0
      return Number(raw) || 0
    }catch(e){ return 0 }
  }

  const totalsByUnit = dashboardData?.totalsByUnit || {}
  const expensesByUnit = dashboardData?.expensesByUnit || {}
  const netProfitByUnit = dashboardData?.netProfitByUnit || {}

  const ventas = unitValue(totalsByUnit, unit) || 0
  const costos = unitValue(totalsByUnit, unit) ? (typeof totalsByUnit[unit] === 'object' ? Number(totalsByUnit[unit].totalCosts ?? 0) : 0) : 0
  const gastos = unitValue(expensesByUnit, unit) || 0
  const ganancia = unitValue(netProfitByUnit, unit) || 0

  // calcular resto (suma total menos unidad) para gráficos comparativos
  const sumTotals = Object.values(totalsByUnit || {}).reduce((s,v)=> s + (typeof v === 'number' ? v : Number(v.totalSales ?? v.total ?? v.netProfit ?? 0) || 0), 0)
  const otherVentas = Math.max(0, sumTotals - ventas)

  const sumExpenses = Object.values(expensesByUnit || {}).reduce((s,v)=> s + (typeof v === 'number' ? v : Number(v.totalCosts ?? v.total ?? v.value ?? 0) || 0), 0)
  const otherGastos = Math.max(0, sumExpenses - gastos)

  const sumProfit = Object.values(netProfitByUnit || {}).reduce((s,v)=> s + (typeof v === 'number' ? v : Number(v.netProfit ?? v.total ?? v.value ?? 0) || 0), 0)
  const otherGanancia = Math.max(0, sumProfit - ganancia)

  return (
    <div style={{ background:'#fff', padding:12, borderRadius:6 }}>
      <h3 style={{ marginTop:0 }}>{title}</h3>
      <div style={{ display:'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom:12 }}>
        <KPICard title="Ventas totales" value={formatCurrency(ventas)} color="#1976d2" subtitle="Período seleccionado" />
        <KPICard title="Costos" value={formatCurrency(costos)} color="#f57c00" subtitle="Costo materiales" />
        <KPICard title="Gastos operativos" value={formatCurrency(gastos)} color="#d32f2f" subtitle="Gastos asignados" />
        <KPICard title="Ganancia neta" value={formatCurrency(ganancia)} color="#2e7d32" subtitle="Neto" />
      </div>

      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        <div style={{ flex: '1 1 300px', minWidth:260 }}>
          <h4 style={{ marginTop:0 }}>Ingresos</h4>
          <Doughnut data={{ labels: [title, 'Resto'], datasets: [{ data: [ventas, otherVentas], backgroundColor: ['#6a1b9a','#9e9e9e'] }] }} />
        </div>
        <div style={{ flex: '1 1 300px', minWidth:260 }}>
          <h4 style={{ marginTop:0 }}>Gastos</h4>
          <Doughnut data={{ labels: [title, 'Resto'], datasets: [{ data: [gastos, otherGastos], backgroundColor: ['#ad1457','#9e9e9e'] }] }} />
        </div>
        <div style={{ flex: '1 1 300px', minWidth:260 }}>
          <h4 style={{ marginTop:0 }}>Ganancia Neta</h4>
          <Doughnut data={{ labels: [title, 'Resto'], datasets: [{ data: [ganancia, otherGanancia], backgroundColor: ['#6a1b9a','#9e9e9e'] }] }} />
        </div>
      </div>
    </div>
  )
}
