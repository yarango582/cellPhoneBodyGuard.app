import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User,
  UserCredential,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, firestore } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Claves para almacenamiento local
const SUSPICIOUS_ACTIVITY_COUNT_KEY = "suspicious_activity_count";
const DEVICE_ID_KEY = "device_id";
const DEVICE_BLOCKED_KEY = "device_blocked";

// Importar funciones de servicios relacionados
import * as Device from "expo-device";

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

    // Obtener información del dispositivo
    const deviceInfo = {
      brand: Device.brand || "Desconocido",
      manufacturer: Device.manufacturer || "Desconocido",
      modelName: Device.modelName || "Desconocido",
      osName: Device.osName || "Android",
      osVersion: Device.osVersion || "Desconocido",
      deviceId: `device-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    };

    // Guardar el ID del dispositivo localmente
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceInfo.deviceId);

    // Configuración inicial de seguridad
    const securitySettings = {
      enabled: true,
      suspiciousAttemptsThreshold: 3,
      autoBlockEnabled: true,
      remoteWipeEnabled: false,
      locationTrackingEnabled: false,
      biometricUnlockEnabled: false,
      notificationsEnabled: true,
      photoOnFailedUnlockEnabled: false,
      lastChecked: new Date().toISOString(),
      syncFrequencyMinutes: 15,
      autoSyncOnConnection: true,
    };

    // Estado inicial de seguridad
    const securityStatus = {
      isBlocked: false,
      suspiciousActivityCount: 0,
      failedUnlockAttempts: 0,
      monitoringActive: true,
    };

    // Guardar información completa en Firestore según el esquema
    await setDoc(doc(firestore, "users", user.uid), {
      email,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      lastLogin: serverTimestamp(),
      securityKey,
      deviceCount: 1,
      deviceInfo,
      securitySettings,
      securityStatus,
      devices: { [deviceInfo.deviceId]: true },
    });

    // Registrar el dispositivo en la colección devices
    await setDoc(doc(firestore, "devices", deviceInfo.deviceId), {
      userId: user.uid,
      name: deviceInfo.brand + " " + deviceInfo.modelName,
      registeredAt: serverTimestamp(),
      lastOnline: serverTimestamp(),
      deviceInfo: {
        brand: deviceInfo.brand,
        manufacturer: deviceInfo.manufacturer,
        modelName: deviceInfo.modelName,
        osName: deviceInfo.osName,
        osVersion: deviceInfo.osVersion,
        uniqueId: deviceInfo.deviceId,
      },
      status: {
        isOnline: true,
        isBlocked: false,
      },
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
): Promise<{ user: User; isBlocked: boolean; blockReason?: string }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Obtener datos del usuario para verificar si está bloqueado
    const userDoc = await getDoc(doc(firestore, "users", user.uid));

    if (!userDoc.exists()) {
      throw new Error("Usuario no encontrado en la base de datos");
    }

    const userData = userDoc.data();
    const isBlocked = userData.deviceBlocked === true;
    const blockReason = userData.blockReason || "";

    // Guardar la clave de seguridad localmente (necesaria incluso si está bloqueado)
    await AsyncStorage.setItem(SECURITY_KEY, userData.securityKey || "");

    // Actualizar última actividad y login
    await updateDoc(doc(firestore, "users", user.uid), {
      lastActivity: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    // Guardar localmente el estado de bloqueo
    await AsyncStorage.setItem(
      DEVICE_BLOCKED_KEY,
      isBlocked ? "true" : "false"
    );

    // Si el dispositivo no está bloqueado, actualizamos su estado
    if (!isBlocked) {
      // Obtener o crear ID de dispositivo
      let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

      if (!deviceId) {
        // Si no hay ID de dispositivo, crear uno nuevo
        deviceId = `device-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      }

      // Verificar si el dispositivo existe en la colección devices
      const deviceDoc = await getDoc(doc(firestore, "devices", deviceId));

      if (deviceDoc.exists()) {
        // Actualizar dispositivo existente
        await updateDoc(doc(firestore, "devices", deviceId), {
          lastOnline: serverTimestamp(),
          "status.isOnline": true,
        });
      } else {
        // El dispositivo no existe, registrarlo
        const deviceInfo = {
          brand: Device.brand || "Desconocido",
          manufacturer: Device.manufacturer || "Desconocido",
          modelName: Device.modelName || "Desconocido",
          osName: Device.osName || "Android",
          osVersion: Device.osVersion || "Desconocido",
          uniqueId: deviceId,
        };

        // Crear nuevo documento de dispositivo
        await setDoc(doc(firestore, "devices", deviceId), {
          userId: user.uid,
          name: deviceInfo.brand + " " + deviceInfo.modelName,
          registeredAt: serverTimestamp(),
          lastOnline: serverTimestamp(),
          deviceInfo: deviceInfo,
          status: {
            isOnline: true,
            isBlocked: false,
          },
        });

        // Actualizar el usuario para vincular este dispositivo
        const devices = userData.devices || {};
        devices[deviceId] = true;

        await updateDoc(doc(firestore, "users", user.uid), {
          devices: devices,
          deviceCount: Object.keys(devices).length,
        });
      }
    }

    return { user, isBlocked, blockReason };
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
