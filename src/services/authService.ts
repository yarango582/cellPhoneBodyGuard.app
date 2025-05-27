import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, firestore } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Claves para almacenamiento local
const SUSPICIOUS_ACTIVITY_COUNT_KEY = "suspicious_activity_count";

// Definir función para generar clave de seguridad (20 dígitos)
const generateSecurityKey = (): string => {
  const chars = "0123456789";
  let result = "";
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Simulación de servicio de email
const sendSecurityKeyEmail = async (
  email: string,
  securityKey: string
): Promise<void> => {
  console.log(`Enviando clave de seguridad ${securityKey} al correo ${email}`);
  // En una implementación real, aquí se enviaría un correo electrónico
  // usando un servicio como SendGrid, Mailgun, etc.
  return Promise.resolve();
};

// Clave para almacenar el token de autenticación
const SECURITY_KEY = "security_key";

/**
 * Registra un nuevo usuario
 */
export const registerUser = async (
  email: string,
  password: string
): Promise<void> => {
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Generar clave de seguridad de 20 dígitos
    const securityKey = generateSecurityKey();

    // Guardar información adicional en Firestore
    await setDoc(doc(firestore, "users", user.uid), {
      email,
      createdAt: new Date().toISOString(),
      securityKey,
      deviceCount: 0,
      lastLogin: new Date().toISOString(),
    });

    // Guardar la clave de seguridad localmente para acceso rápido
    await AsyncStorage.setItem("security_key", securityKey);

    // Enviar clave de seguridad por correo electrónico
    await sendSecurityKeyEmail(email, securityKey);

    return;
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    throw error;
  }
};

/**
 * Inicia sesión con email y contraseña
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Actualizar última actividad
    await updateDoc(doc(firestore, "users", user.uid), {
      lastActivity: new Date().toISOString(),
    });

    // Obtener clave de seguridad y guardarla localmente
    const userDoc = await getDoc(doc(firestore, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      await AsyncStorage.setItem(SECURITY_KEY, userData.securityKey);
    }

    return user;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    throw error;
  }
};

/**
 * Cierra la sesión del usuario actual
 */
export const logoutUser = async (): Promise<void> => {
  try {
    // Cerrar sesión en Firebase
    await signOut(auth);

    // Limpiar otras claves que puedan contener información sensible
    // pero mantener la clave de seguridad para poder desbloquear el dispositivo si es necesario
    await AsyncStorage.multiRemove([
      SUSPICIOUS_ACTIVITY_COUNT_KEY,
      "notifications_enabled",
      "biometric_enabled",
    ]);

    console.log("Sesión cerrada correctamente");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    throw error;
  }
};

/**
 * Envía un correo para restablecer la contraseña
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error al enviar correo de restablecimiento:", error);
    throw error;
  }
};

/**
 * Obtiene el usuario actual
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Verifica si el dispositivo está bloqueado
 */
export const isDeviceBlocked = async (): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) return false;

    const userDoc = await getDoc(doc(firestore, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.deviceBlocked || false;
    }
    return false;
  } catch (error) {
    console.error("Error al verificar bloqueo:", error);
    return false;
  }
};

/**
 * Verifica la clave de seguridad para desbloquear el dispositivo
 */
export const verifySecurityKey = async (inputKey: string): Promise<boolean> => {
  try {
    const storedKey = await AsyncStorage.getItem(SECURITY_KEY);
    const user = getCurrentUser();

    if (!storedKey || !user) return false;

    // Verificar si la clave coincide con la almacenada localmente
    if (inputKey === storedKey) {
      // Desbloquear el dispositivo en Firestore
      await updateDoc(doc(firestore, "users", user.uid), {
        deviceBlocked: false,
        lastUnlocked: new Date().toISOString(),
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al verificar clave de seguridad:", error);
    return false;
  }
};
