// src/pages/Servicios.jsx
import React, { useState, useEffect, useContext } from "react";
import { formatCurrency } from "../utils/helpers";
import { useStore } from "../context/StoreContext";

export default function Servicios() {
  const { services, actions } = useStore();
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [editingId, setEditingId] = useState(null)
  const [editingPrecio, setEditingPrecio] = useState('')

  function agregarServicio() {
    if (!nombre || !precio) return alert("Completa los campos");
    actions.addService({ nombre, precio: parseFloat(precio), descripcion: "" });
    setNombre("");
    setPrecio("");
  }

  function startEdit(s){
    setEditingId(s.id)
    setEditingPrecio(s.precio || s.price || '')
  }

  function cancelEdit(){ setEditingId(null); setEditingPrecio('') }

  function saveEdit(){
    if (!editingId) return;
    actions.updateService(editingId, { precio: Number(editingPrecio) })
    setEditingId(null); setEditingPrecio('')
  }

  function deleteService(id){
    if (!confirm('Eliminar servicio?')) return;
    actions.removeService(id)
  }

  return (
    <div className="card">
      <h2>🧰 Servicios</h2>

      <input
        className="input"
        placeholder="Nombre del servicio"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <input
        className="input"
        placeholder="Costo del servicio"
        type="number"
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
      />
      <button className="btn" onClick={agregarServicio}>Agregar Servicio</button>

      <h3 style={{ marginTop: 20 }}>Lista de Servicios</h3>
      <ul>
        {(services || []).map(s => (
          <li key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <strong>{s.nombre}</strong>
              <div className="small">{formatCurrency(s.precio || s.price || 0)}</div>
            </div>
            <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
              {editingId === s.id ? (
                <>
                  <input type="number" value={editingPrecio} onChange={e=>setEditingPrecio(e.target.value)} />
                  <button className="btn" onClick={saveEdit}>Guardar</button>
                  <button className="btn" onClick={cancelEdit}>Cancelar</button>
                </>
              ) : (
                <>
                  <button className="btn" onClick={()=>startEdit(s)}>Editar costo</button>
                  <button className="btn" style={{ background:'#e74c3c' }} onClick={()=>deleteService(s.id)}>Borrar</button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
