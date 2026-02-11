import React, { useContext } from 'react';
import { useStore } from '../context/StoreContext';
import { FiadosContext } from '../context/FiadosContext.jsx';

export default function History() {
  const { sales } = useStore();
  const { clientes } = useContext(FiadosContext);

  return (
    <div className="card">
      <h3>Historial de Ventas y Clientes</h3>

      {(!sales || sales.length===0) && (!clientes || clientes.length===0) && <p>No hay ventas registradas</p>}

      <table className="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Items</th>
            <th>Tipo</th>
            <th>Total</th>
            <th>Cliente</th>
            <th>Deuda Actual</th>
          </tr>
        </thead>
        <tbody>
          {sales?.map(s => (
            <tr key={s.id}>
              <td>{new Date(s.date).toLocaleString()}</td>
              <td>{s.items.map(it => <div key={it.id}>{it.name} x{it.qty} ({it.type})</div>)}</td>
              <td>{s.type}</td>
              <td>{s.total.toFixed(2)}</td>
              <td>{s.clienteFiado?.toString() || '-'}</td>
              <td>
                {s.clienteFiado 
                  ? (clientes.find(c => c.id === parseInt(s.clienteFiado))?.movimientos.reduce((sum,m)=> m.tipo==='compra'?sum+m.monto:sum-m.monto,0) || 0).toFixed(2)
                  : '-'}
              </td>
            </tr>
          ))}

          {clientes?.flatMap(c => (c.movimientos || []).map((m, i) => (
            <tr key={c.id + '_' + i}>
              <td>{new Date(m.fecha).toLocaleDateString()}</td>
              <td>{c.nombre}</td>
              <td>Fiado</td>
              <td>{m.monto.toFixed(2)}</td>
              <td>{c.nombre}</td>
              <td>
                {(c.movimientos || []).reduce((sum,mv)=> mv.tipo==='compra'?sum+mv.monto:sum-mv.monto,0).toFixed(2)}
              </td>
            </tr>
          )))}
        </tbody>
      </table>
    </div>
  );
}
