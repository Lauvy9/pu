# 📊 Dashboard Financiero Profesional

## ✨ Características Principales

### 1. **Gráficos Interactivos en Tiempo Real**
- **Línea de Tiempo Multi-métrica**: Visualiza simultáneamente ventas, gastos y ganancias a lo largo del período seleccionado
- **Distribución por Categoría**: Pie charts mostrando la composición de ventas y gastos
- **Top Productos**: Gráfico de barras horizontal con los 10 productos más vendidos
- **Métodos de Pago**: Análisis de las transacciones por tipo de pago

### 2. **Tarjetas KPI Ejecutivas**
Cuatro métricas principales con tendencias:
- 💰 **Ventas Totales**: Ingresos totales del período
- 💸 **Gastos Totales**: Costos operativos del período
- 📈 **Ganancia Neta**: Utilidad después de gastos
- 📊 **Margen de Ganancia**: Porcentaje de rentabilidad

### 3. **Comparación de Períodos**
Análisis comparativo automático con el período anterior:
- Visualización lado a lado de ventas
- Cálculo de cambio porcentual
- Indicador de tendencia (↑ arriba / ↓ abajo)

### 4. **Filtros Avanzados**
- Selección de rango de fechas personalizado
- Filtros por período: Hoy, Semana, Mes, Trimestre, Año
- Actualización en tiempo real de todos los gráficos

## 🏗️ Arquitectura Técnica

### Librerías Utilizadas
```javascript
- recharts: Gráficos profesionales y responsivos
- chart.js: Compatibilidad con Chart.js si es necesario
- react-chartjs-2: Integración de Chart.js con React
```

### Componentes Principales

#### `DashboardCharts.jsx`
Componentes reutilizables de gráficos:
- `KPICard`: Tarjeta de métrica individual
- `SalesExpenseTrendChart`: Gráfico de líneas multi-métrica
- `CategoryDistributionChart`: Pie chart de distribución
- `BarChartComponent`: Gráfico de barras configurables
- `TopProductsChart`: Gráfico de productos más vendidos
- `StatsGrid`: Grid de todas las KPIs

#### `EnhancedReportesDashboard.jsx`
Dashboard principal que:
- Integra todos los componentes
- Gestiona el estado de filtros
- Transforma datos para gráficos
- Maneja la actualización en tiempo real

#### `dashboardChartHelpers.js`
Funciones de transformación de datos:
- `transformToTimeSeries()`: Agrupación de datos por día
- `transformToCategories()`: Clasificación de ventas por categoría
- `getTopProducts()`: Identificación de productos estrella
- `calculateKPIs()`: Cálculo de métricas principales
- `compareWithPreviousPeriod()`: Análisis comparativo

## 📊 Flujo de Datos

```
Store (sales, expenses, products)
           ↓
Filtrado por rango de fechas
           ↓
Transformación con dashboardChartHelpers
           ↓
Componentes de gráficos (DashboardCharts)
           ↓
Renderizado responsivo en UI
```

## 🎨 Paleta de Colores

```css
--primary-sales: #10b981;      /* Verde para ventas */
--primary-expenses: #ef4444;   /* Rojo para gastos */
--primary-profit: #3b82f6;     /* Azul para ganancias */
--secondary-1: #8b5cf6;        /* Morado para categorías */
--secondary-2: #f59e0b;        /* Amber para productos */
```

## 📱 Responsive Design

El dashboard se adapta automáticamente a:
- **Desktop (>1024px)**: Grid de múltiples columnas
- **Tablet (768px-1024px)**: Grid de 2 columnas
- **Mobile (<768px)**: Layout de una columna

## ⚡ Performance

### Optimizaciones Implementadas
- **useMemo**: Caché de transformaciones de datos
- **Filtrado eficiente**: Solo procesa datos del rango de fechas
- **Renderizado condicional**: Componentes solo se renderizan si hay datos
- **Limitación de puntos**: Top 10 productos, últimos 1000 registros

## 🔄 Actualización en Tiempo Real

El dashboard se actualiza automáticamente cuando:
- El usuario cambia el rango de fechas
- Se añade una nueva venta en el Store
- Se registra un nuevo gasto

## 🚀 Uso

### Acceso
1. Navega a la sección "Reportes" en el menú principal
2. Selecciona la pestaña "Dashboard"

### Filtrado
```javascript
// Personalizado
Selecciona "Desde" y "Hasta" con el date picker

// Predefinido
Usa los botones rápidos: Hoy, Semana, Mes, Trimestre, Año
```

### Exportación
- Exportar PDF: Botón "📄 Exportar PDF" en la header
- Exportar Gráfico Individual: (Próximamente) Click derecho en gráfico

## 📈 Métricas Calculadas

### KPIs Principales
- **Ventas Totales**: Suma de (precio × cantidad) de todos los items
- **Gastos Totales**: Suma de todos los gastos registrados
- **Ganancia Neta**: Ventas Totales - Gastos Totales
- **Margen**: (Ganancia Neta / Ventas Totales) × 100

### Análisis Comparativo
- **Cambio %**: ((Actual - Anterior) / Anterior) × 100
- **Tendencia**: Positiva (↑) si cambio > 0, Negativa (↓) si cambio < 0

## 🔧 Configuración

### Personalizar Colores
Edita las variables CSS en `dashboard-enhanced.css`:
```css
:root {
  --primary-sales: #10b981;
  --primary-expenses: #ef4444;
  /* ... */
}
```

### Agregar Nuevos Gráficos
1. Crear función de transformación en `dashboardChartHelpers.js`
2. Crear componente en `DashboardCharts.jsx`
3. Integrar en `EnhancedReportesDashboard.jsx`

## 🐛 Troubleshooting

### "Sin datos disponibles"
- Verifica que tengas ventas/gastos en el rango de fechas
- Comprueba que los datos tengan campo `date` válido

### Gráficos no se actualizan
- Recarga la página
- Verifica que el Store esté sincronizado
- Abre la consola para ver errores

### Performance lento
- Reduce el rango de fechas
- Verifica la cantidad de transacciones
- Cierra otras pestañas/aplicaciones

## 📚 Referencias

- [Recharts Documentation](https://recharts.org/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [React Best Practices](https://react.dev/)

---

**Dashboard desarrollado con ❤️ para análisis financiero profesional**
