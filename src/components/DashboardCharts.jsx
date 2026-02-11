import React from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Paleta de colores
const COLORS = {
  sales: '#10b981',
  expenses: '#ef4444',
  profit: '#3b82f6',
  secondary1: '#8b5cf6',
  secondary2: '#f59e0b',
  category1: '#06b6d4',
  category2: '#ec4899',
  category3: '#14b8a6'
}

const CHART_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#14b8a6', '#d946ef', '#0ea5e9']

export function KPICard({ title, value, change, trend, icon }) {
  const isPositive = trend === 'up'
  return (
    <div className="kpi-card" style={{
      background: '#fff',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {title}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginTop: '8px' }}>
            {value}
          </div>
          {change && (
            <div style={{ fontSize: '12px', color: isPositive ? '#10b981' : '#ef4444', marginTop: '8px', fontWeight: 600 }}>
              {isPositive ? '↑' : '↓'} {change}
            </div>
          )}
        </div>
        {icon && <div style={{ fontSize: '32px' }}>{icon}</div>}
      </div>
    </div>
  )
}

export function SalesExpenseTrendChart({ data, height = 400 }) {
  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '16px', fontWeight: 700 }}>
        Ventas, Gastos y Ganancias
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 12 }}
            stroke="#cbd5e1"
          />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} stroke="#cbd5e1" />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, '']}
          />
          <Legend wrapperStyle={{ paddingTop: '16px' }} />
          <Line
            type="monotone"
            dataKey="sales"
            stroke={COLORS.sales}
            strokeWidth={2}
            dot={false}
            name="Ventas"
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke={COLORS.expenses}
            strokeWidth={2}
            dot={false}
            name="Gastos"
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke={COLORS.profit}
            strokeWidth={2}
            dot={false}
            name="Ganancia"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryDistributionChart({ data, height = 300, title = 'Ventas por Categoría' }) {
  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '16px', fontWeight: 700 }}>
        {title}
      </h3>
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Sin datos disponibles
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ category, value }) => `${category}: $${Number(value).toFixed(0)}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function BarChartComponent({ data, dataKey = 'value', height = 300, title = 'Gráfico de Barras', xKey = 'name' }) {
  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '16px', fontWeight: 700 }}>
        {title}
      </h3>
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Sin datos disponibles
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey={xKey}
              tick={{ fill: '#64748b', fontSize: 12 }}
              stroke="#cbd5e1"
            />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} stroke="#cbd5e1" />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              formatter={(value) => `$${Number(value).toFixed(2)}`}
            />
            <Bar dataKey={dataKey} fill={COLORS.secondary2} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function TopProductsChart({ data, height = 300 }) {
  const chartData = (data || []).slice(0, 8).map(p => ({
    ...p,
    shortName: p.name && p.name.length > 15 ? p.name.slice(0, 12) + '...' : p.name
  }))

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '16px', fontWeight: 700 }}>
        Top 10 Productos
      </h3>
      {chartData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Sin datos disponibles
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 200, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} stroke="#cbd5e1" />
            <YAxis
              dataKey="shortName"
              type="category"
              tick={{ fill: '#64748b', fontSize: 11 }}
              stroke="#cbd5e1"
              width={190}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              formatter={(value) => `$${Number(value).toFixed(2)}`}
            />
            <Bar dataKey="value" fill={COLORS.secondary1} radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function StatsGrid({ stats = {} }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      <KPICard title="Ventas Totales" value={`$${stats.totalSales || 0}`} icon="💰" />
      <KPICard title="Gastos Totales" value={`$${stats.totalExpenses || 0}`} icon="💸" />
      <KPICard title="Ganancia Neta" value={`$${stats.profit || 0}`} icon="📈" trend="up" change={stats.margin} />
      <KPICard title="Margen de Ganancia" value={stats.margin || '0%'} icon="📊" />
    </div>
  )
}
