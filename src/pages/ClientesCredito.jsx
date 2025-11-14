import React, { useContext, useState, useEffect } from 'react'
import { FiadosContext } from '../context/FiadosContext'

export default function ClientesCredito(){
  const { clientes, setClientes } = useContext(FiadosContext)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoTelefono, setNuevoTelefono] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [limite, setLimite] = useState(0)
  const [vencimiento, setVencimiento] = useState('')

  useEffect(()=>{
    // simple scanner for alerts - not a scheduler
  }, [clientes])

  function agregarCliente(){
    if(!nuevoNombre) return alert('Nombre requerido')
    const c = { id: Date.now(), nombre: nuevoNombre, telefono: nuevoTelefono, email: nuevoEmail, limite_credito: Number(limite) || 0, fecha_vencimiento: vencimiento || null, movimientos: [], score: 'Paga a tiempo' }
    setClientes([...(clientes||[]), c])
    setNuevoNombre(''); setNuevoTelefono(''); setNuevoEmail(''); setLimite(0); setVencimiento('')
  }

  function markPayment(clienteId, amount){
    const cl = clientes.find(c=>c.id===clienteId)
    if(!cl) return
    cl.movimientos.push({ tipo: 'pago', monto: amount, fecha: new Date().toISOString() })
    // simple score calc
    cl.score = 'Paga a tiempo'
    setClientes([...clientes])
  }

  function checkAlerts(c){
    if(!c.fecha_vencimiento) return null
    const due = new Date(c.fecha_vencimiento)
    const dueEnd = new Date(due)
    dueEnd.setHours(23,59,59,999)
    const today = new Date()
    const diff = Math.ceil((dueEnd - today)/(1000*60*60*24))
    if(diff < 0) return 'Moroso'
    if(diff <=3) return 'Vence pronto'
    return null
  }

  return (
    <div className="grid">
      <div className="card">
        <h3>Clientes con Crédito</h3>
        <input className="input" placeholder="Nombre" value={nuevoNombre} onChange={e=>setNuevoNombre(e.target.value)} />
        <input className="input" placeholder="Teléfono" value={nuevoTelefono} onChange={e=>setNuevoTelefono(e.target.value)} />
        <input className="input" placeholder="Email" value={nuevoEmail} onChange={e=>setNuevoEmail(e.target.value)} />
        <input className="input" placeholder="Límite de crédito" type="number" value={limite} onChange={e=>setLimite(e.target.value)} />
        <input className="input" placeholder="Fecha vencimiento" type="date" value={vencimiento} onChange={e=>setVencimiento(e.target.value)} />
        <div style={{marginTop:8}}>
          <button className="btn" onClick={agregarCliente}>Agregar cliente</button>
        </div>
      </div>

      <div className="card" style={{gridColumn:'1 / -1'}}>
        <h3>Lista de Clientes</h3>
        <table className="table">
          <thead><tr><th>Nombre</th><th>Tel</th><th>Email</th><th>Límite</th><th>Vencimiento</th><th>Score</th><th>Alertas</th></tr></thead>
          <tbody>
            {(clientes||[]).map(c=> (
              <tr key={c.id} style={{backgroundColor: checkAlerts(c)==='Moroso' ? '#F8BBD0' : checkAlerts(c)==='Vence pronto' ? '#FFF9C4' : 'transparent'}}>
                <td>{c.nombre}</td>
                <td>{c.telefono}</td>
                <td>{c.email}</td>
                <td>{c.limite_credito}</td>
                <td>{c.fecha_vencimiento || '-'}</td>
                <td>{c.score || '-'}</td>
                <td>{checkAlerts(c) || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
