# 📦 Flujo de Inventario y Movimientos Financieros

## Modelo Financiero Implementado

```
Ganancia Neta = (Ventas - CMV) - Gastos Operativos
```

## Transacciones y Su Impacto

### 1️⃣ COMPRA DE MERCADERÍA (Reposición de Inventario)

**Cuándo se registra:**
- Cuando se agrega un producto nuevo con stock inicial
- Cuando se aumenta el stock de un producto existente (actualización)

**Tipo de transacción:**
```javascript
{
  id: "tx_1708...",
  tipo: "compra_mercaderia",           // ← NO es gasto operativo
  fecha: "2026-02-15T10:30:00.000Z",
  productoId: "prod_123",
  nombreProducto: "Ventana PVC",
  cantidad: 5,
  costoUnitario: 100000,
  total: 500000,                       // cantidad × costoUnitario
  businessUnit: "vidrieria"
}
```

**Impacto Financiero:**
- ✅ Stock aumenta
- ✅ Se registra en historial de transacciones
- ❌ NO suma a gastos operativos
- ❌ NO afecta ganancia aún (queda en inventario)

**Almacenamiento:**
- Guardado en array `transactions`
- NO guardado en array `expenses` (esto era el error anterior)

---

### 2️⃣ VENTA DE PRODUCTOS

**Cuándo se registra:**
- Cuando se realiza una venta (addSale, registerSale, convertPresupuestoToVenta)

**Tipo de transacción:**
```javascript
{
  id: "tx_2708...",
  tipo: "venta",                       // ← Venta normal
  fecha: "2026-02-15T12:00:00.000Z",
  productoId: "prod_123",
  nombreProducto: "Ventana PVC",
  cantidad: 2,
  total: 300000,                       // 2 × 150000 (precio venta)
  businessUnit: "vidrieria",
  productSnapshot: {
    id: "prod_123",
    name: "Ventana PVC",
    cost: 100000,                      // ← Costo de compra
    stock: 3,                          // Stock después de venta
    businessUnit: "vidrieria"
  }
}
```

**Impacto Financiero:**
- ✅ Ventas +300000
- ✅ CMV -200000 (2 × 100000 costo)
- ✅ Margen Bruto = 100000
- ✅ Stock disminuye en 2 unidades

**Fórmula aplicada:**
```
CMV = productSnapshot.cost × cantidad vendida
Margen Bruto = Ventas - CMV
Ganancia (antes gastos) = Margen Bruto
```

---

### 3️⃣ GASTOS OPERATIVOS

**Cuándo se registra:**
- Cuando se registra un gasto operativo (FormGastoOperativo)

**Tipo de transacción:**
```javascript
{
  id: "exp_3708...",
  tipo: "gasto",                       // ← Gasto operativo
  fecha: "2026-02-15T15:00:00.000Z",
  concepto: "Sueldo empleado",
  monto: 50000,
  pagadoA: "Juan García",
  categoria: "sueldos",
  businessUnit: "vidrieria"            // o "ambos" → 50/50 prorrateo
}
```

**Impacto Financiero:**
- ✅ Gastos +50000 (si businessUnit === "vidrieria")
- ✅ Gastos +25000 (si businessUnit === "ambos" → solo 50% a vidrieria)
- ✅ Afecta ganancia neta

**Fórmula aplicada:**
```
Gastos Específicos = SUM(gasto donde businessUnit === unidad específica)
Gastos Compartidos = SUM(gasto donde businessUnit === "ambos") ÷ 2
Gastos Totales Unidad = Específicos + Compartidos
```

---

## Cálculo Final de Ganancia Neta (Por Unidad)

```javascript
// Vidriería
Ventas Vidriería       = 300000
CMV Vidriería          = 200000  (costos de productos vendidos)
Margen Bruto           = 100000  (Ventas - CMV)
Gastos Específicos     = 50000   (sueldos vidriería)
Gastos Compartidos     = 12500   (50% de servicios "ambos": 25000/2)
Gastos Totales         = 62500
─────────────────────────────────
GANANCIA NETA          = 37500   (Margen - Gastos)
```

---

## Archivos Modificados

### 1. StoreContext.jsx
**Cambios en reposición de inventario:**
- ✅ `addProduct()` línea ~45: Cambio `tipo: 'reposicion'` → `'compra_mercaderia'`
- ✅ `addProduct()` línea ~59: Cambio `tipo: 'compra'` → `'compra_mercaderia'`, remover expense
- ✅ `updateProduct()` línea ~147: Cambio `tipo: 'reposicion'` → `'compra_mercaderia'`, remover expense

**Resultado:**
- Transacciones de compra/reposición se registran pero NO se agregan a expenses
- No duplican impacto en gastos operativos

### 2. reportesAnalyticsHelpers.js
**Funciones que filtran correctamente:**
- ✅ `calculateTotalSales()` - Filtra solo `tipo === 'venta'`
- ✅ `calculateTotalExpenses()` - Filtra solo `tipo === 'gasto'` (excluye compra_mercaderia)
- ✅ `calculateNetProfit()` - Fórmula: (Ventas - CMV) - Gastos
- ✅ `calculateProductCostByBusinessUnit()` - CMV solo de ventas, lee productSnapshot.cost
- ✅ `getNetProfitByBusinessUnit()` - Ganancia neta por unidad

---

## Flujo Paso a Paso

### Escenario: Comprar e vender ventana

```
PASO 1: Agregar producto al inventario
└─ Costo: 100.000
└─ Registra: compra_mercaderia por 100.000
└─ Impacto: Stock +1, NO afecta ganancia
└─ Historial: ✅ Visible

PASO 2: Vender ese producto
└─ Precio venta: 150.000
└─ Registra: venta por 150.000 + productSnapshot.cost = 100.000
└─ Calcula CMV: +100.000
└─ Impacto: Ventas +150.000, CMV -100.000, Margen +50.000
└─ Stock: -1

PASO 3: Pagar sueldo empleado
└─ Monto: 10.000
└─ Registra: gasto "sueldos"
└─ Impacto: Gastos +10.000, Ganancia -10.000
└─ Historial: ✅ Visible

PASO 4: Calcular ganancia
└─ Ventas:           150.000
└─ CMV:             -100.000
└─ Margen Bruto:     +50.000
└─ Gastos Operativos: -10.000
└─ GANANCIA NETA:    +40.000 ✅
```

---

## Reglas de Validación

### ✅ Correcto
- Compra mercadería → NO suma a gastos operativos
- Venta → CMV se resta automáticamente
- Gasto → Se suma a gastos operativos
- Prorrateo → Gastos compartidos 50/50 por unidad

### ❌ Incorrecto (Anterior)
- Compra mercadería → Sumaba a gastos operativos
- Duplicaba impacto en ganancia
- Gastos operativos inflados

---

## Verificación de Datos

Para verificar que el flujo es correcto:

1. **En Inventario:** Ver producto con stock
2. **En Historial:** Ver `compra_mercaderia` sin afectar ganancia global
3. **En Ventas:** Ver venta con CMV calculado
4. **En Reportes:** Ver margen bruto = ventas - CMV
5. **En Gastos:** Solo gastos de tipo `gasto` se restan
6. **Ganancia:** Debería ser (Ventas - CMV) - Gastos

---

## Comentario de Código

En `reportesAnalyticsHelpers.js` línea 2 se documenta el modelo financiero completo.
