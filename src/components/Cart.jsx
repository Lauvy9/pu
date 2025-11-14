import React from 'react'
import { formatCurrency } from '../utils/helpers'

export default function Cart({items, onInc, onDec, total, onFinish}){
  const accent = (typeof window !== 'undefined' && localStorage.getItem('cart_accent')) || '#ff9800'
  const bg = lightenAccent(accent, 0.9)
  return (
    <div className="card" style={{ borderLeft: `6px solid ${accent}`, background: bg }}>
      <h3 style={{ color: accent }}>Carrito</h3>
      {items.length===0 && <p className="small">No hay productos en el carrito</p>}
      <table className="table">
        <thead><tr><th>Producto</th><th>Cant</th><th>Precio</th><th>Subtotal</th><th>Acc.</th></tr></thead>
        <tbody>
          {items.map(it=> (
            <tr key={it.id} style={{ background: '#fff3e0' }}>
              <td style={{ fontWeight: 600 }}>{it.name}</td>
              <td>{it.qty}</td>
              <td>{formatCurrency(it.price)}</td>
              <td>{formatCurrency(it.price * it.qty)}</td>
              <td>
                <button className="btn ghost" onClick={()=>onDec(it.id)}>-</button>
                <button className="btn" onClick={()=>onInc(it.id)}>+</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <strong>Total: </strong> {formatCurrency(total)}
        </div>
        <div>
          <button className="btn" onClick={onFinish} disabled={items.length===0}>Finalizar Venta</button>
        </div>
      </div>
    </div>
  )
}

function lightenAccent(hex, factor=0.9){
  try{
    const c = hex.replace('#','')
    const num = parseInt(c,16)
    let r = (num >> 16) & 0xff
    let g = (num >> 8) & 0xff
    let b = num & 0xff
    r = Math.round(r + (255 - r) * factor)
    g = Math.round(g + (255 - g) * factor)
    b = Math.round(b + (255 - b) * factor)
    return `rgb(${r}, ${g}, ${b})`
  }catch(e){ return '#fff8e1' }
}