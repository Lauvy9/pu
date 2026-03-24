import { useState, useEffect } from "react";
import Router from "./router";
import { StoreProvider } from "./context/StoreContext";
import { FiadosProvider } from "./context/FiadosContext";
import LauraAssistant from "./components/LauraAssistant";
import Login from "./components/Login";
import Footer from "./components/Footer";
import defaultLogo from "./assets/logoMIO.png";
import { auth, db } from "./firebase/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true); // 🔥 clave
  const [userLogo, setUserLogo] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('App onAuthStateChanged user=', user);
      setUsuario(user);
      setLoading(false); // 🔥 termina carga
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!usuario) {
      setUserLogo(null);
      return;
    }

    const ref = doc(db, "users", usuario.uid);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setUserLogo(snap.data().logoURL || null);
      } else {
        setUserLogo(null);
      }
    });

    return () => unsub();
  }, [usuario]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  // 🔥 ESTE ES EL FIX
  if (loading) {
    return <h2>Cargando...</h2>;
  }

  return (
    <StoreProvider>
      <FiadosProvider>
        <div style={{ textAlign: "center", minHeight: "100vh" }}>
          {!usuario ? (
            <Login />
          ) : (
            <div>
              <img
                src={userLogo || defaultLogo}
                alt="Logo"
                style={{ height: 80 }}
              />

              <h1>
                Bienvenido, {usuario?.displayName || "Usuario"}
              </h1>

              <button
  onClick={handleLogout}
  style={{
    backgroundColor: "#d32f2f",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    cursor: "pointer"
  }}
>
  Cerrar sesión
</button>

              <Router />
              <Footer />
            </div>
          )}

          {usuario && <LauraAssistant usuario={usuario} />}
        </div>
      </FiadosProvider>
    </StoreProvider>
  );
}