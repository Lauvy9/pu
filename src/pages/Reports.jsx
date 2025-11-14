import React, { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import SmallMetric from '../components/SmallMetric'

// Formulario para agregar gastos integrado en el panel lateral

export default function Reports(){
  const {sales, products, entries, expenses = [], actions} = useStore()
  const [date, setDate] = useState('')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'operativos', date: new Date().toISOString().split('T')[0] })

  const byDate = useMemo(()=>{
    // Si no hay fecha seleccionada, usar hoy
    const target = date ? new Date(date) : new Date();
    const daySales = (sales || []).filter(s=> new Date(s.date).toDateString() === target.toDateString())
    const dayExpenses = (expenses || []).filter(e=> new Date(e.date).toDateString() === target.toDateString())

    const totalSales = daySales.reduce((s,i)=> s + Number(i.total || 0),0)
    const totalProfit = daySales.reduce((s,i)=> s + Number(i.profit || 0),0)
    const totalExpenses = dayExpenses.reduce((s,e)=> s + Number(e.amount || e.monto || 0),0)
    const netProfit = totalProfit - totalExpenses

    return { total: totalSales, profit: totalProfit, sales: daySales, expenses: totalExpenses, expensesList: dayExpenses, netProfit }
  },[date,sales,expenses])

  const lowProducts = products.filter(p=> p.stock <= (p.minStock ?? 1))

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      alert('Por favor completa la descripción y el monto')
      return
    }
    const expenseData = {
      id: 'exp_' + Date.now(),
      description: newExpense.description.trim(),
      amount: Number(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date ? (newExpense.date + 'T00:00:00.000Z') : new Date().toISOString()
    }
    if (actions && typeof actions.addExpense === 'function'){
      actions.addExpense(expenseData)
    }
    setNewExpense({ description:'', amount:'', category:'operativos', date: new Date().toISOString().split('T')[0] })
    setShowAddExpense(false)
    // no bloquear: metrics se actualizarán via store
  }

  return (
    <div className="grid">
      <div className="grid cols-4">
        <SmallMetric title="Ventas del día" value={(byDate.total || 0).toFixed(2)} hint={date ? `Ventas del ${date}` : 'Ventas de hoy'} />
        <SmallMetric title="Ganancia Bruta" value={(byDate.profit || 0).toFixed(2)} />
        <SmallMetric title="Gastos del día" value={(byDate.expenses || 0).toFixed(2)} hint={byDate.expensesList && byDate.expensesList.length ? `${byDate.expensesList.length} gastos registrados` : ''} />
        <SmallMetric title="Ganancia Neta" value={(byDate.netProfit || 0).toFixed(2)} highlight={true} />
      </div>

      <div className="card">
        <h4>Filtros y Acciones</h4>
        <div style={{ marginTop:8 }}>
          <label>Seleccionar fecha:</label>
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>

        <div style={{ marginTop:10 }}>
          <button className="btn btn-primary" onClick={()=>setShowAddExpense(prev=>!prev)}>{showAddExpense ? 'Cancelar' : 'Agregar Gasto'}</button>
        </div>

        {showAddExpense && (
          <div className="expense-form" style={{ marginTop:10 }}>
            <h5>Nuevo Gasto</h5>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div>
                <label>Descripción</label>
                <input className="input" type="text" value={newExpense.description} onChange={e=> setNewExpense(prev=> ({...prev, description: e.target.value}))} placeholder="Ej: Pago de luz" />
              </div>
              <div>
                <label>Monto</label>
                <input className="input" type="number" min="0" step="0.01" value={newExpense.amount} onChange={e=> setNewExpense(prev=> ({...prev, amount: e.target.value}))} />
              </div>
              <div>
                <label>Categoría</label>
                <select className="input" value={newExpense.category} onChange={e=> setNewExpense(prev=> ({...prev, category: e.target.value}))}>
                  <option value="operativos">Gastos Operativos</option>
                  <option value="alquiler">Alquiler</option>
                  <option value="servicios">Servicios</option>
                  <option value="impuestos">Impuestos</option>
                  <option value="materiales">Materiales</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div>
                <label>Fecha</label>
                <input className="input" type="date" value={newExpense.date} onChange={e=> setNewExpense(prev=> ({...prev, date: e.target.value}))} />
              </div>
              <div>
                <button className="btn btn-success" onClick={handleAddExpense}>Guardar Gasto</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h4>Entradas de productos</h4>
        <table className="table">
          <thead><tr><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Costo</th></tr></thead>
          <tbody>
            {entries.map((e,idx)=> (
              <tr key={idx}><td>{new Date(e.date).toLocaleString()}</td><td>{e.product?.name ?? e.id}</td><td>{e.qty}</td><td>{e.cost}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h4>Últimas transacciones</h4>
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Fecha</th><th>Total</th><th>Tipo</th></tr>
          </thead>
          <tbody>
            {(byDate.sales || []).map(s=> (
              <tr key={s.id}><td>{s.id}</td><td>{new Date(s.date).toLocaleString()}</td><td>${Number(s.total||0).toFixed(2)}</td><td>Venta</td></tr>
            ))}
            {(byDate.expensesList || []).map(e=> (
              <tr key={e.id}><td>{e.id}</td><td>{new Date(e.date).toLocaleString()}</td><td>${Number(e.amount||e.monto||0).toFixed(2)}</td><td>Gasto - {e.category}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h4>Gastos por categoría</h4>
        {byDate.expensesList && byDate.expensesList.length > 0 ? (
          <table className="table">
            <thead><tr><th>Categoría</th><th>Cantidad</th><th>Total</th></tr></thead>
            <tbody>
              {Object.entries(byDate.expensesList.reduce((acc, expense) => { acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount||expense.monto||0); return acc }, {})).map(([category, total])=> (
                <tr key={category}><td>{category}</td><td>{byDate.expensesList.filter(e=> e.category === category).length}</td><td>${Number(total).toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay gastos registrados para esta fecha</p>
        )}
      </div>

      <div className="card">
        <h4>Productos próximos a stock mínimo</h4>
        <ul>
          {products.filter(p=> p.stock <= (p.minStock ?? 1)).map(p=> (
            <li key={p.id}>{p.name} — Stock: {p.stock} (Min: {p.minStock})</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
