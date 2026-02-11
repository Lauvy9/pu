import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { useStore } from "../context/StoreContext";
import "./SalesDashboard.css";

// Colores modernos proporcionados
const COLORS = {
  aqua: "#7EE8C1",
  violet: "#C9A8FF",
  pink: "#FFB1D3",
  yellow: "#FFD97E",
  sky: "#8ED1FC",
  neutralText: "#213547",
  cardBg: "#ffffff",
};

// Helper: convertir a número seguro
const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Formateador de moneda local (fallback simple si Intl no disponible)
function formatCurrency(n) {
  try {
    if (typeof Intl !== "undefined" && Intl.NumberFormat) {
      return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
    }
  } catch (e) {}
  return "$" + (Math.round(n) || 0);
}

// Componente principal
export default function SalesDashboard() {
  // 1) Conectar al Store y aplicar fallback a arrays vacíos
  const { sales = [], products = [], fiados = [] } = useStore() || {};
  
  // Demo data (solo en desarrollo). Se usa si los arrays del Store vienen vacíos.
  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'development';
  const demoProducts = [
    { id: 'p1', nombre: 'Vidrio Float 4mm' },
    { id: 'p2', nombre: 'Marco Aluminio A' },
    { id: 'p3', nombre: 'Silicona Sellador' },
    { id: 'p4', nombre: 'Bisagra X' },
  ];
  const demoSales = [
    { id: 's1', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), total: 12000, items: [{ id: 'p1', qty: 2, price: 4000 }, { id: 'p3', qty: 1, price: 4000 }] },
    { id: 's2', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), total: 8000, items: [{ id: 'p2', qty: 1, price: 8000 }] },
    { id: 's3', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), total: 6000, items: [{ id: 'p1', qty: 1, price: 4000 }, { id: 'p4', qty: 1, price: 2000 }, { id: 'p3', qty: 1, price: 0 }] },
    { id: 's4', date: new Date().toISOString(), total: 15000, items: [{ id: 'p2', qty: 2, price: 7500 }] },
  ];
  const demoFiados = [
    { id: 'c1', nombre: 'Comercial Ruiz', deuda: 4500 },
    { id: 'c2', nombre: 'Constructora Delta', deuda: 12000 },
  ];
  
  // Permitir forzar uso de datos demo desde UI (útil si el entorno no se considera 'development')
  const [forceDemo, setForceDemo] = useState(false);
  const usingDemo = (isDev || forceDemo);
  const effectiveProducts = (products && products.length) ? products : (usingDemo ? demoProducts : []);
  const effectiveSales = (sales && sales.length) ? sales : (usingDemo ? demoSales : []);
  const effectiveFiados = (fiados && fiados.length) ? fiados : (usingDemo ? demoFiados : []);

  // Debug runtime: ver en consola los datos que llegan desde StoreContext
  // (Elimina o comenta esta línea cuando verifiques localmente)
  console.debug('SalesDashboard - store samples', { salesLength: (sales||[]).length, productsLength: (products||[]).length, fiadosLength: (fiados||[]).length, usingDemo: isDev && (!sales || sales.length===0), effectiveSales: effectiveSales.length, effectiveProducts: effectiveProducts.length, effectiveFiados: effectiveFiados.length });

  // Banner state: permite ocultar el banner debug si el usuario lo desea
  const [bannerVisible, setBannerVisible] = useState(true);

  // 2) Agregaciones memoizadas para rendimiento y reactividad
  const totalSales = useMemo(() => (effectiveSales || []).reduce((s, it) => s + safeNumber(it.total), 0), [effectiveSales]);

  const totalClients = useMemo(() => (effectiveFiados || []).length, [effectiveFiados]);

  const totalDebt = useMemo(() => (effectiveFiados || []).reduce((s, c) => s + safeNumber(c.deuda), 0), [effectiveFiados]);

  const salesByDay = useMemo(() => {
    const map = {};
    (effectiveSales || []).forEach((s) => {
      const d = s && s.date ? new Date(s.date) : null;
      const key = d ? d.toISOString().slice(0, 10) : (s.date || "").slice(0, 10) || "sin-fecha";
      map[key] = (map[key] || 0) + safeNumber(s.total);
    });
    return Object.keys(map)
      .sort()
      .map((k) => ({ date: k, total: Number(map[k]) }));
  }, [effectiveSales]);

  const topProducts = useMemo(() => {
    const counts = {};
    (effectiveSales || []).forEach((s) => {
      (s.items || []).forEach((it) => {
        const id = String(it.id || it.productId || it.product || "unknown");
        const qty = safeNumber(it.qty || it.quantity || it.cantidad || it.qty || 0) || 0;
        counts[id] = (counts[id] || 0) + qty;
      });
    });
    const arr = Object.keys(counts).map((id) => {
      const prod = (effectiveProducts || []).find((p) => String(p.id) === id) || {};
      return { id, name: prod.nombre || prod.name || `ID:${id}`, qty: counts[id] };
    });
    return arr.sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [effectiveSales, effectiveProducts]);

  const debtByClient = useMemo(() => {
    return (effectiveFiados || []).filter((c) => safeNumber(c.deuda) > 0).map((c) => ({ name: c.nombre || `Cliente ${c.id || ""}`, value: safeNumber(c.deuda) }));
  }, [effectiveFiados]);

  // 3) Render con fallbacks por gráfico
  return (
    <div className="sales-dashboard-root" style={{ padding: 12 }}>
      {/* Panel visible para depuración rápida: muestra longitudes de los arrays del Store */}
      {/* Banner debug fijo y visible: aparece en la parte superior y se puede cerrar */}
      {bannerVisible && (
        <div style={{ position: 'fixed', top: 8, left: 8, right: 8, zIndex: 9999, border: '2px solid #e11d48', borderRadius: 8, padding: 10, background: '#fff7ed', color: '#0f172a', boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <strong style={{ color: '#b91c1c' }}>DEBUG</strong>
            <span>store.sales: {(sales||[]).length}</span>
            <span>store.products: {(products||[]).length}</span>
            <span>store.fiados: {(fiados||[]).length}</span>
            <span>effective.sales: {effectiveSales.length}</span>
            <span>effective.products: {effectiveProducts.length}</span>
            <span>effective.fiados: {effectiveFiados.length}</span>
            {(usingDemo && (!sales || sales.length === 0)) ? <span style={{ marginLeft: 8, color: '#7c3aed' }}> (usando datos de demo)</span> : null}
            {(!usingDemo && (effectiveSales.length===0 && effectiveProducts.length===0)) ? (
              <button onClick={() => setForceDemo(true)} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Usar datos demo</button>
            ) : null}
            <button onClick={() => setBannerVisible(false)} style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}
      {/* Tarjetas resumen */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={cardStyle}>
          <div style={cardHeaderStyle(COLORS.aqua)}>Total Ventas</div>
          <div style={cardValueStyle}>{formatCurrency(totalSales)}</div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle(COLORS.violet)}>Clientes</div>
          <div style={cardValueStyle}>{totalClients}</div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle(COLORS.pink)}>Deuda Total</div>
          <div style={cardValueStyle}>{formatCurrency(totalDebt)}</div>
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        <section style={panelStyle} aria-label="Ventas por día">
          <h4 style={panelTitleStyle}>Ventas por día</h4>
          <div style={{ width: "100%", height: 300 }}>
            {salesByDay && salesByDay.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: COLORS.neutralText }} />
                  <YAxis tick={{ fill: COLORS.neutralText }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="total" stroke={COLORS.aqua} strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 12, color: "#6b7280" }}>No hay ventas registradas para mostrar.</div>
            )}
          </div>
        </section>

        <section style={panelStyle} aria-label="Top productos">
          <h4 style={panelTitleStyle}>Top 5 productos más vendidos</h4>
          <div style={{ width: "100%", height: 300 }}>
            {topProducts && topProducts.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fill: COLORS.neutralText }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: COLORS.neutralText }} width={160} />
                  <Tooltip />
                  <Bar dataKey="qty" fill={COLORS.violet} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 12, color: "#6b7280" }}>No hay datos de productos vendidos.</div>
            )}
          </div>
        </section>

        <section style={panelStyle} aria-label="Deuda por cliente">
          <h4 style={panelTitleStyle}>Clientes con deuda</h4>
          <div style={{ width: "100%", height: 300 }}>
            {debtByClient && debtByClient.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={debtByClient} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {debtByClient.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={[COLORS.aqua, COLORS.violet, COLORS.pink, COLORS.yellow, COLORS.sky][i % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 12, color: "#6b7280" }}>No hay clientes con deuda.</div>
            )}
          </div>
        </section>

        {/* AreaChart: Ventas acumuladas (útil para ver tendencia) */}
        <section style={panelStyle} aria-label="Ventas acumuladas">
          <h4 style={panelTitleStyle}>Ventas acumuladas</h4>
          <div style={{ width: "100%", height: 260 }}>
            {salesByDay && salesByDay.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={salesByDay}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.sky} stopOpacity={0.7}/>
                      <stop offset="95%" stopColor={COLORS.aqua} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: COLORS.neutralText }} />
                  <YAxis tick={{ fill: COLORS.neutralText }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={(l) => `Fecha: ${l}`} />
                  <Legend verticalAlign="top" height={24} />
                  <Area type="monotone" dataKey="total" name="Ventas totales" stroke={COLORS.sky} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 12, color: "#6b7280" }}>No hay datos para ventas acumuladas.</div>
            )}
          </div>
        </section>

        {/* RadarChart: Distribución por categoría de producto */}
        <section style={panelStyle} aria-label="Distribución por categoría">
          <h4 style={panelTitleStyle}>Ventas por categoría (cantidad)</h4>
          <div style={{ width: "100%", height: 320 }}>
            {effectiveSales && effectiveSales.length > 0 ? (
              <ResponsiveContainer>
                <RadarChart data={(() => {
                  // Agrupar por categoría usando effectiveProducts
                  const map = {};
                  (effectiveSales || []).forEach(s => {
                    (s.items || []).forEach(it => {
                      const id = String(it.id || it.productId || it.product || 'unknown');
                      const prod = (effectiveProducts || []).find(p => String(p.id) === id) || {};
                      const cat = (prod.categoria || prod.category || prod.tipo || 'Otros') || 'Otros';
                      map[cat] = (map[cat] || 0) + safeNumber(it.qty || it.quantity || it.cantidad || 0);
                    });
                  });
                  return Object.keys(map).map(k => ({ category: k, qty: map[k] }));
                })()} cx="50%" cy="50%" outerRadius={120}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fill: COLORS.neutralText }} />
                  <PolarRadiusAxis />
                  <Radar name="Cantidad" dataKey="qty" stroke={COLORS.pink} fill={COLORS.pink} fillOpacity={0.6} />
                  <Legend verticalAlign="top" height={24} />
                  <Tooltip formatter={(v) => `${v} unidades`} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 12, color: "#6b7280" }}>No hay datos para categoría de productos.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// -----------------------------
// Estilos en línea (pequeños helpers)
// -----------------------------
const cardStyle = {
  background: COLORS.cardBg,
  borderRadius: 10,
  padding: 12,
  minWidth: 180,
  boxShadow: "0 6px 18px rgba(33,53,71,0.06)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const cardHeaderStyle = (bg) => ({
  background: bg,
  color: "#07233A",
  padding: "6px 10px",
  borderRadius: 8,
  fontWeight: 700,
  display: "inline-block",
});

const cardValueStyle = {
  marginTop: 10,
  fontSize: 20,
  fontWeight: 700,
  color: COLORS.neutralText,
};

const panelStyle = {
  background: COLORS.cardBg,
  borderRadius: 12,
  padding: 12,
  boxShadow: "0 6px 24px rgba(33,53,71,0.04)",
};

const panelTitleStyle = { margin: 0, marginBottom: 8, color: COLORS.neutralText };
