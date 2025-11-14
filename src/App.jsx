import { useState, useEffect } from "react";
import Router from "./router";
import { StoreProvider } from "./context/StoreContext";
import { FiadosProvider } from "./context/FiadosContext";
import Login from "./components/Login";
import Footer from "./components/Footer";
import defaultLogo from "./assets/logoMIO.png";
import { auth, db } from "./firebase/firebase"; // 👈 importamos auth y db
import { signOut, onAuthStateChanged } from "firebase/auth"; // 👈 escuchamos sesión
import { doc, onSnapshot } from 'firebase/firestore'

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [userLogo, setUserLogo] = useState(null)

  // Escuchar cambios de sesión (para recordar usuario logueado)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });
    return () => unsubscribe();
  }, []);

  // Suscribirse al documento del usuario para obtener logo en tiempo real
  useEffect(()=>{
    if(!usuario) { setUserLogo(null); return }
    const ref = doc(db, 'users', usuario.uid)
    const unsub = onSnapshot(ref, snap => {
      if(snap.exists()) setUserLogo(snap.data().logoURL || null)
      else setUserLogo(null)
    }, err => { console.error('user doc snapshot error', err); setUserLogo(null) })
    return ()=> unsub()
  }, [usuario])

  const handleLogout = async () => {
    await signOut(auth);
    setUsuario(null);
  };

  return (
    <StoreProvider>
      <FiadosProvider>
        <div
          className="app"
          style={{
            textAlign: "center",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            {!usuario ? (
              <Login onLogin={setUsuario} />
            ) : (
              <div>
                <img
                  src={userLogo || defaultLogo}
                  alt="Logo de usuario"
                  style={{ height: 80, marginBottom: 8 }}
                />
                <h1>Bienvenido, {usuario.displayName}</h1>

                {/* 🔘 Botón para salir */}
                <button
                  onClick={handleLogout}
                  style={{
                    backgroundColor: "#d32f2f",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    marginBottom: "10px",
                  }}
                >
                  Cerrar sesión
                </button>

                <Router />
              </div>
            )}
          </div>

          <Footer />
        </div>
      </FiadosProvider>
    </StoreProvider>
  );
}
