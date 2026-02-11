import React, { useMemo, useState, useRef, useEffect } from 'react'

export default function ProductSalesPieChart({ salesData = [], maxSlices = 6, width = 360, height = 360, responsive = true }){
  // Asegurar que salesData es un array
  const safeSalesData = Array.isArray(salesData) ? salesData : []

  const productStats = useMemo(()=>{
    const products = {}
    safeSalesData.forEach(sale => {
      const items = Array.isArray(sale?.items) ? sale.items : []
      if (items.length === 0) {
        // Fallback: si la venta no tiene items, usar la venta completa como una entrada
        const name = sale.title || sale.description || sale.clientName || (sale.id || sale._id) || 'Venta'
        const qty = 1
        const total = Number(sale.total || sale.amount || sale.monto || 0) || 0
        if (!products[name]) products[name] = { qty: 0, total: 0 }
        products[name].qty += qty
        products[name].total += total
      } else {
        items.forEach(it => {
          const name = it?.name || it?.product || 'Desconocido'
          const qty = Number(it?.qty || it?.quantity || 1)
          const total = (Number(it?.price || it?.unitPrice || 0) || 0) * qty
          if (!products[name]) products[name] = { qty: 0, total: 0 }
          products[name].qty += qty
          products[name].total += total
        })
      }
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
    console.debug('ProductSalesPieChart: no slices', { safeSalesData, productStats })
    return (
      <div className="chart-container" style={{ width: responsive ? '100%' : width, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 8, padding: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 14 }}> Productos Más Vendidos</h3>
          <p style={{ margin: '8px 0', fontSize: 12, color: '#666' }}>No hay datos de ventas para mostrar en este rango</p>
          <details style={{ marginTop: 12, textAlign: 'left', fontSize: 11 }}>
            <summary style={{ cursor: 'pointer', color: '#0066cc' }}>Debug info</summary>
            <pre style={{ maxWidth: 400, marginTop: 8, whiteSpace: 'pre-wrap', background: '#fff', padding: 8, border: '1px solid #ddd', borderRadius: 4, overflow: 'auto', maxHeight: 150 }}>{JSON.stringify({ salesCount: safeSalesData.length, slices: productStats?.slices?.length || 0 }, null, 2)}</pre>
          </details>
        </div>
      </div>
    )
  }

  const { totalSum, slices: dataSlices } = productStats

  // Fallback extra: si totalSum es 0 pero hay ventas, usar totals por venta
  let finalSlices = dataSlices
  let finalTotal = totalSum
  if ((!finalTotal || finalTotal === 0) && safeSalesData.length > 0) {
    const bySale = safeSalesData.map(s => ({
      name: s.clientName || s.title || s.id || (s._id ? String(s._id) : 'Venta'),
      qty: 1,
      total: Number(s.total || s.amount || s.monto || 0) || 0
    })).filter(x => x.total > 0)
    const sum = bySale.reduce((a,b)=> a + b.total, 0)
    if (bySale.length && sum > 0) {
      finalTotal = sum
      finalSlices = bySale.map((b, idx) => ({ ...b, perc: sum ? (b.total / sum) : 0, color: COLORS[idx % COLORS.length] }))
    }
  }

  const totalValue = finalTotal
  const dataToDraw = finalSlices

  const cx = (responsive ? w : width)/2
  const cy = height/2
  const r = Math.min(responsive ? w : width, height)/2 - 10
  // build arcs
  const circumference = 2 * Math.PI * r
  let acc = 0
  const slices = dataToDraw.map((s, idx)=>{
    const start = acc
    const portion = s.perc || (totalValue ? (s.total / totalValue) : 0)
    const length = portion * circumference
    acc += length
    return { ...s, start, length, color: s.color || COLORS[idx % COLORS.length], perc: portion }
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
      <div style={{ marginTop:8 }}>
        <small className="small-muted">Debug: slices</small>
        <pre style={{ maxHeight:120, overflow:'auto', background:'#fafafa', padding:8 }}>{JSON.stringify(productStats.slices, null, 2)}</pre>
      </div>
    </div>
  )
}

const COLORS = [ '#FF6384', '#36A2EB', '#FFCE56', '#9B59B6', '#2ECC71', '#E67E22', '#34495E' ]

function formatCurrency(v){ try{ return `$${Number(v||0).toLocaleString()}` }catch(e){ return `$${v}` } }
