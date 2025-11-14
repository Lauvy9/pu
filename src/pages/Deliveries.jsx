import React from "react";
import { useStore } from "../context/StoreContext";
import { formatCurrency } from "../utils/helpers";

export default function Deliveries() {
  const { sales, actions } = useStore();

  const toggleEntrega = (id) => {
    actions.updateSale(id, { entregado: true });
  };

  const pendientes = sales.filter(s => !s.entregado);
  const entregadas = sales.filter(s => s.entregado);

  return (
    <div style={{ padding: 20 }}>
      <h2>Entregas Pendientes</h2>
      <ul>
        {pendientes.map(s => (
          <li key={s.id} style={{ 
            background: "#ffcccc", 
            margin: "8px 0", 
            padding: "8px", 
            borderRadius: "6px" 
          }}>
            <div><strong>ID:</strong> {s.id}</div>
            <div><strong>Total:</strong> {formatCurrency(s.total)}</div>
            <div><strong>Cliente:</strong> {s.clienteFiado || "Contado"}</div>
            <div><strong>Método:</strong> {s.metodoPago}</div>
            <button className="btn" onClick={() => toggleEntrega(s.id)}>
              Marcar como entregado
            </button>
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: 30 }}>Entregas Realizadas</h2>
      <ul>
        {entregadas.map(s => (
          <li key={s.id} style={{
            background: "#ccffcc",
            margin: "8px 0",
            padding: "8px",
            borderRadius: "6px"
          }}>
            <div><strong>ID:</strong> {s.id}</div>
            <div><strong>Total:</strong> {formatCurrency(s.total)}</div>
            <div><strong>Cliente:</strong> {s.clienteFiado || "Contado"}</div>
            <div><strong>Método:</strong> {s.metodoPago}</div>
            <div>✅ Entregado</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
