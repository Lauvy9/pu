import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import KPICard from '../KPICard'
import { formatCurrency } from '../../utils/helpers'

export default function UnitStockChart({ data = {} }){
  const m = data.muebleria || { stock:0, value:0 }
  const v = data.vidrieria || { stock:0, value:0 }
  const s = data.sin_especificar || { stock:0, value:0 }

  return (
    <div style={{ background:'#fff', padding:12, borderRadius:6 }}>
      <h4 style={{ marginTop:0 }}>Stock por Unidad</h4>
      <div style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap:8, marginBottom:12 }}>
        <KPICard title="Stock Mueblería" value={`${m.stock}`} color="#1976d2" subtitle={`Valor: ${formatCurrency(m.value)}`} />
        <KPICard title="Stock Vidriería" value={`${v.stock}`} color="#00897b" subtitle={`Valor: ${formatCurrency(v.value)}`} />
        <KPICard title="Sin especificar" value={`${s.stock}`} color="#9e9e9e" subtitle={`Valor: ${formatCurrency(s.value)}`} />
      </div>
      <Doughnut data={{ labels: ['Mueblería','Vidriería','Sin especificar'], datasets: [{ data: [m.stock, v.stock, s.stock], backgroundColor: ['#6a1b9a','#00897b','#9e9e9e'] }] }} />
    </div>
  )
}
