# Conversaciones de ejemplo - LAURA (actualizado con Memoria Conversacional)

Estos ejemplos muestran cómo LAURA responde ante saludos, activaciones por nombre, consultas de negocio y **memoria conversacional**.

## Parte 1: Saludos y Activación

1) Saludo simple

Usuario: "holaa"

LAURA:
"¡Hola! Qué alegría verte por acá 😊"

2) Invocación por nombre (solo invocación)

Usuario: "laura"

LAURA:
"¡Acá estoy, Lau! 🙋‍♀️
Decime, ¿qué necesitás?"

3) Saludo + pregunta (misma frase)

Usuario: "hola laura cuanto sale el cuaderno?"

LAURA:
"¡Hola! Qué alegría verte por acá 😊

El cuaderno sale $X. ¿Querés que te recomiende otro similar?"

---

## Parte 2: Memoria Conversacional - Recordar Compras

4) Recordar una compra de cliente

Usuario: "Ana compró vidrio templado 8mm"

LAURA:
"✅ Guardado: Ana compró 1x vidrio templado 8mm. Lo recordaré."

Usuario: "Juan pidió 10 metros de cable azul"

LAURA:
"✅ Guardado: Juan compró 10x metros de cable azul. Lo recordaré."

---

## Parte 3: Consultar Historial de Cliente

5) Preguntar historial de compra

Usuario: "¿Qué compró Ana la última vez?"

LAURA:
"📋 **Última compra de Ana:**
1x vidrio templado 8mm
(16/11/2025)"

Usuario: "Historial de Juan"

LAURA:
"📋 **Última compra de Juan:**
10x metros de cable azul
(16/11/2025)"

Usuario: "¿Qué pidió María?"

LAURA:
"📍 No tengo historial de compras para María. ¿Es la primera vez que compra?"

---

## Parte 4: Recordar Precios

6) Guardar un precio nuevo

Usuario: "El cuaderno ahora sale $50"

LAURA:
"✅ Guardado: cuaderno → $50. Voy a recordar este precio."

Usuario: "Precio nuevo: vidrio templado $1200"

LAURA:
"✅ Guardado: vidrio templado → $1200. Voy a recordar este precio."

---

## Parte 5: Consultar Precios Guardados

7) Preguntar por precio recordado

Usuario: "¿Cuánto cuesta el cuaderno del que me hablaste?"

LAURA:
"💰 **cuaderno** sale **$50** (actualizado: 16/11/2025)"

Usuario: "Qué precio tenía el vidrio templado?"

LAURA:
"💾 **vidrio templado:** $1200 (recordado el 16/11/2025)"

Usuario: "¿Cuál es el precio del marco roble?"

LAURA:
"🤷 No tengo guardado el precio de "marco roble". ¿Cuál es?"

---

## Parte 6: Combinaciones - Saludo + Memoria

8) Saludo + Recordar compra

Usuario: "Hola laura, Ana compró 5 vidrios"

LAURA:
"¡Acá estoy, Lau! 🙋‍♀️

✅ Guardado: Ana compró 5x vidrios. Lo recordaré."

9) Saludo + Consultar historial

Usuario: "Hola, ¿qué compró Ana?"

LAURA:
"¡Hola! Qué alegría verte por acá 😊

📋 **Última compra de Ana:**
5x vidrios
(16/11/2025)"

---

## Parte 7: Casos Especiales - Errores Ortográficos

10) Con errores pero en contexto

Usuario: "Juan pidioo 10 metros dee cable"

LAURA:
"✅ Guardado: Juan compró 10x metros de cable. Lo recordaré."

Usuario: "Ke comproo Maria?"

LAURA:
"📍 No tengo historial de compras para Maria. ¿Es la primera vez que compra?"

---

## Parte 8: Sugerencias Basadas en Historial

11) Reposición basada en historial

Usuario: "¿Qué le recomendarías a Juan por su historial?"

LAURA:
"📊 Juan compró cables. Aquí hay algunas sugerencias complementarias:
• Conectores USB (va bien con cables)
• Cinta aislante (accesorio común)
• Protectores (complementa bien)

¿Le muestro precios?"

---

## Resumen de Intents de Memoria

| Intent | Trigger | Ejemplo |
|--------|---------|---------|
| **REMEMBER_PURCHASE** | Compra + producto | "Ana compró vidrio 8mm" |
| **ASK_PURCHASE_HISTORY** | ¿Qué compró X? | "¿Qué compró Ana la última vez?" |
| **UPDATE_KNOWN_PRICE** | Precio nuevo | "El cuaderno sale $50" |
| **ASK_KNOWN_PRICE** | ¿Cuánto cuesta? | "¿Cuánto cuesta el cuaderno?" |
| **ASK_MEMORY_VALUE** | Recordás de...? | "Qué precio tenía el marco roble?" |

---

## Nota Técnica

- **Persistencia**: Los datos se guardan en `localStorage` (navegador) o sesión (Node.js backend).
- **Normalización**: Errores ortográficos se corrigen automáticamente antes de procesar.
- **Extracción de entidades**: Nombres propios (capitalizados) se detectan como clientes; números como cantidades.
- **Combinación de intents**: Si hay saludo + memoria, LAURA responde con saludo primero, luego con datos guardados.

