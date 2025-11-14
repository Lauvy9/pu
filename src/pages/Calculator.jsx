// src/pages/Calculadora.jsx
import React, { useState, useEffect } from "react";

export default function Calculadora() {
  const [precioMetro, setPrecioMetro] = useState(() => {
    return parseFloat(localStorage.getItem("precioMetro")) || 5000;
  });
  const [metros, setMetros] = useState("");
  const [resultado, setResultado] = useState(null);

  function calcular() {
    if (!metros) return alert("Ingresá los metros");
    setResultado(metros * precioMetro);
  }

  function guardarPrecio() {
    localStorage.setItem("precioMetro", precioMetro);
    alert("✅ Precio por metro actualizado correctamente");
  }

  return (
    <div className="card">
      <h2>🧮 Calculadora de Cotización</h2>

      <label>Precio por metro ($)</label>
      <input
        className="input"
        type="number"
        value={precioMetro}
        onChange={(e) => setPrecioMetro(parseFloat(e.target.value))}
      />
      <button className="btn" onClick={guardarPrecio}>
        Guardar nuevo precio
      </button>

      <label>Metros</label>
      <input
        className="input"
        type="number"
        value={metros}
        onChange={(e) => setMetros(e.target.value)}
      />

      <button className="btn" onClick={calcular}>
        Calcular
      </button>

      {resultado !== null && (
        <h3 style={{ marginTop: 20 }}>
          💰 Total: ${resultado.toLocaleString("es-AR")}
        </h3>
      )}
    </div>
  );
}
