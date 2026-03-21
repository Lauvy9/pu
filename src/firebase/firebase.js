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
export const analytics = getAnalytics(app)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()

// Enable IndexedDB persistence for offline support (guarded)
try {
  enableIndexedDbPersistence(db).then(() => {
    console.info('🔥 Firestore persistence enabled')
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: multiple tabs open (failed-precondition)')
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence is not available in this browser (unimplemented)')
    } else {
      console.warn('Failed to enable Firestore persistence', err)
    }
  })
} catch (e) {
  console.warn('Error enabling Firestore persistence', e)
}