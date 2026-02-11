import React, { useState, useMemo, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { formatCurrency } from '../utils/helpers'
import { buildClientsFromSales } from '../utils/clientHelpers'
import ClientDetail from '../components/ClientDetail'
import './Clientes.css'

export default function Clientes(){
  const { sales, fiados, company } = useStore()

  console.log('Clientes - store.sales:', sales)
  
  const [vistaActiva, setVistaActiva] = useState('resumen')
  const [toast, setToast] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)

  /**
   * Construir clientes desde ventas (fuente única de verdad)
   * Incluye: datos de contacto, historial, deuda, pagos, vencimientos
   */
  const clientesResumen = useMemo(() => {
    try {
      return buildClientsFromSales(sales || [], fiados || [])
    } catch(e) { 
      console.error('Error en buildClientsFromSales:', e)
      return [] 
    }
  }, [sales, fiados])

  /**
   * Separar clientes por estado de deuda
   */
  const fiadoClients = useMemo(() => 
    (clientesResumen || []).filter(c => Number(c.totalAdeudado || 0) > 0),
    [clientesResumen]
  )

  const alDiaClients = useMemo(() => 
    (clientesResumen || []).filter(c => Number(c.totalAdeudado || 0) === 0),
    [clientesResumen]
  )

  /**
   * Totales globales
   */
  const totalsGlobal = useMemo(() => {
    const totalDeuda = (fiadoClients || []).reduce((s, c) => s + Number(c.totalAdeudado || 0), 0)
    const totalPagado = clientesResumen.reduce((s, c) => s + Number(c.totalPagado || 0), 0)
    const totalComprado = clientesResumen.reduce((s, c) => s + Number(c.totalComprado || 0), 0)
    return { totalDeuda, totalPagado, totalComprado }
  }, [fiadoClients, clientesResumen])

  /**
   * Expandir fila para ver detalles
   */
  const openEditClient = (clientId) => {
    setExpandedRow(prev => (prev === clientId ? null : clientId))
  }

  /**
   * Auto-hide toast
   */
  useEffect(() => {
    if(!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  /**
   * Estilos condicionales por tipo de cliente
   */
  const getClientRowStyle = (cliente) => {
    const tieneDeuda = Number(cliente.totalAdeudado || 0) > 0
    
    if (tieneDeuda) {
      // Fiado activo: color suave anaranjado/amarillo
      return {
        backgroundColor: '#fffbf0',
        borderLeft: '4px solid #f97316'
      }
    } else {
      // Al día: color suave verde
      return {
        backgroundColor: '#f0fdf4',
        borderLeft: '4px solid #22c55e'
      }
    }
  }

  /**
   * Badge de estado
   */
  const getEstadoBadge = (cliente) => {
    const tieneDeuda = Number(cliente.totalAdeudado || 0) > 0
    
    if (tieneDeuda) {
      return {
        text: '⚠️ Fiado',
        color: '#ff9800',
        bgColor: '#fff3e0'
      }
    } else {
      return {
        text: '✓ Al día',
        color: '#4caf50',
        bgColor: '#e8f5e9'
      }
    }
  }

  return (
    <div className="clientes-page">
      <div className="page-header">
        <h1>Gestión de Clientes</h1>
        <p className="subtitle">Sincronización automática desde Ventas</p>
      </div>

      {/* Pestañas */}
      <div className="tabs-container">
        <button 
          className={`tab-button ${vistaActiva === 'resumen' ? 'active' : ''}`}
          onClick={() => setVistaActiva('resumen')}
        >
          📊 Resumen ({clientesResumen.length})
        </button>
        <button 
          className={`tab-button ${vistaActiva === 'fiado' ? 'active' : ''}`}
          onClick={() => setVistaActiva('fiado')}
        >
          ⚠️ Con Fiado ({fiadoClients.length})
        </button>
        <button 
          className={`tab-button ${vistaActiva === 'aldia' ? 'active' : ''}`}
          onClick={() => setVistaActiva('aldia')}
        >
          ✓ Al Día ({alDiaClients.length})
        </button>
      </div>

      {/* VISTA: RESUMEN */}
      {vistaActiva === 'resumen' && (
        <div className="vista-resumen">
          {/* Cards de totales */}
          <div className="totals-grid">
            <div className="total-card total-comprado">
              <div className="card-label">Total Comprado</div>
              <div className="card-value">{formatCurrency(totalsGlobal.totalComprado)}</div>
              <div className="card-detail">{clientesResumen.length} clientes</div>
            </div>
            <div className="total-card total-pagado">
              <div className="card-label">Total Pagado</div>
              <div className="card-value">{formatCurrency(totalsGlobal.totalPagado)}</div>
            </div>
            <div className="total-card total-deuda">
              <div className="card-label">Deuda Total</div>
              <div className="card-value">{formatCurrency(totalsGlobal.totalDeuda)}</div>
              <div className="card-detail">{fiadoClients.length} clientes con deuda</div>
            </div>
          </div>

          {/* Tabla de todos los clientes */}
          {clientesResumen.length === 0 ? (
            <div className="empty-state">
              <p>No hay clientes registrados aún. Las ventas crearán clientes automáticamente.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="clientes-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th>Compras</th>
                    <th>Total Comprado</th>
                    <th>Pagado</th>
                    <th>Adeudado</th>
                    <th>Estado</th>
                    <th>Vencimiento</th>
                    <th>Última Compra</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesResumen.map((cliente) => {
                    const estado = getEstadoBadge(cliente)
                    const tieneDeuda = Number(cliente.totalAdeudado || 0) > 0
                    const isExpanded = expandedRow === cliente.id
                    
                    return (
                      <React.Fragment key={cliente.id}>
                        <tr style={getClientRowStyle(cliente)}>
                          <td className="cell-nombre">
                            <div className="nombre-principal">{cliente.nombre}</div>
                            {cliente.email && <div className="subtext">{cliente.email}</div>}
                          </td>
                          <td>
                            <div>{cliente.telefono || '-'}</div>
                            {cliente.direccion && <div className="subtext">{cliente.direccion}</div>}
                          </td>
                          <td className="cell-number">
                            {cliente.comprasCount || 0}
                          </td>
                          <td className="cell-number">
                            <strong>{formatCurrency(cliente.totalComprado || 0)}</strong>
                          </td>
                          <td className="cell-number">
                            {formatCurrency(cliente.totalPagado || 0)}
                          </td>
                          <td className="cell-number">
                            <strong style={{color: tieneDeuda ? '#ff6b6b' : '#22c55e'}}>
                              {formatCurrency(cliente.totalAdeudado || 0)}
                            </strong>
                          </td>
                          <td>
                            <span 
                              className="estado-badge"
                              style={{
                                color: estado.color,
                                backgroundColor: estado.bgColor,
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {estado.text}
                            </span>
                          </td>
                          <td>
                            {tieneDeuda && cliente.fechaVencimientoCalculada
                              ? new Date(cliente.fechaVencimientoCalculada).toLocaleDateString('es-AR')
                              : '-'
                            }
                          </td>
                          <td>
                            {cliente.ultimaCompraFecha 
                              ? new Date(cliente.ultimaCompraFecha).toLocaleDateString('es-AR')
                              : '-'
                            }
                          </td>
                          <td className="cell-acciones">
                            <button 
                              className="btn-detalles"
                              onClick={() => openEditClient(cliente.id)}
                            >
                              {isExpanded ? '▼' : '▶'} Detalles
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="expanded-row">
                            <td colSpan="9">
                              <ClientDetail 
                                client={cliente} 
                                onClose={() => setExpandedRow(null)}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VISTA: CON FIADO */}
      {vistaActiva === 'fiado' && (
        <div className="vista-fiado">
          <div className="section-header">
            <h2>Clientes con Deuda Pendiente</h2>
            <div className="header-stats">
              <span className="stat">
                Deuda Total: <strong>{formatCurrency(totalsGlobal.totalDeuda)}</strong>
              </span>
              <span className="stat">
                {fiadoClients.length} cliente{fiadoClients.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {fiadoClients.length === 0 ? (
            <div className="empty-state">
              <p>¡Excelente! No hay clientes con deuda pendiente.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="clientes-table fiado-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>Total Comprado</th>
                    <th>Pagado</th>
                    <th>Adeudado</th>
                    <th>% Pagado</th>
                    <th>Vencimiento</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {fiadoClients.map((cliente) => {
                    const isExpanded = expandedRow === cliente.id
                    const percentPagado = cliente.totalComprado > 0 
                      ? Math.round((cliente.totalPagado / cliente.totalComprado) * 100)
                      : 0
                    
                    // Usar la fecha de vencimiento calculada (última venta fiado + 1 mes)
                    const fechaVencimiento = cliente.fechaVencimientoCalculada
                    const diasAlVencimiento = fechaVencimiento
                      ? Math.ceil((new Date(fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24))
                      : null
                    const esVencido = diasAlVencimiento !== null && diasAlVencimiento < 0
                    const esProximoAvencer = diasAlVencimiento !== null && diasAlVencimiento >= 0 && diasAlVencimiento <= 3

                    return (
                      <React.Fragment key={cliente.id}>
                        <tr style={getClientRowStyle(cliente)} className={esVencido ? 'vencido' : ''}>
                          <td className="cell-nombre">
                            <div className="nombre-principal">{cliente.nombre}</div>
                            {cliente.email && <div className="subtext">{cliente.email}</div>}
                          </td>
                          <td>{cliente.telefono || '-'}</td>
                          <td className="cell-number">
                            <strong>{formatCurrency(cliente.totalComprado || 0)}</strong>
                          </td>
                          <td className="cell-number">
                            {formatCurrency(cliente.totalPagado || 0)}
                          </td>
                          <td className="cell-number">
                            <strong style={{color: '#ff6b6b'}}>
                              {formatCurrency(cliente.totalAdeudado || 0)}
                            </strong>
                          </td>
                          <td>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{
                                  width: `${Math.min(percentPagado, 100)}%`,
                                  backgroundColor: percentPagado === 100 ? '#22c55e' : '#f97316'
                                }}
                              />
                              <span className="progress-text">{percentPagado}%</span>
                            </div>
                          </td>
                          <td>
                            {fechaVencimiento ? (
                              <div className="vencimiento-info">
                                <div>{new Date(fechaVencimiento).toLocaleDateString('es-AR')}</div>
                                {esVencido && (
                                  <div className="alerta vencido">⚠️ Vencido</div>
                                )}
                                {esProximoAvencer && !esVencido && (
                                  <div className="alerta proxAVencer">⏰ Próximo a vencer</div>
                                )}
                              </div>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                          <td className="cell-acciones">
                            <button 
                              className="btn-detalles"
                              onClick={() => openEditClient(cliente.id)}
                            >
                              {isExpanded ? '▼' : '▶'} Detalles
                            </button>
                           
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="expanded-row">
                            <td colSpan="8">
                              <ClientDetail 
                                client={cliente} 
                                onClose={() => setExpandedRow(null)}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VISTA: AL DÍA */}
      {vistaActiva === 'aldia' && (
        <div className="vista-aldia">
          <div className="section-header">
            <h2>Clientes al Día</h2>
            <div className="header-stats">
              <span className="stat">
                {alDiaClients.length} cliente{alDiaClients.length !== 1 ? 's' : ''}
              </span>
              <span className="stat">
                Total comprado: <strong>{formatCurrency(totalsGlobal.totalComprado)}</strong>
              </span>
            </div>
          </div>

          {alDiaClients.length === 0 ? (
            <div className="empty-state">
              <p>No hay clientes sin deuda pendiente.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="clientes-table aldia-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Compras</th>
                    <th>Total Comprado</th>
                    <th>Última Compra</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alDiaClients.map((cliente) => {
                    const isExpanded = expandedRow === cliente.id

                    return (
                      <React.Fragment key={cliente.id}>
                        <tr style={getClientRowStyle(cliente)}>
                          <td className="cell-nombre">
                            <div className="nombre-principal">{cliente.nombre}</div>
                            {cliente.direccion && <div className="subtext">{cliente.direccion}</div>}
                          </td>
                          <td>{cliente.telefono || '-'}</td>
                          <td>{cliente.email || '-'}</td>
                          <td className="cell-number">{cliente.comprasCount || 0}</td>
                          <td className="cell-number">
                            <strong>{formatCurrency(cliente.totalComprado || 0)}</strong>
                          </td>
                          <td>
                            {cliente.ultimaCompraFecha
                              ? new Date(cliente.ultimaCompraFecha).toLocaleDateString('es-AR')
                              : '-'
                            }
                          </td>
                          <td className="cell-acciones">
                            <button 
                              className="btn-detalles"
                              onClick={() => openEditClient(cliente.id)}
                            >
                              {isExpanded ? '▼' : '▶'} Detalles
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="expanded-row">
                            <td colSpan="7">
                              <ClientDetail 
                                client={cliente} 
                                onClose={() => setExpandedRow(null)}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Toast de notificaciones */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.text}
        </div>
      )}
    </div>
  )
}



