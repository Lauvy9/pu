export function id(){
  return Math.random().toString(36).slice(2,9)
}

export function calcPrices({cost, ...rest}){
  const costN = Number(cost) || 0
  // Leer porcentajes si vienen en el objeto (porcentajeGananciaMinorista, porcentajeGananciaMayorista)
  const pctMinor = Number(rest.porcentajeGananciaMinorista ?? rest.pct_minor ?? 60) || 60 // default 60%
  const pctMayor = Number(rest.porcentajeGananciaMayorista ?? rest.pct_mayor ?? 50) || 50   // default 50%

  const minorista = +((costN * (1 + pctMinor / 100))).toFixed(2)
  const mayorista = +((costN * (1 + pctMayor / 100))).toFixed(2)
  return { ...rest, cost: costN, porcentajeGananciaMinorista: pctMinor, porcentajeGananciaMayorista: pctMayor, price_mayor: mayorista, price_minor: minorista }
}

export function formatCurrency(n){
  return '$' + Number(n).toFixed(2)
}

// Devuelve YYYY-MM-DD en zona local para una fecha dada
export function toLocalYMD(dateLike){
  const d = new Date(dateLike)
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

// Re-export date helpers from dateHelpers to centralize logic
import { isPaymentOnOrBeforeDue, isAfterDue } from './dateHelpers'
export { isPaymentOnOrBeforeDue, isAfterDue }