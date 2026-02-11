import React from 'react'

export default function KPICard({ title, value, subtitle, color }){
  return (
    <div className="kpi-card" style={{ borderLeft: `6px solid ${color||'#2196F3'}`, padding:12, borderRadius:6, background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize:12, color:'#666' }}>{title}</div>
      <div style={{ fontSize:20, fontWeight:700, marginTop:6 }}>{value}</div>
      {subtitle ? <div style={{ fontSize:12, color:'#999', marginTop:6 }}>{subtitle}</div> : null}
    </div>
  )
}
