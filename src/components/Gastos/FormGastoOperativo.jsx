import React, { useState } from 'react'
import { useStore } from '../../context/StoreContext'
import { formatCurrency } from '../../utils/helpers'

export default function FormGastoOperativo() {
  const { actions } = useStore()
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    concepto: '',
    pagadoA: '',
    businessUnit: 'compartido',
    categoria: 'otros',
    monto: '',
    observacion: '',
  })

  const [submitted, setSubmitted] = useState(false)

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const monto = Number(formData.monto || 0)

    if (!formData.concepto.trim()) {
      alert('Por favor ingresa un concepto')
      return
    }

    if (monto <= 0) {
      alert('El monto debe ser mayor a 0')
      return
    }

    if (!formData.pagadoA.trim()) {
      alert('Por favor ingresa a quién se pagó')
      return
    }

    // Crear transacción de gasto
    const transaction = {
      id: 'tx_gasto_' + Date.now().toString(),
      tipo: 'gasto',
      fecha: formData.fecha + 'T00:00:00.000Z',
      monto: monto,
      categoria: formData.categoria || 'otros',
      businessUnit: formData.businessUnit,
      concepto: formData.concepto.trim(),
      pagadoA: formData.pagadoA.trim(),
      observacion: formData.observacion.trim() || null,
    }

    if (actions && typeof actions.addTransaction === 'function') {
      try {
        actions.addTransaction(transaction)
        setSubmitted(true)
        // Limpiar formulario
        setTimeout(() => {
          setFormData({
            fecha: new Date().toISOString().slice(0, 10),
            concepto: '',
            pagadoA: '',
            businessUnit: 'compartido',
            categoria: 'otros',
            monto: '',
            observacion: '',
          })
          setSubmitted(false)
        }, 1500)
      } catch (err) {
        alert('Error al guardar el gasto: ' + err.message)
      }
    } else {
      alert('No se pudo acceder a las acciones del store')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ marginTop: 0 }}>Registrar Gasto Operativo</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Fecha
          </label>
          <input
            type="date"
            value={formData.fecha}
            onChange={(e) => handleChange('fecha', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid #ccc',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Categoría
          </label>
          <select
            value={formData.categoria}
            onChange={(e) => handleChange('categoria', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid #ccc',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            <option value="otros">Otros</option>
            <option value="personal">Personal (sueldos)</option>
            <option value="servicios">Servicios (luz, agua, etc.)</option>
            <option value="materiales">Materiales</option>
            <option value="transporte">Transporte</option>
            <option value="impuestos">Impuestos</option>
            <option value="mantenimiento">Mantenimiento</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Concepto
          </label>
          <input
            type="text"
            placeholder="Ej: Pago de personal, Luz, Alquiler..."
            value={formData.concepto}
            onChange={(e) => handleChange('concepto', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid #ccc',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Pagado a
          </label>
          <input
            type="text"
            placeholder="Ej: Juan Pérez, EDESUR, Propietario..."
            value={formData.pagadoA}
            onChange={(e) => handleChange('pagadoA', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid #ccc',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Negocio
          </label>
          <select
            value={formData.businessUnit}
            onChange={(e) => handleChange('businessUnit', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid #ccc',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            <option value="compartido">Compartido</option>
            <option value="vidrieria">Vidriería</option>
            <option value="muebleria">Mueblería</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Monto (en pesos)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.monto}
            onChange={(e) => handleChange('monto', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid #ccc',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Observación (opcional)
          </label>
          <input
            type="text"
            placeholder="Notas adicionales..."
            value={formData.observacion}
            onChange={(e) => handleChange('observacion', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid #ccc',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="submit"
          disabled={submitted}
          style={{
            padding: '10px 20px',
            backgroundColor: submitted ? '#4caf50' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: submitted ? 'default' : 'pointer',
            fontWeight: 600,
            transition: 'background-color 0.3s',
          }}
        >
          {submitted ? '✓ Gasto guardado' : 'Guardar Gasto'}
        </button>
        <button
          type="button"
          onClick={() =>
            setFormData({
              fecha: new Date().toISOString().slice(0, 10),
              concepto: '',
              pagadoA: '',
              businessUnit: 'compartido',
              categoria: 'otros',
              monto: '',
              observacion: '',
            })
          }
          style={{
            padding: '10px 20px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            border: '1px solid #ccc',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Limpiar
        </button>
      </div>

      {formData.monto && (
        <div
          style={{
            padding: 12,
            backgroundColor: '#f5f5f5',
            borderRadius: 4,
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 600,
            color: '#333',
          }}
        >
          Monto a descontar: <span style={{ color: '#d32f2f' }}>{formatCurrency(Number(formData.monto))}</span>
        </div>
      )}
    </form>
  )
}
