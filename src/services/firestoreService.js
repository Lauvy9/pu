import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/firebase'

async function saveGeneric(collectionName, data) {
  if (import.meta.env.VITE_USE_FIRESTORE !== 'true') return { ok: false, error: 'firestore_disabled' }
  try {
    if (data && (data.id || data._id)) {
      const id = String(data.id || data._id)
      await setDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp(), ...(data.createdAt ? {} : { createdAt: serverTimestamp() }) }, { merge: true })
      return { ok: true, id }
    }
    const ref = await addDoc(collection(db, collectionName), { ...data, createdAt: serverTimestamp() })
    return { ok: true, id: ref.id }
  } catch (err) {
    console.error('firestore save error', collectionName, err)
    return { ok: false, error: err.message || String(err) }
  }
}

export async function saveProduct(product) { return saveGeneric('productos', product) }
export async function saveSale(sale) { return saveGeneric('ventas', sale) }
export async function saveOffer(offer) { return saveGeneric('ofertas', offer) }
export async function saveClient(client) { return saveGeneric('clientes', client) }
export async function saveBudget(budget) { return saveGeneric('presupuestos', budget) }
export async function saveFiado(fiado) { return saveGeneric('fiados', fiado) }
export async function saveProvider(provider) { return saveGeneric('proveedores', provider) }

export default {
  saveProduct,
  saveSale,
  saveOffer,
  saveClient,
  saveBudget,
  saveFiado,
  saveProvider
}
