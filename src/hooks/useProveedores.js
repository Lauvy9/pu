import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

export const useProveedores = () => {
  const [proveedores, setProveedores] = useState([]);

  useEffect(() => {
    const fetchProveedores = async () => {
      const querySnapshot = await getDocs(collection(db, "proveedores"));
      setProveedores(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchProveedores();
  }, []);

  const agregarProveedor = async (nuevo) => {
    const docRef = await addDoc(collection(db, "proveedores"), nuevo);
    setProveedores([...proveedores, { id: docRef.id, ...nuevo }]);
  };

  const editarProveedor = async (id, data) => {
    const docRef = doc(db, "proveedores", id);
    await updateDoc(docRef, data);
    setProveedores(proveedores.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const eliminarProveedor = async (id) => {
    await deleteDoc(doc(db, "proveedores", id));
    setProveedores(proveedores.filter((p) => p.id !== id));
  };

  return { proveedores, agregarProveedor, editarProveedor, eliminarProveedor };
};
