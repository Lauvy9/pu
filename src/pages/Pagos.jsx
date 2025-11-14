import React, { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { formatCurrency } from '../utils/helpers'

export default function Pagos(){
  const { invoices = [], sales = [], bankAccounts = [], actions, payments = [] } = useStore()
  const [method, setMethod] = useState('efectivo')
  const [amount, setAmount] = useState('')
  const [relatedType, setRelatedType] = useState('invoice')
  const [relatedId, setRelatedId] = useState('')
  const [accountId, setAccountId] = useState('')

  function register(){
    if(!amount) return alert('Ingresar monto')
    if((method === 'transferencia') && !accountId) return alert('Seleccionar cuenta destino')
    const payment = {
      relatedId,
      type: relatedType,
      metodo: method,
      amount: Number(amount),
      accountId
    }
    const saved = actions.registerPayment(payment)
    alert('Pago registrado: '+saved.id)
    setAmount('')
  }

  return (
    <div className="grid">
      <div className="card">
        <h3>Registrar Pago</h3>
        <label>Tipo relación</label>
        <select className="input" value={relatedType} onChange={e=>setRelatedType(e.target.value)}>
          <option value="invoice">Factura</option>
          <option value="sale">Venta</option>
        </select>

        <label>Seleccionar</label>
        <select className="input" value={relatedId} onChange={e=>setRelatedId(e.target.value)}>
          <option value="">Seleccionar</option>
          {relatedType === 'invoice' ? (
            invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.id} - {inv.cliente?.nombre || 'Sin cliente'} - {formatCurrency(inv.total)}</option>)
          ) : (
            sales.map(s => <option key={s.id} value={s.id}>{s.id} - {s.clienteFiado || s.type} - {formatCurrency(s.total)}</option>)
          )}
        </select>

        <label>Método</label>
        <select className="input" value={method} onChange={e=>setMethod(e.target.value)}>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="tarjeta">Tarjeta</option>
        </select>

        {method === 'transferencia' && (
          <select className="input" value={accountId} onChange={e=>setAccountId(e.target.value)}>
            <option value="">Seleccionar cuenta destino</option>
            {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.type} {b.number} - {b.holder || b.titular}</option>)}
          </select>
        )}

        <label>Monto</label>
        <input className="input" type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
        <div style={{marginTop:8}}>
          <button className="btn" onClick={register}>Registrar Pago</button>
        </div>
      </div>

      <div className="card" style={{gridColumn:'1 / -1'}}>
        <h3>Pagos registrados</h3>
        {(!payments || payments.length===0) ? (
          <p>No hay pagos registrados</p>
        ) : (
          <table className="table">
            <thead><tr><th>ID</th><th>Relacionado</th><th>Método</th><th>Monto</th><th>Cuenta</th><th>Fecha</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.type} - {p.relatedId}</td>
                  <td>{p.metodo}</td>
                  <td>{formatCurrency(p.amount)}</td>
                  <td>{p.accountId ? ((bankAccounts.find(b=>String(b.id)===String(p.accountId))||{}).bankName || '-') : '-'}</td>
                  <td>{new Date(p.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
