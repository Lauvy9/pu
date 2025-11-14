import React, { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { calculateIntegratedFinancialData } from '../utils/financeHelpers'
import exportToPDF from '../utils/exportPdf'
import { formatCurrency } from '../utils/helpers'

function FiltrosFecha({ dateRange, onDateChange }){
  return (
    <div className="card" style={{ padding:12 }}>
      <h4 style={{ marginTop:0 }}>Rango de fechas</h4>
      <div style={{ display:'flex', gap:8, flexDirection:'column' }}>
        <input type="date" value={dateRange.start} onChange={e=> onDateChange(prev=>({...prev, start: e.target.value}))} />
        <input type="date" value={dateRange.end} onChange={e=> onDateChange(prev=>({...prev, end: e.target.value}))} />
      </div>
    </div>
  )
}

function ResumenRapido({ data }){
  const r = data || {}
  return (
    <div className="card" style={{ padding:12 }}>
      <h4 style={{ marginTop:0 }}>Resumen</h4>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <div><small className="muted">Ventas</small><div style={{ fontWeight:700 }}>{formatCurrency(r.totalSales || 0)}</div></div>
        <div><small className="muted">Gastos</small><div style={{ fontWeight:700 }}>{formatCurrency(r.totalExpenses || 0)}</div></div>
        <div><small className="muted">Costo</small><div style={{ fontWeight:700 }}>{formatCurrency(r.totalCosts || 0)}</div></div>
        <div><small className="muted">Ganancia Neta</small><div style={{ fontWeight:700 }}>{formatCurrency(r.netProfit || 0)}</div></div>
      </div>
    </div>
  )
}

function ResumenEjecutivo({ data }){
  const d = data.resumen || {}
  return (
    <div className="card" style={{ padding:14 }}>
      <h3 style={{ marginTop:0 }}>Resumen Ejecutivo</h3>
      <p className="muted">Resumen consolidado del periodo seleccionado.</p>
      <div style={{ display:'flex', gap:12, marginTop:8 }}>
        <div style={{ flex:1 }}>
          <div className="small-muted">Ventas Totales</div>
          <div style={{ fontSize:18, fontWeight:700 }}>{formatCurrency(d.totalSales || 0)}</div>
        </div>
        <div style={{ flex:1 }}>
          <div className="small-muted">Gastos Totales</div>
          <div style={{ fontSize:18, fontWeight:700 }}>{formatCurrency(d.totalExpenses || 0)}</div>
        </div>
        <div style={{ flex:1 }}>
          <div className="small-muted">Ganancia Neta</div>
          <div style={{ fontSize:18, fontWeight:700 }}>{formatCurrency(d.netProfit || 0)}</div>
        </div>
      </div>
    </div>
  )
}

function AnalisisVentas({ data }){
  const list = data.byProduct || []
  return (
    <div className="card" style={{ padding:12 }}>
      <h3 style={{ marginTop:0 }}>Análisis de Ventas</h3>
      <div style={{ maxHeight:320, overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr><th>Producto</th><th>Vendidos</th><th>Ingresos</th><th>Costo</th></tr>
          </thead>
          <tbody>
            {list.map(p=> (
              <tr key={p.id}><td>{p.name}</td><td>{p.qty}</td><td>{formatCurrency(p.revenue)}</td><td>{formatCurrency(p.cost)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ControlGastos({ data }){
  const list = data.list || []
  return (
    <div className="card" style={{ padding:12 }}>
      <h3 style={{ marginTop:0 }}>Control de Gastos</h3>
      <div style={{ maxHeight:320, overflow:'auto' }}>
        <table style={{ width:'100%' }}>
          <thead><tr><th>Fecha</th><th>Concepto</th><th>Monto</th></tr></thead>
          <tbody>
            {list.map((g,i)=> (<tr key={i}><td>{g.date||g.fecha||g.createdAt||''}</td><td>{g.concept||g.note||g.descripcion||g.description||'-'}</td><td>{formatCurrency(Number(g.amount||g.monto||g.value||0))}</td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GestionClientes({ data }){
  return (
    <div className="card" style={{ padding:12 }}>
      <h3 style={{ marginTop:0 }}>Gestión de Clientes</h3>
      <div className="muted">Clientes totales: {data.totalDistinct || 0} — Nuevos: {data.newClients || 0} — Recurrentes: {data.recurringClients || 0}</div>
    </div>
  )
}

function EstadoInventario({ data }){
  return (
    <div className="card" style={{ padding:12 }}>
      <h3 style={{ marginTop:0 }}>Estado de Inventario</h3>
      <div style={{ maxHeight:320, overflow:'auto' }}>
        <table style={{ width:'100%' }}>
          <thead><tr><th>Producto</th><th>Stock</th><th>Vendidos</th></tr></thead>
          <tbody>
            {data.items && data.items.map(it=> (<tr key={it.id}><td>{it.name}</td><td>{it.stock}</td><td>{it.sold || 0}</td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CreditosFiados({ data }){
  return (
    <div className="card" style={{ padding:12 }}>
      <h3 style={{ marginTop:0 }}>Créditos y Fiados</h3>
      <div className="muted">Total fiados: {formatCurrency(data.totalFiados || 0)} — Vencidos: {formatCurrency(data.overdue || 0)} — Pagos recibidos: {formatCurrency(data.paymentsReceived || 0)}</div>
    </div>
  )
}

export default function ReportesIntegradosCompletos(){
  const { sales = [], expenses = [], purchases = [], fiados = [], products = [], clients = [] } = useStore()
  const [dateRange, setDateRange] = useState({ start: new Date(new Date().setDate(new Date().getDate()-30)).toISOString().slice(0,10), end: new Date().toISOString().slice(0,10) })
  const [activeSection, setActiveSection] = useState('resumen')

  const financialData = useMemo(()=> calculateIntegratedFinancialData({ sales, expenses, purchases, fiados, products, clients, dateRange }), [sales, expenses, purchases, fiados, products, clients, dateRange])

  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try{
      await exportToPDF(financialData, dateRange, { includeImage: false })
    }catch(e){ console.error('Error exportando reporte completo', e); alert('Error al exportar PDF: '+ (e && e.message ? e.message : String(e))) }
    finally{ setExporting(false) }
  }

  return (
    <div style={{ maxWidth:1200, margin:'16px auto' }}>
      <header style={{ marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ margin:0 }}>Reportes Financieros Integrados</h2>
          <div>
            <button className="btn" onClick={handleExport} disabled={exporting}>{exporting ? 'Generando PDF...' : 'Exportar Reporte Completo PDF'}</button>
          </div>
        </div>
        <nav style={{ marginTop:8, display:'flex', gap:8 }}>
          <button className={`nav-item ${activeSection==='resumen' ? 'active' : ''}`} onClick={()=>setActiveSection('resumen')}>Resumen Ejecutivo</button>
          <button className={`nav-item ${activeSection==='ventas' ? 'active' : ''}`} onClick={()=>setActiveSection('ventas')}>Análisis de Ventas</button>
          <button className={`nav-item ${activeSection==='gastos' ? 'active' : ''}`} onClick={()=>setActiveSection('gastos')}>Control de Gastos</button>
          <button className={`nav-item ${activeSection==='clientes' ? 'active' : ''}`} onClick={()=>setActiveSection('clientes')}>Gestión de Clientes</button>
          <button className={`nav-item ${activeSection==='inventario' ? 'active' : ''}`} onClick={()=>setActiveSection('inventario')}>Estado de Inventario</button>
          <button className={`nav-item ${activeSection==='fiados' ? 'active' : ''}`} onClick={()=>setActiveSection('fiados')}>Créditos y Fiados</button>
        </nav>
      </header>

      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:12 }}>
        <aside>
          <FiltrosFecha dateRange={dateRange} onDateChange={setDateRange} />
          <ResumenRapido data={financialData.resumen} />
        </aside>
        <main>
          {activeSection === 'resumen' && <ResumenEjecutivo data={financialData} />}
          {activeSection === 'ventas' && <AnalisisVentas data={financialData.ventas} />}
          {activeSection === 'gastos' && <ControlGastos data={financialData.gastos} />}
          {activeSection === 'clientes' && <GestionClientes data={financialData.clientes} />}
          {activeSection === 'inventario' && <EstadoInventario data={financialData.inventario} />}
          {activeSection === 'fiados' && <CreditosFiados data={financialData.fiados} />}
        </main>
      </div>
    </div>
  )
}
