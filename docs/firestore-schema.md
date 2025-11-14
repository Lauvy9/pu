% Esquema Firestore para Sistema Vidriería/Carpintería

Este documento resume las colecciones y la forma de los documentos propuesta para el sistema. Está basado en el prompt del producto y sirve como referencia para la implementación y para crear índices y reglas.

---

## Colecciones principales

- `usuarios` (document id sugerido: `uid` de Firebase Auth)

```json
{
  "email": "usuario@empresa.com",
  "rol": "admin", // "admin" | "vendedor"
  "fechaCreacion": "timestamp",
  "activo": true
}
```

- `clientes`

```json
{
  "nombre": "Juan Pérez",
  "telefono": "555-1234",
  "email": "juan@email.com",
  "direccion": "Calle 123",
  "fechaRegistro": "timestamp",
  "credito": {
    "limite": 5000,
    "saldoActual": 1500,
    "fechaLimitePago": "2024-04-15",
    "scoreCrediticio": 4,
    "historialPagos": [
      { "fechaVencimiento": "2024-03-15", "fechaPago": "2024-03-14", "monto": 1200, "diasRetraso": -1 }
    ]
  }
}
```

- `productos` (también se pueden guardar servicios con `categoria: 'servicio'`)

```json
{
  "nombre": "Vidrio templado 6mm",
  "categoria": "vidrio",
  "costo": 150,
  "precios": {
    "porcentajeGananciaMinorista": 30,
    "porcentajeGananciaMayorista": 20,
    "precioMinorista": 195,
    "precioMayorista": 180
  },
  "oferta": {
    "activa": true,
    "precioOferta": 175,
    "fechaInicio": "2024-04-01",
    "fechaFin": "2024-04-30"
  },
  "stock": 25,
  "estadoStock": "normal"
}
```

- `presupuestos`

```json
{
  "idCliente": "cliente_id",
  "clienteInfo": { "nombre": "...", "telefono": "...", "email": "..." },
  "items": [
    { "productoId": "producto_id", "descripcion": "Vidrio templado 6mm", "cantidad": 2, "precioUnitario": 195, "importe": 390 }
  ],
  "calculos": { "subtotal": 780, "descuento": 0, "total": 780, "porcentajeGanancia": 30 },
  "estado": "pendiente", // pendiente | aprobado | rechazado
  "metodoPago": "efectivo", // efectivo | transferencia | credito
  "cuentaTransferencia": { "banco": "Banco X", "titular": "Juan Pérez", "numero": "123456" },
  "fechaCreacion": "timestamp",
  "fechaVencimiento": "2024-04-20"
}
```

- `ventas`

```json
{
  "idPresupuesto": "presupuesto_id",
  "estados": {
    "pago": "pendiente", // pendiente | pagado | parcial
    "entrega": "pendiente" // pendiente | entregado | parcial
  },
  "fechaPago": null,
  "fechaEntrega": null,
  "comprobanteUrl": "https://storage.googleapis.com/.../factura123.pdf"
}
```

- `pagos` (colección para registrar movimientos de cobro)

```json
{
  "ventaId": "venta_id",
  "monto": 1200,
  "metodo": "efectivo", // efectivo | transferencia | tarjeta
  "fecha": "timestamp",
  "referencia": "opcional"
}
```

- `reportes` (opcional, para agregados diarios/semana/mes)

```json
{
  "fecha": "2024-04-10",
  "ventasTotales": 12500,
  "gananciasNetas": 3750,
  "gastos": 2200,
  "clientesAtendidos": 8,
  "productosVendidos": 15,
  "morosidad": 1200
}
```

---

## Notas de diseño

- Recomendación: usar el `uid` de Firebase Auth como id del documento en `usuarios` para relacionar fácilmente la sesión autenticada con el documento de rol.
- Para `presupuestos` y `ventas` conviene guardar un snapshot del cliente y los precios en el documento para mantener integridad histórica.
- Para consultas agregadas (reportes) podemos usar Cloud Functions o ejecutar jobs periódicos que escriban en `reportes`.

---

## Indices sugeridos

- `presupuestos` por `fechaCreacion`
- `ventas` por `fechaPago` y por `estados.pago`
- `clientes` por `credito.saldoActual`

---

Guardar este documento en `docs/firestore-schema.md` sirve como guía durante la implementación.
