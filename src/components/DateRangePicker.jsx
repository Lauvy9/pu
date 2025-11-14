import React from 'react'

export default function DateRangePicker({ from, to, onChange, presets=true }){
  const setRange = (f, t) => onChange({ from: f, to: t })

  const today = new Date()
  const startOfWeek = new Date();
  const day = today.getDay() || 7; // make Sunday = 7
  startOfWeek.setDate(today.getDate() - (day - 1))
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth()/3)*3, 1)
  const startOfYear = new Date(today.getFullYear(), 0, 1)

  const onFromChange = (e) => {
    const newFrom = e.target.value ? new Date(e.target.value) : null
    onChange({ from: newFrom, to: to || null })
  }
  const onToChange = (e) => {
    const newTo = e.target.value ? new Date(e.target.value) : null
    onChange({ from: from || null, to: newTo })
  }

  return (
    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <label>Desde</label>
        <input type="date" value={from ? from.toISOString().slice(0,10) : ''} onChange={onFromChange} />
        <label>Hasta</label>
        <input type="date" value={to ? to.toISOString().slice(0,10) : ''} onChange={onToChange} />
      </div>
      {presets && (
        <div style={{ display:'flex', gap:6 }}>
          <button type="button" className="btn" onClick={()=>setRange(today,today)}>Hoy</button>
          <button type="button" className="btn" onClick={()=>setRange(startOfWeek,today)}>Semana</button>
          <button type="button" className="btn" onClick={()=>setRange(startOfMonth,today)}>Mes</button>
          <button type="button" className="btn" onClick={()=>setRange(startOfQuarter,today)}>Trimestre</button>
          <button type="button" className="btn" onClick={()=>setRange(startOfYear,today)}>Año</button>
        </div>
      )}
    </div>
  )
}
