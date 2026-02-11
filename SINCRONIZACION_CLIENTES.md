# 🎯 Sincronización de Clientes desde Ventas - Resumen de Implementación

## Visión General

Se ha implementado una **sincronización automática y unidireccional** de clientes desde el módulo de Ventas hacia la vista de Clientes. Los clientes NO se guardan por separado; se construyen **dinámicamente** a partir de las ventas registradas.

---

## 📊 Cambios Realizados

### 1. **Funciones Mejoradas en `clientHelpers.js`**

Se ampliaron significativamente las funciones de normalización y sincronización:

#### `buildClientsFromSales(sales, fiados)`
- **Fuente única de verdad**: Solo lee desde `sales` (ventas)
- **Agrupamiento inteligente**:
  - Prioridad 1: `clienteFiado.id`
  - Prioridad 2: Email del cliente
  - Prioridad 3: Nombre + Teléfono
  - Fallback: ID de la venta

- **Normalización por cliente**:
  ```javascript
  {
    key,           // Identificador único
    id,            // clienteFiado.id o key
    nombre,        // Nombre del cliente
    telefono,      // Teléfono normalizado
    email,         // Email
    direccion,     // Dirección
    
    // Historial comercial
    ventas: [],                    // Array de todas sus ventas
    productosComprados: [],        // Merge de todos los productos
    
    // Deuda y pagos
    totalComprado,                 // Total acumulado de ventas
    totalPagado,                   // Total de pagos registrados
    totalAdeudado,                 // Deuda pendiente
    pending,                       // Alias para totalAdeudado
    
    // Fiado
    esFiado,                       // true si tiene deuda activa
    primerPagoFecha,               // Fecha del primer pago
    proximoVencimiento,            // Próximo vencimiento pendiente
    
    // Historial
    ultimaCompraFecha,             // Fecha de última compra
    comprasCount                   // Cantidad total de compras
  }
  ```

#### Funciones de Soporte
- `extractClientDataFromSale()`: Extrae nombre, teléfono, email, dirección de una venta
- `normalizePhone()`: Normaliza teléfono (solo dígitos)
- `normalizeName()`: Normaliza nombre para comparación
- `normalizeEmail()`: Normaliza email
- `generateClientKey()`: Genera clave única con prioridades
- `getPaidAmount()`: Calcula monto pagado desde payments[]
- `getProductosFromSale()`: Extrae productos de una venta

---

### 2. **Vista de Clientes Rediseñada (`Clientes.jsx`)**

Completamente reescrita para usar la sincronización automática:

#### Estructura de Datos
```javascript
const clientesResumen = useMemo(() => 
  buildClientsFromSales(sales, fiados),
  [sales, fiados]
)

const fiadoClients = clientesResumen.filter(c => c.totalAdeudado > 0)
const alDiaClients = clientesResumen.filter(c => c.totalAdeudado === 0)
```

#### Tres Vistas Disponibles

**1️⃣ Resumen (`vistaActiva === 'resumen'`)**
- Vista general de **todos los clientes**
- Cards con totales: Total Comprado, Total Pagado, Deuda Total
- Tabla completa con información de contacto, compras, deuda
- Indicadores visuales de estado (Fiado/Al día)

**2️⃣ Con Fiado (`vistaActiva === 'fiado'`)**
- Solo clientes con **deuda pendiente** (totalAdeudado > 0)
- Información de pago: % pagado, próximo vencimiento
- Alertas visuales si está vencido o próximo a vencer
- Botón para exportar PDF con detalles

**3️⃣ Al Día (`vistaActiva === 'aldia'`)**
- Solo clientes **sin deuda** (totalAdeudado === 0)
- Información de compras y última fecha
- Estilos visuales que indican "al día"

---

### 3. **Estilos Visuales Condicionales (`Clientes.css`)**

#### 🔸 Cliente con Fiado Activo
```css
backgroundColor: '#fffbf0'  /* Color suave anaranjado */
borderLeft: '4px solid #f97316'  /* Naranja intenso */
```
- Transmite "pendiente / atención"
- Muestra: fecha de vencimiento, monto restante, productos

#### 🟢 Cliente sin Fiado (Al Día)
```css
backgroundColor: '#f0fdf4'  /* Color suave verde */
borderLeft: '4px solid #22c55e'  /* Verde intenso */
```
- Indica "cliente al día"
- Muestra: total comprado, productos, última fecha

#### Colores No Saturados
- Usar tonalidades pastel (#fffbf0, #f0fdf4)
- Bordes laterales con colores más intensos para contraste
- Sin usar colores rojo/amarillo puro ni fuerte saturación

---

## 🔄 Flujo de Sincronización

### Paso 1: Crear Venta en Sales
- Usuario crea venta (normal o fiado)
- Se guardan: `isFiado`, `dueDate`, `payments`, `items`, `clienteFiado/customer`

### Paso 2: Lectura en Clientes
- `Clientes.jsx` usa `buildClientsFromSales(sales, fiados)`
- Se calcula automáticamente, sin almacenamiento separado

### Paso 3: Normalización
- Se agrupan múltiples ventas del mismo cliente
- Se calculan: totales, deudas, próximos vencimientos, pagos

### Paso 4: Presentación Visual
- Se aplican estilos según `totalAdeudado > 0`
- Se muestra información relevante por vista

---

## 🧩 Reglas de Sincronización Implementadas

### ✅ Fuente Única de Verdad
- Ventas es la **única fuente** de datos de clientes
- No se crea ni mantiene estado propio en Clientes
- Todo sale de objetos `sale`

### ✅ Normalización Correcta
- Agrupamiento por clienteFiado.id > email > (nombre+teléfono)
- Extracción de datos desde `sale.customer`, `sale.clienteContacto`
- Merge de productos desde `sale.items`

### ✅ Deuda y Pagos
- Cálculo de `totalPagado` desde `sale.payments[]`
- `totalAdeudado = totalComprado - totalPagado`
- Próximo vencimiento: `sale.dueDate` más cercano pendiente

### ✅ No Romper Ventas
- Ventas normales funcionan igual (sin fiado)
- Presupuestos se ignoran (filter by type)
- Pagos iniciales se registran correctamente

---

## 📱 Información Mostrada por Cliente

### Datos de Contacto
- ✅ Nombre
- ✅ Dirección
- ✅ Teléfono / Email

### Historial Comercial
- ✅ Qué productos compró (items merge)
- ✅ Tipo de venta (Fiado / Normal)
- ✅ Cantidad de compras
- ✅ Fecha última compra

### Si es FIADO
- ✅ Fecha de vencimiento (dueDate)
- ✅ Fecha del primer pago (primerPagoFecha)
- ✅ Cuánto pagó hasta ahora (totalPagado)
- ✅ Cuánto falta pagar (totalAdeudado)
- ✅ % de pago
- ⏰ Días al vencimiento (con alertas)

---

## 🎨 Componentes Visuales

### Cards de Totales
```
┌─────────────────────┐
│ Total Comprado      │  Blue
│ $12,500.00          │  3 clientes
└─────────────────────┘

┌─────────────────────┐
│ Total Pagado        │  Green
│ $8,750.00           │
└─────────────────────┘

┌─────────────────────┐
│ Deuda Total         │  Red
│ $3,750.00           │  1 cliente con deuda
└─────────────────────┘
```

### Tabla de Clientes
- Bordes laterales condicionales (naranja/verde)
- Background suave (fffbf0 / f0fdf4)
- Indicadores de estado (⚠️ Fiado / ✓ Al día)
- Barra de progreso de pago
- Botones de Detalles y PDF

### Alertas de Vencimiento
```
- ⚠️ Vencido         (fondo rojo suave)
- ⏰ Próximo a vencer (fondo amarillo suave)
```

---

## 🔍 Pruebas Recomendadas

### Test 1: Crear Venta Normal
1. Ir a Ventas
2. Crear venta: Cliente + Productos
3. Ir a Clientes → Resumen
4. Verificar: Cliente aparece con background verde

### Test 2: Crear Fiado
1. Ir a Ventas
2. Crear venta tipo "Fiado"
3. Seleccionar cliente existente o crear nuevo
4. Establecer vencimiento
5. Registrar pago inicial
6. Ir a Clientes → Con Fiado
7. Verificar: Cliente con background anaranjado, muestra deuda

### Test 3: Múltiples Compras del Mismo Cliente
1. Crear 2-3 ventas del mismo cliente
2. Ir a Clientes → Resumen
3. Verificar: Se agregan totales, se cuenta como 1 cliente

### Test 4: Pagos Parciales
1. Crear fiado por $1000
2. Registrar pago de $300
3. Ir a Clientes
4. Verificar: % pagado = 30%, adeudado = $700

### Test 5: Vencimientos
1. Crear fiado con vencimiento hoy
2. Ir a Clientes → Con Fiado
3. Verificar: Muestra "⚠️ Vencido"

---

## ⚙️ Detalles Técnicos

### Estructura de Key por Cliente
```javascript
// Prioridad 1: clienteFiado.id
fiado_${clienteFiado}

// Prioridad 2: Email
email_${normalizedEmail}

// Prioridad 3: Nombre + Teléfono
nametl_${normName}|${normPhone}

// Prioridad 4: Solo nombre
name_${normName}

// Prioridad 5: Solo teléfono
phone_${normPhone}

// Fallback: Sale ID
sale_${sale.id}
```

### Performance
- useMemo en Sales.jsx y Clientes.jsx previene recálculos innecesarios
- O(n) complexity: itera una sola vez sobre ventas
- Map para búsqueda eficiente O(1)

### Compatibilidad
- No rompe presupuestos (ignora type === 'presupuesto')
- No rompe ventas normales (sin fiado)
- Mantiene función legacy `buildClientsFromSalesLegacy()` para compatibilidad

---

## 📝 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/utils/clientHelpers.js` | Implementadas funciones de sincronización |
| `src/pages/Clientes.jsx` | Reescrito con nuevo flujo de sincronización |
| `src/pages/Clientes.css` | Nuevos estilos visuales condicionales |

---

## 🚀 Próximos Pasos (Opcionales)

1. **Notificaciones de Vencimiento**: Alertas cuando se acerca la fecha
2. **Historial de Pagos**: Tabla expandible con cada pago registrado
3. **Score de Cliente**: Basado en puntualidad de pagos
4. **Limite de Crédito**: Control automático por cliente
5. **Dashboard de Cobranza**: Vista dedicada para cobradores

---

## ✨ Beneficios de esta Implementación

✅ **Sincronización Automática**: Cambios en Ventas → automáticamente en Clientes  
✅ **Sin Duplicación**: Una sola fuente de verdad (Ventas)  
✅ **Datos Precisos**: Cálculos en tiempo real desde payments y items  
✅ **Interfaz Clara**: Colores visuales distinguen estado al instante  
✅ **No Rompe Nada**: Ventas y Presupuestos funcionan exactamente igual  
✅ **Escalable**: Funciona con cualquier cantidad de clientes y ventas
