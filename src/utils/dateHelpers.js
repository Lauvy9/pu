// Utilidades de fecha usadas en la app.
// Exporta: parseDate, startOfDay, endOfDay, isPaymentOnOrBeforeDue, isAfterDue,
//         parseToLocalDate, addMonthsLocal, toLocalYMD

export function parseDate(value) {
  if (!value) return null
  if (value instanceof Date) return isNaN(value) ? null : value

  // ISO o YYYY-MM-DD[T...]
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value)
    return isNaN(d) ? null : d
  }

  // DD/MM/YYYY or "DD/MM/YYYY, HH:MM(:SS)?"
  if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) {
    const parts = value.split(',')
    const datePart = parts[0].trim()
    const [dd, mm, yyyy] = datePart.split('/')
    let d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
    if (parts[1]) {
      const time = parts[1].trim()
      const tparts = time.split(':').map(tp => Number(tp))
      if (!isNaN(tparts[0])) d.setHours(tparts[0] || 0, tparts[1] || 0, tparts[2] || 0, 0)
    }
    return isNaN(d) ? null : d
  }

  // Fallback: intentar Date constructor
  const d = new Date(value)
  return isNaN(d) ? null : d
}

export function startOfDay(dateLike) {
  const d = parseDate(dateLike)
  if (!d) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

export function endOfDay(dateLike) {
  const d = parseDate(dateLike)
  if (!d) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

// Comparador: ¿el pago fue en o antes del dueDate?
export function isPaymentOnOrBeforeDue(paymentDate, dueDate) {
  const pay = parseDate(paymentDate)
  const due = endOfDay(dueDate)
  if (!pay || !due) return false
  return pay.getTime() <= due.getTime()
}

// Comparador: ¿dateCheck (o hoy) está después del dueDate?
export function isAfterDue(dateCheck, dueDate) {
  const now = parseDate(dateCheck) || new Date()
  const dueEnd = endOfDay(dueDate)
  if (!dueEnd) return false
  return now.getTime() > dueEnd.getTime()
}

// parseToLocalDate: convierte 'YYYY-MM-DD' o ISO a Date en zona local (sin conversión a UTC)
export function parseToLocalDate(isoString) {
  if (!isoString) return null
  if (isoString instanceof Date) return isoString
  const m = String(isoString).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) {
    const y = Number(m[1]), mm = Number(m[2]) - 1, d = Number(m[3])
    return new Date(y, mm, d)
  }
  return parseDate(isoString)
}

// addMonthsLocal: suma meses manteniendo día cuando sea posible
export function addMonthsLocal(dateObj, months) {
  if (!dateObj) return null
  const d = new Date(dateObj.getTime())
  const targetMonth = d.getMonth() + Number(months)
  d.setMonth(targetMonth)
  // manejar overflow de días (p.ej. 31 en meses cortos)
  if (d.getDate() !== dateObj.getDate()) {
    d.setDate(0) // último día del mes anterior
  }
  return d
}

// toLocalYMD: formato YYYY-MM-DD (útil para inputs type=date)
export function toLocalYMD(dateObj) {
  if (!dateObj) return ''
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default {
  parseDate,
  startOfDay,
  endOfDay,
  isPaymentOnOrBeforeDue,
  isAfterDue,
  parseToLocalDate,
  addMonthsLocal,
  toLocalYMD
}