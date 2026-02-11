// Helpers para generar mensajes y enlaces de WhatsApp

export function generateWhatsAppMessage({ client = {}, product = {}, reason = '' } = {}) {
  const name = client?.nombre || client?.name || 'Cliente'
  const prodName = product?.name || product?.titulo || product?.id || 'este producto'
  const greeting = `Hola ${name}!`
  const body = `Te recomiendo ${prodName}. ${reason || 'Creo que te puede interesar según tus compras anteriores.'}`
  const closing = `Si quieres, responde y lo reservo para ti.`
  return `${greeting}\n${body}\n${closing}`
}

export function generateWhatsAppLink(phoneNumber = '', message = '') {
  const cleaned = (phoneNumber || '').replace(/\D/g, '')
  const encoded = encodeURIComponent(message || '')
  return `https://wa.me/${cleaned}?text=${encoded}`
}
