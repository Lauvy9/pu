# 🚀 Guía Rápida: Sistema de Servicios con Plantillas

## ¿Qué es una plantilla de servicio?

Una **plantilla** es un servicio que guardas una vez y reutilizas muchas veces. Tiene:
- Nombre (ej: "Colocación de vidrio")
- Precio base
- Tipo (Vidriería o Mueblería)
- Unidad (unidad, m², hora, etc.)
- Descripción base opcional

---

## 📋 PASO 1: Crear una Plantilla

### Opción A: Desde la página Servicios
1. Ve a **Servicios** en el menú
2. Verás la pestaña **"📋 Plantillas de Servicios"**
3. Completa el formulario:
   - **Nombre**: Colocación de vidrio
   - **Tipo**: Vidriería o Mueblería
   - **Unidad**: unidad (o m², hora, etc.)
   - **Precio base**: 10000
   - **Descripción base**: (opcional)
4. Clic en **"💾 Guardar Plantilla"**

### Opción B: Desde Ventas (sobre la marcha)
1. Ve a **Ventas**
2. Sección "Registrar Servicio"
3. Completa los datos del servicio
4. Clic en **"💾 Guardar Plantilla"**
5. La plantilla se crea y reutilizable

---

## 💰 PASO 2: Usar una Plantilla en una Venta

1. Ve a **Ventas**
2. Filtro: Cambiar a **"Servicios"**
3. En la sección "Registrar Servicio":
   - **Selector de plantilla** → Selecciona "Colocación de vidrio"
   - Los campos se autocompletan ✓
4. **IMPORTANTE**: Completa la **descripción específica del trabajo**
   - Ejemplo: "Colocación en ventana frontal (3m² de vidrio laminado)"
5. Clic **"➕ Agregar al Carrito"**
6. El servicio aparece en el carrito
7. Completa datos del cliente y finaliza venta normal

---

## 📄 PASO 3: Ver Boleta

Después de guardar la venta:

1. Tabla **"Entregas y Pagos"**
2. Encuentra la venta
3. Clic en botón **"Boleta"**
4. Se descarga PDF con:
   - ✅ Nombre del servicio
   - ✅ Cantidad
   - ✅ Precio unitario
   - ✅ Tipo (Vidriería/Mueblería)
   - ✅ Unidad
   - ✅ **Descripción completa del trabajo**
   - ✅ Método de pago
   - ✅ Pagos realizados
   - ✅ **Saldo pendiente (en rojo)**

---

## 🎯 Ventajas del Sistema

### ⏱️ **Más rápido**
- Crear servicio 1 vez
- Usar múltiples veces
- No escribir lo mismo cada vez

### 🧩 **Más claro**
- Cliente ve descripción completa
- Boletas profesionales
- Todo especificado

### 📊 **Más consistente**
- Mismo nombre siempre
- Mismo precio base
- Misma unidad
- Registros ordenados

### 🔄 **Reutilizable**
- Cambiar precio en plantilla
- Se actualiza para nuevas ventas
- Historial no se afecta

---

## ❓ Preguntas Frecuentes

### ¿Puedo cambiar una plantilla?
Sí, en **Servicios** → **Plantillas**, botón **"Editar precio"**

### ¿Si elimino una plantilla, se borran las ventas?
No, las ventas quedan intactas. Solo no puedes usar la plantilla nuevamente.

### ¿Por qué no se autocompleta la descripción?
Porque cada trabajo es diferente. La plantilla tiene "descripción base" pero TÚ completas con detalles específicos.

### ¿Dónde se guarda?
En el navegador (localStorage). Se guarda en tu dispositivo.

### ¿Puedo tener muchas plantillas?
Sí, cuantas necesites. Crea una para cada tipo de servicio.

---

## 📝 Ejemplo Real

### Crear Plantilla
```
Nombre: Colocación de vidrio templado
Tipo: Vidriería
Unidad: unidad
Precio: 15000
Descripción base: Colocación en marco de aluminio
```

### Usar en Venta 1
```
Plantilla: ✓ Colocación de vidrio templado
Cantidad: 1
Descripción: Colocación en ventana frontal de 2m x 1.5m
Precio: $15.000 (ya completado)
```

### Usar en Venta 2
```
Plantilla: ✓ Colocación de vidrio templado
Cantidad: 1
Descripción: Colocación en puerta corrediza de oficina
Precio: $15.000 (ya completado)
```

### Boleta para Cliente
```
BOLETA DE VENTA
─────────────────────────
Colocación de vidrio templado x1 — $15.000
Rubro: Vidriería | Unidad: unidad
Descripción: Colocación en puerta corrediza de oficina

Total: $15.000
Pagado: $15.000
Saldo: $0
─────────────────────────
```

---

## 🎨 Botones Principales

| Botón | Ubicación | Función |
|-------|-----------|---------|
| 💾 Guardar Plantilla | Ventas / Servicios | Guarda como plantilla reutilizable |
| ➕ Agregar al Carrito | Ventas | Agrega servicio al carrito y finaliza venta |
| 📋 Plantillas | Servicios | Pestaña para gestionar plantillas |
| 📚 Historial | Servicios | Pestaña con servicios individuales (legado) |
| Boleta | Tabla de ventas | Descarga PDF |
| Registrar Pago | Tabla de ventas | Agregar pago parcial |

---

## 💡 Consejos

1. **Crea plantillas para tus servicios frecuentes**
   - Colocación de vidrio
   - Armado de muebles
   - Reparación
   - Instalación

2. **Usa descripciones específicas en cada venta**
   - Medidas exactas
   - Ubicación
   - Características especiales

3. **Revisa las boletas antes de enviar**
   - La descripción está completa
   - El precio es correcto
   - El cliente está identificado

4. **Organiza plantillas por tipo**
   - Una para vidriería
   - Una para mueblería
   - Agrupa por tamaño o complejidad

---

**¡Listo! Ahora puedes crear, reutilizar y gestionar servicios de forma rápida y profesional.** ✓
