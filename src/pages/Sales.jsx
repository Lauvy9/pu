import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import Cart from '../components/Cart';
import { formatCurrency, toLocalYMD } from '../utils/helpers';
import { addMonthsLocal, parseToLocalDate } from '../utils/dateHelpers'
import PaymentModal from '../components/PaymentModal'
import './Sales.css'

export default function Sales() {
  const { products, services, bankAccounts, actions, sales, fiados } = useStore();

  const [query, setQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // all | products | services
  const [cart, setCart] = useState([]);
  const [saleType, setSaleType] = useState('minorista');
  const [metodoPago, setMetodoPago] = useState('');
  const [contactMode, setContactMode] = useState('phone'); // phone | email | both
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [nuevoCliente, setNuevoCliente] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefonoInput, setClienteTelefonoInput] = useState('');
  const [clienteEmailInput, setClienteEmailInput] = useState('');
  const [saveClient, setSaveClient] = useState(false);
  const [cartAccent, setCartAccent] = useState(() => (typeof window !== 'undefined' && localStorage.getItem('cart_accent')) || '#ff9800');
  const [fechaFiado, setFechaFiado] = useState(new Date().toISOString().slice(0, 10));
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [plazoMeses, setPlazoMeses] = useState(0)
  const [pagoInicial, setPagoInicial] = useState(0)
  const [selectedBankId, setSelectedBankId] = useState('');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankType, setNewBankType] = useState('Cuenta Corriente');
  const [newBankNumber, setNewBankNumber] = useState('');
  const [newBankHolder, setNewBankHolder] = useState('');

  // Cargar estado del carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('currentCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

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
      .filter(s => (s.nombre || '').toLowerCase().includes(q))
      .map(s => ({ ...s, _kind: 'service', name: s.nombre, price: s.precio }));

    if (searchFilter === 'products') return prodMatches;
    if (searchFilter === 'services') return servMatches;
    return [...prodMatches, ...servMatches];
  }, [products, services, query, searchFilter]);

  function addToCart(item) {
    // item may be a product or a service (we normalized name/price in filtered)
    const isService = item._kind === 'service';
    const price = isService ? item.price : (saleType === 'mayorista' ? item.price_mayor : item.price_minor);
    const id = isService ? `svc_${item.id}` : item.id;

    setCart(prev => {
      const exist = prev.find(i => i.id === id);
      // If product, validate stock: total requested (existing qty + 1) <= product.stock
      if (!isService) {
        const prod = products.find(p => p.id === item.id);
        const existingQty = exist ? Number(exist.qty || 0) : 0;
        const allowed = prod ? (prod.stock || 0) : 0;
        if (existingQty + 1 > allowed) {
          alert(`No hay stock suficiente para ${item.name}. Disponible: ${allowed - existingQty}`);
          return prev;
        }
      }
      const newItem = { id, name: item.name, qty: 1, price, kind: isService ? 'service' : 'product' };
      const newCart = exist
        ? prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, newItem];
      return newCart;
    });
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // Función para determinar el color de fondo de la fila
  const getRowBackground = (sale) => {
    // Nuevo esquema de colores:
    // 🔵 Presupuesto pendiente
    if (sale.isPresupuesto || sale.type === 'presupuesto' || sale.status === 'budget') return '#2196F3'; // Azul
    // 🔴 Pendiente de pago
    if (!sale.pagado) return '#F44336'; // Rojo
    // 🟡 Pagado (pero no entregado)
    if (sale.pagado && !sale.entregado) return '#FFEB3B'; // Amarillo
    // 🟢 Pagado y entregado
    if (sale.pagado && sale.entregado) return '#4CAF50'; // Verde
    return 'transparent';
  };

  function finish() {
    if (cart.length === 0) return alert('El carrito está vacío');
    if (!metodoPago && saleType !== 'fiado') return alert('Seleccioná un método de pago');
    if (metodoPago === 'transferencia' && !selectedBankId) return alert('Seleccioná una cuenta bancaria para transferencia');

    const fecha = new Date().toISOString();

    const itemsDetailed = cart.map(it => {
      // si es servicio el id viene con prefijo svc_
      const prodId = typeof it.id === 'string' && it.id.startsWith('svc_') ? parseInt(it.id.replace('svc_', '')) : it.id;
      const prod = products.find(p => p.id === prodId);
      const cost = prod?.cost || 0;
      return { 
        id: it.id, 
        name: it.name, 
        qty: it.qty, 
        price: it.price, 
        type: saleType,
        cost 
      };
    });

    // preparar snapshot de cliente según selección o inputs para guardar contacto
    let clienteForContact = null
    if (clienteSeleccionado) {
      clienteForContact = fiados.find(ci => String(ci.id) === String(clienteSeleccionado))
    } else if (nuevoCliente) {
      clienteForContact = { nombre: nuevoCliente, telefono: clienteTelefonoInput || '', email: clienteEmailInput || '' }
    } else if (clienteNombre) {
      clienteForContact = { nombre: clienteNombre, telefono: clienteTelefonoInput || '', email: clienteEmailInput || '' }
    }

    const sale = {
      id: 's_' + Date.now(),
      date: fecha,
      items: itemsDetailed,
      total,
      profit: cart.reduce((s, i) => {
        const prodId = typeof i.id === 'string' && i.id.startsWith('svc_') ? parseInt(i.id.replace('svc_', '')) : i.id;
        const prod = products.find(p => p.id === prodId);
        return s + ((i.price - (prod?.cost || 0)) * i.qty);
      }, 0),
      type: saleType,
      metodoPago,
      bankAccountId: metodoPago === 'transferencia' ? selectedBankId : null,
      entregado: false,
      pagado: saleType !== 'fiado',
      clienteFiado: saleType === 'fiado' ? (clienteSeleccionado || nuevoCliente) : null,
      clienteContacto: (function(){
        if(!clienteForContact) return null
        const c = clienteForContact
        const contact = { mode: contactMode, nombre: c.nombre || nuevoCliente }
        if(contactMode === 'phone') contact.value = c.telefono || c.phone || ''
        else if(contactMode === 'email') contact.value = c.email || ''
        else contact.value = { telefono: c.telefono || '', email: c.email || '' }
        return contact
      })()
    };

    // Si hay pago inicial y es fiado: reflejarlo en la venta (sale.payments) y marcar pagado si cubre el total
    const pagoInicialNum = Number(pagoInicial || 0)
    if (saleType === 'fiado') {
      sale.payments = []
      if (pagoInicialNum > 0) {
        sale.payments.push({
          id: 'p_' + Date.now(),
          amount: pagoInicialNum,
          method: metodoPago || 'efectivo',
          accountId: selectedBankId || null,
          date: fechaFiado // sincronizamos la fecha del pago con la fecha indicada
        })
        // marcar pagado si el pago inicial cubre el total
        if (pagoInicialNum >= Number(total)) {
          sale.pagado = true
        } else {
          sale.pagado = false
        }
      }
    }

    // Guardar siempre el cliente (independientemente del método de pago) y sincronizar con fiados
    try {
      let client = null
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
          actions.updateFiadoClient(client.id, patch);
        } else {
          const nuevo = {
            id: Date.now(),
            nombre: normalizedName || 'Cliente',
            telefono: normalizedPhone || '',
            email: normalizedEmail || '',
            fechaRegistro: new Date().toISOString(),
            limiteCredito: 0,
            movimientos: [],
            deuda: 0
          };
          actions.addFiadoClient(nuevo);
          client = nuevo;
        }
      }

      if (saleType === 'fiado') {
        try {
          // asegurarnos de tener client (si no se seleccionó y no hay contacto, no hacemos nada)
          if (!client && clienteSeleccionado) {
            client = (fiados || []).find(f => String(f.id) === String(clienteSeleccionado))
          }
          if (client) {
            // entryAmount será la deuda restante (total - pagoInicial). Si entryAmount === 0 no se crea entrada de fiado.
            const entryAmount = Math.max(0, Number(total) - pagoInicialNum)
            let entry = null
            if (entryAmount > 0) {
              // calcular dueDate: si hay fechaVencimiento explícita usarla,
              // si no y se configuró plazoMeses > 0, calcular fechaVenta + plazoMeses preservando día.
              let computedDue = null
              try {
                if (fechaVencimiento) {
                  computedDue = fechaVencimiento
                } else if (Number(plazoMeses) && Number(plazoMeses) > 0) {
                  const fv = parseToLocalDate(fechaFiado)
                  const dueDateObj = addMonthsLocal(fv, Number(plazoMeses))
                  // guardar en formato YYYY-MM-DD para consistencia con inputs tipo=date
                  computedDue = toLocalYMD(dueDateObj)
                }
              } catch(e) { computedDue = fechaVencimiento || null }

              entry = actions.addFiadoEntry(client.id, { 
                amount: entryAmount, 
                originalAmount: Number(total),
                dateTaken: fechaFiado, 
                dueDate: computedDue || null, 
                note: `Venta ${sale.id}`, 
                saleId: sale.id 
              })
            }

            // si hay pago inicial, registrarlo y asegurarnos de usar la fecha indicada (fechaFiado)
            if (pagoInicialNum > 0) {
              // Si hay una entrada (deuda parcial), registramos el pago apuntando a esa entrada
              if (entry) {
                actions.registerFiadoPayment(client.id, entry.id, { amount: pagoInicialNum, method: metodoPago, accountId: selectedBankId, date: fechaFiado })
              } else {
                // Si no se creó entry (pago cubre todo), podemos registrar un movimiento de pago general o confiar en la venta pagada.
                // Intentamos registrar un pago asociado a la venta si la acción lo permite:
                try {
                  actions.registerFiadoPayment(client.id, null, { amount: pagoInicialNum, method: metodoPago, accountId: selectedBankId, date: fechaFiado, saleId: sale.id })
                } catch(e) {
                  // la implementación de actions puede no soportar register con entryId null; en ese caso se ignora y la venta queda como pagada.
                }
              }
            }

            // asegurar que la venta referencie al cliente por su id numérico si hay deuda (o aunque no)
            sale.clienteFiado = client.id
          }
        } catch (e) { console.warn('Registrar movimiento fiado falló', e) }
      }
    } catch (e) {
      console.warn('Guardar/actualizar cliente falló', e);
    }

    // Finalmente registrar la venta (después de haber creado/actualizado cliente y entrada de fiado con saleId)
    try {
      actions.registerSale(sale);
    } catch(e) { console.warn('Registrar venta falló', e) }

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
    try{
      addLoading(id)
      // Actualizar en el contexto/Store
      await actions.registerSaleStateChange(id, { entregado: newEstado });
    }finally{ removeLoading(id) }

    // Si es fiado y se marca como entregado, actualizar en clientes también
    if (sale.type === 'fiado' && sale.clienteFiado) {
      const clienteId = typeof sale.clienteFiado === 'string' ? parseInt(sale.clienteFiado) : sale.clienteFiado;
      const cliente = (fiados || []).find(c => c.id === clienteId)
      if (cliente) {
        const movimiento = (cliente.movimientos || []).find(m => m.saleId === id)
        if (movimiento) {
          actions.updateFiadoEntry(cliente.id, movimiento.id, { entregado: newEstado })
        }
      }
    }
  }

  async function togglePago(id) {
    const sale = sales.find(s => s.id === id);
    const newEstado = !sale.pagado;
    try{
      addLoading(id)
      // Actualizar en el contexto/Store
      await actions.registerSaleStateChange(id, { pagado: newEstado });
    }finally{ removeLoading(id) }

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
    function onResize(){ setIsMobile(window.innerWidth < 480) }
    if (typeof window !== 'undefined') window.addEventListener('resize', onResize)
    return () => { if (typeof window !== 'undefined') window.removeEventListener('resize', onResize) }
  }, [])

  const addLoading = (id) => setLoadingIds(prev => Array.from(new Set([...(prev||[]), id])))
  const removeLoading = (id) => setLoadingIds(prev => (prev||[]).filter(x => x !== id))

  function handleDeleteSale(id){
    if(!confirm('¿Eliminar esta venta? Esto revertirá el stock asociado.')) return;
    try{
      const res = actions.deleteSale(id)
      if (res && res.ok) {
        alert('Venta eliminada y stock revertido')
      } else {
        alert('No se pudo eliminar la venta')
      }
    }catch(e){ console.error(e); alert('Error al eliminar venta') }
  }

  function startEditSale(s){
    // clonamos la venta para edición
    const copy = JSON.parse(JSON.stringify(s))
    setEditingSale(copy)
    // guardar snapshot de items originales para validaciones de stock
    setEditOriginalItems(JSON.parse(JSON.stringify(s.items || [])))
  }

  function cancelEditSale(){ setEditingSale(null) }

  function changeEditItemQty(index, qty){
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
      next.total = next.items.reduce((sum, it) => sum + (Number(it.price||0) * Number(it.qty||0)), 0)
      return next
    })
  }

  function removeEditItem(index){
    setEditingSale(prev => {
      const next = { ...prev }
      next.items = next.items.filter((_, i) => i !== index)
      next.total = next.items.reduce((sum, it) => sum + (Number(it.price||0) * Number(it.qty||0)), 0)
      return next
    })
  }

  function addItemToEditingSale(){
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
        next.items = (next.items || []).map((it, i) => i === existingIdx ? { ...it, qty: (Number(it.qty||0) + Number(newItem.qty)) } : it)
      } else {
        next.items = [...(next.items || []), newItem]
      }
      next.total = next.items.reduce((sum, it) => sum + (Number(it.price||0) * Number(it.qty||0)), 0)
      return next
    })
    // reset selectors
    setEditSelectedId('')
    setEditSelectedQty(1)
    setEditQuery('')
  }

  function editSalePriceForType(product){
    // Use saleType of the original sale if present, otherwise use global saleType state
    const type = editingSale?.type || saleType
    if (type === 'mayorista') return product.price_mayor ?? product.price ?? product.cost ?? 0
    return product.price_minor ?? product.price ?? product.cost ?? 0
  }

  function saveEditedSale(){
    if (!editingSale) return;
    try{
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
    }catch(e){ console.error(e); alert('Error al guardar la venta editada') }
  }

  function enviarBoleta(sale) {
    const estadoPago = sale.pagado ? 'Pagado' : 'Pendiente de pago';
    const estadoEntrega = sale.entregado ? 'Entregado' : 'Pendiente de entrega';
    
    const msg = `
🧾 *Boleta Electrónica*
Cliente: ${sale.clienteFiado || 'N/A'}
Total: ${formatCurrency(sale.total)}
Método: ${sale.metodoPago || 'Fiado'}
Estado: ${estadoPago} | ${estadoEntrega}
Fecha: ${new Date(sale.date).toLocaleString()}
    `;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  return (
    <div className="grid">
      {/* PANEL DE NUEVA VENTA */}
      <div className="card">
        <h3>Nueva venta</h3>
        <div style={{ marginBottom: 8 }}>
          <a className="btn" href="/presupuestos">Crear Presupuesto</a>
        </div>
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
          <label style={{ marginLeft: 10 }}>Contacto a guardar: </label>
          <select value={contactMode} onChange={e => setContactMode(e.target.value)} className="input" style={{ width: 160 }}>
            <option value="phone">Nombre + Teléfono</option>
            <option value="email">Gmail (email)</option>
            <option value="both">Ambos</option>
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
              {(fiados||[]).map(c => (
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
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <div style={{ flex:1 }}>
                <label>Fecha (toma):</label>
                <input type="date" value={fechaFiado} onChange={e=>setFechaFiado(e.target.value)} className="input" />
              </div>
              <div style={{ flex:1 }}>
                <label>Fecha vencimiento:</label>
                <input type="date" value={fechaVencimiento} onChange={e=>setFechaVencimiento(e.target.value)} className="input" />
              </div>
              <div style={{ width:160 }}>
                <label>Plazo (meses):</label>
                <input type="number" min={0} value={plazoMeses} onChange={e=>setPlazoMeses(Number(e.target.value||0))} className="input" />
              </div>
            </div>
            <div style={{ marginTop:8 }}>
              <label>Pago inicial (opcional):</label>
              <input className="input" type="number" min={0} value={pagoInicial} onChange={e=>setPagoInicial(Number(e.target.value||0))} />
            </div>
          </div>
        )}

        {/* Inputs de contacto general (permitir guardar nombre/teléfono/email para cualquier venta) */}
        <div style={{ marginTop: 8, padding: 8, border: '1px dashed #eee', borderRadius: 6 }}>
          <h4>Contacto (opcional)</h4>
          <input className="input" placeholder="Nombre" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} />
          <input className="input" placeholder="Teléfono" value={clienteTelefonoInput} onChange={e => setClienteTelefonoInput(e.target.value)} />
          <input className="input" placeholder="Email" value={clienteEmailInput} onChange={e => setClienteEmailInput(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={saveClient} onChange={e => setSaveClient(e.target.checked)} /> Guardar cliente
            </label>
            <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Color carrito</span>
              <input type="color" value={cartAccent} onChange={e => { setCartAccent(e.target.value); try{ localStorage.setItem('cart_accent', e.target.value) }catch{} }} />
            </label>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <h4>Productos</h4>
          <ul>
            {filtered.map(p => (
              <li
                key={p.id}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}
              >
                <div>
                  <strong>{p.name}</strong>
                  <div className="small">Stock: {p.stock}</div>
                </div>
                <div className="flex">
                  <div className="small" style={{ marginRight: 8 }}>
                    {formatCurrency(saleType === 'mayorista' ? p.price_mayor : p.price_minor)}
                  </div>
                  <button
                    className="btn"
                    onClick={() => addToCart(p)}
                    disabled={p.stock <= 0}
                  >
                    Agregar
                  </button>
                </div>
              </li>
            ))}
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
              const prodId = Number(id)
              const prod = products.find(p => p.id === prodId)
              const allowed = prod ? (prod.stock || 0) : 0
              if ((it.qty || 0) + 1 > allowed) return alert(`No hay stock suficiente para ${it.name}. Disponible: ${allowed - (it.qty||0)}`)
              setCart(cart.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i))
            }}
            onDec={id => setCart(
              cart
                .map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty - 1) } : i)
                .filter(i => i.qty > 0)
            )}
            total={total}
            onFinish={finish}
          />
      </div>

      {/* PANEL DE ENTREGAS Y PAGOS (responsive) */}
      <div className="card sales-card" style={{ gridColumn: '1 / -1', marginTop: 20 }}>
        <h3>Entregas y Pagos</h3>
        {sales.length === 0 ? (
          <p>No hay ventas registradas.</p>
        ) : (
          (isMobile) ? (
            <div className="sales-cards">
              {sales.map(s => {
                const paid = (s.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
                const totalVal = Number(s.total || 0)
                const remaining = Math.max(0, totalVal - paid)
                const pct = totalVal > 0 ? Math.round((paid / totalVal) * 100) : 0
                return (
                  <div key={s.id} className={`sale-card ${getRowStateClass(s)}`}>
                    <div className="row">
                      <div style={{ fontWeight:700 }}>{formatCurrency(s.total)}</div>
                      <div className="small-muted">{new Date(s.date).toLocaleString()}</div>
                    </div>
                    <div className="items truncate" title={s.items && s.items.length ? s.items.map(it => `${it.name} x${it.qty}`).join(', ') : ''}>
                      {s.items && s.items.length ? s.items.map(it => `${it.name} x${it.qty}`).join(' · ') : '-'}
                    </div>
                    <div className="row">
                      <div className="small-muted">{s.type} · {s.metodoPago || 'Fiado'}</div>
                      <div style={{ fontWeight:700 }}>{pct}%</div>
                    </div>
                    <div className="row">
                      <div className="sales-actions">
                        <button className="btn icon touch" title="Enviar boleta (WhatsApp)" onClick={() => enviarBoleta(s)}>📤 Enviar</button>
                        <button className="btn icon touch" title="Registrar pago" onClick={() => setPaymentModalSaleId(s.id)}>💸 Pagar</button>
                        <button className="btn icon touch" title="Editar venta" onClick={() => startEditSale(s)}>✏️ Editar</button>
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        {loadingIds.includes(s.id) ? <div className="loader" /> : null}
                        <label style={{ display:'flex', alignItems:'center', gap:6 }} title="Marcar pagado">
                          <input type="checkbox" checked={s.pagado} onChange={() => togglePago(s.id)} disabled={loadingIds.includes(s.id)} /> Pagado
                        </label>
                        <label style={{ display:'flex', alignItems:'center', gap:6 }} title="Marcar entregado">
                          <input type="checkbox" checked={s.entregado} onChange={() => toggleEntrega(s.id)} disabled={loadingIds.includes(s.id)} /> Entregado
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
                    <th>Método</th>
                    <th>Cuenta destino</th>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th>Pagado / Restante</th>
                    <th>Pagado</th>
                    <th>Entregado</th>
                    <th>Boleta</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(s => (
                    <tr key={s.id} className={getRowStateClass(s)} style={{ transition: 'background-color 0.3s ease' }}>
                      <td>{new Date(s.date).toLocaleString()}</td>
                      <td>{formatCurrency(s.total)}</td>
                      <td style={{ maxWidth: 300 }} title={s.items && s.items.length ? s.items.map(it => `${it.name} x${it.qty}`).join(', ') : ''}>
                        {s.items && s.items.length ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {s.items.map((it) => (
                              <div key={it.id} className="small">{it.name} x{it.qty}{it.price ? ` — ${formatCurrency(it.price)}` : ''}</div>
                            ))}
                          </div>
                        ) : '-'}
                      </td>
                      <td>{s.type}</td>
                      <td>{s.metodoPago || 'Fiado'}</td>
                      <td>{s.bankAccountId ? (() => {
                        const acc = bankAccounts.find(b => String(b.id) === String(s.bankAccountId));
                        return acc ? `${acc.holder || acc.titular || acc.holderName || ''} | ${acc.bankName} ${acc.number} ${acc.cbu ? '| CBU:'+acc.cbu : ''}` : '-';
                      })() : '-'}</td>
                      <td title={(() => {
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
                          if (s.clienteContacto && s.clienteContacto.nombre) return s.clienteContacto.nombre
                          const c = fiados.find(ci => ci.id === (typeof s.clienteFiado === 'string' ? parseInt(s.clienteFiado) : s.clienteFiado)) || fiados.find(ci => ci.nombre === s.clienteFiado);
                          return c ? c.nombre : (s.clienteFiado || '-');
                        })()}
                      </td>
                      <td>
                        {(() => {
                          let icon = ''
                          let value = '-'
                          let tooltip = ''
                          if (s.clienteContacto) {
                            const cc = s.clienteContacto
                            if (cc.mode === 'phone') { icon = '📞'; value = cc.value || '-'; tooltip = `Tel: ${value}` }
                            else if (cc.mode === 'email') { icon = '✉️'; value = cc.value || '-'; tooltip = `Email: ${value}` }
                            else if (cc.mode === 'both') { icon = '👤'; const v = cc.value || {}; value = `${v.telefono || '-'} ${v.email ? '| ' + v.email : ''}`; tooltip = `Tel: ${v.telefono || '-'} | Email: ${v.email || '-'}` }
                          } else {
                            const c = fiados.find(ci => ci.id === (typeof s.clienteFiado === 'string' ? parseInt(s.clienteFiado) : s.clienteFiado)) || fiados.find(ci => ci.nombre === s.clienteFiado);
                            if (c) { icon = c.email ? '✉️' : (c.telefono ? '📞' : '👤'); value = c.telefono || c.email || '-'; tooltip = `Tel: ${c.telefono || '-'} | Email: ${c.email || '-'}` }
                          }
                          return (
                            <span title={tooltip} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}> <span style={{ fontSize: 16 }}>{icon}</span> <span>{value}</span> </span>
                          )
                        })()}
                      </td>
                      <td>
                        {(() => {
                          const paid = (s.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
                          const totalVal = Number(s.total || 0)
                          const remaining = Math.max(0, totalVal - paid)
                          const pct = totalVal > 0 ? Math.round((paid / totalVal) * 100) : 0
                          const badgeColor = pct >= 100 ? '#4caf50' : (pct >= 50 ? '#ffb300' : '#c62828')
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight:700 }}>{formatCurrency(paid)}</span>
                                <span className="small">Rest: {formatCurrency(remaining)}</span>
                              </div>
                              <div style={{ background: badgeColor, color: '#fff', padding: '4px 8px', borderRadius: 12, fontWeight:700, minWidth:48, textAlign:'center' }}>{pct}%</div>
                            </div>
                          )
                        })()}
                      </td>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={s.pagado} 
                          onChange={() => togglePago(s.id)} 
                          disabled={loadingIds.includes(s.id)}
                        />
                        {loadingIds.includes(s.id) ? <div className="loader" style={{ display:'inline-block', marginLeft:8 }} /> : null}
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={s.entregado}
                          onChange={() => toggleEntrega(s.id)}
                          disabled={loadingIds.includes(s.id)}
                        />
                      </td>
                      <td>
                        <button className="btn icon" title="Enviar boleta (WhatsApp)" onClick={() => enviarBoleta(s)}>Enviar Boleta</button>
                        <button className="btn icon" title="Registrar pago" style={{ marginLeft: 8 }} onClick={() => setPaymentModalSaleId(s.id)}>Registrar Pago</button>
                        <button className="btn icon" title="Editar venta" style={{ marginLeft: 8 }} onClick={() => startEditSale(s)}>Editar Venta</button>
                        <button className="btn icon" title="Borrar venta" style={{ marginLeft: 8, background:'#e74c3c' }} onClick={() => handleDeleteSale(s.id)}>Borrar Venta</button>
                      </td>
                    </tr>
                  ))}
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
            <div style={{ display:'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <h4>Items</h4>
                {editingSale.items && editingSale.items.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {editingSale.items.map((it) => (
                      <div key={it.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <div><strong>{it.name}</strong></div>
                          <div className="small">Precio: {formatCurrency(it.price)}</div>
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <input type="number" value={it.qty} min={0} onChange={e=>changeEditItemQty(idx, Number(e.target.value))} style={{ width:80 }} />
                          <button className="btn" onClick={()=>removeEditItem(idx)}>Quitar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p>No hay items</p>}
                {/* Controles para agregar producto/servicio a la venta editada */}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #eee' }}>
                  <h5>Agregar producto/servicio</h5>
                  <input className="input" placeholder="Buscar..." value={editQuery} onChange={e=>setEditQuery(e.target.value)} />
                  <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center' }}>
                    <select className="input" value={editSelectedId} onChange={e=>setEditSelectedId(e.target.value)} style={{ flex: 1 }}>
                      <option value="">Seleccionar producto o servicio</option>
                      {products.filter(p=>!editQuery || (p.name||'').toLowerCase().includes(editQuery.toLowerCase())).map(p=> (
                        <option key={p.id} value={p.id}>{p.name} — {formatCurrency(editSalePriceForType(p))}</option>
                      ))}
                      {(services||[]).filter(s=>!editQuery || (s.nombre||'').toLowerCase().includes(editQuery.toLowerCase())).map(s=> (
                        <option key={`svc_${s.id}`} value={`svc_${s.id}`}>{s.nombre} — {formatCurrency(s.precio || s.price || 0)}</option>
                      ))}
                    </select>
                    <input className="input" type="number" min={1} value={editSelectedQty} onChange={e=>setEditSelectedQty(Number(e.target.value))} style={{ width: 90 }} />
                    <button className="btn" onClick={addItemToEditingSale}>Agregar</button>
                  </div>
                </div>
              </div>
              <div style={{ width: 300 }}>
                <label>Método de pago:</label>
                <select value={editingSale.metodoPago || ''} onChange={e=>setEditingSale(prev=>({...prev, metodoPago: e.target.value}))} className="input">
                  <option value="">Fiado/No especificado</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
                <label style={{ marginTop:8 }}>Pagado:</label>
                <input type="checkbox" checked={!!editingSale.pagado} onChange={e=>setEditingSale(prev=>({...prev, pagado: e.target.checked}))} />
                <label style={{ marginTop:8 }}>Entregado:</label>
                <input type="checkbox" checked={!!editingSale.entregado} onChange={e=>setEditingSale(prev=>({...prev, entregado: e.target.checked}))} />
                <div style={{ marginTop: 12 }}>
                  <div className="small">Total: {formatCurrency(editingSale.total)}</div>
                  <div className="small">Profit aprox: {formatCurrency(editingSale.profit || 0)}</div>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop: 12, justifyContent:'flex-end' }}>
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