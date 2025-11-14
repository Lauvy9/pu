import React, { useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { Navigate } from 'react-router-dom'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'

import Inventory from "./pages/Inventory.jsx"
import Sales from "./pages/Sales.jsx"
import Reports from "./pages/Reports.jsx"
import History from "./pages/History.jsx"
import Reportes from './pages/Reportes.jsx'
import ReportesProfesional from './pages/ReportesProfesional.jsx'
import ReportesIntegradosCompletos from './pages/ReportesIntegradosCompletos.jsx'
import Fiados from "./pages/Fiados.jsx"
import ReportesHistory from "./pages/ReportesHistory.jsx";
import ReportesIntegrados from './pages/ReportesIntegrados.jsx'
import Servicios from "./pages/Servicios.jsx";
import Presupuestos from "./pages/Presupuestos.jsx";
import Pagos from "./pages/Pagos.jsx";
import ClientesCredito from "./pages/ClientesCredito.jsx";
import Ofertas from "./pages/Ofertas.jsx";
import Cobranza from "./pages/Cobranza.jsx";
import Settings from './pages/Settings.jsx'




function InnerRouter(){
  const location = useLocation()
  const navigate = useNavigate()
  // Map path -> section key helper
  const pathToSection = (path)=>{
    if (!path) return null
    if (path.startsWith('/inventory')) return 'inventory'
    if (path.startsWith('/sales')) return 'ventas'
    if (path.startsWith('/ofertas')) return 'ofertas'
    if (path.startsWith('/history')) return 'history'
    if (path.startsWith('/fiados')) return 'fiados'
    if (path.startsWith('/presupuestos')) return 'presupuestos'
    if (path.startsWith('/servicios')) return 'servicios'
    // treat legacy /finanzas and /reports as reportes
    if (path.startsWith('/finanzas') || path.startsWith('/reports') || path.startsWith('/reportes')) return 'reportes'
    if (path === '/' || path.startsWith('/')) return 'reportes'
    return null
  }

  const [activeSection, setActiveSection] = useState(()=> pathToSection(location.pathname) || 'reportes')

  // Sync activeSection with current location
  React.useEffect(()=>{
    const sec = pathToSection(location.pathname)
    setActiveSection(sec)
  },[location])

  const handleNavigate = (section) => {
    setActiveSection(section)
    // also push a route for major sections so URL stays meaningful
    if (section === 'ventas') navigate('/sales')
    else if (section === 'reportes') navigate('/')
  }

  return (
    <>
      <Navbar onNavigate={handleNavigate} />
      <div className="app">
        {/* If we have activeSection prefer direct render to avoid routing mismatch causing blank screens */}
        {activeSection === 'reportes' ? (
          <ReportesProfesional />
        ) : activeSection === 'ventas' ? (
          <Sales />
        ) : (
          <Routes>
            <Route path="/" element={<ReportesProfesional />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/ofertas" element={<Ofertas />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/history" element={<History />} />
            <Route path="/fiados" element={<Fiados />} />
            <Route path="/cobranza" element={<Cobranza />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/presupuestos" element={<Presupuestos />} />
            <Route path="/pagos" element={<Pagos />} />
            <Route path="/clientes-credito" element={<ClientesCredito />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/reportes" element={<ReportesProfesional />} />
            <Route path="/reportes/completos" element={<ReportesIntegradosCompletos />} />
            <Route path="/finanzas" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </>
  )
}

export default function Router() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <InnerRouter />
      </ErrorBoundary>
    </BrowserRouter>
  )
}