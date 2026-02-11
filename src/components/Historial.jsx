import React from 'react'
import { useStore } from '../context/StoreContext'
import { formatCurrency } from '../utils/helpers'

export default function Historial(){
  const { transactions = [] } = useStore()
  const list = (transactions || []).slice().sort((a,b) => new Date(b.fecha || b.date || 0) - new Date(a.fecha || a.date || 0))

  return (
    <div className="card">
      <h3>Historial completo de transacciones</h3>
      {list.length === 0 ? (
        <div className="small-muted">No hay transacciones registradas</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Producto</th>
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
              {list.map(tx => (
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
