# 🎯 Guía Rápida: Sistema de Servicios Mejorado

## 📍 Ubicación en UI

### 1. Crear/Seleccionar Servicio
- **Ruta**: Módulo de Ventas → Sección "Agregar Servicio"
- **Campos**:
  - Nombre: "Espejo grabado"
  - Tipo: Vidriería | Mueblería
  - Unidad: "metro", "unidad", etc.
  - Descripción: "Detalles del trabajo"
  - Monto: Precio

### 2. Usar Plantilla de Servicio
- **Ruta**: Servicios → Plantillas
- **Acción**: Seleccionar plantilla → Presionar "Agregar al Carrito"
- **Resultado**: Se carga con todos los datos de la plantilla

### 3. Carrito del Servicio
**Columnas Visibles**:
```
┌─────────────────────────────────────────────────┐
│ Producto/Servicio   │ Cant │ Precio │ Subtotal │
├─────────────────────────────────────────────────┤
│ Espejo grabado      │  1   │  $250  │  $250    │
│ Rubro: Vidriería    │                          │
│ Unidad: metro       │                          │
│ Detalles del trabajo│                          │
│                  🗑️ │ −  | qty | +   │         │
└─────────────────────────────────────────────────┘
```

**Acciones**:
- `+` / `−` : Cambiar cantidad
- Campo de cantidad: Editar directamente
- 🗑️ : Eliminar del carrito

### 4. Ver Tabla de Ventas
**Vista Móvil**: Cards con info completa
**Vista Escritorio**: Tabla con columna de items enriquecida

**Para cada servicio muestra**:
- Nombre y cantidad
- Precio
- Rubro (Vidriería/Mueblería)
- Unidad
- Descripción
- Badge "Servicio" en rosa

### 5. Editar Venta
- **Ruta**: Tabla de ventas → Click en "Editar Venta"
- **Modal**: Muestra items con metadata completa
- **Acciones**:
  - Cambiar cantidad de items
  - Agregar nuevos items
  - Eliminar items con `onDec()` (restar cantidad a 0)
  - Actualizar método de pago, unidad de negocio

### 6. Descargar Boleta PDF
- **Ruta**: Tabla de ventas → Click en "Boleta"
- **Contenido**: Boleta profesional con estructura 3-filas por item

**Estructura de cada item en PDF**:
```
Espejo grabado × 1                              $250.00
Rubro: Vidriería | Unidad: metro                        
Descripción: Detalles del trabajo grabado
```

---

## 🔄 Flujo Completo: Ejemplo Práctico

### Escenario: Venta de Servicio de Vidriería

**Paso 1**: Formulario de Servicio
```
Nombre: Espejo grabado
Tipo: Vidriería
Unidad: metro cuadrado
Descripción: Espejo 1x1m con grabado personalizado
Monto: $250
```

**Paso 2**: Agregar al Carrito
```
Click en "Agregar al Carrito"
↓
Item aparece en carrito con:
- Nombre, cantidad, precio
- Rubro: Vidriería
- Unidad: metro cuadrado
- Descripción visible
```

**Paso 3**: Carrito
```
┌─ Carrito ──────────────────────────┐
│ Espejo grabado × 1   $250          │
│ Rubro: Vidriería                   │
│ Unidad: metro cuadrado             │
│ Espejo 1x1m con grabado            │
│                                    │
│ Total: $250                        │
│ [Finalizar Venta]                  │
└────────────────────────────────────┘
```

**Paso 4**: Finalizar Venta
```
Registrar cliente
↓
La venta se guarda con:
- Items (con metadata)
- Total: $250
- Métodos de pago
- Estado de entrega
```

**Paso 5**: Ver en Tabla
```
Tabla muestra:
- Fecha: 2024-01-15 10:30
- Total: $250
- Items: Espejo grabado × 1 ($250)
         Rubro: Vidriería
         Unidad: metro cuadrado
         Descripción: ...
- Tipo: venta
- Unidad: Vidriería
- Pagado: % | Rest
```

**Paso 6**: Descargar Boleta
```
Click en "Boleta"
↓
PDF con estructura profesional:

VIDRIERÍA LAURA - BOLETA
====================================
Espejo grabado                 × 1
Unitario: $250.00        Subtotal: $250.00
Rubro: Vidriería | Unidad: metro cuadrado
Descripción: Espejo 1x1m con grabado
====================================
TOTAL: $250.00
```

---

## 🎨 Estilos Visuales

### Identificación Visual de Servicios

| Elemento | Color | Significado |
|----------|-------|------------|
| Carrito de servicio | `#fff0f6` (Rosa) | Item es un servicio |
| Carrito de producto | `#fff3e0` (Naranja) | Item es un producto |
| Badge "Servicio" | Rosa `#ffb6d5` | Confirma que es servicio |
| Metadata de item | Gris `#666` | Información adicional |
| Descripción | Gris itálica | Detalles del servicio |

---

## ✅ Verificación: Datos que se Capturan

Cuando finalizas una venta con servicio, se guarda:

```javascript
{
  id: "venta_123",
  date: "2024-01-15T10:30:00",
  type: "venta",
  total: 250,
  items: [
    {
      id: "svc_456",           // ID del servicio
      name: "Espejo grabado",
      qty: 1,
      price: 250,
      tipoServicio: "vidrieria",     // ✓ GUARDADO
      unidad: "metro cuadrado",      // ✓ GUARDADO
      descripcion: "Espejo 1x1m..."  // ✓ GUARDADO
    }
  ],
  payments: [{...}],
  entregado: false,
  pagado: false,
  // ... otros campos
}
```

---

## 🔍 Dónde Ver Cada Información

| Información | Carrito | Tabla | Boleta | Modal Edición |
|------------|---------|-------|--------|--------------|
| Nombre | ✓ | ✓ | ✓ | ✓ |
| Cantidad | ✓ | ✓ | ✓ | ✓ |
| Precio | ✓ | ✓ | ✓ | ✓ |
| Rubro | ✓ | ✓ | ✓ | ✓ |
| Unidad | ✓ | ✓ | ✓ | ✓ |
| Descripción | ✓ | ✓ | ✓ | ✓ |

---

## 🛠️ Troubleshooting

### P: No veo la metadata en el carrito
**R**: Asegúrate de que:
- [ ] El servicio tenga los campos tipoServicio, unidad, descripcion completos
- [ ] Hayas hecho click en "Agregar al Carrito" (no solo "Finalizar")
- [ ] Refresques la página si no se actualiza

### P: ¿Se pierde la información al editar?
**R**: No, toda la metadata se preserva:
- Cuando editas una venta, los servicios mantienen su información
- Puedes agregar nuevos servicios con su metadata
- La boleta siempre muestra lo guardado

### P: ¿Cómo elimino un servicio del carrito?
**R**: Opciones:
1. **Click en 🗑️** en la fila del item
2. **Cambiar cantidad a 0** con el botón −
3. En modal de edición: restar cantidad hasta 0

### P: ¿Los totales se calculan bien?
**R**: Sí, totales y ganancias se calculan igual que siempre:
- Total = suma de todos los items (precio × cantidad)
- Ganancia = Total − costo de productos (servicios sin costo)

---

## 📊 Campos Obligatorios vs Opcionales

### Para Crear un Servicio

| Campo | Obligatorio | Descripción |
|-------|------------|------------|
| Nombre | ✓ | Nombre del servicio |
| Tipo | ✓ | Vidriería / Mueblería |
| Monto | ✓ | Precio del servicio |
| Unidad | ✗ | Unidad de medida (ej: metro, unidad) |
| Descripción | ✗ | Detalles adicionales |

---

## 🚀 Tips Avanzados

1. **Usar plantillas** para servicios recurrentes (botonera, espejo, etc.)
2. **Descripción clara** ayuda al cliente a entender el trabajo
3. **Unidad correcta** facilita seguimiento (metro para espejos, unidad para trabajos)
4. **Badge "Servicio"** (rosa) te diferencia visualmente de productos

---

## 📞 Contacto / Preguntas

Si encuentras algún problema con el sistema de servicios mejorado:
1. Revisar este documento
2. Chequear que los datos se guarden correctamente en tabla de ventas
3. Verificar que boleta PDF muestre toda la información

---

**Última actualización**: 2024  
**Status**: ✅ Sistema funcionando completamente
