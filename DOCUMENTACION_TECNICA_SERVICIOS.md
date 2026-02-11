# 🔧 Documentación Técnica: Sistema de Servicios con Plantillas

## Arquitectura

### Base de Datos (localStorage)

```javascript
// Plantillas de servicios
localStorage['vid_service_templates'] = [
  {
    id: "tmpl_1234567890",
    nombre: "Colocación de vidrio",
    tipoServicio: "vidrieria",    // "vidrieria" | "muebleria"
    precio: 10000,
    unidad: "unidad",             // "unidad" | "m2" | "hora" | custom
    descripcionBase: "",
    activo: true,
    createdAt: "2026-01-17T10:30:00.000Z"
  }
]

// Servicios (historial - puede mantenerse por compatibilidad)
localStorage['vid_services'] = [
  {
    id: "svc_1234567890",
    name: "Servicio...",
    price: 10000,
    tipoServicio: "vidrieria",
    unidad: "unidad",
    descripcion: "",
    businessUnit: undefined,
    activo: true
  }
]
```

---

## Contexto (StoreContext.jsx)

### Estado agregado
```javascript
const [serviceTemplates, setServiceTemplates] = useLocalStorage('vid_service_templates', []);
```

### Acciones disponibles

#### 1. Crear Plantilla
```javascript
actions.addServiceTemplate({
  nombre: "Colocación de vidrio",
  tipoServicio: "vidrieria",
  precio: 10000,
  unidad: "unidad",
  descripcionBase: "Colocación en marcos de aluminio"
})
```

**Retorna:** 
```javascript
{
  id: "tmpl_1705512600000",
  nombre: "Colocación de vidrio",
  tipoServicio: "vidrieria",
  precio: 10000,
  unidad: "unidad",
  descripcionBase: "Colocación en marcos de aluminio",
  activo: true,
  createdAt: "2026-01-17T..."
}
```

#### 2. Actualizar Plantilla
```javascript
actions.updateServiceTemplate(templateId, {
  precio: 12000,
  descripcionBase: "Colocación en marcos de aluminio (actualizado)"
})
```

**Cambios soportados:**
- `nombre`
- `precio` (normalizado a Number)
- `tipoServicio`
- `unidad`
- `descripcionBase`
- `activo`

#### 3. Eliminar Plantilla
```javascript
actions.removeServiceTemplate(templateId)
```

**Nota:** No afecta ventas existentes

---

## Componentes

### Sales.jsx

#### Estados nuevo
```javascript
const [selectedServiceTemplateId, setSelectedServiceTemplateId] = useState('');
const [svcSaveAsTemplate, setSvcSaveAsTemplate] = useState(false);
```

#### Funciones principales

##### `handleServiceTemplateSelect(templateId)`
Autocompleta formulario cuando se selecciona plantilla
```javascript
function handleServiceTemplateSelect(templateId) {
  const template = (serviceTemplates || []).find(t => t.id === templateId);
  if (template) {
    setSvcNombre(template.nombre || '');
    setSvcTipo(template.tipoServicio || 'vidrieria');
    setSvcUnidad(template.unidad || 'unidad');
    setSvcMonto(template.precio || 0);
    setSvcDescripcion(''); // NO se autocompleta
  }
}
```

##### `handleSaveServiceTemplate()`
Guarda servicio actual como plantilla
```javascript
function handleSaveServiceTemplate() {
  if (!svcNombre) return alert('Ingresá un nombre para la plantilla');
  if (svcMonto <= 0) return alert('Ingresá un precio válido');
  
  const template = {
    nombre: svcNombre,
    tipoServicio: svcTipo,
    precio: svcMonto,
    unidad: svcUnidad,
    descripcionBase: svcDescripcion || ''
  };
  
  const saved = actions.addServiceTemplate(template);
  alert(`Plantilla "${svcNombre}" guardada`);
  setSelectedServiceTemplateId(saved.id);
}
```

#### Selector en UI
```jsx
{(serviceTemplates || []).length > 0 && (
  <select
    value={selectedServiceTemplateId}
    onChange={e => {
      const id = e.target.value;
      if (id) handleServiceTemplateSelect(id);
    }}
  >
    <option value="">Crear servicio nuevo...</option>
    {(serviceTemplates || []).filter(t => t.activo).map(t => (
      <option key={t.id} value={t.id}>
        {t.nombre} — {formatCurrency(t.precio)} ({t.unidad})
      </option>
    ))}
  </select>
)}
```

---

### Servicios.jsx

#### Tabs
```javascript
const [activeTab, setActiveTab] = useState('templates') // 'templates' | 'history'
```

#### Funciones

##### `agregarPlantilla()`
```javascript
function agregarPlantilla() {
  const template = actions.addServiceTemplate({ 
    nombre, 
    precio: parseFloat(precio), 
    tipoServicio: tipo, 
    unidad: unidad, 
    descripcionBase: descripcion 
  });
}
```

##### `deleteTemplate(id)`
```javascript
function deleteTemplate(id){
  if (!confirm('Eliminar plantilla? Esto no afectará las ventas existentes')) return;
  actions.removeServiceTemplate(id)
}
```

---

## PDF Export (salePdfExport.js)

### Cambios principales

#### Tabla de ítems mejorada
```javascript
const tableBody = [];

(sale.items || []).forEach(item => {
  const subtotal = (item.qty || 0) * (item.price || 0);

  // Row 1: Nombre, cantidad, precio
  tableBody.push({
    product: `${item.name || '-'} x${item.qty || 0}`,
    price: `${formatCurrency(item.price || 0)}`,
    subtotal: formatCurrency(subtotal),
    _row: 'main'
  });

  // Row 2: Tipo y unidad
  tableBody.push({
    product: `Rubro: ${mapTipo(item.tipoServicio)} | Unidad: ${item.unidad || '-'}`,
    price: '',
    subtotal: '',
    _row: 'meta'
  });

  // Row 3: Descripción
  if (item.descripcion) {
    tableBody.push({
      product: `Descripción: ${item.descripcion}`,
      price: '',
      subtotal: '',
      _row: 'desc'
    });
  }
});
```

#### Resumen de pago visual
```javascript
const totalPagado = (sale.payments || []).reduce(
  (acc, p) => acc + Number(p.amount || 0), 0
);
const saldoPendiente = Math.max((sale.total || 0) - totalPagado, 0);

// Box destacado
doc.setFillColor(240, 240, 240);
doc.rect(summaryX, y, summaryWidth, 28, 'F');

doc.text('RESUMEN DE PAGO', summaryX + 4, y + 6);
doc.text('Total:', summaryX + 4, y + 14);
doc.text(formatCurrency(sale.total || 0), pageWidth - 19, y + 14, { align: 'right' });
// ... más líneas con formato
```

---

## Flujo de Datos

### Creación de Venta con Plantilla

```
User abre Sales.jsx
    ↓
Selecciona "Servicios" en filtro
    ↓
Elige plantilla en selector
    ↓
handleServiceTemplateSelect() ejecuta
    ↓
Formulario se autocompleta:
  - svcNombre = template.nombre
  - svcTipo = template.tipoServicio
  - svcMonto = template.precio
  - svcUnidad = template.unidad
  - svcDescripcion = '' (vacío intencionalmente)
    ↓
User completa descripción específica
    ↓
Opción A: "Guardar Plantilla"
    ↓ (si quiere guardar nueva variante)
    handleSaveServiceTemplate() → actions.addServiceTemplate()
    
    OR
    
    Opción B: "Agregar al Carrito"
    ↓
    addToCart() → Agrega servicio al carrito
    ↓
    finish() → Registra venta completa
    ↓
    Venta guardada en sales
```

---

## Compatibilidad

### Productos vs Servicios

```javascript
// Los servicios se distinguen por ID
if (String(id).startsWith('svc_')) {
  // Es un servicio - no tiene stock
} else {
  // Es un producto - tiene stock
}
```

### Plantillas vs Servicios Históricos

```javascript
// Plantillas: Para reutilizar
// Servicios: Historial individual (legado)

// Ambos pueden coexistir sin conflicto
const service = actions.addService({...});    // Historial
const template = actions.addServiceTemplate({...}); // Reutilizable
```

---

## Testing

### Unit Tests (Ejemplo)

```javascript
// Test: addServiceTemplate
test('addServiceTemplate crea plantilla correctamente', () => {
  const store = new StoreContext();
  const template = store.actions.addServiceTemplate({
    nombre: 'Test Service',
    precio: 1000,
    tipoServicio: 'vidrieria',
    unidad: 'unidad'
  });
  
  expect(template.id).toBeDefined();
  expect(template.nombre).toBe('Test Service');
  expect(template.activo).toBe(true);
  expect(template.createdAt).toBeDefined();
});

// Test: updateServiceTemplate
test('updateServiceTemplate actualiza precio', () => {
  const store = new StoreContext();
  const template = store.actions.addServiceTemplate({...});
  
  store.actions.updateServiceTemplate(template.id, { precio: 2000 });
  
  const updated = store.serviceTemplates.find(t => t.id === template.id);
  expect(updated.precio).toBe(2000);
});

// Test: removeServiceTemplate
test('removeServiceTemplate elimina plantilla', () => {
  const store = new StoreContext();
  const template = store.actions.addServiceTemplate({...});
  
  store.actions.removeServiceTemplate(template.id);
  
  const found = store.serviceTemplates.find(t => t.id === template.id);
  expect(found).toBeUndefined();
});
```

---

## Extensiones Futuras

### 1. Descuentos en Plantillas
```javascript
{
  id: "tmpl_123",
  nombre: "...",
  precio: 10000,
  descuento: 10,        // % descuento
  precioConDescuento: 9000
}
```

### 2. Categorías
```javascript
{
  id: "tmpl_123",
  nombre: "...",
  categoria: "vidrieria_basica", // Para agrupar
  subcategoria: "vidrio_laminado"
}
```

### 3. Campos Dinámicos
```javascript
{
  id: "tmpl_123",
  nombre: "...",
  campos: [
    { nombre: "medida_ancho", tipo: "number", obligatorio: true },
    { nombre: "material", tipo: "select", opciones: ["...", "..."] }
  ]
}
```

### 4. API Integration
```javascript
// Guardar en servidor en lugar de localStorage
async function addServiceTemplate(template) {
  const response = await fetch('/api/service-templates', {
    method: 'POST',
    body: JSON.stringify(template)
  });
  return response.json();
}
```

---

## Troubleshooting

### "Plantillas no aparecen en selector"
- ✓ Verificar que `serviceTemplates` esté en useStore()
- ✓ Verificar localStorage tiene datos
- ✓ Verificar `.filter(t => t.activo)` - cambiar a todos?

### "Descripción se borra al cambiar plantilla"
- ✓ Comportamiento intencional: `setSvcDescripcion('')`
- Si no deseado, cambiar línea en `handleServiceTemplateSelect()`

### "Erro al guardar plantilla"
- ✓ Verificar que `nombre` y `precio` tengan valores
- ✓ Verificar `precio` es Number válido
- ✓ Ver consola del navegador para errores

### "PDF no muestra descripción"
- ✓ Verificar que `item.descripcion` exista en objeto
- ✓ Verificar que al agregar servicio se incluya en objeto item

---

## Performance

### Optimizaciones aplicadas

1. **Filtrado con `.filter(t => t.activo)`**
   - Solo muestra plantillas activas
   - Reduce opciones en selector

2. **useMemo para búsquedas** (ya existente)
   - Evita recalcular plantillas en cada render

3. **localStorage**
   - Rápido para datos pequeños
   - Escala bien hasta ~1000 plantillas

### Límites recomendados
- Máximo ~500 plantillas activas (confortable)
- Máximo ~5000 ventas (conservador)
- Para más, considerar migrate a backend

---

**Documentación actualizada: 17/01/2026 ✓**
