import React, { useMemo, useState } from 'react'
import ReportesIntegrados from './ReportesIntegrados'
import ReportesHistory from './ReportesHistory'
import { useStore } from '../context/StoreContext'
import { calculateFinancialData } from '../utils/financeHelpers'
import exportToPDF from '../utils/exportPdf'
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
                {r.pdfUrl ? <a className="btn" href={r.pdfUrl} target="_blank" rel="noreferrer">Abrir PDF</a> : null}
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
  const { sales = [], expenses = [] } = useStore()
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'reportes' | 'historial'
  const [dateRange, setDateRange] = useState({ start: new Date(new Date().setDate(new Date().getDate()-30)).toISOString().slice(0,10), end: new Date().toISOString().slice(0,10) })
  const [exportingPDF, setExportingPDF] = useState(false)
  const [includeImageInPDF, setIncludeImageInPDF] = useState(true)

  // Calcular datos del dashboard usando la utilidad ya existente
  const dashboardData = useMemo(()=>{
    try{
      return calculateFinancialData(dateRange, sales || [], expenses || [], [])
    }catch(e){ console.error('dashboardData calc failed', e); return null }
  }, [sales, expenses, dateRange])

  async function handleExportPDF(){
    setExportingPDF(true)
    try{
      await exportToPDF(dashboardData, dateRange, { includeImage: includeImageInPDF })
    }catch(e){ console.error('Error exportando PDF', e); alert('Error al exportar PDF: ' + (e && e.message ? e.message : String(e))) }
    finally{ setExportingPDF(false) }
  }

  return (
    <div className="reportes-responsive">
      <div className="reportes-header-responsive">
        <div className="header-main">
          <h1>📊 Reportes Integrados</h1>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={includeImageInPDF} onChange={(e)=>setIncludeImageInPDF(!!e.target.checked)} />
              <small>Incluir imagen</small>
            </label>
            <button
              onClick={handleExportPDF}
              disabled={exportingPDF || !dashboardData}
              className="btn-pdf-export btn"
            >
              {exportingPDF ? '⏳ Generando...' : '📄 Exportar PDF'}
            </button>
          </div>
        </div>

        <div className="tabs-responsive">
          <button className={`tab-responsive ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={()=>setActiveTab('dashboard')}>
            <span className="tab-icon">📈</span>
            <span className="tab-label">Dashboard</span>
          </button>
          <button className={`tab-responsive ${activeTab === 'reportes' ? 'active' : ''}`} onClick={()=>setActiveTab('reportes')}>
            <span className="tab-icon">📋</span>
            <span className="tab-label">Reportes</span>
          </button>
          <button className={`tab-responsive ${activeTab === 'historial' ? 'active' : ''}`} onClick={()=>setActiveTab('historial')}>
            <span className="tab-icon">🕐</span>
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
            <ReportesIntegrados externalRange={dateRange} />
          </div>
        )}
        {activeTab === 'reportes' && <ReportesGenerados />}
        {activeTab === 'historial' && <ReportesHistory />}
      </div>
    </div>
  )
}
