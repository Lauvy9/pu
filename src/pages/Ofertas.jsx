import React, { useState, useEffect } from "react";
import { useStore } from '../context/StoreContext'

export default function Ofertas() {
  const { products } = useStore()
  const [ofertas, setOfertas] = useState(() => {
    try{ const data = localStorage.getItem('vid_ofertas'); return data ? JSON.parse(data) : [] }catch(e){ return [] }
  })

  useEffect(() => {
    try{ localStorage.setItem('vid_ofertas', JSON.stringify(ofertas)) }catch(e){}
  }, [ofertas])

  function toggleActivate(id){
    setOfertas(prev => prev.map(o => o.id === id ? { ...o, activo: !o.activo, activatedAt: (!o.activo ? new Date().toISOString() : o.activatedAt) } : o))
  }

  function remove(id){
    if(!confirm('Quitar producto de la lista de ofertas?')) return
    setOfertas(prev => prev.filter(o => o.id !== id))
  }

  return (
    <div className="card">
      <h2>Productos en Oferta</h2>
      {ofertas.length === 0 ? (
        <p>No hay productos en oferta.</p>
      ) : (
        <ul>
          {ofertas.map(o => {
            const prod = products.find(p => p.id === o.id)
            return (
              <li key={o.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{o.name || prod?.name || 'Producto'}</strong>
                    <div className="small">Precio original: ${Number(o.precioOriginal || prod?.price_minor || prod?.price || 0).toFixed(2)}</div>
                    <div className="small">Precio oferta: ${Number(o.precioOferta).toFixed(2)} — {o.ofertaPct}%</div>
                    <div className="small">Fecha: {o.fecha ? new Date(o.fecha).toLocaleString() : (o.activatedAt ? new Date(o.activatedAt).toLocaleString() : '-')}</div>
                    <div className="small">Estado: {o.activo ? 'Activo' : 'No activo'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" onClick={()=>toggleActivate(o.id)}>{o.activo ? 'Desactivar' : 'Activar'}</button>
                    <button className="btn" style={{ background:'#e74c3c' }} onClick={()=>remove(o.id)}>Eliminar</button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
