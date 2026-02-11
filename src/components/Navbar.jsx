import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import defaultLogo from '../assets/logoMIO.png';
import { doc, getDoc } from 'firebase/firestore';
import "./Navbar.css";

export default function Navbar({ onNavigate }) {
  const [user, setUser] = useState(null);
  const [logoURL, setLogoURL] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);
      if (u) {
        try {
          const d = await getDoc(doc(db, 'users', u.uid));
          if (d.exists() && d.data().logoURL) {
            setLogoURL(d.data().logoURL);
          } else {
            setLogoURL(null);
          }
        } catch (e) {
          console.error('Error fetching user logo', e);
        }
      } else {
        setLogoURL(null);
      }
    });

    return () => unsub();
  }, []);

  const defaultLogoLocal = defaultLogo;

  return (
    <nav
      className="nav navbar-boxes"
      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
    >
      <NavLink
        to="/inventory"
        className="nav-box inventory"
        onClick={() => onNavigate && onNavigate('inventory')}
      >
        Inventario
      </NavLink>

      <NavLink
        to="/sales"
        className="nav-box sales"
        onClick={() => onNavigate && onNavigate('ventas')}
      >
        Ventas
      </NavLink>

      <NavLink
        to="/ofertas"
        className="nav-box ofertas"
        onClick={() => onNavigate && onNavigate('ofertas')}
      >
        Ofertas
      </NavLink>

      <NavLink
        to="/presupuestos"
        className="nav-box crear-presupuesto"
        onClick={() => onNavigate && onNavigate('presupuestos')}
      >
        Crear Presupuesto
      </NavLink>

      <NavLink
        to="/fiados"
        className="nav-box fiados"
        onClick={() => onNavigate && onNavigate('fiados')}
      >
        Clientes
      </NavLink>

      <NavLink
        to="/reportes"
        className="nav-box reports"
        onClick={() => onNavigate && onNavigate('reportes')}
      >
        Reportes
      </NavLink>

      {/* 
        Historial NO se muestra en el navbar.
        La ruta /history sigue funcionando normalmente.
      */}
    </nav>
  );
}
