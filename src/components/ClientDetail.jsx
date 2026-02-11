import React from 'react'
import { formatCurrency } from '../utils/helpers'
import './ClientDetail.css'

export default function ClientDetail({ client, onClose }){
  if(!client) return null

  const {
    nombre,
    telefono,
    email,
    direccion,
    totalComprado,
    totalPagado,
    totalAdeudado,
    esFiado,
    primerPagoFecha,
    proximoVencimiento,
    fechaVencimientoCalculada,
    ultimaCompraFecha,
    comprasCount,
    ventas = [],
    productosComprados = []
  } = client

  const percentPagado = totalComprado > 0 
    ? Math.round((totalPagado / totalComprado) * 100)
    : 0

  // Usar la fecha de vencimiento calculada (última venta fiado + 1 mes)
  const fechaVencimiento = fechaVencimientoCalculada
  const diasAlVencimiento = fechaVencimiento
    ? Math.ceil((new Date(fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  const esVencido = diasAlVencimiento !== null && diasAlVencimiento < 0
  const esProximoAVencer = diasAlVencimiento !== null && diasAlVencimiento >= 0 && diasAlVencimiento <= 3

  // Separar ventas fiadas de normales
  const ventasFiadas = (ventas || []).filter(v => v.isFiado)
  const ventasNormales = (ventas || []).filter(v => !v.isFiado)

  return (
    <div className="client-detail">
      <div className="detail-header">
        <div className="detail-title">
          <h3>{nombre}</h3>
          {esFiado && (
            <span className="badge badge-fiado">⚠️ CON FIADO</span>
          )}
          {!esFiado && (
            <span className="badge badge-aldia">✓ AL DÍA</span>
          )}
        </div>
        {onClose && (
          <button className="btn-close" onClick={onClose}>✕</button>
        )}
      </div>

      {/* Datos de Contacto */}
      <div className="detail-section">
        <h4 className="section-title">📋 Datos de Contacto</h4>
        <div className="contact-grid">
          <div className="contact-item">
            <label>Nombre</label>
            <div className="contact-value">{nombre || '-'}</div>
          </div>
          <div className="contact-item">
            <label>Teléfono</label>
            <div className="contact-value">
              {telefono ? (
                <a href={`tel:${telefono.replace(/\D/g, '')}`}>{telefono}</a>
              ) : (
                '-'
              )}
            </div>
          </div>
          <div className="contact-item">
            <label>Email</label>
            <div className="contact-value">
              {email ? (
                <a href={`mailto:${email}`}>{email}</a>
              ) : (
                '-'
              )}
            </div>
          </div>
          <div className="contact-item">
            <label>Dirección</label>
            <div className="contact-value">{direccion || '-'}</div>
          </div>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="detail-section">
        <h4 className="section-title">💰 Resumen Financiero</h4>
        <div className="financial-grid">
          <div className="fin-card">
            <div className="fin-label">Total Comprado</div>
            <div className="fin-value">{formatCurrency(totalComprado || 0)}</div>
          </div>
          <div className="fin-card">
            <div className="fin-label">Total Pagado</div>
            <div className="fin-value" style={{color: '#10b981'}}>{formatCurrency(totalPagado || 0)}</div>
          </div>
          <div className="fin-card">
            <div className="fin-label">Adeudado</div>
            <div className="fin-value" style={{color: totalAdeudado > 0 ? '#ef4444' : '#10b981'}}>
              {formatCurrency(totalAdeudado || 0)}
            </div>
          </div>
          <div className="fin-card">
            <div className="fin-label">% Pagado</div>
            <div className="fin-value">{percentPagado}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        {totalComprado > 0 && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(percentPagado, 100)}%`,
                  backgroundColor: percentPagado === 100 ? '#10b981' : '#f97316'
                }}
              />
            </div>
            <div className="progress-label">{percentPagado}% pagado</div>
          </div>
        )}
      </div>

      {/* Estado de Fiado */}
      {esFiado && (
        <div className="detail-section fiado-section">
          <h4 className="section-title">⚠️ Estado de Fiado</h4>
          <div className="fiado-grid">
            {primerPagoFecha && (
              <div className="fiado-item">
                <label>Primer Pago</label>
                <div className="fiado-value">
                  {new Date(primerPagoFecha).toLocaleDateString('es-AR')}
                </div>
              </div>
            )}
            {fechaVencimiento && (
              <div className="fiado-item">
                <label>Fecha de Vencimiento</label>
                <div className="fiado-value" style={{
                  color: esVencido ? '#dc2626' : (esProximoAVencer ? '#ca8a04' : '#666')
                }}>
                  {new Date(fechaVencimiento).toLocaleDateString('es-AR')}
                </div>
                {esVencido && (
                  <div className="alerta-vencido">⚠️ Vencido</div>
                )}
                {esProximoAVencer && !esVencido && (
                  <div className="alerta-proximo">⏰ Próximo a vencer ({diasAlVencimiento} días)</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historial de Compras */}
      <div className="detail-section">
        <h4 className="section-title">📊 Historial de Compras</h4>
        <div className="purchase-summary">
          <div className="summary-stat">
            <span className="stat-label">{comprasCount || 0}</span>
            <span className="stat-desc">Compra{comprasCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">
              {ultimaCompraFecha
                ? new Date(ultimaCompraFecha).toLocaleDateString('es-AR')
                : '-'
              }
            </span>
            <span className="stat-desc">Última Compra</span>
          </div>
        </div>
      </div>

      {/* Ventas Detalladas */}
      {ventas && ventas.length > 0 && (
        <div className="detail-section">
          <h4 className="section-title">🛍️ Ventas Registradas ({ventas.length})</h4>
          <div className="sales-list">
            {ventas.map((venta, idx) => (
              <div key={venta.id || idx} className="sale-item">
                <div className="sale-header">
                  <div className="sale-date">
                    {new Date(venta.date).toLocaleDateString('es-AR')}
                  </div>
                  <div className="sale-type-badge">
                    {venta.isFiado ? '🔸 Fiado' : '🔵 Normal'}
                  </div>
                </div>

                <div className="sale-amounts">
                  <div className="amount-item">
                    <span>Total:</span>
                    <strong>{formatCurrency(venta.total || 0)}</strong>
                  </div>
                  <div className="amount-item">
                    <span>Pagado:</span>
                    <strong style={{color: '#10b981'}}>{formatCurrency(venta.paid || 0)}</strong>
                  </div>
                  {venta.pending > 0 && (
                    <div className="amount-item">
                      <span>Pendiente:</span>
                      <strong style={{color: '#ef4444'}}>{formatCurrency(venta.pending || 0)}</strong>
                    </div>
                  )}
                </div>

                {venta.items && venta.items.length > 0 && (
                  <div className="sale-items">
                    {venta.items.map((item, i) => (
                      <div key={i} className="sale-item-detail">
                        <span className="item-name">{item.name || 'Producto'}</span>
                        <span className="item-qty">x{item.quantity || 1}</span>
                        <span className="item-price">{formatCurrency(item.price || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {venta.dueDate && (
                  <div className="sale-due">
                    <span className="due-label">Vencimiento:</span>
                    <span className="due-date">{new Date(venta.dueDate).toLocaleDateString('es-AR')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Productos Comprados Acumulados */}
      {productosComprados && productosComprados.length > 0 && (
        <div className="detail-section">
          <h4 className="section-title">📦 Productos Comprados (Acumulado)</h4>
          <div className="products-grid">
            {productosComprados.map((prod, idx) => (
              <div key={prod.id || idx} className="product-card">
                <div className="product-name">{prod.name || 'Producto'}</div>
                <div className="product-stat">
                  <span className="stat-label">Cantidad:</span>
                  <span className="stat-value">{prod.quantity || 0}</span>
                </div>
                <div className="product-stat">
                  <span className="stat-label">Precio Unitario:</span>
                  <span className="stat-value">{formatCurrency(prod.price || 0)}</span>
                </div>
                {prod.lastPurchaseDate && (
                  <div className="product-stat">
                    <span className="stat-label">Última Compra:</span>
                    <span className="stat-value" style={{fontSize: '12px'}}>
                      {new Date(prod.lastPurchaseDate).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón Cerrar */}
      {onClose && (
        <div className="detail-footer">
          <button className="btn-cerrar" onClick={onClose}>Cerrar</button>
        </div>
      )}
    </div>
  )
}
