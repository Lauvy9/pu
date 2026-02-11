// src/pages/Servicios.jsx
import React, { useState, useEffect, useContext } from "react";
import { formatCurrency } from "../utils/helpers";
import { useStore } from "../context/StoreContext";

export default function Servicios() {
  const { services, serviceTemplates, actions } = useStore();
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [tipo, setTipo] = useState('vidrieria')
  const [unidad, setUnidad] = useState('unidad')
  const [descripcion, setDescripcion] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingPrecio, setEditingPrecio] = useState('')
  const [businessUnit, setBusinessUnit] = useState('')
  const [activeTab, setActiveTab] = useState('templates') // 'templates' | 'history'


  function agregarServicio() {
    if (!nombre || !precio) return alert("Completa los campos");
    actions.addService({ nombre, price: parseFloat(precio), tipoServicio: tipo, unidad: unidad, descripcion: descripcion });
    setNombre("");
    setPrecio("");
    setTipo('vidrieria'); setUnidad('unidad'); setDescripcion('')
  }

  function agregarPlantilla() {
    if (!nombre || !precio) return alert("Completa los campos para la plantilla");
    const template = actions.addServiceTemplate({ 
      nombre, 
      precio: parseFloat(precio), 
      tipoServicio: tipo, 

      descripcionBase: descripcion 
    });
    setNombre("");
    setPrecio("");
    setTipo('vidrieria'); setUnidad('unidad'); setDescripcion('')
    alert(`Plantilla "${nombre}" guardada`);
  }

  function startEdit(s){
    setEditingId(s.id)
    setEditingPrecio(s.precio || s.price || s.precio || '')
  }

  function cancelEdit(){ setEditingId(null); setEditingPrecio('') }

  function saveEdit(){
    if (!editingId) return;
    // Check if it's a template or service
    const isTemplate = (serviceTemplates || []).some(t => t.id === editingId);
    if (isTemplate) {
      actions.updateServiceTemplate(editingId, { precio: Number(editingPrecio) })
    } else {
      actions.updateService(editingId, { precio: Number(editingPrecio) })
    }
    setEditingId(null); setEditingPrecio('')
  }

  function deleteService(id){
    if (!confirm('Eliminar servicio?')) return;
    actions.removeService(id)
  }

  function deleteTemplate(id){
    if (!confirm('Eliminar plantilla? Esto no afectará las ventas existentes')) return;
    actions.removeServiceTemplate(id)
  }

  return (
    <div className="card">
      <h2>Gestión de Servicios</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, borderBottom: '2px solid #eee' }}>
        <button 
          style={{ 
            padding: '8px 16px', 
            background: activeTab === 'templates' ? '#ff9800' : '#ddd',
            color: activeTab === 'templates' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'templates' ? 700 : 400
          }}
          onClick={() => setActiveTab('templates')}
        >
          📋 Plantillas de Servicios
        </button>
        <button 
          style={{ 
            padding: '8px 16px', 
            background: activeTab === 'history' ? '#ff9800' : '#ddd',
            color: activeTab === 'history' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'history' ? 700 : 400
          }}
          onClick={() => setActiveTab('history')}
        >
          📚 Historial de Servicios
        </button>
      </div>

      {/* TAB: PLANTILLAS */}
      {activeTab === 'templates' && (
        <div>
          <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, marginBottom: 16 }}>
            <h4 style={{ marginTop: 0 }}>Crear nueva plantilla de servicio</h4>
            <p className="small" style={{ color: '#666', marginBottom: 12 }}>
              Las plantillas se pueden reutilizar rápidamente en el módulo de Ventas
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                className="input"
                placeholder="Nombre de la plantilla"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <select className="input" value={tipo} onChange={e=>setTipo(e.target.value)}>
                <option value="vidrieria">Vidriería</option>
                <option value="muebleria">Mueblería</option>
                <option value="otro">Otro</option>
              </select>
            
              <input
                className="input"
                placeholder="Precio base"
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <textarea className="input" placeholder="Descripción base (opcional)" value={descripcion} onChange={e=>setDescripcion(e.target.value)} style={{ minHeight: 60 }} />
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={agregarPlantilla} style={{ background: '#9c27b0' }}>
                💾 Guardar Plantilla
              </button>
            </div>
          </div>

          <h3>Plantillas disponibles</h3>
          {(serviceTemplates || []).length === 0 ? (
            <p style={{ color: '#999' }}>No hay plantillas de servicios guardadas</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {(serviceTemplates || []).map(t => (
                <li key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding: 12, borderBottom: '1px solid #eee', background: t.activo ? '#fff' : '#f5f5f5' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '1.1em' }}>{t.nombre}</strong>
                    <div className="small" style={{ marginTop: 4 }}>
                      Precio: <strong>{formatCurrency(t.precio || 0)}</strong> • Unidad: <strong>{t.unidad || '-'}</strong> • Rubro: <strong>{t.tipoServicio === 'vidrieria' ? 'Vidriería' : (t.tipoServicio === 'muebleria' ? 'Mueblería' : t.tipoServicio)}</strong>
                    </div>
                    {t.descripcionBase && (
                      <div className="small" style={{ marginTop: 6, color: '#666', fontStyle: 'italic' }}>
                        Descripción base: {t.descripcionBase}
                      </div>
                    )}
                    <div className="small" style={{ marginTop: 6, color: '#999' }}>
                      Creada: {new Date(t.createdAt).toLocaleDateString()} • Estado: {t.activo ? '✓ Activa' : '✗ Inactiva'}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap: 8, alignItems:'center', marginLeft: 12 }}>
                    {editingId === t.id ? (
                      <>
                        <input type="number" value={editingPrecio} onChange={e=>setEditingPrecio(e.target.value)} style={{ width: 100 }} />
                        <button className="btn" onClick={saveEdit} style={{ fontSize: '0.9em' }}>Guardar</button>
                        <button className="btn" onClick={cancelEdit} style={{ fontSize: '0.9em' }}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="btn" onClick={()=>startEdit(t)} style={{ fontSize: '0.9em' }}>Editar precio</button>
                        <button className="btn" style={{ background:'#e74c3c', fontSize: '0.9em' }} onClick={()=>deleteTemplate(t.id)}>Borrar</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* TAB: HISTORIAL */}
      {activeTab === 'history' && (
        <div>
          <h3>Historial de servicios (legado)</h3>
          <p className="small" style={{ color: '#666', marginBottom: 12 }}>
            Esta es la lista de servicios individuales registrados. Se recomienda usar Plantillas en su lugar.
          </p>
          
          <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, marginBottom: 16 }}>
            <h4 style={{ marginTop: 0 }}>Agregar servicio individual</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                className="input"
                placeholder="Nombre del servicio"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <select className="input" value={tipo} onChange={e=>setTipo(e.target.value)}>
                <option value="vidrieria">Vidriería</option>
                <option value="muebleria">Mueblería</option>
                <option value="otro">Otro</option>
              </select>
              <input
                className="input"
                placeholder="Costo del servicio"
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <textarea className="input" placeholder="Descripción (opcional)" value={descripcion} onChange={e=>setDescripcion(e.target.value)} />
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={agregarServicio}>Agregar Servicio</button>
            </div>
          </div>

          <h3>Lista de Servicios</h3>
          {(services || []).length === 0 ? (
            <p style={{ color: '#999' }}>No hay servicios en el historial</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {(services || []).map(s => (
                <li key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding: 12, borderBottom: '1px solid #eee' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '1.1em' }}>{s.name || s.nombre}</strong>
                    <div className="small" style={{ marginTop: 4 }}>
                      Precio: <strong>{formatCurrency(s.price || s.precio || 0)}</strong> • Unidad: <strong>{s.unidad || '-'}</strong> • Rubro: <strong>{s.tipoServicio === 'vidrieria' ? 'Vidriería' : (s.tipoServicio === 'muebleria' ? 'Mueblería' : s.tipoServicio)}</strong>
                    </div>
                    {(s.descripcion || s.description) && (
                      <div className="small" style={{ marginTop: 6, color: '#666' }}>
                        {s.descripcion || s.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', gap: 8, alignItems:'center', marginLeft: 12 }}>
                    {editingId === s.id ? (
                      <>
                        <input type="number" value={editingPrecio} onChange={e=>setEditingPrecio(e.target.value)} style={{ width: 100 }} />
                        <button className="btn" onClick={saveEdit} style={{ fontSize: '0.9em' }}>Guardar</button>
                        <button className="btn" onClick={cancelEdit} style={{ fontSize: '0.9em' }}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="btn" onClick={()=>startEdit(s)} style={{ fontSize: '0.9em' }}>Editar costo</button>
                        <button className="btn" style={{ background:'#e74c3c', fontSize: '0.9em' }} onClick={()=>deleteService(s.id)}>Borrar</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
