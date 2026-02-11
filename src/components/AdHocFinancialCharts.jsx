import React from 'react'
import FinancialSummaryPieChart from './FinancialSummaryPieChart'

function formatCOP(v){ try{ return `${Number(v||0).toLocaleString('es-CO')} COP` }catch(e){ return v }
}

export default function AdHocFinancialCharts({ totalSales=9865100, costoMateriales=392000, gastosOperativos=10000, netProfit=9463100 }){
  const data = { totalSales, costoMateriales, gastosOperativos, netProfit }
  const bars = [
    { key: 'Ventas Totales', value: totalSales, color:'#36A2EB' },
    { key: 'Costo Materiales', value: costoMateriales, color:'#FF6384' },
    { key: 'Gastos Operativos', value: gastosOperativos, color:'#FFCE56' },
    { key: 'Ganancia Neta', value: netProfit, color:'#2ECC71' }
  ]

  const max = Math.max(...bars.map(b=> b.value || 0), 1)

  return (
    <div style={{ display:'grid', gridTemplateColumns: '1fr 420px', gap:12 }}>
      <div className="card">
        <h4 style={{ marginTop:0 }}>Resumen Financiero (manual)</h4>
        <FinancialSummaryPieChart data={data} responsive />
      </div>

      <div className="card">
        <h4 style={{ marginTop:0 }}>Barras: valores</h4>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {bars.map(b=> (
            <div key={b.key} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:140 }}>{b.key}</div>
              <div style={{ flex:1, background:'#f1f1f1', height:18, borderRadius:6, overflow:'hidden' }}>
                <div style={{ width: `${Math.round((b.value || 0) / max * 100)}%`, height:'100%', background:b.color }} />
              </div>
              <div style={{ width:120, textAlign:'right', fontWeight:700 }}>{formatCOP(b.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
