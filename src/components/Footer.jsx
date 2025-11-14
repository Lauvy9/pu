// src/components/Footer.jsx
import React from "react";
import defaultLogo from "../assets/logoMIO.png";

export default function Footer() {
  // Mantener el footer con el logo Ybarra por defecto (no mostrar logo de usuario aquí)
  return (
    <footer
      style={{
        marginTop: "2rem",
        padding: "1rem",
        textAlign: "center",
        fontSize: "0.9rem",
        color: "#060606ff",
        borderTop: "1px solid #eeeeeeff",
        backgroundColor: "#e7f0ecff",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
      }}
    >
      <img src={defaultLogo} alt="Ybarra" style={{ height: 48, objectFit: 'contain', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
      <div style={{ marginLeft: 8 }}>
        <strong>Ybarra, Laura Veronica</strong> — App © {new Date().getFullYear()}
      </div>
    </footer>
  );
}
