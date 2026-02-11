// Lógica de LAURA: funciones puras que trabajan sobre arrays de ventas/productos/clientes.
// Estas funciones son independientes de React para facilitar las pruebas y la migración
// a endpoints backend. Reemplaza o extiende para llamar a tu API si necesitas cálculos
// más complejos o usar un modelo remoto.

// sales: array de ventas
// products: array de productos
// clients: array de clientes (fiados)

export function getLowStockProducts(products = [], threshold = 5) {
  return (products || []).filter(p => p && p.stock != null && Number(p.stock) <= threshold)
}

export function recommendForClient(sales = [], products = [], clientId, max = 5) {
  // Heurística simple: frecuencia de co-ocurrencias con lo que compró el cliente
  if (!clientId) return []
  const clientSales = (sales || []).filter(s => String(s.clienteFiado || s.clienteId || '') === String(clientId))
  if (!clientSales.length) {
    // fallback: top vendidos
    const freq = {}
    (sales || []).forEach(s => (s.items || []).forEach(it => { freq[it.id] = (freq[it.id] || 0) + (Number(it.qty || 1)) }))
    return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,max).map(([id]) => (products||[]).find(p => String(p.id) === String(id))).filter(Boolean)
  }

  const boughtIds = new Set(clientSales.flatMap(s => (s.items || []).map(it => String(it.id))))
  const coCounts = {}
  (sales || []).forEach(s => {
    const ids = (s.items || []).map(it => String(it.id))
    ids.forEach(a => ids.forEach(b => { if (a !== b) { const key = `${a}::${b}`; coCounts[key] = (coCounts[key] || 0) + 1 } }))
  })

  const scores = {}
  Object.entries(coCounts).forEach(([k, v]) => {
    const [a,b] = k.split('::')
    if (b && boughtIds.has(a)) scores[b] = (scores[b] || 0) + v
  })

  return Object.entries(scores).sort((a,b)=>b[1]-a[1]).slice(0,max).map(([id]) => (products||[]).find(p=>String(p.id)===String(id))).filter(Boolean)
}

export function suggestCombos(sales = [], products = [], max = 10) {
  const pairCounts = {}
  (sales || []).forEach(s => {
    const ids = (s.items || []).map(it => String(it.id))
    for (let i = 0; i < ids.length; i++) for (let j = i+1; j < ids.length; j++) {
      const a = ids[i], b = ids[j]
      const key = a < b ? `${a}::${b}` : `${b}::${a}`
      pairCounts[key] = (pairCounts[key] || 0) + 1
    }
  })
  return Object.entries(pairCounts).sort((a,b)=>b[1]-a[1]).slice(0,max).map(([k,count]) => {
    const [a,b] = k.split('::')
    return { products: [ (products||[]).find(p=>String(p.id)===a), (products||[]).find(p=>String(p.id)===b) ].filter(Boolean), score: count }
  }).filter(x=>x.products && x.products.length===2)
}

// ProcessQuery: lógica simple de interpretación de texto para LAURA.
// Reemplaza por una llamada a un LLM/endpoint si lo deseas (recomendado: hacerlo en backend).
import { normalizeText, isGreeting, isAddressedToLaura } from '../utils/lauraTextNormalizer'

// HANDLERS ESPECÍFICOS PARA INTENTS DE CLIENTES
// Estos handlers usan los arrays reales (sales, clients/fiados) y devuelven { text, meta }
export function handleClientesList({ sales = [], clients = [], fiados = [] } = {}) {
  const map = {}
  ;(clients || []).forEach(c => {
    const id = String(c.id || c._id || (c.telefono || c.phone) || c.nombre || c.name || '')
    map[id] = {
      id,
      nombre: c.nombre || c.name || id,
      telefono: c.telefono || c.phone || null,
      ventas: [],
      totalGastado: 0,
      tipo: 'al día',
      deuda: 0,
    }
  })

  ;(sales || []).forEach(s => {
    const cid = String(s.clienteFiado || s.clienteId || s.clientId || '')
    if (!cid) return
    if (!map[cid]) {
      map[cid] = { id: cid, nombre: cid, telefono: null, ventas: [], totalGastado: 0, tipo: 'al día', deuda: 0 }
    }
    map[cid].ventas.push(s)
    map[cid].totalGastado += Number(s.total || 0)
  })

  ;(fiados || []).forEach(f => {
    const id = String(f.id || f._id || f.clienteId || f.nombre || f.name || '')
    if (!map[id]) {
      map[id] = { id, nombre: f.nombre || f.name || id, telefono: f.telefono || f.phone || null, ventas: [], totalGastado: 0, tipo: 'fiado', deuda: Number(f.saldo || f.deuda || 0) }
    } else {
      map[id].tipo = (Number(f.saldo || f.deuda || 0) > 0) ? 'fiado' : 'ex fiado'
      map[id].deuda = Number(f.saldo || f.deuda || 0)
    }
  })

  const clientsList = Object.values(map).map(c => {
    const ultimaCompra = c.ventas.length ? new Date(Math.max(...c.ventas.map(v => new Date(v.date).getTime()))).toISOString() : null
    return {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      ultimaCompra,
      totalGastado: Number(c.totalGastado || 0),
      tipo: c.tipo || 'al día',
      clienteConDeuda: Number(c.deuda || 0) > 0
    }
  }).sort((a,b) => (b.totalGastado || 0) - (a.totalGastado || 0))

  const text = clientsList.length
    ? `Clientes (${clientsList.length}):\n` + clientsList.map(cl => `${cl.nombre} — ${cl.telefono || 'sin teléfono'} — última: ${cl.ultimaCompra ? new Date(cl.ultimaCompra).toLocaleString() : 'N/A'} — gastó $${cl.totalGastado.toFixed(2)} — ${cl.tipo}${cl.clienteConDeuda ? ' — cliente con deuda' : ''}`).join('\n')
    : 'No se encontraron clientes registrados.'

  return { text, meta: { type: 'clients_list', payload: clientsList } }
}

export function handleClientesHoy({ sales = [] } = {}) {
  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const todays = (sales || []).filter(s => {
    const d = new Date(s.date)
    return d >= today && d < tomorrow
  })
  if (!todays.length) return { text: 'Hoy no hubo compras registradas.', meta: { type: 'clients_today', payload: [] } }

  const summary = todays.map(s => {
    const hora = new Date(s.date).toLocaleTimeString()
    const productos = (s.items || []).map(it => `${(it.qty||it.quantity||1)}x ${it.name || it.title || it.id}`).join(', ')
    const tipoPago = s.paymentMethod || s.paymentType || s.tipoPago || 'desconocido'
    return { hora, total: s.total || 0, productos, tipoPago, saleId: s.id || s._id || null }
  })

  const text = `Clientes que compraron hoy (${summary.length}):\n` + summary.map(s => `${s.hora} — $${(s.total||0).toFixed(2)} — ${s.productos} — ${s.tipoPago}`).join('\n')
  return { text, meta: { type: 'clients_today', payload: summary } }
}

export function handleClientesNuevos({ sales = [], clients = [] } = {}) {
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const firstPurchase = {}
  ;(sales || []).forEach(s => {
    const cid = String(s.clienteFiado || s.clienteId || s.clientId || (s.clientName || ''))
    if (!cid) return
    const d = new Date(s.date)
    if (!firstPurchase[cid] || d < new Date(firstPurchase[cid].date)) {
      firstPurchase[cid] = { date: d.toISOString(), total: s.total || 0, saleId: s.id || s._id || null }
    }
  })

  const nuevos = Object.entries(firstPurchase).filter(([cid, info]) => new Date(info.date) >= sevenDaysAgo).map(([cid, info]) => {
    const client = (clients || []).find(c => String(c.id) === String(cid) || String(c.nombre || c.name) === String(cid)) || {}
    return {
      id: cid,
      nombre: client.nombre || client.name || cid,
      fechaAlta: client.createdAt || client.fechaAlta || info.date,
      primeraCompra: info.date,
      totalInicial: Number(info.total || 0)
    }
  })

  if (!nuevos.length) return { text: 'No hubo clientes nuevos en los últimos 7 días.', meta: { type: 'clients_new', payload: [] } }
  const text = `Clientes nuevos (últimos 7 días):\n` + nuevos.map(n => `${n.nombre} — Alta: ${new Date(n.fechaAlta).toLocaleDateString()} — Primera compra: ${new Date(n.primeraCompra).toLocaleString()} — $${n.totalInicial.toFixed(2)}`).join('\n')
  return { text, meta: { type: 'clients_new', payload: nuevos } }
}

export function handleClientesFrecuentes({ sales = [], clients = [] } = {}) {
  const counts = {}
  const totals = {}
  ;(sales || []).forEach(s => {
    const cid = String(s.clienteFiado || s.clienteId || s.clientId || (s.clientName || ''))
    if (!cid) return
    counts[cid] = (counts[cid] || 0) + 1
    totals[cid] = (totals[cid] || 0) + Number(s.total || 0)
  })

  const frecuentes = Object.keys(counts).filter(cid => counts[cid] > 3).map(cid => {
    const client = (clients || []).find(c => String(c.id) === String(cid) || String(c.nombre || c.name) === String(cid)) || {}
    const cantidad = counts[cid] || 0
    const ticketPromedio = cantidad ? (totals[cid] || 0) / cantidad : 0
    return { id: cid, nombre: client.nombre || client.name || cid, cantidadCompras: cantidad, ticketPromedio: Number(ticketPromedio.toFixed(2)) }
  }).sort((a,b) => b.cantidadCompras - a.cantidadCompras)

  if (!frecuentes.length) return { text: 'No se encontraron clientes frecuentes (más de 3 compras).', meta: { type: 'clients_frequent', payload: [] } }
  const text = `Clientes frecuentes:\n` + frecuentes.map(f => `${f.nombre} — ${f.cantidadCompras} compras — ticket promedio $${f.ticketPromedio}`).join('\n')
  return { text, meta: { type: 'clients_frequent', payload: frecuentes } }
}

export async function processQuery({ text = '', sales = [], products = [], clients = [] }) {
  const normalized = normalizeText(text || '')
  const hasGreeting = isGreeting(normalized)
  const addressedToLaura = isAddressedToLaura(normalized)

  // Prefijo de saludo cuando corresponda
  let greetingPrefix = ''
  if (addressedToLaura) {
    greetingPrefix = '¡Acá estoy, Lau!\nDecime, ¿qué necesitás?'
  } else if (hasGreeting) {
    greetingPrefix = '¡Hola! Qué alegría verte por acá'
  }
  if (normalized.includes('vend') && normalized.includes('hoy')) {
    // ¿Qué se vendió más hoy?
    const today = new Date();
    today.setHours(0,0,0,0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1)
    const todays = (sales || []).filter(s => new Date(s.date) >= today && new Date(s.date) < tomorrow)
    const freq = {}
    todays.forEach(s => (s.items || []).forEach(it => { freq[it.id] = (freq[it.id] || 0) + (Number(it.qty || 1)) }))
    const top = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,1)
    if (top.length === 0) return { text: greetingPrefix ? `${greetingPrefix}\n\nHoy no se registraron ventas.` : 'Hoy no se registraron ventas.' }
    const id = top[0][0]
    const prod = (products || []).find(p => String(p.id) === String(id))
    const answer = `Lo más vendido hoy: ${prod ? (prod.name||prod.titulo||prod.id) : id} (${top[0][1]} unidades)`
    return { text: greetingPrefix ? `${greetingPrefix}\n\n${answer}` : answer, meta: { type: 'top_today', payload: { product: prod, units: top[0][1] } } }
  }

  if (normalized.includes('historial') && normalized.includes('cliente')) {
    // formato: "historial cliente <id>"
    const parts = text.split(' ')
    const idx = parts.findIndex(p => p.toLowerCase() === 'cliente')
    const clientId = parts[idx+1]
    if (!clientId) return { text: greetingPrefix ? `${greetingPrefix}\n\nIndica el id del cliente. Ej: "historial cliente 123"` : 'Indica el id del cliente. Ej: "historial cliente 123"' }
    const clientSales = (sales || []).filter(s => String(s.clienteFiado || s.clienteId || '') === String(clientId))
    if (!clientSales.length) return { text: greetingPrefix ? `${greetingPrefix}\n\nNo se encontraron ventas para el cliente ${clientId}` : `No se encontraron ventas para el cliente ${clientId}` }
    const summary = clientSales.map(s => `${new Date(s.date).toLocaleString()} — ${ (s.items||[]).map(it=> (it.qty||1) + 'x ' + (it.name||it.title||it.id)).join(', ') }`).join('\n')
    const answer = `Historial del cliente ${clientId}:\n${summary}`
    return { text: greetingPrefix ? `${greetingPrefix}\n\n${answer}` : answer, meta: { type: 'client_history', payload: clientSales } }
  }

  if (normalized.includes('stock') && normalized.includes('qued')) {
    const low = getLowStockProducts(products, 5)
    if (!low.length) return { text: greetingPrefix ? `${greetingPrefix}\n\nNo hay productos por quedarse sin stock en este momento.` : 'No hay productos por quedarse sin stock en este momento.' }
    const answer = `Productos con stock bajo: ${low.map(p=> (p.name||p.titulo||p.id) + ' ('+p.stock+')').join(', ')}`
    return { text: greetingPrefix ? `${greetingPrefix}\n\n${answer}` : answer, meta: { type:'low_stock', payload: low } }
  }

  // fallback
  const fallback = 'Lo siento, no entendí. Puedes preguntar: "¿Qué se vendió más hoy?", "Historial cliente <id>", "¿Qué productos están por quedarse sin stock?"'
  return { text: greetingPrefix ? `${greetingPrefix}\n\n${fallback}` : fallback }
}

/*
  NOTAS:
  - Para usar un LLM o lógica avanzada, crea un endpoint en tu backend que reciba la consulta y el contexto
    (resúmenes de ventas, etc.) y devuelva una respuesta segura. Desde aquí solo llamarías a dicho endpoint.
*/
