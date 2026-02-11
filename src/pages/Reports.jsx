import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/helpers';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function ReportsProfesional() {
  const { sales, products, entries, expenses = [], actions } = useStore();
  const [dateRange, setDateRange] = useState({
    start: '2025-10-15',
    end: '2025-11-14'
  });
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [activeTab, setActiveTab] = useState('resumen');
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'operativos',
    date: new Date().toISOString().split('T')[0],
    businessUnit: 'sin_especificar'
  });


  // Calcular datos para el período seleccionado
  const reportData = useMemo(() => {
    const startDate = new Date(dateRange.start);
    if (!isNaN(startDate)) startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateRange.end);
    if (!isNaN(endDate)) endDate.setHours(23, 59, 59, 999);

    const periodSales = (sales || []).filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const periodExpenses = (expenses || []).filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    // Ventas totales
    const totalSales = periodSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    
    // Costo de mercadería vendida
    const costOfGoodsSold = periodSales.reduce((sum, sale) => sum + Number(sale.cost || 0), 0);
    
    // Gastos operativos
    const operatingExpenses = periodExpenses.reduce((sum, expense) => sum + Number(expense.amount || expense.monto || 0), 0);
    
    // Ganancia neta
    const netProfit = totalSales - costOfGoodsSold - operatingExpenses;
    
    // Margen de ganancia
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    return {
      totalSales,
      costOfGoodsSold,
      operatingExpenses,
      netProfit,
      profitMargin,
      sales: periodSales,
      expenses: periodExpenses
    };
  }, [dateRange, sales, expenses]);

  // Datos para gráficos
  const chartData = useMemo(() => {
    // Gráfico de ventas por día
    const salesByDay = reportData.sales.reduce((acc, sale) => {
      const date = new Date(sale.date).toLocaleDateString('es-ES');
      acc[date] = (acc[date] || 0) + Number(sale.total || 0);
      return acc;
    }, {});

    // Gráfico de gastos por categoría
    const expensesByCategory = reportData.expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount || expense.monto || 0);
      return acc;
    }, {});

    return {
      salesByDay: {
        labels: Object.keys(salesByDay),
        datasets: [
          {
            label: 'Ventas por Día',
            data: Object.values(salesByDay),
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      },
      expensesByCategory: {
        labels: Object.keys(expensesByCategory).map(cat => 
          cat.charAt(0).toUpperCase() + cat.slice(1)
        ),
        datasets: [
          {
            data: Object.values(expensesByCategory),
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
            ],
          },
        ],
      },
      financialSummary: {
        labels: ['Ventas', 'CMV', 'Gastos', 'Ganancia'],
        datasets: [
          {
            label: 'Resumen Financiero',
            data: [
              reportData.totalSales,
              reportData.costOfGoodsSold,
              reportData.operatingExpenses,
              reportData.netProfit
            ],
            backgroundColor: [
              'rgba(75, 192, 192, 0.8)',
              'rgba(255, 99, 132, 0.8)',
              'rgba(255, 159, 64, 0.8)',
              'rgba(75, 192, 75, 0.8)'
            ],
          },
        ],
      }
    };
  }, [reportData]);

  // Opciones de gráficos
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // PDF export removed from professional reports view per request

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      alert('Por favor completa la descripción y el monto');
      return;
    }
    const expenseData = {
      id: 'exp_' + Date.now(),
      description: newExpense.description.trim(),
      amount: Number(newExpense.amount),
      category: newExpense.category,
      businessUnit: newExpense.businessUnit,
      date: newExpense.date ? (newExpense.date + 'T00:00:00.000Z') : new Date().toISOString()
    };
    if (actions && typeof actions.addExpense === 'function') {
      actions.addExpense(expenseData);
    }
    setNewExpense({ description: '', amount: '', category: 'operativos', date: new Date().toISOString().split('T')[0], businessUnit: 'sin_especificar' });
    setShowAddExpense(false);
  };

  return (
    <div className="reportes-profesional">
      <header className="header-corporativo">
        <div className="header-contenido">
          <div className="branding">
            <h1 className="titulo-principal">Reportes Financieros</h1>
            <p className="subtitulo">Análisis y gestión de desempeño financiero</p>
          </div>
          <div className="acciones-superiores" />
        </div>

        <nav className="navegacion-profesional">
          <button 
            className={`nav-item ${activeTab === 'resumen' ? 'active' : ''}`}
            onClick={() => setActiveTab('resumen')}
          >
            Resumen Ejecutivo
          </button>
          <button 
            className={`nav-item ${activeTab === 'graficos' ? 'active' : ''}`}
            onClick={() => setActiveTab('graficos')}
          >
            Gráficos
          </button>
          <button 
            className={`nav-item ${activeTab === 'detalle' ? 'active' : ''}`}
            onClick={() => setActiveTab('detalle')}
          >
            Detalle Completo
          </button>
        </nav>
      </header>

      <div className="layout-corporativo">
        {/* Panel lateral de control */}
        <aside className="panel-control">
          <div className="card">
            <h3 className="seccion-titulo">Filtros del Reporte</h3>
            <div className="controles-fecha">
              <div className="campo-fecha">
                <label className="etiqueta">Fecha inicial</label>
                <input 
                  type="date" 
                  className="input-fecha"
                  value={dateRange.start} 
                  onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} 
                />
              </div>
              <div className="campo-fecha">
                <label className="etiqueta">Fecha final</label>
                <input 
                  type="date" 
                  className="input-fecha"
                  value={dateRange.end} 
                  onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} 
                />
              </div>
            </div>
            
            <div className="filtros-rapidos">
              <button className="filtro-rapido" onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);
                setDateRange({
                  start: start.toISOString().split('T')[0],
                  end: end.toISOString().split('T')[0]
                });
              }}>
                Últimos 30 días
              </button>
              <button className="filtro-rapido" onClick={() => {
                const today = new Date();
                setDateRange({
                  start: today.toISOString().split('T')[0],
                  end: today.toISOString().split('T')[0]
                });
              }}>
                Hoy
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="seccion-titulo">Métricas Rápidas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Ventas Totales</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {formatCurrency(reportData.totalSales)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Ganancia Neta</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: reportData.netProfit >= 0 ? '#058796ff' : '#dc2626'
                }}>
                  {formatCurrency(reportData.netProfit)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Margen</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: reportData.profitMargin > 20 ? '#059694ff' : '#dc2626'
                }}>
                  {reportData.profitMargin.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="seccion-titulo">Acciones Rápidas</h3>
            <div className="botones-accion">
              <button 
                className="btn btn-secundario" 
                onClick={() => setShowAddExpense(!showAddExpense)}
              >
                Registrar Gasto
              </button>
            </div>

            {showAddExpense && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>Nuevo Gasto</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                      Descripción
                    </label>
                    <input 
                      type="text" 
                      className="input-fecha"
                      value={newExpense.description} 
                      onChange={e => setNewExpense(prev => ({...prev, description: e.target.value}))} 
                      placeholder="Concepto del gasto"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                      Monto
                    </label>
                    <input 
                      type="number" 
                      className="input-fecha"
                      value={newExpense.amount} 
                      onChange={e => setNewExpense(prev => ({...prev, amount: e.target.value}))} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                      Categoría
                    </label>
                    <select 
                      className="input-fecha"
                      value={newExpense.category} 
                      onChange={e => setNewExpense(prev => ({...prev, category: e.target.value}))}
                    >
                      <option value="operativos">Operativos</option>
                      <option value="alquiler">Alquiler</option>
                      <option value="servicios">Servicios</option>
                      <option value="impuestos">Impuestos</option>
                      <option value="materiales">Materiales</option>
                      <option value="otros">Otros</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                      Fecha
                    </label>
                    <input 
                      type="date" 
                      className="input-fecha"
                      value={newExpense.date} 
                      onChange={e => setNewExpense(prev => ({...prev, date: e.target.value}))} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                      Unidad de negocio
                    </label>
                    <select className="input-fecha" value={newExpense.businessUnit} onChange={e => setNewExpense(prev => ({...prev, businessUnit: e.target.value}))}>
                      <option value="sin_especificar">Sin especificar</option>
                      <option value="muebleria">Mueblería</option>
                      <option value="vidrieria">Vidriería</option>
                    </select>
                  </div>
                  <button 
                    className="btn"
                    onClick={handleAddExpense}
                    style={{ background: '#0b5fff', color: 'white', border: 'none' }}
                  >
                     Guardar Gasto
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="contenido-principal">
          <div className="panel-dashboard">
            
            {activeTab === 'resumen' && (
              <>
                {/* Métricas principales */}
                <div className="card">
                  <div className="grid-metrics">
                    <div className="metric">
                      <div className="metric-title">Ventas Totales</div>
                      <div className="metric-value">
                          {formatCurrency(reportData.totalSales)}
                        </div>
                    </div>
                    <div className="metric">
                      <div className="metric-title">Costo Mercadería</div>
                      <div className="metric-value">
                        {formatCurrency(reportData.costOfGoodsSold)}
                      </div>
                    </div>
                    <div className="metric">
                      <div className="metric-title">Gastos Operativos</div>
                      <div className="metric-value">
                        {formatCurrency(reportData.operatingExpenses)}
                      </div>
                    </div>
                    <div className="metric">
                      <div className="metric-title">Ganancia Neta</div>
                      <div className="metric-value" style={{ 
                        color: reportData.netProfit >= 0 ? '#8f9605ff' : '#dc2626' 
                      }}>
                        {formatCurrency(reportData.netProfit)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráfico rápido de resumen */}
                <div className="card">
                  <h4 className="panel-title">Resumen Financiero</h4>
                  <div style={{ height: '300px' }}>
                    <Bar data={chartData.financialSummary} options={chartOptions} />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'graficos' && (
              <>
                <div className="card">
                  <h4 className="panel-title">Ventas por Día</h4>
                  <div style={{ height: '300px' }}>
                    <Line data={chartData.salesByDay} options={chartOptions} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="card">
                    <h4 className="panel-title">Distribución de Gastos</h4>
                    <div style={{ height: '250px' }}>
                      <Doughnut data={chartData.expensesByCategory} options={doughnutOptions} />
                    </div>
                  </div>

                  <div className="card">
                    <h4 className="panel-title">Resumen Financiero</h4>
                    <div style={{ height: '250px' }}>
                      <Bar data={chartData.financialSummary} options={chartOptions} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'detalle' && (
              <>
                <div className="card">
                  <h4 className="panel-title">Ventas del Período</h4>
                  <div className="table-scroll">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Productos</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.sales.map(sale => (
                          <tr key={sale.id}>
                            <td>{new Date(sale.date).toLocaleDateString('es-ES')}</td>
                            <td>{sale.items?.map(item => item.name).join(', ') || 'Varios productos'}</td>
                            <td>{formatCurrency(Number(sale.total || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <h4 className="panel-title">Gastos del Período</h4>
                  <div className="table-scroll">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Descripción</th>
                          <th>Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.expenses.map(expense => (
                          <tr key={expense.id}>
                            <td>{new Date(expense.date).toLocaleDateString('es-ES')}</td>
                            <td>{expense.description}</td>
                            <td>{formatCurrency(Number(expense.amount || expense.monto || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}