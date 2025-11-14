import React, { useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import useLocalStorage from '../hooks/useLocalStorage.jsx'
import { formatCurrency } from '../utils/helpers'
import { isAfterDue } from '../utils/dateHelpers'

export default function ReportesResumen(){
  const { payments = [], sales = [] } = useStore()
  const [clientes] = useLocalStorage('clientesFiados', [])

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24*60*60*1000 - 1)

  const pagosHoy = useMemo(() => {
    return (payments || []).filter(p => {
      try{
        const d = new Date(p.date)
        return d >= startOfDay && d <= endOfDay
      }catch(e){ return false }
    })
  }, [payments])

  const totalPagadoHoy = pagosHoy.reduce((s,p) => s + (Number(p.amount||0)), 0)

  // morosidad: revisar movimientos de clientes y sumar los montos vencidos y pendientes
  const vencidos = useMemo(() => {
    const acc = []
    clientes.forEach(c => {
      (c.movimientos || []).forEach(m => {
        const total = Number(m.amount || 0)
        const paid = (m.payments || []).reduce((s,pay)=> s + Number(pay.amount||0), 0)
        const restante = Math.max(0, total - paid)
        if (restante > 0 && m.dueDate) {
          if (isAfterDue(new Date(), m.dueDate)) {
            acc.push({ cliente: c.nombre, clienteId: c.id, entryId: m.id, amount: total, paid, restante, dueDate: m.dueDate })
          }
        }
      })
    })
    return acc
  }, [clientes])

  const totalVencido = vencidos.reduce((s,i) => s + Number(i.restante||0), 0)

  const recentPayments = (payments || []).slice().sort((a,b)=> new Date(b.date) - new Date(a.date)).slice(0,20)

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Reportes</h2>

      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        <div className="card" style={{ flex:1, padding:12 }}>
          <div className="small">Cobrado hoy</div>
          <div style={{ fontSize:20, fontWeight:700 }}>{formatCurrency(totalPagadoHoy)}</div>
          <div className="small">{pagosHoy.length} pagos</div>
        </div>
        <div className="card" style={{ flex:1, padding:12 }}>
          <div className="small">Total vencido (morosidad)</div>
          <div style={{ fontSize:20, fontWeight:700, color: totalVencido > 0 ? '#c62828' : '#2e7d32' }}>{formatCurrency(totalVencido)}</div>
          <div className="small">{vencidos.length} partidas vencidas</div>
        </div>
        <div className="card" style={{ flex:1, padding:12 }}>
          <div className="small">Ventas totales</div>
          <div style={{ fontSize:20, fontWeight:700 }}>{formatCurrency((sales||[]).reduce((s,x)=> s + Number(x.total||0),0))}</div>
          <div className="small">{(sales||[]).length} ventas</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:12 }}>
        <div style={{ flex:1 }}>
          <h3>Vencidos</h3>
          {vencidos.length === 0 ? <div className="small">No hay partidas vencidas</div> : (
            <table className="table">
              <thead><tr><th>Cliente</th><th>Importe</th><th>Pagado</th><th>Restante</th><th>Vencimiento</th></tr></thead>
              <tbody>
                {vencidos.map((v)=> (
                  <tr key={v.entryId}>
                      <td>{v.cliente}</td>
                      <td>{formatCurrency(v.amount)}</td>
                      <td>{formatCurrency(v.paid)}</td>
                      <td style={{ color:'#c62828', fontWeight:700 }}>{formatCurrency(v.restante)}</td>
                      <td>{new Date(v.dueDate).toLocaleDateString()}</td>
                      <td>
                        <button className="btn" onClick={()=>{
                          // abrir modal reutilizable para este cliente/entry
                          const PaymentModal = require('../components/PaymentModal').default
                          const container = document.createElement('div')
                          document.body.appendChild(container)
                          const onClose = ()=> { document.body.removeChild(container) }
                          // render component manually through React API
                          // simple approach: mount via ReactDOM
                          import('react-dom').then(ReactDOM => {
                            ReactDOM.render(React.createElement(PaymentModal, { clientId: v.clienteId, entryId: v.entryId, onClose }), container)
                          })
                        }}>💸 Registrar pago</button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ width: 420 }}>
          <h3>Pagos recientes</h3>
          {recentPayments.length === 0 ? <div className="small">No hay pagos registrados</div> : (
            <ul style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {recentPayments.map(p => (
                <li key={p.id} style={{ border: '1px solid #eee', padding:8, borderRadius:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <div className="small">{new Date(p.date).toLocaleString()}</div>
                    <div style={{ fontWeight:700 }}>{formatCurrency(p.amount)}</div>
                  </div>
                  <div className="small">{p.method || p.metodo} {p.accountId ? `| Cuenta ${p.accountId}` : ''} — Rel: {p.relatedId || p.saleId || '-'}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
