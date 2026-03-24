// Firebase core
import { initializeApp } from "firebase/app"

// Analytics
import { getAnalytics } from "firebase/analytics"

// Firestore
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"

// Authentication
import { getAuth, GoogleAuthProvider } from "firebase/auth"

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDAv-L954iQ3MaH726_U0n9xiLxStpZW1M",
  authDomain: "vidrieria-83ed6.firebaseapp.com",
  databaseURL: "https://vidrieria-83ed6-default-rtdb.firebaseio.com",
  projectId: "vidrieria-83ed6",
  storageBucket: "vidrieria-83ed6.firebasestorage.app",
  messagingSenderId: "951564411009",
  appId: "1:951564411009:web:a65bf4e7572b1297fc6d80",
  measurementId: "G-EHQDDVC9S7"
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null

export const db = getFirestore(app)
export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()

// Enable persistence (una sola vez y bien)
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("⚠️ Varias pestañas abiertas")
    } else if (err.code === "unimplemented") {
      console.warn("⚠️ Navegador no soporta persistence")
    } else {
      console.warn("⚠️ Error:", err)
    }
  })
}