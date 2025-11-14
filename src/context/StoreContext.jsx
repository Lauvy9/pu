import React, { createContext, useContext, useMemo, useEffect } from "react";
import * as fh from '../firebase/firestoreHelpers'
import useLocalStorage from "../hooks/useLocalStorage";
import { calcPrices } from "../utils/helpers";
import { isPaymentOnOrBeforeDue } from "../utils/dateHelpers";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  // Estado general del negocio
  const [products, setProducts] = useLocalStorage("vid_prod", []);  // productos
  const [sales, setSales] = useLocalStorage("vid_sales", []);      // ventas
  const [entries, setEntries] = useLocalStorage("vid_entries", []); // entradas de stock
  const [fiados, setFiados] = useLocalStorage("vid_fiados", []);   // clientes que deben
  const [services, setServices] = useLocalStorage("vid_servicios", []); // servicios
  const [bankAccounts, setBankAccounts] = useLocalStorage("vid_accounts", []); // cuentas bancarias
  const [presupuestos, setPresupuestos] = useLocalStorage("vid_presupuestos", []);
  const [invoices, setInvoices] = useLocalStorage("vid_invoices", []);
  const [payments, setPayments] = useLocalStorage("vid_payments", []);
  const [expenses, setExpenses] = useLocalStorage("vid_gastos", []);
  const [savedReports, setSavedReports] = useLocalStorage("vid_saved_reports", []);

  // One-time migration: normalize stored dates and compute `onTime` for existing payments/movements
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (localStorage.getItem('migrated_onTime_v1')) return;
      const toISO = (s) => {
        if (!s) return null;
        try {
          if (typeof s !== 'string') return new Date(s).toISOString();
          // ISO-like
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s).toISOString();
          // DD/MM/YYYY or DD/MM/YYYY HH:MM(:SS)
          const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
          if (m) {
            const dd = m[1], mm = m[2], yyyy = m[3], hh = m[4] || '00', mi = m[5] || '00', ss = m[6] || '00'
            return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}Z`).toISOString();
          }
          return new Date(s).toISOString();
        } catch (e) { return s }
      }

      let anyChange = false;

      // normalize fiados
      const normalizedFiados = (fiados || []).map(f => {
        let changed = false
        const movimientos = (f.movimientos || []).map(m => {
          const nm = { ...m }
          // normalize dueDate
          if (nm.dueDate) {
            const iso = toISO(nm.dueDate)
            if (iso && iso !== nm.dueDate) { nm.dueDate = iso; changed = true }
          }
          // normalize payments
          nm.payments = (nm.payments || []).map(p => {
            const np = { ...p }
            const rawDate = p.date || p.fecha || p.fecha_pago || p.createdAt || null
            const isoP = toISO(rawDate) || new Date().toISOString()
            if (isoP !== np.date) { np.date = isoP; changed = true }
            // compute onTime
            try {
              if (typeof np.onTime === 'undefined') {
                np.onTime = isPaymentOnOrBeforeDue(np.date, nm.dueDate)
                changed = true
              }
            } catch(e) { np.onTime = true }
            return np
          })
          // recompute restante
          const total = Number(nm.amount || 0)
          const paid = (nm.payments || []).reduce((s,pp) => s + Number(pp.amount || 0), 0)
          const restante = Math.max(0, total - paid)
          if (nm.restante !== restante) { nm.restante = restante; changed = true }
          if (changed) anyChange = true
          return nm
        })
        return { ...f, movimientos }
      })

      // normalize sales/payments
      const normalizedSales = (sales || []).map(s => {
        let changed = false
        const ns = { ...s }
        if (ns.dueDate) {
          const iso = toISO(ns.dueDate)
          if (iso && iso !== ns.dueDate) { ns.dueDate = iso; changed = true }
        }
        ns.payments = (ns.payments || []).map(p => {
          const np = { ...p }
          const rawDate = p.date || p.fecha || p.createdAt || null
          const isoP = toISO(rawDate) || new Date().toISOString()
          if (isoP !== np.date) { np.date = isoP; changed = true }
          try {
            if (typeof np.onTime === 'undefined') {
              np.onTime = isPaymentOnOrBeforeDue(np.date, ns.dueDate)
              changed = true
            }
          } catch(e) { np.onTime = true }
          return np
        })
        if (changed) anyChange = true
        return ns
      })

      if (anyChange) {
        try { setFiados(normalizedFiados) } catch(e){}
        try { setSales(normalizedSales) } catch(e){}
      }
      localStorage.setItem('migrated_onTime_v1', '1')
    } catch(e) {
      console.warn('migration onTime failed', e)
    }
  }, [])

  const actions = useMemo(
    () => ({
      // 📦 Agregar producto nuevo
      addProduct: (p) => {
        const withPrices = { ...calcPrices(p) };
        // ensure id
        if (!withPrices.id) withPrices.id = Date.now();
        setProducts((prev) => [...prev, withPrices]);
        // If Firestore sync enabled, create document there too (non-blocking)
        try {
          if (import.meta.env.VITE_USE_FIRESTORE === 'true') {
            ;(async () => {
              try {
                const fid = await fh.createDoc('productos', withPrices)
                // store firestore id as fsId for traceability
                setProducts(prev => prev.map(x => x.id === withPrices.id ? { ...x, fsId: fid } : x))
              } catch (e) {
                console.warn('Firestore create product failed', e)
              }
            })()
          }
        } catch(e) {}
        setEntries((prev) => [
          ...prev,
          {
            date: new Date().toISOString(),
            product: withPrices,
            qty: p.stock,
            cost: p.cost,
          },
        ]);
      },

      // 🧩 Actualizar producto existente
      updateProduct: (id, patch) => {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, ...patch, ...calcPrices({ ...p, ...patch }) }
              : p
          )
        );
        // sync to Firestore if available
        try {
          if (import.meta.env.VITE_USE_FIRESTORE === 'true') {
            ;(async () => {
              try {
                const prod = products.find(p => p.id === id)
                if (prod && prod.fsId) {
                  await fh.updateDocById('productos', prod.fsId, { ...prod, ...patch })
                }
              } catch (e) { console.warn('Firestore update product failed', e) }
            })()
          }
        } catch(e) {}
      },

      // 🗑️ Eliminar producto
      removeProduct: (id) => {
        // if synced to Firestore, attempt delete
        const prod = products.find(p => p.id === id)
        if (prod && import.meta.env.VITE_USE_FIRESTORE === 'true' && prod.fsId) {
          ;(async () => {
            try {
              await fh.updateDocById('productos', prod.fsId, { deleted: true })
            } catch(e) { console.warn('Firestore soft-delete failed', e) }
          })()
        }
        setProducts((prev) => prev.filter((p) => p.id !== id));
      },

      // 💰 Registrar venta
      registerSale: (sale) => {
        // sale: { items: [{id, qty, price, type}], total, profit, date, cliente? }

        // Actualizar stock de productos vendidos
        setProducts((prev) =>
          prev.map((prod) => {
            const item = sale.items.find((i) => i.id === prod.id);
            if (item) {
              return { ...prod, stock: Math.max(0, prod.stock - item.qty) };
            }
            return prod;
          })
        );

        // Guardar venta
        setSales((prev) => [...prev, sale]);

        // Si es venta fiada, registrar al cliente en fiados
        if (sale.cliente) {
          setFiados((prev) => {
            const existing = prev.find((f) => f.nombre === sale.cliente);
            if (existing) {
              // sumar deuda
              return prev.map((f) =>
                f.nombre === sale.cliente
                  ? { ...f, deuda: f.deuda + sale.total }
                  : f
              );
            } else {
              // crear nuevo cliente fiado
              return [
                ...prev,
                { nombre: sale.cliente, deuda: sale.total, fecha: new Date().toISOString() },
              ];
            }
          });
        }
      },

      // 📥 Agregar stock (nueva entrada)
      addStockEntry: (entry) => {
        // entry: {id, qty, cost}
        setProducts((prev) =>
          prev.map((p) =>
            p.id === entry.id
              ? {
                  ...p,
                  stock: p.stock + entry.qty,
                  cost: entry.cost,
                  ...calcPrices({ ...p, cost: entry.cost }),
                }
              : p
          )
        );

        setEntries((prev) => [
          ...prev,
          { ...entry, date: new Date().toISOString() },
        ]);
      },

      // Gastos (expenses) - persistidos en localStorage via useLocalStorage
      addExpense: (expense) => {
        const e = { id: expense.id || ('exp_' + Date.now()), date: expense.date || new Date().toISOString(), description: expense.description || expense.descripcion || '', amount: Number(expense.amount || expense.monto || 0), category: expense.category || expense.tipo || 'general' }
        setExpenses(prev => [...prev, e])
        return e
      },
      updateExpense: (id, patch) => {
        setExpenses(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x))
      },
      removeExpense: (id) => {
        setExpenses(prev => prev.filter(x => x.id !== id))
      },

      // Reportes guardados (historial)
      saveReport: (report) => {
        // report: { id?, date?, type?, data, pdfUrl?, summary? }
        const r = { id: report.id || ('report_' + Date.now()), date: report.date || new Date().toISOString(), type: report.type || 'manual', data: report.data || {}, pdfUrl: report.pdfUrl || null, summary: report.summary || {} }
        setSavedReports(prev => [r, ...(prev || [])])
        return r
      },
      getReport: (id) => {
        return (savedReports || []).find(r => r.id === id) || null
      },
      deleteReport: (id) => {
        setSavedReports(prev => (prev || []).filter(r => r.id !== id))
      },

      // 💳 Registrar pago de fiado
      payFiado: (cliente, monto) => {
        setFiados((prev) =>
          prev
            .map((f) =>
              f.nombre === cliente
                ? { ...f, deuda: Math.max(0, f.deuda - monto) }
                : f
            )
            .filter((f) => f.deuda > 0)
        );
      },
      // CRUD clientes fiados (más completo, usado por UI Fiados)
      addFiadoClient: (client) => {
        const withId = { id: client.id || Date.now(), ...client };
        setFiados(prev => [...prev, { ...withId, deuda: Number(withId.deuda||0), movimientos: withId.movimientos || [] }]);
        return withId;
      },
      updateFiadoClient: (id, patch) => {
        setFiados(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
      },
      removeFiadoClient: (id) => {
        setFiados(prev => prev.filter(f => f.id !== id));
      },
      addFiadoEntry: (clientId, entry) => {
        setFiados(prev => prev.map(f => {
          if (f.id !== clientId) return f
          const e = { id: entry.id || Date.now(), amount: Number(entry.amount||0), dateTaken: entry.dateTaken || new Date().toISOString().slice(0,10), dueDate: entry.dueDate || null, note: entry.note || '', payments: [], active: true, saleId: entry.saleId || null }
          const nf = { ...f, movimientos: [...(f.movimientos||[]), e], deuda: Number(f.deuda || 0) + Number(e.amount) }
          return nf
        }))
      },
      registerFiadoPayment: (clientId, entryId, { amount, method, accountId, date }) => {
        // date: optional ISO string representing payment date; if not provided, now is used
        let payment = null
        setFiados(prev => prev.map(f => {
          if (f.id !== clientId) return f
          const nextMov = (f.movimientos || []).map(m => {
            if (m.id !== entryId) return m
            const pd = date || new Date().toISOString()
            const p = { id: 'pay_' + Date.now(), date: pd, amount: Number(amount||0), method: method || 'efectivo', accountId: accountId || null, onTime: (() => { try { return isPaymentOnOrBeforeDue(pd, m.dueDate) } catch(e){ return true } })() }
            payment = p
            return { ...m, payments: [...(m.payments||[]), p] }
          })
          const totalOutstanding = nextMov.reduce((s, m) => s + (m.active ? (Number(m.amount) - (m.payments ? m.payments.reduce((sp, pp)=> sp + Number(pp.amount || 0),0) : 0)) : 0), 0)
          return { ...f, movimientos: nextMov, deuda: Number(totalOutstanding) }
        }))
        if (payment) {
          try{ actions.registerPayment({ relatedId: clientId, type: 'fiado', metodo: payment.method, amount: payment.amount, date: payment.date, accountId: payment.accountId, entryId: entryId }) }catch(e){ console.warn('registerPayment failed', e) }
          return { ok: true, payment }
        }
        return { ok:false }
      },
      toggleFiadoEntryActive: (clientId, entryId) => {
        setFiados(prev => prev.map(f => {
          if (f.id !== clientId) return f
          const nextMov = (f.movimientos||[]).map(m => m.id === entryId ? { ...m, active: !m.active, removedAt: (!m.active ? null : new Date().toISOString()) } : m)
          const totalOutstanding = nextMov.reduce((s, m) => s + (m.active ? (Number(m.amount) - (m.payments ? m.payments.reduce((sp, pp)=> sp + Number(pp.amount || 0),0) : 0)) : 0), 0)
          return { ...f, movimientos: nextMov, deuda: Number(totalOutstanding) }
        }))
      },
      removeFiadoEntry: (clientId, entryId) => {
        setFiados(prev => prev.map(f => {
          if (f.id !== clientId) return f
          const nextMov = (f.movimientos||[]).filter(m => m.id !== entryId)
          const totalOutstanding = nextMov.reduce((s, m) => s + (m.active ? (Number(m.amount) - (m.payments ? m.payments.reduce((sp, pp)=> sp + Number(pp.amount || 0),0) : 0)) : 0), 0)
          return { ...f, movimientos: nextMov, deuda: Number(totalOutstanding) }
        }))
      },
      updateFiadoEntry: (clientId, entryId, patch) => {
        setFiados(prev => prev.map(f => {
          if (f.id !== clientId) return f
          const nextMov = (f.movimientos||[]).map(m => m.id === entryId ? { ...m, ...patch } : m)
          const totalOutstanding = nextMov.reduce((s, m) => s + (m.active ? (Number(m.amount) - (m.payments ? m.payments.reduce((sp, pp)=> sp + Number(pp.amount || 0),0) : 0)) : 0), 0)
          return { ...f, movimientos: nextMov, deuda: Number(totalOutstanding) }
        }))
      },
      // 🔁 Cambiar estados de una venta (persistente)
      registerSaleStateChange: (id, patch) => {
        setSales(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
      },

      // 🏦 Gestión de cuentas bancarias
      addBankAccount: (account) => {
        // account: { bankName, type, number, holder, cbu, alias }
        const withId = { id: Date.now(), ...account };
        setBankAccounts(prev => [...prev, withId]);
        return withId;
      },
      getBankAccounts: () => bankAccounts,

      // 🧰 Servicios
      addService: (svc) => {
        const withId = { id: Date.now(), ...svc };
        setServices(prev => [...prev, withId]);
        try {
          if (import.meta.env.VITE_USE_FIRESTORE === 'true') {
            ;(async () => {
              try {
                const fid = await fh.createDoc('servicios', withId)
                setServices(prev => prev.map(x => x.id === withId.id ? { ...x, fsId: fid } : x))
              } catch(e) { console.warn('Firestore create service failed', e) }
            })()
          }
        } catch(e) {}
        return withId;
      },
      // Actualizar servicio
      updateService: (id, patch) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
        try {
          if (import.meta.env.VITE_USE_FIRESTORE === 'true') {
            ;(async () => {
              try {
                const svc = services.find(s => s.id === id)
                if (svc && svc.fsId) await fh.updateDocById('servicios', svc.fsId, { ...svc, ...patch })
              } catch(e){ console.warn('Firestore update service failed', e) }
            })()
          }
        } catch(e){}
      },
      // Eliminar servicio
      removeService: (id) => {
        setServices(prev => prev.filter(s => s.id !== id));
        try {
          const svc = services.find(s => s.id === id)
          if (svc && import.meta.env.VITE_USE_FIRESTORE === 'true' && svc.fsId) {
            ;(async ()=>{ try{ await fh.updateDocById('servicios', svc.fsId, { deleted: true }) }catch(e){ console.warn('Firestore soft-delete service failed', e) } })()
          }
        } catch(e){}
      },

      // Eliminar venta (revierte stock y borra la venta)
      deleteSale: (id) => {
        const sale = sales.find(s => s.id === id);
        if (!sale) return { ok: false, error: 'Sale not found' };
        // revertir stock
        if (sale.items && sale.items.length) {
          setProducts(prev => prev.map(prod => {
            const item = sale.items.find(i => i.id === prod.id);
            if (item) return { ...prod, stock: (prod.stock || 0) + (item.qty || 0) };
            return prod;
          }))
        }
        // eliminar venta
        setSales(prev => prev.filter(s => s.id !== id));
        return { ok: true, sale };
      },

      // Actualizar venta (recalcula stock según diferencia entre venta vieja y nueva)
      updateSale: (id, newSale) => {
        const old = sales.find(s => s.id === id);
        if (!old) return { ok: false, error: 'Sale not found' };
        // Primero revertir el stock de la venta antigua
        if (old.items && old.items.length) {
          setProducts(prev => prev.map(prod => {
            const item = old.items.find(i => i.id === prod.id);
            if (item) return { ...prod, stock: (prod.stock || 0) + (item.qty || 0) };
            return prod;
          }))
        }
        // Luego aplicar la nueva venta (restar cantidades)
        if (newSale.items && newSale.items.length) {
          setProducts(prev => prev.map(prod => {
            const item = newSale.items.find(i => i.id === prod.id);
            if (item) return { ...prod, stock: Math.max(0, (prod.stock || 0) - (item.qty || 0)) };
            return prod;
          }))
        }
        // Reemplazar la venta en el array
        setSales(prev => prev.map(s => s.id === id ? { ...newSale } : s));
        return { ok: true, old };
      },

      // 📝 Presupuestos y facturación (cliente-side minimal)
      addPresupuesto: (pres) => {
        // pres: { clienteId, clienteData, items: [{desc, qty, price}], totals, status }
        const p = { id: 'pre_' + Date.now(), date: new Date().toISOString(), ...pres };
        setPresupuestos(prev => [...prev, p]);
        return p;
      },

      convertPresupuestoToInvoice: (presupuestoId) => {
        const pres = presupuestos.find(p => p.id === presupuestoId);
        if (!pres) return null;
        const inv = { id: 'inv_' + Date.now(), date: new Date().toISOString(), presupuestoId, cliente: pres.clienteData, items: pres.items, total: pres.totals.total, status: 'pending' };
        setInvoices(prev => [...prev, inv]);
        setPresupuestos(prev => prev.map(p => p.id === presupuestoId ? { ...p, status: 'converted' } : p));
        return inv;
      },

      // Convertir presupuesto directamente a venta (registra venta y ajusta stock)
      convertPresupuestoToSale: (presupuestoId) => {
        const pres = presupuestos.find(p => p.id === presupuestoId);
        if (!pres) return null;
        try {
          const sale = {
            id: 's_' + Date.now(),
            date: new Date().toISOString(),
            items: (pres.items || []).map(it => ({ id: it.id || it.desc, name: it.desc, qty: Number(it.qty||1), price: Number(it.price||0), type: 'product' })),
            total: pres.totals.total,
            profit: 0,
            type: 'minorista',
            metodoPago: pres.condicion === 'contado' ? 'efectivo' : '',
            entregado: false,
            pagado: pres.condicion === 'contado',
            clienteFiado: pres.condicion === 'fiado' ? (pres.clienteData && pres.clienteData.id) : null,
          }
          // registrar venta (actualiza stock y guarda en sales)
          actions.registerSale(sale)
          // marcar presupuesto como convertido/accepted
          setPresupuestos(prev => prev.map(p => p.id === presupuestoId ? { ...p, status: 'accepted', convertedAt: new Date().toISOString() } : p))
          return sale
        } catch(e) { console.warn('convertPresupuestoToSale failed', e); return null }
      },

      // Registrar pago (asocia a invoice, venta o fiado). Soporta pagos parciales para ventas.
      registerPayment: (payment) => {
        // payment: { relatedId, type: 'invoice'|'sale'|'fiado', metodo, amount, date, accountId, entryId }
        const p = { id: 'pay_' + Date.now(), date: payment.date || new Date().toISOString(), ...payment };
        setPayments(prev => [...prev, p]);

        // si es invoice actualizar estado (comportamiento previo)
        if (payment.type === 'invoice') {
          setInvoices(prev => prev.map(inv => inv.id === payment.relatedId ? { ...inv, status: 'paid' } : inv));
        }

        // si es venta: registrar pago parcial/total en la venta
        if (payment.type === 'sale') {
          // Añadir el pago dentro de la venta (sales[*].payments)
          setSales(prev => prev.map(s => {
            if (s.id !== payment.relatedId) return s;
            const nextPayments = [...(s.payments || []), p];
            const totalPaid = nextPayments.reduce((sum, pp) => sum + Number(pp.amount || 0), 0);
            const pagado = totalPaid >= Number(s.total || 0);
            return { ...s, payments: nextPayments, pagado };
          }));

          // Si la venta está asociada a un cliente fiado, también registrar el pago sobre el movimiento relacionado
          try {
            const sale = sales.find(s => s.id === payment.relatedId);
            if (sale && sale.type === 'fiado' && sale.clienteFiado) {
              const clienteId = typeof sale.clienteFiado === 'string' ? parseInt(sale.clienteFiado) : sale.clienteFiado;
              const cliente = (fiados || []).find(f => f.id === clienteId || f.nombre === sale.clienteFiado);
              if (cliente) {
                // encontrar movimiento que referencia esta venta (saleId)
                const movimiento = (cliente.movimientos || []).find(m => String(m.saleId) === String(sale.id));
                if (movimiento) {
                  // reutilizar registerFiadoPayment para consistencia (usa setFiados internamente)
                  actions.registerFiadoPayment(cliente.id, movimiento.id, { amount: payment.amount, method: payment.metodo || payment.method, accountId: payment.accountId });
                }
              }
            }
          } catch(e) { console.warn('registerPayment: sync to fiados failed', e) }
        }

        return p;
      },
      // 🔄 Sincronizar productos locales a Firestore (manual)
      syncProductsToFirestore: async () => {
        if (!(import.meta.env.VITE_USE_FIRESTORE === 'true')) return { ok: false, error: 'Firestore sync disabled' }
        try{
          for (const p of products) {
            if (!p.fsId) {
              const fid = await fh.createDoc('productos', p)
              setProducts(prev => prev.map(x => x.id === p.id ? { ...x, fsId: fid } : x))
            }
          }
          return { ok: true }
        }catch(e){
          return { ok: false, error: String(e) }
        }
      },
    }),
    [setProducts, setSales, setEntries, setFiados, setServices, setBankAccounts, setPresupuestos, setInvoices, setPayments, setExpenses, products, sales, entries, fiados, services, bankAccounts, presupuestos, invoices, payments, expenses]
  );

  // Normalizar productos antiguos en localStorage: asegurar que tengan porcentajes y precios calculados
  useEffect(() => {
    if (!products || products.length === 0) return;
    let changed = false;
    const normalized = products.map(p => {
      // if already has porcentaje fields and prices, skip
      if (p.porcentajeGananciaMinorista != null && p.porcentajeGananciaMayorista != null && p.price_minor != null && p.price_mayor != null) return p;
      const cost = p.cost ?? p.price ?? 0;
      const merged = calcPrices({ ...p, cost });
      // preserve id if present
      if (!merged.id && p.id) merged.id = p.id;
      changed = true;
      return merged;
    });
    if (changed) setProducts(normalized);
  }, []);

  // Si VITE_USE_FIRESTORE=true, intentar sincronizar productos que no tienen fsId (uno-a-uno no destructivo)
  useEffect(() => {
    try{
      if (import.meta.env.VITE_USE_FIRESTORE === 'true' && products && products.length) {
        products.forEach(p => {
          if (!p.fsId) {
            ;(async () => {
              try{
                const fid = await fh.createDoc('productos', p)
                setProducts(prev => prev.map(x => x.id === p.id ? { ...x, fsId: fid } : x))
              }catch(e){ console.warn('Sync product to Firestore failed', e) }
            })()
          }
        })
      }
    }catch(e){}
  }, [products]);

  return (
    <StoreContext.Provider
      value={{ products, sales, entries, fiados, services, bankAccounts, presupuestos, invoices, payments, expenses, savedReports, actions }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
