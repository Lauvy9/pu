import React from 'react'

const materiales = [
  { nombre: 'Vidrio común', precio: 2000 },
  { nombre: 'Vidrio templado', precio: 3500 },
  { nombre: 'Vidrio laminado', precio: 5000 }
]

export default function CalculadoraVidrio({ unidades, onChange }) {
  function handleChange(e) {
    const { name, value } = e.target
    onChange(prev => ({ ...prev, [name]: value }))
  }
  return (
    <form>
      <h3>Datos de Vidrio</h3>
      <label>
        Ancho ({unidades}):
        <input type="number" name="ancho" min="0" onChange={handleChange} />
      </label>
      <label>
        Alto ({unidades}):
        <input type="number" name="alto" min="0" onChange={handleChange} />
      </label>
      <label>
        Material:
        <select name="material" onChange={handleChange}>
          <option value="">Seleccione</option>
          {materiales.map(m => (
            <option key={m.nombre} value={m.nombre}>{m.nombre} (${m.precio}/m²)</option>
          ))}
        </select>
      </label>
    </form>
  )
}