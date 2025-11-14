import React from 'react'

export default function MetricCard({ title, value, subtitle, color='#2196F3' }){
  return (
    <div style={{ padding: 12, borderRadius: 10, background: '#fff', boxShadow: '0 6px 14px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 12, color: '#666' }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#000', marginTop:6 }}>{value}</div>
      {subtitle ? <div style={{ marginTop:6, fontSize:12, color:'#444' }}>{subtitle}</div> : null}
    </div>
  )
}
