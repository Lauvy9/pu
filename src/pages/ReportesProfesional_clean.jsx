import React, { useMemo, useState } from 'react'
import '../pages/reportesProfesional.css'
import { useStore } from '../context/StoreContext'
import { formatCurrency } from '../utils/helpers'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  calculateTotalSales,
  calculateTotalExpenses,
  calculateNetProfit,
  calculatePendingDebt,
  getTopProductsBySales,
  getExpensesByCategory,
  getLowStockProducts,
  getProfitByBusinessUnit,
  getSalesByDay,
  getSalesVsExpenses,
  calculateSalesByBusinessUnit,
  getOperationalExpensesByBusinessUnit,
  getNetProfitByBusinessUnit,
  getSalesVsExpensesByUnit,
  getTopProductsByUnit,
  getExpenseTransactionsByUnit,
} from '../utils/reportesAnalyticsHelpers'
import UltimasTransacciones from '../components/UltimasTransacciones'
import Historial from '../components/Historial'
import FormGastoOperativo from '../components/Gastos/FormGastoOperativo'

/**
 * KPI Cards Component
 */
function KPISection({ totalSales, totalExpenses, netProfit, pendingDebt }) {
  return (
    <section className="panel-dashboard">
      <div className="grid-metrics">
        <div className="card metric">
          <div className="metric-title">Ventas Totales</div>
          <div className="metric-value">{formatCurrency(totalSales || 0)}</div>
        </div>
        <div className="card metric">
          <div className="metric-title">Gastos Totales</div>
          <div className="metric-value">{formatCurrency(totalExpenses || 0)}</div>
        </div>
        <div className="card metric">
          <div className="metric-title">Ganancia Neta</div>
          <div className="metric-value" style={{ color: netProfit >= 0 ? '#2e7d32' : '#d32f2f' }}>
            {formatCurrency(netProfit || 0)}
          </div>
        </div>
        <div className="card metric">
          <div className="metric-title">Deuda Pendiente</div>
          <div className="metric-value" style={{ color: pendingDebt > 0 ? '#f57c00' : '#2e7d32' }}>
            {formatCurrency(pendingDebt || 0)}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Sección de análisis por unidad de negocio
 */
function BusinessUnitSection({ title, unit, transactions, products, dateRange }) {
  const unitSales = useMemo(
    () => calculateSalesByBusinessUnit(transactions, dateRange, unit),
    [transactions, dateRange, unit]
  )

  const unitExpenses = useMemo(
    () => getOperationalExpensesByBusinessUnit(transactions, dateRange, unit),
    [transactions, dateRange, unit]
  )

  const unitProfit = useMemo(
    () => getNetProfitByBusinessUnit(transactions, dateRange, unit),
    [transactions, dateRange, unit]
  )

  const unitSalesVsExpenses = useMemo(
    () => getSalesVsExpensesByUnit(transactions, dateRange, unit),
    [transactions, dateRange, unit]
  )

  const unitTopProducts = useMemo(
    () => getTopProductsByUnit(transactions, products, 5, dateRange, unit),
    [transactions, products, dateRange, unit]
  )

  const unitExpenseTransactions = useMemo(
    () => getExpenseTransactionsByUnit(transactions, dateRange, unit),
    [transactions, dateRange, unit]
  )

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '2px solid #ddd' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{title === 'vidrieria' ? '🔍' : '🪑'}</span>
        {title === 'vidrieria' ? 'Vidriería' : 'Mueblería'}
      </h2>

      {/* KPIs por unidad */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ textAlign: 'center', padding: 14 }}>
          <div className="metric-title">Ventas</div>
          <div className="metric-value" style={{ color: '#2e7d32' }}>
            {formatCurrency(unitSales)}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 14 }}>
          <div className="metric-title">Gastos</div>
          <div className="metric-value" style={{ color: '#d32f2f' }}>
            {formatCurrency(unitExpenses)}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 14 }}>
          <div className="metric-title">Ganancia Neta</div>
          <div className="metric-value" style={{ color: unitProfit >= 0 ? '#2e7d32' : '#d32f2f' }}>
            {formatCurrency(unitProfit)}
          </div>
        </div>
      </div>

      {/* Gráficos por unidad */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {/* Ventas vs Gastos */}
        <div className="card" style={{ padding: 14 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Ventas vs Gastos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={unitSalesVsExpenses} margin={{ top: 8, right: 16, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="value" fill="#1976d2">
                {unitSalesVsExpenses.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Productos */}
        <div className="card" style={{ padding: 14 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Top 5 Productos</h3>
          {unitTopProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={unitTopProducts}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 100, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={90} />
                <Tooltip formatter={(value) => `${value} unid.`} />
                <Bar dataKey="cantidad" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
              No hay datos
            </div>
          )}
        </div>
      </div>

      {/* Detalle de gastos */}
      {unitExpenseTransactions.length > 0 && (
        <div className="card" style={{ padding: 14, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Gastos Registrados</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: 8, fontWeight: 700 }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: 8, fontWeight: 700 }}>Concepto</th>
                <th style={{ textAlign: 'left', padding: 8, fontWeight: 700 }}>Pagado a</th>
                <th style={{ textAlign: 'right', padding: 8, fontWeight: 700 }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {unitExpenseTransactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #f1f3f6' }}>
                  <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                    {new Date(tx.fecha).toLocaleDateString()}
                  </td>
                  <td style={{ padding: 8 }}>
                    <div style={{ fontWeight: 500 }}>{tx.concepto}</div>
                    {tx.observacion && (
                      <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                        {tx.observacion}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>{tx.pagadoA}</td>
                  <td style={{ padding: 8, textAlign: 'right', fontWeight: 700, color: '#d32f2f' }}>
                    -{formatCurrency(tx.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/**
 * Main Reportes Component
 */
export default function ReportesProfesional(){
  const { sales = [], transactions = [], products = [] } = useStore()
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  })

  // Cálculos de reportes (con filtro de fechas)
  const totalSales = useMemo(
    () => calculateTotalSales(transactions, dateRange),
    [transactions, dateRange]
  )

  const totalExpenses = useMemo(
    () => calculateTotalExpenses(transactions, dateRange),
    [transactions, dateRange]
  )

  const netProfit = useMemo(
    () => calculateNetProfit(transactions, dateRange),
    [transactions, dateRange]
  )

  const pendingDebt = useMemo(
    () => calculatePendingDebt(sales, dateRange),
    [sales, dateRange]
  )

  // Gráficos
  const topProducts = useMemo(
    () => getTopProductsBySales(transactions, products, 5, dateRange),
    [transactions, products, dateRange]
  )

  const expensesByCategory = useMemo(
    () => getExpensesByCategory(transactions, dateRange),
    [transactions, dateRange]
  )

  const lowStockItems = useMemo(
    () => getLowStockProducts(products, 5),
    [products]
  )

  const profitByUnit = useMemo(
    () => getProfitByBusinessUnit(transactions, dateRange),
    [transactions, dateRange]
  )

  const salesByDay = useMemo(
    () => getSalesByDay(transactions, dateRange),
    [transactions, dateRange]
  )

  const salesVsExpenses = useMemo(
    () => getSalesVsExpenses(transactions, dateRange),
    [transactions, dateRange]
  )


  // Helpers para rango rápido
  const setPeriod = (from, to) => {
    setDateRange({
      start: from.toISOString().slice(0, 10),
      end: to.toISOString().slice(0, 10),
    })
  }

  const quickRange = (period) => {
    const now = new Date()
    now.setHours(23, 59, 59, 999)

    let start = new Date(now)
    start.setHours(0, 0, 0, 0)

    if (period === 'Semana') {
      start = new Date(now)
      start.setDate(now.getDate() - 7)
      start.setHours(0, 0, 0, 0)
    } else if (period === 'Mes') {
      start = new Date(now)
      start.setMonth(now.getMonth() - 1)
      start.setHours(0, 0, 0, 0)
    } else if (period === 'Trimestre') {
      start = new Date(now)
      start.setMonth(now.getMonth() - 3)
      start.setHours(0, 0, 0, 0)
    }

    setPeriod(start, now)
  }

  return (
    <div className="reportes-profesional">
      <header className="header-corporativo">
        <div className="header-contenido">
          <div className="branding">
            <h1 className="titulo-principal">Dashboard de Reportes</h1>
            <p className="subtitulo">Análisis financiero y métricas de negocio</p>
          </div>
        </div>
      </header>

      <div className="layout-corporativo">
        <main className="contenido-principal">
          {/* 📝 FORMULARIO DE GASTOS OPERATIVOS */}
          <section className="card" style={{ marginBottom: 20, backgroundColor: '#fff8e1' }}>
            <FormGastoOperativo />
          </section>

          {/* 1️⃣ FILTRO DE FECHAS (Superior) */}
          <section className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0 }}>Período de análisis</h3>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>
                    Desde
                  </label>
                  <input
                    type="date"
                    className="input-fecha"
                    value={dateRange.start}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>
                    Hasta
                  </label>
                  <input
                    type="date"
                    className="input-fecha"
                    value={dateRange.end}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="filtro-rapido"
                    onClick={() => quickRange('Hoy')}
                    style={{ padding: '8px 12px', cursor: 'pointer' }}
                  >
                    Hoy
                  </button>
                  <button
                    className="filtro-rapido"
                    onClick={() => quickRange('Semana')}
                    style={{ padding: '8px 12px', cursor: 'pointer' }}
                  >
                    Semana
                  </button>
                  <button
                    className="filtro-rapido"
                    onClick={() => quickRange('Mes')}
                    style={{ padding: '8px 12px', cursor: 'pointer' }}
                  >
                    Mes
                  </button>
                  <button
                    className="filtro-rapido"
                    onClick={() => quickRange('Trimestre')}
                    style={{ padding: '8px 12px', cursor: 'pointer' }}
                  >
                    Trimestre
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 2️⃣ KPIs */}
          <KPISection totalSales={totalSales} totalExpenses={totalExpenses} netProfit={netProfit} pendingDebt={pendingDebt} />

          {/* 3️⃣ GRÁFICOS ANALÍTICOS */}
          <section className="card" style={{ marginTop: 20 }}>
            <h3 className="panel-title">Gráficos Analíticos</h3>

            {/* GRÁFICO 1: Ventas vs Gastos */}
            <div style={{ marginBottom: 24 }}>
              <h4>Ventas vs Gastos</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={salesVsExpenses} margin={{ top: 8, right: 16, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#1976d2">
                    {salesVsExpenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* GRÁFICO 2: Ganancia por Negocio */}
            <div style={{ marginBottom: 24 }}>
              <h4>Ganancia por Unidad de Negocio</h4>
              {profitByUnit.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={profitByUnit}
                    margin={{ top: 8, right: 16, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="ganancia" fill="#2e7d32" name="Ganancia" />
                    <Bar dataKey="ventas" fill="#1976d2" name="Ventas" />
                    <Bar dataKey="gastos" fill="#d32f2f" name="Gastos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                  No hay datos en el período seleccionado
                </div>
              )}
            </div>

            {/* GRÁFICO 3: Top 5 Productos Vendidos */}
            <div style={{ marginBottom: 24 }}>
              <h4>Top 5 Productos Vendidos</h4>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 120, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={110} />
                    <Tooltip formatter={(value) => `${value} unid.`} />
                    <Bar dataKey="cantidad" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                  No hay ventas en el período seleccionado
                </div>
              )}
            </div>

            {/* GRÁFICO 4: Stock Crítico (Top 5) */}
            <div style={{ marginBottom: 24 }}>
              <h4>Top 5 Productos con Stock Crítico</h4>
              {lowStockItems.length > 0 ? (
                <div style={{ padding: 20 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #ddd' }}>
                        <th style={{ textAlign: 'left', padding: 12 }}>Producto</th>
                        <th style={{ textAlign: 'center', padding: 12 }}>Stock Actual</th>
                        <th style={{ textAlign: 'center', padding: 12 }}>Stock Mínimo</th>
                        <th style={{ textAlign: 'center', padding: 12 }}>Unidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: 12 }}>{item.name}</td>
                          <td
                            style={{
                              textAlign: 'center',
                              padding: 12,
                              color: item.stock <= 0 ? '#d32f2f' : '#f57c00',
                              fontWeight: 600,
                            }}
                          >
                            {item.stock}
                          </td>
                          <td style={{ textAlign: 'center', padding: 12 }}>{item.minimo}</td>
                          <td style={{ textAlign: 'center', padding: 12, fontSize: 12, color: '#666' }}>
                            {item.businessUnit || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                  No hay productos con stock crítico
                </div>
              )}
            </div>

            {/* GRÁFICO 5: Distribución de Gastos (Torta) */}
            <div style={{ marginBottom: 24 }}>
              <h4>Distribución de Gastos</h4>
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                    <Pie
                      data={expensesByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      paddingAngle={2}
                    >
                      {expensesByCategory.map((entry, index) => {
                        const colors = ['#d32f2f', '#f57c00', '#2196f3', '#4caf50', '#9c27b0', '#ff9800'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                  No hay gastos en el período seleccionado
                </div>
              )}
            </div>

            {/* GRÁFICO ADICIONAL: Ingresos por Día */}
            <div style={{ marginBottom: 24 }}>
              <h4>Ingresos Diarios</h4>
              {salesByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={salesByDay} margin={{ top: 8, right: 16, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="total" stroke="#1976d2" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                  No hay datos de ingresos en el período
                </div>
              )}
            </div>
          </section>

          {/* 🏢 ANÁLISIS POR UNIDAD DE NEGOCIO */}
          <BusinessUnitSection title="vidrieria" unit="vidrieria" transactions={transactions} products={products} dateRange={dateRange} />
          <BusinessUnitSection title="muebleria" unit="muebleria" transactions={transactions} products={products} dateRange={dateRange} />

          {/* 4️⃣ HISTORIAL (SIN FILTRO DE FECHAS) */}
          <section style={{ marginTop: 20 }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Últimas Transacciones</h3>
            <UltimasTransacciones limit={10} />
          </section>

          {/* 5️⃣ HISTORIAL COMPLETO (SIN FILTRO DE FECHAS) */}
          <section style={{ marginTop: 20 }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Historial Completo</h3>
            <Historial />
          </section>
        </main>
      </div>
    </div>
  )
}
