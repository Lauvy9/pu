import React, { useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import SmallMetric from '../components/SmallMetric'
import { formatCurrency } from '../utils/helpers'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, ArcElement, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
// Nota: preferimos usar el selector expuesto por el StoreContext si está disponible

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
)

export default function Dashboard(){
  const {sales, products, transactions} = useStore()
  const today = new Date().toDateString()

  const salesToday = (sales || []).filter(s=> new Date(s.date).toDateString() === today)

  // prefer transactions if we have ventas in transactions (they are per-item)
  const txToday = (transactions || []).filter(t => t.tipo === 'venta' && new Date(t.fecha || t.date || 0).toDateString() === today)

  const productCounts = useMemo(()=>{
    const map = {}
    if (txToday && txToday.length > 0) {
      txToday.forEach(t => {
        const name = t.nombreProducto || t.name || '-'
        const qty = Number(t.cantidad || 0)
        map[name] = (map[name] || 0) + qty
      })
    } else {
      salesToday.forEach(s=> 
        (s.items || []).forEach(it=>{
          map[it.name] = (map[it.name]||0) + (Number(it.qty || 0) || 0)
        })
      )
    }
    return Object.entries(map).sort((a,b)=> b[1]-a[1])
  },[salesToday, txToday])

  const labels = productCounts.map(p=> p[0])
  const counts = productCounts.map(p=> p[1])

  const typeDist = useMemo(()=>{
    const d = {mayorista:0, minorista:0, fiado:0}
    if (txToday && txToday.length > 0) {
      txToday.forEach(t => {
        const cat = t.categoria || t.type || 'minorista'
        d[cat] = (d[cat] || 0) + Number(t.total || 0)
      })
    } else {
      salesToday.forEach(s=> d[s.type] = (d[s.type]||0) + Number(s.total || 0))
    }
    return d
  },[salesToday, txToday])

  // compute gains/labels and totals: prefer txToday when available
  const gains = useMemo(()=>{
    if (txToday && txToday.length > 0) {
      return txToday.map(t => {
        const qty = Number(t.cantidad || 0)
        const unit = qty > 0 ? (Number(t.total || 0) / qty) : 0
        const prod = (products || []).find(p => String(p.id) === String(t.productoId))
        const cost = Number(prod?.cost || 0)
        return Math.round(((unit - cost) * qty) * 100) / 100
      })
    }
    return salesToday.map(s=> Number(s.profit || 0))
  },[txToday, salesToday, products])

  const gainLabels = useMemo(()=>{
    if (txToday && txToday.length > 0) return txToday.map(t => new Date(t.fecha || t.date || '').toLocaleTimeString())
    return salesToday.map(s=> new Date(s.date).toLocaleTimeString())
  },[txToday, salesToday])

  const totalDay = useMemo(()=>{
    if (txToday && txToday.length > 0) return txToday.reduce((s,t)=> s + Number(t.total || 0), 0)
    return salesToday.reduce((s,i)=> s + Number(i.total || 0), 0)
  },[txToday, salesToday])

  const profitDay = useMemo(()=>{
    if (txToday && txToday.length > 0) return gains.reduce((s,g)=> s + Number(g || 0), 0)
    return salesToday.reduce((s,i)=> s + Number(i.profit || 0), 0)
  },[txToday, salesToday, gains])
  const low = products.filter(p=> p.stock <= (p.minStock ?? 1))

  // Ganancias por unidad de negocio (MVP): sumar profit de cada venta según sale.businessUnit
  const profitByUnit = useMemo(()=>{
    const res = { mobileria: 0, vidrieria: 0 }
    salesToday.forEach(s => {
      const unit = (s.businessUnit || '').toString().toLowerCase()
      const profit = Number(s.profit || ((s.items || []).reduce((sum,it)=> {
        const cost = Number((products || []).find(p=> String(p.id)===String(it.id))?.cost || it.cost || 0)
        const unitPrice = Number(it.price || it.unitPrice || 0)
        const qty = Number(it.qty || it.quantity || 0)
        return sum + ((unitPrice - cost) * qty)
      }, 0))) || 0
      if (unit.includes('mobi') || unit.includes('mue')) res.mobileria += profit
      else if (unit.includes('vid')) res.vidrieria += profit
    })
    return res
  }, [salesToday, products])

  // Reposición / compra hoy por unidad (desde transacciones)
  const reposicionByUnitToday = useMemo(()=>{
    const r = { mobileria: 0, vidrieria: 0 }
    const relevant = (transactions || []).filter(t => (t.tipo === 'reposicion' || t.tipo === 'compra') && new Date(t.fecha || t.date || 0).toDateString() === today)
    relevant.forEach(t => {
      const raw = (t.businessUnit || '').toString().toLowerCase()
      if (raw.includes('mobi') || raw.includes('mue')) r.mobileria += Number(t.total || 0)
      else if (raw.includes('vid')) r.vidrieria += Number(t.total || 0)
    })
    return r
  }, [transactions])

  // Construir dashboardData usando la utilidad central para asegurar que incluya
  // totalsByUnit, expensesByUnit y netProfitByUnit. Usamos un rango amplio para
  // abarcar todos los registros disponibles en el store.
  const store = useStore()
  const dashboardData = useMemo(()=>{
    try{
      const dateRangeAll = { start: '1970-01-01', end: new Date().toISOString().slice(0,10) }
      if (store && typeof store.getDashboardData === 'function') return store.getDashboardData(dateRangeAll) || {}
      // fallback: intentar importar la utilidad directamente si el selector no existe
      try{
        // lazy require to avoid circular imports in some environments
        const { calculateFinancialData: _calc } = require('../utils/financeHelpers')
        return _calc(dateRangeAll, sales || [], [], []) || {}
      }catch(e){ return {} }
    }catch(e){ console.warn('dashboardData calc failed in Dashboard.jsx', e); return {} }
  }, [sales, store])

  // Asegurar que los campos por unidad existan en el objeto (no modificar métricas existentes)
  const ensuredDashboardData = useMemo(()=>{
    const d = { ...(dashboardData || {}) }
    d.totalsByUnit = d.totalsByUnit ?? { muebleria: 0, vidrieria: 0, sin_especificar: 0 }
    d.expensesByUnit = d.expensesByUnit ?? { muebleria: 0, vidrieria: 0, sin_especificar: 0 }
    d.netProfitByUnit = d.netProfitByUnit ?? { muebleria: 0, vidrieria: 0, sin_especificar: 0 }
    try{
      console.log('DASHBOARD - ensuredDashboardData.totalsByUnit:', d.totalsByUnit)
      console.log('DASHBOARD - ensuredDashboardData.expensesByUnit:', d.expensesByUnit)
      console.log('DASHBOARD - ensuredDashboardData.netProfitByUnit:', d.netProfitByUnit)
    }catch(e){}
    return d
  }, [dashboardData])

  return (
    <div className="grid">
      <div style={{ display:'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          <SmallMetric title="Ventas Totales del Día" value={formatCurrency(totalDay)} />
          <SmallMetric title="Ganancia Total" value={formatCurrency(profitDay)} />
          <SmallMetric title="Ganancia Mueblería" value={formatCurrency(profitByUnit.mobileria || 0)} />
          <SmallMetric title="Ganancia Vidriería" value={formatCurrency(profitByUnit.vidrieria || 0)} />
          <SmallMetric title="Gastos Mueblería" value={formatCurrency(reposicionByUnitToday.mobileria || 0)} />
          <SmallMetric title="Gastos Vidriería" value={formatCurrency(reposicionByUnitToday.vidrieria || 0)} />
        </div>

      <div className="card">
        <h4>Productos más vendidos (hoy)</h4>
        {labels.length===0 ? (
          <p className="small">No hay ventas hoy</p>
        ) : (
          <Bar
            data={{
              labels,
              datasets: [{
                label: 'Cantidad',
                data: counts,
                backgroundColor: [
                  '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#a14f6aff',
                  '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
                ],
                borderColor: '#333',
                borderWidth: 1
              }]
            }}
          />
        )}
      </div>

      <div className="card">
        <h4>Distribución Mayorista vs Minorista (hoy)</h4>
        <Doughnut
          data={{
            labels: ['Mayorista', 'Minorista'],
            datasets: [{
              data: [typeDist.mayorista, typeDist.minorista],
              // 🔹 Aseguramos colores distintos
              backgroundColor: ['#36a2eb', '#ff6384'],
              borderColor: ['#ffffff', '#ffffff'],
              borderWidth: 2
            }]
          }}
          options={{
            plugins: {
              legend: { position: 'bottom' }
            }
          }}
        />
      </div>

      <div className="card">
        <h4>Ganancias del día (por transacción)</h4>
        {gainLabels.length===0 ? (
          <p className="small">Sin ganancias hoy</p>
        ) : (
          <Line
            data={{
              labels: gainLabels,
              datasets: [{
                label: 'Ganancia',
                data: gains,
                fill: false,
                backgroundColor: '#43aa8b',
                borderColor: '#43aa8b',
                tension: 0.3
              }]
            }}
          />
        )}
      </div>

      <div className="card">
        <h4>Productos en alerta</h4>
        <ul>
          {low.map(p=> <li key={p.id}>{p.name} — {p.stock} unidades</li>)}
        </ul>
      </div>
    </div>
  )
}