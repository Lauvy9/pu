import React from 'react'

export default function ProductList({products, onEdit, onDelete, ofertas = [], onAddOffer, onRemoveOffer}){
  return (
    <div className="card">
      <h3>Listado de Productos</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Característica</th>
            <th>Unidad</th>
            <th>Costo</th>
            <th>% Mayorista</th>
            <th>Mayorista</th>
            <th>% Minorista</th>
            <th>Minorista</th>
            <th>Stock</th>
            <th>Ofertas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
            {products.map(p=> 
              <ProductRow key={p.id} p={p} onEdit={onEdit} onDelete={onDelete} ofertas={ofertas} onAddOffer={onAddOffer} onRemoveOffer={onRemoveOffer} />
            )}
          </tbody>
      </table>
    </div>
  )
}

function ProductRow({ p, onEdit, onDelete, ofertas, onAddOffer, onRemoveOffer }) {
  const oferta = ofertas.find(o => o.id === p.id)
  const [editingOferta, setEditingOferta] = React.useState(false)
  const [pct, setPct] = React.useState(oferta ? oferta.ofertaPct : 10)

  return (
    <tr>
      <td>{p.name}</td>
      <td>{p.caracteristica}</td>
      <td>{((p.businessUnit === 'muebleria' || p.businessUnit === 'mobileria') && 'Mueblería') || (p.businessUnit === 'vidrieria' && 'Vidriería') || 'No especificado'}</td>
      <td>${(p.cost ?? 0).toFixed(2)}</td>
      <td>{p.porcentajeGananciaMayorista ?? p.pct_mayor ?? 50}%</td>
      <td>${(p.price_mayor ?? 0).toFixed(2)}</td>
      <td>{p.porcentajeGananciaMinorista ?? p.pct_minor ?? 60}%</td>
      <td>${(p.price_minor ?? 0).toFixed(2)}</td>
      <td>{p.stock}</td>
      <td>
        {oferta && oferta.activo ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="small">{oferta.ofertaPct}%</div>
            <button className="btn" style={{ background:'#e74c3c' }} onClick={() => onRemoveOffer && onRemoveOffer(p.id)}>Quitar</button>
          </div>
        ) : (
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {editingOferta ? (
              <>
                <input type="number" value={pct} onChange={e=>setPct(Number(e.target.value))} style={{ width: 80 }} />
                <button className="btn" onClick={()=>{ onAddOffer && onAddOffer(p.id, pct); setEditingOferta(false) }}>Agregar</button>
                <button className="btn" onClick={()=>setEditingOferta(false)}>Cancelar</button>
              </>
            ) : (
              <button className="btn" onClick={()=>setEditingOferta(true)}>Agregar a ofertas</button>
            )}
          </div>
        )}
      </td>
      <td>
        <button
          style={{ background: 'green', color: 'white', marginRight: 4 }}
          onClick={() => onEdit(p)}
        >
          Editar
        </button>
        <button
          style={{ background: 'red', color: 'white' }}
          onClick={() => onDelete(p.id)}
        >
          Eliminar
        </button>
      </td>
    </tr>
  )
}