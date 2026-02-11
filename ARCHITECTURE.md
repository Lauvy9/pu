# 🏗️ Arquitectura del Dashboard Financiero

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    Store Context                             │
│  (sales, expenses, products, fiados, bankAccounts)          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│         EnhancedReportesDashboard.jsx                        │
│  - Gestiona filtros de fecha                                │
│  - Filtra datos por rango                                   │
│  - Calcula necesidades de datos                             │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────────┐  ┌──────────────────────────┐
│ dashboardChart   │  │  DashboardCharts.jsx     │
│ Helpers.js       │  │  (Componentes)           │
│                  │  │                          │
│- transformTo     │  │- KPICard                 │
│  TimeSeries      │  │- SalesExpenseTrend       │
│- transformTo     │  │- CategoryDistribution    │
│  Categories      │  │- BarChart                │
│- getTopProducts  │  │- TopProducts             │
│- calculateKPIs   │  │- StatsGrid               │
│- etc.            │  │                          │
└──────────────────┘  └──────────────────────────┘
        │                      │
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │   Recharts Library    │
        │  (Gráficos React)     │
        └──────────┬────────────┘
                   ▼
        ┌──────────────────────┐
        │   UI Responsivo       │
        │  (CSS Grid + Flex)    │
        └──────────────────────┘
```

## Componentes y sus Responsabilidades

### 1. **DashboardCharts.jsx**
Componentes de presentación reutilizables

```jsx
├── KPICard
│   └── Muestra métrica individual con valor e ícono
│
├── SalesExpenseTrendChart
│   └── Gráfico de líneas con 3 series (Ventas, Gastos, Ganancia)
│
├── CategoryDistributionChart
│   └── Pie chart para distribucion por categoría
│
├── BarChartComponent
│   └── Gráfico de barras genérico y reutilizable
│
├── TopProductsChart
│   └── Gráfico de barras horizontal para top 10 productos
│
└── StatsGrid
    └── Grid responsive con 4 KPIs principales
```

### 2. **dashboardChartHelpers.js**
Utilidades de transformación de datos

```javascript
Entrada: datos raw (sales, expenses, products)
         ↓
├── transformToTimeSeries()
│   └─→ Array de objetos {date, sales, expenses, profit}
│
├── transformToCategories()
│   └─→ Array de {category, value, count}
│
├── getTopProducts()
│   └─→ Array de top 10 {id, name, value, quantity}
│
├── calculateKPIs()
│   └─→ Objeto {totalSales, totalExpenses, profit, margin, ...}
│
├── transformExpensesByType()
│   └─→ Array de {type, value, count}
│
├── getPaymentMethods()
│   └─→ Array de {method, count, total}
│
└── compareWithPreviousPeriod()
    └─→ Objeto {current, previous, changePercent, trend}
```

### 3. **EnhancedReportesDashboard.jsx**
Orquestador principal

```javascript
Estado:
├── dateRange {start, end}
│
Datos Procesados (useMemo):
├── filteredSales
├── filteredExpenses
├── chartData {
│   ├── timeSeries
│   ├── categories
│   ├── topProducts
│   ├── expensesByType
│   ├── paymentMethods
│   ├── kpis
│   └── comparison
│}
│
Cálculos:
└── activeClients

Renderizado:
├── Header con filtros
├── KPI Stats Grid
├── Comparación de períodos
├── Charts Grid (múltiples gráficos)
└── Footer
```

## Flujo de Actualización

```
Usuario cambia fechas
        │
        ▼
dateRange state actualizado
        │
        ▼
filteredSales & filteredExpenses recalculados (useMemo)
        │
        ▼
chartData recalculado con nuevos datos
        │
        ▼
Todos los componentes re-renderizan con nuevos datos
        │
        ▼
UI actualizada en pantalla
```

## Estructura de Carpetas

```
src/
├── components/
│   ├── DashboardCharts.jsx          ← Componentes de gráficos
│   ├── EnhancedReportesDashboard.jsx ← Dashboard principal
│   └── ... (otros componentes)
│
├── pages/
│   ├── Reportes.jsx                  ← Página padre que usa dashboard
│   ├── Clientes.jsx                  ← Gestión de clientes
│   └── ...
│
├── utils/
│   ├── dashboardChartHelpers.js      ← Transformaciones de datos
│   ├── financeHelpers.js
│   └── ...
│
├── styles/
│   ├── dashboard-enhanced.css        ← Estilos del dashboard
│   └── ...
│
└── context/
    └── StoreContext.jsx               ← Estado global
```

## Paleta de Colores

```
Colores Primarios:
├── Ventas     → #10b981 (Verde)
├── Gastos     → #ef4444 (Rojo)
└── Ganancias  → #3b82f6 (Azul)

Colores Secundarios:
├── Categoría 1 → #8b5cf6 (Morado)
├── Categoría 2 → #f59e0b (Amber)
└── Categoría 3 → #06b6d4 (Cyan)

Colores Neutrales:
├── Fondo      → #f8fafc
├── Card       → #ffffff
├── Border     → #e2e8f0
├── Texto      → #1e293b
├── Texto Sec  → #64748b
└── Texto Muted→ #94a3b8

Array de Colores para Gráficos:
└── [#10b981, #ef4444, #3b82f6, #8b5cf6, #f59e0b, #06b6d4, ...]
```

## Performance y Optimizaciones

### Técnicas Implementadas

1. **useMemo para cálculos costosos**
   ```javascript
   const chartData = useMemo(() => {
     // Estas transformaciones solo se ejecutan cuando cambian las dependencias
     return {
       timeSeries: transformToTimeSeries(...),
       categories: transformToCategories(...),
       ...
     }
   }, [filteredSales, filteredExpenses, products, dateRange])
   ```

2. **Filtrado eficiente de datos**
   ```javascript
   const filteredSales = useMemo(() => {
     // Solo procesa datos dentro del rango de fechas
     return sales.filter(s => saleDate >= startDate && saleDate <= endDate)
   }, [sales, dateRange])
   ```

3. **Renderizado condicional**
   ```javascript
   {data.length === 0 ? (
     <div>Sin datos</div>
   ) : (
     <Chart data={data} />
   )}
   ```

## Integración con Reportes.jsx

```jsx
<EnhancedReportesDashboard externalRange={dateRange} />
     │
     └─→ Recibe dateRange desde Reportes.jsx
         y actualiza el dashboard
```

## Tipos de Datos

### Entrada (desde Store)

```typescript
interface Sale {
  date: string           // ISO date
  items: [{
    id: number | string
    price: number
    quantity: number
  }]
  clienteFiado?: string
  clienteDNI?: string
}

interface Expense {
  date: string           // ISO date
  amount: number
  type?: string
}

interface Product {
  id: number | string
  name: string
  category?: string
}
```

### Salida (para Gráficos)

```typescript
interface TimeSeries {
  date: string
  sales: number
  expenses: number
  profit: number
}

interface CategoryData {
  category: string
  value: number
  count?: number
}

interface KPIMetrics {
  totalSales: string
  totalExpenses: string
  profit: string
  margin: string
  saleCount: number
  avgTicket: string
}
```

## Responsividad

### Breakpoints CSS

```css
/* Desktop (>1024px) */
grid-template-columns: repeat(auto-fit, minmax(500px, 1fr))

/* Tablet (768px-1024px) */
grid-template-columns: repeat(2, 1fr)

/* Mobile (<768px) */
grid-template-columns: 1fr
```

## Mejoras Futuras

```
Prioridad Alta:
├── Exportación de gráficos individuales (PNG/SVG)
├── Análisis de tendencias con proyecciones
└── Filtros por categoría de producto

Prioridad Media:
├── Comparación con múltiples períodos
├── Alertas de umbrales
└── Histórico de dashboards guardados

Prioridad Baja:
├── Integración con BI (Power BI)
├── Machine Learning para anomalías
└── Modo oscuro
```

---

**Arquitectura diseñada para escalabilidad, mantenibilidad y performance**
