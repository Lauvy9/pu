import React, { useMemo } from 'react'
import { useStore } from '../../context/StoreContext'
import { computeStockByUnit, computeTotalSalesByUnit, computeNetProfitByUnit, topProductsByUnit, paymentMethodsByUnit } from '../../utils/unitReportsUtils'
import UnitStockChart from './UnitStockChart'
import UnitSalesChart from './UnitSalesChart'
import UnitSalesNetChart from './UnitSalesNetChart'
import UnitTopProducts from './UnitTopProducts'
import UnitPaymentMethods from './UnitPaymentMethods'

export default function UnitOverview({ dateRange }){
  const { products = [], sales = [], expenses = [] } = useStore()

  // Normalizar filteredSales: usar la fuente única de verdad (store.sales), filtrar por fecha y por tipo 'venta'
  const filteredSales = React.useMemo(() => {
    const start = dateRange?.start ? new Date(dateRange.start) : null
    if (start && !isNaN(start)) start.setHours(0,0,0,0)
    const end = dateRange?.end ? new Date(dateRange.end) : null
    if (end && !isNaN(end)) end.setHours(23,59,59,999)
    return (Array.isArray(sales) ? sales : []).filter(s => {
      try{
        const d = s?.date ? new Date(s.date) : null
        if (!d || isNaN(d)) return false
        if (start && d < start) return false
        if (end && d > end) return false
        const t = (s.type || '').toString().toLowerCase()
        return t === 'venta'
      }catch(e){ return false }
    })
  }, [sales, dateRange])

  const stockByUnit = useMemo(()=> {
    return (typeof computeStockByUnit === 'function') ? computeStockByUnit(products) : { muebleria:{stock:0,value:0}, vidrieria:{stock:0,value:0}, sin_especificar:{stock:0,value:0} }
  }, [products])

  const salesByUnit = useMemo(()=> {
    return (typeof computeTotalSalesByUnit === 'function') ? computeTotalSalesByUnit(filteredSales, products, dateRange) : { muebleria:{qty:0,total:0}, vidrieria:{qty:0,total:0}, sin_especificar:{qty:0,total:0} }
  }, [filteredSales, products, dateRange])

  const topMueb = useMemo(()=> {
    return (typeof topProductsByUnit === 'function') ? topProductsByUnit(filteredSales, products, 'muebleria', 5) : []
  }, [filteredSales, products, dateRange])

  const topVidr = useMemo(()=> {
    return (typeof topProductsByUnit === 'function') ? topProductsByUnit(filteredSales, products, 'vidrieria', 5) : []
  }, [filteredSales, products])

  const paymentsByUnit = useMemo(()=> {
    return (typeof paymentMethodsByUnit === 'function') ? paymentMethodsByUnit(filteredSales, products, dateRange) : { muebleria:{}, vidrieria:{}, sin_especificar:{} }
  }, [filteredSales, products, dateRange])

  const profitByUnit = useMemo(() => {
    return (typeof computeNetProfitByUnit === 'function') ? computeNetProfitByUnit(filteredSales, products, expenses, dateRange) : { muebleria:{ totalSales:0, grossProfit:0, expenses:0, netProfit:0 }, vidrieria:{ totalSales:0, grossProfit:0, expenses:0, netProfit:0 }, sin_especificar:{ totalSales:0, grossProfit:0, expenses:0, netProfit:0 } }
  }, [filteredSales, products, expenses, dateRange])

  return (
    <section style={{ marginTop:12 }} className="card">
      <h3 style={{ marginTop:0 }}>Reportes por Unidad</h3>
      <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:12 }}>
        <UnitStockChart data={stockByUnit} />
        <UnitSalesChart data={salesByUnit} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:12, marginTop:12 }}>
        <UnitTopProducts title="Mueblería - Top 5" items={topMueb} />
        <UnitTopProducts title="Vidriería - Top 5" items={topVidr} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:12, marginTop:12 }}>
        <UnitSalesNetChart totals={profitByUnit} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:12, marginTop:12 }}>
        <UnitPaymentMethods unit="muebleria" data={paymentsByUnit.muebleria || {}} />
        <UnitPaymentMethods unit="vidrieria" data={paymentsByUnit.vidrieria || {}} />
      </div>
    </section>
  )
}
