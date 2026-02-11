import React from 'react'

export default function LowStockList({ products = [], limit = 5 }){
  const items = (products || []).slice().sort((a,b)=> (Number(a.stock||a.cantidad||a.qty||0) - Number(b.stock||b.cantidad||b.qty||0))).slice(0, limit)
  return (
    <div className="card" style={{ padding:12 }}>
      <h4>Productos con stock bajo</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th>Producto</th>
            <th>Stock</th>
            <th>En mínimo?</th>
          </tr>
        </thead>
        <tbody>
          {items.map(p => (
            <tr key={p.id || p.sku || p.name}>
              <td style={{ padding: '8px 6px' }}>{p.name || p.title || ''}</td>
              <td style={{ padding: '8px 6px' }}>{p.stock ?? p.cantidad ?? p.qty ?? 0}</td>
              <td style={{ padding: '8px 6px' }}>{(p.minimo !== undefined && p.minimo !== null) ? ( (Number(p.stock||0) <= Number(p.minimo||0)) ? 'Sí' : 'No') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
