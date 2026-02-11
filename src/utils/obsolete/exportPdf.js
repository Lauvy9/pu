// ❌ UTIL OBSOLETO — YA NO SE USA. Mantener por ahora para referencia histórica.
// Este util mantenido por compatibilidad histórica. Las vistas de `reportes`
// fueron actualizadas para no usar exportación a PDF. Antes de eliminar,
// confirmar que ninguna otra vista depende de este módulo.
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from '../helpers'

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
  const company = options && options.company ? options.company : {}
  doc.setFontSize(16)
  const titleX = logoData ? margin + 70 : margin
  const companyTitle = company.name ? `${company.name} - Reportes` : 'Mi Empresa - Reportes Integrados'
  doc.text(companyTitle, titleX, y + 18)
  doc.setFontSize(10)
  const rangeLabel = dateRange && dateRange.start && dateRange.end ? `${dateRange.start} → ${dateRange.end}` : 'Rango: -'
  doc.text(rangeLabel, titleX, y + 36)
  y += 72

  // Nota: por petición del usuario, NO incluimos capturas de los gráficos/dashboard en el PDF.
  // Esto evita usar html2canvas o insertar imágenes de los componentes visuales.

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

  // (Se omiten tablas separadas) Generaremos una única tabla unificada más abajo
  const exps = Array.isArray(dashboardData.filteredExpenses) ? dashboardData.filteredExpenses : (dashboardData.expenses || [])

  // Detalle de ventas: producto por producto, cliente, y estado de entrega
  try{
    const salesList = Array.isArray(options && options.sales) ? options.sales : (dashboardData.filteredSales || [])
    const fiados = Array.isArray(options && options.fiados) ? options.fiados : (options && options.clients ? options.clients : [])
    const bankAccounts = Array.isArray(options && options.bankAccounts) ? options.bankAccounts : []

    // Construir una única tabla unificada con ventas por item, pagos y gastos como filas
    const unifiedRows = []

    // Primero recorrer ventas y agregar una fila por cada item vendido
    salesList.forEach(sale => {
      const saleId = sale.id || sale._id || ''
      const saleDate = (sale.date || sale.fecha || sale.createdAt || '') ? new Date(sale.date || sale.fecha || sale.createdAt || '').toLocaleString() : ''
      // resolver cliente
      let clientName = sale.clientName || sale.cliente || sale.customerName || ''
      if (!clientName && sale.clienteFiado) {
        const f = fiados.find(ff => String(ff.id) === String(sale.clienteFiado))
        if (f) clientName = f.nombre || f.name || ''
      }
      if (!clientName && sale.clientId) {
        const f2 = fiados.find(ff => String(ff.id) === String(sale.clientId))
        if (f2) clientName = f2.nombre || f2.name || ''
      }

      // pagos agregados por venta
      const payments = Array.isArray(sale.payments) ? sale.payments : (sale.payments || [])
      const totalPaid = payments.reduce((s,p)=> s + Number(p.amount || p.cantidad || 0), 0)
      const methods = payments.map(p => {
        const method = p.metodo || p.method || p.tipo || p.type || ''
        if ((method || '').toLowerCase().includes('transfer')){
          const acc = bankAccounts.find(b => String(b.id) === String(p.accountId || p.account || p.accountId))
          return `${method}${acc ? ` (${acc.bankName || ''} ${acc.number || ''})` : ''}`
        }
        return method || (p.note || '')
      }).join(', ')

      (sale.items || []).forEach(it => {
        const prodName = it.name || it.title || it.productName || it.descripcion || it.id || ''
        const qty = Number(it.qty || it.quantity || 0)
        const unit = Number(it.price || it.unitPrice || 0)
        const cost = Number(it.cost || it.unitCost || 0)
        const totalItem = (qty || 0) * (unit || 0)
        const entregado = !!sale.entregado || !!it.entregado || false
        const entregadoAt = sale.entregadoAt || it.entregadoAt || ''
        const saleTotal = Number(sale.total || sale.totalVenta || sale.amount || sale.monto || 0) || 0
        unifiedRows.push([
          'Venta',
          saleId,
          saleDate,
          formatCurrency(saleTotal || 0),
          clientName || '-',
          prodName,
          qty || 0,
          formatCurrency(unit || 0),
          formatCurrency(cost || 0),
          formatCurrency(totalItem || 0),
          entregado ? 'Sí' : 'No',
          entregadoAt ? new Date(entregadoAt).toLocaleString() : '-',
          formatCurrency(totalPaid || 0),
          methods || '- ',
          '-', // gastoTipo
          '-', // gastoCategoria
          '-', // gastoDetalle
          '-'  // gastoMonto
        ])
      })
    })

    // Luego agregar gastos (materiales y operativos) como filas separadas
    const productKeywords = ['producto','material','insumo','compra','compra de','materia prima']
    const operationalKeywords = ['alquiler','renta','servicio','luz','agua','internet','sueldo','salario','gasolina','gas']
    exps.forEach(e => {
      const rawCategory = (e.category || e.type || '')
      const text = (rawCategory + ' ' + (e.note || e.description || e.descripcion || '')).toLowerCase()
      // A) Preferir campo `category` para clasificar gastos
      let gastoTipo = 'Operativo'
      if (rawCategory && typeof rawCategory === 'string'){
        const rc = rawCategory.toLowerCase()
        if (rc.includes('material') || rc.includes('producto') || rc.includes('insumo') || rc.includes('compra')) gastoTipo = 'Material'
        else if (rc.includes('alquiler') || rc.includes('renta') || rc.includes('servicio') || rc.includes('operativ') || rc.includes('gasto')) gastoTipo = 'Operativo'
      } else {
        // fallback heurística
        const isProd = productKeywords.some(k => text.includes(k))
        const isOp = operationalKeywords.some(k => text.includes(k))
        if (isProd && !isOp) gastoTipo = 'Material'
        else if (isProd && isOp) gastoTipo = 'Material/Operativo'
        else gastoTipo = isOp ? 'Operativo' : (isProd ? 'Material' : 'Operativo')
      }
      const gastoCategoria = e.category || e.type || ''
      const gastoDetalle = e.note || e.description || e.descripcion || ''
      const gastoMonto = Number(e.amount || e.monto || e.value || e.cost || 0) || 0
      unifiedRows.push([
        'Gasto',
        e.id || e._id || '',
        (e.date || e.fecha || e.createdAt || '').toString(),
        '-',
        '-', // cliente
        '-', // producto
        '-', // qty
        '-', // pu
        '-', // costo
        '-', // total item
        '-', // entregado
        '-', // fecha entrega
        '-', // totalPaid
        '-', // methods
        gastoTipo,
        gastoCategoria,
        gastoDetalle,
        formatCurrency(gastoMonto || 0)
      ])
    })

    if (unifiedRows.length){
      // B) Ajustes de orden y anchos; C) eliminar límite slice para permitir paginación automática
      const rUnified = autoTable(doc, {
        startY: y,
        head: [[
          'Tipo','ID','Fecha','Venta Total','Cliente','Producto','Cant','P.U.','Costo','Total Item','Total Pagado','Métodos/Cuenta','Entregado','Fecha Entrega','Gasto Tipo','Gasto Categoría','Gasto Detalle','Gasto Monto'
        ]],
        body: unifiedRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [30, 80, 130], textColor: 255 },
        alternateRowStyles: { fillColor: [250,250,250] },
        columnStyles: {
          0: { cellWidth: 40 }, // Tipo
          1: { cellWidth: 70 }, // ID
          2: { cellWidth: 80 }, // Fecha
          3: { cellWidth: 60, halign: 'right' }, // Venta Total
          4: { cellWidth: 110 }, // Cliente
          5: { cellWidth: 110 }, // Producto
          6: { cellWidth: 30, halign: 'right' }, // Cant
          7: { cellWidth: 50, halign: 'right' }, // P.U.
          8: { cellWidth: 50, halign: 'right' }, // Costo
          9: { cellWidth: 60, halign: 'right' }, // Total Item
          10: { cellWidth: 70, halign: 'right' }, // Total Pagado
          11: { cellWidth: 120 }, // Métodos/Cuenta
          12: { cellWidth: 50, halign: 'center' }, // Entregado
          13: { cellWidth: 90 }, // Fecha Entrega
          14: { cellWidth: 70 }, // Gasto Tipo
          15: { cellWidth: 80 }, // Gasto Categoría
          16: { cellWidth: 140 }, // Gasto Detalle
          17: { cellWidth: 60, halign: 'right' } // Gasto Monto
        }
      })
      y = rUnified && rUnified.finalY ? rUnified.finalY + 12 : (doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : y + 12)
    }
  }catch(e){ console.warn('detalle ventas/gastos fallo', e) }

  // Footer
  doc.setFontSize(8)
  doc.text(`Generado: ${new Date().toLocaleString()}`, margin, doc.internal.pageSize.height - 20)
  doc.save(`reporte_${(dateRange.start||'start')}_${(dateRange.end||'end')}.pdf`)
}
