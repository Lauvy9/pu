import React, { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { formatCurrency } from '../utils/helpers'
import { isPaymentOnOrBeforeDue } from '../utils/dateHelpers'

export default function PaymentModal({ saleId, clientId, entryId, onClose }){
  const { sales = [], fiados = [], bankAccounts = [], actions } = useStore()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('efectivo')
  const [accountId, setAccountId] = useState('')
  const [date, setDate] = useState(() => {
    try { return new Date().toISOString().slice(0,16) } catch(e) { return '' }
  })

  // Determine mode: sale or fiado entry
  const sale = saleId ? sales.find(s => s.id === saleId) : null
  const client = clientId ? (fiados || []).find(c => c.id === clientId) : null
  const entry = client && entryId ? (client.movimientos || []).find(m => m.id === entryId) : null

  if (!sale && !entry) return null

  const total = sale ? Number(sale.total || 0) : Number(entry.amount || 0)
  const paid = (sale ? (sale.payments || []).reduce((s,p)=> s + Number(p.amount||0),0) : (entry.payments || []).reduce((s,p)=> s + Number(p.amount||0),0))
  const remaining = Math.max(0, total - paid)

  const register = () => {
    if (!amount || Number(amount) <= 0) return alert('Ingresa monto válido')
    const isoDate = date ? (new Date(date).toISOString()) : new Date().toISOString()
    if (sale) {
      actions.registerPayment({ relatedId: sale.id, type: 'sale', metodo: method, amount: Number(amount), accountId, date: isoDate })
    } else if (client && entry) {
      actions.registerFiadoPayment(client.id, entry.id, { amount: Number(amount), method, accountId, date: isoDate })
    }
    setAmount('')
  }

  return (
    <div className="modal">
      <div className="card" style={{ maxWidth:520 }}>
        <h3>Registrar pago {sale ? `— Venta ${sale.id}` : `— ${client?.nombre || ''}`}</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div className="small">Total: {formatCurrency(total)}</div>
          <div className="small">Pagado: {formatCurrency(paid)}</div>
          <div className="small">Restante: {formatCurrency(remaining)}</div>

          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input className="input" placeholder="Monto" type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={{ flex:1 }} />
            <select className="input" value={method} onChange={e=>setMethod(e.target.value)} style={{ width:160 }}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
            <input className="input" type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} style={{ width:220 }} />
          </div>
          {method === 'transferencia' && (
            <div>
              <label>Cuenta destino</label>
              <select className="input" value={accountId} onChange={e=>setAccountId(e.target.value)}>
                <option value="">Seleccionar cuenta</option>
                {(bankAccounts||[]).map(b=> <option key={b.id} value={b.id}>{b.bankName} {b.number}</option>)}
              </select>
            </div>
          )}

          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn" onClick={onClose}>Cerrar</button>
            <button className="btn" onClick={register}>Registrar</button>
          </div>

          <div>
            <h5 className="small">Pagos anteriores</h5>
            {(sale ? (sale.payments||[]) : (entry.payments||[])).length === 0 ? <div className="small">Sin pagos</div> : (
              <ul>
                {(sale ? (sale.payments||[]) : (entry.payments||[])).map(p => {
                  const onTime = isPaymentOnOrBeforeDue(p.date, sale ? sale.dueDate : (entry ? entry.dueDate : null))
                  return (
                    <li key={p.id} className="small" style={{ padding:6, borderBottom:'1px dashed #f0f0f0', display:'flex', justifyContent:'space-between' }}>
                      <div>{new Date(p.date).toLocaleString()} — ${Number(p.amount).toFixed(2)} — {p.metodo || p.method}</div>
                      <div style={{ fontWeight:600, color: onTime ? '#2e7d32' : '#c62828' }}>{onTime ? 'A tiempo' : 'Vencido'}</div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
