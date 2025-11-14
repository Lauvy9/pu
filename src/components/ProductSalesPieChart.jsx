import React, { useMemo, useState, useRef, useEffect } from 'react'

export default function ProductSalesPieChart({ salesData = [], maxSlices = 6, width = 360, height = 360, responsive = true }){
  // Asegurar que salesData es un array
  const safeSalesData = Array.isArray(salesData) ? salesData : []

  const productStats = useMemo(()=>{
    const products = {}
    safeSalesData.forEach(sale => {
      const items = Array.isArray(sale?.items) ? sale.items : []
      items.forEach(it => {
        const name = it?.name || it?.product || 'Desconocido'
        const qty = Number(it?.qty || it?.quantity || 1)
        const total = (Number(it?.price || it?.unitPrice || 0) || 0) * qty
        if (!products[name]) products[name] = { qty: 0, total: 0 }
        products[name].qty += qty
        products[name].total += total
      })
    })

    const entries = Object.entries(products).map(([name, v]) => ({ name, qty: v.qty, total: v.total }))
    entries.sort((a, b) => b.total - a.total)

    const top = entries.slice(0, maxSlices)
    const others = entries.slice(maxSlices)
    const totalSum = entries.reduce((s, i) => s + i.total, 0)

    if (others.length) {
      const othersTotal = others.reduce((s, i) => s + i.total, 0)
      top.push({ name: 'Otros', qty: others.reduce((s, i) => s + i.qty, 0), total: othersTotal })
    }

    const withPerc = top.map(t => ({ ...t, perc: totalSum ? (t.total / totalSum) : 0 }))
    return { totalSum, slices: withPerc }
  }, [safeSalesData, maxSlices])

  // hooks must be declared unconditionally, before any early returns
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

  const [tooltip, setTooltip] = useState({ visible:false, x:0, y:0, text:'' })

  // Si no hay datos, mostrar mensaje
  if (!productStats || !Array.isArray(productStats.slices) || productStats.slices.length === 0) {
    return (
      <div className="chart-container" style={{ width: responsive ? '100%' : width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>🎯 Productos Más Vendidos</h3>
          <p style={{ marginTop: 8 }}>No hay datos de ventas para mostrar</p>
        </div>
      </div>
    )
  }

  const { totalSum, slices: dataSlices } = productStats

  const cx = (responsive ? w : width)/2
  const cy = height/2
  const r = Math.min(responsive ? w : width, height)/2 - 10
  // build arcs
  const circumference = 2 * Math.PI * r
  let acc = 0
  const slices = dataSlices.map((s, idx)=>{
    const start = acc
    const portion = s.perc
    const length = portion * circumference
    acc += length
    return { ...s, start, length, color: COLORS[idx % COLORS.length] }
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
    <div ref={containerRef} style={{ width: responsive ? '100%' : width, height, display:'flex', gap:12, alignItems:'center', position:'relative' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {slices.reduce((accum, s, i) => {
          const prevPerc = slices.slice(0,i).reduce((p,x)=>p + x.perc, 0)
          const path = describeArc(cx, cy, r, prevPerc, prevPerc + s.perc)
          accum.push(
            <path key={s.name}
              d={path}
              fill={s.color}
              stroke="#fff"
              strokeWidth={1}
              style={{ transition: 'opacity .4s ease, transform .4s ease' }}
              onMouseEnter={(e)=> setTooltip({ visible:true, x:e.clientX, y:e.clientY, text:`${s.name}: ${s.qty} uds • ${(s.perc*100).toFixed(1)}%` }) }
              onMouseMove={(e)=> setTooltip(t=> ({ ...t, x:e.clientX, y:e.clientY })) }
              onMouseLeave={()=> setTooltip({ visible:false, x:0, y:0, text:'' }) }
            />
          )
          return accum
        }, [])}
        <circle cx={cx} cy={cy} r={r/3} fill="#fff" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" style={{ fontSize:14, fontWeight:700 }}>
          {formatCurrency(totalSum || 0)}
        </text>
      </svg>

      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {slices.map(s=> (
          <div key={s.name} style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ width:12, height:12, background:s.color, borderRadius:3 }} />
            <div style={{ minWidth:140 }}>
              <div style={{ fontWeight:700 }}>{s.name}</div>
              <div className="small-muted">{s.qty} uds • {(s.perc*100).toFixed(1)}%</div>
            </div>
            <div style={{ marginLeft:'auto', fontWeight:700 }}>{formatCurrency(s.total)}</div>
          </div>
        ))}
      </div>
      {tooltip.visible ? (
        <div style={{ position:'fixed', left: tooltip.x + 8, top: tooltip.y + 8, background:'#111', color:'#fff', padding:'6px 8px', borderRadius:6, fontSize:12, pointerEvents:'none', zIndex:9999 }}>{tooltip.text}</div>
      ) : null}
    </div>
  )
}

const COLORS = [ '#FF6384', '#36A2EB', '#FFCE56', '#9B59B6', '#2ECC71', '#E67E22', '#34495E' ]

function formatCurrency(v){ try{ return `$${Number(v||0).toLocaleString()}` }catch(e){ return `$${v}` } }
