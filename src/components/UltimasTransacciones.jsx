import React from 'react'
import { useStore } from '../context/StoreContext'
import { formatCurrency } from '../utils/helpers'

export default function UltimasTransacciones({ limit = 10, dateRange = null }){
  const { transactions = [] } = useStore()
  let list = transactions || []
  if (dateRange && dateRange.start && dateRange.end) {
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    // Normalize start to 00:00:00 and end to 23:59:59 to include whole days
    start.setHours(0,0,0,0)
    end.setHours(23,59,59,999)
    list = list.filter(t => {
      const d = new Date(t.fecha || t.date || t.createdAt || 0)
      return d >= start && d <= end
    })
  }
  list = list.sort((a,b) => new Date(b.fecha || b.date || 0) - new Date(a.fecha || a.date || 0)).slice(0, limit)

  return (
    <div className="card panel-table">
      <h3 className="panel-title">Últimas transacciones</h3>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Producto / Concepto</th>
              <th>Cantidad</th>
              <th>Total</th>
              <th>Método</th>
              <th>Cuenta destino</th>
              <th>Cliente</th>
              <th>Dirección</th>
              <th>Pagado</th>
              <th>Entregado</th>
              <th>Deuda</th>
            </tr>
          </thead>
          <tbody>
            {list.map(tx => {
              // Renderizado especial para gastos operativos
              if (tx.tipo === 'gasto') {
                return (
                  <tr key={tx.id} style={{ background: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
                    <td>{new Date(tx.fecha || tx.date || '').toLocaleString()}</td>
                    <td>
                      <span style={{ 
                        background: '#ff9800', 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        fontSize: '0.8rem',
                        fontWeight: 600 
                      }}>
                        💸 GASTO
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem' }}>
                        <div style={{ fontWeight: 600 }}>{tx.concepto || 'Gasto operativo'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Pagado a: {tx.pagadoA || 'N/A'}</div>
                        {tx.observacion && (
                          <div style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>
                            Nota: {tx.observacion}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>-</td>
                    <td style={{ color: '#d32f2f', fontWeight: 600 }}>
                      -{formatCurrency(Number(tx.monto || 0))}
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                  </tr>
                )
              }
              
              // Renderizado normal para otras transacciones
              return (
                <tr key={tx.id} style={{ background: (tx.productoId === null) ? '#fff0f6' : undefined }}>
                  <td>{new Date(tx.fecha || tx.date || '').toLocaleString()}</td>
                  <td>{tx.tipo}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}>{tx.nombreProducto || '-'}</div>
                      {tx.productoId === null && (
                        <div style={{ background: '#ffb6d5', color: '#800035', padding: '2px 6px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>Servicio</div>
                      )}
                    </div>
                  </td>
                  <td>{tx.cantidad || 0}</td>
                  <td>{formatCurrency(Number(tx.total || 0))}</td>
                  <td>{tx.metodoPago || '-'}</td>
                  <td>{tx.cuentaDestino || tx.accountId || '-'}</td>
                  <td>{tx.cliente || '-'}</td>
                  <td>{tx.direccion || '-'}</td>
                  <td>{tx.pagado ? 'Sí' : 'No'}</td>
                  <td>{tx.entregado ? 'Sí' : 'No'}</td>
                  <td>{tx.deudaActual != null ? formatCurrency(tx.deudaActual) : '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
