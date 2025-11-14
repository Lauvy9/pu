import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { formatCurrency } from '../utils/helpers'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Materiales predefinidos con precios orientativos
const MATERIALS = [
  { id: 'vidrio_temperado', name: 'Vidrio templado', pricePerSqm: 120 },
  { id: 'vidrio_float', name: 'Vidrio float', pricePerSqm: 80 },
  { id: 'madera_mdf', name: 'Madera MDF', pricePerSqm: 150 },
  { id: 'madera_madera', name: 'Madera maciza', pricePerSqm: 300 },
  { id: 'metal', name: 'Metal', pricePerSqm: 250 },
  { id: 'mueble_unidad', name: 'Mueble (precio unitario)', pricePerUnit: 500 }
]

export default function Presupuestos(){
  const { presupuestos = [], actions } = useStore()

  // Integración de la Calculadora de Cotización dentro de Presupuestos
  const [precioMetro, setPrecioMetro] = useState(() => { try { return parseFloat(localStorage.getItem('precioMetro')) || 5000 } catch(e){ return 5000 } })
  const [metrosCalc, setMetrosCalc] = useState('')
  const [resultadoCalc, setResultadoCalc] = useState(null)

  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [clienteEmail, setClienteEmail] = useState('')
  const [clienteDireccion, setClienteDireccion] = useState('')
  const [items, setItems] = useState([{ id: Date.now(), desc: '', qty: 1, price: 0, height: '', width: '', depth: '', material: 'mueble_unidad' }])
  const [condicion, setCondicion] = useState('contado')
  const [ivaPercent, setIvaPercent] = useState(21)
  const [validityDays, setValidityDays] = useState(30)
  const [observaciones, setObservaciones] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [statusMode, setStatusMode] = useState('draft') // draft | final
  const [busy, setBusy] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  function addItem(){
    setItems(prev => [...prev, { id: Date.now(), desc: '', qty: 1, price: 0, height: '', width: '', depth: '', material: 'mueble_unidad' }])
  }

  function updateItem(id, patch){
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  function removeItem(id){
    setItems(prev => prev.filter(i => i.id !== id))
  }

  // calcular precio por item si se especifican medidas y material
  function computeItemUnitPrice(it){
    try{
      const mat = MATERIALS.find(m => m.id === it.material) || {}
      const qty = Number(it.qty || 1)
      // si material tiene pricePerSqm y hay medidas, calcular por area
      if (mat.pricePerSqm && it.height && it.width) {
        const h = Number(it.height) // mm
        const w = Number(it.width) // mm
        const areaM2 = (h/1000) * (w/1000)
        const base = areaM2 * mat.pricePerSqm
        return Number(base.toFixed(2))
      }
      // si material tiene pricePerUnit
      if (mat.pricePerUnit) return Number(mat.pricePerUnit)
      // fallback al campo price manual
      return Number(it.price || 0)
    }catch(e){ return Number(it.price || 0) }
  }

  const subtotal = items.reduce((s,it) => {
    const unitPrice = computeItemUnitPrice(it)
    const line = (Number(it.qty || 0) * unitPrice)
    return s + line
  }, 0)
  const iva = +(subtotal * (Number(ivaPercent)/100)).toFixed(2)
  const total = +(subtotal + iva).toFixed(2)

  function guardarPresupuesto(){
    if(!clienteNombre) return alert('Nombre del cliente obligatorio')
    const fecha = new Date().toISOString()
    const due = new Date(); due.setDate(due.getDate() + Number(validityDays || 30))
    const pres = {
      id: 'pre_' + Date.now(),
      date: fecha,
      clienteData: { nombre: clienteNombre, telefono: clienteTelefono, email: clienteEmail, direccion: clienteDireccion },
      items: items.map(i => ({ id: i.id, desc: i.desc, qty: Number(i.qty), height: i.height, width: i.width, depth: i.depth, material: i.material, price: computeItemUnitPrice(i) })),
      totals: { subtotal, discountPercent: Number(discountPercent||0), ivaPercent: Number(ivaPercent), iva, total },
      condicion: condicion,
      status: statusMode === 'draft' ? 'draft' : 'pending',
      validityDays: Number(validityDays||30),
      dueDate: due.toISOString().slice(0,10),
      observaciones: observaciones
    }
    const saved = actions.addPresupuesto(pres)
    alert('Presupuesto guardado: ' + saved.id)
  }

  // Funciones de la calculadora integrada
  function calcularCotizacion(){
    if (!metrosCalc) return alert('Ingresá los metros')
    const res = Number(metrosCalc) * Number(precioMetro || 0)
    setResultadoCalc(res)
  }

  function guardarPrecioMetro(){
    try{ localStorage.setItem('precioMetro', String(precioMetro)); alert('✅ Precio por metro actualizado') }catch(e){ console.error(e) }
  }

  function agregarResultadoComoItem(){
    if (resultadoCalc === null) return alert('Generá un resultado primero')
    const newItem = { id: Date.now(), desc: `Cálculo ${metrosCalc} m`, qty: 1, price: Number(resultadoCalc), height: '', width: '', depth: '', material: 'mueble_unidad' }
    setItems(prev => [...prev, newItem])
    setResultadoCalc(null); setMetrosCalc('')
  }

  function imprimirPresupuesto(pres){
    // generar PDF usando html2canvas + jsPDF
    const div = document.createElement('div')
    div.style.padding = '20px'
    div.style.width = '800px'
    div.innerHTML = `
      <div style="font-family: Arial, sans-serif;">
        <div style="display:flex;align-items:center;">
          <div style="width:80px;height:80px;background:#eee;margin-right:12px">LOGO</div>
          <div>
            <h2 style="margin:0">Vidriería y Carpintería [Nombre]</h2>
            <div>Domicilio: Calle Falsa 123</div>
            <div>Tel: 011-1234-5678 | Email: info@empresa.com</div>
          </div>
        </div>
        <h3>PRESUPUESTO</h3>
        <div>
          <strong>Cliente:</strong> ${pres.clienteData.nombre}<br />
          <strong>Teléfono:</strong> ${pres.clienteData.telefono || '-'}<br />
          <strong>Email:</strong> ${pres.clienteData.email || '-'}<br />
          <strong>Dirección:</strong> ${pres.clienteData.direccion || '-'}
          <div><strong>Validez:</strong> ${pres.dueDate || '-'}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">
          <thead><tr><th style="border:1px solid #ccc;padding:6px">Cant</th><th style="border:1px solid #ccc;padding:6px">Descripción</th><th style="border:1px solid #ccc;padding:6px">Precio unitario</th><th style="border:1px solid #ccc;padding:6px">Importe</th></tr></thead>
          <tbody>
            ${pres.items.map(it => `<tr><td style="border:1px solid #ccc;padding:6px">${it.qty}</td><td style="border:1px solid #ccc;padding:6px">${it.desc}${it.height?`<div style="font-size:12px;color:#666">${it.height}mm x ${it.width}mm ${it.depth?`x ${it.depth}mm`:''} — ${it.material||''}</div>`:''}</td><td style="border:1px solid #ccc;padding:6px;text-align:right">${formatCurrency(it.price)}</td><td style="border:1px solid #ccc;padding:6px;text-align:right">${formatCurrency(it.qty*it.price)}</td></tr>`).join('')}
          </tbody>
        </table>
        <div style="margin-top:12px;width:300px;margin-left:auto">
          <div>Subtotal: <span style="float:right">${formatCurrency(pres.totals.subtotal)}</span></div>
          <div>IVA (${pres.totals.ivaPercent}%): <span style="float:right">${formatCurrency(pres.totals.iva)}</span></div>
          <h3>TOTAL: ${formatCurrency(pres.totals.total)}</h3>
        </div>
        <div style="margin-top:18px">Condiciones: ${pres.condicion}</div>
      </div>
    `
    document.body.appendChild(div)
    setStatusMsg('Generando PDF...')
    setBusy(true)
    html2canvas(div, { scale: 2 }).then(canvas=>{
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p','mm','a4')
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`presupuesto-${pres.id}.pdf`)
      document.body.removeChild(div)
      setBusy(false)
      setStatusMsg('')
    }).catch(err=>{ alert('Error generando PDF: '+err); document.body.removeChild(div) })
  }

  // Generar blob PDF en memoria (devuelve Promise<Blob>)
  function generatePdfBlob(pres){
    return new Promise((resolve, reject) => {
      const div = document.createElement('div')
      div.style.padding = '20px'
      div.style.width = '800px'
      div.innerHTML = `...` // placeholder
      // Reuse same HTML as imprimirPresupuesto but without saving
      div.innerHTML = `
      <div style="font-family: Arial, sans-serif;">
        <div style="display:flex;align-items:center;">
          <div style="width:80px;height:80px;background:#eee;margin-right:12px">LOGO</div>
          <div>
            <h2 style="margin:0">Vidriería y Carpintería [Nombre]</h2>
            <div>Domicilio: Calle Falsa 123</div>
            <div>Tel: 011-1234-5678 | Email: info@empresa.com</div>
          </div>
        </div>
        <h3>PRESUPUESTO</h3>
        <div>
          <strong>Cliente:</strong> ${pres.clienteData.nombre}<br />
          <strong>Teléfono:</strong> ${pres.clienteData.telefono || '-'}<br />
          <strong>Email:</strong> ${pres.clienteData.email || '-'}<br />
          <strong>Dirección:</strong> ${pres.clienteData.direccion || '-'}
        </div>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">
          <thead><tr><th style="border:1px solid #ccc;padding:6px">Cant</th><th style="border:1px solid #ccc;padding:6px">Descripción</th><th style="border:1px solid #ccc;padding:6px">Precio unitario</th><th style="border:1px solid #ccc;padding:6px">Importe</th></tr></thead>
          <tbody>
            ${pres.items.map(it => `<tr><td style="border:1px solid #ccc;padding:6px">${it.qty}</td><td style="border:1px solid #ccc;padding:6px">${it.desc}</td><td style="border:1px solid #ccc;padding:6px;text-align:right">${formatCurrency(it.price)}</td><td style="border:1px solid #ccc;padding:6px;text-align:right">${formatCurrency(it.qty*it.price)}</td></tr>`).join('')}
          </tbody>
        </table>
        <div style="margin-top:12px;width:300px;margin-left:auto">
          <div>Subtotal: <span style="float:right">${formatCurrency(pres.totals.subtotal)}</span></div>
          <div>IVA (${pres.totals.ivaPercent}%): <span style="float:right">${formatCurrency(pres.totals.iva)}</span></div>
          <h3>TOTAL: ${formatCurrency(pres.totals.total)}</h3>
        </div>
        <div style="margin-top:18px">Condiciones: ${pres.condicion}</div>
      </div>
    `
      document.body.appendChild(div)
      html2canvas(div, { scale: 2 }).then(canvas=>{
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p','mm','a4')
        const imgProps = pdf.getImageProperties(imgData)
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.output('blob').then(blob=>{
          document.body.removeChild(div)
          resolve(blob)
        }).catch(e=>{
          document.body.removeChild(div)
          reject(e)
        })
      }).catch(err=>{ document.body.removeChild(div); reject(err) })
    })
  }

  async function uploadBlobAndGetUrl(blob, filename){
    setStatusMsg('Subiendo documento...')
    const fd = new FormData()
    fd.append('file', blob, filename)
    // requiere API_KEY en env frontend; se lee de process.env.VITE_API_KEY si lo configuras en Vite
    const apiKey = import.meta.env.VITE_API_KEY || ''
    const res = await fetch((import.meta.env.VITE_SERVER_URL || '') + '/api/upload', { method: 'POST', body: fd, headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {} })
    if(!res.ok) throw new Error('Upload failed')
    const json = await res.json()
    setStatusMsg('')
    return json
  }

  async function sendViaWhatsApp(pres){
    try{
      setBusy(true)
      setStatusMsg('Generando y subiendo presupuesto...')
      const blob = await generatePdfBlob(pres)
      const { url } = await uploadBlobAndGetUrl(blob, `presupuesto-${pres.id}.pdf`)
      const msg = `Te envío el presupuesto: ${url}`
      const wa = `https://wa.me/?text=${encodeURIComponent(msg)}`
      window.open(wa, '_blank')
      setBusy(false)
      setStatusMsg('')
    }catch(err){ setBusy(false); setStatusMsg(''); alert('Error enviando por WhatsApp: '+err) }
  }

  async function sendViaEmail(pres){
    try{
      const to = prompt('Email destinatario')
      if(!to) return
      setBusy(true)
      setStatusMsg('Generando y subiendo presupuesto...')
      const blob = await generatePdfBlob(pres)
      const { url } = await uploadBlobAndGetUrl(blob, `presupuesto-${pres.id}.pdf`)
      const apiKey = import.meta.env.VITE_API_KEY || ''
      const serverUrl = (import.meta.env.VITE_SERVER_URL || '') + '/api/send-email'
      const resp = await fetch(serverUrl, { method: 'POST', headers: Object.assign({ 'Content-Type':'application/json' }, apiKey ? { Authorization: `Bearer ${apiKey}` } : {}), body: JSON.stringify({ to, subject: `Presupuesto ${pres.id}`, text: 'Adjunto presupuesto', fileUrl: url }) })
      const data = await resp.json()
      setBusy(false)
      setStatusMsg('')
      if(resp.ok) alert('Email enviado')
      else alert('Error enviando email: '+JSON.stringify(data))
    }catch(err){ setBusy(false); setStatusMsg(''); alert('Error enviando email: '+err) }
  }
  // alternativa: generar PDF desde la vista ya existente usando ref (no implementado)

  // marcar recordatorios: al cargar la vista, notificar presupuestos por vencer en <=3 dias
  useEffect(()=>{
    try{
      const now = new Date()
      const soon = presupuestos.filter(p => {
        if (!p.dueDate) return false
        const dd = new Date(p.dueDate)
        dd.setHours(23,59,59,999)
        const diffDays = Math.ceil((dd - now)/(1000*60*60*24))
        return diffDays <= 3 && diffDays >= 0 && (p.status === 'pending' || p.status === 'draft')
      })
      if (soon.length) {
        // mostrar alerta visual (no forzamos notificaciones del navegador)
        alert(`Tienes ${soon.length} presupuesto(s) por vencer en los próximos 3 días.`)
      }
    }catch(e){ }
  }, [])

  return (
    <div className="grid">
      <div className="card">
        <h3>Nuevo Presupuesto</h3>
        <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:8 }}>
          <input className="input" placeholder="Nombre completo" value={clienteNombre} onChange={e=>setClienteNombre(e.target.value)} />
          <input className="input" placeholder="Teléfono" value={clienteTelefono} onChange={e=>setClienteTelefono(e.target.value)} />
          <input className="input" placeholder="Email" value={clienteEmail} onChange={e=>setClienteEmail(e.target.value)} />
          <input className="input" placeholder="Dirección" value={clienteDireccion} onChange={e=>setClienteDireccion(e.target.value)} />
        </div>

        {/* Calculadora integrada */}
        <div style={{ marginTop:12, padding:8, border:'1px dashed #e6e6e6', borderRadius:8 }}>
          <h4 style={{ margin:0 }}>🧮 Calculadora de Cotización</h4>
          <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center' }}>
            <div style={{ display:'flex', flexDirection:'column' }}>
              <label>Precio por metro ($)</label>
              <input className="input" type="number" value={precioMetro} onChange={e=>setPrecioMetro(Number(e.target.value))} style={{ width:160 }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column' }}>
              <label>Metros</label>
              <input className="input" type="number" value={metrosCalc} onChange={e=>setMetrosCalc(e.target.value)} style={{ width:140 }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <button className="btn" onClick={calcularCotizacion} style={{ alignSelf:'flex-end' }}>Calcular</button>
              <button className="btn ghost" onClick={guardarPrecioMetro} style={{ alignSelf:'flex-end' }}>Guardar precio</button>
            </div>
            <div style={{ marginLeft:'auto', textAlign:'right' }}>
              <div className="small-muted">Resultado</div>
              <div style={{ fontWeight:700, marginTop:6 }}>{resultadoCalc !== null ? formatCurrency(resultadoCalc) : '-'}</div>
              <div style={{ marginTop:6 }}>
                <button className="btn" onClick={agregarResultadoComoItem} disabled={resultadoCalc === null}>Agregar al presupuesto</button>
              </div>
            </div>
          </div>
        </div>

        <h4 style={{marginTop:12}}>Items</h4>
        <table className="table">
          <thead><tr><th>Descripción</th><th>Medidas (mm)</th><th>Material</th><th>Cant</th><th>Precio unit.</th><th>Importe</th><th>Acc.</th></tr></thead>
          <tbody>
            {items.map(it=> (
              <tr key={it.id}>
                <td><input className="input" value={it.desc} onChange={e=>updateItem(it.id,{desc:e.target.value})} /></td>
                <td style={{ display:'flex', gap:6 }}>
                  <input className="input" placeholder="alto mm" value={it.height} onChange={e=>updateItem(it.id,{height: e.target.value})} style={{ width:90 }} />
                  <input className="input" placeholder="ancho mm" value={it.width} onChange={e=>updateItem(it.id,{width: e.target.value})} style={{ width:90 }} />
                  <input className="input" placeholder="prof mm" value={it.depth} onChange={e=>updateItem(it.id,{depth: e.target.value})} style={{ width:90 }} />
                </td>
                <td>
                  <select className="input" value={it.material} onChange={e=>updateItem(it.id,{material:e.target.value})}>
                    {MATERIALS.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </td>
                <td><input className="input" type="number" value={it.qty} onChange={e=>updateItem(it.id,{qty: Number(e.target.value)})} style={{ width:80 }} /></td>
                <td>
                  <input className="input" type="number" value={computeItemUnitPrice(it)} readOnly />
                </td>
                <td>{formatCurrency(Number(it.qty||1) * computeItemUnitPrice(it))}</td>
                <td><button className="btn ghost" onClick={()=>removeItem(it.id)}>Eliminar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{marginTop:8}}>
          <button className="btn" onClick={addItem}>Agregar ítem</button>
        </div>

        <div style={{marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
          <div>
            <label>IVA %</label>
            <input className="input" type="number" value={ivaPercent} onChange={e=>setIvaPercent(Number(e.target.value))} />
          </div>
          <div>
            <label>Descuento %</label>
            <input className="input" type="number" value={discountPercent} onChange={e=>setDiscountPercent(Number(e.target.value))} />
          </div>
          <div>
            <label>Validez (días)</label>
            <input className="input" type="number" min={1} value={validityDays} onChange={e=>setValidityDays(Number(e.target.value||30))} />
          </div>
        </div>

        <div style={{marginTop:12}}>
          <label>Condición</label>
          <select className="input" value={condicion} onChange={e=>setCondicion(e.target.value)}>
            <option value="contado">Contado</option>
            <option value="fiado">Cuenta Corriente (Fiado)</option>
            <option value="transferencia">Transferencia</option>
            <option value="otros">Otros</option>
          </select>
        </div>

        <div style={{marginTop:12}}>
          <label>Observaciones</label>
          <textarea className="input" value={observaciones} onChange={e=>setObservaciones(e.target.value)} />
        </div>

        <div style={{marginTop:12}}>
          <div><strong>Subtotal:</strong> {formatCurrency(subtotal)}</div>
          <div><strong>IVA:</strong> {formatCurrency(iva)}</div>
          <div><strong>Total:</strong> {formatCurrency(total)}</div>
          <div style={{marginTop:8, display:'flex', gap:8}}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="radio" checked={statusMode==='draft'} onChange={()=>setStatusMode('draft')} /> Guardar como borrador</label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="radio" checked={statusMode==='final'} onChange={()=>setStatusMode('final')} /> Guardar como definitivo</label>
          </div>
          <div style={{marginTop:8}}>
            <button className="btn" onClick={guardarPresupuesto}>Guardar Presupuesto</button>
          </div>
        </div>
      </div>

      <div className="card" style={{gridColumn:'1 / -1'}}>
        <h3>Presupuestos</h3>
        {presupuestos.length===0 && <p>No hay presupuestos</p>}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {presupuestos.map(p => (
            <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center', borderBottom: '1px solid #eee', padding:8}}>
              <div>
                <strong>{p.clienteData?.nombre}</strong> — {p.date.slice(0,10)} — {p.status} {p.dueDate ? `(vence: ${p.dueDate})` : ''}
                <div className="small">Total: {formatCurrency(p.totals?.total || 0)} — IVA: {p.totals?.ivaPercent}%</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn" onClick={()=>imprimirPresupuesto(p)}>Descargar/Imprimir</button>
                <button className="btn" onClick={()=>sendViaWhatsApp(p)}>WhatsApp</button>
                <button className="btn" onClick={()=>sendViaEmail(p)}>Email</button>
                <button className="btn" onClick={()=>{
                  const sale = actions.convertPresupuestoToSale(p.id)
                  if(sale) alert('Presupuesto convertido a venta: '+sale.id)
                }}>Convertir a venta</button>
                <button className="btn" onClick={()=>{
                  const inv = actions.convertPresupuestoToInvoice(p.id)
                  if(inv) alert('Convertido a factura: '+inv.id)
                }}>Convertir a factura</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
