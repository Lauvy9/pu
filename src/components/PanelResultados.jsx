import React from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale)

export default function PanelResultados({ resultados }) {
  // Extrae valores para el gráfico
  let area = 0
  let precio = 0
  if (resultados.area) {
    const match = resultados.area.match(/[\d.]+/)
    area = match ? Number(match[0]) : 0
  }
  if (resultados.precio) {
    const match = resultados.precio.match(/[\d.]+/)
    precio = match ? Number(match[0]) : 0
  }

  const data = {
    labels: ['Área (m²)', 'Precio ($)'],
    datasets: [
      {
        label: 'Cotización',
        data: [area, precio],
        backgroundColor: ['#4e79a7', '#f28e2b'],
      },
    ],
  }

  return (
    <div className="card">
      <h3>Resultados</h3>
      {Object.keys(resultados).length === 0 ? (
        <p>Ingrese medidas para ver el cálculo.</p>
      ) : (
        <>
          <div style={{ fontSize: '1.3em', fontWeight: 'bold', marginBottom: 12 }}>
            Total: {resultados.precio}
          </div>
          <ul>
            {Object.entries(resultados).map(([k, v]) => (
              <li key={k}><b>{k}:</b> {v}</li>
            ))}
          </ul>
          {(area > 0 || precio > 0) && (
            <div style={{ maxWidth: 320, margin: '16px auto 0 auto' }}>
              <Bar data={data} options={{
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }} />
            </div>
          )}
        </>
      )}
    </div>
  )
}