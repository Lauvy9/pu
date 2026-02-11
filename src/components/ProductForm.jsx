import React, { useState } from 'react'

export default function ProductForm({ onAdd }) {
  const [form, setForm] = useState({ 
    name: '', 
    caracteristica: '', 
    stock: 0, 
    cost: 0, 
    price_minor: 0, 
    price_mayor: 0,
    porcentajeGananciaMinorista: 60,
    porcentajeGananciaMayorista: 50,
    businessUnit: ''
  })

  function handleChange(e) {
    const { name, value } = e.target
    let val = name === 'stock' || name === 'cost' || name.startsWith('porcentaje') ? Number(value) : value

    let updated = { ...form, [name]: val }

    // Si cambia el costo o los porcentajes → recalcular precios
    if (name === 'cost' || name === 'porcentajeGananciaMinorista' || name === 'porcentajeGananciaMayorista') {
      const cost = Number(name === 'cost' ? value : updated.cost) || 0
      const pctMinor = Number(updated.porcentajeGananciaMinorista) || 60
      const pctMayor = Number(updated.porcentajeGananciaMayorista) || 50
      updated.price_minor = +(cost * (1 + pctMinor / 100)).toFixed(2)
      updated.price_mayor = +(cost * (1 + pctMayor / 100)).toFixed(2)
    }

    setForm(updated)
  }

  function handleSubmit(e) {
    e.preventDefault()
    onAdd(form)
    setForm({ name: '', caracteristica: '', stock: 0, cost: 0, price_minor: 0, price_mayor: 0, porcentajeGananciaMinorista: 60, porcentajeGananciaMayorista: 50, businessUnit: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3>Agregar Producto</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <label>
          Nombre:
          <input className="input" name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Característica:
          <input className="input" name="caracteristica" value={form.caracteristica} onChange={handleChange} required />
        </label>
        <label>
          Precio de costo:
          <input className="input" name="cost" type="number" value={form.cost} onChange={handleChange} required min={0} step="0.01" />
        </label>
        <label>
          % Ganancia minorista:
          <input className="input" name="porcentajeGananciaMinorista" type="number" value={form.porcentajeGananciaMinorista} onChange={handleChange} min={0} step="0.1" />
        </label>
        <label>
          % Ganancia mayorista:
          <input className="input" name="porcentajeGananciaMayorista" type="number" value={form.porcentajeGananciaMayorista} onChange={handleChange} min={0} step="0.1" />
        </label>
        <label>
          Precio minorista (calculado):
          <input className="input" name="price_minor" type="number" value={form.price_minor} readOnly />
        </label>
        <label>
          Precio mayorista (calculado):
          <input className="input" name="price_mayor" type="number" value={form.price_mayor} readOnly />
        </label>
        <label>
          Stock:
          <input className="input" name="stock" type="number" value={form.stock} onChange={handleChange} required min={0} />
        </label>
            <label>
              Unidad de negocio:
              <select className="input" name="businessUnit" value={form.businessUnit || ''} onChange={handleChange} required>
                <option value="">Seleccionar unidad</option>
                <option value="muebleria">Mueblería</option>
                <option value="vidrieria">Vidriería</option>
              </select>
            </label>
        <div className="flex">
          <button className="btn" type="submit">Agregar</button>
          <button 
            type="button" 
            className="btn ghost" 
            onClick={() => setForm({ name: '', caracteristica: '', stock: 0, cost: 0, price_minor: 0, price_mayor: 0, porcentajeGananciaMinorista: 60, porcentajeGananciaMayorista: 50, businessUnit: '' })}
          >
            Limpiar
          </button>
        </div>
      </div>
    </form>
  )
}