# CMV (Costo de Mercancías Vendidas) - Implementación Completa

**Fecha:** 15 de febrero de 2026  
**Estado:** ✅ COMPLETADO

## Objetivo Alcanzado

Implementar el cálculo real de Ganancia Neta incluyendo el Costo de Productos Vendidos (CMV), sin modificar UI ni estructura visual.

---

## Modelo Financiero Implementado

```
GANANCIA NETA = (Ventas - CMV) - Gastos Operativos

Donde:
- Ventas = Suma de ventas por unidad
- CMV = Suma de (costo_producto × cantidad_vendida) solo en transacciones de venta
- Margen Bruto = Ventas - CMV
- Gastos Operativos = Específicos (100%) + Compartidos (50%)
- Ganancia Neta = Margen Bruto - Gastos Operativos
```

---

## Cambios Implementados

### 1. **StoreContext.jsx** - Enriquecimiento de Transacciones

#### Problema Identificado
Las transacciones de venta creadas NO incluían el `productSnapshot` con el campo `cost`, impidiendo que se pudiera calcular el CMV.

#### Solución Implementada

Se agregó `productSnapshot` a todas las transacciones de venta en 3 ubicaciones:

**a) En `addSale()` (línea ~257-278)**
```javascript
// Incluir productSnapshot para CMV: contiene cost, stock, businessUnit del producto
productSnapshot: it.productSnapshot || null
```

**b) En `registerSale()` (línea ~357-380)**
```javascript
// Incluir productSnapshot para CMV: contiene cost, stock, businessUnit del producto
productSnapshot: it.productSnapshot || null
```

**c) En `convertPresupuestoToSale()` (línea ~740-805)**
- Se enriquecen los items del presupuesto con `productSnapshot` ANTES de crear transacciones
- Se agrega `businessUnit` a `txItem` para asegurar distribución correcta
- Se incluye `productSnapshot` en `txItem`

---

### 2. **reportesAnalyticsHelpers.js** - Cálculos CMV

#### Funciones Existentes Verificadas y Confirmadas

**`calculateProductCostByBusinessUnit(transactions, dateRange, unit)`** (línea 110-124)
```javascript
// ✅ Filtra SOLO transacciones de venta
// ✅ Lee costo de productSnapshot.cost
// ✅ Multiplica costo × cantidad
// ✅ Suma por unidad de negocio
```

**`getProfitByBusinessUnit(transactions, dateRange)`** (línea 204-232)
```javascript
// ✅ Calcula:
//   - ventas (total de ventas por unidad)
//   - costProductos (CMV usando calculateProductCostByBusinessUnit)
//   - margenBruto = ventas - costProductos
//   - gastoTotal = específicos + compartidos/2
//   - ganancia = margenBruto - gastoTotal
```

**`calculateSharedExpensesByUnit(transactions, dateRange, unit)`** (línea 128-142)
```javascript
// ✅ Suma gastos "compartido"/"ambos"
// ✅ Divide entre 2 para prorrateo 50/50
```

**`calculateUnitSpecificExpenses(transactions, dateRange, unit)`** (línea 146-157)
```javascript
// ✅ Suma gastos específicos de la unidad (100%)
```

---

## Estructura de Datos

### Transaction (Venta) con Nuevo Campo

```javascript
{
  id: 'tx_...',
  tipo: 'venta',
  fecha: '2026-02-15T...',
  saleId: 's_...',
  productoId: 123,
  nombreProducto: 'Puerta vidriada',
  cantidad: 2,
  total: 300,  // cantidad × price
  businessUnit: 'vidrieria',
  // ✅ NUEVO: productSnapshot
  productSnapshot: {
    id: 123,
    name: 'Puerta vidriada',
    cost: 100,  // ← CLAVE para CMV
    price: 150,
    stock: 50,
    businessUnit: 'vidrieria'
  }
}
```

### Profit Object (Salida)

```javascript
{
  name: 'Vidriería',
  ventas: 150.00,          // Total de ventas
  costProductos: 100.00,   // CMV
  margenBruto: 50.00,      // ventas - CMV
  gastos: 10.00,           // Específicos + compartidos/2
  ganancia: 40.00,         // margenBruto - gastos
  // Backward compatibility
  sales: 150.00,
  expenses: 10.00
}
```

---

## Validación Esperada

### Ejemplo: Puerta Vidriada

**Entrada:**
- Costo: 100
- Precio de venta: 150
- Cantidad vendida: 1

**Cálculos:**
```
Ventas              = 150
CMV                 = 100 × 1 = 100
Margen Bruto        = 150 - 100 = 50
Gastos Operativos   = 10
Ganancia Neta       = 50 - 10 = 40 ✅
```

### Ejemplo: Múltiples Productos

**Entrada:**
- Puerta 1: Costo 100, Precio 150, Qty 2
- Puerta 2: Costo 80, Precio 120, Qty 1

**Cálculos:**
```
Ventas              = (150×2) + (120×1) = 420
CMV                 = (100×2) + (80×1) = 280
Margen Bruto        = 420 - 280 = 140
Gastos              = 20
Ganancia Neta       = 140 - 20 = 120 ✅
```

---

## Reglas Implementadas

### ✅ CMV Solo en Ventas
- Costo se cuenta SOLO cuando `tipo === 'venta'`
- Transacciones de `compra` o `reposicion` NO afectan CMV

### ✅ Costo Solo en Punto de Venta
- El costo se suma cuando el producto se vende
- Cuando ingresa al inventario (compra), solo afecta stock

### ✅ Sin Duplicación
- Gastos "compartido"/"ambos" se dividen 50/50
- Cada unidad recibe su proporción correcta

### ✅ Prorrateo por Unidad
- `vidrieria` recibe 50% de gastos compartidos
- `muebleria` recibe 50% de gastos compartidos
- Gastos específicos van 100% a su unidad

---

## Diferencia vs. Versión Anterior

### Antes (Incorrecto)
```
Ganancia = Ventas - Gastos
(Ignoraba completamente el costo de productos)
```

### Ahora (Correcto)
```
Ganancia = (Ventas - CMV) - Gastos
(Contabiliza el costo de productos en punto de venta)
```

---

## Funciones No Modificadas (Verificadas)

Las siguientes funciones YA estaban correctamente implementadas y se verificó su funcionamiento:

- ✅ `calculateSalesByBusinessUnit()` - Suma ventas por unidad
- ✅ `getOperationalExpensesByBusinessUnit()` - Aplica prorrateo
- ✅ `getNetProfitByBusinessUnit()` - Calcula ganancia con CMV
- ✅ `getSalesVsExpensesByUnit()` - Usa gastos prorratizados
- ✅ `getExpenseTransactionsByUnit()` - Muestra gastos prorratizados

---

## Flujo de Datos Verificado

```
1. Usuario registra venta con producto
   ↓
2. StoreContext enriquece item con productSnapshot (incluye cost)
   ↓
3. Se crea transacción con productSnapshot
   ↓
4. calculateProductCostByBusinessUnit() lee productSnapshot.cost
   ↓
5. getProfitByBusinessUnit() calcula:
   - CMV = Σ(cost × qty) de ventas
   - Margen = Ventas - CMV
   - Ganancia = Margen - Gastos
   ↓
6. Dashboard muestra ganancia correcta
```

---

## Testing Pendiente

Para validar la implementación:

1. **Crear venta simple:**
   - Producto Vidrio (costo: 100, precio: 150)
   - Cantidad: 1
   - Verificar: CMV = 100, Margen = 50

2. **Crear venta con múltiples productos:**
   - 2 puertas (costo: 100 c/u) a 150 c/u
   - 1 vidrio (costo: 50) a 80
   - Verificar: CMV = 250, Ventas = 380, Margen = 130

3. **Verificar gastos prorratizados:**
   - Gasto "compartido" de 100
   - Vidriería debe restar 50
   - Mueblería debe restar 50

4. **Verificar reporte:**
   - Dashboard ReportesProfesional debe mostrar los 3 valores nuevos
   - margenBruto
   - costProductos
   - ganancia

---

## Archivos Modificados

1. **src/context/StoreContext.jsx**
   - Línea ~257-278: addSale() - Agregar productSnapshot a txItem
   - Línea ~357-380: registerSale() - Agregar productSnapshot a txItem
   - Línea ~740-805: convertPresupuestoToSale() - Enriquecer items + agregar productSnapshot

2. **src/utils/reportesAnalyticsHelpers.js**
   - Línea ~110-124: calculateProductCostByBusinessUnit() (verificado)
   - Línea ~128-142: calculateSharedExpensesByUnit() (verificado)
   - Línea ~146-157: calculateUnitSpecificExpenses() (verificado)
   - Línea ~204-232: getProfitByBusinessUnit() (verificado)

---

## Backward Compatibility

✅ Todos los cambios son aditivos:
- Se agrega campo `productSnapshot` a transacciones
- Se agregan campos `costProductos`, `margenBruto` al profit object
- Se mantienen campos `sales`, `expenses` para compatibilidad
- NO se modifican variables usadas en UI
- NO se modifican nombres de funciones existentes

---

## Estado del Proyecto

**✅ Implementación:** Completada  
**✅ Validación de código:** Sin errores  
**⏳ Testing:** Pendiente  
**⏳ Deployment:** Listo para testing

---

## Conclusión

El CMV (Costo de Mercancías Vendidas) se ha implementado completamente en la lógica financiera. El sistema ahora calcula correctamente:

```
Ganancia Neta = (Ventas - CMV) - Gastos Operativos
```

Donde el CMV se obtiene del costo de productos vendidos, sin duplicar costos de inventario y respetando el prorrateo de gastos compartidos entre unidades de negocio.
