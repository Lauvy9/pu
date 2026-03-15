export function parseNumber(v) {
  return Number(v || 0)
}

export function selectBasePrice(item, saleType) {
  const isService = item._kind === 'service'
  if (isService) return item.price ?? item.precio ?? 0
  return saleType === 'mayorista'
    ? (item.price_mayor ?? item.price ?? item.cost ?? 0)
    : (item.price_minor ?? item.price ?? item.cost ?? 0)
}

export function computeOfferPrice(basePrice, ofertaPct) {
  const pct = Number(ofertaPct || 0)
  if (!pct) return null
  return Number((basePrice * (1 - pct / 100)).toFixed(2))
}

export function canAddToCart(prodStock, existingQty, desiredAdd = 1) {
  const allowed = Math.max(0, (prodStock || 0) - (existingQty || 0))
  return Math.min(desiredAdd, allowed)
}
