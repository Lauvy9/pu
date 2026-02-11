/**
 * businessResponseGenerator.js
 * Genera respuestas para queries de negocio: stock, fiados, ventas, análisis, estrategias.
 */

import * as analyzer from './businessAnalyzer'

/**
 * Respuesta para consulta de stock bajo
 */
export function generateStockAnalysisResponse(products = []) {
  const analysis = analyzer.analyzeStock(products, 5)

  if (analysis.critical.length === 0 && analysis.low.length === 0) {
    return '✅ **Stock perfecto.** Todos los productos tienen buen nivel. Nada que reposicionar por ahora.'
  }

  let response = '📦 **Análisis de Stock:**\n'

  if (analysis.critical.length > 0) {
    response += `🚨 **SIN STOCK (${analysis.critical.length}):**\n`
    analysis.critical.slice(0, 3).forEach(p => {
      response += `  • ${p.name}\n`
    })
    response += '\n'
  }

  if (analysis.low.length > 0) {
    response += `⚠️ **STOCK BAJO (${analysis.low.length}):**\n`
    analysis.low.slice(0, 5).forEach(p => {
      response += `  • ${p.name} (${p.stock} unidades)\n`
    })
  }

  response += '\n💡 **Recomendación:** Realiza reposición inmediata de los críticos.'

  return response
}

/**
 * Respuesta para consulta sobre producto específico
 */
export function generateProductInfoResponse(productName = '', products = []) {
  const product = analyzer.findProduct(productName, products)

  if (!product) {
    return `🔍 No encontré "${productName}" en el inventario. ¿Usaste otro nombre?`
  }

  const stock = product.stock || 0
  const price = product.price || product.precio || 'No especificado'
  const stockStatus = stock === 0 ? '🔴 SIN STOCK' : stock <= 5 ? '🟡 BAJO' : '🟢 OK'

  return `📋 **${product.name || product.titulo}**\n\n` +
    `Precio: $${price}\n` +
    `Stock: ${stock} unidades (${stockStatus})\n` +
    `Categoría: ${product.category || product.categoria || 'Sin categoría'}\n\n` +
    (stock === 0 ? '⏳ Este producto necesita reposición urgente.' :
      stock <= 5 ? '⚠️ Stock bajo, considera reponer pronto.' :
        '✅ Disponible con buen stock.')
}

/**
 * Respuesta para consulta de fiados
 */
export function generateFiadosAnalysisResponse(fiados = []) {
  const analysis = analyzer.analyzeFiados(fiados)

  if (analysis.totalFiados === 0) {
    return '💚 **Excelente.** Sin deudas pendientes. ¡Cobranzas al día!'
  }

  let response = `💳 **Análisis de Fiados:**\n\n`

  response += `Total adeudado: **$${analysis.totalFiados}**\n`
  response += `Clientes en deuda: ${analysis.analysis.clientesEnDeuda}\n`
  response += `Deuda promedio: $${analysis.analysis.deudaPromedio}\n`
  response += `Riesgo: **${analysis.analysis.riesgo}**\n\n`

  if (analysis.analysis.mayorDeudor) {
    const [clientName, clientData] = analysis.analysis.mayorDeudor
    response += `📌 **Mayor deudor:**\n  ${clientName}: $${clientData.monto}\n\n`
  }

  response += `⚠️ **Acción recomendada:** ` +
    (analysis.totalFiados > 50000
      ? 'Contacta urgente con deudores. Riesgo alto.'
      : analysis.totalFiados > 20000
        ? 'Realiza seguimiento de cobro esta semana.'
        : 'Monitoreá la situación.')

  return response
}

/**
 * Respuesta para consulta específica de deuda de cliente
 */
export function generateClientDebtResponse(clientName = '', fiados = []) {
  const normalized = clientName.toLowerCase().trim()

  const client = fiados.find(f => {
    const name = (f.nombre || f.name || '').toLowerCase()
    return name.includes(normalized)
  })

  if (!client) {
    return `🔍 No encontré a "${clientName}" en fiados, o no tiene deuda.`
  }

  const deuda = Number(client.monto || client.deuda || 0)

  if (deuda === 0) {
    return `✅ ${client.nombre || clientName} está al día. Sin deuda pendiente.`
  }

  return `💰 **${client.nombre || clientName}** debe: **$${deuda}**\n\n` +
    `📅 Última fecha: ${client.fecha || 'No especificada'}\n\n` +
    `Considera contactarlo para acordar pago.`
}

/**
 * Respuesta para consulta de ventas del día
 */
export function generateSalesReportResponse(sales = []) {
  const today = analyzer.analyzeSales(sales, 'today')

  if (today.count === 0) {
    return '📊 **Hoy sin ventas aún.**\n\nEspera o intenta promocionar algo para activar el día. 💪'
  }

  let response = `📊 **Ventas de Hoy:**\n\n`

  response += `Cantidad: ${today.count} ventas\n`
  response += `Ingresos: **$${today.total}**\n`
  response += `Promedio por venta: $${today.average}\n`
  response += `Items vendidos: ${today.items}\n\n`

  if (today.topProducts.length > 0) {
    response += `🏆 **Más vendidos:**\n`
    today.topProducts.slice(0, 3).forEach((p, i) => {
      response += `  ${i + 1}. ${p.name} (${p.qty} unidades)\n`
    })
  }

  response += '\n✅ Buen desempeño. Seguí así.'

  return response
}

/**
 * Respuesta para consulta de ganancia/profit
 */
export function generateProfitAnalysisResponse(sales = [], expenses = []) {
  const profit = analyzer.calculateProfit(sales, expenses)

  let response = `💹 **Análisis Financiero:**\n\n`

  response += `Ingresos: $${profit.revenue}\n`
  response += `Gastos: $${profit.expenses}\n`
  response += `Ganancia: **$${profit.profit}** (${profit.margin})\n`
  response += `Estado: ${profit.status}\n\n`

  if (Number(profit.profit) < 0) {
    response += `⚠️ Estás en pérdida. Revisa gastos o aumenta ventas.`
  } else if (Number(profit.margin) < 20) {
    response += `📌 Margen bajo. Considera optimizar costos.`
  } else {
    response += `✅ Rentabilidad saludable.`
  }

  return response
}

/**
 * Respuesta con sugerencias estratégicas
 */
export function generateStrategySuggestionsResponse(params = {}) {
  const suggestions = analyzer.generateStrategies(params)

  if (suggestions.length === 0) {
    return '🎯 Todo en orden. Negocio operando normalmente.'
  }

  let response = `🎯 **Sugerencias Estratégicas:**\n\n`

  suggestions.forEach((sug, i) => {
    response += `${sug.emoji} [${sug.priority}] ${sug.text}\n`
    if (i < suggestions.length - 1) response += '\n'
  })

  return response
}

/**
 * Respuesta para detección de patrones
 */
export function generatePatternInsightsResponse(sales = [], products = []) {
  const patterns = analyzer.detectPatterns(sales, products)

  let response = `📈 **Análisis de Patrones:**\n\n`

  if (patterns.insights.length === 0) {
    response += 'No hay patrones significativos aún.\n'
  } else {
    patterns.insights.forEach((insight, i) => {
      response += `**${insight.type}:** ${insight.message}\n`
      if (insight.products && insight.products.length > 0) {
        response += `  Productos: ${insight.products.join(', ')}\n`
      }
      if (i < patterns.insights.length - 1) response += '\n'
    })

    response += '\n💡 **Recomendaciones:**\n'
    patterns.recommendations.forEach(rec => {
      response += `• [${rec.action}] ${rec.message}\n`
    })
  }

  return response
}

/**
 * Respuesta genérica para ayuda/capacidades
 */
export function generateHelpResponse() {
  return `**¿Qué puedo hacer?**

📊 **Ventas & Ganancias:**
  • "¿Qué se vendió hoy?"
  • "Dame el resumen de hoy"
  • "¿Cuál es la ganancia?"

📦 **Stock & Inventario:**
  • "¿Cuál es el stock más bajo?"
  • "¿Qué tengo que reponer?"
  • "Stock del [producto]"

💳 **Fiados & Cobranza:**
  • "¿Quién debe fiado?"
  • "¿Cuánto debe [cliente]?"
  • "Análisis de deudas"

🎯 **Análisis & Estrategia:**
  • "Dame sugerencias"
  • "Patrones de venta"
  • "Top productos"

💬 **Conversa naturalmente:** Puedo entender preguntas informales y recordar lo que dijimos. ¡Prueba!`
}

/**
 * Detalle de cliente o lista de clientes
 */
export function generateClientDetailsResponse(clients = [], clientName = null) {
  if (!clients || clients.length === 0) {
    return "📝 **Clientes**\n\nNo hay clientes registrados todavía.";
  }

  if (clientName) {
    const client = clients.find(c =>
      (c.nombre && c.nombre.toLowerCase().includes(clientName.toLowerCase())) ||
      (c.name && c.name.toLowerCase().includes(clientName.toLowerCase()))
    );

    if (client) {
      return `👤 **Cliente: ${client.nombre || client.name}**\n\n` +
             `📞 Teléfono: ${client.telefono || 'No registrado'}\n` +
             `💳 Deuda: $${client.deuda || client.monto || 0}\n` +
             `📅 Última compra: ${client.ultimaCompra || client.lastPurchase || 'No registrada'}\n` +
             `🛒 Total comprado: $${client.totalCompras || client.total || 0}`;
    }

    return `❌ No encontré al cliente "${clientName}"\n\n` +
           `Clientes disponibles: ${clients.map(c => c.nombre || c.name).join(', ')}`;
  }

  let response = `👥 **Clientes registrados: ${clients.length}**\n\n`;
  clients.forEach((client, index) => {
    response += `${index + 1}. **${client.nombre || client.name}**\n`;
    if (client.deuda && client.deuda > 0) {
      response += `   💰 Debe: $${client.deuda}\n`;
    }
    if (client.telefono) {
      response += `   📞 ${client.telefono}\n`;
    }
    response += '\n';
  });

  return response;
}

/**
 * Lista de fiados (clientes con deuda)
 */
export function generateFiadosResponse(clients = []) {
  const fiados = (clients || []).filter(c => (Number(c.deuda || c.monto || 0) || 0) > 0);
  if (!fiados || fiados.length === 0) {
    return "✅ **Situación de fiados**\n\nNo hay deudas pendientes. ¡Excelente!";
  }

  let response = `💳 **Fiados activos: ${fiados.length} clientes**\n\n`;
  let totalDeuda = 0;
  fiados.forEach((cliente, index) => {
    const deuda = Number(cliente.deuda || cliente.monto || 0) || 0;
    response += `${index + 1}. **${cliente.nombre || cliente.name}**\n`;
    response += `   💰 Debe: $${deuda}\n`;
    if (cliente.telefono) response += `   📞 ${cliente.telefono}\n`;
    if (cliente.ultimaCompra) response += `   📅 Última compra: ${cliente.ultimaCompra}\n`;
    response += '\n';
    totalDeuda += deuda;
  });

  response += `**Total adeudado: $${totalDeuda}**\n\n`;
  response += "💡 _Recordá contactar a estos clientes para coordinar el pago._";
  return response;
}

/**
 * Respuesta de ventas por período
 */
export function generateSalesPeriodResponse(analysis = {}, period = 'day') {
  if (!analysis || !analysis.filteredSales) {
    return `📊 No hay ventas para el período solicitado (${period}).`;
  }

  let response = `📊 **Ventas ${analysis.period || period}:**\n\n`;
  response += `Ventas registradas: ${analysis.salesCount}\n`;
  response += `Ingresos: $${analysis.totalRevenue || analysis.total || 0}\n`;
  response += `Items vendidos: ${analysis.totalItems || analysis.totalItems || 0}\n`;
  response += `Promedio por venta: $${analysis.averageSale || analysis.average || 0}\n\n`;

  if (analysis.topProducts && analysis.topProducts.length > 0) {
    response += `🏆 **Top productos:**\n`;
    analysis.topProducts.slice(0, 3).forEach(([id, qty], i) => {
      response += `  ${i + 1}. ${id} — ${qty} unidades\n`;
    });
  }

  return response;
}

/**
 * Lista breve de clientes registrados
 */
export function generateClientListResponse(clients = []) {
  if (!clients || clients.length === 0) {
    return '📝 No hay clientes registrados todavía.';
  }

  const count = clients.length;
  const names = clients.slice(0, 20).map(c => c.nombre || c.name || 'Sin nombre');
  let response = `👥 **Clientes registrados: ${count}**\n\n`;
  response += names.map((n, i) => `${i + 1}. ${n}`).join('\n');
  if (count > 20) response += `\n\n...y ${count - 20} más.`;
  return response;
}

/**
 * Lista de fiados (clientes con deuda) - formato corto
 */
export function generateFiadosListResponse(clients = []) {
  const fiados = (clients || []).filter(c => (Number(c.deuda || c.monto || 0) || 0) > 0);
  if (!fiados || fiados.length === 0) {
    return '✅ No hay fiados activos. Ningún cliente debe dinero.';
  }

  let response = `💳 **Fiados activos: ${fiados.length}**\n\n`;
  let total = 0;
  fiados.slice(0, 30).forEach((c, i) => {
    const deuda = Number(c.deuda || c.monto || 0) || 0;
    response += `${i + 1}. **${c.nombre || c.name}** — $${deuda}\n`;
    total += deuda;
  });
  response += `\n**Total adeudado: $${total}**`;
  if (fiados.length > 30) response += `\n...y ${fiados.length - 30} más.`;
  return response;
}

/**
 * Clientes que compraron hoy (basado en ventas)
 */
export function generateTodayClientsResponse(sales = [], clients = []) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const todaySales = (sales || []).filter(s => (s.date || s.fecha || '').slice(0, 10) === todayISO);

  if (!todaySales || todaySales.length === 0) {
    return '📅 Hoy no se registraron ventas.';
  }

  const clientSet = new Map();
  todaySales.forEach(s => {
    const clientName = s.clientName || s.cliente || s.customer || s.customerName || s.client || s.buyer;
    if (clientName) {
      const key = String(clientName).trim();
      if (key) clientSet.set(key, (clientSet.get(key) || 0) + 1);
    } else if (s.clientId) {
      // try to resolve via clients list
      const cl = (clients || []).find(c => c.id == s.clientId || c.clientId == s.clientId);
      if (cl) clientSet.set(cl.nombre || cl.name || `Cliente ${cl.id}`, (clientSet.get(cl.nombre || cl.name || `Cliente ${cl.id}`) || 0) + 1);
    }
  });

  const entries = Array.from(clientSet.entries());
  let response = `📅 **Clientes que compraron hoy: ${entries.length}**\n\n`;
  entries.forEach(([name, count], i) => {
    response += `${i + 1}. **${name}** — ${count} compra(s)\n`;
  });

  return response;
}

/**
 * Detalle de un fiado específico (cliente con deuda)
 */
export function generateFiadoDetailsResponse(clientName = '', fiados = []) {
  const normalized = (clientName || '').toLowerCase().trim();
  const client = (fiados || []).find(f => (f.nombre || f.name || '').toLowerCase().includes(normalized));

  if (!client) {
    return `🔍 No encontré fiados para "${clientName}".`;
  }

  const deuda = Number(client.monto || client.deuda || client.total || 0) || 0;
  let response = `💳 **Detalle de fiado: ${client.nombre || client.name}**\n\n`;
  response += `Total adeudado: $${deuda}\n`;
  response += `Última compra: ${client.fecha || client.lastDate || 'No registrada'}\n`;
  if (client.items && client.items.length > 0) {
    response += `Productos: ${client.items.map(it => it.name || it.title || it.id).join(', ')}\n`;
  }
  if (client.telefono) response += `Contacto: ${client.telefono}\n`;

  response += `\n💡 Recomendación: Contactar y ofrecer plan de pago.`;
  return response;
}

export default {
  generateStockAnalysisResponse,
  generateProductInfoResponse,
  generateFiadosAnalysisResponse,
  generateClientDebtResponse,
  generateClientDetailsResponse,
  generateClientListResponse,
  generateFiadosResponse,
  generateFiadosListResponse,
  generateFiadoDetailsResponse,
  generateSalesPeriodResponse,
  generateSalesReportResponse,
  generateProfitAnalysisResponse,
  generateStrategySuggestionsResponse,
  generatePatternInsightsResponse,
  generateHelpResponse,
  generateTodayClientsResponse
}
