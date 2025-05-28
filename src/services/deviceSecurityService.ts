import {
  doc,
  updateDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  Firestore,
} from "firebase/firestore";
import { firestore, auth } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUser } from "./authService";
import * as Device from "expo-device";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import NetInfo from "@react-native-community/netinfo";
import { Platform, AppState, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import * as IntentLauncher from "expo-intent-launcher";
import * as Application from "expo-application";

// Constantes
const DEVICE_ID_KEY = "device_id";
const DEVICE_BLOCKED_KEY = "device_blocked";
const SECURITY_KEY = "security_key";
const LAST_SYNC_KEY = "last_sync";
const REMOTE_COMMAND_CHECK_TASK = "remote-command-check";
const FAILED_ATTEMPTS_KEY = "failed_unlock_attempts";
const MAX_FAILED_ATTEMPTS = 5;

// Tipos de eventos
export enum SecurityEventType {
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  DEVICE_BLOCKED = "device_blocked",
  DEVICE_UNBLOCKED = "device_unblocked",
  REMOTE_COMMAND = "remote_command",
  FAILED_UNLOCK = "failed_unlock",
  SYSTEM_ALERT = "system_alert",
}

// Tipos de comandos remotos
export enum RemoteCommandType {
  LOCK = "lock",
  UNLOCK = "unlock",
  LOCATE = "locate",
  WIPE = "wipe",
}

// Interfaces
export interface DeviceInfo {
  id: string;
  name: string;
  brand: string;
  manufacturer?: string;
  modelName: string;
  osName: string;
  osVersion: string;
}

export interface SecurityEvent {
  type: SecurityEventType;
  description: string;
  timestamp: number;
  deviceId: string;
  userId: string;
  details?: any;
  severity: "high" | "medium" | "low";
}

export interface RemoteCommand {
  id?: string;
  type: RemoteCommandType;
  deviceId: string;
  userId: string;
  status: "pending" | "executed" | "failed";
  createdAt: number;
  executedAt?: number;
  params?: any;
}

// Función para obtener un ID único para el dispositivo
export const getDeviceId = async (): Promise<string> => {
  try {
    // Intentar obtener ID existente
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    // Si no existe, crear uno nuevo
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error("Error al obtener ID de dispositivo:", error);
    return `device-${Date.now()}`;
  }
};

// Obtener información del dispositivo
export const getDeviceDetails = async (): Promise<DeviceInfo> => {
  try {
    const deviceId = await getDeviceId();

    return {
      id: deviceId,
      name: Device.deviceName || "Dispositivo",
      brand: Device.brand || "Desconocido",
      manufacturer: Device.manufacturer || "Desconocido",
      modelName: Device.modelName || "Desconocido",
      osName: Device.osName || "Android",
      osVersion: Device.osVersion || "Desconocido",
    };
  } catch (error) {
    console.error("Error al obtener detalles del dispositivo:", error);
    return {
      id: await getDeviceId(),
      name: "Dispositivo desconocido",
      brand: "Desconocido",
      modelName: "Desconocido",
      osName: "Android",
      osVersion: "Desconocido",
    };
  }
};

// Registrar el dispositivo en Firestore
export const registerDevice = async (): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) return false;

    const deviceInfo = await getDeviceDetails();

    // Guardar en la colección de devices
    await setDoc(doc(firestore, "devices", deviceInfo.id), {
      userId: user.uid,
      name: deviceInfo.name,
      registeredAt: serverTimestamp(),
      lastOnline: serverTimestamp(),
      deviceInfo: {
        brand: deviceInfo.brand,
        manufacturer: deviceInfo.manufacturer,
        modelName: deviceInfo.modelName,
        osName: deviceInfo.osName,
        osVersion: deviceInfo.osVersion,
        uniqueId: deviceInfo.id,
      },
      status: {
        isOnline: true,
        isBlocked: false,
      },
    });

    // Actualizar el usuario para que tenga referencia a este dispositivo
    await updateDoc(doc(firestore, "users", user.uid), {
      devices: { [deviceInfo.id]: true },
      deviceInfo: deviceInfo,
      lastActivity: serverTimestamp(),
    });

    // Configurar listener para comandos remotos
    await setupRemoteCommandListener();

    return true;
  } catch (error) {
    console.error("Error al registrar dispositivo:", error);
    return false;
  }
};

// Registrar eventos de seguridad
export const logSecurityEvent = async (
  eventData: Partial<SecurityEvent>
): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) return;

    const deviceId = await getDeviceId();

    // Crear evento completo con todos los campos requeridos
    const completeEvent: SecurityEvent = {
      type: eventData.type || SecurityEventType.SYSTEM_ALERT,
      description: eventData.description || "Evento de seguridad",
      timestamp: eventData.timestamp || Date.now(),
      deviceId: eventData.deviceId || deviceId,
      userId: eventData.userId || user.uid,
      severity: eventData.severity || "medium",
      details: eventData.details || {},
    };

    // Guardar en colección de eventos del usuario
    await addDoc(collection(firestore, "users", user.uid, "securityEvents"), {
      ...completeEvent,
      createdAt: serverTimestamp(),
    });

    // También guardar en la colección global para acceso desde la web
    await addDoc(collection(firestore, "securityEvents"), {
      ...completeEvent,
      createdAt: serverTimestamp(),
    });

    // Actualizar última actividad
    await updateDeviceStatus({ lastActivity: Date.now() });
  } catch (error) {
    console.error("Error al registrar evento de seguridad:", error);
  }
};

// Actualizar estado del dispositivo
export const updateDeviceStatus = async (statusData: any): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) return;

    const deviceId = await getDeviceId();

    // Actualizar documento del dispositivo
    await updateDoc(doc(firestore, "devices", deviceId), {
      ...statusData,
      lastOnline: serverTimestamp(),
    });

    // Actualizar última sincronización
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch (error) {
    console.error("Error al actualizar estado del dispositivo:", error);
  }
};

// Bloquear dispositivo
export const blockDevice = async (
  reason: string = "remote_lock"
): Promise<boolean> => {
  try {
    // Marcar el dispositivo como bloqueado localmente
    await AsyncStorage.setItem(DEVICE_BLOCKED_KEY, "true");

    const user = getCurrentUser();
    const deviceId = await getDeviceId();
    const deviceInfo = await getDeviceDetails();

    if (user) {
      // Actualizar estado en Firestore
      await updateDoc(doc(firestore, "devices", deviceId), {
        "status.isBlocked": true,
        "status.blockedAt": serverTimestamp(),
        "status.blockReason": reason,
        lastOnline: serverTimestamp(),
      });

      // Actualizar referencia en el usuario
      await updateDoc(doc(firestore, "users", user.uid), {
        deviceBlocked: true,
        blockedAt: serverTimestamp(),
        blockReason: reason,
        lastActivity: serverTimestamp(),
      });

      // Registrar evento
      await logSecurityEvent({
        type: SecurityEventType.DEVICE_BLOCKED,
        description: `Dispositivo bloqueado: ${reason}`,
        severity: "high",
        details: { reason, deviceInfo },
      });
    }

    // Intentar iniciar pantalla de bloqueo
    return true;
  } catch (error) {
    console.error("Error al bloquear dispositivo:", error);
    return false;
  }
};

// Verificar si el dispositivo está bloqueado
export const isDeviceBlocked = async (): Promise<boolean> => {
  try {
    // Primero verificar estado local
    const localBlocked = await AsyncStorage.getItem(DEVICE_BLOCKED_KEY);
    if (localBlocked === "true") return true;

    // Verificar estado en Firestore
    const user = getCurrentUser();
    if (!user) return false;

    const deviceId = await getDeviceId();
    const deviceDoc = await getDoc(doc(firestore, "devices", deviceId));

    if (deviceDoc.exists()) {
      const deviceData = deviceDoc.data();
      // Si está bloqueado en Firestore pero no localmente, actualizar estado local
      if (deviceData.status?.isBlocked) {
        await AsyncStorage.setItem(DEVICE_BLOCKED_KEY, "true");
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error al verificar estado de bloqueo:", error);
    // En caso de error, asumir que no está bloqueado
    return false;
  }
};

// Desbloquear dispositivo con clave de seguridad
export const unlockDeviceWithKey = async (
  securityKey: string
): Promise<boolean> => {
  try {
    // Verificar con la clave almacenada localmente
    const storedKey = await AsyncStorage.getItem(SECURITY_KEY);
    if (!storedKey || securityKey !== storedKey) {
      // Clave incorrecta, incrementar intentos fallidos
      await incrementFailedAttempts();
      return false;
    }

    // Clave correcta, desbloquear
    await AsyncStorage.setItem(DEVICE_BLOCKED_KEY, "false");
    await resetFailedAttempts();

    const user = getCurrentUser();
    if (user) {
      // Actualizar solo el documento del usuario (según la estructura vista en las imágenes)
      await updateDoc(doc(firestore, "users", user.uid), {
        deviceBlocked: false,
        unblockedAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
      });

      // Registrar evento de seguridad
      await addDoc(collection(firestore, "securityEvents"), {
        type: "device_unblocked",
        description: "Dispositivo desbloqueado remotamente desde la web",
        timestamp: Date.now(),
        userId: user.uid,
        deviceId: await getDeviceId(),
        createdAt: serverTimestamp(),
      });

      console.log("Dispositivo desbloqueado exitosamente");
    }

    return true;
  } catch (error) {
    console.error("Error al desbloquear dispositivo:", error);
    return false;
  }
};

// Gestión de intentos fallidos
export const getFailedAttempts = async (): Promise<number> => {
  try {
    const attemptsStr = await AsyncStorage.getItem(FAILED_ATTEMPTS_KEY);
    return attemptsStr ? parseInt(attemptsStr, 10) : 0;
  } catch (error) {
    console.error("Error al obtener intentos fallidos:", error);
    return 0;
  }
};

export const incrementFailedAttempts = async (): Promise<number> => {
  try {
    const attempts = await getFailedAttempts();
    const newAttempts = attempts + 1;

    await AsyncStorage.setItem(FAILED_ATTEMPTS_KEY, newAttempts.toString());

    // Registrar evento
    await logSecurityEvent({
      type: SecurityEventType.FAILED_UNLOCK,
      description: `Intento fallido de desbloqueo (${newAttempts}/${MAX_FAILED_ATTEMPTS})`,
      severity: newAttempts >= 3 ? "high" : "medium",
    });

    // Si supera el umbral, bloquear permanentemente
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      await blockDevice("too_many_failed_attempts");
    }

    return newAttempts;
  } catch (error) {
    console.error("Error al incrementar intentos fallidos:", error);
    return 0;
  }
};

export const resetFailedAttempts = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(FAILED_ATTEMPTS_KEY, "0");
  } catch (error) {
    console.error("Error al resetear intentos fallidos:", error);
  }
};

// Configurar listener para comandos remotos
export const setupRemoteCommandListener = async (): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) return;

    const deviceId = await getDeviceId();

    // Escuchar cambios en comandos pendientes para este dispositivo
    const q = query(
      collection(firestore, "remoteCommands"),
      where("deviceId", "==", deviceId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    // Cancelar subscripción anterior si existe
    if (global.commandListener) {
      global.commandListener();
    }

    // Crear nueva subscripción
    global.commandListener = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const command = change.doc.data() as RemoteCommand;
          console.log("Comando remoto recibido:", command);

          // Ejecutar comando
          await executeRemoteCommand(command, change.doc.id);
        }
      });
    });

    // Registrar tarea en segundo plano para verificar comandos
    await registerRemoteCommandTask();
  } catch (error) {
    console.error("Error al configurar listener de comandos:", error);
  }
};

// Ejecutar comando remoto
export const executeRemoteCommand = async (
  command: RemoteCommand,
  commandId: string
): Promise<void> => {
  try {
    // Marcar como en ejecución
    await updateDoc(doc(firestore, "remoteCommands", commandId), {
      status: "executing",
      executedAt: serverTimestamp(),
    });

    let result: any = { success: false };

    // Ejecutar según tipo
    switch (command.type) {
      case RemoteCommandType.LOCK:
        result.success = await blockDevice("remote_command");
        break;

      case RemoteCommandType.UNLOCK:
        // Solo podemos desbloquear si tenemos la clave
        if (command.params?.securityKey) {
          result.success = await unlockDeviceWithKey(
            command.params.securityKey
          );
        } else {
          result.success = false;
          result.error = "No se proporcionó clave de seguridad";
        }
        break;

      case RemoteCommandType.LOCATE:
        // Simulación
        result.success = true;
        result.location = {
          latitude: 4.624335,
          longitude: -74.063644,
          accuracy: 10,
          timestamp: Date.now(),
        };
        break;

      case RemoteCommandType.WIPE:
        // Simulación: En un caso real, se usarían APIs nativas
        result.success = true;
        result.message = "Borrado iniciado";
        break;
    }

    // Actualizar resultado
    await updateDoc(doc(firestore, "remoteCommands", commandId), {
      status: result.success ? "executed" : "failed",
      result: result,
    });

    // Registrar evento
    await logSecurityEvent({
      type: SecurityEventType.REMOTE_COMMAND,
      description: `Comando remoto ejecutado: ${command.type}`,
      severity: "high",
      details: { command, result },
    });
  } catch (error) {
    console.error("Error al ejecutar comando remoto:", error);

    // Marcar como fallido
    await updateDoc(doc(firestore, "remoteCommands", commandId), {
      status: "failed",
      result: { success: false, error: String(error) },
    });
  }
};

// Registrar tarea en segundo plano para verificar comandos remotos
export const registerRemoteCommandTask = async (): Promise<boolean> => {
  try {
    TaskManager.defineTask(REMOTE_COMMAND_CHECK_TASK, async () => {
      try {
        // Verificar conexión
        const netState = await NetInfo.fetch();
        if (!netState.isConnected)
          return BackgroundFetch.BackgroundFetchResult.NoData;

        // Verificar usuario
        const user = getCurrentUser();
        if (!user) return BackgroundFetch.BackgroundFetchResult.NoData;

        // Buscar comandos pendientes
        const deviceId = await getDeviceId();
        const q = query(
          collection(firestore, "remoteCommands"),
          where("deviceId", "==", deviceId),
          where("status", "==", "pending"),
          orderBy("createdAt", "desc"),
          limit(5)
        );

        // En una implementación real, obtendríamos todos los comandos pendientes usando getDocs(q)
        // Para simplificar, vamos a verificar si hay algún comando pendiente directamente en el dispositivo
        const isBlocked = await AsyncStorage.getItem(DEVICE_BLOCKED_KEY);
        
        // Verificar si necesitamos ejecutar un bloqueo
        if (isBlocked === "true") {
          // El dispositivo ya está bloqueado localmente, notificar que todo está bien
          return BackgroundFetch.BackgroundFetchResult.NewData;
        }
        
        // Verificar si hay un comando de bloqueo pendiente en Firestore
        try {
          const userDoc = await getDoc(doc(firestore, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.deviceBlocked && isBlocked !== "true") {
              // Hay un comando de bloqueo pendiente, ejecutarlo localmente
              await AsyncStorage.setItem(DEVICE_BLOCKED_KEY, "true");
              
              // Registrar evento
              await logSecurityEvent({
                type: SecurityEventType.DEVICE_BLOCKED,
                description: "Dispositivo bloqueado remotamente durante verificación en segundo plano",
                severity: "high"
              });
              
              return BackgroundFetch.BackgroundFetchResult.NewData;
            }
          }
        } catch (error) {
          console.error("Error al verificar comandos remotos:", error);
        }

        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error("Error en tarea de verificación de comandos:", error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Verificar si la tarea ya está registrada
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      REMOTE_COMMAND_CHECK_TASK
    );

    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(REMOTE_COMMAND_CHECK_TASK, {
        minimumInterval: 15 * 60, // 15 minutos
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }

    return true;
  } catch (error) {
    console.error(
      "Error al registrar tarea de verificación de comandos:",
      error
    );
    return false;
  }
};

// Inicializar servicio de seguridad
export const initSecurityService = async (): Promise<void> => {
  try {
    // Registrar dispositivo si no está registrado
    const deviceId = await getDeviceId();
    const user = getCurrentUser();

    if (user) {
      // Verificar si ya existe el dispositivo
      const deviceDoc = await getDoc(doc(firestore, "devices", deviceId));

      if (!deviceDoc.exists()) {
        await registerDevice();
      } else {
        // Actualizar estado online
        await updateDeviceStatus({
          "status.isOnline": true,
          lastOnline: serverTimestamp(),
        });
      }

      // Configurar listener para comandos remotos
      await setupRemoteCommandListener();

      // Verificar si hay un bloqueo pendiente
      await isDeviceBlocked();
    }
  } catch (error) {
    console.error("Error al inicializar servicio de seguridad:", error);
  }
};

// Detectar desinstalación (simulación)
export const setupUninstallDetection = (): void => {
  // En una app real, se implementaría con servicios nativos
  AppState.addEventListener("change", async (state) => {
    if (state === "active") {
      // Verificar tiempo desde la última sincronización
      const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
      const now = Date.now();

      // Si han pasado más de 24 horas, considerar que la app fue desinstalada
      if (lastSync && now - lastSync > 24 * 60 * 60 * 1000) {
        await logSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          description: "Posible desinstalación detectada",
          severity: "high",
        });
      }

      // Actualizar última sincronización
      await AsyncStorage.setItem(LAST_SYNC_KEY, now.toString());
    }
  });
};

// Exportar variables globales
declare global {
  var commandListener: any;
}
