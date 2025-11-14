import { useState, useEffect } from "react";
import { auth, provider, db } from "../firebase/firebase.js";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import logoYbarra from "../assets/logoMIO.png";
import "./Login.css";

export default function Login({ onLogin }) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Verifica en Firestore si el usuario está autorizado
        const ref = doc(db, "usuarios-autorizados", user.email);
        const docSnap = await getDoc(ref);
        if (docSnap.exists() && docSnap.data().autorizado) {
          onLogin(user);
        } else {
          setError(`Acceso no autorizado: ${user.email}`);
          await signOut(auth);
        }
      }
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      const ref = doc(db, "usuarios-autorizados", result.user.email);
      const docSnap = await getDoc(ref);
      if (docSnap.exists() && docSnap.data().autorizado) {
        onLogin(result.user);
      } else {
        setError(`Acceso no autorizado: ${result.user.email}`);
        await signOut(auth);
      }
    } catch (e) {
      console.error("Error al iniciar sesión:", e);
      setError(`Error al iniciar sesión: ${e.message}`);
      setCargando(false);
    }
  };

  if (cargando) return <p className="login-loading">Cargando...</p>;

  return (
    <div className="login-page">
      <div className="login-box">
        <img src={logoYbarra} alt="Ybarra" className="login-logo" />
        <h2 className="login-title">Acceso a la aplicación</h2>
        <button className="login-btn" onClick={handleLogin}>Iniciar sesión con Google</button>
        {error && <p className="login-error">{error}</p>}
      </div>

      <footer className="login-footer">
        <img src={logoYbarra} alt="Ybarra mini" className="login-footer-logo" />
        <span>Software a Medida y Ciencia de Datos-
          Ybarra, Laura Veronica</span>
      </footer>
    </div>
  );
}
