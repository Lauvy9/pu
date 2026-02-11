import React, { useState, useEffect, useMemo } from 'react'
import MetricCard from '../components/MetricCard'
import ProductSalesPieChart from '../components/ProductSalesPieChart'
import FinancialSummaryPieChart from '../components/FinancialSummaryPieChart'
import AdHocFinancialCharts from '../components/AdHocFinancialCharts'
import SalesByHourBarChart from '../components/SalesByHourBarChart'
import MixedPerformanceChart from '../components/MixedPerformanceChart'
import ReportesHistory from './ReportesHistory'
import { useStore } from '../context/StoreContext'
import { computeFinancials, calculateFinancialData } from '../utils/financeHelpers'
import { buildDailySnapshot } from '../utils/reportHelpers'
import { formatCurrency } from '../utils/helpers'

export default function ReportesIntegrados({ externalRange }){
  const { sales, expenses = [], entries = [], actions } = useStore()
  const [viewMode, setViewMode] = useState('dashboard')
  const [financials, setFinancials] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAdHoc, setShowAdHoc] = useState(false)
  const [sampleSales, setSampleSales] = useState(null)

  // Ensure we always work with an array for sales (sampleSales may be null, sales may be 0)
  const effectiveSales = Array.isArray(sampleSales) ? sampleSales : (Array.isArray(sales) ? sales : [])

  // derive effective range: if parent provides externalRange (start/end YYYY-MM-DD), use it
  const effectiveRange = useMemo(()=>{
    if (externalRange && externalRange.start && externalRange.end){
      return { from: new Date(externalRange.start + 'T00:00:00'), to: new Date(externalRange.end + 'T23:59:59') }
    }
    // fallback default 30 days
    return { from: new Date(new Date().setDate(new Date().getDate()-30)), to: new Date() }
  }, [externalRange])

  useEffect(()=>{ loadIntegratedData() }, [effectiveRange, sales, expenses])

  // Si no hay ventas en el store ni sampleSales cargadas, cargar datos de ejemplo automáticamente
  useEffect(()=>{
    try{
      const localSales = JSON.parse(localStorage.getItem('vid_sales') || '[]')
      if ((!Array.isArray(sales) || sales.length === 0) && !Array.isArray(sampleSales) && (!localSales || localSales.length === 0)){
        import('../utils/sampleData').then(m=>{
          const s = m.generateSampleSales({ days:7, avgPerDay:40 })
          setSampleSales(s)
          console.info('Datos de ejemplo cargados automáticamente para visualización de gráficos')
        }).catch(e=> console.warn('No se pudo cargar datos de ejemplo automáticamente', e))
      }
    }catch(e){ /* ignore */ }
  }, [sales, sampleSales])

  function loadIntegratedData(){
    setLoading(true); setError(null)
    try{
      const res = computeFinancials(sales || [], expenses || [], effectiveRange.from, effectiveRange.to)
      setFinancials(res)
    }catch(e){ setError(e); setFinancials(null) }
    finally{ setLoading(false) }
  }

  async function generarYGuardarReporte(){
    try{
      const purchases = entries || []
      const clients = []
      const { snapshot, summary } = buildDailySnapshot({ date: effectiveRange.from, sales: sales || [], expenses: expenses || [], purchases, clients })
      if (actions && typeof actions.saveReport === 'function'){
        const saved = actions.saveReport({ type: 'manual', date: snapshot.date, data: snapshot, summary })
        alert('Reporte guardado: ' + (saved && saved.id))
      } else {
        alert('Reporte generado (no se encontró acción saveReport).')
      }
    }catch(e){ console.error(e); alert('Error generando reporte: '+ String(e)) }
  }

  async function exportCSV(){
    try{
      const headers = ['periodo','ventas','costoMateriales','gastosOperativos','gananciaNeta']
      const row = [
        `${effectiveRange.from.toISOString().slice(0,10)} - ${effectiveRange.to.toISOString().slice(0,10)}`,
        String(financials?.totalSales || 0),
        String(financials?.costoMateriales || financials?.cogs || 0),
        String(financials?.gastosOperativos || financials?.expensesTotal || 0),
        String(financials?.netProfit || financials?.gananciaNeta || 0)
      ]
      const escapeCell = v => `"${String(v).replace(/"/g,'""')}"`
      const csv = headers.map(escapeCell).join(',') + '\n' + row.map(escapeCell).join(',')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'reporte-integrado.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    }catch(e){ console.error('exportCSV error', e); alert('Error exportando CSV') }
  }

  // Si no hay ventas en el rango, usar datos de prueba automáticamente
  const displaySales = salesInRange.length > 0 ? salesInRange : (sampleSales || [])

  return (
    <div className="reportes-integrados" style={{ display:'grid', gridTemplateColumns: '320px 1fr', gap:12 }}>
      <div className="card" style={{ padding:12 }}>
        <h3>Reportes Integrados</h3>
        <div style={{ marginTop:10 }}>
          <label style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input type="radio" checked={viewMode==='dashboard'} onChange={()=>setViewMode('dashboard')} /> Dashboard
          </label>
          <label style={{ display:'flex', gap:8, alignItems:'center', marginTop:6 }}>
            <input type="radio" checked={viewMode==='historial'} onChange={()=>setViewMode('historial')} /> Historial
          </label>
        </div>
        <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="btn" onClick={exportCSV}>Exportar CSV</button>
          <button className="btn" onClick={generarYGuardarReporte}>Generar y Guardar Reporte</button>
        </div>
      </div>

      <div>
        {viewMode === 'dashboard' ? (
          <div>
            <div className="metrics-row">
              {loading ? <div className="card" style={{ padding:12 }}>Cargando métricas...</div> : (
                <>
                  <MetricCard title="Ventas" value={formatCurrency((displaySales).reduce((s,x)=> s + Number(x.total||0),0) || financials?.totalSales || 0)} />
                  <MetricCard title="Costo de Materiales Vendidos" value={formatCurrency(financials?.costoMateriales || financials?.cogs || 0)} />
                  <MetricCard title="Gastos Operativos" value={formatCurrency(financials?.gastosOperativos || financials?.expensesTotal || 0)} />
                  <MetricCard title="Ganancia Neta" value={formatCurrency(financials?.netProfit || financials?.gananciaNeta || 0)} />
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button className="btn" onClick={()=> setShowAdHoc(s => !s)}>{showAdHoc ? 'Ocultar gráficos manuales' : 'Mostrar gráficos manuales'}</button>
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop:12, display:'grid', gridTemplateColumns: '1fr 1fr', gap:12 }}>
              <div className="card" style={{ minHeight: 400 }}>
                <h4 style={{ marginTop:0 }}>Productos más vendidos</h4>
                <ProductSalesPieChart salesData={displaySales} responsive />
              </div>

              <div className="card" style={{ minHeight: 400 }}>
                <h4 style={{ marginTop:0 }}>Resumen Financiero</h4>
                <FinancialSummaryPieChart data={{ totalSales: financials?.totalSales || 0, costoMateriales: financials?.costoMateriales || financials?.cogs || 0, gastosOperativos: financials?.gastosOperativos || financials?.expensesTotal || 0, netProfit: financials?.netProfit || financials?.gananciaNeta || 0 }} responsive />
              </div>
            </div>

            {showAdHoc ? (
              <div style={{ marginTop:12 }}>
                <AdHocFinancialCharts totalSales={9865100} costoMateriales={392000} gastosOperativos={10000} netProfit={9463100} />
              </div>
            ) : null}

            <div style={{ marginTop:12 }} className="card">
              <h4 style={{ marginTop:0 }}>Ventas por hora</h4>
              <SalesByHourBarChart salesData={displaySales.filter(s=> isWithinRange(new Date(s.date || s.createdAt || Date.now()), effectiveRange.from, effectiveRange.to))} responsive />
            </div>

            <div style={{ marginTop:12 }} className="card">
              <h4 style={{ marginTop:0 }}>Comparativa: Hoy vs Ayer vs Promedio</h4>
              <MixedPerformanceChart
                todaySales={displaySales.filter(s=> isSameDay(new Date(s.date || s.createdAt || Date.now()), effectiveRange.to || new Date()))}
                prevSales={displaySales.filter(s=> isSameDay(new Date(s.date || s.createdAt || Date.now()), new Date((effectiveRange.to||new Date()).getTime() - 24*3600*1000)))}
                weekAvg={buildHourlyWeekAvg(displaySales, effectiveRange.to || new Date())}
                responsive
              />
            </div>

          </div>
        ) : (
          <ReportesHistory />
        )}
      </div>
    </div>
  )
}

// small helpers
function isSameDay(d1, d2){ try{ const a=new Date(d1); const b=new Date(d2); return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate() }catch(e){ return false } }
function isWithinRange(d, from, to){ try{ const t = new Date(d).getTime(); if (from) { if (t < new Date(from).getTime()) return false } if (to) { if (t > new Date(to).getTime()) return false } return true }catch(e){ return false } }
function buildHourlyWeekAvg(allSales, refDate){
  try{
    const ref = new Date(refDate || new Date())
    // compute past 7 days hourly totals
    const days = []
    for (let i=0;i<7;i++){
      const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - i)
      days.push(allSales.filter(s=> isSameDay(new Date(s.date || s.createdAt || Date.now()), d)))
    }
    const hourly = []
    for (let i=0;i<24;i++) hourly[i]=0
    days.forEach(daySales=>{
      daySales.forEach(sale=>{
        const h = new Date(sale.date || sale.createdAt || Date.now()).getHours()
        hourly[h] += Number(sale.total || sale.amount || 0)
      })
    })
    // average
    const avg = []
    for (let i=0;i<24;i++) avg[i] = Math.round(hourly[i] / days.length)
    return avg
  }catch(e){ const zeros = []; for (let i=0;i<24;i++) zeros[i]=0; return zeros }
}
