import React, { useState, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import ProductForm from '../components/ProductForm'
import ProductList from '../components/ProductList'
import { formatARS } from '../utils/formatCurrency'
import { saveProduct, saveOffer } from '../services/firestoreService'

export default function Inventory() {
  const { products, actions } = useStore()
  const USE_API = false;
  // helper para persistir ofertas sin bloquear la UI
  async function awaitSaveOffer(o) { try { await saveOffer(o) } catch (e) { console.warn('saveOffer error', e) } }
  async function loadProductsFromAPI() {
  if (!USE_API) return
  try {
    const res = await fetch("http://localhost:4000/api/products")
    const data = await res.json()

    if (Array.isArray(data)) {
      data.forEach(p => actions.addProduct(p))
    }
  } catch (err) {
    console.error("Error cargando productos desde API", err)
  }
}
useEffect(() => {
  if (USE_API && (!products || products.length === 0)) {
    loadProductsFromAPI()
  }
}, [])
  const [query, setQuery] = useState('')
  const [ofertas, setOfertas] = useState(() => {
    try {
      const data = localStorage.getItem('vid_ofertas')
      return data ? JSON.parse(data) : []
    } catch (e) { return [] }
  })

  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({
    name: '',
    caracteristica: '',
    stock: 0,
    cost: 0,
    porcentajeGananciaMinorista: 60,
    porcentajeGananciaMayorista: 50
  })

  // -------------------------
// AGREGAR PRODUCTO (UI)
// -------------------------
async function handleAdd(product) {
  // Añadir localmente primero para que aparezca en la UI inmediatamente
  try {
    const provisional = actions.addProduct(product)

    // Intentar persistir en API en background y reconciliar si retorna datos con id
    if (USE_API) {
      try {
        const res = await fetch('http://localhost:4000/api/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product)
        })
        if (res.ok) {
          const data = await res.json()
          // Si el API responde con una representación más completa o id diferente, actualizar
          if (data && data.id && String(data.id) !== String(provisional.id)) {
            try { actions.updateProduct(provisional.id, { id: data.id, ...data }) } catch(e) { console.warn('reconcile addProduct id update failed', e) }
          } else if (data) {
            try { actions.updateProduct(provisional.id, data) } catch(e) { /* ignore */ }
          }
          // Intentar guardar en Firestore con la versión final
          if (import.meta.env.VITE_USE_FIRESTORE === 'true') {
            try { await saveProduct(data || provisional) } catch (e) { console.warn('saveProduct failed', e) }
          }
        } else {
          console.warn('API add product returned not ok', res.status)
          // También intentar guardar provisional en Firestore
          if (import.meta.env.VITE_USE_FIRESTORE === 'true') {
            try { await saveProduct(provisional) } catch (e) { console.warn('saveProduct failed', e) }
          }
        }
      } catch (err) {
        console.error('Error calling products API (background), product added locally', err)
        if (import.meta.env.VITE_USE_FIRESTORE === 'true') {
          try { await saveProduct(provisional) } catch (e) { console.warn('saveProduct failed', e) }
        }
      }
    } else {
      // API disabled: sólo usar el estado local (actions.addProduct ya ejecutado)
    }
  } catch (err) {
    console.error('Error adding product locally', err)
  }
}

// -------------------------
// EDITAR PRODUCTO (ABRIR MODAL)
// -------------------------
function handleEdit(product) {
  setEditing(product)
  setEditData({
    name: product.name,
    caracteristica: product.caracteristica || '',
    businessUnit: product.businessUnit || '',
    stock: product.stock,
    cost: product.cost ?? 0,
    porcentajeGananciaMinorista: product.porcentajeGananciaMinorista ?? 60,
    porcentajeGananciaMayorista: product.porcentajeGananciaMayorista ?? 50
  })
}
// -------------------------
// AGREGAR PRODUCTO (UI)
// -------------------------
// AGREGAR PRODUCTO (UI)
// -------------------------
// (duplicate removed - handled by single handleAdd above)

// -------------------------
// EDITAR PRODUCTO (ABRIR MODAL)
// -------------------------
function handleEdit(product) {
  setEditing(product)
  setEditData({
    name: product.name,
    caracteristica: product.caracteristica || '',
    businessUnit: product.businessUnit || '',
    stock: product.stock,
    cost: product.cost ?? 0,
    porcentajeGananciaMinorista: product.porcentajeGananciaMinorista ?? 60,
    porcentajeGananciaMayorista: product.porcentajeGananciaMayorista ?? 50
  })
}

// -------------------------
// INPUT DEL FORM EDIT
// -------------------------
function handleEditChange(e) {
  const { name, value } = e.target
  setEditData(prev => ({
    ...prev,
    [name]:
      name === 'stock' ||
      name === 'cost' ||
      name.startsWith('porcentaje')
        ? Number(value)
        : value
  }))
}

// -------------------------
// GUARDAR EDICIÓN
// -------------------------
function handleEditSubmit(e) {
  e.preventDefault()
  const cost = editData.cost
  const price_minor = Number((cost * (1 + editData.porcentajeGananciaMinorista / 100)).toFixed(2))
  const price_mayor = Number((cost * (1 + editData.porcentajeGananciaMayorista / 100)).toFixed(2))

  actions.updateProduct(editing.id, {
    name: editData.name,
    caracteristica: editData.caracteristica,
    businessUnit: editData.businessUnit || undefined,
    stock: editData.stock,
    cost,
    porcentajeGananciaMinorista: editData.porcentajeGananciaMinorista,
    porcentajeGananciaMayorista: editData.porcentajeGananciaMayorista,
    price_minor,
    price_mayor
  })

  setEditing(null)
}

// -------------------------
// ELIMINAR PRODUCTO
// -------------------------
function handleDelete(id) {
  if (window.confirm('Eliminar producto?')) {
    actions.removeProduct(id)
  }
}



  // -------------------------
  // ELIMINAR PRODUCTO
  // -------------------------
  function handleDelete(id) {
    if (window.confirm('Eliminar producto?')) {
      actions.removeProduct(id)
    }
  }

  // -------------------------
  // OFERTAS
  // -------------------------
  function saveOfertas(next) {
    setOfertas(next)
    try { localStorage.setItem('vid_ofertas', JSON.stringify(next)) } catch (e) { }
  }

  function addOfferForProduct(prodId, ofertaPct) {
    const prod = products.find(p => p.id === prodId)
    if (!prod) return alert('Producto no encontrado')

    const precioBase = prod.price_minor ?? prod.price ?? prod.cost ?? 0
    const precioOferta = Number(
      (precioBase * (1 - (Number(ofertaPct) || 0) / 100)).toFixed(2)
    )

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
      const next = ofertas.map(o => (o.id === prodId ? { ...o, ...nuevo } : o))
      saveOfertas(next)
    } else {
      saveOfertas([...ofertas, nuevo])
    }

    // Persistir oferta individualmente si Firestore habilitado
    if (import.meta.env.VITE_USE_FIRESTORE === 'true') {
      awaitSaveOffer(nuevo).catch(e => console.warn('saveOffer failed', e))
    }

    alert('Producto agregado/actualizado en ofertas')
  }

  function removeOfferForProduct(prodId) {
    const idx = ofertas.findIndex(o => o.id === prodId)
    if (idx === -1) return alert('Producto no está en ofertas')

    const now = new Date().toISOString()
    const next = ofertas.map(o =>
      o.id === prodId ? { ...o, activo: false, removedAt: now } : o
    )
    saveOfertas(next)
    if (import.meta.env.VITE_USE_FIRESTORE === 'true') {
      const off = next.find(o => o.id === prodId)
      if (off) awaitSaveOffer(off).catch(e => console.warn('saveOffer failed', e))
    }
    alert('Producto marcado como no activo en ofertas')
  }

  function handleCancelEdit() {
    setEditing(null)
  }


  const productosFiltrados = products.filter(p =>
  !query || (p.name || '').toLowerCase().includes(query.toLowerCase())
)

const productosVidrieria = productosFiltrados.filter(
  p => p.businessUnit === 'vidrieria'
)

const productosMuebleria = productosFiltrados.filter(
  p => p.businessUnit === 'muebleria'
)

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <div className="grid">

      <div>
        <div style={{ marginBottom: 8 }}>
          <input
            className="input"
            placeholder="Buscar productos"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <ProductForm onAdd={handleAdd} />
      </div>

      <div className="space-y-10">


  {/* VIDRIERÍA */}
  <div>
    <h3 className="text-xl font-bold mb-2">Vidriería</h3>

    <ProductList
      products={productosVidrieria}
      onEdit={handleEdit}
      onDelete={handleDelete}
      ofertas={ofertas}
      onAddOffer={addOfferForProduct}
      onRemoveOffer={removeOfferForProduct}
    />
  </div>

  {/* MUEBLERÍA */}
  <div>
    <h3 className="text-xl font-bold mb-2">Mueblería</h3>

    <ProductList
      products={productosMuebleria}
      onEdit={handleEdit}
      onDelete={handleDelete}
      ofertas={ofertas}
      onAddOffer={addOfferForProduct}
      onRemoveOffer={removeOfferForProduct}
    />
  </div>
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
              Costo:
              <input
                name="cost"
                type="number"
                value={editData.cost}
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

            <label>
              Unidad de negocio:
              <select name="businessUnit" value={editData.businessUnit || ''} onChange={handleEditChange} required>
                <option value="">Seleccionar unidad</option>
                <option value="muebleria">Mueblería</option>
                <option value="vidrieria">Vidriería</option>
              </select>
            </label>

            <button type="submit">Guardar</button>
            <button type="button" onClick={handleCancelEdit}>
              Cancelar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
