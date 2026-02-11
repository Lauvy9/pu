// Módulo sencillo de detección de intenciones y entidades para LAURA
export function normalize(text = '') {
  return (text || '').toString().toLowerCase().replace(/[^a-z0-9áéíóúñ\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function detectIntent(text = '') {
  const t = normalize(text)
  if (!t) return { intent: 'EMPTY' }

  // Saludo
  if (/\b(hola|buenos|buenas|hey|buen dia|buen día|buenas tardes|buenas noches)\b/.test(t)) {
    return { intent: 'GREETING' }
  }

  // Stock
  if (/\b(stock|inventario|reponer|faltantes|stock bajo|qué stock|inventario actual|existencias)\b/.test(t)) {
    return { intent: 'CHECK_STOCK' }
  }

  // Ventas hoy / resumen
  if (/\b(ventas de hoy|ventas hoy|qué vendimos|vendimos hoy|resumen de hoy|total hoy|ingresos hoy)\b/.test(t)) {
    return { intent: 'CHECK_SALES_TODAY' }
  }

  // Producto específico (buscar por nombre)
  if (/\b(stock de|stock del|stock para|precio de|precio del|producto|productos|dame el producto)\b/.test(t) || t.split(' ').length <= 3) {
    // Treat short queries as possible product interest/search
    return { intent: 'PRODUCT_INTEREST', query: text.trim() }
  }

  // Clientes
  if (/\b(cliente|clientes|quién compró|quien compr[oó]|cliente más)\b/.test(t)) {
    return { intent: 'CHECK_CLIENTS' }
  }

  // Deudas / fiados
  if (/\b(fiado|deuda|debe|quién debe|quien debe)\b/.test(t)) {
    return { intent: 'CHECK_DEBTS' }
  }

  // Top vendido
  if (/\b(más vendido|mas vendido|top ventas|top vendidos|más vendido hoy)\b/.test(t)) {
    return { intent: 'TOP_SOLD' }
  }

  return { intent: 'UNKNOWN' }
}

export default { normalize, detectIntent }
