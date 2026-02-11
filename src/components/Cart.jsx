import React, { useState } from 'react'
import { formatCurrency } from '../utils/helpers'

export default function Cart({items, onInc, onDec, total, onFinish, stockByProductId, onToggleOffer}){
  const accent = (typeof window !== 'undefined' && localStorage.getItem('cart_accent')) || '#ff9800'
  const bg = lightenAccent(accent, 0.9)
  const [error, setError] = useState(null)

  return (
    <div className="card" style={{ borderLeft: `6px solid ${accent}`, background: bg }}>
      <h3 style={{ color: accent }}>Carrito</h3>

      {items.length === 0 && (
        <p className="small">No hay productos en el carrito</p>
      )}

      {error && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cant</th>
            <th>Precio</th>
            <th>Subtotal</th>
            <th>Acc.</th>
          </tr>
        </thead>

        <tbody>
          {items.map((it, idx) => {
            // Detectar si hay duplicados por nombre
            const duplicates = items.filter(x => x.name === it.name).length > 1
            const stock = stockByProductId ? stockByProductId(it.id) : 0
            const isService = String(it.id || '').startsWith('svc_') || it.productoId === null || it._kind === 'service'
            return (
              <tr key={it.id} style={{ background: isService ? '#fff0f6' : '#fff3e0' }}>
                <td style={{ fontWeight: 600 }}>
                  {it.name}
                  {duplicates ? <div style={{ fontSize: '0.75rem', color: '#999' }}>ID: {it.id}</div> : null}
                  {isService ? (
                    <>
                      {it.tipoServicio && <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 4 }}>
                        Rubro: {(() => { const t = (it.tipoServicio || '').toString().toLowerCase(); return t.includes('vid') ? 'Vidriería' : (t.includes('mue') || t.includes('mobi') ? 'Mueblería' : it.tipoServicio); })()}
                      </div>}
                      {it.unidad && <div style={{ fontSize: '0.75rem', color: '#666' }}>Unidad: {it.unidad}</div>}
                      {it.descripcion && <div style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic', marginTop: 2 }}>{it.descripcion}</div>}
                    </>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Stock: {stock}</div>
                  )}
                </td>
                <td style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button className="btn ghost" onClick={() => onDec(it.id)} style={{ padding: '4px 8px', fontSize: '14px' }}>−</button>
                  <input
                    type="number"
                    min={1}
                    value={it.qty}
                    onChange={(e) => {
                      const newQty = Math.max(1, Number(e.target.value) || 1)
                      setError(null)
                      // Validar contra stock disponible
                      if (newQty > stock) {
                        setError(`Stock limitado a ${stock} para "${it.name}"`)
                        return
                      }
                      // Llamar a onInc/onDec múltiples veces para alcanzar la cantidad deseada
                      const diff = newQty - it.qty
                      if (diff > 0) {
                        for (let i = 0; i < diff; i++) {
                          onInc(it.id)
                        }
                      } else if (diff < 0) {
                        for (let i = 0; i < Math.abs(diff); i++) {
                          onDec(it.id)
                        }
                      }
                    }}
                    style={{ width: 50, padding: '4px', textAlign: 'center', border: '1px solid #ccc', borderRadius: 4 }}
                  />
                  <button className="btn" onClick={() => {
                    const canAdd = Math.max(0, stock - it.qty)
                    if (canAdd <= 0) {
                      setError(`No hay más stock disponible para "${it.name}". Stock total: ${stock}, En carrito: ${it.qty}`)
                      return
                    }
                    setError(null)
                    onInc(it.id)
                  }} style={{ padding: '4px 8px', fontSize: '14px' }}>+</button>
                </td>
                    <td>
                      <div className="cart-item-prices">
                        {it.isOnOffer ? (
                          <>
                            <div className="cart-item-normal">Precio: <span className="strike">{formatCurrency(it.basePrice ?? it.price)}</span></div>
                            <div className="cart-item-offer">Oferta: {formatCurrency(it.offerPrice)}</div>
                            <label style={{display:'flex',alignItems:'center',gap:8}}>
                              <input type="checkbox" checked={!!it.useOfferPrice} onChange={() => onToggleOffer(it.id)} /> Aplicar oferta
                            </label>
                          </>
                        ) : (
                          <div className="cart-item-normal">Precio: {formatCurrency(it.basePrice ?? it.price)}</div>
                        )}
                      </div>
                    </td>
                    <td>{formatCurrency(((it.useOfferPrice && it.offerPrice) ? it.offerPrice : (it.basePrice ?? it.price)) * it.qty)}</td>
                <td>
                  <button className="btn ghost" onClick={() => onDec(it.id)} style={{ marginRight: 4 }}>🗑️</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>Total: </strong> {formatCurrency(total)}
        </div>

        <div>
          <button className="btn" onClick={onFinish} disabled={items.length === 0}>
            Finalizar Venta
          </button>
        </div>
      </div>
    </div>
  )
}

function lightenAccent(hex, factor = 0.9) {
  try {
    const c = hex.replace('#', '')
    const num = parseInt(c, 16)

    let r = (num >> 16) & 0xff
    let g = (num >> 8) & 0xff
    let b = num & 0xff

    r = Math.round(r + (255 - r) * factor)
    g = Math.round(g + (255 - g) * factor)
    b = Math.round(b + (255 - b) * factor)

    return `rgb(${r}, ${g}, ${b})`
  } catch (e) {
    return '#fff8e1'
  }
}
