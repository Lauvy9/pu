import React from 'react'
import { Bar } from 'react-chartjs-2'

export default function UnitTopProducts({ title, items = [] }){
  const labels = items.map(i => i.name)
  const qtys = items.map(i => i.qty)
  return (
    <div style={{ background:'#fff', padding:12, borderRadius:6 }}>
      <h4 style={{ marginTop:0 }}>{title}</h4>
      {items.length === 0 ? <p className="small">Sin datos</p> : (
        <Bar data={{ labels, datasets: [{ label: 'Cantidad', data: qtys, backgroundColor: '#1976d2' }] }} />
      )}
    </div>
  )
}
