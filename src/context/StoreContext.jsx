import React, { createContext, useState, useEffect, useContext } from 'react';
import { formatCurrency } from '../utils/helpers';
import useLocalStorage from '../hooks/useLocalStorage';
import { calculateFinancialData } from '../utils/financeHelpers'

export const StoreContext = createContext();

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}

export function StoreProvider({ children }) {
  const [sales, setSales] = useLocalStorage('vid_sales', []);
  const [fiados, setFiados] = useLocalStorage('vid_fiados', []);
  const [products, setProducts] = useLocalStorage('vid_products', []);
  const [services, setServices] = useLocalStorage('vid_services', []);
  const [serviceTemplates, setServiceTemplates] = useLocalStorage('vid_service_templates', []);
  const [transactions, setTransactions] = useLocalStorage('vid_transactions', []);
  const [bankAccounts, setBankAccounts] = useLocalStorage('vid_bankAccounts', []);
  const [payments, setPayments] = useLocalStorage('vid_payments', []);
  const [expenses, setExpenses] = useLocalStorage('vid_expenses', []);
  const [presupuestos, setPresupuestos] = useLocalStorage('vid_presupuestos', []);
  const [company, setCompany] = useLocalStorage('vid_company', {
    name: '',
    address: '',
    phone: '',
    email: '',
    logo: '' // can be a URL or dataURL
  });

  const actions = {
    // PRODUCTOS
    addProduct: (product) => {
      // Extend addProduct: if product with same name+caracteristica exists => treat as reposicion
      const exists = (products || []).find(p => String((p.name||'')).trim().toLowerCase() === String((product.name||'')).trim().toLowerCase() && String((p.caracteristica||'')).trim().toLowerCase() === String((product.caracteristica||'')).trim().toLowerCase())
      if (exists) {
        // It's a reposición: aumentar stock del producto existente
        const addedQty = Number(product.stock || 0);
        const newCost = product.cost != null ? Number(product.cost) : exists.cost || 0;
        setProducts(prev => prev.map(p => p.id === exists.id ? { ...p, stock: Number(p.stock || 0) + addedQty, cost: newCost } : p));
        // registrar transacción de reposicion
        const tx = {
          id: 'tx_' + Date.now().toString(),
          tipo: 'reposicion',
          fecha: new Date().toISOString(),
          productoId: exists.id,
          nombreProducto: product.name || exists.name || '',
          cantidad: addedQty,
          costoUnitario: newCost,
          total: Number(addedQty) * Number(newCost || 0),
          businessUnit: (product.businessUnit || exists.businessUnit) || undefined,
        };
        // push transaction and register expense
        setTransactions(prev => [...prev, tx]);
        // also add as expense to keep finance logic
        const exp = { id: 'exp_' + Date.now().toString(), date: tx.fecha, description: `Reposición ${tx.nombreProducto}`, amount: tx.total, category: 'materiales', businessUnit: tx.businessUnit };
        setExpenses(prev => [...prev, exp]);
        return exists;
      }

      const newProduct = {
        ...product,
        id: product.id || Date.now().toString(),
        businessUnit: product.businessUnit || undefined,
      };
      setProducts(prev => [...prev, newProduct]);

      // Registrar transacción tipo 'compra' para el stock inicial (si aplica)
      const initialQty = Number(product.stock || 0);
      if (initialQty > 0) {
        const tx = {
          id: 'tx_' + Date.now().toString(),
          tipo: 'compra',
          fecha: new Date().toISOString(),
          productoId: newProduct.id,
          nombreProducto: newProduct.name || '',
          cantidad: initialQty,
          costoUnitario: Number(product.cost || 0),
          total: Number(initialQty) * Number(product.cost || 0),
          businessUnit: newProduct.businessUnit || undefined,
        };
        setTransactions(prev => [...prev, tx]);
        const exp = { id: 'exp_' + Date.now().toString(), date: tx.fecha, description: `Compra ${tx.nombreProducto}`, amount: tx.total, category: 'materiales', businessUnit: tx.businessUnit };
        setExpenses(prev => [...prev, exp]);
      }
      return newProduct;
    },

    // SERVICIOS
    addService: (svc) => {
      const normalized = {
        id: svc.id || ('svc_' + Date.now().toString()),
        name: svc.name || svc.nombre || svc.nombre || '',
        // price normalization keeps backward compatibility
        price: Number(svc.price || svc.precio || svc.cost || svc.precio || 0),
        tipoServicio: svc.tipoServicio || svc.tipo || null,
        unidad: svc.unidad || null,
        descripcion: svc.descripcion || svc.description || '' ,
        businessUnit: svc.businessUnit || svc.unidadNegocio || undefined,
        activo: typeof svc.activo === 'undefined' ? true : !!svc.activo,
      };
      setServices(prev => [...(prev || []), normalized]);
      return normalized;
    },

    updateService: (id, patch) => {
      setServices(prev => (prev || []).map(s => s.id === id ? { ...s, ...patch, price: typeof patch.price !== 'undefined' ? Number(patch.price) : s.price } : s));
    },

    removeService: (id) => {
      setServices(prev => (prev || []).filter(s => s.id !== id));
    },

    // PLANTILLAS DE SERVICIOS (SERVICE TEMPLATES)
    addServiceTemplate: (template) => {
      const normalized = {
        id: template.id || ('tmpl_' + Date.now().toString()),
        nombre: template.nombre || template.name || '',
        tipoServicio: template.tipoServicio || 'vidrieria',
        precio: Number(template.precio || template.price || 0),
        unidad: template.unidad || 'unidad',
        descripcionBase: template.descripcionBase || template.description || '',
        activo: typeof template.activo === 'undefined' ? true : !!template.activo,
        createdAt: template.createdAt || new Date().toISOString(),
      };
      setServiceTemplates(prev => [...(prev || []), normalized]);
      return normalized;
    },

    updateServiceTemplate: (id, patch) => {
      setServiceTemplates(prev => (prev || []).map(t => t.id === id ? { ...t, ...patch, precio: typeof patch.precio !== 'undefined' ? Number(patch.precio) : (typeof patch.price !== 'undefined' ? Number(patch.price) : t.precio) } : t));
    },

    removeServiceTemplate: (id) => {
      setServiceTemplates(prev => (prev || []).filter(t => t.id !== id));
    },

    updateProduct: (id, updates) => {
      // Detectar reposición si el stock aumenta
      try {
        const existing = (products || []).find(p => p.id === id);
        if (existing && updates && typeof updates.stock !== 'undefined') {
          const prevStock = Number(existing.stock || 0);
          const newStock = Number(updates.stock || 0);
          if (newStock > prevStock) {
            const added = newStock - prevStock;
            const costoUnit = typeof updates.cost !== 'undefined' ? Number(updates.cost) : Number(existing.cost || 0);
            const tx = {
              id: 'tx_' + Date.now().toString(),
              tipo: 'reposicion',
              fecha: new Date().toISOString(),
              productoId: existing.id,
              nombreProducto: existing.name || '',
              cantidad: added,
              costoUnitario: costoUnit,
              total: added * costoUnit,
              businessUnit: (updates && updates.businessUnit) ? updates.businessUnit : (existing.businessUnit || undefined),
            };
            setTransactions(prev => [...prev, tx]);
            const exp = { id: 'exp_' + Date.now().toString(), date: tx.fecha, description: `Reposición ${tx.nombreProducto}`, amount: tx.total, category: 'materiales', businessUnit: tx.businessUnit };
            setExpenses(prev => [...prev, exp]);
          }
        }
      } catch (e) { console.warn('updateProduct tx hook failed', e) }
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    },

    deleteProduct: (id) => {
      setProducts(prev => prev.filter(p => p.id !== id));
    },

    // VENTAS
    addSale: (sale) => {
      // Sanitizar entrada: asegurar números y formatos coherentes
      function parseNum(x){
        try{ if (x === null || x === undefined || x === '') return 0; const s = String(x).trim(); const ss = (s.indexOf('.')!==-1 && s.indexOf(',')!==-1) ? s.replace(/\./g,'').replace(/,/g,'.') : (s.indexOf(',')!==-1 ? s.replace(/,/g,'.') : s); const n = Number(ss.replace(/[^0-9.\-]/g,'')); if (isNaN(n)) return 0; const MAX = 1e12; if (Math.abs(n) > MAX) return Math.sign(n)*MAX; return n }catch(e){return 0}
      }

      const paymentsArr = Array.isArray(sale.payments) ? sale.payments.map(p=> ({ ...p, amount: parseNum(p.amount) })) : []
      const paymentsSum = paymentsArr.reduce((s,p) => s + Number(p.amount || 0), 0)

      // normalize items
      const items = Array.isArray(sale.items) ? sale.items.map(it => ({
        ...it,
        qty: Number(parseNum(it.qty || it.quantity || 0)),
        price: Number(parseNum(it.price || it.unitPrice || it.amount || 0)),
        cost: Number(parseNum(it.cost || it.unitCost || 0))
      })) : sale.items

      // compute total if missing or clearly invalid
      let computedTotal = 0
      if (Array.isArray(items) && items.length) computedTotal = items.reduce((acc,it) => acc + (Number(it.price || 0) * Number(it.qty || 0)), 0)
      const givenTotal = parseNum(sale.total || sale.totalVenta || sale.amount || sale.monto || 0)
      const totalToUse = (givenTotal && givenTotal > 0) ? Math.min(givenTotal, 1e12) : computedTotal

      const newSale = {
        ...sale,
        id: sale.id || Date.now().toString(),
        date: sale.date || new Date().toISOString(),
        payments: paymentsArr,
        pagado: paymentsSum || 0,
        items,
        total: Number(totalToUse || 0),
        type: sale.type || (sale.isPresupuesto ? 'presupuesto' : 'venta'),
      };
      // Enriquecer items con snapshot del producto (fuente de verdad)
      try{
        if (Array.isArray(newSale.items)){
          newSale.items = newSale.items.map(it => {
            const prod = (products || []).find(p => String(p.id) === String(it.id));
            const snapshot = prod ? {
              id: prod.id,
              name: prod.name || prod.title || prod.descripcion || '',
              descripcion: prod.descripcion || prod.description || '',
              medidas: prod.medidas || prod.measures || null,
              stock: Number(prod.stock || 0),
              cost: Number(prod.cost || prod.unitCost || 0),
              price: Number(it.price || it.unitPrice || prod.price || prod.precio || 0),
              businessUnit: prod.businessUnit || prod.unit || 'sin_especificar'
            } : null;
            return { ...it, productSnapshot: snapshot };
          });
        }
      }catch(e){ console.warn('addSale: failed to enrich items', e) }

      // Descontar stock por cada item vendido (solo productos, no servicios)
      if (newSale.items && Array.isArray(newSale.items)) {
        setProducts(prev => {
          const next = [...prev];
          newSale.items.forEach(it => {
            try{
              const prodId = it && it.productSnapshot ? it.productSnapshot.id : it.id;
              const idx = next.findIndex(p => String(p.id) === String(prodId));
              if (idx !== -1 && !String(prodId).startsWith('svc_')) {
                const qty = Number(it.qty || it.quantity || 0);
                next[idx] = { ...next[idx], stock: Math.max(0, Number(next[idx].stock || 0) - qty) };
              }
            }catch(e){ }
          });
          return next;
        });
      }

      // Persistir venta (always push normalized object)
      setSales(prev => [...prev, newSale]);
      try {
        // Crear una transacción por cada ítem (producto) vendido para que tablas tipo "Últimas transacciones" muestren producto/cantidad
        const paymentsSum = (newSale.payments || []).reduce((s,p) => s + Number(p.amount || 0), 0);
        const remainingDebt = newSale.type === 'fiado' ? Math.max(0, Number(newSale.total || 0) - paymentsSum) : 0;
        (newSale.items || []).forEach(it => {
          try {
            const isService = String(it.id || '').startsWith('svc_');
            const txItem = {
              id: 'tx_' + Date.now().toString() + '_' + (isService ? 'svc' : String(it.id)),
              tipo: 'venta',
              fecha: newSale.date,
              saleId: newSale.id,
              productoId: isService ? null : it.id,
              nombreProducto: it.name || it.nombre || (isService ? (it.name || 'Servicio') : ''),
              cantidad: Number(it.qty || it.quantity || 0),
              total: Number(it.qty || it.quantity || 0) * Number(it.price || it.precio || 0),
              metodoPago: newSale.metodoPago || null,
              categoria: newSale.type || null,
              cliente: (newSale.customer && (newSale.customer.name || newSale.customer.nombre)) || newSale.clienteFiado || null,
              direccion: (newSale.customer && (newSale.customer.address || newSale.customer.direccion)) || null,
              pagado: !!newSale.pagado,
              entregado: !!newSale.entregado,
              deudaActual: remainingDebt,
                 businessUnit: (!isService ? ((it.productSnapshot && it.productSnapshot.businessUnit) || (products && products.find ? (products.find(p => String(p.id) === String(it.id))?.businessUnit) : undefined) || newSale.businessUnit || 'sin_especificar') : (newSale.businessUnit || 'sin_especificar'))
            };
            // incluir descripción si el item la trae (útil para servicios)
            if (it.descripcion || it.description) txItem.descripcion = it.descripcion || it.description;
            setTransactions(prev => [...prev, txItem]);
          } catch (e) { console.warn('registrar tx item falló', e) }
        });
      } catch (e) {
        console.warn('Registro de transacción de venta falló', e);
      }
      return newSale;
    },

    registerSale: async (sale) => {
      // alias for addSale but returns the registered sale (also sanitize)
      function parseNum(x){
        try{ if (x === null || x === undefined || x === '') return 0; const s = String(x).trim(); const ss = (s.indexOf('.')!==-1 && s.indexOf(',')!==-1) ? s.replace(/\./g,'').replace(/,/g,'.') : (s.indexOf(',')!==-1 ? s.replace(/,/g,'.') : s); const n = Number(ss.replace(/[^0-9.\-]/g,'')); if (isNaN(n)) return 0; const MAX = 1e12; if (Math.abs(n) > MAX) return Math.sign(n)*MAX; return n }catch(e){return 0}
      }
      const paymentsArr = Array.isArray(sale.payments) ? sale.payments.map(p=> ({ ...p, amount: parseNum(p.amount) })) : []
      const paymentsSum = paymentsArr.reduce((s,p) => s + Number(p.amount || 0), 0)
      const items = Array.isArray(sale.items) ? sale.items.map(it => ({
        ...it,
        qty: Number(parseNum(it.qty || it.quantity || 0)),
        price: Number(parseNum(it.price || it.unitPrice || it.amount || 0)),
        cost: Number(parseNum(it.cost || it.unitCost || 0))
      })) : sale.items
      let computedTotal = 0
      if (Array.isArray(items) && items.length) computedTotal = items.reduce((acc,it) => acc + (Number(it.price || 0) * Number(it.qty || 0)), 0)
      const givenTotal = parseNum(sale.total || sale.totalVenta || sale.amount || sale.monto || 0)
      const totalToUse = (givenTotal && givenTotal > 0) ? Math.min(givenTotal, 1e12) : computedTotal
      const newSale = {
        ...sale,
        id: sale.id || Date.now().toString(),
        date: sale.date || new Date().toISOString(),
        payments: paymentsArr,
        pagado: paymentsSum || 0,
        items,
        total: Number(totalToUse || 0),
        type: sale.type || (sale.isPresupuesto ? 'presupuesto' : 'venta'),
      };
      // Enriquecer items con snapshot del producto
      try{
        if (Array.isArray(newSale.items)){
          newSale.items = newSale.items.map(it => {
            const prod = (products || []).find(p => String(p.id) === String(it.id));
            const snapshot = prod ? {
              id: prod.id,
              name: prod.name || prod.title || prod.descripcion || '',
              descripcion: prod.descripcion || prod.description || '',
              medidas: prod.medidas || prod.measures || null,
              stock: Number(prod.stock || 0),
              cost: Number(prod.cost || prod.unitCost || 0),
              price: Number(it.price || it.unitPrice || prod.price || prod.precio || 0),
              businessUnit: prod.businessUnit || prod.unit || 'sin_especificar'
            } : null;
            return { ...it, productSnapshot: snapshot };
          });
        }
      }catch(e){ console.warn('registerSale: failed to enrich items', e) }

      // Descontar stock por cada item vendido
      if (newSale.items && Array.isArray(newSale.items)) {
        setProducts(prev => {
          const next = [...prev];
          newSale.items.forEach(it => {
            try{
              const prodId = it && it.productSnapshot ? it.productSnapshot.id : it.id;
              const idx = next.findIndex(p => String(p.id) === String(prodId));
              if (idx !== -1 && !String(prodId).startsWith('svc_')) {
                const qty = Number(it.qty || it.quantity || 0);
                next[idx] = { ...next[idx], stock: Math.max(0, Number(next[idx].stock || 0) - qty) };
              }
            }catch(e){ }
          });
          return next;
        });
      }

      setSales(prev => [...prev, newSale]);
      try {
        // Crear transacciones por ítem (igual que en addSale)
        const paymentsSum = (newSale.payments || []).reduce((s,p) => s + Number(p.amount || 0), 0);
        const remainingDebt = newSale.type === 'fiado' ? Math.max(0, Number(newSale.total || 0) - paymentsSum) : 0;
        (newSale.items || []).forEach(it => {
          try {
            const isService = String(it.id || '').startsWith('svc_');
            const txItem = {
              id: 'tx_' + Date.now().toString() + '_' + (isService ? 'svc' : String(it.id)),
              tipo: 'venta',
              fecha: newSale.date,
              saleId: newSale.id,
              productoId: isService ? null : it.id,
              nombreProducto: it.name || it.nombre || (isService ? (it.name || 'Servicio') : ''),
              cantidad: Number(it.qty || it.quantity || 0),
              total: Number(it.qty || it.quantity || 0) * Number(it.price || it.precio || 0),
              metodoPago: newSale.metodoPago || null,
              categoria: newSale.type || null,
              cliente: (newSale.customer && (newSale.customer.name || newSale.customer.nombre)) || newSale.clienteFiado || null,
              direccion: (newSale.customer && (newSale.customer.address || newSale.customer.direccion)) || null,
              pagado: !!newSale.pagado,
              entregado: !!newSale.entregado,
              deudaActual: remainingDebt,
              businessUnit: (!isService ? ((it && it.productSnapshot && it.productSnapshot.businessUnit) || (products && products.find ? (products.find(p => String(p.id) === String(it.id))?.businessUnit) : undefined) || newSale.businessUnit || 'sin_especificar') : (newSale.businessUnit || 'sin_especificar'))
            };
            // incluir descripción si el item la trae (útil para servicios)
            if (it.descripcion || it.description) txItem.descripcion = it.descripcion || it.description;
            setTransactions(prev => [...prev, txItem]);
          } catch (e) { console.warn('registrar tx item falló', e) }
        });
      } catch (e) {
        console.warn('Registro de transacción de venta (registerSale) falló', e);
      }
      return newSale;
    },

    registerSaleStateChange: async (saleId, updates) => {
      setSales(prev => prev.map(s => s.id === saleId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s));
      return { ok: true };
    },

    deleteSale: (saleId) => {
      // Revert stock for products in the sale (if products stored by numeric id)
      const sale = (sales || []).find(s => s.id === saleId);
      if (sale && sale.items && sale.items.length) {
        setProducts(prev => {
          const next = [...prev];
          sale.items.forEach(it => {
            try {
              const rawId = typeof it.id === 'string' && it.id.startsWith('svc_') ? parseInt(it.id.replace('svc_', '')) : it.id;
              const idx = next.findIndex(p => String(p.id) === String(rawId));
              if (idx !== -1 && next[idx].stock != null) {
                next[idx] = { ...next[idx], stock: Number(next[idx].stock || 0) + Number(it.qty || 0) };
              }
            } catch (e) { }
          });
          return next;
        });
      }
      setSales(prev => prev.filter(s => s.id !== saleId));
      return { ok: true };
    },

    updateSale: (id, updates) => {
      setSales(prev => prev.map(s => {
        if (s.id === id) {
          // Si los items cambiaron, sincronizar stock
          if (updates.items && Array.isArray(updates.items)) {
            const originalItems = s.items || [];
            setProducts(prevProd => {
              const next = [...prevProd];
              
              // Primero: revertir stock de los items originales
              originalItems.forEach(oldIt => {
                const idx = next.findIndex(p => String(p.id) === String(oldIt.id));
                if (idx !== -1 && !String(oldIt.id).startsWith('svc_')) {
                  const qty = Number(oldIt.qty || oldIt.quantity || 0);
                  next[idx] = { ...next[idx], stock: Number(next[idx].stock || 0) + qty };
                }
              });
              
              // Luego: descontar stock de los nuevos items
              updates.items.forEach(newIt => {
                const idx = next.findIndex(p => String(p.id) === String(newIt.id));
                if (idx !== -1 && !String(newIt.id).startsWith('svc_')) {
                  const qty = Number(newIt.qty || newIt.quantity || 0);
                  next[idx] = { ...next[idx], stock: Math.max(0, Number(next[idx].stock || 0) - qty) };
                }
              });
              
              return next;
            });
          }
          return { ...s, ...updates };
        }
        return s;
      }));
    },

    // PAGOS DE VENTAS
    registerPayment: (payment) => {
      const { relatedId, type, amount, metodo, accountId, date } = payment;
      
      if (type === 'sale') {
        // construir el objeto de pago para adjuntar tanto a la venta como a la transacción (si existe)
        const newPayment = {
          id: Date.now().toString(),
          amount: Number(amount),
          metodo: metodo || 'efectivo',
          accountId: accountId || null,
          date: date || new Date().toISOString(),
        };

        setSales(prev => prev.map(s => {
          if (s.id === relatedId) {
            const payments = [...(s.payments || []), newPayment];
            const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            return {
              ...s,
              payments,
              pagado: totalPaid,
              pagado_completo: totalPaid >= (s.total || 0),
            };
          }
          return s;
        }));

        // También sincronizar el pago con la transacción correspondiente (si existe)
        try {
          setTransactions(prev => (prev || []).map(t => {
            if (t.saleId === relatedId) {
              const payments = [...(t.payments || []), newPayment];
              const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
              return { ...t, payments, pagado: totalPaid >= (t.total || 0) };
            }
            return t;
          }));
        } catch (e) { console.warn('sync tx payment failed', e) }

        // Sincronizar con fiado si es venta de fiado
        setSales(prevSales => {
          const sale = prevSales.find(s => s.id === relatedId);
          if (sale && sale.type === 'fiado' && sale.clienteFiado) {
            setFiados(prevFiados => prevFiados.map(f => {
              if (f.id === sale.clienteFiado) {
                const movimiento = f.movimientos?.find(m => m.saleId === relatedId);
                if (movimiento) {
                  return {
                    ...f,
                    movimientos: f.movimientos.map(m => {
                      if (m.id === movimiento.id) {
                        const payments = [...(m.payments || []), {
                          id: Date.now().toString(),
                          amount: Number(amount),
                          method: metodo || 'efectivo',
                          date: date || new Date().toISOString(),
                        }];
                        const pagado = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
                        return { ...m, payments, pagado };
                      }
                      return m;
                    }),
                  };
                }
              }
              return f;
            }));
          }
          return prevSales;
        });
      }
    },

    // CLIENTES FIADOS
    addFiadoClient: (client) => {
      const newClient = {
        ...client,
        id: client.id || Date.now(),
        nombre: client.nombre || '',
        dni: client.dni || '',
        telefono: client.telefono || '',
        direccion: client.direccion || '',
        limite: Number(client.limite || 0),
        deuda: Number(client.deuda || 0),
        movimientos: client.movimientos || [],
      };
      setFiados(prev => [...prev, newClient]);
      return newClient;
    },

    updateFiadoClient: (clientId, updates) => {
      setFiados(prev => prev.map(c => c.id === clientId ? { ...c, ...updates } : c));
    },

    deleteFiadoClient: (clientId) => {
      setFiados(prev => prev.filter(c => c.id !== clientId));
    },

    removeFiadoClient: (clientId) => {
      setFiados(prev => prev.filter(c => c.id !== clientId));
    },

    // MOVIMIENTOS DE FIADO (ENTRADAS DE DEUDA)
    addFiadoEntry: (clientId, entry) => {
      setFiados(prev => prev.map(c => {
        if (c.id === clientId) {
          const newEntry = {
            ...entry,
            id: entry.id || Date.now(),
            dateTaken: entry.dateTaken || new Date().toISOString().slice(0, 10),
            dueDate: entry.dueDate || null,
            amount: Number(entry.amount || 0),
            payments: entry.payments || [],
            active: entry.active !== false,
            saleId: entry.saleId || null,
          };
          const newDeuda = Number(c.deuda || 0) + Number(entry.amount || 0);
          return {
            ...c,
            movimientos: [...(c.movimientos || []), newEntry],
            deuda: newDeuda,
          };
        }
        return c;
      }));
    },

    updateFiadoEntry: (clientId, entryId, updates) => {
      setFiados(prev => prev.map(c => {
        if (c.id === clientId) {
          const newMovimientos = c.movimientos.map(m => {
            if (m.id === entryId) {
              return { ...m, ...updates };
            }
            return m;
          });
          return { ...c, movimientos: newMovimientos };
        }
        return c;
      }));
    },

    removeFiadoEntry: (clientId, entryId) => {
      setFiados(prev => prev.map(c => {
        if (c.id === clientId) {
          const entry = c.movimientos.find(m => m.id === entryId);
          const newDeuda = entry ? Number(c.deuda || 0) - Number(entry.amount || 0) : Number(c.deuda || 0);
          return {
            ...c,
            movimientos: c.movimientos.filter(m => m.id !== entryId),
            deuda: Math.max(0, newDeuda),
          };
        }
        return c;
      }));
    },

    toggleFiadoEntryActive: (clientId, entryId) => {
      setFiados(prev => prev.map(c => {
        if (c.id === clientId) {
          return {
            ...c,
            movimientos: c.movimientos.map(m => {
              if (m.id === entryId) {
                return { ...m, active: !m.active };
              }
              return m;
            }),
          };
        }
        return c;
      }));
    },

    // PAGOS DE FIADO
    registerFiadoPayment: (clientId, entryId, paymentData) => {
      let success = false;
      setFiados(prev => prev.map(c => {
        if (c.id === clientId) {
          const newMovimientos = c.movimientos.map(m => {
            if (m.id === entryId) {
              const newPayment = {
                id: Date.now().toString(),
                amount: Number(paymentData.amount || 0),
                method: paymentData.method || 'efectivo',
                accountId: paymentData.accountId || null,
                date: paymentData.date || new Date().toISOString(),
              };
              const payments = [...(m.payments || []), newPayment];
              const pagado = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
              success = true;
              return { ...m, payments, pagado };
            }
            return m;
          });
          // Recalcular deuda total
          const totalDeuda = newMovimientos.reduce((sum, m) => {
            if (m.active !== false) {
              const pagado = (m.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
              return sum + Math.max(0, Number(m.amount || 0) - pagado);
            }
            return sum;
          }, 0);
          return { ...c, movimientos: newMovimientos, deuda: totalDeuda };
        }
        return c;
      }));
      return { ok: success };
    },

    // COMPANY SETTINGS
    updateCompany: (patch) => {
      setCompany(prev => ({ ...(prev || {}), ...(patch || {}) }));
      return { ok: true };
    },

    // CUENTAS BANCARIAS
    addBankAccount: (account) => {
      const newAccount = {
        ...account,
        id: account.id || Date.now().toString(),
        bankName: account.bankName || '',
        number: account.number || '',
        type: account.type || '',
        holder: account.holder || '',
      };
      setBankAccounts(prev => [...prev, newAccount]);
    },

    updateBankAccount: (id, updates) => {
      setBankAccounts(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    },

    deleteBankAccount: (id) => {
      setBankAccounts(prev => prev.filter(b => b.id !== id));
    },

    // GASTOS / EXPENSES
    addExpense: (expense) => {
      const newExpense = {
        ...expense,
        id: expense.id || ('exp_' + Date.now().toString()),
        date: expense.date || new Date().toISOString(),
      };
      setExpenses(prev => [...prev, newExpense]);
      return newExpense;
    },

    // PRESUPUESTOS
    addPresupuesto: (pres) => {
      const newPres = { ...pres, id: pres.id || ('pre_' + Date.now().toString()), date: pres.date || new Date().toISOString() };
      setPresupuestos(prev => [...(prev || []), newPres]);

      // Also register a lightweight record in `sales` as history for UI (no stock impact, no transactions, no payments)
      try {
        const saleRecord = {
          id: newPres.id,
          date: newPres.date,
          items: (newPres.items || []).map(it => ({ id: it.id || ('tmp_' + Date.now()), name: it.name || it.desc || it.description || '', qty: Number(it.qty || 1), price: Number(it.price || 0) })),
          subtotal: newPres.subtotal || newPres.totals?.subtotal || 0,
          discountPct: Number(newPres.discountPct || newPres.totals?.discountPercent || 0),
          total: Number(newPres.total || newPres.totals?.total || 0),
          type: 'presupuesto',
          isPresupuesto: true,
          customer: newPres.customer || newPres.clienteData || null,
          validityDays: newPres.validityDays || newPres.totals?.validityDays || null,
          condition: newPres.condition || newPres.condicion || null,
          bankAccountId: newPres.bankAccountId || null,
          observations: newPres.observations || newPres.observaciones || null,
        };
        // push into sales without using registerSale/addSale so we avoid side effects
        setSales(prev => [...(prev || []), saleRecord]);
      } catch (e) {
        console.warn('addPresupuesto: failed to also register sale history', e)
      }

      return newPres;
    },

    convertPresupuestoToSale: (presId) => {
      const pres = (presupuestos || []).find(p => p.id === presId);
      if (!pres) return null;
      const sale = {
        id: 's_' + Date.now().toString(),
        date: new Date().toISOString(),
        items: (pres.items || []).map(it => ({ id: it.id || it.desc || ('tmp_' + Date.now()), name: it.desc || it.name || '', qty: Number(it.qty || 1), price: Number(it.price || 0) })),
        total: pres.totals?.total || pres.total || 0,
        profit: 0,
        type: 'venta',
        metodoPago: pres.condicion === 'Transferencia' ? 'transferencia' : 'efectivo',
        entregado: false,
        pagado: pres.condicion === 'contado' || pres.condicion === 'Contado',
        customer: pres.clienteData || pres.customer || null
      };

      // Descontar stock por cada item (si corresponde)
      if (sale.items && Array.isArray(sale.items)) {
        setProducts(prev => {
          const next = [...prev];
          sale.items.forEach(it => {
            try {
              const rawId = typeof it.id === 'string' && it.id.startsWith('svc_') ? parseInt(it.id.replace('svc_', '')) : it.id;
              const idx = next.findIndex(p => String(p.id) === String(rawId));
              if (idx !== -1 && !String(it.id).startsWith('svc_')) {
                const qty = Number(it.qty || it.quantity || 0);
                next[idx] = { ...next[idx], stock: Math.max(0, Number(next[idx].stock || 0) - qty) };
              }
            } catch (e) { }
          });
          return next;
        });
      }

      // Persist sale
      setSales(prev => [...prev, sale]);

      // Crear transacciones por ítem vendido
      try {
        const paymentsSum = (sale.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
        const remainingDebt = sale.type === 'fiado' ? Math.max(0, Number(sale.total || 0) - paymentsSum) : 0;
        (sale.items || []).forEach(it => {
          try {
            const isService = String(it.id || '').startsWith('svc_');
            const txItem = {
              id: 'tx_' + Date.now().toString() + '_' + (isService ? 'svc' : String(it.id)),
              tipo: 'venta',
              fecha: sale.date,
              saleId: sale.id,
              productoId: isService ? null : it.id,
              nombreProducto: it.name || it.nombre || (isService ? (it.name || 'Servicio') : ''),
              cantidad: Number(it.qty || it.quantity || 0),
              total: Number(it.qty || it.quantity || 0) * Number(it.price || it.precio || 0),
              metodoPago: sale.metodoPago || null,
              categoria: sale.type || null,
              cliente: (sale.customer && (sale.customer.name || sale.customer.nombre)) || sale.clienteFiado || null,
              direccion: (sale.customer && (sale.customer.address || sale.customer.direccion)) || null,
              pagado: !!sale.pagado,
              entregado: !!sale.entregado,
              deudaActual: remainingDebt,
            };
            if (it.descripcion || it.description) txItem.descripcion = it.descripcion || it.description;
            setTransactions(prev => [...prev, txItem]);
          } catch (e) { console.warn('registrar tx item falló', e) }
        });
      } catch (e) { console.warn('Registro de transacción de venta falló', e) }

      return sale;
    },

    convertPresupuestoToInvoice: (presId) => {
      const sale = actions.convertPresupuestoToSale ? actions.convertPresupuestoToSale(presId) : null;
      if (!sale) return null;
      try {
        if (sale.then) {
          return sale.then(s => ({ ...s, type: 'factura' }));
        }
        return { ...sale, type: 'factura' };
      } catch (e) { return sale }
    },

    // TRANSACCIONES (unificado)
    addTransaction: (tx) => {
      const transaction = {
        ...tx,
        id: tx.id || ('tx_' + Date.now().toString()),
        fecha: tx.fecha || new Date().toISOString(),
      };
      setTransactions(prev => [...prev, transaction]);
      return transaction;
    },

    // helpers específicos (compra / reposicion)
    addPurchaseTransaction: (data) => {
      const tx = {
        id: data.id || ('tx_' + Date.now().toString()),
        tipo: 'compra',
        fecha: data.fecha || new Date().toISOString(),
        productoId: data.productoId || null,
        nombreProducto: data.nombreProducto || '',
        cantidad: Number(data.cantidad || 0),
        costoUnitario: Number(data.costoUnitario || 0),
        total: Number(data.cantidad || 0) * Number(data.costoUnitario || 0),
        businessUnit: data.businessUnit || undefined,
      };
      setTransactions(prev => [...prev, tx]);
      // también registrar como gasto
      const exp = { id: 'exp_' + Date.now().toString(), date: tx.fecha, description: `Compra ${tx.nombreProducto}`, amount: tx.total, category: 'materiales', businessUnit: tx.businessUnit };
      setExpenses(prev => [...prev, exp]);
      return tx;
    },

    addRepositionTransaction: (data) => {
      const tx = {
        id: data.id || ('tx_' + Date.now().toString()),
        tipo: 'reposicion',
        fecha: data.fecha || new Date().toISOString(),
        productoId: data.productoId || null,
        nombreProducto: data.nombreProducto || '',
        cantidad: Number(data.cantidad || 0),
        costoUnitario: Number(data.costoUnitario || 0),
        total: Number(data.cantidad || 0) * Number(data.costoUnitario || 0),
        businessUnit: data.businessUnit || undefined,
      };
      setTransactions(prev => [...prev, tx]);
      const exp = { id: 'exp_' + Date.now().toString(), date: tx.fecha, description: `Reposición ${tx.nombreProducto}`, amount: tx.total, category: 'materiales', businessUnit: tx.businessUnit };
      setExpenses(prev => [...prev, exp]);
      return tx;
    },

    updateExpense: (id, updates) => {
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    },

    deleteExpense: (id) => {
      setExpenses(prev => prev.filter(e => e.id !== id));
    },
  };

  return (
    <StoreContext.Provider value={{
      sales,
      fiados,
      products,
      services,
      serviceTemplates,
      transactions,
      bankAccounts,
      payments,
      expenses,
      company,
      // Selector helper: calcular datos del dashboard (por unidad y totales)
      getDashboardData: (dateRange) => {
        try{
          return calculateFinancialData(dateRange || { start: '1970-01-01', end: new Date().toISOString().slice(0,10) }, sales || [], expenses || [], transactions || [])
        }catch(e){ console.warn('getDashboardData failed', e); return null }
      },
      actions,
    }}>
      {children}
    </StoreContext.Provider>
  );
}