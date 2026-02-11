import React, { useState, useEffect } from "react";

export default function Cotizador() {
  const [inventario, setInventario] = useState([
    { id: 1, nombre: "Vidrio 4mm" },
    { id: 2, nombre: "Aluminio Marco" },
    { id: 3, nombre: "Espejo" }
  ]);

  const [producto, setProducto] = useState("");
  const [coincidencias, setCoincidencias] = useState([]);
  const [largo, setLargo] = useState("");
  const [alto, setAlto] = useState("");
  const [precioMetro, setPrecioMetro] = useState("");
  const [ganancia, setGanancia] = useState("");
  const [total, setTotal] = useState(0);

  // Datos del presupuesto
  const [cliente, setCliente] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: ""
  });

  useEffect(() => {
    if (!producto.trim()) {
      setCoincidencias([]);
      return;
    }
    const filtrado = inventario.filter((item) =>
      item.nombre.toLowerCase().includes(producto.toLowerCase())
    );
    setCoincidencias(filtrado);
  }, [producto, inventario]);

  const agregarProductoNuevo = () => {
    const nuevo = {
      id: inventario.length + 1,
      nombre: producto
    };
    setInventario([...inventario, nuevo]);
    setCoincidencias([nuevo]);
  };

  const calcular = () => {
    const area = (parseFloat(largo) || 0) * (parseFloat(alto) || 0);
    const base = (parseFloat(precioMetro) || 0) * area;
    const porc = parseFloat(ganancia) || 0;
    const final = base + base * (porc / 100);
    setTotal(final);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto rounded-2xl shadow-lg bg-white space-y-6">
      <h1 className="text-3xl font-bold">Nuevo Presupuesto</h1>

      {/* DATOS DEL CLIENTE */}
      <div className="space-y-3">
        <label className="font-semibold">Nombre completo</label>
        <input className="w-full border rounded p-2" value={cliente.nombre} onChange={(e)=>setCliente({...cliente, nombre:e.target.value})} />

        <label className="font-semibold">Teléfono</label>
        <input className="w-full border rounded p-2" value={cliente.telefono} onChange={(e)=>setCliente({...cliente, telefono:e.target.value})} />

        <label className="font-semibold">Email</label>
        <input className="w-full border rounded p-2" value={cliente.email} onChange={(e)=>setCliente({...cliente, email:e.target.value})} />

        <label className="font-semibold">Dirección</label>
        <input className="w-full border rounded p-2" value={cliente.direccion} onChange={(e)=>setCliente({...cliente, direccion:e.target.value})} />
      </div>

      <h2 className="text-2xl font-bold">Calculadora de Cotización</h2>

      {/* PRODUCTO */}
      <div className="space-y-1">
        <label className="font-medium">Producto / Material</label>
        <input
          type="text"
          className="w-full border rounded p-2"
          placeholder="Ej: Vidrio, Espejo…"
          value={producto}
          onChange={(e) => setProducto(e.target.value)}
        />

        {coincidencias.length > 0 && producto.trim() !== "" && (
          <div className="border rounded bg-gray-100 p-2">
            {coincidencias.map((c) => (
              <div key={c.id} className="cursor-pointer hover:bg-gray-200 p-1 rounded" onClick={() => setProducto(c.nombre)}>
                {c.nombre}
              </div>
            ))}
          </div>
        )}

        {producto.trim() !== "" && coincidencias.length === 0 && (
          <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded" onClick={agregarProductoNuevo}>
            Agregar producto al inventario
          </button>
        )}
      </div>

      {/* MEDIDAS */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-medium">Largo (m)</label>
          <input type="number" className="w-full border rounded p-2" value={largo} onChange={(e) => setLargo(e.target.value)} />
        </div>
        <div>
          <label className="font-medium">Alto (m)</label>
          <input type="number" className="w-full border rounded p-2" value={alto} onChange={(e) => setAlto(e.target.value)} />
        </div>
      </div>

      {/* PRECIO Y GANANCIA */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-medium">Precio por m²</label>
          <input type="number" className="w-full border rounded p-2" value={precioMetro} onChange={(e) => setPrecioMetro(e.target.value)} />
        </div>
        <div>
          <label className="font-medium">% Ganancia</label>
          <input type="number" className="w-full border rounded p-2" value={ganancia} onChange={(e) => setGanancia(e.target.value)} />
        </div>
      </div>

      <button onClick={calcular} className="w-full mt-4 bg-green-600 text-white rounded p-2 font-semibold">
        Calcular
      </button>

      <div className="text-xl font-bold mt-2">Total: ${total.toFixed(2)}</div>
    </div>
  );
}