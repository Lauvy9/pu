import React from 'react'
import { aggregateSeries } from '../utils/financeHelpers'

// Gráficos nativos CSS: torta con conic-gradient y barras con divs
export default function FinancialCharts({ data, granularity = 'day', darkMode = false }){
  const { totalSales = 0, cogs = 0, grossProfit = 0, expensesTotal = 0, netProfit = 0, byDay=[] } = data || {}
  // prefer new field names for vidriería/mueblería
  const costoMateriales = data && (data.costoMateriales || data.cogs || 0)
  const gastosOperativos = data && (data.gastosOperativos || data.expensesTotal || 0)
  const gananciaNeta = data && (data.gananciaNeta || data.netProfit || 0)
  const series = aggregateSeries(byDay, granularity)

  // Pie percentages
  const pieValues = [Number(totalSales)||0, Number(gastosOperativos||expensesTotal)||0]
  const totalPie = pieValues.reduce((s,v)=>s+v,0) || 1
  const piePerc = pieValues.map(v => Math.round((v/totalPie)*100))

  // Bar series
  const labels = series.map(d => d.date)
  const values = series.map(d => Number(d.value)||0)
  const maxValue = Math.max(...values, 1)

  const textColor = darkMode ? '#fff' : '#000'

  return (
    <div style={{ display:'grid', gap:12 }}>
      <div className="card" style={{ padding:12 }}>
        <h4 style={{ marginTop:0, color: textColor }}>Ingresos vs Gastos</h4>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ width:160, height:160, borderRadius:160, background: `conic-gradient(#4caf50 0 ${piePerc[0]}%, #e53935 ${piePerc[0]}% 100%)` }} title={`Ventas: ${pieValues[0]} • Gastos: ${pieValues[1]}`}></div>
          <div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}><span style={{ display:'inline-block', width:12, height:12, background:'#4caf50' }}></span> Ventas: {piePerc[0]}% ({pieValues[0]})</div>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:6 }}><span style={{ display:'inline-block', width:12, height:12, background:'#e53935' }}></span> Gastos Operativos: {piePerc[1]}% ({pieValues[1]})</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding:12 }}>
        <h4 style={{ marginTop:0, color: textColor }}>Evolución ({granularity})</h4>
        {values.length === 0 ? (
          <div className="small-muted">No hay datos para este periodo</div>
        ) : (
          <div style={{ display:'flex', gap:8, alignItems:'end', height:160 }}>
            {values.map((v,i)=> (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
                <div title={`${labels[i]}: ${v}`} style={{ width:'80%', background:'#60a5fa', height: `${Math.round((v/maxValue)*100)}%`, transition:'height .3s' }}></div>
                <div style={{ fontSize:11, marginTop:6 }}>{labels[i]}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
