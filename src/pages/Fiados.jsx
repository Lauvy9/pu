import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useStore } from '../context/StoreContext'
import { isPaymentOnOrBeforeDue, isAfterDue } from '../utils/dateHelpers'

const Fiados = () => {
  const { bankAccounts, actions, fiados } = useStore()
  const clientes = fiados || []
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    limite: "",
    deuda: 0,
    movimientos: [] // historial de fiados y pagos
  });
  const [editingClientIndex, setEditingClientIndex] = useState(null)
  const [editingClient, setEditingClient] = useState(null)

  // Nota: los clientes (fiados) se almacenan en `StoreContext` y se sincronizan ahí.

  const handleChange = (e) => {
    setNuevoCliente({ ...nuevoCliente, [e.target.name]: e.target.value });
  };

  const agregarCliente = (e) => {
    e.preventDefault();
    if (!nuevoCliente.nombre || !nuevoCliente.telefono)
      return setToast({ type: 'warning', text: 'Completa los campos obligatorios' });

    const toAdd = { ...nuevoCliente, id: Date.now(), deuda: Number(nuevoCliente.deuda || 0), movimientos: nuevoCliente.movimientos || [], credit: 0 }
    actions.addFiadoClient(toAdd)
    setNuevoCliente({ nombre: "", telefono: "", direccion: "", limite: "", deuda: 0, movimientos: [], credit: 0 });
    setToast({ type: 'success', text: 'Cliente agregado' })
  };

  // Agregar un nuevo movimiento de deuda (se registra fecha tomado y fecha vencimiento)
  const addDebtEntry = (clientIndex, { amount, dateTaken, dueDate, note }) => {
    const client = clientes[clientIndex]
    if (!client) return
    // Aplicar saldo a favor automáticamente
    const rawAmount = Number(amount)
    let remaining = rawAmount
    const credit = Number(client.credit || 0)
    const payments = []
    if (credit > 0) {
      const applied = Math.min(credit, remaining)
      if (applied > 0) {
        payments.push({ id: Date.now() + 1, amount: applied, date: new Date().toISOString(), method: 'saldo_adelantado', note: 'Aplicado desde saldo a favor' })
        remaining = Math.max(0, remaining - applied)
        // actualizar saldo a favor del cliente
        actions.updateFiadoClient(client.id, { credit: Math.max(0, credit - applied) })
      }
    }

    const entry = { id: Date.now(), amount: Number(remaining), dateTaken: dateTaken || new Date().toISOString().slice(0,10), dueDate: dueDate || null, note: note || '', payments }
    // Si remaining === 0, estará pagado al 100% y queda registrado con payments
    actions.addFiadoEntry(client.id, entry)
    setToast({ type: 'success', text: `Entrada agregada. Aplicado ${rawAmount - remaining} desde saldo a favor.` })
    return entry
  }

  // Registrar un pago sobre una entrada específica
  const registerPaymentForEntry = (clientIndex, entryId, { amount, method, accountId }) => {
    const client = clientes[clientIndex]
    if (!client) return { ok:false, error: 'cliente not found' }
    const p = { amount: Number(amount), method: method || 'efectivo', accountId: accountId || null, date: new Date().toISOString(), id: Date.now() }
    const res = actions.registerFiadoPayment(client.id, entryId, p)
    if (res && res.ok) setToast({ type: 'success', text: 'Pago registrado' })
    else setToast({ type: 'error', text: 'Error al registrar pago' })
    return res
  }

  // actualizar un entry (edición de monto/fechas/nota)
  const updateEntry = (clientIndex, entryId, patch) => {
    const client = clientes[clientIndex]
    if (!client) return
    actions.updateFiadoEntry(client.id, entryId, patch)
  }

  const toggleEntryActive = (clientIndex, entryId) => {
    const client = clientes[clientIndex]
    if (!client) return
    actions.toggleFiadoEntryActive(client.id, entryId)
  }

  const removeEntry = (clientIndex, entryId) => {
    const client = clientes[clientIndex]
    if (!client) return
    actions.removeFiadoEntry(client.id, entryId)
  }

  // Component: formulario para agregar nueva entrada de deuda
  function DebtEntryForm({ clientIndex, onAdd }){
    const [amount, setAmount] = useState('')
    const [dateTaken, setDateTaken] = useState(new Date().toISOString().slice(0,10))
    const [dueDate, setDueDate] = useState('')
    const [note, setNote] = useState('')
    return (
      <div style={{ border:'1px solid #f0f0f0', padding:8, borderRadius:6 }}>
        <div style={{ display:'flex', gap:8 }}>
          <input className="input" placeholder="Monto" type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
          <input className="input" type="date" value={dateTaken} onChange={e=>setDateTaken(e.target.value)} />
        </div>
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          <input className="input" type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
          <input className="input" placeholder="Nota" value={note} onChange={e=>setNote(e.target.value)} />
          <button className="btn" onClick={()=>{ if(!amount) return setToast({ type: 'warning', text: 'Monto requerido' }); onAdd({ amount, dateTaken, dueDate, note }); setAmount(''); setNote(''); setDueDate('') }}>Agregar</button>
        </div>
      </div>
    )
  }

  // Component: lista de pagos y formulario para registrar pago en una entrada
  function PaymentsList({ clientIndex, entry, onPay, bankAccounts }){
    const [payAmount, setPayAmount] = useState('')
    const [method, setMethod] = useState('efectivo')
    const [accountId, setAccountId] = useState('')
    // calcular totales
    const totalAmount = Number(entry.amount || 0)
    const totalPaid = (entry.payments || []).reduce((s,p)=> s + Number(p.amount || 0), 0)
    const remaining = Math.max(0, totalAmount - totalPaid)
    const progress = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0
    return (
      <div>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
          <input className="input" placeholder="Monto pago" type="number" value={payAmount} onChange={e=>setPayAmount(e.target.value)} style={{ width:140 }} />
          <select className="input" value={method} onChange={e=>setMethod(e.target.value)} style={{ width:140 }}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
          {method === 'transferencia' && (
            <select className="input" value={accountId} onChange={e=>setAccountId(e.target.value)} style={{ width:200 }}>
              <option value="">Seleccionar cuenta</option>
              {(bankAccounts||[]).map(b=> <option key={b.id} value={b.id}>{b.bankName} {b.number}</option>)}
            </select>
          )}
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
            onClick={()=>{
              if(!payAmount) return setToast({ type: 'warning', text: 'Ingresa monto' });
              const r = onPay({ amount: payAmount, method, accountId });
              if(r && r.ok){ setPayAmount(''); setToast({ type: 'success', text: 'Pago registrado' }) } else { setToast({ type: 'error', text: 'Error al registrar pago' }) }
            }}
          >Registrar pago</button>
        </div>

        <div style={{ marginTop:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <h5 style={{ margin:0 }}>Pagos registrados</h5>
              <div className="small">Total: ${totalAmount.toFixed(2)} — Pagado: ${totalPaid.toFixed(2)} — Restante: ${remaining.toFixed(2)}</div>
            </div>
            <div style={{ width: 160 }}>
              <div style={{ height: 10, background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: progress >= 100 ? '#4caf50' : '#2196F3' }} />
              </div>
              <div className="small" style={{ textAlign:'right' }}>{progress}%</div>
            </div>
          </div>

          {(entry.payments||[]).length === 0 ? <div className="small">Sin pagos</div> : (
            <ul style={{ marginTop:8 }}>
              {(entry.payments||[]).map(p => {
                const onTime = isPaymentOnOrBeforeDue(p.date, entry.dueDate)
                return (
                  <li key={p.id} className="small" style={{ padding:6, borderBottom:'1px dashed #f0f0f0', display:'flex', justifyContent:'space-between' }}>
                    <div>{new Date(p.date).toLocaleString()} — ${Number(p.amount).toFixed(2)} — {p.method} {p.accountId ? `| Cuenta: ${p.accountId}` : ''}</div>
                    <div style={{ fontWeight:600, color: onTime ? '#2e7d32' : '#c62828' }}>{onTime ? 'A tiempo' : 'Vencido'}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    )
  }

  
  

  // editar cliente (abrir modal)
  const openEditClient = (index) => {
    setEditingClientIndex(index)
    setEditingClient(JSON.parse(JSON.stringify(clientes[index] || {})))
  }

  const saveEditedClient = () => {
    if (editingClientIndex == null) return
    const client = clientes[editingClientIndex]
    if (!client) return
    actions.updateFiadoClient(client.id, editingClient)
    setEditingClientIndex(null)
    setEditingClient(null)
  }

  const cancelEditClient = () => { setEditingClientIndex(null); setEditingClient(null) }

  const eliminarCliente = (index) => {
    const client = clientes[index]
    if (!client) return
    if (window.confirm("¿Seguro que deseas eliminar este cliente?")) {
      actions.removeFiadoClient(client.id)
      setToast({ type: 'success', text: 'Cliente eliminado' })
    }
  };

  // --- Nuevas utilidades y UI state ---
  const [toast, setToast] = useState(null)
  const [tab, setTab] = useState('movimientos')
  const [quickPayClientIndex, setQuickPayClientIndex] = useState(null)
  const [quickPayAmount, setQuickPayAmount] = useState('')
  const [quickPayMethod, setQuickPayMethod] = useState('efectivo')

  // cerrar toast automáticamente
  useEffect(()=>{
    if(!toast) return
    const t = setTimeout(()=> setToast(null), 3500)
    return ()=> clearTimeout(t)
  }, [toast])

  // Cálculos memoizados por cliente
  const clientsWithTotals = useMemo(()=>{
    return clientes.map(c => {
      const movimientos = c.movimientos || []
      const totalDebt = movimientos.reduce((s,m)=> s + Number(m.amount || 0), 0)
      const totalPaid = movimientos.reduce((s,m)=> s + ((m.payments||[]).reduce((sp,pp)=> sp + Number(pp.amount||0),0)), 0)
      const credit = Number(c.credit || 0)
      const pending = Math.max(0, totalDebt - totalPaid)
      const percent = totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : (credit>0?100:0)
      return { ...c, totals: { totalDebt, totalPaid, pending, percent, credit } }
    })
  }, [clientes])

  const totalsGlobal = useMemo(()=>{
    const totalDebt = clientsWithTotals.reduce((s,c)=> s + c.totals.totalDebt, 0)
    const totalPaid = clientsWithTotals.reduce((s,c)=> s + c.totals.totalPaid, 0)
    const totalCredit = clientsWithTotals.reduce((s,c)=> s + Number(c.totals.credit || 0), 0)
    return { totalDebt, totalPaid, totalCredit }
  }, [clientsWithTotals])

  const quickRegisterAdvance = useCallback(()=>{
    if (quickPayClientIndex == null) return setToast({ type: 'warning', text: 'Selecciona un cliente' })
    const client = clientes[quickPayClientIndex]
    if(!client) return setToast({ type: 'error', text: 'Cliente no encontrado' })
    const amount = Number(quickPayAmount || 0)
    if(amount <= 0) return setToast({ type: 'warning', text: 'Monto inválido' })
    // registrar como saldo a favor en el cliente
    const newCredit = Number(client.credit || 0) + amount
    actions.updateFiadoClient(client.id, { credit: newCredit })
    setToast({ type: 'success', text: `Saldo a favor registrado: $${amount.toFixed(2)}` })
    setQuickPayClientIndex(null)
    setQuickPayAmount('')
  }, [quickPayClientIndex, quickPayAmount, clientes])

  // Export CSV de historial (movimientos + pagos)
  const exportHistoryCSV = useCallback((clientIndex)=>{
    const client = clientes[clientIndex]
    if(!client) return setToast({ type: 'error', text: 'Cliente no encontrado' })
    const rows = []
    rows.push(['Cliente', client.nombre])
    rows.push([])
    rows.push(['Tipo','MovimientoId','Fecha','Monto','Pago','Metodo','Detalle','Estado','Vence'])
    ;(client.movimientos||[]).forEach(m => {
      const total = Number(m.amount||0)
      const paid = (m.payments||[]).reduce((s,p)=> s + Number(p.amount||0), 0)
      const restante = Math.max(0, total - paid)
      const estado = restante <= 0 ? 'Pagado' : (m.dueDate && isAfterDue(new Date(), m.dueDate) ? 'Vencido' : 'Pendiente')
      if((m.payments||[]).length === 0){
        rows.push(['Deuda', m.id || '', m.dateTaken || '', total, 0, '', m.note || '', estado, m.dueDate || ''])
      } else {
        // fila movimiento resumen
        rows.push(['Deuda', m.id || '', m.dateTaken || '', total, paid, '', m.note || '', estado, m.dueDate || ''])
        m.payments.forEach(p => {
          const pOnTime = isPaymentOnOrBeforeDue(p.date, m.dueDate)
          rows.push(['Pago', m.id || '', p.date || '', '', p.amount, p.method || '', p.note || '', pOnTime ? 'A tiempo' : 'Vencido', ''])
        })
      }
    })
    // construir CSV
    const csv = rows.map(r => r.map(cell => `"${String(cell||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historial_${(client.nombre||'cliente').replace(/\s+/g,'_')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setToast({ type: 'success', text: 'CSV descargado' })
  }, [clientes])

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Gestión de Fiados</h2>

      {/* Dashboard resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Deuda total</div>
          <div className="text-xl font-bold">${totalsGlobal.totalDebt.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total pagado</div>
          <div className="text-xl font-bold">${totalsGlobal.totalPaid.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Saldos a favor</div>
          <div className="text-xl font-bold">${totalsGlobal.totalCredit.toFixed(2)}</div>
        </div>
      </div>

      {/* Formulario */}
      <form
        onSubmit={agregarCliente}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 bg-gray-100 p-4 rounded-lg shadow"
      >
        <input
          name="nombre"
          placeholder="Nombre completo"
          value={nuevoCliente.nombre}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="telefono"
          placeholder="Teléfono"
          value={nuevoCliente.telefono}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="direccion"
          placeholder="Dirección"
          value={nuevoCliente.direccion}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="limite"
          type="number"
          placeholder="Límite de crédito"
          value={nuevoCliente.limite}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <button className="bg-green-600 text-white rounded p-2 sm:col-span-2 hover:bg-green-700 transition">
          Agregar Cliente
        </button>
      </form>

      {/* Quick pay (saldo a favor) */}
      <div className="mb-4 p-4 bg-white rounded shadow flex gap-4 items-center">
        <div>
          <select className="input" value={quickPayClientIndex ?? ''} onChange={e=>setQuickPayClientIndex(e.target.value === '' ? null : Number(e.target.value))}>
            <option value="">Seleccionar cliente (saldo a favor)</option>
            {clientes.map((c, idx) => <option key={c.id||idx} value={idx}>{c.nombre} — ${ (c.credit||0).toFixed ? (c.credit||0).toFixed(2) : Number(c.credit||0).toFixed(2) }</option>)}
          </select>
        </div>
        <input className="input" placeholder="Monto" value={quickPayAmount} onChange={e=>setQuickPayAmount(e.target.value)} style={{ width:140 }} />
        <select className="input" value={quickPayMethod} onChange={e=>setQuickPayMethod(e.target.value)} style={{ width:160 }}>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="tarjeta">Tarjeta</option>
        </select>
        <button className="btn bg-blue-600 text-white" onClick={(e)=>{ e.preventDefault(); quickRegisterAdvance() }}>Registrar saldo a favor</button>
      </div>

      {/* Tabla */}
      {clientsWithTotals.length === 0 ? (
        <p className="text-gray-500 italic">No hay clientes registrados todavía.</p>
      ) : (
        <table className="w-full border-collapse shadow rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="border p-2">Nombre</th>
              <th className="border p-2">Teléfono</th>
              <th className="border p-2">Deuda</th>
              <th className="border p-2">Pagado</th>
              <th className="border p-2">Pendiente</th>
              <th className="border p-2">% Pagado</th>
              <th className="border p-2">Saldo a favor</th>
              <th className="border p-2">Estado</th>
              <th className="border p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientsWithTotals.map((c, i) => {
              // determinar estado general
              const hasOverdue = (c.movimientos || []).some(m => {
                const total = Number(m.amount || 0)
                const paid = (m.payments || []).reduce((s,p)=> s + Number(p.amount||0), 0)
                const restante = Math.max(0, total - paid)
                if (!m.dueDate) return false
                return restante > 0 && isAfterDue(new Date(), m.dueDate)
              })
              const nextDueSoon = (c.movimientos || []).some(m => {
                if(!m.dueDate) return false
                const due = new Date(m.dueDate)
                const now = new Date()
                const diff = (due - now) / (1000*60*60*24)
                return diff >=0 && diff <= 3 && ( (m.payments||[]).reduce((s,p)=> s + Number(p.amount||0),0) < Number(m.amount||0) )
              })
              const estadoBadge = hasOverdue ? { text: 'VENCIDO', color: '#c62828' } : (c.totals.pending <= 0 ? { text: 'PAGADO', color: '#2e7d32' } : (nextDueSoon ? { text: 'POR VENCER', color: '#f59e0b' } : { text: 'OK', color: '#1976d2' }))
              return (
                <tr key={c.id || i} className="text-center border hover:bg-gray-50">
                  <td className="border p-2 text-left">{c.nombre}</td>
                  <td className="border p-2">{c.telefono}</td>
                  <td className={`border p-2 ${c.totals.totalDebt > (c.limite||0) ? 'text-red-600 font-bold' : ''}`}>${c.totals.totalDebt.toFixed(2)}</td>
                  <td className="border p-2">${c.totals.totalPaid.toFixed(2)}</td>
                  <td className="border p-2">${c.totals.pending.toFixed(2)}</td>
                  <td className="border p-2"><span className="px-2 py-1 rounded" style={{ background: c.totals.percent>=100? '#d1fae5' : '#eef2ff'}}>{c.totals.percent}%</span></td>
                  <td className="border p-2">${Number(c.totals.credit||0).toFixed(2)}</td>
                  <td className="border p-2"><span style={{ background: estadoBadge.color.replace('#',''), color:'#fff', padding:'4px 8px', borderRadius:6, backgroundColor: estadoBadge.color }}>{estadoBadge.text}</span></td>
                  <td className="border p-2 flex justify-center gap-2">
                    <button onClick={() => openEditClient(i)} className="bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">⚙️ Detalles</button>
                    <button onClick={() => { setQuickPayClientIndex(i); setQuickPayAmount(''); }} className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">💰 Pago rápido</button>
                    <button onClick={() => exportHistoryCSV(i)} className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700">⬇️ CSV</button>
                    <button onClick={() => eliminarCliente(i)} className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">🗑 Eliminar</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Modal de edición/detalle de cliente */}
      {editingClientIndex != null && (
        <div className="modal">
          <div className="card" style={{ maxWidth: 1000 }}>
            <h3>Cliente — {editingClient?.nombre} </h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <h4>Datos</h4>
                <label>Nombre</label>
                <input className="input" value={editingClient?.nombre || ''} onChange={e=>setEditingClient(prev=>({...prev, nombre: e.target.value}))} />
                <label>Teléfono</label>
                <input className="input" value={editingClient?.telefono || ''} onChange={e=>setEditingClient(prev=>({...prev, telefono: e.target.value}))} />
                <label>Dirección</label>
                <input className="input" value={editingClient?.direccion || ''} onChange={e=>setEditingClient(prev=>({...prev, direccion: e.target.value}))} />
                <label>Límite de crédito</label>
                <input className="input" type="number" value={editingClient?.limite || 0} onChange={e=>setEditingClient(prev=>({...prev, limite: Number(e.target.value)}))} />
                <div style={{ marginTop: 8 }} className="small">Deuda actual: ${ (clientes[editingClientIndex]?.deuda || 0).toFixed(2) }</div>
                <div style={{ marginTop: 8 }} className="small">Saldo a favor: ${ Number(clientes[editingClientIndex]?.credit || 0).toFixed(2) }</div>
                <div style={{ display:'flex', gap:8, marginTop:12 }}>
                  <button className="btn" onClick={saveEditedClient}>Guardar</button>
                  <button className="btn" onClick={cancelEditClient}>Cerrar</button>
                </div>
              </div>
              <div style={{ width: 620 }}>
                <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                  <button className={`btn ${tab==='movimientos' ? 'bg-indigo-600 text-white' : ''}`} onClick={()=>setTab('movimientos')}>Movimientos</button>
                  <button className={`btn ${tab==='historial' ? 'bg-indigo-600 text-white' : ''}`} onClick={()=>setTab('historial')}>Historial</button>
                </div>

                {tab === 'movimientos' && (
                  <div>
                    <DebtEntryForm clientIndex={editingClientIndex} onAdd={(data)=>{ addDebtEntry(editingClientIndex, data) }} />
                    <div style={{ marginTop: 12 }}>
                      {(clientes[editingClientIndex]?.movimientos || []).length === 0 ? (
                        <p>No hay movimientos registrados.</p>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
                          {(clientes[editingClientIndex]?.movimientos || []).map(entry => {
                            const total = Number(entry.amount||0)
                            const paid = (entry.payments||[]).reduce((s,p)=> s + Number(p.amount||0), 0)
                            const restante = Math.max(0, total - paid)
                            const due = entry.dueDate ? new Date(entry.dueDate) : null
                            const daysLeft = due ? Math.ceil((due - new Date())/(1000*60*60*24)) : null
                            const estado = restante <= 0 ? 'Pagado' : (due && due < new Date() ? 'Vencido' : (daysLeft !== null && daysLeft <=3 ? 'Por vencer' : 'Pendiente'))
                            return (
                              <div key={entry.id} style={{ border: '1px solid #eee', padding: 8, borderRadius: 6, background: estado === 'Vencido' ? '#fff1f0' : (estado==='Por vencer' ? '#fff7ed' : '#ffffff') }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                  <div>
                                    <div><strong>Monto: ${(total).toFixed(2)}</strong> — Pagado: ${(paid).toFixed(2)} — Restante: ${(restante).toFixed(2)}</div>
                                    <div className="small">Tomado: {entry.dateTaken}</div>
                                    <div className="small">Vence: {entry.dueDate || '-' } { daysLeft !== null ? `(${daysLeft}d)` : '' }</div>
                                    <div className="small">Nota: {entry.note || '-'}</div>
                                  </div>
                                  <div style={{ display:'flex', gap:8 }}>
                                    <button className="btn" onClick={()=>{ toggleEntryActive(editingClientIndex, entry.id) }}>{entry.active ? 'Desactivar' : 'Activar'}</button>
                                    <button className="btn" onClick={()=>{ updateEntry(editingClientIndex, entry.id, { dueDate: prompt('Nueva fecha (YYYY-MM-DD)', entry.dueDate || '') || entry.dueDate }) }}>Editar vencimiento</button>
                                    <button className="btn" onClick={()=>{ if(confirm('Marcar como listo para retiro?')) updateEntry(editingClientIndex, entry.id, { readyForPickup: true }) }}>Listo para retirar</button>
                                    <button className="btn" style={{ background:'#2e7d32', color:'#fff' }} onClick={()=>{ if(confirm('Marcar como retirado?')) updateEntry(editingClientIndex, entry.id, { withdrawn: true }) }}>Marcar retirado</button>
                                    <button className="btn" style={{ background:'#e74c3c' }} onClick={()=>{ if(confirm('Eliminar movimiento?')) removeEntry(editingClientIndex, entry.id) }}>Eliminar</button>
                                  </div>
                                </div>
                                <div style={{ marginTop:8 }}>
                                  <PaymentsList clientIndex={editingClientIndex} entry={entry} onPay={(p)=> registerPaymentForEntry(editingClientIndex, entry.id, p)} bankAccounts={bankAccounts} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {tab === 'historial' && (
                  <div>
                    <h4>Historial (movimientos + pagos)</h4>
                    <button className="btn" onClick={()=> exportHistoryCSV(editingClientIndex)}>Exportar CSV</button>
                    <div style={{ marginTop:12 }}>
                      {(clientes[editingClientIndex]?.movimientos || []).length === 0 ? <p>No hay historial.</p> : (
                        <ul>
                          {(clientes[editingClientIndex]?.movimientos || []).map(m => (
                            <li key={m.id} style={{ marginBottom:8 }}>
                              <div><strong>Movimiento:</strong> ${Number(m.amount||0).toFixed(2)} — Vence: {m.dueDate || '-'}</div>
                              <div className="small">Notas: {m.note || '-'}</div>
                              <div style={{ marginTop:6 }}>
                                {(m.payments||[]).map(p => (
                                  <div key={p.id} className="small">{new Date(p.date).toLocaleString()} — ${Number(p.amount).toFixed(2)} — {p.method}</div>
                                ))}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', right:20, bottom:20, minWidth:240, zIndex:9999 }}>
          <div className={`p-3 rounded shadow`} style={{ background: toast.type === 'success' ? '#16a34a' : (toast.type==='error' ? '#dc2626' : '#f59e0b'), color:'#fff' }}>{toast.text}</div>
        </div>
      )}
    </div>
  );
};

export default Fiados;
