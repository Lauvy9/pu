import React, { useState } from 'react'
import LogoUploader from '../components/LogoUploader'
import { useStore } from '../context/StoreContext'

export default function Settings(){
  const { company, actions } = useStore()
  const [form, setForm] = useState({
    name: company?.name || '',
    address: company?.address || '',
    phone: company?.phone || '',
    email: company?.email || '',
    logo: company?.logo || ''
  })

  const save = () => {
    actions.updateCompany(form)
    alert('Datos de la empresa guardados')
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Configuración</h2>
      <p>Aquí puedes editar los datos de la empresa que aparecerán en los PDFs (logo, dirección, teléfono, email).</p>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <label>Nombre de la empresatqtqtqtqtt34t344t3443tqqtqt qt3t3ttq</label>
          <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <label>Dirección</label>
          <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <label>Teléfono</label>
          <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <label>Email</label>
          <input className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <label>Logo (URL o dataURL)</label>
          <input className="input" value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} placeholder="https://... or data:image/..." />
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={save}>Guardar datos empresa</button>
          </div>
        </div>
        <div style={{ width: 320 }}>
          <h4>Logo</h4>
          <p className="small">Puedes usar el uploader para subir un logo en Firestore/Storage o pegar una URL en el campo 'logo' arriba si lo prefieres.</p>
          <LogoUploader />
        </div>
      </div>
    </div>
  )
}
