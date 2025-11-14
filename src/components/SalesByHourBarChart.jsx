import React, { useMemo, useRef, useState, useEffect } from 'react'
import { formatCurrency } from '../utils/helpers'

export default function SalesByHourBarChart({ salesData = [], width = 720, height = 240, responsive = true }){
  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
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
  const innerW = (responsive ? w : width) - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const { hours, max } = useMemo(()=>{
    const mapArr = []
    for (let i=0;i<24;i++) mapArr[i] = { products:0, services:0, total:0 }
    const list = Array.isArray(salesData) ? salesData : []
    for (let idx=0; idx<list.length; idx++){
      const sale = list[idx]
      const d = new Date(sale.date || sale.createdAt || sale.timestamp || Date.now())
      const h = d.getHours()
      const isService = sale.type === 'service' || (Array.isArray(sale.items) && sale.items.every(i=> i.isService))
      const amount = Number(sale.total || sale.amount || sale.totalAmount || 0)
      if (isService) mapArr[h].services += amount
      else mapArr[h].products += amount
      mapArr[h].total += amount
    }
    let maxVal = 1
    for (let i=0;i<24;i++) if (mapArr[i].total > maxVal) maxVal = mapArr[i].total
    return { hours: mapArr, max: Math.max(1, maxVal) }
  }, [salesData])

  const barWidth = innerW / 24 * 0.8

  const [tooltip, setTooltip] = useState({ visible:false, x:0, y:0, text:'' })

  return (
    <div ref={containerRef} style={{ width: responsive ? '100%' : width, height, position:'relative' }}>
      <svg width={responsive ? '100%' : width} height={height} viewBox={`0 0 ${responsive ? w : width} ${height}`}>
      <g transform={`translate(${padding.left},${padding.top})`}>
        {/* grid lines */}
        {(() => {
          const gl = []
          for (let i=0;i<5;i++){ const y = innerH - (i/4)*innerH; gl.push(<line key={i} x1={0} x2={innerW} y1={y} y2={y} stroke="#eee" />) }
          return gl
        })()}

        {/* bars stacked: products (left) and services (right) */}
        {hours.map((h, i)=>{
          const x = i * (innerW/24) + ((innerW/24) - barWidth)/2
          const prodH = (h.products / (max)) * innerH
          const servH = (h.services / (max)) * innerH
          return (
            <g key={i}>
              <rect x={x} y={innerH - prodH} width={barWidth} height={prodH} fill="#36A2EB" rx={3}
                style={{ transition: 'height .4s ease' }}
                onMouseEnter={(e)=> setTooltip({ visible:true, x: e.clientX, y: e.clientY, text: `Hora ${i}: Productos ${formatCurrency(h.products)}` })}
                onMouseMove={(e)=> setTooltip(t=> ({ ...t, x: e.clientX, y: e.clientY }))}
                onMouseLeave={()=> setTooltip({ visible:false, x:0, y:0, text:'' })}
              />
              <rect x={x} y={innerH - prodH - servH} width={barWidth} height={servH} fill="#FFCE56" rx={3}
                style={{ transition: 'height .4s ease' }}
                onMouseEnter={(e)=> setTooltip({ visible:true, x: e.clientX, y: e.clientY, text: `Hora ${i}: Servicios ${formatCurrency(h.services)}` })}
                onMouseMove={(e)=> setTooltip(t=> ({ ...t, x: e.clientX, y: e.clientY }))}
                onMouseLeave={()=> setTooltip({ visible:false, x:0, y:0, text:'' })}
              />
              <text x={x + barWidth/2} y={innerH + 14} fontSize={10} textAnchor="middle">{i}</text>
            </g>
          )
        })}

        {/* axis labels */}
        <text x={-30} y={-6} fontSize={12} fill="#666">Monto</text>
      </g>
      </svg>
      {tooltip.visible ? (
        <div style={{ position:'fixed', left: tooltip.x + 8, top: tooltip.y + 8, background:'#111', color:'#fff', padding:'6px 8px', borderRadius:6, fontSize:12, pointerEvents:'none', zIndex:9999 }}>{tooltip.text}</div>
      ) : null}
    </div>
  )
}
