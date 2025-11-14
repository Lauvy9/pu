import React, { useState } from 'react'
import { useStore } from '../context/StoreContext'
import ProductForm from '../components/ProductForm'
import ProductList from '../components/ProductList'

export default function Inventory(){
  const {products, actions} = useStore()
  const [query, setQuery] = useState('')
  const [ofertas, setOfertas] = useState(()=>{
    try{
      const data = localStorage.getItem('vid_ofertas')
      return data ? JSON.parse(data) : []
    }catch(e){ return [] }
  })
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({ name: '', caracteristica: '', stock: 0, price: 0, porcentajeGananciaMinorista: 60, porcentajeGananciaMayorista: 50 })

  function handleAdd(p){
    actions.addProduct(p)
  }

  function handleEdit(p){
    setEditing(p)
    setEditData({
      name: p.name,
      caracteristica: p.caracteristica || '',
      stock: p.stock,
      price: p.cost || p.price,
      porcentajeGananciaMinorista: p.porcentajeGananciaMinorista ?? p.pct_minor ?? 60,
      porcentajeGananciaMayorista: p.porcentajeGananciaMayorista ?? p.pct_mayor ?? 50
    })
  }

  function handleEditChange(e) {
    const { name, value } = e.target
    setEditData(prev => ({
      ...prev,
      [name]: name === 'stock' || name === 'price' || name.startsWith('porcentaje') ? Number(value) : value
    }))
  }

  function handleEditSubmit(e) {
    e.preventDefault()
    actions.updateProduct(editing.id, {
      ...editData,
      cost: editData.price, // Asegura que el costo se actualiza
      porcentajeGananciaMinorista: editData.porcentajeGananciaMinorista,
      porcentajeGananciaMayorista: editData.porcentajeGananciaMayorista
    })
    setEditing(null)
  }

  function handleDelete(id){
    if(window.confirm('Eliminar producto?')) actions.removeProduct(id)
  }

  function saveOfertas(next){
    setOfertas(next)
    try{ localStorage.setItem('vid_ofertas', JSON.stringify(next)) }catch(e){}
  }

  function addOfferForProduct(prodId, ofertaPct){
    const prod = products.find(p=>p.id === prodId)
    if(!prod) return alert('Producto no encontrado')
    const precioBase = prod.price_minor ?? prod.price ?? prod.cost ?? 0
    const precioOferta = Number((precioBase * (1 - (Number(ofertaPct) || 0)/100)).toFixed(2))
    const now = new Date().toISOString()
    const existing = ofertas.find(o => o.id === prodId)
    const nuevo = {
      id: prodId,
      name: prod.name,
      ofertaPct: Number(ofertaPct) || 0,
      precioOriginal: precioBase,
      precioOferta,
      fecha: now,
      activo: true,
      activatedAt: now,
      removedAt: null
    }
    if (existing) {
      // replace and set active
      const next = ofertas.map(o => o.id === prodId ? { ...o, ...nuevo } : o)
      saveOfertas(next)
    } else {
      saveOfertas([ ...ofertas, nuevo ])
    }
    alert('Producto agregado/actualizado en ofertas')
  }

  function removeOfferForProduct(prodId){
    const idx = ofertas.findIndex(o => o.id === prodId)
    if (idx === -1) return alert('Producto no está en ofertas')
    const now = new Date().toISOString()
    const next = ofertas.map(o => o.id === prodId ? { ...o, activo: false, removedAt: now } : o)
    saveOfertas(next)
    alert('Producto marcado como no activo en ofertas')
  }

  function handleCancelEdit() {
    setEditing(null)
  }

  return (
    <div className="grid">
      {import.meta.env.VITE_USE_FIRESTORE === 'true' && (
        <div style={{ gridColumn: '1 / -1', marginBottom: 8 }}>
          <button className="btn" onClick={async ()=>{
            const res = await actions.syncProductsToFirestore()
            if (!res.ok) alert('Sync failed: '+(res.error||'unknown'))
            else alert('Productos sincronizados')
          }}>Sincronizar productos a Firestore</button>
        </div>
      )}
      <div>
          <div style={{ marginBottom: 8 }}>
            <input className="input" placeholder="Buscar productos" value={query} onChange={e=>setQuery(e.target.value)} />
          </div>
          <ProductForm onAdd={handleAdd} />
      </div>
      <div>
          <ProductList
            products={products.filter(p => !query || (p.name||'').toLowerCase().includes(query.toLowerCase()))}
            onEdit={handleEdit}
            onDelete={handleDelete}
            ofertas={ofertas}
            onAddOffer={addOfferForProduct}
            onRemoveOffer={removeOfferForProduct}
          />
      </div>
      {editing && (
        <div className="modal">
          <form onSubmit={handleEditSubmit} className="edit-form">
            <h3>Editar producto</h3>
            <label>
              Nombre:
              <input
                name="name"
                value={editData.name}
                onChange={handleEditChange}
                required
              />
            </label>
            <label>
              Característica:
              <input
                name="caracteristica"
                value={editData.caracteristica}
                onChange={handleEditChange}
                required
              />
            </label>
            <label>
              Stock:
              <input
                name="stock"
                type="number"
                value={editData.stock}
                onChange={handleEditChange}
                required
                min={0}
              />
            </label>
            <label>
              Precio:
              <input
                name="price"
                type="number"
                value={editData.price}
                onChange={handleEditChange}
                required
                min={0}
                step="0.01"
              />
            </label>
            <label>
              % Ganancia minorista:
              <input
                name="porcentajeGananciaMinorista"
                type="number"
                value={editData.porcentajeGananciaMinorista}
                onChange={handleEditChange}
                min={0}
                step="0.1"
              />
            </label>
            <label>
              % Ganancia mayorista:
              <input
                name="porcentajeGananciaMayorista"
                type="number"
                value={editData.porcentajeGananciaMayorista}
                onChange={handleEditChange}
                min={0}
                step="0.1"
              />
            </label>
            <button type="submit">Guardar</button>
            <button type="button" onClick={handleCancelEdit}>Cancelar</button>
          </form>
        </div>
      )}
    </div>
  )
}