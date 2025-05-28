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
const MONITORING_ACTIVE_KEY = "monitoring_active";
const LAST_MONITORING_CHECK_KEY = "last_monitoring_check";

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

    // Actualizar la hora de la última verificación
    await AsyncStorage.setItem(
      LAST_MONITORING_CHECK_KEY,
      new Date().toISOString()
    );

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
 * Obtiene el contador actual de actividades sospechosas
 */
export const getSuspiciousActivityCount = async (): Promise<number> => {
  try {
    const countStr = await AsyncStorage.getItem(SUSPICIOUS_ACTIVITY_COUNT_KEY);
    return countStr ? parseInt(countStr, 10) : 0;
  } catch (error) {
    console.error(
      "Error al obtener contador de actividades sospechosas:",
      error
    );
    return 0;
  }
};

/**
 * Reinicia el contador de actividades sospechosas
 */
export const resetSuspiciousActivityCount = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(SUSPICIOUS_ACTIVITY_COUNT_KEY, "0");

    // Registrar evento de seguridad
    await logSecurityEvent({
      type: "counter_reset",
      description: "Contador de actividades sospechosas reiniciado manualmente",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error(
      "Error al reiniciar contador de actividades sospechosas:",
      error
    );
    throw error;
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
 * Activa o desactiva el monitoreo de seguridad
 */
export const setMonitoringActive = async (active: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      MONITORING_ACTIVE_KEY,
      active ? "true" : "false"
    );

    // Registrar la última verificación
    await AsyncStorage.setItem(
      LAST_MONITORING_CHECK_KEY,
      new Date().toISOString()
    );

    // Registrar el evento en Firestore
    const user = getCurrentUser();
    if (user) {
      const securityEvent = {
        type: active ? "monitoring_activated" : "monitoring_deactivated",
        description: active
          ? "Monitoreo de seguridad activado"
          : "Monitoreo de seguridad desactivado",
        timestamp: Date.now(),
        userId: user.uid,
        deviceInfo: {
          name: Device.deviceName,
          brand: Device.brand,
          modelName: Device.modelName,
        },
      };

      await addDoc(collection(firestore, "securityEvents"), securityEvent);
    }
  } catch (error) {
    console.error("Error al cambiar estado del monitoreo:", error);
    throw error;
  }
};

/**
 * Bloquea el dispositivo
 */
export const blockDevice = async (reason: string): Promise<void> => {
  try {
    // Marcar el dispositivo como bloqueado localmente
    await AsyncStorage.setItem(DEVICE_BLOCKED_KEY, "true");
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

// Clave para almacenar intentos fallidos
const FAILED_ATTEMPTS_KEY = "failed_unlock_attempts";
const MAX_FAILED_ATTEMPTS = 5;

/**
 * Obtiene el número de intentos fallidos de desbloqueo
 */
export const getFailedAttempts = async (): Promise<number> => {
  try {
    const attemptsStr = await AsyncStorage.getItem(FAILED_ATTEMPTS_KEY);
    return attemptsStr ? parseInt(attemptsStr, 10) : 0;
  } catch (error) {
    console.error("Error al obtener intentos fallidos:", error);
    return 0;
  }
};

/**
 * Incrementa el contador de intentos fallidos
 */
export const incrementFailedAttempts = async (): Promise<number> => {
  try {
    const currentAttempts = await getFailedAttempts();
    const newAttempts = currentAttempts + 1;
    await AsyncStorage.setItem(FAILED_ATTEMPTS_KEY, newAttempts.toString());

    // Registrar el evento de seguridad
    await logSecurityEvent({
      type: "FAILED_UNLOCK",
      description: `Intento fallido de desbloqueo (${newAttempts}/${MAX_FAILED_ATTEMPTS})`,
      timestamp: Date.now(),
    });

    return newAttempts;
  } catch (error) {
    console.error("Error al incrementar intentos fallidos:", error);
    return 0;
  }
};

/**
 * Resetea el contador de intentos fallidos
 */
export const resetFailedAttempts = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(FAILED_ATTEMPTS_KEY, "0");
  } catch (error) {
    console.error("Error al resetear intentos fallidos:", error);
  }
};

/**
 * Desbloquea el dispositivo con una clave de seguridad
 */
export const unblockDeviceWithKey = async (key: string): Promise<boolean> => {
  try {
    // Obtener la clave de seguridad almacenada
    const storedKey = await AsyncStorage.getItem(SECURITY_KEY);
    console.log("Clave almacenada:", storedKey);
    console.log("Clave ingresada:", key);

    // Eliminar espacios y formatear ambas claves para comparación
    const formattedStoredKey = storedKey ? storedKey.replace(/\s+/g, "") : "";
    const formattedInputKey = key.replace(/\s+/g, "");

    // Verificar si la clave es correcta (comparación insensible a espacios)
    if (formattedStoredKey === formattedInputKey) {
      console.log("Clave correcta, desbloqueando dispositivo...");
      await unblockDevice();
      await resetFailedAttempts();
      return true;
    }

    // Si la clave es incorrecta, incrementar contador de intentos fallidos
    const failedAttempts = await incrementFailedAttempts();
    console.log(
      `Clave incorrecta. Intento fallido ${failedAttempts}/${MAX_FAILED_ATTEMPTS}`
    );

    // Si se alcanza el máximo de intentos, bloquear por más tiempo
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      console.log("Máximo de intentos alcanzado, bloqueando por más tiempo...");
      // Aquí podrías implementar un bloqueo más severo o enviar una alerta
    }

    return false;
  } catch (error) {
    console.error("Error al desbloquear con clave:", error);
    return false;
  }
};

/**
 * Verifica si el monitoreo de seguridad está activo
 */
export const isMonitoringActive = async (): Promise<boolean> => {
  try {
    // Verificar si el monitoreo está activo en el almacenamiento local
    const monitoringStatus = await AsyncStorage.getItem(MONITORING_ACTIVE_KEY);

    // Si no hay un estado guardado, verificamos la configuración de seguridad
    if (!monitoringStatus) {
      const settings = await getSecuritySettings();
      return settings.enabled;
    }

    return monitoringStatus === "true";
  } catch (error) {
    console.error("Error al verificar estado del monitoreo:", error);
    return false;
  }
};

/**
 * Inicia el monitoreo de seguridad
 */
export const startSecurityMonitoring = async (): Promise<boolean> => {
  try {
    // Marcar el monitoreo como activo
    await AsyncStorage.setItem(MONITORING_ACTIVE_KEY, "true");

    // Registrar la hora de inicio
    await AsyncStorage.setItem(
      LAST_MONITORING_CHECK_KEY,
      new Date().toISOString()
    );

    // Registrar evento de seguridad
    await logSecurityEvent({
      type: "monitoring_started",
      description: "Monitoreo de seguridad iniciado",
      timestamp: Date.now(),
    });

    // Registrar tarea en segundo plano
    await registerBackgroundTask();

    return true;
  } catch (error) {
    console.error("Error al iniciar monitoreo de seguridad:", error);
    return false;
  }
};

/**
 * Detiene el monitoreo de seguridad
 */
export const stopSecurityMonitoring = async (): Promise<boolean> => {
  try {
    // Marcar el monitoreo como inactivo
    await AsyncStorage.setItem(MONITORING_ACTIVE_KEY, "false");

    // Registrar evento de seguridad
    await logSecurityEvent({
      type: "monitoring_stopped",
      description: "Monitoreo de seguridad detenido",
      timestamp: Date.now(),
    });

    // Desregistrar tarea en segundo plano
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SECURITY_TASK);

    return true;
  } catch (error) {
    console.error("Error al detener monitoreo de seguridad:", error);
    return false;
  }
};

/**
 * Obtiene la hora de la última verificación de seguridad
 */
export const getLastMonitoringCheck = async (): Promise<string | null> => {
  try {
    const lastCheck = await AsyncStorage.getItem(LAST_MONITORING_CHECK_KEY);
    if (!lastCheck) return null;

    // Formatear la fecha para mostrarla de manera amigable
    const date = new Date(lastCheck);
    return date.toLocaleString();
  } catch (error) {
    console.error("Error al obtener última verificación:", error);
    return null;
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
