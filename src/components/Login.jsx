import { useState } from "react";
import { auth, provider } from "../firebase/firebase.js";
import { signInWithPopup } from "firebase/auth";
import logoYbarra from "../assets/logoMIO.png";
import "./Login.css";

export default function Login({ onLogin }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setCargando(true);

    try {
      const result = await signInWithPopup(auth, provider);

      console.log("LOGIN OK:", result.user);

      // 🔥 SOLO esto
      onLogin(result.user);

    } catch (e) {
      console.error("Error login:", e);
      setError(e.message);
    } finally {
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
