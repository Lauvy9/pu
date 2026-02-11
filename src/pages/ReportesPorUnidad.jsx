import React, { useMemo } from 'react'
import UnitDashboard from '../components/UnitDashboard'
import { useStore } from '../context/StoreContext'

export default function ReportesPorUnidad({ dateRange }){
  const store = useStore()
  // Obtener dashboardData via selector si está disponible
  const dashboardData = useMemo(()=>{
    try{
      if (store && typeof store.getDashboardData === 'function') return store.getDashboardData(dateRange || { start: '1970-01-01', end: new Date().toISOString().slice(0,10) }) || {}
      return {}
    }catch(e){ return {} }
  }, [store, dateRange])

  return (
    <div id="reportes-por-unidad" style={{ display:'grid', gap:12 }}>
      <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:12 }}>
        <UnitDashboard unit="muebleria" title="Mueblería" dashboardData={dashboardData} />
        <UnitDashboard unit="vidrieria" title="Vidriería" dashboardData={dashboardData} />
      </div>
    </div>
  )
}
