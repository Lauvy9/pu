import React from 'react'

export default function SelectorUnidades({ unidades, setUnidades }) {
  return (
    <div style={{marginBottom: 12}}>
      <label>
        Unidades:&nbsp;
        <select value={unidades} onChange={e => setUnidades(e.target.value)}>
          <option value="mm">Milímetros</option>
          <option value="cm">Centímetros</option>
          <option value="in">Pulgadas</option>
        </select>
      </label>
    </div>
  )
}