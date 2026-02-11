import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import Cart from '../components/Cart';
import { buildClientsFromSales } from '../utils/clientHelpers'
import { formatCurrency, toLocalYMD } from '../utils/helpers';
import { addMonthsLocal, parseToLocalDate } from '../utils/dateHelpers'
import PaymentModal from '../components/PaymentModal'
import './Sales.css'
// Link removed: antiguo enlace a Crear Presupuesto eliminado
import { exportSalePDF } from '../utils/salePdfExport'

export default function Sales() {
  const { products, services, serviceTemplates, bankAccounts, actions, sales, fiados, company } = useStore();
  const [ofertas, setOfertas] = useState(() => { try { const raw = localStorage.getItem('vid_ofertas'); return raw ? JSON.parse(raw) : [] } catch (e) { return [] } })

  const [query, setQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // all | products | services
  const [cart, setCart] = useState([]);
  const [saleType, setSaleType] = useState('minorista');
  const [metodoPago, setMetodoPago] = useState('');
  const [businessUnit, setBusinessUnit] = useState(''); // 'muebleria' | 'vidrieria'
  const [contactMode, setContactMode] = useState('phone'); // phone | email | both
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [nuevoCliente, setNuevoCliente] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefonoInput, setClienteTelefonoInput] = useState('');
  const [clienteEmailInput, setClienteEmailInput] = useState('');
  const [clienteAddress, setClienteAddress] = useState('');
  const [saveClient, setSaveClient] = useState(false);
  // (Presupuestos: moved to dedicated form and route)
  const [cartAccent, setCartAccent] = useState(() => (typeof window !== 'undefined' && localStorage.getItem('cart_accent')) || '#ff9800');

  // Estados para creación rápida de servicios con plantillas
  const [selectedServiceTemplateId, setSelectedServiceTemplateId] = useState('');
  const [svcNombre, setSvcNombre] = useState('');
  const [svcTipo, setSvcTipo] = useState('vidrieria'); // unidad de negocio
  const [svcUnidad, setSvcUnidad] = useState('unidad'); // unidad de cobro
  const [svcMonto, setSvcMonto] = useState(0);
  const [svcDescripcion, setSvcDescripcion] = useState('');
  const [svcSaveAsTemplate, setSvcSaveAsTemplate] = useState(false);

  // Estados de fiado / pagos
  const [fechaFiado, setFechaFiado] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [plazoMeses, setPlazoMeses] = useState(0);
  const [pagoInicial, setPagoInicial] = useState(0);

  // Estados de cuentas / bancos
  const [selectedBankId, setSelectedBankId] = useState("");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newBankName, setNewBankName] = useState("");
  const [newBankType, setNewBankType] = useState("Cuenta Corriente");
  const [newBankNumber, setNewBankNumber] = useState("");
  const [newBankHolder, setNewBankHolder] = useState("");

  // Cargar estado del carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('currentCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // (Presupuestos: moved to dedicated form and route)

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('currentCart', JSON.stringify(cart));
  }, [cart]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const prodMatches = products
      .filter(p => p.name && p.name.toLowerCase().includes(q))
      .map(p => ({ ...p, _kind: 'product' }));
    const servMatches = (services || [])
      .filter(s => (s.name || '').toLowerCase().includes(q))
      .map(s => ({ ...s, _kind: 'service', name: s.name, price: s.price }));

    if (searchFilter === 'products') return prodMatches;
    if (searchFilter === 'services') return servMatches;
    return [...prodMatches, ...servMatches];
  }, [products, services, query, searchFilter]);

  function addToCart(item) {
    // item may be a product or a service (we normalized name/price in filtered)
    const isService = item._kind === 'service';
    const basePrice = isService ? (item.price || item.precio || 0) : (saleType === 'mayorista' ? (item.price_mayor ?? item.price ?? item.cost ?? 0) : (item.price_minor ?? item.price ?? item.cost ?? 0));
    const id = isService ? `svc_${item.id}` : item.id;

    // buscar oferta activa
    const oferta = (ofertas || []).find(o => String(o.id) === String(item.id) && o.activo);
    const ofertaPct = oferta ? Number(oferta.ofertaPct || oferta.ofertaPct || 0) : 0
    const offerPrice = oferta ? Number((basePrice * (1 - ofertaPct / 100)).toFixed(2)) : null

    setCart(prev => {
      const exist = prev.find(i => i.id === id);
      // If product, validate stock: total requested (existing qty + 1) <= product.stock
      if (!isService) {
        const prod = products.find(p => p.id === item.id);
        const existingQty = exist ? Number(exist.qty || 0) : 0;
        const currentStock = prod ? (prod.stock || 0) : 0;
        const totalRequested = existingQty + 1;
        if (totalRequested > currentStock) {
          const available = Math.max(0, currentStock - existingQty);
          alert(`No hay stock suficiente para ${item.name}. Stock disponible: ${currentStock}, Ya en carrito: ${existingQty}, Puedes agregar: ${available}`);
          return prev;
        }
      }
      const newItem = {
        id,
        name: item.name,
        qty: 1,
        // price used for calculations in cart (default to basePrice)
        price: basePrice,
        basePrice,
        offerPrice: offerPrice,
        isOnOffer: !!offerPrice,
        useOfferPrice: false,
        discountPct: ofertaPct || 0,
        kind: isService ? 'service' : 'product',
        // Agregar datos de servicio para boleta y tabla
        tipoServicio: isService ? (item.tipoServicio || item.tipo || 'vidrieria') : undefined,
        descripcion: isService ? (item.descripcion || item.description || '') : undefined,
        unidad: isService ? (item.unidad || 'unidad') : undefined
      };
      const newCart = exist
        ? prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, newItem];
      return newCart;
    });
  }

  function toggleOfferInCart(id) {
    setCart(prev => prev.map(it => it.id === id ? { ...it, useOfferPrice: !it.useOfferPrice } : it))
  }

  const total = cart.reduce((s, i) => {
    const unit = (i.useOfferPrice && i.offerPrice) ? i.offerPrice : (i.basePrice ?? i.price ?? 0)
    return s + (Number(unit || 0) * Number(i.qty || 0))
  }, 0);

  // Normalizar ventas para evitar registros nulos que rompan el render
  const salesSafe = useMemo(() => (Array.isArray(sales) ? sales.filter(Boolean) : []), [sales])

  // FIADO helpers (solo lectura en UI)
  const fiadoMontoAdeudado = useMemo(() => {
    if (saleType !== 'fiado') return 0
    const pagoInicialNum = Number(pagoInicial || 0)
    return Math.max(0, Number(total || 0) - pagoInicialNum)
  }, [saleType, pagoInicial, total])

  // Función para determinar el color de fondo de la fila
  const getRowBackground = (sale) => {
    // Nuevo esquema de colores:
    // Presupuesto pendiente
    if (sale.isPresupuesto || sale.type === 'presupuesto' || sale.status === 'budget') return '#2196F3'; // Azul
    // Pendiente de pago
    if (!sale.pagado) return '#F44336'; // Rojo
    // Pagado (pero no entregado)
    if (sale.pagado && !sale.entregado) return '#FFEB3B'; // Amarillo
    // Pagado y entregado
    if (sale.pagado && sale.entregado) return '#4CAF50'; // Verde
    return 'transparent';
  };

  // Manejar selección de plantilla de servicio
  function handleServiceTemplateSelect(templateId) {
    setSelectedServiceTemplateId(templateId);
    const template = (serviceTemplates || []).find(t => t.id === templateId);
    if (template) {
      setSvcNombre(template.nombre || '');
      setSvcTipo(template.tipoServicio || 'vidrieria');

      setSvcMonto(template.precio || 0);
      // La descripción NO se autocompleta, debe ingresarse manualmente para cada venta
      setSvcDescripcion('');
    }
  }

  // Guardar descripción base de la plantilla
  function handleSaveServiceTemplate() {
    if (!svcNombre) return alert('Ingresá un nombre para la plantilla');
    if (svcMonto <= 0) return alert('Ingresá un precio válido');

    const template = {
      nombre: svcNombre,
      tipoServicio: svcTipo,
      precio: svcMonto,

      descripcionBase: svcDescripcion || ''
    };

    const saved = actions.addServiceTemplate(template);
    alert(`Plantilla "${svcNombre}" guardada`);
    setSelectedServiceTemplateId(saved.id);
  }

  async function finish() {
    if (cart.length === 0) return alert('El carrito está vacío');
    if (!metodoPago && saleType !== 'fiado') return alert('Seleccioná un método de pago');
    if (metodoPago === 'transferencia' && !selectedBankId) return alert('Seleccioná una cuenta bancaria para transferencia');

    const itemsDetailed = cart.map(it => {
      // si es servicio el id viene con prefijo svc_
      const prodId = typeof it.id === 'string' && it.id.startsWith('svc_') ? parseInt(it.id.replace('svc_', '')) : it.id;
      const prod = products.find(p => p.id === prodId);
      const cost = prod?.cost || 0;
      const precioUnitarioUsado = (it.useOfferPrice && it.offerPrice) ? it.offerPrice : (it.basePrice ?? it.price ?? 0);
      const esOferta = !!(it.isOnOffer && it.useOfferPrice);
      const porcentajeDescuento = it.discountPct || 0;
      return {
        id: it.id,
        name: it.name,
        qty: it.qty,
        price: precioUnitarioUsado,
        precioUnitarioUsado,
        esOferta,
        porcentajeDescuento,
        type: saleType,
        cost,
        // Incluir datos de servicio para boleta y tabla
        tipoServicio: it.tipoServicio || undefined,
        descripcion: it.descripcion || undefined,
        unidad: it.unidad || undefined
      };
    });

    // preparar snapshot de cliente según selección o inputs para guardar contacto
    let clienteForContact = null
    if (clienteSeleccionado) {
      clienteForContact = fiados.find(ci => String(ci.id) === String(clienteSeleccionado))
    } else if (nuevoCliente) {
      clienteForContact = { nombre: nuevoCliente, telefono: clienteTelefonoInput || '', email: clienteEmailInput || '', direccion: clienteAddress || '' }
    } else if (clienteNombre) {
      clienteForContact = { nombre: clienteNombre, telefono: clienteTelefonoInput || '', email: clienteEmailInput || '', direccion: clienteAddress || '' }
    }

    // Determinar unidad de negocio de la venta: PRIORIZAR selector manual `businessUnit`.
    // Si no hay selección, intentar inferir desde los productos (si todos comparten la misma unidad).
    const productUnits = new Set()
    itemsDetailed.forEach(it => {
      try {
        const isService = typeof it.id === 'string' && it.id.startsWith('svc_')
        if (!isService) {
          const prodId = it.id
          const prod = products.find(p => String(p.id) === String(prodId))
          const unit = prod && (prod.businessUnit || prod.unit || prod.businessUnit)
          if (unit) productUnits.add(unit)
        }
      } catch (e) { }
    })
    // Preferir explicitamente el selector del usuario
    let inferredUnit = businessUnit || undefined
    if (!inferredUnit) {
      if (productUnits.size === 1) inferredUnit = Array.from(productUnits)[0]
      // si hay múltiples unidades entre items y no hay selección, inferredUnit queda undefined
    }

    const sale = {
      id: 's_' + Date.now(),
      date: new Date().toISOString(),
      items: itemsDetailed,
      total,
      profit: cart.reduce((s, i) => {
        const prodId = typeof i.id === 'string' && i.id.startsWith('svc_') ? parseInt(i.id.replace('svc_', '')) : i.id;
        const prod = products.find(p => p.id === prodId);
        const unit = (i.useOfferPrice && i.offerPrice) ? i.offerPrice : ((i.basePrice ?? i.price) || 0);
        return s + ((Number(unit || 0) - (prod?.cost || 0)) * Number(i.qty || 0));
      }, 0),
      type: saleType,
      businessUnit: inferredUnit,
      metodoPago,
      bankAccountId: metodoPago === 'transferencia' ? selectedBankId : null,
      entregado: false,
      pagado: saleType !== 'fiado',
      clienteFiado: saleType === 'fiado' ? (clienteSeleccionado || nuevoCliente) : null,
      // FIADO flags (se usan para UI y sincronizacion con Clientes)
      isFiado: saleType === 'fiado',
      deudaEstado: saleType === 'fiado' ? 'Si' : 'No',
      montoEntregado: saleType === 'fiado' ? Number(pagoInicial || 0) : 0,
      montoAdeudado: saleType === 'fiado' ? Math.max(0, Number(total || 0) - Number(pagoInicial || 0)) : 0,
      customer: {
        name: clienteForContact?.nombre || clienteNombre || nuevoCliente || '',
        phone: clienteForContact?.telefono || clienteTelefonoInput || '',
        email: clienteForContact?.email || clienteEmailInput || '',
        address: clienteForContact?.direccion || clienteAddress || '',
        barrio: clienteForContact?.barrio || undefined
      },
      clienteContacto: (function () {
        if (!clienteForContact) return null
        const c = clienteForContact
        const contact = { mode: contactMode, nombre: c.nombre || nuevoCliente }
        if (contactMode === 'phone') contact.value = c.telefono || c.phone || ''
        else if (contactMode === 'email') contact.value = c.email || ''
        else contact.value = { telefono: c.telefono || '', email: c.email || '' }
        return contact
      })()
    };



    // Guardar siempre el cliente (independientemente del método de pago) y sincronizar con fiados
    // Normalizar / crear cliente en fiados si aplica, ANTES de crear entries / payments
    let client = null;
    try {
      if (clienteForContact) {
        const normalizedPhone = (clienteForContact.telefono || clienteTelefonoInput || '')
          .toString()
          .replace(/\D/g, '');
        const normalizedEmail = (clienteForContact.email || clienteEmailInput || '')
          .toString()
          .trim()
          .toLowerCase();
        const normalizedName = (clienteForContact.nombre || clienteNombre || nuevoCliente || '')
          .toString()
          .trim();

        // intentar localizar en fiados
        client = (fiados || []).find(c => {
          const cPhone = (c.telefono || '').toString().replace(/\D/g, '');
          const cEmail = (c.email || '').toString().trim().toLowerCase();
          const cName = (c.nombre || '').toString().trim().toLowerCase();
          if (normalizedEmail && cEmail && normalizedEmail === cEmail) return true;
          if (normalizedPhone && cPhone && normalizedPhone === cPhone) return true;
          if (normalizedName && cName && normalizedName === cName) return true;
          return false;
        });

        if (client) {
          const patch = {};
          if (normalizedName) patch.nombre = normalizedName;
          if (normalizedPhone) patch.telefono = normalizedPhone;
          if (normalizedEmail) patch.email = normalizedEmail;
          patch.fechaActualizado = new Date().toISOString();
          // actualizar cliente en store (no await necesario si acción es síncrona)
          try { actions.updateFiadoClient(client.id, patch); } catch (e) { console.warn('updateFiadoClient failed', e) }
        } else {
          const nuevo = {
            id: Date.now(),
            nombre: normalizedName || 'Cliente',
            telefono: normalizedPhone || '',
            email: normalizedEmail || '',
            direccion: clienteAddress || '',
            fechaRegistro: new Date().toISOString(),
            limiteCredito: 0,
            movimientos: [],
            deuda: 0
          };
          try {
            const added = actions.addFiadoClient(nuevo);
            // Si la acción devuelve el cliente, úsalo, si no asumimos el objeto creado
            client = added && added.id ? added : nuevo;
          } catch (e) {
            console.warn('addFiadoClient failed', e);
            client = nuevo;
          }
        }
      }
    } catch (e) {
      console.warn('Guardar/actualizar cliente falló', e);
    }

    // Si es fiado, gestionar entry y pago inicial (AHORA que tenemos client)
    if (saleType === 'fiado') {
      const pagoInicialNum = Number(pagoInicial || 0)
      sale.payments = []

      // calcular entryAmount (deuda restante)
      const entryAmount = Math.max(0, Number(total) - pagoInicialNum)
      let entry = null

      // calcular dueDate consistente
      let computedDue = null
      try {
        if (fechaVencimiento) {
          computedDue = fechaVencimiento
        } else if (Number(plazoMeses) && Number(plazoMeses) > 0) {
          const fv = parseToLocalDate(fechaFiado)
          const dueDateObj = addMonthsLocal(fv, Number(plazoMeses))
          computedDue = toLocalYMD(dueDateObj)
        }
      } catch (e) {
        computedDue = fechaVencimiento || null
      }

      // setear dueDate base en la venta (se confirma luego si hay entry)
      if (computedDue) sale.dueDate = computedDue

      // crear entry si hay deuda
      if (client && entryAmount > 0) {
        try {
          const resEntry = actions.addFiadoEntry(client.id, {
            amount: entryAmount,
            originalAmount: Number(total),
            dateTaken: fechaFiado,
            dueDate: computedDue || null,
            note: `Venta ${sale.id}`,
            saleId: sale.id
          })
          // actions.addFiadoEntry ideally returns the entry; if no return, keep null-safe usage
          entry = resEntry && resEntry.id ? resEntry : (resEntry || null)
          if (entry && entry.dueDate) sale.dueDate = entry.dueDate
        } catch (e) {
          console.warn('addFiadoEntry failed', e)
        }
      } else if (computedDue) {
        // if no entry (because payment covers total) still attach dueDate if provided (helps UI)
        sale.dueDate = computedDue || null
      }

      // registrar pago inicial (si existe)
      if (pagoInicialNum > 0 && client) {
        const paymentToRegister = {
          id: 'p_' + Date.now(),
          amount: Number(pagoInicialNum),
          method: metodoPago || 'efectivo',
          accountId: selectedBankId || null,
          date: fechaFiado || new Date().toISOString(),
          note: `Pago inicial venta ${sale.id}`
        }

        // intentar registrar y await para asegurar persistencia en store
        try {
          const res = await actions.registerFiadoPayment(client.id, entry && entry.id ? entry.id : null, { ...paymentToRegister, saleId: sale.id })
          // si la acción devolvió ok, añadimos al snapshot de la venta el pago
          if (res && res.ok) {
            sale.payments.push(paymentToRegister)
          } else {
            // fallback: igualmente añadimos al snapshot para que la UI muestre el pago temporalmente
            console.warn('registerFiadoPayment returned not ok:', res)
            sale.payments.push(paymentToRegister)
          }
        } catch (e) {
          console.warn('registerFiadoPayment exception', e)
          // agregar al snapshot para visibilidad; persistencia puede fallar y requerir reintento manual
          sale.payments.push(paymentToRegister)
        }
      }

      // recalcular pagado a partir de payments del snapshot (puede ser parcial)
      const totalPagadoEnSale = (sale.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
      sale.pagado = totalPagadoEnSale >= Number(total)
      // actualizar estado de deuda segun pagos reales
      const restante = Math.max(0, Number(total || 0) - totalPagadoEnSale)
      sale.deudaEstado = restante > 0 ? 'Si' : 'No'
      sale.montoEntregado = totalPagadoEnSale
      sale.montoAdeudado = restante

      // referenciar cliente id en la venta si hay client
      if (client && client.id) {
        sale.clienteFiado = client.id
      }
    }

    // Finalmente registrar la venta (después de haber creado/actualizado cliente y entrada de fiado con saleId)
    try {
      const reg = await actions.registerSale(sale);
      // opcional: si actions.registerSale devuelve un objeto actualizado, podríamos usarlo
    } catch (e) { console.warn('Registrar venta falló', e) }

    // Limpiar carrito y localStorage
    setCart([]);
    localStorage.removeItem('currentCart');
    setClienteSeleccionado('');
    setNuevoCliente('');
    setClienteNombre('');
    setClienteTelefonoInput('');
    setClienteEmailInput('');
    setSelectedBankId('');
    alert('Venta registrada');
  }

  async function toggleEntrega(id) {
    const sale = sales.find(s => s.id === id);
    const newEstado = !sale.entregado;
    const entregadoAt = newEstado ? new Date().toISOString() : null;
    try {
      addLoading(id)
      // Actualizar en el contexto/Store (incluye timestamp si se marca entregado)
      await actions.registerSaleStateChange(id, { entregado: newEstado, ...(entregadoAt ? { entregadoAt } : {}) });
    } finally { removeLoading(id) }

    // Si es fiado y se marca como entregado, actualizar en clientes también
    if (sale.type === 'fiado' && sale.clienteFiado) {
      const clienteId = typeof sale.clienteFiado === 'string' ? parseInt(sale.clienteFiado) : sale.clienteFiado;
      const cliente = (fiados || []).find(c => c.id === clienteId)
      if (cliente) {
        const movimiento = (cliente.movimientos || []).find(m => m.saleId === id)
        if (movimiento) {
          actions.updateFiadoEntry(cliente.id, movimiento.id, { entregado: newEstado, ...(entregadoAt ? { entregadoAt } : {}) })
        }
      }
    }
  }

  async function togglePago(id) {
    const sale = sales.find(s => s.id === id);
    const newEstado = !sale.pagado;
    try {
      addLoading(id)
      // Actualizar en el contexto/Store
      await actions.registerSaleStateChange(id, { pagado: newEstado });
    } finally { removeLoading(id) }

    // Si es fiado y se marca como pagado, actualizar en clientes también
    if (sale.type === 'fiado' && sale.clienteFiado) {
      const clienteId = typeof sale.clienteFiado === 'string' ? parseInt(sale.clienteFiado) : sale.clienteFiado;
      const cliente = (fiados || []).find(c => c.id === clienteId)
      if (cliente) {
        const movimiento = (cliente.movimientos || []).find(m => m.saleId === id)
        if (movimiento) {
          actions.updateFiadoEntry(cliente.id, movimiento.id, { pagado: newEstado })
        }
      }
    }
  }

  const getRowStateClass = (sale) => {
    if (sale.isPresupuesto || sale.type === 'presupuesto' || sale.status === 'budget') return 'state-blue'
    if (!sale.pagado) return 'state-red'
    if (sale.pagado && !sale.entregado) return 'state-yellow'
    if (sale.pagado && sale.entregado) return 'state-green'
    return ''
  }

  // --- Edición/Eliminación de ventas
  const [editingSale, setEditingSale] = useState(null)
  const [editQuery, setEditQuery] = useState('')
  const [editSelectedId, setEditSelectedId] = useState('')
  const [editSelectedQty, setEditSelectedQty] = useState(1)
  const [editOriginalItems, setEditOriginalItems] = useState([])
  // Estados para registrar pagos parciales desde la fila de venta (opción C)
  // guardamos solo el id de la venta y leemos la venta en tiempo real desde `sales`
  const [paymentModalSaleId, setPaymentModalSaleId] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [paymentAccountId, setPaymentAccountId] = useState('')

  // UI state: responsive view and loading indicators per-sale
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 480 : false)
  const [loadingIds, setLoadingIds] = useState([])

  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 480) }
    if (typeof window !== 'undefined') window.addEventListener('resize', onResize)
    return () => { if (typeof window !== 'undefined') window.removeEventListener('resize', onResize) }
  }, [])

  const addLoading = (id) => setLoadingIds(prev => Array.from(new Set([...(prev || []), id])))
  const removeLoading = (id) => setLoadingIds(prev => (prev || []).filter(x => x !== id))

  function handleDeleteSale(id) {
    if (!confirm('¿Eliminar esta venta? Esto revertirá el stock asociado.')) return;
    try {
      const res = actions.deleteSale(id)
      if (res && res.ok) {
        alert('Venta eliminada y stock revertido')
      } else {
        alert('No se pudo eliminar la venta')
      }
    } catch (e) { console.error(e); alert('Error al eliminar venta') }
  }

  function startEditSale(s) {
    // clonamos la venta para edición
    const copy = JSON.parse(JSON.stringify(s))
    setEditingSale(copy)
    // guardar snapshot de items originales para validaciones de stock
    setEditOriginalItems(JSON.parse(JSON.stringify(s.items || [])))
  }

  function cancelEditSale() { setEditingSale(null) }

  function changeEditItemQty(index, qty) {
    setEditingSale(prev => {
      const next = { ...prev }
      const it = next.items[index]
      if (!it) return prev
      // Validación: si es producto, no permitir qty > stock disponible + qty original en la venta
      const isService = String(it.id).startsWith('svc_')
      let newQty = Number(qty)
      if (!isService) {
        const rawId = Number(it.id)
        const prod = products.find(p => p.id === rawId)
        const original = (editOriginalItems || []).find(o => String(o.id) === String(it.id))
        const originalQty = original ? Number(original.qty || 0) : 0
        const allowedMax = (prod?.stock || 0) + originalQty
        if (newQty > allowedMax) {
          alert(`Cantidad máxima disponible para ${it.name} es ${allowedMax}`)
          newQty = allowedMax
        }
        if (newQty < 0) newQty = 0
      }
      next.items = next.items.map((it2, i) => i === index ? { ...it2, qty: Number(newQty) } : it2)
      // recalcular total
      next.total = next.items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.qty || 0)), 0)
      return next
    })
  }

  function removeEditItem(index) {
    setEditingSale(prev => {
      const next = { ...prev }
      next.items = next.items.filter((_, i) => i !== index)
      next.total = next.items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.qty || 0)), 0)
      return next
    })
  }

  function addItemToEditingSale() {
    if (!editSelectedId) return alert('Seleccioná un producto o servicio');
    const isService = String(editSelectedId).startsWith('svc_')
    const rawId = isService ? parseInt(String(editSelectedId).replace('svc_', '')) : parseInt(editSelectedId)
    let source = isService ? services : products
    const itemSrc = source.find(x => x.id === rawId)
    if (!itemSrc) return alert('Item no encontrado')
    const price = isService ? (itemSrc.price || itemSrc.precio || 0) : (editSalePriceForType(itemSrc))
    const newItem = {
      id: isService ? `svc_${itemSrc.id}` : itemSrc.id,
      name: isService ? (itemSrc.nombre || itemSrc.name) : itemSrc.name,
      qty: Number(editSelectedQty) || 1,
      price: Number(price) || 0,
      type: isService ? 'service' : 'product'
    }
    // Si es producto, validar contra stock disponible + cantidad original en la venta
    if (!isService) {
      const prod = products.find(p => p.id === rawId)
      const original = (editOriginalItems || []).find(o => String(o.id) === String(newItem.id))
      const originalQty = original ? Number(original.qty || 0) : 0
      const existingInEditing = (editingSale.items || []).find(i => String(i.id) === String(newItem.id))
      const existingQty = existingInEditing ? Number(existingInEditing.qty || 0) : 0
      const allowedMax = (prod?.stock || 0) + originalQty
      if ((existingQty + newItem.qty) > allowedMax) {
        const canAdd = Math.max(0, allowedMax - existingQty)
        if (canAdd <= 0) {
          alert(`No hay stock suficiente para ${newItem.name}. Máximo permitido: ${allowedMax}`)
          // reset selectors
          setEditSelectedId('')
          setEditSelectedQty(1)
          setEditQuery('')
          return
        }
        alert(`Solo se pueden agregar ${canAdd} unidades adicionales de ${newItem.name} (máx ${allowedMax})`)
        newItem.qty = canAdd
      }
    }

    setEditingSale(prev => {
      const next = { ...prev }
      const existingIdx = (next.items || []).findIndex(i => String(i.id) === String(newItem.id))
      if (existingIdx !== -1) {
        // sumar cantidades si ya existe
        next.items = (next.items || []).map((it, i) => i === existingIdx ? { ...it, qty: (Number(it.qty || 0) + Number(newItem.qty)) } : it)
      } else {
        next.items = [...(next.items || []), newItem]
      }
      next.total = next.items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.qty || 0)), 0)
      return next
    })
    // reset selectors
    setEditSelectedId('')
    setEditSelectedQty(1)
    setEditQuery('')
  }

  function editSalePriceForType(product) {
    // Use saleType of the original sale if present, otherwise use global saleType state
    const type = editingSale?.type || saleType
    if (type === 'mayorista') return product.price_mayor ?? product.price ?? product.cost ?? 0
    return product.price_minor ?? product.price ?? product.cost ?? 0
  }

  function saveEditedSale() {
    if (!editingSale) return;
    try {
      // recalcular profit (usar productos para costos)
      const profit = editingSale.items.reduce((s, i) => {
        const prodId = typeof i.id === 'string' && i.id.startsWith('svc_') ? parseInt(i.id.replace('svc_', '')) : i.id;
        const prod = products.find(p => p.id === prodId);
        return s + ((i.price - (prod?.cost || 0)) * i.qty);
      }, 0)
      const newSale = { ...editingSale, profit }
      const res = actions.updateSale(editingSale.id, newSale)
      if (res && res.ok) {
        alert('Venta actualizada y stock ajustado')
        setEditingSale(null)
      } else {
        alert('No se pudo actualizar la venta')
      }
    } catch (e) { console.error(e); alert('Error al guardar la venta editada') }
  }

  // La funcionalidad de enviar boleta por WhatsApp se ha removido.

  return (
    <div className="grid">
      {/* PANEL DE NUEVA VENTA */}
      <div className="card">
        <h3>Nueva venta</h3>



        {/* El enlace antiguo "Crear Presupuesto" fue removido; el flujo ahora está inline */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="input"
            placeholder="Buscar productos o servicios"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <select value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="input" style={{ width: 160 }}>
            <option value="all">Todos</option>
            <option value="products">Productos</option>
            <option value="services">Servicios</option>
          </select>
        </div>

        {/* Sugerencias en tiempo real */}
        {query && (
          <div style={{ marginTop: 8 }}>
            <strong>Resultados:</strong>
            <ul>
              {filtered.map(p => (
                <li key={p._kind + '_' + p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <div>
                    <strong>{p.name}</strong>
                    <div className="small">{p._kind === 'product' ? `Stock: ${p.stock}` : 'Servicio'}</div>
                  </div>
                  <div className="flex">
                    <div className="small" style={{ marginRight: 8 }}>
                      {formatCurrency(p._kind === 'product' ? (saleType === 'mayorista' ? p.price_mayor : p.price_minor) : p.price)}
                    </div>
                    <button className="btn" onClick={() => addToCart(p)} disabled={p._kind === 'product' && p.stock <= 0}>
                      Agregar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <label>Tipo de venta: </label>
          <select value={saleType} onChange={e => setSaleType(e.target.value)} className="input">
            <option value="minorista">Minorista</option>
            <option value="mayorista">Mayorista</option>
            <option value="fiado">Fiado</option>
          </select>


          <label style={{ marginLeft: 10 }}>Método de pago: </label>
          <select
            value={metodoPago}
            onChange={e => setMetodoPago(e.target.value)}
            className="input"
          >
            <option value="">Seleccionar</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
          {/* Si se seleccionó transferencia mostrar selector de cuentas y opción de agregar nuevas */}
          {metodoPago === 'transferencia' && (
            <div style={{ marginTop: 8, padding: 8, border: '1px solid #ddd', borderRadius: 6 }}>
              <label>Cuentas para transferencia:</label>
              <select className="input" value={selectedBankId} onChange={e => setSelectedBankId(e.target.value)}>
                <option value="">Seleccionar cuenta</option>
                {(bankAccounts || []).map(b => (
                  <option key={b.id} value={b.id}>{`${b.bankName} - ${b.type} ${b.number}`}</option>
                ))}
              </select>
              <div style={{ marginTop: 6 }}>
                <button className="btn" onClick={() => setShowAddAccount(!showAddAccount)}>
                  {showAddAccount ? 'Cancelar' : 'Agregar cuenta'}
                </button>
              </div>

              {showAddAccount && (
                <div style={{ marginTop: 8 }}>
                  <input className="input" placeholder="Banco" value={newBankName} onChange={e => setNewBankName(e.target.value)} />
                  <input className="input" placeholder="Tipo (Cuenta Corriente/Caja)" value={newBankType} onChange={e => setNewBankType(e.target.value)} />
                  <input className="input" placeholder="Número" value={newBankNumber} onChange={e => setNewBankNumber(e.target.value)} />
                  <input className="input" placeholder="Titular" value={newBankHolder} onChange={e => setNewBankHolder(e.target.value)} />
                  <div style={{ marginTop: 6 }}>
                    <button className="btn" onClick={() => {
                      if (!newBankName || !newBankNumber) return alert('Completa nombre y número');
                      const acc = actions.addBankAccount({ bankName: newBankName, type: newBankType, number: newBankNumber, holder: newBankHolder });
                      setSelectedBankId(acc.id);
                      setShowAddAccount(false);
                      setNewBankName(''); setNewBankNumber(''); setNewBankHolder('');
                    }}>Guardar cuenta</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {saleType === 'fiado' && (
          <div style={{ marginTop: 8, padding: 8, border: '1px solid #ccc', borderRadius: 6 }}>
            <h4>Cliente Fiado</h4>
            <select
              value={clienteSeleccionado}
              onChange={e => setClienteSeleccionado(e.target.value)}
              className="input"
            >
              <option value="">Seleccionar cliente existente</option>
              {(fiados || []).map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nuevo cliente"
              value={nuevoCliente}
              onChange={e => setNuevoCliente(e.target.value)}
              className="input"
              style={{ marginTop: 4 }}
            />
            <input className="input" placeholder="Dirección (opcional)" value={clienteAddress} onChange={e => setClienteAddress(e.target.value)} style={{ marginTop: 6 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1 }}>
                <label>Fecha (toma):</label>
                <input type="date" value={fechaFiado} onChange={e => setFechaFiado(e.target.value)} className="input" />
              </div>
              <div style={{ flex: 1 }}>
                <label>Fecha vencimiento:</label>
                <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} className="input" />
              </div>
              <div style={{ width: 160 }}>
                <label>Plazo (meses):</label>
                <input type="number" min={0} value={plazoMeses} onChange={e => setPlazoMeses(Number(e.target.value || 0))} className="input" />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <label>Pago inicial:</label>
              <input className="input" type="number" min={0} value={pagoInicial} onChange={e => setPagoInicial(Number(e.target.value || 0))} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1 }}>
                <label>Estado de deuda:</label>
                <input className="input" value="Si" readOnly />
              </div>
              <div style={{ flex: 1 }}>
                <label>Monto adeudado:</label>
                <input className="input" value={formatCurrency(fiadoMontoAdeudado)} readOnly />
              </div>
            </div>
          </div>
        )}

        {/* Inputs de contacto general (permitir guardar nombre/teléfono/email/dirección para cualquier venta) */}
        <div style={{ marginTop: 8, padding: 8, border: '1px dashed #eee', borderRadius: 6 }}>
          <h4>Contacto (opcional)</h4>
          <input className="input" placeholder="Nombre" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} />
          <input className="input" placeholder="Teléfono" value={clienteTelefonoInput} onChange={e => setClienteTelefonoInput(e.target.value)} />
          <input className="input" placeholder="Email" value={clienteEmailInput} onChange={e => setClienteEmailInput(e.target.value)} />
          <input className="input" placeholder="Dirección" value={clienteAddress} onChange={e => setClienteAddress(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={saveClient} onChange={e => setSaveClient(e.target.checked)} /> Guardar cliente
            </label>
            <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Color carrito</span>
              <input type="color" value={cartAccent} onChange={e => { setCartAccent(e.target.value); try { localStorage.setItem('cart_accent', e.target.value) } catch { } }} />
            </label>
          </div>
        </div>

        {/* Presupuestos deben crearse desde el menú Crear Presupuesto; no mostrar nada aquí */}

        <div style={{ marginTop: 12 }}>
          <h4>{searchFilter === 'services' ? 'Servicios' : 'Productos'}</h4>
          {searchFilter === 'services' && (
            <div style={{ marginTop: 8, padding: 10, border: '1px solid #ffe6f0', borderRadius: 6, background: '#fff0f6' }}>
              <h5>Registrar Servicio</h5>

              {/* SELECTOR DE PLANTILLAS DE SERVICIOS */}
              {(serviceTemplates || []).length > 0 && (
                <div style={{ marginBottom: 12, padding: 8, background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 4 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Plantilla de servicio (opcional)</label>
                  <select
                    className="input"
                    value={selectedServiceTemplateId}
                    onChange={e => {
                      const id = e.target.value;
                      if (id) handleServiceTemplateSelect(id);
                      else setSelectedServiceTemplateId('');
                    }}
                  >
                    <option value="">Crear servicio nuevo...</option>
                    {(serviceTemplates || []).filter(t => t.activo).map(t => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} — {formatCurrency(t.precio)} ({t.unidad})
                      </option>
                    ))}
                  </select>
                  <div className="small" style={{ marginTop: 4, color: '#666' }}>
                    Selecciona una plantilla para autocompletar los datos
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {/* Nombre del servicio */}
                <input
                  className="input"
                  placeholder="Servicio a ofrecer (ej: Colocación de vidrio)"
                  value={svcNombre}
                  onChange={e => setSvcNombre(e.target.value)}
                />

                {/* Tipo de servicio */}
                <select
                  className="input"
                  value={svcTipo}
                  onChange={e => setSvcTipo(e.target.value)}
                >
                  <option value="vidrieria">Vidriería</option>
                  <option value="muebleria">Mueblería</option>
                </select>

               
                {/* Monto */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontWeight: 600,
                      lineHeight: "1",
                      marginTop: "-9px"
                    }}
                  >
                    $
                  </span>
                  <input
                    className="input"
                    type="number"
                    value={svcMonto}
                    onChange={e => setSvcMonto(Number(e.target.value || 0))}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {/* Descripción */}
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85em', color: '#666' }}>
                  Descripción detallada del trabajo (se completa para esta venta específicamente)
                </label>
                <textarea
                  className="input"
                  placeholder="Ej: Colocación de vidrio laminado en ventana frontal"
                  value={svcDescripcion}
                  onChange={e => setSvcDescripcion(e.target.value)}
                  style={{ minHeight: 80 }}
                />
              </div>

              {/* Botones de acción */}
              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'flex-end'
                }}
              >
                {/* Guardar como plantilla */}
                <button
                  className="btn"
                  onClick={handleSaveServiceTemplate}
                  style={{ background: '#9c27b0' }}
                  title="Guardar como plantilla reutilizable"
                >
                  💾 Guardar Plantilla
                </button>

                {/* Finalizar venta */}
                <button
                  className="btn"
                  onClick={async () => {
                    if (!svcMonto || svcMonto <= 0) return alert('Ingresá el monto');
                    try {
                      // Crear el servicio temporalmente en el store (sin plantilla)
                      const service = await actions.addService({
                        name: svcNombre || (svcTipo === 'vidrieria' ? 'Servicio Vidriería' : 'Servicio Mueblería'),
                        price: Number(svcMonto),
                        tipoServicio: svcTipo,
                        unidad: svcUnidad,
                        descripcion: svcDescripcion
                      });

                      // Agregar al carrito automáticamente con todos los datos
                      addToCart({
                        ...service,
                        _kind: 'service',
                        name: service.name || svcNombre,
                        price: service.price || Number(svcMonto),
                        tipoServicio: service.tipoServicio || svcTipo,
                        unidad: service.unidad || svcUnidad,
                        descripcion: service.descripcion || svcDescripcion
                      });

                      // Limpiar formulario
                      setSvcTipo('vidrieria');
                      setSvcUnidad('unidad');
                      setSvcDescripcion('');
                      setSvcMonto(0);
                      setSvcNombre('');
                      setSelectedServiceTemplateId('');
                      alert('Servicio agregado al carrito');
                    } catch (e) {
                      console.error(e);
                      alert('Error agregando servicio al carrito');
                    }
                  }}
                  style={{ background: '#4CAF50' }}
                  title="Agregar servicio al carrito y finalizar venta"
                >
                  ➕ Agregar al Carrito
                </button>
              </div>

            </div>
          )}
          <ul>
            {filtered.map(p => {
              const isService = p._kind === 'service';
              const displayPrice = isService ? (p.price || p.precio || 0) : (saleType === 'mayorista' ? p.price_mayor : p.price_minor);
              return (
                <li
                  key={p.id}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}
                >
                  <div>
                    <strong>{p.name}</strong>
                    <div className="small">{isService ? 'Servicio' : `Stock: ${p.stock}`}</div>
                  </div>
                  <div className="flex">
                    <div className="small" style={{ marginRight: 8 }}>
                      {formatCurrency(displayPrice)}
                    </div>
                    <button
                      className="btn"
                      onClick={() => addToCart(p)}
                      disabled={!isService && p.stock <= 0}
                    >
                      Agregar
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* PANEL DE CARRITO */}
      <div>
        <Cart
          items={cart}
          onInc={id => {
            // validate against stock when incrementing
            const it = cart.find(x => x.id === id)
            if (!it) return
            if (String(id).startsWith('svc_')) {
              setCart(cart.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i))
              return
            }
            // Buscar producto comparando como string o como número
            const prod = products.find(p => String(p.id) === String(id))
            const allowed = prod ? (prod.stock || 0) : 0
            const currentQtyInCart = it.qty || 0
            const canAdd = Math.max(0, allowed - currentQtyInCart)
            if (canAdd <= 0) {
              return alert(`No hay más stock disponible para "${it.name}".\n\nStock total: ${allowed}\nEn carrito: ${currentQtyInCart}`)
            }
            setCart(cart.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i))
          }}
          onDec={id => setCart(
            cart
              .map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty - 1) } : i)
              .filter(i => i.qty > 0)
          )}
          total={total}
          onFinish={finish}
          onToggleOffer={toggleOfferInCart}
          stockByProductId={(id) => {
            // Para servicios, no hay límite de stock
            if (String(id).startsWith('svc_')) return 999
            // Buscar producto comparando como string o como número
            const prod = products.find(p => String(p.id) === String(id))
            return prod ? (prod.stock || 0) : 0
          }}
        />

      </div>

      {/* PANEL DE ENTREGAS Y PAGOS (responsive) */}
      <div className="card sales-card" style={{ gridColumn: '1 / -1', marginTop: 20 }}>
        <h3>Entregas y Pagos</h3>
        {/* Presupuestos NO se crean desde Ventas; la UI de presupuestos fue removida de esta pantalla. */}
        {salesSafe.length === 0 ? (
          <p>No hay ventas registradas.</p>
        ) : (
          (isMobile) ? (
            <div className="sales-cards">
              {salesSafe.map(s => {
                // Determine payment label and avoid fiado-style calculations for presupuestos
                const isBudget = s.type === 'presupuesto' || s.isPresupuesto;
                const isFiado = s.type === 'fiado' || s.isFiado;
                const payLabel = isBudget ? 'Presupuesto' : (s.metodoPago || (s.type === 'fiado' ? 'Fiado' : '—'));
                // Only compute payments info for non-presupuestos
                const paid = !isBudget ? (s.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0) : 0;
                const totalVal = Number(s.total || 0);
                const remaining = !isBudget ? Math.max(0, totalVal - paid) : null;
                const pct = !isBudget && totalVal > 0 ? Math.round((paid / totalVal) * 100) : null;
                const dueDate = s.dueDate || s.fechaVencimiento || s.vencimiento || null;
                return (
                  <div key={s.id} className={`sale-card ${getRowStateClass(s)}`} style={{ background: isFiado ? '#fff7e6' : undefined }}>
                    <div className="row">
                      <div style={{ fontWeight: 700 }}>{formatCurrency(s.total)}</div>
                      <div className="small-muted">{new Date(s.date).toLocaleString()}</div>
                    </div>
                    {isFiado && !isBudget && (
                      <div className="row">
                        <div className="small-muted">Fiado: Si{dueDate ? " - Vence " + dueDate : ""}</div>
                        <div style={{ fontWeight: 700 }}>{formatCurrency(remaining || 0)}</div>
                      </div>
                    )}
                    <div className="items truncate" title={s.items && s.items.length ? s.items.map(it => `${it.name} x${it.qty}`).join(', ') : ''}>
                      {s.items && s.items.length ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {s.items.map(it => (
                            <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1 }}>
                                <div className="small">{it.name} x{it.qty}{it.price ? ` — ${formatCurrency(it.price)}` : ''}</div>
                                {(it.tipoServicio || it.unidad) ? <div className="item-meta">{(() => { const tipo = (it.tipoServicio || '').toString().toLowerCase(); const tipoLbl = tipo.includes('vid') ? 'Vidriería' : (tipo.includes('mue') || tipo.includes('mobi') ? 'Mueblería' : (it.tipoServicio || '')); return [tipoLbl ? `Rubro: ${tipoLbl}` : null, it.unidad ? `Unidad: ${it.unidad}` : null].filter(Boolean).join(' | '); })()}</div> : null}
                                {it.descripcion ? <div className="item-desc">{it.descripcion}</div> : null}
                              </div>
                              {(String(it.id || '').startsWith('svc_') || it.productoId === null) && (
                                <div style={{ background: '#ffb6d5', color: '#800035', padding: '2px 6px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>Servicio</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : '-'}
                    </div>
                    <div className="row">
                      <div className="small-muted">{s.type} · {payLabel} · {(s.businessUnit && ((s.businessUnit === 'mobileria' || s.businessUnit === 'muebleria') ? 'Mueblería' : (s.businessUnit === 'vidrieria' ? 'Vidriería' : s.businessUnit))) || 'No especificado'}</div>
                      <div style={{ fontWeight: 700 }}>{isBudget ? '—' : `${pct}%`}</div>
                    </div>
                    <div className="row">
                      <div className="sales-actions">
                        {/* No permitir acciones de pago/edición desde la tarjeta para presupuestos */}
                        {!isBudget && (
                          <>
                            <button className="btn icon touch" title="Registrar pago" onClick={() => setPaymentModalSaleId(s.id)}> Pagar</button>
                            <button className="btn icon touch" title="Editar venta" onClick={() => startEditSale(s)}> Editar</button>
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {loadingIds.includes(s.id) ? <div className="loader" /> : null}
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Marcar pagado">
                          <input type="checkbox" checked={s.pagado} onChange={() => togglePago(s.id)} disabled={loadingIds.includes(s.id) || isBudget} /> Pagado
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Marcar entregado">
                          <input type="checkbox" checked={s.entregado} onChange={() => toggleEntrega(s.id)} disabled={loadingIds.includes(s.id) || isBudget} /> Entregado
                        </label>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="sales-table-wrapper">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Items</th>
                    <th>Tipo</th>
                    <th>Unidad</th>
                    <th>Método</th>
                    <th>Fiado</th>
                    <th>Fecha limite</th>
                    <th>Deuda</th>
                    <th>Cuenta destino</th>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th>Dirección</th>
                    <th>Pagado / Restante</th>
                    <th>Pagado</th>
                    <th>Entregado</th>
                    <th>Boleta</th>
                  </tr>
                </thead>
                <tbody>
                  {salesSafe.map(s => {
                    const isBudget = s.type === 'presupuesto' || s.isPresupuesto
                    const isFiado = s.type === 'fiado' || s.isFiado
                    const paid = !isBudget ? (s.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0) : 0
                    const totalVal = Number(s.total || 0)
                    const remaining = !isBudget ? Math.max(0, totalVal - paid) : 0
                    const dueDate = s.dueDate || s.fechaVencimiento || s.vencimiento || null
                    const serviceBg = (s.items || []).some(it => String(it.id || '').startsWith('svc_') || it.productoId === null) ? '#fff0f6' : undefined
                    const fiadoBg = isFiado ? '#fff7e6' : undefined
                    const rowBackground = serviceBg || fiadoBg
                    return (
                      <tr key={s.id} className={getRowStateClass(s)} style={{ transition: 'background-color 0.3s ease', background: rowBackground }}>
                        <td>{new Date(s.date).toLocaleString()}</td>
                        <td>{formatCurrency(s.total)}</td>
                        <td style={{ maxWidth: 300 }} title={s.items && s.items.length ? s.items.map(it => `${it.name} x${it.qty}`).join(', ') : ''}>
                          {s.items && s.items.length ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {s.items.map((it) => (
                                <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div className="small" style={{ flex: 1 }}>
                                    <div>{it.name} x{it.qty}{it.price ? ` — ${formatCurrency(it.price)}` : ''}</div>
                                    {(it.tipoServicio || it.unidad) ? <div className="item-meta">{(() => { const tipo = (it.tipoServicio || '').toString().toLowerCase(); const tipoLbl = tipo.includes('vid') ? 'Vidriería' : (tipo.includes('mue') || tipo.includes('mobi') ? 'Mueblería' : (it.tipoServicio || '')); return [tipoLbl ? `Rubro: ${tipoLbl}` : null, it.unidad ? `Unidad: ${it.unidad}` : null].filter(Boolean).join(' | '); })()}</div> : null}
                                    {it.descripcion ? <div className="item-desc">{it.descripcion}</div> : null}
                                  </div>
                                  {(String(it.id || '').startsWith('svc_') || it.productoId === null) ? (
                                    <span style={{ background: '#ffb6d5', color: '#800035', padding: '2px 6px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>Servicio</span>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : '-'}
                        </td>
                        <td>{s.type}</td>
                        <td>{(() => { const u = (s.businessUnit || '').toString().toLowerCase(); if (!u) return 'No especificado'; if (u.includes('mobi') || u.includes('mue')) return 'Mueblería'; if (u.includes('vid')) return 'Vidriería'; return s.businessUnit || 'No especificado' })()}</td>
                        <td>{s.type === 'presupuesto' ? 'Presupuesto' : (s.metodoPago || (s.type === 'fiado' ? 'Fiado' : '—'))}</td>
                        <td>{isFiado ? "Si" : "-"}</td>
                        <td>{isFiado ? (dueDate || "-") : "-"}</td>
                        <td>{isFiado ? formatCurrency(remaining || 0) : "-"}</td>
                        <td>{s.bankAccountId ? (() => {
                          const acc = bankAccounts.find(b => String(b.id) === String(s.bankAccountId));
                          return acc ? `${acc.holder || acc.titular || acc.holderName || ''} | ${acc.bankName} ${acc.number} ${acc.cbu ? '| CBU:' + acc.cbu : ''}` : '-';
                        })() : '-'}</td>
                        <td title={(() => {
                          if (s.type === 'presupuesto' && s.customer) {
                            const c = s.customer;
                            const parts = [];
                            if (c.phone) parts.push(`Tel: ${c.phone}`);
                            if (c.email) parts.push(`Email: ${c.email}`);
                            if (c.address) parts.push(`Dirección: ${c.address}`);
                            return parts.join(' | ');
                          }
                          if (s.clienteContacto && s.clienteContacto.nombre) {
                            const cc = s.clienteContacto
                            if (cc.mode === 'phone') return `Tel: ${cc.value || '-'}`
                            if (cc.mode === 'email') return `Email: ${cc.value || '-'}`
                            if (cc.mode === 'both') { const v = cc.value || {}; return `Tel: ${v.telefono || '-'} | Email: ${v.email || '-'}` }
                            return ''
                          }
                          const c = fiados.find(ci => ci.id === (typeof s.clienteFiado === 'string' ? parseInt(s.clienteFiado) : s.clienteFiado)) || fiados.find(ci => ci.nombre === s.clienteFiado);
                          if (!c) return '';
                          return `Tel: ${c.telefono || '-'} | Email: ${c.email || '-'}`;
                        })()}>
                          {(() => {
                            if (s.type === 'presupuesto' && s.customer) return s.customer.name || '-'
                            if (s.clienteContacto && s.clienteContacto.nombre) return s.clienteContacto.nombre
                            const c = fiados.find(ci => ci.id === (typeof s.clienteFiado === 'string' ? parseInt(s.clienteFiado) : s.clienteFiado)) || fiados.find(ci => ci.nombre === s.clienteFiado);
                            return c ? c.nombre : (s.clienteFiado || '-');
                          })()}
                        </td>
                        <td>
                          {(() => {
                            if (s.type === 'presupuesto' && s.customer) {
                              const c = s.customer || {};
                              const icon = c.email ? '' : (c.phone ? '' : '');
                              const value = c.phone || c.email || '-';
                              const tooltip = `${c.phone ? 'Tel: ' + c.phone : ''}${c.phone && c.email ? ' | ' : ''}${c.email ? 'Email: ' + c.email : ''}`;
                              return (<span title={tooltip} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}> <span style={{ fontSize: 16 }}>{icon}</span> <span>{value}</span> </span>);
                            }
                            let icon = ''
                            let value = '-'
                            let tooltip = ''
                            if (s.clienteContacto) {
                              const cc = s.clienteContacto
                              if (cc.mode === 'phone') { icon = 'Tel'; value = cc.value || '-'; tooltip = `Tel: ${value}` }
                              else if (cc.mode === 'email') { icon = 'Email'; value = cc.value || '-'; tooltip = `Email: ${value}` }
                              else if (cc.mode === 'both') { icon = ''; const v = cc.value || {}; value = `${v.telefono || '-'} ${v.email ? '| ' + v.email : ''}`; tooltip = `Tel: ${v.telefono || '-'} | Email: ${v.email || '-'}` }
                            } else {
                              const c = fiados.find(ci => ci.id === (typeof s.clienteFiado === 'string' ? parseInt(s.clienteFiado) : s.clienteFiado)) || fiados.find(ci => ci.nombre === s.clienteFiado);
                              if (c) { icon = c.email ? '' : (c.telefono ? '' : ''); value = c.telefono || c.email || '-'; tooltip = `Tel: ${c.telefono || '-'} | Email: ${c.email || '-'}` }
                            }
                            return (
                              <span title={tooltip} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}> <span style={{ fontSize: 16 }}>{icon}</span> <span>{value}</span> </span>
                            )
                          })()}
                        </td>
                        <td>
                          {(() => {
                            // Address column: prefer sale.customer.address for normal/presupuesto, for fiado look up client direccion
                            if (s.type === 'presupuesto' && s.customer) {
                              return s.customer.address || '—'
                            }
                            if (s.type === 'fiado') {
                              const c = fiados.find(ci => ci.id === (typeof s.clienteFiado === 'string' ? parseInt(s.clienteFiado) : s.clienteFiado)) || fiados.find(ci => ci.nombre === s.clienteFiado);
                              return (c && (c.direccion || c.address)) ? (c.direccion || c.address) : '—'
                            }
                            return (s.customer && s.customer.address) ? s.customer.address : '—'
                          })()}
                        </td>
                        <td>
                          {(() => {
                            if (s.type === 'presupuesto' || s.isPresupuesto) {
                              return <div className="small">—</div>
                            }
                            const paid = (s.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
                            const totalVal = Number(s.total || 0)
                            const remaining = Math.max(0, totalVal - paid)
                            const pct = totalVal > 0 ? Math.round((paid / totalVal) * 100) : 0
                            const badgeColor = pct >= 100 ? '#21cf1bff' : (pct >= 50 ? '#ffb300' : '#f25959ff')
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 700 }}>{formatCurrency(paid)}</span>
                                  <span className="small">Rest: {formatCurrency(remaining)}</span>
                                </div>
                                <div style={{ background: badgeColor, color: '#fff', padding: '4px 8px', borderRadius: 12, fontWeight: 700, minWidth: 48, textAlign: 'center' }}>{pct}%</div>
                              </div>
                            )
                          })()}
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={s.pagado}
                            onChange={() => togglePago(s.id)}
                            disabled={loadingIds.includes(s.id) || s.type === 'presupuesto' || s.isPresupuesto}
                          />
                          {loadingIds.includes(s.id) ? <div className="loader" style={{ display: 'inline-block', marginLeft: 8 }} /> : null}
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={s.entregado}
                            onChange={() => toggleEntrega(s.id)}
                            disabled={loadingIds.includes(s.id) || s.type === 'presupuesto' || s.isPresupuesto}
                          />
                        </td>
                        <td>
                          {/* Botón de enviar boleta eliminado */}
                          <button className="btn icon" title="Descargar boleta (PDF)" style={{ marginLeft: 8 }} onClick={async () => { try { await exportSalePDF(s, { company }); alert('Boleta descargada'); } catch (e) { console.error(e); alert('Error generando boleta PDF') } }}> Boleta</button>
                          {!((s.type === 'presupuesto') || s.isPresupuesto) && (
                            <>
                              <button className="btn icon" title="Registrar pago" style={{ marginLeft: 8 }} onClick={() => setPaymentModalSaleId(s.id)}>Registrar Pago</button>
                              <button className="btn icon" title="Editar venta" style={{ marginLeft: 8 }} onClick={() => startEditSale(s)}>Editar Venta</button>
                              <button className="btn icon" title="Borrar venta" style={{ marginLeft: 8, background: '#e74c3c' }} onClick={() => handleDeleteSale(s.id)}>Borrar Venta</button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modal edición de venta */}
      {editingSale && (
        <div className="modal">
          <div className="card" style={{ maxWidth: 800 }}>
            <h3>Editar venta {editingSale.id}</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <h4>Items</h4>
                {editingSale.items && editingSale.items.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {editingSale.items.map((it, idx) => (
                      <div key={it.id || idx} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4, background: (String(it.id || '').startsWith('svc_') || it.productoId === null) ? '#fff0f6' : '#f9f9f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div><strong>{it.name}</strong> x{it.qty}</div>
                            <div className="small" style={{ marginTop: 4 }}>Precio: {formatCurrency(it.price)}</div>
                            {it.tipoServicio && <div className="small">Rubro: {it.tipoServicio === 'vidrieria' ? 'Vidriería' : (it.tipoServicio === 'muebleria' ? 'Mueblería' : it.tipoServicio)}</div>}
                            {it.unidad && <div className="small">Unidad: {it.unidad}</div>}
                            {it.descripcion && <div className="small" style={{ marginTop: 4, color: '#666', fontStyle: 'italic' }}>Descripción: {it.descripcion}</div>}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8 }}>
                            <input type="number" value={it.qty} min={1} onChange={e => changeEditItemQty(idx, Number(e.target.value))} style={{ width: 60 }} />
                            <button className="btn" style={{ background: '#e74c3c' }} onClick={() => removeEditItem(idx)}>Quitar</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p>No hay items</p>}
                {/* Controles para agregar producto/servicio a la venta editada */}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #eee' }}>
                  <h5>Agregar producto/servicio</h5>
                  <input className="input" placeholder="Buscar..." value={editQuery} onChange={e => setEditQuery(e.target.value)} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    <select className="input" value={editSelectedId} onChange={e => setEditSelectedId(e.target.value)} style={{ flex: 1 }}>
                      <option value="">Seleccionar producto o servicio</option>
                      {products.filter(p => !editQuery || (p.name || '').toLowerCase().includes(editQuery.toLowerCase())).map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {formatCurrency(editSalePriceForType(p))}</option>
                      ))}
                      {(services || []).filter(s => !editQuery || (s.name || '').toLowerCase().includes(editQuery.toLowerCase())).map(s => (
                        <option key={`svc_${s.id}`} value={`svc_${s.id}`}>{s.name} — {formatCurrency(s.price || 0)}</option>
                      ))}
                    </select>
                    <input className="input" type="number" min={1} value={editSelectedQty} onChange={e => setEditSelectedQty(Number(e.target.value))} style={{ width: 90 }} />
                    <button className="btn" onClick={addItemToEditingSale}>Agregar</button>
                  </div>
                </div>
              </div>
              <div style={{ width: 300 }}>
                <label>Método de pago:</label>
                <select value={editingSale.metodoPago || ''} onChange={e => setEditingSale(prev => ({ ...prev, metodoPago: e.target.value }))} className="input">
                  <option value="">Fiado/No especificado</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
                <label style={{ marginTop: 8 }}>Unidad de negocio:</label>
                <select value={editingSale.businessUnit || ''} onChange={e => setEditingSale(prev => ({ ...prev, businessUnit: e.target.value }))} className="input">
                  <option value="">No especificado</option>
                  <option value="muebleria">Mueblería</option>
                  <option value="vidrieria">Vidriería</option>
                </select>
                {(editingSale.type === 'fiado' || editingSale.isFiado) && (
                  <div style={{ marginTop: 12, padding: 8, border: '1px solid #eee', borderRadius: 6 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Detalle Fiado</div>
                    <div className="small">Vencimiento: {editingSale.dueDate || editingSale.fechaVencimiento || '-'}</div>
                    <div className="small">Monto entregado: {formatCurrency(editingSale.montoEntregado || 0)}</div>
                    <div className="small">Monto adeudado: {formatCurrency(editingSale.montoAdeudado || 0)}</div>
                  </div>
                )}
                <label style={{ marginTop: 8 }}>Pagado:</label>
                <input type="checkbox" checked={!!editingSale.pagado} onChange={e => setEditingSale(prev => ({ ...prev, pagado: e.target.checked }))} />
                <label style={{ marginTop: 8 }}>Entregado:</label>
                <input type="checkbox" checked={!!editingSale.entregado} onChange={e => setEditingSale(prev => ({ ...prev, entregado: e.target.checked }))} />
                <div style={{ marginTop: 12 }}>
                  <div className="small">Total: {formatCurrency(editingSale.total)}</div>
                  <div className="small">Profit aprox: {formatCurrency(editingSale.profit || 0)}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={cancelEditSale}>Cancelar</button>
              <button className="btn" onClick={saveEditedSale}>Guardar</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Registrar pago desde la venta (parcial o total) */}
      {paymentModalSaleId && (
        <PaymentModal saleId={paymentModalSaleId} onClose={() => { setPaymentModalSaleId(null); setPaymentAmount(''); setPaymentMethod('efectivo'); setPaymentAccountId('') }} />
      )}
    </div>
  );
}




