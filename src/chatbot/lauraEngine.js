import intents from './lauraIntents'
import memory from './lauraMemory'

/**
 * Procesa la consulta contra el storeContext (debe recibir arrays: sales, products, fiados)
 * Retorna { text, intent, meta }
 */
export function processQuery({ text = '', storeContext = {}, sessionId = null } = {}) {
  const { sales = [], products = [], fiados = [] } = storeContext || {}

  // ensure session
  const sid = sessionId || memory.createSession()
  const mem = memory.getMemory(sid) || {}

  const detected = intents.detectIntent(text)
  const intent = detected.intent || 'UNKNOWN'

  // update memory: store last intent
  memory.remember(sid, 'lastIntent', intent)

  // small set of handlers
  const handlers = {
    GREETING: () => {
      const name = memory.recall(sid, 'userName')
      const reply = name ? `¡Hola ${name}! ¿En qué te ayudo hoy?` : '¡Hola! Soy Laura. ¿Cómo puedo ayudarte hoy?'
      return { text: reply, intent: 'GREETING' }
    },

    CHECK_STOCK: () => {
      const analysis = { critical: [], low: [], normal: [] }
      ;(products || []).forEach(p => {
        const s = Number(p.stock || 0)
        if (s === 0) analysis.critical.push(p)
        else if (s <= 5) analysis.low.push(p)
        else analysis.normal.push(p)
      })

      let textResp = 'Stock actual:\n\n'
      ;(products || []).forEach(p => {
        textResp += `• ${p.name || p.titulo || p.id} → ${p.stock || 0} → $${p.price || p.precio || 'N/E'} → ${p.stock === 0 ? 'crítico' : p.stock <= 5 ? 'bajo' : 'normal'}\n`
      })

      if (analysis.critical.length || analysis.low.length) {
        textResp += '\nProductos con stock bajo:\n'
        analysis.critical.concat(analysis.low).forEach(p => { textResp += `• ${p.name} – ${p.stock} unidades\n` })
      } else {
        textResp += '\n Todo el stock está en niveles normales '
      }

      return { text: textResp, intent: 'CHECK_STOCK', meta: { analysis } }
    },

    CHECK_SALES_TODAY: () => {
      const today = new Date().toISOString().slice(0,10)
      const todays = (sales || []).filter(s => (s.date||'').slice(0,10) === today)
      if (!todays.length) return { text: '  Hoy no se registraron ventas.', intent: 'CHECK_SALES_TODAY', meta: { count:0 } }
      const total = todays.reduce((sum,s)=>sum+Number(s.total||0),0)
      const items = todays.map(s => ({ time: s.date, total: s.total, items: s.items, payment: s.paymentMethod || s.tipoPago }))
      let textResp = ` Ventas de hoy (${todays.length}) — Total: $${total}\n\n`
      items.forEach(it => { textResp += `• ${new Date(it.time).toLocaleTimeString()} — $${it.total} — ${(it.items||[]).map(i=> (i.qty||i.quantity||1)+'x '+(i.name||i.title||i.id)).join(', ')} — ${it.payment}\n` })
      return { text: textResp, intent: 'CHECK_SALES_TODAY', meta: { total, items } }
    },

    PRODUCT_INTEREST: () => {
      const q = (detected.query || text || '').toLowerCase()
      // search product by name substring
      const match = (products||[]).find(p => (p.name||p.titulo||'').toString().toLowerCase().includes(q))
      if (match) {
        memory.remember(sid, 'lastProduct', match.id || match.name)
        const textResp = ` ${match.name}\nPrecio: $${match.price || match.precio || 'N/E'}\nStock: ${match.stock || 0} (${match.stock === 0 ? 'SIN STOCK' : match.stock <=5 ? 'BAJO' : 'OK'})`
        return { text: textResp, intent: 'PRODUCT_INTEREST', meta: { product: match } }
      }
      // fallback: show top few
      const preview = (products||[]).slice(0,5).map(p=>`${p.name} — stock: ${p.stock}`).join('\n')
      return { text: `No encontré un producto exacto. Algunos productos: \n${preview}`, intent: 'PRODUCT_INTEREST', meta: { candidates: products.slice(0,5) } }
    },

    CHECK_CLIENTS: () => {
      const list = (fiados||[]).map(c => ({ nombre: c.nombre || c.name, telefono: c.telefono, deuda: c.deuda || 0 }))
      let textResp = `Clientes registrados (${list.length}):\n\n`
      list.forEach(c => { textResp += `• ${c.nombre} — ${c.telefono || 'sin teléfono'}${Number(c.deuda||0)>0 ? ' — cliente con deuda' : ''}\n` })
      return { text: textResp, intent: 'CHECK_CLIENTS', meta: { clients: list } }
    },

    CHECK_DEBTS: () => {
      const owes = (fiados||[]).filter(c => Number(c.deuda||c.monto||0) > 0)
      if (!owes.length) return { text: ' No hay deudas pendientes.', intent: 'CHECK_DEBTS', meta: { count:0 } }
      let textResp = ` Clientes con deuda (${owes.length}):\n\n`
      owes.forEach(c => textResp += `• ${c.nombre} — $${c.deuda || c.monto || 0} — ${c.telefono||'sin teléfono'}\n`)
      return { text: textResp, intent: 'CHECK_DEBTS', meta: { owes } }
    },

    TOP_SOLD: () => {
      const counts = {}
      ;(sales||[]).forEach(s => (s.items||[]).forEach(it => { counts[it.id] = (counts[it.id]||0) + (it.qty||it.quantity||1) }))
      const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5)
      if (!sorted.length) return { text: 'No hay ventas registradas.', intent: 'TOP_SOLD' }
      let textResp = ' Productos más vendidos:\n\n'
      sorted.forEach(([id,qty]) => {
        const p = (products||[]).find(x => String(x.id)===String(id)) || { name: id }
        textResp += `• ${p.name || id} — ${qty} unidades\n`
      })
      return { text: textResp, intent: 'TOP_SOLD', meta: { top: sorted } }
    },

    UNKNOWN: () => ({ text: 'Lo siento, no entendí. Podés preguntar por stock, ventas de hoy, productos o clientes.', intent: 'UNKNOWN' }),
    EMPTY: () => ({ text: 'Escribí algo para que te pueda ayudar', intent: 'EMPTY' })
  }

  const handler = handlers[intent] || handlers.UNKNOWN
  try {
    const result = handler()
    return { ...result, intent, sessionId: sid }
  } catch (e) {
    return { text: 'Error interno al procesar tu consulta.', intent: 'ERROR', error: String(e) }
  }
}

export default { processQuery }
