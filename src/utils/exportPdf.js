import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { formatCurrency } from './helpers'

// Cargar logo si existe en /logo.png
function loadLogoDataURL(url){
  return new Promise((resolve)=>{
    if (typeof document === 'undefined') return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = ()=>{
      try{
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img,0,0)
        const data = canvas.toDataURL('image/png')
        resolve(data)
      }catch(e){ resolve(null) }
    }
    img.onerror = ()=> resolve(null)
    img.src = url
  })
}

// Exporta PDF con logo, encabezado corporativo, captura opcional y tablas con autoTable
export default async function exportToPDF(dashboardData, dateRange, options = {}){
  if (!dashboardData) throw new Error('No hay datos para exportar')

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  let y = margin

  // Intenta cargar logo desde public /logo.png
  const logoData = await loadLogoDataURL('/logo.png')
  if (logoData){
    try{ doc.addImage(logoData, 'PNG', margin, y, 60, 60) }catch(e){ /* ignore */ }
  }

  // Encabezado corporativo
  doc.setFontSize(16)
  const titleX = logoData ? margin + 70 : margin
  doc.text('Mi Empresa - Reportes Integrados', titleX, y + 18)
  doc.setFontSize(10)
  const rangeLabel = dateRange && dateRange.start && dateRange.end ? `${dateRange.start} → ${dateRange.end}` : 'Rango: -'
  doc.text(rangeLabel, titleX, y + 36)
  y += 72

  // Intentar captura visual del dashboard si existe y si html2canvas está disponible
  // Respetar opción includeImage (por defecto true)
  const includeImage = options && typeof options.includeImage !== 'undefined' ? !!options.includeImage : true
  if (includeImage) {
  try{
    const el = typeof document !== 'undefined' ? document.getElementById('reportes-dashboard') : null
    if (el){
      try{
        const html2canvas = (await import('html2canvas')).default
        const canvas = await html2canvas(el, { scale: 1.5 })
        const imgData = canvas.toDataURL('image/png')
        const pageWidth = doc.internal.pageSize.width - margin*2
        const ratio = canvas.height / canvas.width
        const imgHeight = pageWidth * ratio
        doc.addImage(imgData, 'PNG', margin, y, pageWidth, imgHeight)
        y += imgHeight + 12
      }catch(e){ console.warn('html2canvas capture failed, falling back to tables', e) }
    }
  }catch(e){ console.warn('capture attempt error', e) }
  } else {
    // skip capture
  }

  // Resumen de métricas
  doc.setFontSize(12)
  doc.text('Resumen', margin, y)
  y += 14
  doc.setFontSize(10)
  const lines = [
    ['Ventas Totales', formatCurrency(dashboardData.totalSales || 0)],
    ['Costo de Materiales', formatCurrency(dashboardData.costoMateriales || dashboardData.totalCosts || 0)],
    ['Gastos Operativos', formatCurrency(dashboardData.totalExpenses || dashboardData.gastosOperativos || 0)],
    ['Ganancia Neta', formatCurrency(dashboardData.netProfit || dashboardData.gananciaNeta || 0)],
    ['Margen (%)', (dashboardData.profitMargin ? `${Number(dashboardData.profitMargin).toFixed(2)}%` : '-')]
  ]
  lines.forEach(([k,v])=>{ doc.text(`${k}: ${v}`, margin, y); y += 12 })
  y += 8

  // Tablas usando autoTable
  const sales = Array.isArray(dashboardData.filteredSales) ? dashboardData.filteredSales : (dashboardData.sales || [])
  const salesRows = sales.slice(0,1000).map(s => ([s.id || s._id || '', (s.date || s.fecha || s.createdAt || '').toString(), formatCurrency(Number(s.total || s.totalVenta || s.amount || 0))]))
  if (salesRows.length){
    doc.autoTable({
      startY: y,
      head: [['ID','Fecha','Total']],
      body: salesRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 90, 175] }
    })
    y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : y + 12
  }

  const exps = Array.isArray(dashboardData.filteredExpenses) ? dashboardData.filteredExpenses : (dashboardData.expenses || [])
  const expRows = exps.slice(0,1000).map(e => ([e.id || e._id || '', (e.date || e.fecha || e.createdAt || '').toString(), formatCurrency(Number(e.amount || e.monto || e.value || 0))]))
  if (expRows.length){
    doc.autoTable({
      startY: y,
      head: [['ID','Fecha','Monto']],
      body: expRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [175, 20, 20] }
    })
    y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : y + 12
  }

  // Footer
  doc.setFontSize(8)
  doc.text(`Generado: ${new Date().toLocaleString()}`, margin, doc.internal.pageSize.height - 20)
  doc.save(`reporte_${(dateRange.start||'start')}_${(dateRange.end||'end')}.pdf`)
}
