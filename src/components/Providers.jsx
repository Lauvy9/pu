import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [newProvider, setNewProvider] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
  });

  const [editingId, setEditingId] = useState(null);

  // Obtener lista de proveedores
  const fetchProviders = async () => {
    const querySnapshot = await getDocs(collection(db, "proveedores"));
    setProviders(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    if (editingId) {
      const ref = doc(db, "proveedores", editingId);
      await updateDoc(ref, newProvider);
      setEditingId(null);
    } else {
      await addDoc(collection(db, "proveedores"), newProvider);
    }
    setNewProvider({ nombre: "", telefono: "", email: "", direccion: "" });
    fetchProviders();
  };

  const handleEdit = (prov) => {
    setNewProvider(prov);
    setEditingId(prov.id);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "proveedores", id));
    fetchProviders();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Proveedores</h2>

      <form onSubmit={handleAddOrEdit} className="mb-4 flex flex-col gap-2">
        <input
          type="text"
          placeholder="Nombre"
          value={newProvider.nombre}
          onChange={(e) => setNewProvider({ ...newProvider, nombre: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Teléfono"
          value={newProvider.telefono}
          onChange={(e) => setNewProvider({ ...newProvider, telefono: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={newProvider.email}
          onChange={(e) => setNewProvider({ ...newProvider, email: e.target.value })}
        />
        <input
          type="text"
          placeholder="Dirección"
          value={newProvider.direccion}
          onChange={(e) => setNewProvider({ ...newProvider, direccion: e.target.value })}
        />
        <button className="bg-blue-600 text-white p-2 rounded">
          {editingId ? "Actualizar" : "Agregar"} proveedor
        </button>
      </form>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Dirección</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((prov) => (
            <tr key={prov.id} className="border-t">
              <td>{prov.nombre}</td>
              <td>{prov.telefono}</td>
              <td>{prov.email}</td>
              <td>{prov.direccion}</td>
              <td>
                <button onClick={() => handleEdit(prov)} className="text-blue-500 mr-2">Editar</button>
                <button onClick={() => handleDelete(prov.id)} className="text-red-500">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
