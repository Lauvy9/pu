import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from './helpers'

export async function exportSalePDF(sale, options = {}) {
  if (!sale) throw new Error('Documento no proporcionado')

  const { company = {} } = options
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let y = 12

  // 🔑 CLAVE: tu app usa `type`, no `saleType`
  const isPresupuesto =
    sale.type?.toLowerCase() === 'presupuesto'

  /* =========================
     HEADER
  ========================= */
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.text(
    isPresupuesto ? 'PRESUPUESTO' : 'BOLETA DE VENTA',
    pageWidth / 2,
    20,
    { align: 'center' }
  )

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(
    `Fecha: ${new Date(sale.date).toLocaleDateString()}`,
    15,
    30
  )

  doc.setFont(undefined, 'bold')
  doc.text(company.name || 'Casa', 15, 38)

  y = 48

  /* =========================
     CLIENTE (SOLO VENTA)
  ========================= */
  if (!isPresupuesto) {
    doc.setFont(undefined, 'bold')
    doc.text('Cliente', 15, y)
    doc.setFont(undefined, 'normal')
    doc.text(
      `Nombre: ${sale.customer?.name || sale.clienteContacto?.nombre || '-'}`,
      15,
      y + 6
    )
    y += 16
  }

  /* =========================
     TABLA
  ========================= */
  if (isPresupuesto) {
    // ===== PRESUPUESTO =====
    const body = (sale.items || []).map(it => {
      const qty = Number(it.qty || 1)
      const unit = Number(it.price || 0)
      const total = qty * unit

      return [
        qty,
        it.name || it.description || 'Producto / Servicio',
        formatCurrency(unit),
        formatCurrency(total)
      ]
    })

    autoTable(doc, {
      startY: y,
      head: [['Cant.', 'Descripción', 'Precio unitario', 'Importe']],
      body,
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 0,
        fontStyle: 'bold'
      },
      margin: { left: 15, right: 15 }
    })

    y = doc.lastAutoTable.finalY + 10

    // TOTAL
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text(
      `TOTAL: ${formatCurrency(sale.total || 0)}`,
      pageWidth - 15,
      y,
      { align: 'right' }
    )

    y += 10

    // Leyenda
    doc.setFontSize(9)
    doc.setFont(undefined, 'italic')
    doc.text(
      'Este presupuesto no constituye comprobante de pago.',
      15,
      y
    )
  } else {
    // ===== VENTA =====
    const body = []

    ;(sale.items || []).forEach(it => {
      body.push([
        `${it.name || 'Servicio'} x${it.qty || 1}`,
        formatCurrency(it.price || 0),
        formatCurrency((it.price || 0) * (it.qty || 1))
      ])

      if (it.descripcion) {
        body.push([
          {
            content: `Descripción: ${it.descripcion}`,
            colSpan: 3,
            styles: {
              fontSize: 8,
              textColor: [100, 100, 100],
              cellPadding: { left: 4 }
            }
          }
        ])
      }
    })

    autoTable(doc, {
      startY: y,
      head: [['Ítem / Servicio', 'Unitario', 'Subtotal']],
      body,
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [60, 60, 60],
        textColor: 255
      },
      margin: { left: 15, right: 15 }
    })

    y = doc.lastAutoTable.finalY + 8

    /* =========================
       RESUMEN DE PAGO (SOLO VENTA)
    ========================= */
    const total = sale.total || 0
    const pagado = (sale.payments || []).reduce(
      (a, p) => a + (p.amount || 0),
      0
    )
    const saldo = total - pagado

    doc.setFont(undefined, 'bold')
    doc.text('RESUMEN DE PAGO', 15, y)
    y += 6

    doc.setFont(undefined, 'normal')
    doc.text(`Total: ${formatCurrency(total)}`, 15, y)
    y += 6

    if (saldo > 0) {
      doc.text(`Pagado: ${formatCurrency(pagado)}`, 15, y)
      y += 6

      doc.setTextColor(200, 0, 0)
      doc.setFont(undefined, 'bold')
      doc.text(`Saldo Pendiente: ${formatCurrency(saldo)}`, 15, y)

      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      y += 6
    }

    y += 4
    doc.text(`Método de pago: ${sale.metodoPago || '-'}`, 15, y)
    y += 6
    doc.text(`Entregado: ${sale.entregado ? 'Sí' : 'No (Pendiente)'}`, 15, y)
  }

  /* =========================
     FOOTER
  ========================= */
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
  }

  doc.save(
    `${isPresupuesto ? 'Presupuesto' : 'Boleta'}_${sale.id}.pdf`
  )
}
