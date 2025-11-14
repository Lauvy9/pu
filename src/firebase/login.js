import React from "react";
import { loginConGoogle } from "../firebase/login";

export default function Login({ onLogin }) {
  const handleLogin = async () => {
    try {
      const user = await loginConGoogle();
      onLogin(user);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={{ marginTop: "20vh" }}>
      <h2>Iniciar sesión</h2>
      <button
        onClick={handleLogin}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          borderRadius: "8px",
          backgroundColor: "#1976d2",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Iniciar sesión con Google
      </button>
    </div>
  );
}
