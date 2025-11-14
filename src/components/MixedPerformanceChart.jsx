import React, { useMemo, useRef, useState, useEffect } from 'react'
import { formatCurrency } from '../utils/helpers'

export default function MixedPerformanceChart({ todaySales = [], prevSales = [], weekAvg = [], width = 720, height = 260, responsive = true }){
  // normalize inputs to avoid runtime errors when callers pass unexpected values
  const safeTodaySales = Array.isArray(todaySales) ? todaySales : []
  const safePrevSales = Array.isArray(prevSales) ? prevSales : []
  const safeWeekAvg = Array.isArray(weekAvg) ? weekAvg : []
  const containerRef = useRef(null)
  const [w, setW] = useState(width)
  useEffect(()=>{
    if(!responsive) return
    const el = containerRef.current
    if(!el) return
    const ro = new ResizeObserver(()=> setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return ()=> ro.disconnect()
  }, [responsive])
  // build series by hour
  const pad = { top: 20, right: 20, bottom: 30, left: 40 }
  const innerW = (responsive ? w : width) - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const series = useMemo(()=>{
    try{
      const buildHour = (arr)=>{
        const a = []
        for (let i=0;i<24;i++) a[i]=0
        (arr||[]).forEach(sale=>{
          const d = new Date(sale.date || sale.createdAt || Date.now())
          const h = d.getHours()
          a[h] += Number(sale.total || sale.amount || 0)
        })
        return a
      }
      const avg = []
      for (let i=0;i<24;i++) avg[i] = (safeWeekAvg && typeof safeWeekAvg[i] !== 'undefined') ? Number(safeWeekAvg[i]) : 0
      return { today: buildHour(safeTodaySales), prev: buildHour(safePrevSales), avg }
    }catch(e){
      console.error('MixedPerformanceChart: error building series', e)
      const zeros = []
      for (let i=0;i<24;i++) zeros[i]=0
      return { today: zeros, prev: zeros, avg: zeros }
    }
  }, [safeTodaySales, safePrevSales, safeWeekAvg])

  const maxVal = Math.max(1, ...series.today, ...series.prev, ...series.avg)
  const pointsFor = (arr) => arr.map((v,i)=> ({ x: Math.round((i/23)*innerW), y: Math.round(innerH - (v/maxVal)*innerH) }))
  const todayPts = pointsFor(series.today)
  const prevPts = pointsFor(series.prev)
  const avgPts = pointsFor(series.avg)

  const linePath = (pts) => pts.map((p,i)=> (i===0? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')

  const [tooltip, setTooltip] = useState({ visible:false, x:0, y:0, text:'' })

  // build grid and labels with explicit loops to avoid runtime issues in some bundlers
  const gridLines = []
  for (let i=0;i<4;i++){
    const y = innerH - (i/3)*innerH
    gridLines.push(<line key={i} x1={0} x2={innerW} y1={y} y2={y} stroke="#f0f0f0" />)
  }

  const xLabels = []
  for (let i=0;i<24;i++){
    const x = Math.round((i/23)*innerW)
    xLabels.push(<text key={i} x={x} y={innerH + 14} fontSize={9} textAnchor="middle">{i}</text>)
  }

  return (
    <div ref={containerRef} style={{ width: responsive ? '100%' : width, height, position:'relative' }}>
      <svg width={responsive ? '100%' : width} height={height} viewBox={`0 0 ${responsive ? w : width} ${height}`}>
      <g transform={`translate(${pad.left},${pad.top})`}>
        {gridLines}

        {/* area for avg */}
        <path d={`${'M 0 '+innerH} ${avgPts.map((p,i)=> `L ${p.x} ${p.y}`).join(' ')} L ${innerW} ${innerH} Z`} fill="#9b59b420" stroke="none" />

        {/* lines: prev (dashed), today (solid), avg (thin) */}
        <path d={linePath(prevPts)} fill="none" stroke="#95a5a6" strokeDasharray="4 6" strokeWidth={2} style={{ transition:'stroke-dashoffset .8s ease' }} />
        <path d={linePath(todayPts)} fill="none" stroke="#2ecc71" strokeWidth={3} style={{ strokeDasharray: 1000, strokeDashoffset: 0, transition: 'stroke-dashoffset .8s ease' }} />
        <path d={linePath(avgPts)} fill="none" stroke="#9b59b6" strokeWidth={1.5} />

        {/* dots */}
        {todayPts.map((p,i)=> (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="#2ecc71"
            onMouseEnter={(e)=> setTooltip({ visible:true, x:e.clientX, y:e.clientY, text:`Hora ${i}: ${formatCurrency(series.today[i])}` })}
            onMouseMove={(e)=> setTooltip(t=> ({ ...t, x:e.clientX, y:e.clientY }))}
            onMouseLeave={()=> setTooltip({ visible:false, x:0, y:0, text:'' })}
          />
        ))}

        {/* x axis labels */}
        {xLabels}

      </g>
      </svg>
      {tooltip.visible ? (
        <div style={{ position:'fixed', left: tooltip.x + 8, top: tooltip.y + 8, background:'#111', color:'#fff', padding:'6px 8px', borderRadius:6, fontSize:12, pointerEvents:'none', zIndex:9999 }}>{tooltip.text}</div>
      ) : null}
    </div>
  )
}
