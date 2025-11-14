import React from 'react'
import { formatCurrency } from '../utils/helpers'

export default function ProductRow({p, onEdit, onDelete}){
  const low = p.stock <= (p.minStock ?? 1)
  return (
    <tr style={{background: low ? '#fff6f6' : 'transparent'}}>
      <td>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <strong>{p.name}</strong>
          {low && <span className="badge">Stock bajo</span>}
        </div>
      </td>
      <td>{formatCurrency(p.cost)}</td>
      <td>{formatCurrency(p.price_mayor)}</td>
      <td>{formatCurrency(p.price_minor)}</td>
      <td>{p.stock}</td>
      <td>
        <button className="btn ghost" onClick={()=>onEdit(p)}>Editar</button>
        <button className="btn" onClick={()=>onDelete(p.id)}>Eliminar</button>
      </td>
    </tr>
  )
}