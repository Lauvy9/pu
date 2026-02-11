import React from 'react'
import { Bar } from 'react-chartjs-2'
import KPICard from '../KPICard'
import { formatCurrency } from '../../utils/helpers'

export default function UnitSalesChart({ data = {} }){
  const m = data.muebleria || { qty:0, total:0 }
  const v = data.vidrieria || { qty:0, total:0 }
  const s = data.sin_especificar || { qty:0, total:0 }

  return (
    <div style={{ background:'#fff', padding:12, borderRadius:6 }}>
      <h4 style={{ marginTop:0 }}>Ventas por Unidad</h4>
      <div style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap:8, marginBottom:12 }}>
        <KPICard title="Cant. vendida (Mueblería)" value={`${m.qty}`} color="#1976d2" subtitle={`Ingresos: ${formatCurrency(m.total)}`} />
        <KPICard title="Cant. vendida (Vidriería)" value={`${v.qty}`} color="#00897b" subtitle={`Ingresos: ${formatCurrency(v.total)}`} />
        <KPICard title="Sin especificar" value={`${s.qty}`} color="#9e9e9e" subtitle={`Ingresos: ${formatCurrency(s.total)}`} />
      </div>
      <Bar data={{ labels: ['Mueblería','Vidriería','Sin especificar'], datasets: [{ label: 'Ingresos', data: [m.total, v.total, s.total], backgroundColor: ['#1976d2','#00897b','#9e9e9e'] }, { label: 'Cantidad', data: [m.qty, v.qty, s.qty], backgroundColor: ['#6a1b9a','#43a047','#bdbdbd'] }] }} />
    </div>
  )
}
