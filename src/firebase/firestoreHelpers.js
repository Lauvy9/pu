import { collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// Helpers simples para usar Firestore desde el cliente
export function collRef(name) {
  return collection(db, name)
}

export async function getAll(collectionName) {
  const snap = await getDocs(collRef(collectionName))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getById(collectionName, id) {
  const d = await getDoc(doc(db, collectionName, id))
  if (!d.exists()) return null
  return { id: d.id, ...d.data() }
}

export async function createDoc(collectionName, data) {
  const payload = { ...data, createdAt: serverTimestamp() }
  const ref = await addDoc(collRef(collectionName), payload)
  return ref.id
}

export async function setDocWithId(collectionName, id, data) {
  const ref = doc(db, collectionName, id)
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
  return id
}

export async function updateDocById(collectionName, id, patch) {
  const ref = doc(db, collectionName, id)
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() })
  return id
}

export async function getDocSnapshot(collectionName, id) {
  const d = await getDoc(doc(db, collectionName, id))
  return d
}

export default { collRef, getAll, getById, createDoc, setDocWithId, updateDocById }
