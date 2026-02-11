import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function TopProductsChart({ data = [], top = 8 }){
  const sorted = (data || []).slice().sort((a,b)=> (b.qty||0) - (a.qty||0)).slice(0, top)
  const chartData = sorted.map(d => ({ name: d.name || d.id, qty: d.qty || 0 }))
  return (
    <div className="card" style={{ padding: 12 }}>
      <h4>Productos más vendidos</h4>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={160} />
            <Tooltip />
            <Bar dataKey="qty" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
