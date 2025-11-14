import React, { useState, useEffect } from 'react'
import { auth, db } from '../firebase/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import './LogoUploader.css'

export default function LogoUploader(){
  const [currentUser, setCurrentUser] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [logoURL, setLogoURL] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const storage = getStorage()

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u) => {
      setCurrentUser(u || null)
      setErrorMessage('')
      setSuccessMessage('')
      if (u) {
        try {
          const docRef = doc(db, 'users', u.uid)
          const d = await getDoc(docRef)
          if (d.exists()) setLogoURL(d.data().logoURL || null)
          else setLogoURL(null)
        } catch (e) {
          console.error('Error leyendo logo en Firestore', e)
          setErrorMessage(`Error leyendo logo: ${e.code || ''} ${e.message || ''}`)
          setLogoURL(null)
        }
      } else {
        setLogoURL(null)
      }
    })
    return () => unsub()
  }, [])

  useEffect(()=>{
    if(!file){ setPreview(null); return }
    const reader = new FileReader()
    reader.onloadend = ()=> setPreview(reader.result)
    reader.readAsDataURL(file)
  }, [file])

  const handleFile = (e)=>{
    const f = e.target.files[0]
    if(!f) return
    setFile(f)
  }

  const handleUpload = async ()=>{
    setErrorMessage('')
    setSuccessMessage('')
    if(!currentUser) { setErrorMessage('Debes iniciar sesión'); return }
    if(!file) { setErrorMessage('Selecciona un archivo'); return }
    setUploading(true)
    setUploadProgress(0)
    try{
  const path = `logos/${currentUser.uid}/logo.png`
      const r = storageRef(storage, path)
      const metadata = { contentType: file.type || 'image/png' }
      const uploadTask = uploadBytesResumable(r, file, metadata)

      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          setUploadProgress(pct)
        }, (err) => {
          reject(err)
        }, async () => {
          try{
            const url = await getDownloadURL(uploadTask.snapshot.ref)
            const userRef = doc(db, 'users', currentUser.uid)
            await setDoc(userRef, { logoURL: url }, { merge: true })
            setLogoURL(url)
            setFile(null)
            setPreview(null)
            setSuccessMessage('Logo subido correctamente')
            resolve()
          }catch(e){ reject(e) }
        })
      })
    }catch(e){
      console.error('Error subiendo logo', e)
      const msg = `${e.code || ''} ${e.message || 'Error subiendo logo'}`
      setErrorMessage(msg)
      if (e.code && e.code.toLowerCase().includes('permission')) {
        setErrorMessage(prev => prev + ' — Parece un problema de permisos (Firestore/Storage rules).')
      }
    }finally{
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async ()=>{
    setErrorMessage('')
    setSuccessMessage('')
    if(!currentUser) { setErrorMessage('Debes iniciar sesión'); return }
    if(!logoURL) { setErrorMessage('No hay logo para eliminar'); return }
    if(!confirm('Eliminar logo de tu cuenta?')) return
    try{
  const path = `logos/${currentUser.uid}/logo.png`
  const r = storageRef(storage, path)
      await deleteObject(r)
    }catch(e){
      console.warn('deleteObject:', e)
    }
    try{
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, { logoURL: '' })
    }catch(e){
      console.error('Error actualizando Firestore', e)
      setErrorMessage(`Error actualizando Firestore: ${e.message || e.code || ''}`)
      return
    }
    setLogoURL(null)
    setSuccessMessage('Logo eliminado')
  }

  return (
    <div className="uploader">
      <h4>Logo de usuario</h4>
      {errorMessage && (
        <div className="uploader-error" style={{ color: '#8b0000', marginBottom: 8 }}>{errorMessage}</div>
      )}
      {successMessage && (
        <div className="uploader-success" style={{ color: '#006400', marginBottom: 8 }}>{successMessage}</div>
      )}
      {uploading && (
        <div style={{ marginBottom: 8 }}>Subiendo: {uploadProgress}%</div>
      )}
      {logoURL ? (
        <div className="uploader-current">
          <img src={logoURL} alt="logo usuario" className="uploader-current-img" />
          <div className="uploader-actions">
            <button className="btn" onClick={()=>{ setFile(null); setPreview(null); document.getElementById('logo-file').click() }}>Cambiar</button>
            <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>
          </div>
        </div>
      ) : (
        <div className="uploader-empty">No tienes logo aún</div>
      )}

      <div className="uploader-form">
        <input id="logo-file" type="file" accept="image/*" onChange={handleFile} />
        {preview && (
          <div className="uploader-preview">
            <img src={preview} alt="preview" />
          </div>
        )}
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          <button className="btn" onClick={handleUpload} disabled={uploading}>{uploading ? `Subiendo... (${uploadProgress}%)` : 'Subir logo'}</button>
        </div>
      </div>
    </div>
  )
}
