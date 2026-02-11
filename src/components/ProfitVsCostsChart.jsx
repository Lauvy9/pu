import React, { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

function groupByPeriod(items, dateKey = 'date', period = 'month'){
  const map = {}
  (items||[]).forEach(it => {
    const d = new Date(it[dateKey] || it.date || it.fecha || null)
    if (isNaN(d)) return
    let key = ''
    if (period === 'month') key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    else key = d.toISOString().slice(0,10)
    map[key] = (map[key] || 0) + (Number(it.total || it.amount || it.value || it.monto || 0) || 0)
  })
  return Object.keys(map).sort().map(k => ({ period: k, value: map[k] }))
}

export default function ProfitVsCostsChart({ sales = [], expenses = [], period = 'month' }){
  const salesSeries = useMemo(()=> groupByPeriod(sales.map(s => ({ date: s.date, total: s.total || s.totalVenta || s.monto || 0 })), 'date', period), [sales, period])
  const expensesSeries = useMemo(()=> groupByPeriod(expenses.map(e => ({ date: e.date || e.fecha, total: e.amount || e.monto || e.value || 0 })), 'date', period), [expenses, period])

  // merge by period
  const map = {}
  salesSeries.forEach(s => { map[s.period] = { period: s.period, sales: s.value } })
  expensesSeries.forEach(e => { map[e.period] = { ...(map[e.period]||{ period: e.period }), expenses: e.value } })
  const merged = Object.keys(map).sort().map(k => ({ period: k, sales: map[k].sales || 0, expenses: map[k].expenses || 0 }))

  return (
    <div className="card" style={{ padding:12 }}>
      <h4>Ganancia neta vs Gastos operativos</h4>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={merged} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sales" name="Ingresos" stroke="#2e7d32" strokeWidth={2} />
            <Line type="monotone" dataKey="expenses" name="Gastos" stroke="#d32f2f" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
