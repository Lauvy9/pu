import React, { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { formatCurrency } from '../utils/helpers'

export default function ReportesHistory(){
  const { savedReports = [], actions } = useStore()
  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  const list = (savedReports || []).filter(r => {
    if (!r) return false
    if (filterType !== 'all' && r.type !== filterType) return false
    if (!query) return true
    return JSON.stringify(r).toLowerCase().includes(query.toLowerCase())
  })

  const downloadJSON = (r) => {
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${r.id || 'report'}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      <h3>Historial de Reportes</h3>
      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        <input className="input" placeholder="Buscar..." value={query} onChange={e=>setQuery(e.target.value)} />
        <select className="input" value={filterType} onChange={e=>setFilterType(e.target.value)}>
          <option value="all">Todos</option>
          <option value="daily">Diario</option>
          <option value="manual">Manual</option>
        </select>
      </div>
      <div>
        {list.length === 0 ? <div className="small-muted">No hay reportes guardados</div> : (
          <ul>
            {list.map(r=> (
              <li key={r.id} style={{ marginBottom:10 }}>
                <strong>{r.id}</strong> — {r.date ? new Date(r.date).toLocaleString() : ''} — {r.type || ''}
                <div style={{ marginTop:6 }}>
                  {r.summary ? (
                    <span className="small-muted">Ventas: {formatCurrency(r.summary.sales||0)} • Gastos: {formatCurrency(r.summary.expenses||0)} • Compras: {formatCurrency(r.summary.purchases||0)}</span>
                  ) : null}
                </div>
                <div style={{ marginTop:6, display:'flex', gap:8 }}>
                  {r.pdfUrl ? <a className="btn" href={r.pdfUrl} target="_blank" rel="noreferrer">Abrir PDF</a> : null}
                  <button className="btn" onClick={()=>downloadJSON(r)}>Descargar JSON</button>
                  <button className="btn" onClick={()=>{ if (actions && actions.deleteReport) actions.deleteReport(r.id) }}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
