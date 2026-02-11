import React, { useState, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { formatCurrency } from '../utils/helpers'

export default function PresupuestoForm({ inline } = {}){
  const { products = [], bankAccounts = [], presupuestos = [], actions } = useStore()

  const [budgetCustomerName, setBudgetCustomerName] = useState('')
  const [budgetCustomerPhone, setBudgetCustomerPhone] = useState('')
  const [budgetCustomerEmail, setBudgetCustomerEmail] = useState('')
  const [budgetCustomerAddress, setBudgetCustomerAddress] = useState('')
  const [productConcept, setProductConcept] = useState('')
  const [productSuggestions, setProductSuggestions] = useState([])
  const [budgetItems, setBudgetItems] = useState([])
  const [discountPct, setDiscountPct] = useState(0)
  const [validityDays, setValidityDays] = useState(30)
  const [condition, setCondition] = useState('Contado')
  const [budgetObservations, setBudgetObservations] = useState('')
  const [budgetBankId, setBudgetBankId] = useState('')

  useEffect(()=>{
    if (!productConcept || productConcept.trim().length < 1) { setProductSuggestions([]); return }
    const q = productConcept.toLowerCase()
    const matches = (products || []).filter(p => (p.name||'').toLowerCase().includes(q)).slice(0,8)
    setProductSuggestions(matches.map(m => ({ id: m.id, name: m.name })))
  }, [productConcept, products])

  function addBudgetItem(){
    if (!productConcept || productConcept.trim() === '') return alert('Ingresá Producto / Concepto antes de agregar')
    const newItem = {
      id: 'item_' + Date.now() + Math.floor(Math.random()*9999),
      name: productConcept,
      description: productConcept,
      alto: '', ancho: '', profundo: '', material: '', qty: 1, unitPrice: 0, gainPct: 0
    }
    setBudgetItems(prev => [...prev, newItem])
    setProductConcept('')
    setProductSuggestions([])
  }

  function updateBudgetItem(idx, field, value){ setBudgetItems(prev => prev.map((it,i) => i===idx ? { ...it, [field]: value } : it)) }
  function removeBudgetItem(idx){ setBudgetItems(prev => prev.filter((_,i)=> i!==idx)) }

  function computeFinalPrice(unitPrice, gainPct){ const up = Number(unitPrice||0); const gp = Number(gainPct||0); return up + (up * gp / 100) }
  function computeSubtotal(){ return (budgetItems||[]).reduce((s,it)=>{ const finalP = computeFinalPrice(it.unitPrice, it.gainPct); return s + (finalP * Number(it.qty||0)) }, 0) }

  async function handleSavePresupuesto(){
    if (!budgetCustomerName || !budgetCustomerPhone) return alert('Nombre completo y Teléfono son requeridos para crear el presupuesto')
    if ((budgetItems||[]).length === 0) return alert('Agregá al menos un ítem al presupuesto')
    const itemsForSave = (budgetItems||[]).map(it => ({ id: it.id || ('tmp_' + Date.now()), name: it.name || it.description || productConcept || 'Item', qty: Number(it.qty||1), price: Number(it.unitPrice || 0), meta: { measures: { alto: it.alto, ancho: it.ancho, profundo: it.profundo }, material: it.material, gainPct: it.gainPct } }))
    const subtotal = itemsForSave.reduce((s,it) => s + Number(it.price||0) * Number(it.qty||0), 0)
    const totalWithDiscount = subtotal * (1 - (Number(discountPct||0)/100))
    const pres = {
      id: 'pre_' + Date.now(),
      date: new Date().toISOString(),
      type: 'presupuesto',
      customer: { name: budgetCustomerName || 'Cliente', phone: budgetCustomerPhone || '', email: budgetCustomerEmail || '', address: budgetCustomerAddress || '' },
      items: itemsForSave,
      subtotal,
      discountPct: Number(discountPct||0),
      total: Number(totalWithDiscount || 0),
      validityDays: Number(validityDays||0),
      condition,
      bankAccountId: condition === 'Transferencia' ? budgetBankId : null,
      observations: budgetObservations
    }
    try{
      // Use the store action for presupuestos so it doesn't create transactions or affect stock
      const res = await actions.addPresupuesto(pres)
      alert('Presupuesto creado ' + (res && res.id ? res.id : ''))
      // clear
      setProductConcept(''); setBudgetItems([]); setDiscountPct(0); setBudgetObservations(''); setBudgetCustomerName(''); setBudgetCustomerPhone(''); setBudgetCustomerEmail(''); setBudgetCustomerAddress('');
    }catch(e){ console.error(e); alert('Error guardando presupuesto') }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h5>Datos del cliente para el presupuesto</h5>
          <input className="input" placeholder="Nombre completo (requerido)" value={budgetCustomerName} onChange={e => setBudgetCustomerName(e.target.value)} />
          <input className="input" placeholder="Teléfono (requerido)" value={budgetCustomerPhone} onChange={e => setBudgetCustomerPhone(e.target.value)} />
          <input className="input" placeholder="Email (opcional)" value={budgetCustomerEmail} onChange={e => setBudgetCustomerEmail(e.target.value)} />
          <input className="input" placeholder="Dirección (opcional)" value={budgetCustomerAddress} onChange={e => setBudgetCustomerAddress(e.target.value)} />
        </div>
        <div style={{ width: 260 }}>
          <label>Producto / Concepto</label>
          <input className="input" placeholder="Producto o concepto" value={productConcept} onChange={e => setProductConcept(e.target.value)} />
          {productSuggestions && productSuggestions.length > 0 && (
            <div style={{ border: '1px solid #eee', marginTop: 6, borderRadius: 6, maxHeight: 160, overflow: 'auto' }}>
              {productSuggestions.map(s => (<div key={s.id} style={{ padding: 8, cursor: 'pointer' }} onClick={() => setProductConcept(s.name)}>{s.name}</div>))}
            </div>
          )}
         
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
       
        <div style={{ width: 180 }}>
          <label>Descuento %</label>
          <input className="input" type="number" min={0} max={100} value={discountPct} onChange={e => setDiscountPct(Number(e.target.value || 0))} />
        </div>
      </div>

      {condition === 'Transferencia' && (
        <div style={{ marginTop: 8 }}>
          <label>Cuenta para transferencia</label>
          <select className="input" value={budgetBankId} onChange={e => setBudgetBankId(e.target.value)}>
            <option value="">Seleccionar cuenta</option>
            {(bankAccounts || []).map(b => (<option key={b.id} value={b.id}>{`${b.bankName} - ${b.type} ${b.number}`}</option>))}
          </select>
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <label>Observaciones</label>
        <textarea className="input" value={budgetObservations} onChange={e => setBudgetObservations(e.target.value)} style={{ minHeight: 80 }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <button className="btn" onClick={handleSavePresupuesto}>Presupuesto</button>
        <button className="btn ghost" onClick={() => { setProductConcept(''); setBudgetItems([]); setDiscountPct(0); setBudgetObservations(''); setBudgetCustomerName(''); setBudgetCustomerPhone(''); setBudgetCustomerEmail(''); setBudgetCustomerAddress('') }}>Cancelar</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <button className="btn" onClick={addBudgetItem}>Agregar</button>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div className="small">Subtotal: {formatCurrency(computeSubtotal())}</div>
            <div className="small">Total (con descuento): {formatCurrency(computeSubtotal() * (1 - (Number(discountPct || 0) / 100)))}</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="sales-table" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>Nombre / Descrip.</th>
                <th>Alto (mm)</th>
                <th>Ancho (mm)</th>
                <th>Profundo (mm)</th>
                <th>Material</th>
                <th>Cant.</th>
                <th>Precio unit.</th>
                <th>Ganancia %</th>
                <th>Precio final</th>
                <th>Importe</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {(budgetItems || []).map((it, idx) => {
                const finalPrice = computeFinalPrice(it.unitPrice, it.gainPct)
                const importe = finalPrice * Number(it.qty || 0)
                return (
                  <tr key={it.id}>
                    <td><input className="input" value={it.name || it.description || ''} onChange={e => updateBudgetItem(idx, 'name', e.target.value)} /></td>
                    <td><input className="input" value={it.alto || ''} onChange={e => updateBudgetItem(idx, 'alto', e.target.value)} /></td>
                    <td><input className="input" value={it.ancho || ''} onChange={e => updateBudgetItem(idx, 'ancho', e.target.value)} /></td>
                    <td><input className="input" value={it.profundo || ''} onChange={e => updateBudgetItem(idx, 'profundo', e.target.value)} /></td>
                    <td><input className="input" value={it.material || ''} onChange={e => updateBudgetItem(idx, 'material', e.target.value)} /></td>
                    <td><input className="input" type="number" min={0} value={it.qty || 0} onChange={e => updateBudgetItem(idx, 'qty', Number(e.target.value || 0))} style={{ width: 90 }} /></td>
                    <td><input className="input" type="number" min={0} value={it.unitPrice || 0} onChange={e => updateBudgetItem(idx, 'unitPrice', Number(e.target.value || 0))} style={{ width: 120 }} /></td>
                    <td><input className="input" type="number" min={0} value={it.gainPct || 0} onChange={e => updateBudgetItem(idx, 'gainPct', Number(e.target.value || 0))} style={{ width: 90 }} /></td>
                    <td>{formatCurrency(finalPrice)}</td>
                    <td>{formatCurrency(importe)}</td>
                    <td><button className="btn" onClick={() => removeBudgetItem(idx)}>Eliminar</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
