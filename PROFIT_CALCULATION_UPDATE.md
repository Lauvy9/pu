# Actualización de Lógica Financiera - Ganancias por Unidad de Negocio
**Fecha:** 15 de febrero de 2026

## Cambios Realizados

### Objetivo
Implementar el modelo correcto de cálculo de ganancias:
```
Ganancia Neta = (Ventas - Costo de Productos) - Gastos Operativos
```

### Archivos Modificados
- ✅ `src/utils/reportesAnalyticsHelpers.js` - Solo lógica financiera

### Nuevas Funciones Creadas

#### 1. `calculateProductCostByBusinessUnit(transactions, dateRange, unit)`
- **Propósito:** Calcula el costo total de productos vendidos por unidad
- **Lógica:** 
  - Filtra transacciones de venta para la unidad específica
  - Suma: cantidad × costo unitario del producto
  - Usa `productSnapshot.cost` del registro de venta

#### 2. `calculateSharedExpensesByUnit(transactions, dateRange, unit)` (interna)
- **Propósito:** Distribuye gastos compartidos entre unidades
- **Lógica:**
  - Identifica gastos con `businessUnit === 'compartido'` o `'ambos'`
  - Suma total de gastos compartidos
  - Divide entre 2 para distribución 50/50 a cada unidad

#### 3. `calculateUnitSpecificExpenses(transactions, dateRange, unit)` (interna)
- **Propósito:** Calcula gastos específicos de una unidad
- **Lógica:**
  - Filtra gastos con `businessUnit === unit` (no compartidos)
  - Suma montos específicos de esa unidad

### Funciones Modificadas

#### 1. `getNetProfitByBusinessUnit(transactions, dateRange, unit)`
**Antes:**
```javascript
ganancia = ventas - gastos
```

**Ahora:**
```javascript
const ventas = calculateSalesByBusinessUnit(...)
const productCost = calculateProductCostByBusinessUnit(...)
const unitSpecificExpenses = calculateUnitSpecificExpenses(...)
const sharedExpenses = calculateSharedExpensesByUnit(...)

const grossProfit = ventas - productCost
const netProfit = grossProfit - unitSpecificExpenses - sharedExpenses
```

#### 2. `getProfitByBusinessUnit(transactions, dateRange)`
**Antes:**
```javascript
return {
  name: 'Vidriería',
  ganancia: ventas - gastos,
  ventas: ventas,
  gastos: gastos
}
```

**Ahora:**
```javascript
return {
  name: 'Vidriería',
  ventas: ventas,
  costProductos: costProductos,
  margenBruto: ventas - costProductos,
  gastos: gastos,
  ganancia: (ventas - costProductos) - gastos,
  // Backward compatibility
  sales: ventas,
  expenses: gastos
}
```

#### 3. `getSalesVsExpensesByUnit(transactions, dateRange, unit)`
- Ahora calcula gastos totales incluyendo distribución de compartidos
- Usa las nuevas funciones de cálculo de gastos específicos + compartidos

### Modelo de Datos

#### Antes
```
{
  name: 'Vidriería',
  ventas: 1,600,000,
  gastos: 200,000,
  ganancia: 1,400,000  ❌ INCORRECTO (no resta costo producto)
}
```

#### Ahora
```
{
  name: 'Vidriería',
  ventas: 1,600,000,
  costProductos: 1,000,000,
  margenBruto: 600,000,
  gastos: 6,000,000,  // Incluye gastos específicos + proporción compartidos
  ganancia: -5,400,000,  ✅ CORRECTO
  // Backward compatibility
  sales: 1,600,000,
  expenses: 6,000,000
}
```

### Ejemplo de Cálculo

**Escenario:**
- Vidriería ventas: $1,600,000
- Vidriería costo productos: $1,000,000
- Vidriería gastos específicos: $200,000
- Gastos compartidos totales: $12,000,000 (se divide 50/50)

**Cálculo:**
```
Ventas = 1,600,000
Costo Productos = 1,000,000
Margen Bruto = 600,000
Gastos Específicos = 200,000
Gastos Compartidos = 6,000,000 (50% de 12,000,000)
Gastos Totales = 6,200,000
─────────────────────────────
Ganancia Neta = -5,600,000 ✅
```

### Distribución de Gastos Compartidos

**Antes:**
- Gastos compartidos se asignaban 100% a cada unidad (duplicados)

**Ahora:**
- Gastos con `businessUnit: 'compartido'` se dividen 50/50
- Gastos con `businessUnit: 'vidrieria'` o `'muebleria'` van 100% a esa unidad

**Ejemplo:**
```
Gasto 1: 12,000,000, businessUnit: 'compartido'
  → Vidriería recibe: 6,000,000
  → Mueblería recibe: 6,000,000

Gasto 2: 2,000,000, businessUnit: 'vidrieria'
  → Vidriería recibe: 2,000,000
  → Mueblería recibe: 0
```

### Cambios en UI

❌ **NO cambió:**
- ✅ Nombres de componentes
- ✅ Estilos CSS
- ✅ Estructura de layouts
- ✅ Componentes visuales
- ✅ Campos visibles en la UI

✅ **SÍ cambió:**
- Valores calculados de ganancias (ahora correctos)
- Gráfico "Ganancia por Unidad" usa nuevos campos
- Cálculos de margen bruto incluyen costo de productos

### Backward Compatibility

Funciones mantienen:
- ✅ Mismo nombre
- ✅ Mismos parámetros
- ✅ Campos `sales` y `expenses` para compatibility
- ✅ Nuevos campos: `ventas`, `costProductos`, `margenBruto`, `gastos`, `ganancia`

### Validación

Los cambios garantizan:
- ✅ Ganancia ≠ Ventas (resta costo de productos)
- ✅ Ganancia ≠ Ventas (resta gastos)
- ✅ Gastos compartidos distribuyen 50/50 entre unidades
- ✅ Costo se resta ANTES que los gastos
- ✅ Margen bruto es visible en data
- ✅ Sin cambios en estructura de componentes

### Prueba Esperada

Después del cambio, el gráfico "Ganancia por Unidad de Negocio" debe mostrar:
- **Barra azul (Ventas):** Ventas reales
- **Barra roja (Gastos):** Gastos totales (específicos + compartidos)
- **Barra verde (Ganancia):** Resultado = (Ventas - Costo) - Gastos

Si el resultado es negativo, se mostrará correctamente en rojo.

---
**Status:** ✅ COMPLETADO - Lógica financiera unificada sin cambios en UI.
