import React, { useMemo, useState } from 'react'
import '../pages/reportesProfesional.css'
import exportToPDF from '../utils/exportPdf'
import { calculateFinancialData } from '../utils/financeHelpers'
import { useStore } from '../context/StoreContext'
import { formatCurrency } from '../utils/helpers'

function DashboardProfesional({ data }){
  const sales = data?.filteredSales || []
  return (
    <section className="panel-dashboard">
      <div className="grid-metrics">
        <div className="metric card">
          <div className="metric-title">Ventas Totales</div>
          <div className="metric-value">{formatCurrency(data?.totalSales || 0)}</div>
        </div>
        <div className="metric card">
          <div className="metric-title">Costo de Materiales</div>
          <div className="metric-value">{formatCurrency(data?.totalCosts || data?.costoMateriales || 0)}</div>
        </div>
        <div className="metric card">
          <div className="metric-title">Gastos Operativos</div>
          <div className="metric-value">{formatCurrency(data?.totalExpenses || data?.gastosOperativos || 0)}</div>
        </div>
        <div className="metric card">
          <div className="metric-title">Ganancia Neta</div>
          <div className="metric-value">{formatCurrency(data?.netProfit || data?.gananciaNeta || 0)}</div>
        </div>
      </div>

      <div className="card panel-table">
        <h3 className="panel-title">Últimas transacciones</h3>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0,20).map(s=> (
                <tr key={s.id || s._id || Math.random()}>
                  <td>{s.id || s._id || '-'}</td>
                  <td>{(s.date || s.fecha || s.createdAt || '').toString()}</td>
                  <td>{formatCurrency(Number(s.total || s.amount || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function ReportesDetallados(){
  return (
    <div className="card">
      <h3 className="panel-title">Reportes Detallados</h3>
      <p className="muted">Aquí irán las vistas detalladas por producto/cliente/cuenta.</p>
    </div>
  )
}

function HistorialProfesional(){
  return (
    <div className="card">
      <h3 className="panel-title">Historial de Reportes</h3>
      <p className="muted">Lista de reportes generados y descargados.</p>
    </div>
  )
}

export default function ReportesProfesional(){
  const { sales = [], expenses = [], actions } = useStore()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dateRange, setDateRange] = useState({ start: new Date(new Date().setDate(new Date().getDate()-30)).toISOString().slice(0,10), end: new Date().toISOString().slice(0,10) })
  const [exportingPDF, setExportingPDF] = useState(false)

  // estado para formulario de gasto
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpense, setNewExpense] = useState({ description:'', amount:'', category:'operativos', date: new Date().toISOString().slice(0,10) })

  const dashboardData = useMemo(()=>{
    try{ return calculateFinancialData(dateRange, sales || [], expenses || [], []) }catch(e){ console.error(e); return null }
  }, [dateRange, sales, expenses])

  const handleExportPDF = async () => {
    setExportingPDF(true)
    try{
      await exportToPDF(dashboardData, dateRange, { includeImage: false })
    }catch(e){ console.error('Error exportando PDF', e); alert('Error al generar reporte PDF: ' + (e && e.message ? e.message : String(e))) }
    finally{ setExportingPDF(false) }
  }

  const quickRange = (period) => {
    const now = new Date()
    let start
    if (period === 'Hoy') start = now
    else if (period === 'Semana') start = new Date(now.getFullYear(), now.getMonth(), now.getDate()-7)
    else if (period === 'Mes') start = new Date(now.getFullYear(), now.getMonth()-1, now.getDate())
    else if (period === 'Trimestre') start = new Date(now.getFullYear(), now.getMonth()-3, now.getDate())
    setDateRange({ start: start.toISOString().slice(0,10), end: now.toISOString().slice(0,10) })
  }

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      alert('Por favor completa la descripción y el monto')
      return
    }
    const expenseData = {
      id: 'exp_' + Date.now(),
      description: newExpense.description.trim(),
      amount: Number(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date ? (newExpense.date + 'T00:00:00.000Z') : new Date().toISOString()
    }
    if (actions && typeof actions.addExpense === 'function'){
      actions.addExpense(expenseData)
      setNewExpense({ description:'', amount:'', category:'operativos', date: new Date().toISOString().slice(0,10) })
      setShowAddExpense(false)
      // dashboardData will recompute because expenses is in dependency
    } else {
      alert('No se pudo guardar el gasto: store actions no disponible')
    }
  }

  return (
    <div className="reportes-profesional">
      <header className="header-corporativo">
        <div className="header-contenido">
          <div className="branding">
            <h1 className="titulo-principal">Dashboard de Reportes</h1>
            <p className="subtitulo">Análisis financiero y métricas de negocio</p>
          </div>
          <div className="acciones-superiores">
            <button className="btn btn-pdf" onClick={handleExportPDF} disabled={exportingPDF}>
              {exportingPDF ? 'Generando PDF...' : 'Exportar Reporte PDF'}
            </button>
          </div>
        </div>

        <nav className="navegacion-profesional">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={()=>setActiveTab('dashboard')}>Dashboard</button>
          <button className={`nav-item ${activeTab === 'reportes' ? 'active' : ''}`} onClick={()=>setActiveTab('reportes')}>Reportes Detallados</button>
          <button className={`nav-item ${activeTab === 'historial' ? 'active' : ''}`} onClick={()=>setActiveTab('historial')}>Historial</button>
        </nav>
      </header>

      <div className="layout-corporativo">
        <aside className="panel-control">
          <section className="seccion-filtros card">
            <h3 className="seccion-titulo">Filtros de Fecha</h3>
            <div className="controles-fecha">
              <div className="campo-fecha">
                <label className="etiqueta">Fecha inicial</label>
                <input type="date" className="input-fecha" value={dateRange.start} onChange={(e)=> setDateRange(prev=>({...prev, start: e.target.value}))} />
              </div>
              <div className="campo-fecha">
                <label className="etiqueta">Fecha final</label>
                <input type="date" className="input-fecha" value={dateRange.end} onChange={(e)=> setDateRange(prev=>({...prev, end: e.target.value}))} />
              </div>
            </div>

            <div className="filtros-rapidos">
              <button className="filtro-rapido" onClick={()=>quickRange('Hoy')}>Hoy</button>
              <button className="filtro-rapido" onClick={()=>quickRange('Semana')}>Esta semana</button>
              <button className="filtro-rapido" onClick={()=>quickRange('Mes')}>Este mes</button>
              <button className="filtro-rapido" onClick={()=>quickRange('Trimestre')}>Este trimestre</button>
            </div>
          </section>

          <section className="seccion-acciones card">
            <h3 className="seccion-titulo">Acciones</h3>
            <div className="botones-accion">
              <button className="btn btn-secundario" onClick={()=>{ import('../utils/sampleData').then(m=>{ const s = m.generateSampleSales({ days:7, avgPerDay:40 }); alert('Datos de prueba cargados en memoria. Cambia rango si quieres visualizar.'); }) }}>Cargar datos de prueba</button>
              <button className="btn btn-terciario" onClick={()=>{ /* limpiar localmente: for demo clear nothing */ alert('Limpiar: recarga la página o borra datos de prueba del store.') }}>Limpiar datos</button>
            </div>
            
              <div style={{ marginTop:12, borderTop:'1px solid rgba(0,0,0,0.06)', paddingTop:12 }}>
                <h4 style={{ margin:0, fontSize:14 }}>Agregar Gasto</h4>
                <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:8 }}>
                  <input type="text" className="input-fecha" placeholder="Descripción" value={newExpense.description} onChange={e=> setNewExpense(prev=> ({...prev, description: e.target.value}))} />
                  <input type="number" className="input-fecha" placeholder="Monto" min="0" step="0.01" value={newExpense.amount} onChange={e=> setNewExpense(prev=> ({...prev, amount: e.target.value}))} />
                  <select className="input-fecha" value={newExpense.category} onChange={e=> setNewExpense(prev=> ({...prev, category: e.target.value}))}>
                    <option value="operativos">Gastos Operativos</option>
                    <option value="alquiler">Alquiler</option>
                    <option value="servicios">Servicios</option>
                    <option value="impuestos">Impuestos</option>
                    <option value="materiales">Materiales</option>
                    <option value="otros">Otros</option>
                  </select>
                  <input type="date" className="input-fecha" value={newExpense.date} onChange={e=> setNewExpense(prev=> ({...prev, date: e.target.value}))} />
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="btn btn-success" onClick={handleAddExpense}>Guardar Gasto</button>
                    <button className="btn" onClick={()=> setNewExpense({ description:'', amount:'', category:'operativos', date: new Date().toISOString().slice(0,10) })}>Limpiar</button>
                  </div>
                </div>
              </div>
          </section>
        </aside>

        <main className="contenido-principal">
          {activeTab === 'dashboard' && <DashboardProfesional data={dashboardData} />}
          {activeTab === 'reportes' && <ReportesDetallados />}
          {activeTab === 'historial' && <HistorialProfesional />}
        </main>
      </div>
    </div>
  )
}
