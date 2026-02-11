import React from 'react'
import { Doughnut } from 'react-chartjs-2'

export default function UnitPaymentMethods({ unit, data = {} }){
  // data: { metodo: { count, amount } }
  const labels = Object.keys(data || {})
  const counts = labels.map(l => data[l].count || 0)
  const amounts = labels.map(l => data[l].amount || 0)
  return (
    <div style={{ background:'#fff', padding:12, borderRadius:6 }}>
      <h4 style={{ marginTop:0 }}>{unit === 'muebleria' ? 'Mueblería' : 'Vidriería'} - Métodos de pago</h4>
      {labels.length === 0 ? <p className="small">Sin datos</p> : (
        <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:8 }}>
          <div>
            <Doughnut data={{ labels, datasets: [{ data: counts, backgroundColor: ['#1976d2','#00897b','#ffb300','#9e9e9e'] }] }} />
          </div>
          <div>
            <h5 style={{ marginTop:0 }}>Montos</h5>
            <ul style={{ margin:0, paddingLeft:16 }}>
              {labels.map(l => (
                <li key={l}>{l}: {data[l].count || 0} — ${Number((data[l].amount || 0)).toFixed(2)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
