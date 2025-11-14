// Generador rápido de datos de ejemplo para ventas
export function generateSampleSales({ days = 7, avgPerDay = 40, seed = 1 } = {}){
  const products = [
    { name: 'Vidrio templado', price: 120 },
    { name: 'Vidrio float', price: 80 },
    { name: 'Mueble a medida', price: 450 },
    { name: 'Herrajes', price: 30 },
    { name: 'Corte y montaje', price: 200, isService: true },
    { name: 'Madera MDF', price: 150 },
    { name: 'Espejo', price: 90 }
  ]
  const out = []
  const now = new Date()
  for (let d = 0; d < days; d++){
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d)
    const count = Math.max(1, Math.round(avgPerDay * (0.6 + Math.random()*0.8)))
    for (let i = 0; i < count; i++){
      const hour = Math.floor(Math.random()*12) + 8 // 8..19
      const minute = Math.floor(Math.random()*60)
      const dt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute)
      const itemsCount = 1 + Math.floor(Math.random()*3)
      const items = []
      let total = 0
      for (let j = 0; j < itemsCount; j++){
        const p = products[Math.floor(Math.random()*products.length)]
        const qty = 1 + Math.floor(Math.random()*3)
        const price = p.price
        items.push({ name: p.name, qty, price, isService: !!p.isService })
        total += price * qty
      }
      out.push({ id: `s_${Date.now()}_${d}_${i}_${Math.random().toString(36).slice(2,6)}`, date: dt.toISOString(), total, items })
    }
  }
  return out
}
