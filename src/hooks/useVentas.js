// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import Inventario from './components/Inventario';
import Ventas from './components/Ventas';
import Reportes from './components/Reportes';
import HistorialVentas from './components/HistorialVentas';
import Navbar from './components/Navbar';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/historial" element={<HistorialVentas />} />
          </Routes>
        </div>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;