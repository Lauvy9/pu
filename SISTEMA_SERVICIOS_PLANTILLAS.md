# 📋 Sistema de Servicios con Plantillas Reutilizables

## 🎯 Resumen de Implementación

Se ha implementado un sistema completo de servicios guardados (plantillas) que permite crear, reutilizar y gestionar servicios de forma eficiente en todo el sistema. El flujo es ahora más rápido, claro y escalable.

---

## ✨ Características Implementadas

### 1️⃣ **Plantillas de Servicios Guardadas**

**Ubicación:** `src/context/StoreContext.jsx`

Se agregó un nuevo estado `serviceTemplates` que persiste en localStorage bajo la clave `vid_service_templates`.

**Estructura de una plantilla:**
```javascript
{
  id: "tmpl_1234567890",           // ID único
  nombre: "Colocación de vidrio",  // Nombre del servicio
  tipoServicio: "vidrieria",       // "vidrieria" | "muebleria"
  precio: 10000,                   // Precio base
  unidad: "unidad",                // "unidad", "m2", "hora", etc.
  descripcionBase: "",             // Descripción base (opcional)
  activo: true,                    // Permite desactivar sin eliminar
  createdAt: "2026-01-17T..."      // Fecha de creación
}
```

**Acciones disponibles:**
- `addServiceTemplate(template)` - Crear nueva plantilla
- `updateServiceTemplate(id, patch)` - Actualizar plantilla
- `removeServiceTemplate(id)` - Eliminar plantilla

---

### 2️⃣ **Autocompletado de Formulario**

**Ubicación:** `src/pages/Sales.jsx` (líneas 155-185)

Cuando el usuario selecciona una plantilla de servicio:

✅ Se autocompletan automáticamente:
- Nombre del servicio
- Tipo de servicio (Vidriería/Mueblería)
- Precio
- Unidad

❌ NO se autocompleta:
- **Descripción detallada** - Debe ingresarse manualmente para cada venta específica

**Función:**
```javascript
function handleServiceTemplateSelect(templateId) {
  const template = serviceTemplates.find(t => t.id === templateId);
  if (template) {
    setSvcNombre(template.nombre);
    setSvcTipo(template.tipoServicio);
    setSvcUnidad(template.unidad);
    setSvcMonto(template.precio);
    setSvcDescripcion(''); // NO se autocompleta
  }
}
```

---

### 3️⃣ **Formulario Mejorado de Servicios**

**Ubicación:** `src/pages/Sales.jsx` (líneas ~837-960)

**Componentes:**
1. Selector de plantillas (desplegable con lista de plantillas activas)
2. Input nombre del servicio (editable)
3. Select tipo de servicio (Vidriería/Mueblería)
4. Input monto (precio unitario)
5. Input unidad de medida
6. Textarea descripción detallada
7. **Nuevo botón:** "💾 Guardar Plantilla" - Guarda como plantilla reutilizable
8. **Nuevo botón:** "➕ Agregar al Carrito" - Agrega el servicio al carrito

**Flujo:**
```
1. Seleccionar plantilla (opcional) → Autocompletar formulario
2. Completar/editar datos según necesidad
3. Agregar descripción específica del trabajo
4. "Guardar Plantilla" → Para reutilizar luego
5. "Agregar al Carrito" → Registra venta
```

---

### 4️⃣ **Gestión de Plantillas en Página Servicios**

**Ubicación:** `src/pages/Servicios.jsx`

Se rediseñó completamente con **dos pestañas:**

#### **Pestaña 1: 📋 Plantillas de Servicios**
- Ver todas las plantillas guardadas
- Crear nuevas plantillas
- Editar precio de plantillas
- Eliminar plantillas
- Ver estado (Activa/Inactiva)
- Ver fecha de creación

**Estructura mejorada:**
```
Nombre: Colocación de vidrio
Precio: $10.000 | Unidad: unidad | Rubro: Vidriería
Descripción base: Colocación de vidrio laminado en ventanas
Creada: 17/01/2026 | Estado: ✓ Activa
[Editar precio] [Borrar]
```

#### **Pestaña 2: 📚 Historial de Servicios**
- Legado: servicios individuales registrados
- Se recomienda usar Plantillas en su lugar
- Misma funcionalidad de edición

---

### 5️⃣ **Boleta PDF Mejorada**

**Ubicación:** `src/utils/salePdfExport.js`

**Cambios principales:**

#### **Tabla de ítems más completa:**
```
Ítem / Servicio          | Unitario   | Subtotal
─────────────────────────┼────────────┼──────────
Colocación de vidrio x1  | $10.000    | $10.000
Rubro: Vidriería | Unidad: unidad
Descripción: Colocación de vidrio laminado en ventana frontal
```

**Información de cliente mejorada:**
- Nombre
- Teléfono (si disponible)
- Email (si disponible)

**Resumen de pago visual:**
- Box destacado con información
- Total en grande
- Pagado con indicador
- **Saldo Pendiente en rojo** (visible claramente)

**Detalle de pagos:**
- Tabla con todos los pagos realizados
- Fecha, hora, monto, método

**Información adicional:**
- Método de pago
- Estado de entrega (Sí/No)
- Fecha de entrega (si aplica)

---

## 🔄 Flujo de Uso Completo

### **Escenario 1: Crear Plantilla desde Cero**

1. Ir a **Servicios** → Pestaña **Plantillas de Servicios**
2. Completar formulario:
   - Nombre: "Colocación de vidrio"
   - Tipo: "Vidriería"
   - Unidad: "unidad"
   - Precio: 10000
   - Descripción base: (opcional)
3. Clic **"💾 Guardar Plantilla"**
4. Plantilla guardada y lista para reutilizar

### **Escenario 2: Usar Plantilla en Venta**

1. Ir a **Ventas**
2. Filtro de búsqueda: **"Servicios"**
3. Sección "Registrar Servicio":
   - Selector "Plantilla de servicio" → Seleccionar "Colocación de vidrio"
   - Campos se autocompletan
   - Editar descripción: "Colocación en ventana frontal (3m²)"
   - Clic **"➕ Agregar al Carrito"**
4. Servicio agregado al carrito
5. Continuar con venta normal

### **Escenario 3: Descargar Boleta**

1. Venta registrada aparece en tabla "Entregas y Pagos"
2. Clic **"Boleta"** en la fila
3. Se descarga PDF con:
   - Nombre y descripción completa del servicio
   - Tipo (Vidriería/Mueblería)
   - Unidad
   - Precio y subtotal
   - Resumen de pagos
   - Saldo pendiente

---

## 📊 Cambios en Tablas

### **Tabla de Ventas/Pagos/Entregas**

La tabla ya mostraba servicios, pero ahora está **mejor integrada:**

**Columnas relevantes:**
- **Items**: Nombre del servicio, cantidad, precio ✓
- **Tipo (Rubro)**: Vidriería/Mueblería ✓
- **Unidad**: Unidad de medida ✓
- **Pagado/Restante**: Porcentaje y montos ✓
- **Descripción**: Visible al expandir detalles ✓

**Indicador visual:**
- Items con servicios tienen fondo rosa (#fff0f6)
- Etiqueta "Servicio" identificando claramente

---

## 🔗 Compatibilidad

### **No rompe:**
✅ Ventas existentes siguen funcionando
✅ Productos coexisten con servicios
✅ Métodos de pago sin cambios
✅ Sistema de fiados sin cambios
✅ Pagos parciales conservados

### **Mantiene:**
✅ Código limpio y modular
✅ Reutilizable sin duplicaciones
✅ Sin backends nuevos (solo localStorage)
✅ Escalable a futuro

---

## 📁 Archivos Modificados

```
src/
├── context/
│   └── StoreContext.jsx          ← Agregado: serviceTemplates, acciones
├── pages/
│   ├── Sales.jsx                 ← Mejorado: selector y autocompletado
│   └── Servicios.jsx             ← Rediseñado: 2 pestañas
└── utils/
    └── salePdfExport.js          ← Mejorado: boleta más clara
```

---

## 🚀 Cómo Empezar

### **Para usuarios finales:**

1. **Crear plantillas:**
   - Ir a **Servicios** → **Plantillas de Servicios**
   - Crear una vez, usar muchas veces

2. **Usar en ventas:**
   - Ir a **Ventas** → Filtro **Servicios**
   - Seleccionar plantilla → Autocompletar
   - Completar descripción específica
   - Guardar en carrito

3. **Descargar boletas:**
   - Tabla de ventas → Botón **Boleta**
   - PDF con toda la información

### **Para desarrolladores:**

Para agregar más campos a una plantilla, modificar `src/context/StoreContext.jsx`:

```javascript
addServiceTemplate: (template) => {
  const normalized = {
    // Campos existentes...
    // Agregar aquí nuevos campos
    nuevosCampo: template.nuevosCampo || '',
  };
  setServiceTemplates(prev => [...(prev || []), normalized]);
  return normalized;
}
```

---

## ✅ Checklist de Validación

- [x] Plantillas de servicios creadas y guardadas en localStorage
- [x] Autocompletado de formulario funciona
- [x] Descripción NO se autocompleta (como se pidió)
- [x] Botón "Guardar Plantilla" guarda correctamente
- [x] Botón "Agregar al Carrito" funciona
- [x] Página Servicios muestra plantillas
- [x] Boleta PDF muestra información completa
- [x] Tabla de ventas integrada correctamente
- [x] Pagos parciales visibles en boleta
- [x] Saldo adeudado destacado
- [x] Métodos de pago documentados
- [x] Compatible con ventas existentes
- [x] Código limpio y sin duplicaciones
- [x] Sin errores de compilación

---

## 📝 Notas Importantes

1. **Plantillas vs Servicios:**
   - **Plantillas**: Reutilizables, se crean una vez
   - **Servicios**: Historial de servicios individuales (legado)

2. **Descripción en Plantillas:**
   - Tiene campo "descripcionBase" opcional
   - NO se autocompleta al usar en venta
   - Se debe ingresar manualmente cada vez (por diseño)

3. **Escalabilidad:**
   - Sistema pronto soportará:
     - Descuentos en plantillas
     - Categorías de servicios
     - Integración con API externa
     - Exportación/importación de plantillas

---

## 🎨 UX/UI Improvements

- ✅ Selector visual de plantillas con precio visible
- ✅ Formulario estructurado en grid
- ✅ Botones con iconos intuitivos
- ✅ Colores diferenciados (purple para plantillas, green para carrito)
- ✅ Información clara en boletas
- ✅ Resumen de pago en box destacado
- ✅ Pestaña visual con navegación clara

---

**Sistema implementado el 17 de enero de 2026 ✓**
