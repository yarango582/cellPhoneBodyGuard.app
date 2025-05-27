import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import {
  doc,
  updateDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUser } from "./authService";
import {
  sendSuspiciousActivityEmail,
  sendDeviceBlockedEmail,
} from "./emailService";
import * as Device from "expo-device";

// Nombre de la tarea en segundo plano
const BACKGROUND_SECURITY_TASK = "background-security-check";

// Claves para almacenamiento local
const SECURITY_SETTINGS_KEY = "security_settings";
const SUSPICIOUS_ACTIVITY_COUNT_KEY = "suspicious_activity_count";
const DEVICE_BLOCKED_KEY = "device_blocked";
const SECURITY_KEY = "security_key";

// Interfaz para la configuración de seguridad
export interface SecuritySettings {
  enabled: boolean;
  suspiciousAttemptsThreshold: number;
  autoBlockEnabled: boolean;
  remoteWipeEnabled: boolean;
  lastChecked: string;
}

// Interfaz para eventos de seguridad
export interface SecurityEvent {
  type: string;
  description: string;
  timestamp: number;
  details?: any;
}

// Valores predeterminados para la configuración de seguridad
const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  enabled: false,
  suspiciousAttemptsThreshold: 3,
  autoBlockEnabled: true,
  remoteWipeEnabled: false,
  lastChecked: new Date().toISOString(),
};

/**
 * Registra la tarea en segundo plano para monitoreo de seguridad
 * Utilizando la API moderna de expo-background-fetch
 */
export const registerBackgroundTask = async (): Promise<boolean> => {
  try {
    // Definir la tarea en segundo plano
    TaskManager.defineTask(BACKGROUND_SECURITY_TASK, async () => {
      try {
        // Verificar si el monitoreo está habilitado
        const settings = await getSecuritySettings();
        if (!settings.enabled) {
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        // Realizar verificación de seguridad
        const isSuspicious = await checkForSuspiciousActivity();

        if (isSuspicious) {
          // Incrementar contador de actividades sospechosas
          await incrementSuspiciousActivityCount();

          // Registrar evento de seguridad
          await logSecurityEvent({
            type: "suspicious_activity",
            description: "Actividad sospechosa detectada",
            timestamp: Date.now(),
          });

          // Verificar si se debe bloquear el dispositivo
          await checkBlockThreshold();
        }

        // Actualizar timestamp de última verificación
        await updateSecuritySettings({
          ...settings,
          lastChecked: new Date().toISOString(),
        });

        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error("Error en tarea de seguridad en segundo plano:", error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Verificar si la tarea ya está registrada
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_SECURITY_TASK
    );

    if (!isRegistered) {
      // Configurar la tarea de fondo con la nueva API
      await BackgroundFetch.setMinimumIntervalAsync(15 * 60); // 15 minutos

      // Registrar la tarea
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SECURITY_TASK, {
        minimumInterval: 15 * 60, // 15 minutos en segundos
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }

    return true;
  } catch (error) {
    console.error("Error al registrar tarea en segundo plano:", error);
    return false;
  }
};

/**
 * Obtiene la configuración de seguridad actual
 */
export const getSecuritySettings = async (): Promise<SecuritySettings> => {
  try {
    const settingsJson = await AsyncStorage.getItem(SECURITY_SETTINGS_KEY);
    if (settingsJson) {
      return JSON.parse(settingsJson);
    }
    return DEFAULT_SECURITY_SETTINGS;
  } catch (error) {
    console.error("Error al obtener configuración de seguridad:", error);
    return DEFAULT_SECURITY_SETTINGS;
  }
};

/**
 * Actualiza la configuración de seguridad
 */
export const updateSecuritySettings = async (
  settings: SecuritySettings
): Promise<void> => {
  try {
    await AsyncStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(settings));

    // Si se habilita la seguridad, registrar la tarea en segundo plano
    if (settings.enabled) {
      await registerBackgroundTask();
    } else {
      // Si se deshabilita, desregistrar la tarea
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SECURITY_TASK);
    }

    // Actualizar configuración en Firestore si el usuario está autenticado
    const user = getCurrentUser();
    if (user) {
      await updateDoc(doc(firestore, "users", user.uid), {
        securitySettings: settings,
      });
    }
  } catch (error) {
    console.error("Error al actualizar configuración de seguridad:", error);
    throw error;
  }
};

/**
 * Verifica si hay actividad sospechosa
 * Esta es una implementación básica que se puede ampliar con lógica más compleja
 */
export const checkForSuspiciousActivity = async (): Promise<boolean> => {
  // Aquí se implementaría la lógica para detectar actividad sospechosa
  // Por ejemplo:
  // - Múltiples intentos fallidos de desbloqueo
  // - Cambios en la configuración del sistema
  // - Intentos de desinstalar la aplicación
  // - Movimientos geográficos inusuales

  // Esta es una implementación simulada para fines de demostración
  // En una implementación real, se utilizarían APIs nativas para detectar comportamientos sospechosos

  // Simulación: 10% de probabilidad de detectar actividad sospechosa
  const isSuspicious = Math.random() < 0.1;

  return isSuspicious;
};

/**
 * Incrementa el contador de actividades sospechosas
 */
export const incrementSuspiciousActivityCount = async (): Promise<number> => {
  try {
    const countStr = await AsyncStorage.getItem(SUSPICIOUS_ACTIVITY_COUNT_KEY);
    let count = countStr ? parseInt(countStr, 10) : 0;
    count += 1;
    await AsyncStorage.setItem(SUSPICIOUS_ACTIVITY_COUNT_KEY, count.toString());
    return count;
  } catch (error) {
    console.error(
      "Error al incrementar contador de actividades sospechosas:",
      error
    );
    return 0;
  }
};

/**
 * Verifica si se debe bloquear el dispositivo según el umbral configurado
 */
export const checkBlockThreshold = async (): Promise<boolean> => {
  try {
    const settings = await getSecuritySettings();
    const countStr = await AsyncStorage.getItem(SUSPICIOUS_ACTIVITY_COUNT_KEY);
    const count = countStr ? parseInt(countStr, 10) : 0;

    // Si se alcanza el umbral y el bloqueo automático está habilitado
    if (
      count >= settings.suspiciousAttemptsThreshold &&
      settings.autoBlockEnabled
    ) {
      await blockDevice("suspicious_activity");
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error al verificar umbral de bloqueo:", error);
    return false;
  }
};

/**
 * Verifica si el dispositivo está bloqueado localmente
 */
export const isDeviceBlockedLocally = async (): Promise<boolean> => {
  try {
    const blocked = await AsyncStorage.getItem(DEVICE_BLOCKED_KEY);
    return blocked === "true";
  } catch (error) {
    console.error("Error al verificar estado de bloqueo:", error);
    return false;
  }
};

/**
 * Bloquea el dispositivo
 */
export const blockDevice = async (reason: string): Promise<void> => {
  try {
    // Marcar el dispositivo como bloqueado localmente
    await AsyncStorage.setItem(DEVICE_BLOCKED_KEY, "true");

    // Obtener información del dispositivo
    const deviceInfo = {
      brand: Device.brand,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      reason: reason,
      timestamp: Date.now(),
    };

    // Registrar evento de seguridad
    await logSecurityEvent({
      type: "device_blocked",
      description: `Dispositivo bloqueado por: ${reason}`,
      timestamp: Date.now(),
      details: deviceInfo,
    });

    // Actualizar estado en Firestore si el usuario está autenticado
    const user = getCurrentUser();
    if (user) {
      await updateDoc(doc(firestore, "users", user.uid), {
        deviceBlocked: true,
        blockedAt: new Date().toISOString(),
        blockReason: reason,
        deviceInfo: deviceInfo,
      });

      // Enviar correo de notificación
      await sendDeviceBlockedEmail(user.email!, deviceInfo);
    }
  } catch (error) {
    console.error("Error al bloquear dispositivo:", error);
    throw error;
  }
};

/**
 * Desbloquea el dispositivo
 */
export const unblockDevice = async (): Promise<void> => {
  try {
    // Marcar el dispositivo como desbloqueado localmente
    await AsyncStorage.removeItem(DEVICE_BLOCKED_KEY);

    // Reiniciar contador de actividades sospechosas
    await AsyncStorage.setItem(SUSPICIOUS_ACTIVITY_COUNT_KEY, "0");

    // Registrar evento de seguridad
    await logSecurityEvent({
      type: "device_unblocked",
      description: "Dispositivo desbloqueado",
      timestamp: Date.now(),
    });

    // Actualizar estado en Firestore si el usuario está autenticado
    const user = getCurrentUser();
    if (user) {
      await updateDoc(doc(firestore, "users", user.uid), {
        deviceBlocked: false,
        unblockedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error al desbloquear dispositivo:", error);
    throw error;
  }
};

/**
 * Desbloquea el dispositivo con una clave de seguridad
 */
export const unblockDeviceWithKey = async (key: string): Promise<boolean> => {
  try {
    // Obtener la clave de seguridad almacenada
    const storedKey = await AsyncStorage.getItem(SECURITY_KEY);

    // Verificar si la clave es correcta
    if (storedKey === key) {
      await unblockDevice();
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error al desbloquear con clave:", error);
    return false;
  }
};

/**
 * Registra un evento de seguridad en Firestore
 */
export const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (user) {
      await addDoc(collection(firestore, "users", user.uid, "securityEvents"), {
        ...event,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error al registrar evento de seguridad:", error);
  }
};
