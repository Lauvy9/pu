// src/context/FiadosContext.jsx
import { createContext, useState, useEffect } from "react";

export const FiadosContext = createContext();

export const FiadosProvider = ({ children }) => {
  const [clientes, setClientes] = useState(() => {
    const data = localStorage.getItem("clientesFiados");
    return data ? JSON.parse(data) : [];
  });

  useEffect(() => {
    localStorage.setItem("clientesFiados", JSON.stringify(clientes));
  }, [clientes]);

  return (
    <FiadosContext.Provider value={{ clientes, setClientes }}>
      {children}
    </FiadosContext.Provider>
  );
};
