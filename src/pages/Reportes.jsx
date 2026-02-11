import React, { useMemo, useState } from 'react'
import ReportesIntegrados from './ReportesIntegrados'
import ReportesHistory from './ReportesHistory'
// SimpleDashboard and SalesDashboard removed from this view
import { formatCurrency } from '../utils/helpers'
import { useStore } from '../context/StoreContext'
import { calculateFinancialData, calculateIntegratedFinancialData } from '../utils/financeHelpers'
import KPICard from '../components/KPICard'
import TopProductsChart from '../components/TopProductsChart'
import ProfitVsCostsChart from '../components/ProfitVsCostsChart'
import CustomersChart from '../components/CustomersChart'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)
import LowStockList from '../components/LowStockList'
import ReportesPorUnidad from './ReportesPorUnidad'
import '../pages/reportes.css'

const ReportesGenerados = () => {
  const { savedReports = [], actions } = useStore()
  return (
    <div className="card">
      <h3>Reportes Generados</h3>
      {(!savedReports || savedReports.length === 0) ? (
        <div className="small-muted">No hay reportes generados</div>
      ) : (
        <ul>
          {savedReports.map(r => (
            <li key={r.id} style={{ marginBottom:10 }}>
              <strong>{r.id}</strong> — {r.date ? new Date(r.date).toLocaleString() : ''} — {r.type || ''}
              <div style={{ marginTop:6 }}>
                <small className="small-muted">{r.summary ? `Ventas: ${r.summary.sales||0} • Gastos: ${r.summary.expenses||0}` : ''}</small>
              </div>
              <div style={{ marginTop:6, display:'flex', gap:8 }}>
                <button className="btn" onClick={()=>{ const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${r.id||'report'}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url) }}>Descargar JSON</button>
                {/* PDF links removed from reports list */}
                <button className="btn" onClick={()=>{ if (actions && actions.deleteReport) actions.deleteReport(r.id) }}>Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Reportes(){
  const store = useStore()
  console.log('=== REPORTES STORE DEBUG ===')
  console.log('store:', store)
  console.log('store.sales:', store.sales)
  console.log('store.sales type:', typeof store.sales)
  console.log('store.sales isArray:', Array.isArray(store.sales))
  
  const { sales = [], expenses = [], products = [], bankAccounts = [], company = {}, fiados = [] } = store

  // Transacciones unificadas (si existen)
  const { transactions = [] } = store
  const totalVentasTrans = (transactions || []).filter(t => t.tipo === 'venta').reduce((s,t) => s + Number(t.total || 0), 0)
  const totalGastosMaterialesTrans = (transactions || []).filter(t => t.tipo === 'compra' || t.tipo === 'reposicion').reduce((s,t) => s + Number(t.total || 0), 0)
  const netProfitTrans = totalVentasTrans - totalGastosMaterialesTrans
  console.log('Reportes - sales después desestructurar:', sales.length, 'expenses:', expenses.length, sales)
  console.log('=== FIN REPORTES DEBUG ===')
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'reportes' | 'historial'
  // Añadimos nueva pestaña 'porunidad' para la vista dedicada por unidad
  // 'porunidad' will render ReportesPorUnidad
  const [dateRange, setDateRange] = useState({ start: new Date(new Date().setDate(new Date().getDate()-30)).toISOString().slice(0,10), end: new Date().toISOString().slice(0,10) })

  // Calcular datos del dashboard usando la utilidad ya existente
  // Preferimos usar el selector central expuesto por el StoreContext (`getDashboardData`) si está disponible.
  const dashboardData = useMemo(()=>{
    try{
      if (store && typeof store.getDashboardData === 'function') return store.getDashboardData(dateRange) || null
      return calculateFinancialData(dateRange, sales || [], expenses || [], [])
    }catch(e){ console.error('dashboardData calc failed', e); return null }
  }, [sales, expenses, dateRange, store])

  const integratedData = useMemo(()=>{
    try{ return calculateIntegratedFinancialData({ sales, expenses, products, fiados, dateRange }) }catch(e){ console.error('integrated calc failed', e); return null }
  }, [sales, expenses, products, fiados, dateRange])

  // Constantes seguras por unidad de negocio (usar SOLO estas en JSX)
  const totalsByUnit = dashboardData?.totalsByUnit ?? { muebleria: 0, vidrieria: 0 }
  const expensesByUnit = dashboardData?.expensesByUnit ?? { muebleria: 0, vidrieria: 0 }
  const netProfitByUnit = dashboardData?.netProfitByUnit ?? { muebleria: 0, vidrieria: 0 }

  // Debug temporal: confirmar que dashboardData llega con las claves por unidad
  try{
    console.log('REPORTES - totalsByUnit:', totalsByUnit)
    console.log('REPORTES - expensesByUnit:', expensesByUnit)
    console.log('REPORTES - netProfitByUnit:', netProfitByUnit)
  }catch(e){ /* ignore */ }

  // Helper: normaliza el valor cuando la estructura puede ser { totalSales: n } o número directo
  const unitValue = (unitObj, key) => {
    try{
      const raw = unitObj?.[key]
      if (raw == null) return 0
      if (typeof raw === 'number') return raw
      if (typeof raw === 'object') return Number(raw.totalSales ?? raw.total ?? raw.netProfit ?? raw.value ?? 0) || 0
      return Number(raw) || 0
    }catch(e){ return 0 }
  }

  // Obtener una métrica específica de una unidad (p. ej. 'totalCosts' o 'totalSales')
  const getUnitMetric = (unitGroup, key, metric) => {
    try{
      const raw = unitGroup?.[key]
      if (raw == null) return 0
      if (typeof raw === 'number') return raw
      if (typeof raw === 'object') return Number(raw[metric] ?? raw.totalCosts ?? raw.totalSales ?? raw.total ?? raw.netProfit ?? raw.value ?? 0) || 0
      return Number(raw) || 0
    }catch(e){ return 0 }
  }

  // Constantes seguras para filtered lists (usar en componentes de gráfico)
  const filteredSales = dashboardData?.filteredSales ?? []
  const filteredExpenses = dashboardData?.filteredExpenses ?? []

  // PDF export removed by request

  return (
    <div className="reportes-responsive">
      <div className="reportes-header-responsive">
        <div className="header-main">
          <h1> Reportes Integrados</h1>
          <div style={{ display:'flex', gap:8, alignItems:'center' }} />
        </div>

        <div className="tabs-responsive">
          <button className={`tab-responsive ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={()=>setActiveTab('dashboard')}>
            <span className="tab-icon"></span>
            <span className="tab-label">Dashboard</span>
          </button>
          <button className={`tab-responsive ${activeTab === 'reportes' ? 'active' : ''}`} onClick={()=>setActiveTab('reportes')}>
            <span className="tab-icon"></span>
            <span className="tab-label">Reportes</span>
          </button>
            <button className={`tab-responsive ${activeTab === 'unidad' ? 'active' : ''}`} onClick={()=>setActiveTab('unidad')}>
              <span className="tab-icon"></span>
              <span className="tab-label">Reportes por Unidad</span>
            </button>
          <button className={`tab-responsive ${activeTab === 'historial' ? 'active' : ''}`} onClick={()=>setActiveTab('historial')}>
            <span className="tab-icon"></span>
            <span className="tab-label">Historial</span>
          </button>
        </div>
      </div>

      <div className="filters-responsive">
        <div className="date-filters-responsive">
          <div className="date-input-group">
            <label>Desde</label>
            <input type="date" value={dateRange.start} onChange={(e)=> setDateRange(prev=>({...prev, start: e.target.value}))} className="input-date" />
          </div>
          <div className="date-input-group">
            <label>Hasta</label>
            <input type="date" value={dateRange.end} onChange={(e)=> setDateRange(prev=>({...prev, end: e.target.value}))} className="input-date" />
          </div>
        </div>
        <div className="quick-filters-responsive">
          {['Hoy','Semana','Mes','Trimestre','Año'].map(p=> (
            <button key={p} className="quick-filter-responsive" onClick={()=>{
              const now = new Date()
              let start
              if (p==='Hoy') start = now
              else if (p==='Semana') start = new Date(now.getFullYear(), now.getMonth(), now.getDate()-7)
              else if (p==='Mes') start = new Date(now.getFullYear(), now.getMonth()-1, now.getDate())
              else if (p==='Trimestre') start = new Date(now.getFullYear(), now.getMonth()-3, now.getDate())
              else if (p==='Año') start = new Date(now.getFullYear()-1, now.getMonth(), now.getDate())
              setDateRange({ start: start.toISOString().slice(0,10), end: now.toISOString().slice(0,10) })
            }}>{p}</button>
          ))}
        </div>
      </div>

      <div className="reportes-content-responsive">
        {activeTab === 'dashboard' && (
          <div id="reportes-dashboard">
            {/* Top KPIs */}
            <div style={{ display:'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 12 }}>
              <KPICard title="Ventas totales" value={formatCurrency(dashboardData?.totalSales || 0)} color="#1976d2" subtitle="Período seleccionado" />
              <KPICard title="Costos de materiales" value={formatCurrency(dashboardData?.totalCosts || 0)} color="#f57c00" subtitle="Costo total materiales" />
              <KPICard title="Gastos operativos" value={formatCurrency(dashboardData?.totalExpenses || 0)} color="#d32f2f" subtitle="Gastos del período" />
              <KPICard title="Ganancia neta" value={formatCurrency(dashboardData?.netProfit || 0)} color="#2e7d32" subtitle="Neto después de gastos" />
              <KPICard title="Ganancia Mueblería" value={formatCurrency(unitValue(netProfitByUnit, 'muebleria') || unitValue(netProfitByUnit, 'mobileria'))} color="#6a1b9a" subtitle="Por unidad" />
              <KPICard title="Ganancia Vidriería" value={formatCurrency(unitValue(netProfitByUnit, 'vidrieria'))} color="#00897b" subtitle="Por unidad" />
            </div>

            {/* KPIs por Unidad de Negocio (Vidriería / Mueblería) */}
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ margin: '8px 0' }}>KPIs por Unidad de Negocio</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Vidriería */}
                <div style={{ background: '#fff', padding: 12, borderRadius: 6 }}>
                  <h4 style={{ marginTop: 0 }}>Vidriería</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    <KPICard title="Ventas totales" value={formatCurrency(getUnitMetric(totalsByUnit, 'vidrieria', 'totalSales') ?? 0)} color="#1976d2" subtitle="Vidriería" />
                    <KPICard title="Costos de materiales" value={formatCurrency(getUnitMetric(totalsByUnit, 'vidrieria', 'totalCosts') ?? 0)} color="#f57c00" subtitle="Costo materiales" />
                    <KPICard title="Gastos operativos" value={formatCurrency(unitValue(expensesByUnit, 'vidrieria') ?? 0)} color="#d32f2f" subtitle="Gastos" />
                    <KPICard title="Ganancia neta" value={formatCurrency(unitValue(netProfitByUnit, 'vidrieria') ?? 0)} color="#2e7d32" subtitle="Neto" />
                  </div>
                </div>

                {/* Mueblería */}
                <div style={{ background: '#fff', padding: 12, borderRadius: 6 }}>
                  <h4 style={{ marginTop: 0 }}>Mueblería</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    <KPICard title="Ventas totales" value={formatCurrency(getUnitMetric(totalsByUnit, 'muebleria', 'totalSales') ?? getUnitMetric(totalsByUnit, 'mobileria', 'totalSales') ?? 0)} color="#1976d2" subtitle="Mueblería" />
                    <KPICard title="Costos de materiales" value={formatCurrency(getUnitMetric(totalsByUnit, 'muebleria', 'totalCosts') ?? getUnitMetric(totalsByUnit, 'mobileria', 'totalCosts') ?? 0)} color="#f57c00" subtitle="Costo materiales" />
                    <KPICard title="Gastos operativos" value={formatCurrency(unitValue(expensesByUnit, 'muebleria') ?? unitValue(expensesByUnit, 'mobileria') ?? 0)} color="#d32f2f" subtitle="Gastos" />
                    <KPICard title="Ganancia neta" value={formatCurrency(unitValue(netProfitByUnit, 'muebleria') ?? unitValue(netProfitByUnit, 'mobileria') ?? 0)} color="#2e7d32" subtitle="Neto" />
                  </div>
                </div>
              </div>
            </div>

            {/* Análisis por Unidad de Negocio */}
            <div style={{ marginTop: 12, marginBottom: 12, padding: 12, background: '#fff', borderRadius: 6 }}>
              <h3 style={{ marginTop: 0 }}>Análisis por Unidad de Negocio</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' }}>
                {
                  (() => {
                    // Valores defensivos usando las constantes seguras (totalsByUnit, expensesByUnit, netProfitByUnit)
                    const ingresosMuebleria = unitValue(totalsByUnit, 'muebleria') || unitValue(totalsByUnit, 'mobileria')
                    const ingresosVidrieria = unitValue(totalsByUnit, 'vidrieria')

                    const gastosMuebleria = unitValue(expensesByUnit, 'muebleria') || unitValue(expensesByUnit, 'mobileria')
                    const gastosVidrieria = unitValue(expensesByUnit, 'vidrieria')

                    const gananciaMuebleria = unitValue(netProfitByUnit, 'muebleria') || unitValue(netProfitByUnit, 'mobileria')
                    const gananciaVidrieria = unitValue(netProfitByUnit, 'vidrieria')

                    return (
                      <>
                        <div style={{ flex: '1 1 300px', minWidth: 260, background: '#fff', padding: 12, borderRadius: 6 }}>
                          <h4 style={{ marginTop: 0 }}>Ingresos por Unidad de Negocio</h4>
                          <Doughnut data={{ labels: ['Mueblería','Vidriería'], datasets: [{ data: [ingresosMuebleria ?? 0, ingresosVidrieria ?? 0], backgroundColor: ['#6a1b9a','#00897b'] }] }} />
                        </div>
                        <div style={{ flex: '1 1 300px', minWidth: 260, background: '#fff', padding: 12, borderRadius: 6 }}>
                          <h4 style={{ marginTop: 0 }}>Gastos por Unidad de Negocio</h4>
                          <Doughnut data={{ labels: ['Mueblería','Vidriería'], datasets: [{ data: [gastosMuebleria ?? 0, gastosVidrieria ?? 0], backgroundColor: ['#ad1457','#00695c'] }] }} />
                        </div>
                        <div style={{ flex: '1 1 300px', minWidth: 260, background: '#fff', padding: 12, borderRadius: 6 }}>
                          <h4 style={{ marginTop: 0 }}>Ganancia Neta por Unidad de Negocio</h4>
                          <Doughnut data={{ labels: ['Mueblería','Vidriería'], datasets: [{ data: [gananciaMuebleria ?? 0, gananciaVidrieria ?? 0], backgroundColor: ['#6a1b9a','#00897b'] }] }} />
                        </div>
                      </>
                    )
                  })()
                }
              </div>
            </div>
            {/* Ingresos / Gastos por unidad */}
            <div style={{ display:'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
              <KPICard title="Ingresos Mueblería" value={formatCurrency(unitValue(totalsByUnit, 'muebleria') || unitValue(totalsByUnit, 'mobileria'))} color="#1976d2" subtitle="Ventas por unidad" />
              <KPICard title="Gastos Mueblería" value={formatCurrency(unitValue(expensesByUnit, 'muebleria') || unitValue(expensesByUnit, 'mobileria'))} color="#ad1457" subtitle="Gastos asignados" />
              <KPICard title="Ingresos Vidriería" value={formatCurrency(unitValue(totalsByUnit, 'vidrieria'))} color="#1976d2" subtitle="Ventas por unidad" />
              <KPICard title="Gastos Vidriería" value={formatCurrency(unitValue(expensesByUnit, 'vidrieria'))} color="#00695c" subtitle="Gastos asignados" />
            </div>

            {/* KPIs basados en transacciones unificadas (si están presentes) */}
            {transactions && transactions.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
                <KPICard title="Ventas (transactions)" value={formatCurrency(totalVentasTrans)} color="#1976d2" subtitle="Suma transacciones tipo venta" />
                <KPICard title="Gastos materiales (transactions)" value={formatCurrency(totalGastosMaterialesTrans)} color="#f57c00" subtitle="Compras + reposiciones" />
                <KPICard title="Ganancia neta (transactions)" value={formatCurrency(netProfitTrans)} color="#2e7d32" subtitle="Ventas - Gastos materiales" />
              </div>
            )}

            {/* Gráficos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                <TopProductsChart data={integratedData?.ventas?.byProduct || []} />
              </div>
              <div>
                <ProfitVsCostsChart sales={filteredSales} expenses={filteredExpenses} period="month" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <CustomersChart sales={filteredSales} period="month" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, background: '#fff', padding: 12, borderRadius: 6 }}>
                  <h4>Ingresos por Unidad</h4>
                  <Doughnut data={{ labels: ['Mueblería','Vidriería','Sin especificar'], datasets: [{ data: [unitValue(totalsByUnit, 'muebleria') || unitValue(totalsByUnit, 'mobileria'), unitValue(totalsByUnit, 'vidrieria'), unitValue(totalsByUnit, 'sin_especificar')], backgroundColor: ['#6a1b9a','#00897b','#9e9e9e'] }] }} />
                </div>
                <div style={{ flex: 1, background: '#fff', padding: 12, borderRadius: 6 }}>
                  <h4>Gastos por Unidad</h4>
                  <Doughnut data={{ labels: ['Mueblería','Vidriería','Sin especificar'], datasets: [{ data: [unitValue(expensesByUnit, 'muebleria') || unitValue(expensesByUnit, 'mobileria'), unitValue(expensesByUnit, 'vidrieria'), unitValue(expensesByUnit, 'sin_especificar')], backgroundColor: ['#ad1457','#00695c','#9e9e9e'] }] }} />
                </div>
                <div style={{ flex: 1, background: '#fff', padding: 12, borderRadius: 6 }}>
                  <h4>Ganancia por Unidad</h4>
                  <Doughnut data={{ labels: ['Mueblería','Vidriería'], datasets: [{ data: [unitValue(netProfitByUnit, 'muebleria') || unitValue(netProfitByUnit, 'mobileria'), unitValue(netProfitByUnit, 'vidrieria')], backgroundColor: ['#6a1b9a','#00897b'] }] }} />
                </div>
              </div>
            </div>

            {/* Stock bajo */}
            <div style={{ marginTop: 16 }}>
              <LowStockList products={products} limit={5} />
            </div>
          </div>
        )}
        {activeTab === 'reportes' && <ReportesGenerados />}
        {activeTab === 'unidad' && (
          // Renderizamos la nueva vista que muestra el análisis por unidad
          <ReportesPorUnidad dateRange={dateRange} />
        )}
        {activeTab === 'historial' && <ReportesHistory />}
      </div>
      {/* BusinessChatBot eliminado (reemplazado por LauraAssistant global) */}
    </div>
  )
}
