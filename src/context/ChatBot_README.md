# ChatBot Integration README

Este archivo describe la integración y uso del asistente `LauraAssistant`.

> Nota: El antiguo `ChatBotProvider` y los componentes `BusinessChatBot` / `LauraChatBot` fueron retirados. La integración recomendada ahora usa `LauraAssistant`, un componente ligero que se conecta directamente al `StoreContext`.

## Persistencia del historial
Por defecto el nuevo `LauraAssistant` guarda el historial por sesión en `sessionStorage` bajo la clave `laura_history`.
- Esto hace que el historial se mantenga mientras dure la sesión del navegador, y se borre al cerrar la pestaña/ventana.
- Si preferís persistencia entre sesiones, podés modificar el componente para usar `localStorage` en vez de `sessionStorage`.

## Cómo integrar `LauraAssistant`
1. Importá y renderizá `LauraAssistant` en `App.jsx` (o donde prefieras):

```jsx
import LauraAssistant from './components/LauraAssistant'

function Root({ usuario }) {
  return (
    <StoreProvider>
      <App />
      {usuario && <LauraAssistant usuario={usuario} />}
    </StoreProvider>
  )
}
```

2. Control de acceso: el componente debe mostrarse solo a usuarios autenticados según tu lógica (ej. `usuario` presente o rol).

## Dónde conectar tus endpoints
En `ChatBotContext.jsx` hay funciones de ejemplo:
- `getSales(filter)` — obtiene ventas. Reemplaza su implementación para realizar llamadas a tu API si necesitas datos en tiempo real o más robustos.
- `getProducts()` — devuelve productos.
- `getClients()` — devuelve clientes (fiados).
- `processQuery(text)` — lógica que procesa la consulta. Aquí puedes:
  - Llamar a un endpoint backend que use un LLM (por ejemplo `/api/llm`) y devolver la respuesta.
  - Validar permisos en el backend antes de incluir datos sensibles.

Ejemplo de reemplazo sencillo dentro de `processQuery`:
```js
// Ejemplo (simplificado)
const resp = await fetch('/api/llm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: text, context: { salesSummary: await getSalesSummary() } })
})
const data = await resp.json()
return { text: data.answer, meta: data.meta }
```

## Generar mensajes para WhatsApp
- Usa `generateWhatsAppMessage({ client, product, reason })` para crear el texto.
- Usa `generateWhatsAppLink(phone, message)` para obtener la URL con `wa.me` codificada.
- El componente solo abre este enlace si el dueño pulsa el botón — no se envía nada automáticamente.

## Seguridad
- El ChatBot puede acceder a datos internos; por eso:
  - Solo debe estar disponible para usuarios autenticados como dueño.
  - No muestres datos sensibles automáticamente. Requiere confirmación explícita del dueño.
  - Si integras un LLM: realiza la consulta desde el backend para que puedas controlar y filtrar lo que se revela, y para ocultar claves de API.
  - Valida los roles en el backend antes de devolver datos confidenciales.

## Personalización
- Algoritmos de recomendación actuales son heurísticos y simples (co-ocurrencia y frecuencia). Reemplázalos por modelos mejores o por endpoints que calculen métricas más precisas.
- Puedes cambiar la clave `business_chat_history` pasando `sessionKey` al `ChatBotProvider`.

## Pruebas rápidas
1. Levanta la app en desarrollo:

```bash
cd "c:/Users/ybarr/Nueva carpeta/vite-project"
npm run dev
```

2. Abre `http://localhost:5177`, ve a la página `Reportes` y abre el chat (botón flotante). Prueba comandos:
- `stock bajo`
- `recomendar cliente <id>`
- `sugerir combos`


Si quieres, puedo ayudarte a conectar `processQuery` a un endpoint LLM o a tus endpoints existentes; pásame las URLs y el formato esperado y lo implemento.
