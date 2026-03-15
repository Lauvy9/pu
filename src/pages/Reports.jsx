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
import { setDocWithId, getById } from '../firebase/firestoreHelpers'
import { auth } from '../firebase/firebase'

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
  const [saveStatus, setSaveStatus] = React.useState(null)
  const [storedReport, setStoredReport] = useState(null)


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
    // Gráfico de ventas por día (usa datos de Firestore cuando están disponibles)
    const salesByDay = (usedReportData.sales || []).reduce((acc, sale) => {
      const date = new Date(sale.date).toLocaleDateString('es-ES');
      acc[date] = (acc[date] || 0) + Number(sale.total || 0);
      return acc;
    }, {});

    // Gráfico de gastos por categoría
    const expensesByCategory = (usedReportData.expenses || []).reduce((acc, expense) => {
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
              usedReportData.totalSales,
              usedReportData.costOfGoodsSold,
              usedReportData.operatingExpenses,
              usedReportData.netProfit
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
  }, [usedReportData]);

  // Sincronizar resumen del reporte a Firestore cuando cambian totales o rango
  React.useEffect(() => {
    if (import.meta.env.VITE_USE_FIRESTORE !== 'true') return;

    (async () => {
      try {
        const cleanDate = (s) => String(s || '').replace(/[^0-9-]/g,'')
        const docId = `report_${cleanDate(dateRange.start)}_${cleanDate(dateRange.end)}`

        const user = auth && auth.currentUser ? auth.currentUser : null
        const payload = {
          dateRange,
          totals: {
            totalSales: reportData.totalSales,
            costOfGoodsSold: reportData.costOfGoodsSold,
            operatingExpenses: reportData.operatingExpenses,
            netProfit: reportData.netProfit,
            profitMargin: reportData.profitMargin
          },
          counts: {
            salesCount: Array.isArray(reportData.sales) ? reportData.sales.length : 0,
            expensesCount: Array.isArray(reportData.expenses) ? reportData.expenses.length : 0
          },
          details: {
            sales: Array.isArray(reportData.sales) ? reportData.sales : [],
            expenses: Array.isArray(reportData.expenses) ? reportData.expenses : []
          },
          createdAt: new Date().toISOString(),
          source: 'client',
          userId: user ? user.uid : null,
          lastUpdatedBy: user ? (user.email || user.displayName || null) : null
        }

        // Estimar tamaño del documento
        const approxSize = JSON.stringify(payload).length
        console.log('[Reports] saving report', docId, 'approxSize:', approxSize)
        const MAX_DOC_BYTES = 900000 // margen bajo 1MB

        if (approxSize > MAX_DOC_BYTES) {
          console.log('[Reports] payload too large, storing summary and subcollections')
          // Guardar solo resumen en el documento principal y mover arrays a subcolecciones
          const summary = { ...payload, details: undefined, bigDetailsStoredAsSubcollections: true }
          await setDocWithId('reportes', docId, summary)

          console.log('[Reports] saved summary doc', docId)

          // Guardar ventas en `reportes/{docId}/sales`
          const salesArr = Array.isArray(payload.details.sales) ? payload.details.sales : []
          let savedSales = 0
          for (const s of salesArr) {
            const sid = String(s.id || `sale_${Date.now().toString()}_${Math.random().toString(36).slice(2,8)}`)
            try { await setDocWithId(`reportes/${docId}/sales`, sid, s); savedSales++ } catch(e){ console.warn('save sale subdoc failed', e) }
          }
          console.log('[Reports] saved sales subdocs:', savedSales)

          // Guardar expenses en `reportes/{docId}/expenses`
          const expArr = Array.isArray(payload.details.expenses) ? payload.details.expenses : []
          let savedEx = 0
          for (const ex of expArr) {
            const eid = String(ex.id || `exp_${Date.now().toString()}_${Math.random().toString(36).slice(2,8)}`)
            try { await setDocWithId(`reportes/${docId}/expenses`, eid, ex); savedEx++ } catch(e){ console.warn('save expense subdoc failed', e) }
          }
          console.log('[Reports] saved expenses subdocs:', savedEx)
        } else {
          // Guardar todo en un solo documento (actualiza si existe)
          await setDocWithId('reportes', docId, payload)
          console.log('[Reports] saved report document', docId)
        }
      } catch (err) {
        console.warn('Error saving report to Firestore', err)
      }
    })()
  }, [reportData.totalSales, reportData.costOfGoodsSold, reportData.operatingExpenses, reportData.netProfit, reportData.profitMargin, dateRange.start, dateRange.end, reportData.sales, reportData.expenses]);

  // Cargar reporte guardado en Firestore (si existe) para el rango seleccionado
  React.useEffect(() => {
    if (import.meta.env.VITE_USE_FIRESTORE !== 'true') return;
    (async () => {
      try {
        const cleanDate = (s) => String(s || '').replace(/[^0-9-]/g,'')
        const docId = `report_${cleanDate(dateRange.start)}_${cleanDate(dateRange.end)}`
        console.log('[Reports] fetching stored report', docId)
        const doc = await getById('reportes', docId)
        if (doc) {
          console.log('[Reports] loaded stored report', docId)
          setStoredReport(doc)
        } else {
          setStoredReport(null)
        }
      } catch (err) {
        console.warn('[Reports] failed to load stored report', err)
      }
    })()
  }, [dateRange.start, dateRange.end]);

  // Usar los datos del reporte guardado si existen, sino los calculados en memoria
  const usedReportData = React.useMemo(() => {
    if (!storedReport) return reportData
    const totals = storedReport.totals || {}
    return {
      totalSales: totals.totalSales || 0,
      costOfGoodsSold: totals.costOfGoodsSold || 0,
      operatingExpenses: totals.operatingExpenses || 0,
      netProfit: totals.netProfit || 0,
      profitMargin: totals.profitMargin || 0,
      sales: (storedReport.details && Array.isArray(storedReport.details.sales)) ? storedReport.details.sales : (reportData.sales || []),
      expenses: (storedReport.details && Array.isArray(storedReport.details.expenses)) ? storedReport.details.expenses : (reportData.expenses || [])
    }
  }, [storedReport, reportData])

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

  // Guardar reporte manual (botón de diagnóstico)
  const saveReportNow = async () => {
    setSaveStatus('saving')
    if (import.meta.env.VITE_USE_FIRESTORE !== 'true') {
      setSaveStatus('firestore-disabled')
      return
    }
    try {
      const cleanDate = (s) => String(s || '').replace(/[^0-9-]/g,'')
      const docId = `report_${cleanDate(dateRange.start)}_${cleanDate(dateRange.end)}`
      const user = auth && auth.currentUser ? auth.currentUser : null
      const payload = {
        dateRange,
        totals: {
          totalSales: reportData.totalSales,
          costOfGoodsSold: reportData.costOfGoodsSold,
          operatingExpenses: reportData.operatingExpenses,
          netProfit: reportData.netProfit,
          profitMargin: reportData.profitMargin
        },
        counts: {
          salesCount: Array.isArray(reportData.sales) ? reportData.sales.length : 0,
          expensesCount: Array.isArray(reportData.expenses) ? reportData.expenses.length : 0
        },
        details: {
          sales: Array.isArray(reportData.sales) ? reportData.sales : [],
          expenses: Array.isArray(reportData.expenses) ? reportData.expenses : []
        },
        createdAt: new Date().toISOString(),
        source: 'client',
        userId: user ? user.uid : null,
        lastUpdatedBy: user ? (user.email || user.displayName || null) : null
      }

      const approxSize = JSON.stringify(payload).length
      const MAX_DOC_BYTES = 900000
      if (approxSize > MAX_DOC_BYTES) {
        const summaryDoc = { ...payload, details: undefined, bigDetailsStoredAsSubcollections: true }
        await setDocWithId('reportes', docId, summaryDoc)
        setStoredReport(summaryDoc)
        setSaveStatus('saved-summary')
      } else {
        await setDocWithId('reportes', docId, payload)
        setStoredReport(payload)
        setSaveStatus('saved')
      }
    } catch (e) {
      console.warn('saveReportNow failed', e)
      setSaveStatus('error')
    }
  }

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
                  {formatCurrency(usedReportData.totalSales)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Ganancia Neta</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: usedReportData.netProfit >= 0 ? '#058796ff' : '#dc2626'
                }}>
                  {formatCurrency(usedReportData.netProfit)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Margen</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: usedReportData.profitMargin > 20 ? '#059694ff' : '#dc2626'
                }}>
                  {usedReportData.profitMargin.toFixed(1)}%
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
                              {formatCurrency(usedReportData.totalSales)}
                            </div>
                    </div>
                    <div className="metric">
                      <div className="metric-title">Costo Mercadería</div>
                      <div className="metric-value">
                        {formatCurrency(usedReportData.costOfGoodsSold)}
                      </div>
                    </div>
                    <div className="metric">
                      <div className="metric-title">Gastos Operativos</div>
                      <div className="metric-value">
                        {formatCurrency(usedReportData.operatingExpenses)}
                      </div>
                    </div>
                    <div className="metric">
                      <div className="metric-title">Ganancia Neta</div>
                      <div className="metric-value" style={{ 
                        color: usedReportData.netProfit >= 0 ? '#8f9605ff' : '#dc2626' 
                      }}>
                        {formatCurrency(usedReportData.netProfit)}
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
                        {usedReportData.sales.map(sale => (
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
                        {usedReportData.expenses.map(expense => (
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