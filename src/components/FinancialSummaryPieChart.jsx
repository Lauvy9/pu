import React, { useMemo, useRef, useEffect, useState } from 'react'

export default function FinancialSummaryPieChart({ data = {}, width = 360, height = 360, responsive = true }){
  const { totalSales = 0, costoMateriales = 0, gastosOperativos = 0, netProfit = 0 } = data || {}

  // Fallback: si todos los valores son 0, mostrar placeholder
  if (!totalSales && !costoMateriales && !gastosOperativos && !netProfit) {
    return (
      <div style={{ width: responsive ? '100%' : width, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 8, padding: 20, flexDirection: 'column' }}>
        <p style={{ margin: 0, color: '#666', fontSize: 14 }}>📊 Resumen Financiero</p>
        <p style={{ marginTop: 8, color: '#999', fontSize: 12 }}>No hay datos financieros para este período</p>
      </div>
    )
  }

  const values = useMemo(()=>[
    { key: 'Ventas', value: Number(totalSales || 0), color: '#36A2EB' },
    { key: 'Costo Materiales', value: Number(costoMateriales || 0), color: '#FF6384' },
    { key: 'Gastos Operativos', value: Number(gastosOperativos || 0), color: '#FFCE56' },
    { key: 'Ganancia Neta', value: Number(netProfit || 0), color: '#2ECC71' }
  ], [totalSales, costoMateriales, gastosOperativos, netProfit])

  const total = values.reduce((s,v)=> s + Math.max(0, v.value), 0)

  // debug
  useEffect(()=>{
    try{ console.debug('FinancialSummaryPieChart data', { data, values, total }) }catch(e){}
  }, [data, values, total])

  const containerRef = useRef(null)
  const [w, setW] = useState(width)
  useEffect(()=>{
    if (!responsive) return
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(()=> setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return ()=> ro.disconnect()
  }, [responsive])

  // draw arcs
  const cx = (responsive ? w : width)/2
  const cy = height/2
  const r = Math.min(responsive ? w : width, height)/2 - 10
  let acc = 0
  const circumference = 2 * Math.PI * r
  const slices = values.map((v, idx) => {
    const perc = total ? (v.value / total) : 0
    const length = perc * circumference
    const start = acc
    acc += length
    return { ...v, perc, start, length }
  })

  function polarToCartesian(cx, cy, r, angle){
    const rad = (angle - 90) * Math.PI / 180.0
    return { x: cx + (r * Math.cos(rad)), y: cy + (r * Math.sin(rad)) }
  }
  function describeArc(cx, cy, r, startPerc, endPerc){
    const startAngle = startPerc * 360
    const endAngle = endPerc * 360
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, 'Z'].join(' ')
  }

  return (
    <div ref={containerRef} style={{ width: responsive ? '100%' : width, height, display:'flex', gap:12, alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:12, alignItems:'center', flex:1 }}>
        <svg width={responsive ? Math.min(w, 320) : width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ border: '1px solid #eee' }}>
          {slices.map((s, i) => {
            const prevPerc = slices.slice(0,i).reduce((p,x)=>p + x.perc, 0)
            const path = describeArc(cx, cy, r, prevPerc, prevPerc + s.perc)
            return (
              <path key={s.key}
                d={path}
                fill={s.color}
                stroke="#fff"
                strokeWidth={2}
              />
            )
          })}
          <circle cx={cx} cy={cy} r={r/3} fill="#fff" stroke="#ccc" strokeWidth={1} />
          <text x={cx} y={cy-8} textAnchor="middle" dominantBaseline="middle" style={{ fontSize:12, fontWeight:700, fill:'#333' }}>
            {new Intl.NumberFormat('es-CO').format(Math.round(total || 0))}
          </text>
          <text x={cx} y={cy+8} textAnchor="middle" dominantBaseline="middle" style={{ fontSize:10, fill:'#999' }}>
            Total
          </text>
        </svg>
        <div style={{ display:'flex', flexDirection:'column', gap:6, width:'100%' }}>
          {values.map(v => (
            <div key={v.key} style={{ display:'flex', gap:8, alignItems:'center', fontSize:'0.9rem' }}>
              <div style={{ width:10, height:10, background:v.color, borderRadius:2, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700 }}>{v.key}</div>
                <div className="small-muted">{((v.value || 0) / (total || 1) * 100).toFixed(1)}%</div>
              </div>
              <div style={{ fontWeight:700, textAlign:'right' }}>{new Intl.NumberFormat('es-CO').format(v.value || 0)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
