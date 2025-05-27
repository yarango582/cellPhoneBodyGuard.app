// src/config/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import Constants from 'expo-constants';

// Cargar variables de entorno
const ENV = {
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || Constants.expoConfig?.extra?.FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || Constants.expoConfig?.extra?.FIREBASE_APP_ID,
};

// Configuración de Firebase
const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
};

// Inicializar Firebase - evitar duplicados
const app = initializeApp(firebaseConfig);

// Inicializar servicios de Firebase
// En Firebase v11+, la persistencia se maneja automáticamente en React Native
const auth = getAuth(app);
const firestore = getFirestore(app);
const functions = getFunctions(app);

export { firebaseConfig, auth, firestore, functions };
export default app;
