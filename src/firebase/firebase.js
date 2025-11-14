// Importar lo necesario de Firebase
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Construir la configuración a partir de variables de entorno Vite cuando estén disponibles.
// Esto permite cambiar de proyecto sin editar el archivo.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDAv-L954iQ3MaH726_U0n9xiLxStpZW1M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vidrieria-83ed6.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://vidrieria-83ed6-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vidrieria-83ed6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vidrieria-83ed6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "951564411009",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:951564411009:web:a65bf4e7572b1297fc6d80",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-EHQDDVC9S7"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth y Google Provider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Inicializar Firestore
const db = getFirestore(app);

export { auth, provider, db };
