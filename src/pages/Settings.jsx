import React from 'react'
import LogoUploader from '../components/LogoUploader'

export default function Settings(){
  return (
    <div style={{ padding: 20 }}>
      <h2>Configuración</h2>
      <p>Aquí puedes subir tu logo personalizado. Este logo aparecerá en el encabezado de la aplicación después de iniciar sesión.</p>
      <LogoUploader />
    </div>
  )
}
