// Este archivo expone UNA sola función: calculateFinancialData
export function calculateFinancialData(dateRange = {}, sales = [], expenses = [], purchases = []) {
  const start = dateRange && dateRange.start ? new Date(dateRange.start) : null
  if (start && !isNaN(start)) start.setHours(0,0,0,0)
  const end = dateRange && dateRange.end ? new Date(dateRange.end) : null
  if (end && !isNaN(end)) end.setHours(23,59,59,999)

  const filteredSales = (Array.isArray(sales) ? sales : []).filter(sale => {
    const raw = sale.date || sale.fecha || sale.createdAt || sale.timestamp || sale.created || null
    const d = raw ? new Date(raw) : null
    if (!d || isNaN(d)) return false
    if (start && d < start) return false
    if (end && d > end) return false

    const type = (sale.type || '').toString().toLowerCase()
    const total = Number(sale.total || sale.totalVenta || sale.totalAmount || sale.monto || 0) || 0

    // Excluir registros de tipo presupuesto/cotización o montos no positivos.
    const excluded = ['presupuesto', 'cotizacion', 'cotización', 'draft']
    if (excluded.includes(type)) return false
    if (total <= 0) return false

    return true
  })

  const totalSales = filteredSales.reduce((acc, sale) => {
    const v = Number(sale.total || sale.totalVenta || sale.totalAmount || sale.monto || 0)
    return acc + (isNaN(v) ? 0 : v)
  }, 0)

  const totalsByUnit = {
    muebleria: { totalSales:0, totalCosts:0 },
    mobileria: { totalSales:0, totalCosts:0 },
    vidrieria: { totalSales:0, totalCosts:0 },
    sin_especificar: { totalSales:0, totalCosts:0 }
  }

  filteredSales.forEach(sale => {
    const rawUnit = (sale.businessUnit || sale.unit || '') + ''
    const raw = rawUnit.toLowerCase()
    let key = 'sin_especificar'
    if (raw.includes('mobi') || raw.includes('mue')) key = 'muebleria'
    else if (raw.includes('vid')) key = 'vidrieria'

    const saleTotal = Number(sale.total || sale.totalVenta || sale.totalAmount || sale.monto || 0) || 0
    const saleCost = (Array.isArray(sale.items) ? sale.items : []).reduce((s, it) => {
      const cost = Number(it.cost || it.unitCost || it.materialCost || 0) || 0
      const qty = Number(it.qty || it.quantity || 0) || 0
      return s + (cost * (qty || 1))
    }, 0)

    totalsByUnit[key].totalSales += saleTotal
    totalsByUnit[key].totalCosts += saleCost
  })

  const paymentMethods = {}
  // Contabilizar únicamente pagos reales registrados en las ventas (sale.payments)
  filteredSales.forEach(sale => {
    if (Array.isArray(sale.payments) && sale.payments.length){
      sale.payments.forEach(p => {
        const method = (p.method || p.paymentMethod || 'unknown') + ''
        const amt = Number(p.amount || p.monto || p.value || 0) || 0
        if (amt <= 0) return
        paymentMethods[method] = (paymentMethods[method] || 0) + amt
      })
    }
    // Nota: no sumar fallback desde sale.total para evitar inflar montos con ventas no cobradas
  })

  console.log('clientHelpers - paymentMethods computed from filtered sales payments:', paymentMethods)

  return {
    filteredSales,
    totalSales,
    totalsByUnit,
    paymentMethods
  }
}

/**
 * Extrae los datos de contacto de un cliente desde una venta
 * Fuente única de verdad: la venta misma
 */
function extractClientDataFromSale(sale) {
  const customer = sale?.customer || sale?.client || null
  const contacto = sale?.clienteContacto || null

  const nombre = (customer && (customer.name || customer.nombre)) ||
    (contacto && contacto.nombre) ||
    sale?.clientName ||
    sale?.clienteNombre ||
    ''

  const telefono = (customer && (customer.phone || customer.telefono)) ||
    (() => {
      if (!contacto) return ''
      if (contacto.mode === 'phone') return contacto.value || ''
      if (contacto.mode === 'email') return ''
      if (contacto.mode === 'both') return (contacto.value && contacto.value.telefono) || ''
      return ''
    })() ||
    sale?.clientPhone ||
    sale?.clienteTelefono ||
    ''

  const email = (customer && (customer.email || customer.correo)) ||
    (() => {
      if (!contacto) return ''
      if (contacto.mode === 'email') return contacto.value || ''
      if (contacto.mode === 'both') return (contacto.value && contacto.value.email) || ''
      return ''
    })() ||
    sale?.clientEmail ||
    sale?.clienteEmail ||
    ''

  const direccion = (customer && (customer.address || customer.direccion)) ||
    sale?.clientAddress ||
    sale?.clienteDireccion ||
    ''

  return { nombre, telefono, email, direccion }
}

/**
 * Normaliza teléfono (solo dígitos)
 */
function normalizePhone(value) {
  return (value || '').toString().replace(/\D/g, '')
}

/**
 * Normaliza nombre (trim + lowercase para comparación)
 */
function normalizeName(value) {
  return (value || '').toString().trim().toLowerCase()
}

/**
 * Normaliza email
 */
function normalizeEmail(value) {
  return (value || '').toString().trim().toLowerCase()
}

/**
 * Genera una clave única para un cliente basada en sus datos
 * Preferencia: clienteFiado.id > email > (nombre + teléfono)
 */
function generateClientKey(sale) {
  // 1. Si hay clienteFiado.id, usarlo como clave primaria
  if (sale.clienteFiado) {
    return `fiado_${sale.clienteFiado}`
  }

  const { nombre, telefono, email } = extractClientDataFromSale(sale)
  const normEmail = normalizeEmail(email)
  const normPhone = normalizePhone(telefono)
  const normName = normalizeName(nombre)

  // 2. Si hay email, usarlo como clave
  if (normEmail) {
    return `email_${normEmail}`
  }

  // 3. Fallback: nombre + teléfono
  if (normName && normPhone) {
    return `nametl_${normName}|${normPhone}`
  }

  if (normName) {
    return `name_${normName}`
  }

  if (normPhone) {
    return `phone_${normPhone}`
  }

  // 4. Last resort: usar sale.id como key
  return `sale_${sale.id}`
}

/**
 * Obtiene el monto pagado de una venta
 * Fuente: sale.payments array (si existe)
 */
function getPaidAmount(sale) {
  const payments = Array.isArray(sale?.payments) ? sale.payments : []
  const paidByPayments = payments.reduce((sum, p) => sum + Number(p.amount || p.monto || 0), 0)
  
  if (paidByPayments > 0) {
    return paidByPayments
  }

  // Fallback: si no hay payments pero sale.pagado=true, devolver total
  if (sale?.pagado === true && Number(sale?.total || 0) > 0) {
    return Number(sale.total)
  }

  return 0
}

/**
 * Obtiene los productos comprados en una venta
 */
function getProductosFromSale(sale) {
  const items = Array.isArray(sale?.items) ? sale.items : []
  return items.map(item => ({
    id: item.id,
    name: item.name || item.nombre || '',
    quantity: Number(item.qty || item.quantity || 0),
    price: Number(item.price || item.precio || 0),
    productUnit: item.businessUnit || item.unit || item.productUnit || '',
    offerPrice: item.offerPrice || null
  }))
}

/**
 * Sincroniza y agrupa clientes desde Ventas
 * 
 * Reglas:
 * 1. Fuente única de verdad: las ventas
 * 2. Agrupar por cliente usando clienteFiado.id o email o (nombre+teléfono)
 * 3. Para cada cliente, normalizar: datos de contacto, historial, deuda
 * 4. Mostrar: qué compró, si es fiado, pagos, vencimientos
 */
export function buildClientsFromSales(sales = [], fiados = []) {
  const list = Array.isArray(sales) ? sales : Object.values(sales || {})
  const map = new Map()

  list.forEach(sale => {
    try {
      // Ignorar presupuestos y ventas inválidas
      if (sale.type === 'presupuesto' || sale.isPresupuesto) return
      const total = Number(sale.total || sale.totalVenta || sale.totalAmount || 0) || 0
      if (total <= 0) return

      const { nombre, telefono, email, direccion } = extractClientDataFromSale(sale)
      
      // Validar que el cliente tenga datos identificables
      const normEmail = normalizeEmail(email)
      const normPhone = normalizePhone(telefono)
      const normName = normalizeName(nombre)
      
      // Si no hay datos identificables, descartar la venta
      if (!normEmail && !normPhone && !normName) return
      
      // Si es "Sin nombre" sin teléfono ni email, descartar
      if (normName === 'sin nombre' && !normPhone && !normEmail) return

      const key = generateClientKey(sale)
      const paid = getPaidAmount(sale)
      const pending = Math.max(0, total - paid)
      const isFiado = sale.isFiado === true || sale.deudaEstado === 'Si'
      const dueDate = sale.dueDate || sale.fechaVencimiento || sale.vencimiento || null
      const saleDate = sale.date || sale.fecha || sale.createdAt || null

      // Inicializar entrada del cliente si no existe
      if (!map.has(key)) {
        map.set(key, {
          key,
          id: sale.clienteFiado || key,
          nombre: nombre || 'Sin nombre',
          telefono: telefono || '',
          email: email || '',
          direccion: direccion || '',
          
          // Historial comercial
          ventas: [],
          productosComprados: [],
          
          // Deuda y pagos
          totalComprado: 0,
          totalPagado: 0,
          totalAdeudado: 0,
          pending: 0,
          
          // Fiado
          esFiado: false,
          primerPagoFecha: null,
          proximoVencimiento: null,
          fechaVencimientoCalculada: null,
          
          // Historial
          ultimaCompraFecha: null,
          comprasCount: 0
        })
      }

      const entry = map.get(key)
      
      // Agregar venta al historial
      entry.ventas.push({
        id: sale.id,
        date: saleDate,
        total: total,
        paid: paid,
        pending: pending,
        isFiado: isFiado,
        dueDate: dueDate,
        items: getProductosFromSale(sale),
        notes: sale.notes || ''
      })

      // Agregar productos al historial (merge)
      const productosEnVenta = getProductosFromSale(sale)
      productosEnVenta.forEach(prod => {
        const existing = entry.productosComprados.find(p => p.id === prod.id)
        if (existing) {
          existing.quantity += prod.quantity
          existing.lastPurchaseDate = saleDate
        } else {
          entry.productosComprados.push({
            ...prod,
            lastPurchaseDate: saleDate
          })
        }
      })

      // Actualizar totales
      entry.totalComprado += total
      entry.totalPagado += paid
      entry.totalAdeudado += pending
      entry.pending = Math.max(0, entry.totalComprado - entry.totalPagado)
      entry.comprasCount += 1

      // Actualizar estado de fiado
      if (isFiado && pending > 0) {
        entry.esFiado = true
      }

      // Actualizar primer pago (más temprana)
      if (paid > 0) {
        if (!entry.primerPagoFecha) {
          entry.primerPagoFecha = saleDate
        } else {
          const primerPagoDate = new Date(entry.primerPagoFecha)
          const salePaymentDate = new Date(saleDate)
          if (!isNaN(salePaymentDate) && salePaymentDate < primerPagoDate) {
            entry.primerPagoFecha = saleDate
          }
        }
      }

      // Actualizar próximo vencimiento (más cercano y pendiente)
      if (pending > 0 && dueDate) {
        if (!entry.proximoVencimiento) {
          entry.proximoVencimiento = dueDate
        } else {
          const proximoDate = new Date(entry.proximoVencimiento)
          const dueDateObj = new Date(dueDate)
          if (!isNaN(dueDateObj) && dueDateObj < proximoDate) {
            entry.proximoVencimiento = dueDate
          }
        }
      }

      // Actualizar última compra
      if (saleDate) {
        const d = new Date(saleDate)
        if (!isNaN(d)) {
          if (!entry.ultimaCompraFecha || d > new Date(entry.ultimaCompraFecha)) {
            entry.ultimaCompraFecha = saleDate
          }
        }
      }

      // Si es fiado, calcular fecha de vencimiento SOLO desde ventas FIADO
      // Usar la venta FIADO más reciente
      if (isFiado && saleDate) {
        const fechaVenta = new Date(saleDate)
        if (!isNaN(fechaVenta)) {
          // Calcular vencimiento correctamente: mismo día del mes siguiente
          // Si el día no existe en el mes siguiente, usar el último día del mes
          const year = fechaVenta.getFullYear()
          const month = fechaVenta.getMonth() // 0-11
          const day = fechaVenta.getDate()
          
          // Calcular el último día del mes siguiente
          const ultimoDiaMesSiguiente = new Date(year, month + 2, 0).getDate()
          const diaFinal = Math.min(day, ultimoDiaMesSiguiente)
          
          const fechaVencimiento = new Date(year, month + 1, diaFinal)
          
          // Guardar solo si es la venta FIADO más reciente
          if (!entry.fechaVencimientoCalculada) {
            entry.fechaVencimientoCalculada = fechaVencimiento.toISOString().split('T')[0]
          } else {
            const ultimaFechaVencimiento = new Date(entry.fechaVencimientoCalculada)
            // La más reciente es la que tiene fecha de venta más reciente
            // Comparar con la última venta registrada
            const ultimaVentaEnEntry = entry.ventas
              .filter(v => v.isFiado)
              .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
            
            if (ultimaVentaEnEntry && saleDate > ultimaVentaEnEntry.date) {
              entry.fechaVencimientoCalculada = fechaVencimiento.toISOString().split('T')[0]
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error processing sale in buildClientsFromSales:', e)
    }
  })

  // Ordenar por última compra (más recientes primero)
  return Array.from(map.values()).sort((a, b) => {
    const da = a.ultimaCompraFecha ? new Date(a.ultimaCompraFecha) : new Date(0)
    const db = b.ultimaCompraFecha ? new Date(b.ultimaCompraFecha) : new Date(0)
    return db - da
  })
}

/**
 * Compatibilidad: versión ligera antigua (mantener para no romper imports)
 */
export function buildClientsFromSalesLegacy(sales = []) {
  const list = Array.isArray(sales) ? sales : Object.values(sales || {})
  const map = new Map()
  list.forEach(sale => {
    try{
      const clientObj = sale.client || sale.customer || null
      const name = (clientObj && (clientObj.name || clientObj.nombre)) || sale.clientName || sale.clienteNombre || ''
      const phone = (clientObj && (clientObj.phone || clientObj.telefono)) || sale.clientPhone || sale.clienteTelefono || ''
      const id = sale.clienteFiado || sale.clientId || (clientObj && (clientObj.id || clientObj._id)) || `${(name||'').toString().trim()}|${(phone||'').toString().trim()}`
      const key = String(id)
      if (!map.has(key)) map.set(key, { id: key, nombre: name || key, telefono: phone || '', totalPurchased: 0, totalPaid: 0 })
      const entry = map.get(key)
      const total = Number(sale.total || sale.totalVenta || sale.totalAmount || sale.monto || 0) || 0
      entry.totalPurchased += total
      const paid = (Array.isArray(sale.payments) ? sale.payments : []).reduce((s,p) => s + Number(p.amount || p.monto || 0), 0)
      entry.totalPaid += paid
    }catch(e){ /* ignore malformed sale */ }
  })
  return Array.from(map.values()).sort((a,b) => (b.totalPurchased||0) - (a.totalPurchased||0))
}


