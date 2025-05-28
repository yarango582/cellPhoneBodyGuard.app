// src/config/firebase.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
} from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage } from "firebase/storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";

// Cargar variables de entorno
const ENV = {
  FIREBASE_API_KEY:
    process.env.FIREBASE_API_KEY ||
    Constants.expoConfig?.extra?.FIREBASE_API_KEY ||
    "AIzaSyDLRyLNzfQSE5IZooS0pjBLAoPEKN9kAYA",
  FIREBASE_AUTH_DOMAIN:
    process.env.FIREBASE_AUTH_DOMAIN ||
    Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN ||
    "wipe-4a800.firebaseapp.com",
  FIREBASE_PROJECT_ID:
    process.env.FIREBASE_PROJECT_ID ||
    Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID ||
    "wipe-4a800",
  FIREBASE_STORAGE_BUCKET:
    process.env.FIREBASE_STORAGE_BUCKET ||
    Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET ||
    "wipe-4a800.firebasestorage.app",
  FIREBASE_MESSAGING_SENDER_ID:
    process.env.FIREBASE_MESSAGING_SENDER_ID ||
    Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID ||
    "948117407800",
  FIREBASE_APP_ID:
    process.env.FIREBASE_APP_ID ||
    Constants.expoConfig?.extra?.FIREBASE_APP_ID ||
    "1:948117407800:android:e6b3d8d500fcf7450f3ecd",
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

// Definir el tipo para la variable global extendida
declare global {
  var firebaseApp: any;
}

// Inicializar Firebase - evitar duplicados
let app;
let firestore: any;

if (!global.firebaseApp) {
  app = initializeApp(firebaseConfig);
  global.firebaseApp = app;
} else {
  app = global.firebaseApp;
}

// Inicializar servicios de Firebase con persistencia mejorada
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Configurar Firestore con persistencia para modo offline
firestore = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

// Habilitar persistencia para firestore (solo en entorno compatible)
if (Platform.OS !== "web") {
  enableIndexedDbPersistence(firestore).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn(
        "La persistencia de Firestore solo puede habilitarse en una pestaña a la vez"
      );
    } else if (err.code === "unimplemented") {
      console.warn(
        "El navegador actual no soporta todas las características necesarias para la persistencia"
      );
    }
  });
}

// Añadir listener de conectividad para optimizar sincronización
NetInfo.addEventListener((state) => {
  console.log("Conexión a Internet:", state.isConnected);
  // Puedes usar este evento para manejar la sincronización cuando la red vuelve
});

// Exportar instancias de Firebase
export { firebaseConfig, auth, firestore, functions, storage };
export default app;
