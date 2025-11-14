// hooks/useAppState.js
import { useLocalStorage } from './useLocalStorage';

export const useAppState = () => {
  const [inventario, setInventario] = useLocalStorage('inventario', []);
  const [ventas, setVentas] = useLocalStorage('ventas', []);
  const [historial, setHistorial] = useLocalStorage('historial', []);

  // Inicializar datos de ejemplo si está vacío
  React.useEffect(() => {
    if (inventario.length === 0) {
      const productosEjemplo = [
        {
          id: 1,
          nombre: 'Producto Ejemplo 1',
          precioCosto: 100,
          precioMayorista: 150,
          precioMinorista: 160,
          stock: 50,
          stockMinimo: 10
        },
        {
          id: 2,
          nombre: 'Producto Ejemplo 2',
          precioCosto: 200,
          precioMayorista: 300,
          precioMinorista: 320,
          stock: 20,
          stockMinimo: 5
        }
      ];
      setInventario(productosEjemplo);
    }
  }, [inventario.length, setInventario]);

  const agregarProducto = (producto) => {
    const nuevoProducto = {
      ...producto,
      id: Date.now(),
      precioMayorista: producto.precioCosto * 1.5,
      precioMinorista: producto.precioCosto * 1.6
    };
    setInventario(prev => [...prev, nuevoProducto]);
  };

  const actualizarProducto = (id, datosActualizados) => {
    setInventario(prev => 
      prev.map(producto => 
        producto.id === id 
          ? { 
              ...producto, 
              ...datosActualizados,
              precioMayorista: datosActualizados.precioCosto * 1.5,
              precioMinorista: datosActualizados.precioCosto * 1.6
            } 
          : producto
      )
    );
  };

  const eliminarProducto = (id) => {
    setInventario(prev => prev.filter(producto => producto.id !== id));
  };

  const registrarVenta = (venta) => {
    const nuevaVenta = {
      ...venta,
      id: Date.now(),
      fecha: new Date().toISOString()
    };

    // Actualizar stock
    const inventarioActualizado = inventario.map(producto => {
      const productoVendido = venta.productos.find(p => p.id === producto.id);
      if (productoVendido) {
        return {
          ...producto,
          stock: producto.stock - productoVendido.cantidad
        };
      }
      return producto;
    });

    setInventario(inventarioActualizado);
    setVentas(prev => [...prev, nuevaVenta]);
    setHistorial(prev => [...prev, nuevaVenta]);
  };

  const productosConAlerta = inventario.filter(
    producto => producto.stock <= producto.stockMinimo
  );

  return {
    inventario,
    ventas,
    historial,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    registrarVenta,
    productosConAlerta
  };
};