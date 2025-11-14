import React from 'react'
export default function SmallMetric({title, value, hint}){
  return (
    <div className="card small">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div className="small">{title}</div>
          <div style={{fontSize:20,fontWeight:700}}>{value}</div>
        </div>
        {hint && <div className="small">{hint}</div>}
      </div>
    </div>
  )
}