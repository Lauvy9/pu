// ❌ UTIL OBSOLETO — YA NO SE USA. Mantener por ahora para referencia histórica.
// Generador antiguo de comprobantes/estados para clientes (fiados).
// Conservado como referencia; no se importa desde las pantallas de `reportes`.
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function exportFiadosStatement(client, transactions = [], options = {}){
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  let y = margin
  doc.setFontSize(16)
  doc.text(`Estado de cuenta - ${client?.nombre || client?.name || ''}`, margin, y)
  y += 24

  doc.setFontSize(10)
  doc.text(`Cliente: ${client?.nombre || client?.name || client?.id || '-'}`, margin, y)
  y += 14
  doc.text(`Email: ${client?.email || '-'}`, margin, y)
  y += 14

  const rows = transactions.map(t => ([
    t.id || t._id || '',
    t.date ? new Date(t.date).toLocaleString() : (t.fecha ? new Date(t.fecha).toLocaleString() : ''),
    t.type || t.tipo || '',
    t.description || t.note || '',
    (t.amount || t.monto || 0)
  ]))

  autoTable(doc, {
    startY: y,
    head: [['ID','Fecha','Tipo','Detalle','Monto']],
    body: rows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 10 }
  })

  doc.save(`estado_cliente_${client?.id || client?.nombre || 'cliente'}.pdf`)
}

export const exportFiadosPDF = exportFiadosStatement
