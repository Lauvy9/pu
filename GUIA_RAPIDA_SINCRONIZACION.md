# 🚀 Guía Rápida: Sincronización de Clientes desde Ventas

## ¿Qué es?

Los **clientes NO se guardan separadamente**. Se construyen automáticamente desde las ventas que realizas. Cuando creas una venta, el cliente aparece automáticamente en la vista de Clientes.

---

## 📍 Dónde Están

| Módulo | URL | Función |
|--------|-----|---------|
| **Ventas** | `/sales` | Crear y registrar ventas (normal o fiado) |
| **Clientes** | `/clientes` | Ver clientes sincronizados automáticamente |

---

## 🎯 Flujo de Sincronización

### 1. Crear Venta en Sales
```
Ir a Sales → Seleccionar cliente → Añadir productos → Crear venta
```

**Datos que se guardan en la venta:**
- Nombre del cliente
- Teléfono / Email
- Productos comprados (items)
- Total y pagos
- Si es fiado: fecha de vencimiento, pagos registrados

### 2. Cliente Aparece Automáticamente en Clientes
```
Ir a Clientes → Ver cliente con todos sus detalles
```

---

## 🎨 Vistas en Clientes

### 📊 **Resumen**
- ✅ Todos los clientes
- ✅ Cards con totales globales
- ✅ Información de contacto
- ✅ Deuda y pagos

**Cómo identificar un cliente con fiado:**
- 🔸 Fondo ANARANJADO (pastel)
- ⚠️ Badge que dice "CON FIADO"
- 📍 Borde izquierdo naranja

**Cómo identificar un cliente al día:**
- 🟢 Fondo VERDE (pastel)
- ✓ Badge que dice "AL DÍA"
- 📍 Borde izquierdo verde

### ⚠️ **Con Fiado**
- Solo clientes con deuda pendiente
- Información de vencimiento
- Alertas si está vencido
- % de pago y monto restante

### ✓ **Al Día**
- Solo clientes sin deuda
- Información de compras
- Última fecha de compra
- Productos adquiridos

---

## 👁️ Ver Detalles de un Cliente

1. **Ir a Clientes** → Seleccionar una vista (Resumen, Con Fiado, etc.)
2. **Hacer clic en "▶ Detalles"** en cualquier cliente
3. Se abrirá una sección expandida con:
   - 📋 Datos de contacto completos
   - 💰 Resumen financiero (total comprado, pagado, adeudado)
   - ⚠️ Estado de fiado (si aplica)
   - 📊 Historial de compras
   - 🛍️ Ventas registradas (con detalles)
   - 📦 Productos comprados acumulados

---

## 🔄 ¿Qué Sucede Cuando...?

### ✏️ Creo una Venta Normal

```
Sales → Nueva venta → Cliente X → Total $1000
                                ↓
                    Clientes aparece Cliente X
                    - Fondo VERDE (al día)
                    - Total Comprado: $1000
                    - Adeudado: $0
```

### 🔸 Creo una Venta Fiado

```
Sales → Nueva venta → Tipo "Fiado" → Cliente Y → Total $500 → Vencimiento: 2026-02-20
                                                              ↓
                                        Clientes → Cliente Y aparece
                                        - Fondo ANARANJADO (fiado)
                                        - Total Comprado: $500
                                        - Adeudado: $500
                                        - Próximo Vencimiento: 2026-02-20
```

### 💸 Registro un Pago Inicial (en Fiado)

```
Sales → Crear fiado → Total $500 → Pago Inicial $200
                                    ↓
                        Clientes → Cliente
                        - Total Comprado: $500
                        - Pagado: $200
                        - Adeudado: $300
                        - % Pagado: 40%
```

### ➕ Hago Múltiples Compras del Mismo Cliente

```
Venta 1: Cliente A → $100
Venta 2: Cliente A → $200
Venta 3: Cliente A → $150
         ↓
Clientes → Cliente A
- Compras: 3
- Total Comprado: $450
- Última Compra: Hoy
```

### ✅ Cliente Paga Completamente

```
Fiado de $500 → Pago $500
                ↓
Clientes → Cliente
- Pasa de FIADO (anaranjado) a AL DÍA (verde)
- Adeudado: $0
```

---

## 🚨 Indicadores Visuales

### Colores por Estado

| Color | Significa | Acción |
|-------|-----------|--------|
| 🟠 Anaranjado | Fiado activo | Ver detalles, hacer seguimiento |
| 🟢 Verde | Al día | Sin acción inmediata |
| 🔴 Rojo texto | Adeudado | Indica monto pendiente |

### Badges

| Badge | Significado |
|-------|-------------|
| ⚠️ CON FIADO | Cliente tiene deuda |
| ✓ AL DÍA | Cliente sin deuda |
| ⚠️ Vencido | Superó fecha de vencimiento |
| ⏰ Próximo a vencer | Vence en 3 días o menos |

---

## 📊 Información Disponible por Cliente

### Datos de Contacto
- Nombre
- Teléfono (clickeable para llamar)
- Email (clickeable para enviar)
- Dirección

### Financiero
- **Total Comprado**: Suma de todas sus compras
- **Total Pagado**: Suma de todos sus pagos
- **Adeudado**: Total Comprado - Total Pagado
- **% Pagado**: Porcentaje de lo pagado vs total comprado

### Historial
- Cantidad de compras
- Fecha de última compra
- Productos comprados (con cantidades)

### Si es Fiado
- Primer pago (fecha)
- Próximo vencimiento (fecha)
- Días al vencimiento
- Estado: Vencido / Próximo a vencer / Al día

---

## 💡 Tips Útiles

### 🔍 Buscar un Cliente
Actualmente no hay búsqueda en la tabla, pero puedes:
1. Filtra por vista (Resumen, Con Fiado, Al Día)
2. Desplázate por la tabla
3. Usa Ctrl+F del navegador para buscar por nombre

### 📄 Exportar PDF
- Solo disponible para clientes con FIADO
- Botón "📄 PDF" en cada fila
- Genera reporte con detalles de deuda

### 🔄 Sincronización en Tiempo Real
- No necesitas actualizar la página
- Si creas una venta en otra pestaña, se sincroniza automáticamente
- Los cálculos se actualizan al instante

### ⚡ Performance
- Funciona rápido incluso con 1000+ clientes
- Sin lag ni demoras
- Todos los cálculos se hacen en el navegador

---

## ❌ Limitaciones Actuales

| Limitación | Workaround |
|-----------|-----------|
| No se pueden editar datos de cliente directamente en Clientes | Editar en Sales cuando creas una venta |
| No hay búsqueda en la tabla | Usar Ctrl+F del navegador |
| No hay historial de pagos detallado en Clientes | Ver en Sales → detalles de venta → payments[] |
| No hay gráficos de deuda | Próxima fase de desarrollo |

---

## 🧪 Casos de Prueba Recomendados

### Test 1: Cliente Normal
```
1. Sales → Crear venta: Cliente "Juan" → $500
2. Clientes → Resumen
3. Verificar: Juan aparece con fondo VERDE
```

### Test 2: Cliente Fiado sin Pagar
```
1. Sales → Crear fiado: Cliente "María" → $1000 → Vencimiento 2026-02-28
2. NO registrar pago inicial
3. Clientes → Con Fiado
4. Verificar: María con fondo ANARANJADO, adeudado $1000
```

### Test 3: Fiado con Pago Parcial
```
1. Sales → Crear fiado: Cliente "Pedro" → $1000 → Pago Inicial $400
2. Clientes → Con Fiado
3. Verificar: Pedro, pagado $400, adeudado $600, % 40%
```

### Test 4: Mismo Cliente Múltiples Ventas
```
1. Sales → Crear venta: Cliente "Ana" → $200
2. Sales → Crear venta: Cliente "Ana" → $300
3. Clientes → Resumen
4. Verificar: Ana con compras: 2, total $500, última compra hoy
```

### Test 5: Cliente Paga Completamente
```
1. Sales → Crear fiado: Cliente "Luis" → $1000 → Pago $1000
2. Clientes → Resumen
3. Verificar: Luis pasa a fondo VERDE, adeudado $0, 100% pagado
```

---

## 🎓 Conceptos Clave

### Fuente Única de Verdad
- Los datos de cliente vienen SOLO de las ventas
- No se almacena información separada
- Si borro una venta, el cliente desaparece (si no tiene más compras)

### Normalización
- Agrupa vendas del mismo cliente por:
  1. clienteFiado.id (si existe)
  2. Email
  3. Nombre + Teléfono
  
### Cálculo de Deuda
```
Adeudado = Total Comprado - Total Pagado

Si Adeudado > 0:
  - Cliente es "FIADO" (fondo anaranjado)
Si Adeudado = 0:
  - Cliente es "AL DÍA" (fondo verde)
```

### Próximo Vencimiento
- Se calcula buscando la fecha de vencimiento más cercana
- Entre todas las ventas fiadas del cliente
- Que aún tenga deuda pendiente

---

## 📞 Soporte

Si algo no funciona como se espera:

1. **Verifica que la venta se guardó** en Sales
2. **Recarga la página** (Ctrl+R o Cmd+R)
3. **Revisa la consola** (F12 → Console) para ver errores
4. **Busca en**: `SINCRONIZACION_CLIENTES.md` para más detalles técnicos

---

## 🚀 Próximas Funcionalidades

- [ ] Búsqueda de clientes
- [ ] Filtros avanzados
- [ ] Gráficos de deuda
- [ ] Recordatorios de vencimiento
- [ ] Score de cliente
- [ ] Historial de pagos expandible
- [ ] Límite de crédito por cliente

---

**Última actualización:** 10 de febrero de 2026  
**Versión:** 1.0 - Sincronización Inicial
