import React from 'react'

export default function CalculadoraAcero({ unidades, onChange }) {
  // Aquí irán los campos y lógica para acero
  return (
    <form>
      <h3>Datos de Acero</h3>
      {/* Ejemplo de campos */}
      <label>
        Largo ({unidades}):
        <input type="number" name="largo" min="0" onChange={e => onChange(prev => ({...prev, largo: Number(e.target.value)}))} />
      </label>
      <label>
        Tipo de perfil:
        <select name="perfil" onChange={e => onChange(prev => ({...prev, perfil: e.target.value}))}>
          <option value="">Seleccione</option>
          <option value="cuadrado">Cuadrado</option>
          <option value="rectangular">Rectangular</option>
          {/* Agrega más perfiles */}
        </select>
      </label>
      {/* Agrega más campos según necesidad */}
    </form>
  )
}