import React, { useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import SmallMetric from '../components/SmallMetric'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, ArcElement, PointElement, LineElement, Tooltip, Legend } from 'chart.js'

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
  const {sales, products} = useStore()
  const today = new Date().toDateString()

  const salesToday = sales.filter(s=> new Date(s.date).toDateString() === today)

  const productCounts = useMemo(()=>{
    const map = {}
    salesToday.forEach(s=> 
      s.items.forEach(it=>{
        map[it.name] = (map[it.name]||0) + it.qty
      })
    )
    return Object.entries(map).sort((a,b)=> b[1]-a[1])
  },[salesToday])

  const labels = productCounts.map(p=> p[0])
  const counts = productCounts.map(p=> p[1])

  const typeDist = useMemo(()=>{
    const d = {mayorista:0, minorista:0}
    salesToday.forEach(s=> d[s.type] = (d[s.type]||0) + s.total)
    return d
  },[salesToday])

  const gains = salesToday.map(s=> s.profit)
  const gainLabels = salesToday.map(s=> new Date(s.date).toLocaleTimeString())

  const totalDay = salesToday.reduce((s,i)=> s + i.total, 0)
  const profitDay = salesToday.reduce((s,i)=> s + i.profit, 0)
  const low = products.filter(p=> p.stock <= (p.minStock ?? 1))

  return (
    <div className="grid">
      <div className="grid cols-3">
        <SmallMetric title="Ventas Totales del Día" value={totalDay.toFixed(2)} />
        <SmallMetric title="Ganancia Total" value={profitDay.toFixed(2)} />
        <SmallMetric title="Productos con Stock Bajo" value={low.length} />
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
                  '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
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