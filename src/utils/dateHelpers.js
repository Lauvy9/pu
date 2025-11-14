// dateHelpers.js
// Utilities to parse local dates and compute month-based due dates.
export function parseToLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const s = String(value).trim();
  // DD/MM/YYYY or DD/MM/YYYY HH:MM(:SS)
  const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (dmy) {
    const dd = Number(dmy[1]), mm = Number(dmy[2]), yyyy = Number(dmy[3]);
    return new Date(yyyy, mm - 1, dd);
  }
  // ISO YYYY-MM-DD
  const isoYmd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoYmd) {
    const yyyy = Number(isoYmd[1]), mm = Number(isoYmd[2]), dd = Number(isoYmd[3]);
    return new Date(yyyy, mm - 1, dd);
  }
  const maybeDate = new Date(s);
  if (!isNaN(maybeDate.getTime())) {
    return new Date(maybeDate.getFullYear(), maybeDate.getMonth(), maybeDate.getDate());
  }
  return null;
}

export function addMonthsLocal(date, months = 1) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const targetMonthIndex = m + months;
  const targetYear = y + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const daysInTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
  const day = Math.min(d, daysInTarget);
  return new Date(targetYear, targetMonth, day);
}

export function isPaymentOnOrBeforeDue(paymentDate, dueDate) {
  try {
    const pd = parseToLocalDate(paymentDate);
    const dd = parseToLocalDate(dueDate);
    if (!pd || !dd) return false;
    return pd.getTime() <= dd.getTime();
  } catch (e) { return false }
}

export function isAfterDue(dateLike, dueDate) {
  try {
    if (!dueDate) return false;
    const now = dateLike ? parseToLocalDate(dateLike) : parseToLocalDate(new Date());
    const dd = parseToLocalDate(dueDate);
    if (!now || !dd) return false;
    return now.getTime() > dd.getTime();
  } catch(e) { return false }
}

export function evaluatePaymentsForSale(fechaVenta, pagos = [], mesesPlazo = 1) {
  const fv = parseToLocalDate(fechaVenta);
  const due = addMonthsLocal(fv, mesesPlazo);
  const resultados = (pagos || []).map(p => {
    const pagoDate = parseToLocalDate(p.fecha_pago || p.date || p.fecha || p);
    const onTime = pagoDate ? (pagoDate.getTime() <= due.getTime()) : false;
    return { ...p, fecha_parsed: pagoDate, fecha_vencimiento: due, estado_pago: onTime ? 'A_TIEMPO' : 'VENCIDO' };
  });
  return { fecha_venta: fv, fecha_vencimiento: due, pagos: resultados };
}
