import React, { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { formatCurrency } from '../utils/helpers'
import { isPaymentOnOrBeforeDue, isAfterDue } from '../utils/dateHelpers'

export default function Cobranza(){
  const { fiados } = useStore()
  const [openPayment, setOpenPayment] = useState(null) // { clientId, entryId }
  
  // importar modal de pago
  
  const [filter, setFilter] = useState('all') // all | overdue | near

  const now = new Date()
  const vencidos = useMemo(() => {
    const acc = []
    (fiados || []).forEach(c => {
      (c.movimientos || []).forEach(m => {
        const total = Number(m.amount || 0)
        const paid = (m.payments || []).reduce((s,p)=> s + Number(p.amount||0), 0)
        const restante = Math.max(0, total - paid)
        if (restante > 0 && m.dueDate) {
          const due = new Date(m.dueDate)
          // treat the due date as end of day to avoid timezone/daylight issues
          const dueEnd = new Date(due);
          dueEnd.setHours(23,59,59,999)
          // Si existe al menos un pago registrado en o antes del fin del día de vencimiento,
          // consideramos que la partida no debe aparecer como "vencida" según la petición.
          const hasOnTimePayment = (m.payments || []).some(p => {
            try { return isPaymentOnOrBeforeDue(p.date, m.dueDate) } catch(e) { return false }
          })
          if (hasOnTimePayment) return
          const daysLate = Math.ceil((now - dueEnd) / (1000*60*60*24))
          acc.push({ cliente: c.nombre, clienteId: c.id, entryId: m.id, amount: total, paid, restante, dueDate: m.dueDate, daysLate })
        }
      })
    })
    return acc
  }, [fiados])

  const list = useMemo(() => {
    if (filter === 'all') return vencidos
    if (filter === 'overdue') return vencidos.filter(v => v.daysLate > 0)
    if (filter === 'near') return vencidos.filter(v => v.daysLate <= 3 && v.daysLate >= 0)
    return vencidos
  }, [vencidos, filter])

  function exportCSV(){
    const rows = [['Cliente','ClienteId','EntryId','Importe','Pagado','Restante','Vencimiento','DiasAtraso']]
    list.forEach(r => rows.push([r.cliente, r.clienteId, r.entryId, r.amount, r.paid, r.restante, r.dueDate, r.daysLate]))
    const csv = rows.map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g,'""')}"` : v).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cobranza_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Cobranza</h2>
      <div style={{ display:'flex', gap:12, marginBottom:12, alignItems:'center' }}>
        <label>Filtro:</label>
        <select value={filter} onChange={e=>setFilter(e.target.value)} className="input">
          <option value="all">Todos con vencimiento</option>
          <option value="overdue">Vencidos</option>
          <option value="near">Por vencer (≤ 3 días)</option>
        </select>
        <button className="btn" onClick={exportCSV} style={{ marginLeft: 'auto' }}>Exportar CSV</button>
      </div>

      {list.length === 0 ? <div className="small">No hay partidas en el filtro seleccionado</div> : (
        <table className="table">
          <thead><tr><th>Cliente</th><th>Importe</th><th>Pagado</th><th>Restante</th><th>Vencimiento</th><th>Días atraso</th></tr></thead>
          <tbody>
            {list.map((r)=> (
              <tr key={r.entryId}>
                <td>{r.cliente}</td>
                <td>{formatCurrency(r.amount)}</td>
                <td>{formatCurrency(r.paid)}</td>
                <td style={{ color:'#c62828', fontWeight:700 }}>{formatCurrency(r.restante)}</td>
                <td>{new Date(r.dueDate).toLocaleDateString()}</td>
                <td>{r.daysLate}</td>
                <td>
                  <button className="btn" onClick={()=> setOpenPayment({ clientId: r.clienteId, entryId: r.entryId })}>💸 Registrar pago</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {openPayment && (
        <div>
          {/* Lazy-load PaymentModal to avoid circular imports; require here */}
          {(() => {
            const PaymentModal = require('../components/PaymentModal').default
            return <PaymentModal clientId={openPayment.clientId} entryId={openPayment.entryId} onClose={()=> setOpenPayment(null)} />
          })()}
        </div>
      )}
    </div>
  )
}
