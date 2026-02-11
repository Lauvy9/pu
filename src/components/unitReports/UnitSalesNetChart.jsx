import React from 'react'
import { Bar } from 'react-chartjs-2'
import KPICard from '../KPICard'
import { formatCurrency } from '../../utils/helpers'

export default function UnitSalesNetChart({ totals = {} }){
  const m = totals.muebleria || { totalSales:0, netProfit:0 }
  const v = totals.vidrieria || { totalSales:0, netProfit:0 }
  const s = totals.sin_especificar || { totalSales:0, netProfit:0 }

  return (
    <div style={{ background:'#fff', padding:12, borderRadius:6 }}>
      <h4 style={{ marginTop:0 }}>Ventas Totales y Ganancia Neta por Unidad</h4>
      <div style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap:8, marginBottom:12 }}>
        <KPICard title="Mueblería - Ventas" value={`${formatCurrency(m.totalSales || 0)}`} color="#1976d2" subtitle={`Ganancia Neta: ${formatCurrency(m.netProfit || 0)}`} />
        <KPICard title="Vidriería - Ventas" value={`${formatCurrency(v.totalSales || 0)}`} color="#00897b" subtitle={`Ganancia Neta: ${formatCurrency(v.netProfit || 0)}`} />
        <KPICard title="Sin especificar" value={`${formatCurrency(s.totalSales || 0)}`} color="#9e9e9e" subtitle={`Ganancia Neta: ${formatCurrency(s.netProfit || 0)}`} />
      </div>
      <Bar data={{ labels: ['Mueblería','Vidriería','Sin especificar'], datasets: [{ label: 'Ventas Totales', data: [m.totalSales || 0, v.totalSales || 0, s.totalSales || 0], backgroundColor: ['#1976d2','#00897b','#9e9e9e'] }, { label: 'Ganancia Neta', data: [m.netProfit || 0, v.netProfit || 0, s.netProfit || 0], backgroundColor: ['#2e7d32','#c62828','#bdbdbd'] }] }} />
    </div>
  )
}
