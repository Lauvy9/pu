/**
 * LAURA Minimal Query Test Suite
 * 
 * Ejecuta estos tests escribiendo directamente en el chat
 * para verificar que el sistema interpreta queries mínimos correctamente
 * 
 * Test Category: PALABRA CLAVE SIMPLE (1 palabra)
 */

const TEST_CASES = [
  {
    category: "PALABRA CLAVE - STOCK",
    tests: [
      {
        input: "stock",
        expectedCategory: "STOCK",
        expectedResponse: "📦 Stock - ¿Qué querés saber?",
        description: "Usuario pide ver stock"
      },
      {
        input: "bajo",
        expectedCategory: "STOCK_LOW",
        expectedResponse: "🟡 Stock Bajo - Lista de productos con stock crítico",
        description: "Usuario pregunta por stock bajo"
      },
      {
        input: "reponer",
        expectedCategory: "STOCK",
        expectedResponse: "Debería ofrecer opciones de reposición",
        description: "Usuario sugiere reponer"
      },
      {
        input: "inventario",
        expectedCategory: "STOCK",
        expectedResponse: "📦 Stock - Mostrar inventario",
        description: "Alias para stock"
      }
    ]
  },
  {
    category: "PALABRA CLAVE - VENTAS",
    tests: [
      {
        input: "ventas",
        expectedCategory: "SALES",
        expectedResponse: "💰 Ventas - ¿Qué querés revisar?",
        description: "Usuario pregunta por ventas"
      },
      {
        input: "vendí",
        expectedCategory: "SALES",
        expectedResponse: "Mostrar opciones de ventas",
        description: "Usuario usa primera persona"
      },
      {
        input: "facturación",
        expectedCategory: "SALES",
        expectedResponse: "💰 Ventas - Movimiento financiero",
        description: "Usuario pregunta facturación"
      }
    ]
  },
  {
    category: "PALABRA CLAVE - FIADOS",
    tests: [
      {
        input: "fiado",
        expectedCategory: "FIADOS",
        expectedResponse: "💳 Fiados y Deudas - ¿Qué necesitás?",
        description: "Usuario pregunta por fiados"
      },
      {
        input: "deuda",
        expectedCategory: "FIADOS",
        expectedResponse: "Mostrar deudas y créditos",
        description: "Usuario menciona deudas"
      },
      {
        input: "debe",
        expectedCategory: "FIADOS",
        expectedResponse: "💳 Análisis de créditos",
        description: "Usuario pregunta quién debe"
      }
    ]
  },
  {
    category: "PALABRA CLAVE - CLIENTES",
    tests: [
      {
        input: "clientes",
        expectedCategory: "CLIENTS",
        expectedResponse: "👥 Clientes - ¿Querés listar todos o buscar uno?",
        description: "Usuario pide ver clientes"
      },
      {
        input: "cliente",
        expectedCategory: "CLIENTS",
        expectedResponse: "Mostrar opciones de clientes",
        description: "Singular: cliente"
      }
    ]
  },
  {
    category: "PALABRA CLAVE - PRODUCTOS",
    tests: [
      {
        input: "productos",
        expectedCategory: "PRODUCTS",
        expectedResponse: "🏷️ Productos - Mostrar catálogo",
        description: "Usuario pide ver productos"
      },
      {
        input: "producto",
        expectedCategory: "PRODUCTS",
        expectedResponse: "🏷️ Productos - ¿Querés listar o buscar?",
        description: "Singular: producto"
      }
    ]
  },
  {
    category: "ENTIDAD - CLIENTE",
    tests: [
      {
        input: "mario",
        expectedCategory: "ENTITY",
        expectedEntityType: "client",
        expectedResponse: "👤 Cliente: Mario - ¿Qué querés saber?",
        description: "Nombre de cliente existente",
        requirements: "Debe existir cliente llamado 'Mario' o similar en fiados"
      },
      {
        input: "ana",
        expectedCategory: "ENTITY",
        expectedEntityType: "client",
        expectedResponse: "👤 Cliente: Ana - Opciones de deuda/compras",
        description: "Nombre de cliente femenino",
        requirements: "Debe existir cliente llamado 'Ana' en fiados"
      },
      {
        input: "juan",
        expectedCategory: "ENTITY",
        expectedEntityType: "client",
        expectedResponse: "👤 Cliente: Juan - Mostrar historial",
        description: "Nombre de cliente masculino",
        requirements: "Debe existir cliente llamado 'Juan' en fiados"
      }
    ]
  },
  {
    category: "ENTIDAD - PRODUCTO",
    tests: [
      {
        input: "cuaderno",
        expectedCategory: "ENTITY",
        expectedEntityType: "product",
        expectedResponse: "🏷️ Producto: Cuaderno - ¿Qué querés saber?",
        description: "Nombre de producto existente",
        requirements: "Debe existir producto 'Cuaderno' en inventario"
      },
      {
        input: "vidrio",
        expectedCategory: "ENTITY",
        expectedEntityType: "product",
        expectedResponse: "🏷️ Producto: Vidrio - Mostrar opciones",
        description: "Nombre de producto",
        requirements: "Debe existir producto con 'vidrio' en el nombre"
      }
    ]
  },
  {
    category: "AMBIGÜEDAD - MÚLTIPLES CANDIDATOS",
    tests: [
      {
        input: "ana",
        expectedCategory: "ENTITY_AMBIGUOUS",
        expectedResponse: "🤔 Encontré varias opciones. ¿Cuál era?",
        description: "Múltiples clientes con similar nombre",
        requirements: "Deben existir múltiples clientes con 'Ana' en el nombre"
      }
    ]
  },
  {
    category: "FALLBACK INTELIGENTE",
    tests: [
      {
        input: "xyzabc",
        expectedCategory: "UNKNOWN",
        expectedResponse: "🤔 No estoy 100% segura de lo que buscás",
        description: "Query incomprensible"
      },
      {
        input: "asdfgh",
        expectedCategory: "UNKNOWN",
        expectedResponse: "Podés consultarme sobre: Stock, Ventas, Fiados, Clientes...",
        description: "Input sin sentido - fallback con opciones"
      }
    ]
  }
]

/**
 * INSTRUCCIONES PARA TESTING MANUAL
 * 
 * 1. Abre la aplicación
 * 2. Inicia sesión en el negocio (asegúrate de tener datos en:
 *    - Sales (ventas realizadas)
 *    - Products (productos en catálogo)
 *    - Fiados (clientes con deudas)
 * 
 * 3. Abre el chat de LAURA (botón 🤖 abajo a la derecha)
 * 
 * 4. Escribe cada input de prueba y verifica la respuesta:
 */

const MANUAL_TEST_SCRIPT = `
📋 TEST SCRIPT - Copia y pega cada línea en el chat

=== PASO 1: PALABRAS CLAVE SIMPLES ===
stock
ventas
fiado
bajo
clientes
productos
reponer
deuda

=== PASO 2: NOMBRES DE CLIENTE (ajusta a tus clientes) ===
mario
ana
juan

=== PASO 3: NOMBRES DE PRODUCTO (ajusta a tus productos) ===
cuaderno
vidrio

=== PASO 4: VARIACIONES ===
inventario
facturación
vendí

=== PASO 5: FALLBACK ===
xyzabc
asdfgh

=== PASO 6: QUERIES COMPLETOS (comparación) ===
¿Qué vendimos hoy?
¿Quién debe?
¿Stock bajo?
Dame deudas de mario
¿Cuál es el precio del cuaderno?
`

/**
 * CRITERIOS DE ÉXITO
 * 
 * ✅ El sistema debe:
 * 
 * 1. Reconocer palabras clave simples (1 palabra)
 *    - Input: "stock" → Output: Opciones de stock (no error)
 * 
 * 2. Reconocer nombres de clientes
 *    - Input: "mario" → Output: Opciones para cliente Mario
 *    - Fuzzy matching: reconocer "mario", "MARIO", "Mario"
 * 
 * 3. Reconocer nombres de productos
 *    - Input: "cuaderno" → Output: Opciones para producto Cuaderno
 * 
 * 4. Manejar ambigüedades
 *    - Si hay múltiples coincidencias → Listar candidatos
 *    - Usuario puede seleccionar número o escribir nombre exacto
 * 
 * 5. Fallback inteligente
 *    - Input incomprensible → Mostrar opciones principales
 *    - No debe decir "no entiendo", debe ofrecer alternativas
 * 
 * 6. Logging correcto
 *    - Cada query registra: minimalQuery: true, minimalAnalysis: {...}
 *    - Ver en: DevTools → Storage → LocalStorage → laura_memory
 * 
 * 7. Contexto persistente
 *    - Si usuario dice "mario" → bot recuerda "cliente Mario"
 *    - Próximo query puede usar "su deuda", "él debe"
 */

/**
 * DEBUGGING
 * 
 * Si algo no funciona:
 * 
 * 1. Abre DevTools (F12)
 * 2. Ir a Console
 * 3. Ejecuta:
 *    
 *    // Ver última conversación
 *    JSON.parse(localStorage.getItem('laura_memory')).sessionLog.slice(-5)
 *    
 *    // Ver análisis mínimo del último query
 *    JSON.parse(localStorage.getItem('laura_memory')).sessionLog.slice(-1)[0]
 * 
 * 4. Busca el campo "minimalAnalysis" en la salida
 *    - Debe tener: category, entity, entityType, candidates
 */

/**
 * CASOS EDGE
 * 
 * Estos casos pueden no funcionar correctamente (limitations conocidas):
 * 
 * 1. Nombres con tildes: "María" vs "maria" → Funcionará (fuzzy)
 * 2. Nombres parciales: "mar" para "Mario" → Funcionará si solo hay 1 coincidencia
 * 3. Nombres muy similares: "Ana" y "Anabel" → Ambiguo, mostrará candidatos
 * 4. Productos sin nombre claro → Fallback a opciones
 * 5. Queries con emojis: "📦" → Será ignorado, funciona con palabras
 */

export const TEST_INSTRUCTIONS = `
🧪 LAURA MINIMAL QUERY - TEST GUIDE

${MANUAL_TEST_SCRIPT}

Archivos involucrados:
- entityDetector.js (detección de entidades y palabras clave)
- proactiveResponseGenerator.js (generación de respuestas con opciones)
- lauraEngine.js (orquestación y logging)

Documentación: LAURA_MINIMAL_QUERIES.md
`

console.log(TEST_INSTRUCTIONS)
export default TEST_CASES
