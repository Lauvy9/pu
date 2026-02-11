import React, { useMemo } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function CustomersChart({ sales = [], period = 'month' }){
  const series = useMemo(()=>{
    const map = {}
    (sales||[]).forEach(s => {
      const d = new Date(s.date || s.fecha || null)
      if (isNaN(d)) return
      let key = ''
      if (period === 'month') key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      else key = d.toISOString().slice(0,10)
      const cid = s.customer && (s.customer.name || s.customer.phone) ? (s.customer.name || s.customer.phone) : (s.clienteFiado || s.clientId || s.customerId || s.customer)
      if (!map[key]) map[key] = new Set()
      map[key].add(cid || ('guest_' + (s.id||Math.random())))
    })
    return Object.keys(map).sort().map(k => ({ period: k, distinctClients: (map[k] && map[k].size) || 0 }))
  }, [sales, period])

  return (
    <div className="card" style={{ padding:12 }}>
      <h4>Entradas de clientes (clientes únicos)</h4>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <AreaChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="distinctClients" fill="#42a5f5" stroke="#1976d2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
