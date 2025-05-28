import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import {
  getSecuritySettings,
  updateSecuritySettings,
  SecuritySettings,
  blockDevice,
  unblockDevice,
  isDeviceBlockedLocally,
  isMonitoringActive,
} from "../../services/securityService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUser } from "../../services/authService";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../../config/firebase";
import { styles } from "./styles/SecurityScreenStyles";

const SECURITY_KEY = "security_key";

const SecurityScreen: React.FC = () => {
  const navigation = useNavigation();

  const [settings, setSettings] = useState<SecuritySettings>({
    enabled: false,
    suspiciousAttemptsThreshold: 3,
    autoBlockEnabled: true,
    remoteWipeEnabled: false,
    lastChecked: new Date().toISOString(),
  });

  const [isBlocked, setIsBlocked] = useState(false);
  const [securityKey, setSecurityKey] = useState("");
  const [showSecurityKey, setShowSecurityKey] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Verificar si el monitoreo está activo
  const checkMonitoringStatus = async () => {
    try {
      const active = await isMonitoringActive();
      setMonitoringActive(active);
    } catch (error) {
      console.error("Error al verificar estado del monitoreo:", error);
    }
  };

  useEffect(() => {
    loadSettings();
    checkBlockStatus();
    loadSecurityKey();
    checkMonitoringStatus();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const currentSettings = await getSecuritySettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error("Error al cargar configuración:", error);
      Alert.alert("Error", "No se pudo cargar la configuración de seguridad");
    } finally {
      setIsLoading(false);
    }
  };

  const checkBlockStatus = async () => {
    try {
      const blocked = await isDeviceBlockedLocally();
      setIsBlocked(blocked);
    } catch (error) {
      console.error("Error al verificar estado de bloqueo:", error);
    }
  };

  const loadSecurityKey = async () => {
    try {
      // Intentar obtener la clave de seguridad desde AsyncStorage
      const key = await AsyncStorage.getItem(SECURITY_KEY);
      if (key) {
        setSecurityKey(key);
        return;
      }

      // Si no hay clave en AsyncStorage, intentar obtenerla de Firestore
      const user = getCurrentUser();
      if (user) {
        try {
          // Obtener la clave de seguridad desde Firestore
          const userDoc = await getDoc(doc(firestore, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.securityKey) {
              // Guardar la clave en AsyncStorage para futuras consultas
              await AsyncStorage.setItem(SECURITY_KEY, userData.securityKey);
              setSecurityKey(userData.securityKey);
            } else {
              console.error("No se encontró clave de seguridad en Firestore");
              Alert.alert(
                "Error",
                "No se pudo recuperar tu clave de seguridad. Por favor, contacta con soporte."
              );
            }
          }
        } catch (firestoreError) {
          console.error("Error al obtener clave de Firestore:", firestoreError);
          Alert.alert(
            "Error",
            "No se pudo recuperar tu clave de seguridad. Por favor, intenta más tarde."
          );
        }
      }
    } catch (error) {
      console.error("Error al cargar clave de seguridad:", error);
    }
  };

  const handleToggleProtection = async (value: boolean) => {
    if (value) {
      // Mostrar confirmación antes de activar
      Alert.alert(
        "Activar protección",
        "Al activar la protección, tu dispositivo será monitoreado para detectar actividades sospechosas y podrá ser bloqueado automáticamente. ¿Deseas continuar?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Activar",
            onPress: () => saveSettings({ ...settings, enabled: true }),
          },
        ]
      );
    } else {
      // Mostrar confirmación antes de desactivar
      Alert.alert(
        "Desactivar protección",
        "Al desactivar la protección, tu dispositivo quedará vulnerable. ¿Estás seguro?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Desactivar",
            style: "destructive",
            onPress: () => saveSettings({ ...settings, enabled: false }),
          },
        ]
      );
    }
  };

  const handleToggleAutoBlock = (value: boolean) => {
    setSettings({ ...settings, autoBlockEnabled: value });
  };

  const handleToggleRemoteWipe = (value: boolean) => {
    if (value) {
      // Mostrar advertencia antes de activar el borrado remoto
      Alert.alert(
        "Advertencia",
        "El borrado remoto es una medida extrema que cifrará los datos de tu dispositivo. Asegúrate de tener copias de seguridad de tu información importante. ¿Deseas activar esta función?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Activar",
            onPress: () =>
              setSettings({ ...settings, remoteWipeEnabled: true }),
          },
        ]
      );
    } else {
      setSettings({ ...settings, remoteWipeEnabled: false });
    }
  };

  const handleThresholdChange = (value: number) => {
    setSettings({
      ...settings,
      suspiciousAttemptsThreshold: Math.round(value),
    });
  };

  const saveSettings = async (newSettings: SecuritySettings) => {
    try {
      setIsSaving(true);
      await updateSecuritySettings(newSettings);
      setSettings(newSettings);
      Alert.alert("Éxito", "Configuración guardada correctamente");
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      Alert.alert("Error", "No se pudo guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = () => {
    saveSettings(settings);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

  // Función para mostrar/ocultar la clave de seguridad
  const handleViewSecurityKey = () => {
    setShowSecurityKey(!showSecurityKey);
  };

  // Función para bloquear manualmente el dispositivo
  const handleBlockDevice = () => {
    // Usar la nueva pantalla de confirmación de bloqueo
    navigation.navigate("LockConfirm" as never);
  };

  // Función para acceder al monitor de seguridad
  const handleOpenSecurityMonitor = () => {
    navigation.navigate("SecurityMonitor" as never);
  };

  // Función para desbloquear manualmente el dispositivo
  const handleUnblockDevice = () => {
    Alert.alert(
      "Desbloquear dispositivo",
      "¿Estás seguro de que quieres desbloquear tu dispositivo?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Desbloquear",
          onPress: async () => {
            try {
              setIsLoading(true);
              await unblockDevice();
              setIsBlocked(false);
              Alert.alert(
                "Dispositivo desbloqueado",
                "Tu dispositivo ha sido desbloqueado correctamente."
              );
            } catch (error) {
              console.error("Error al desbloquear dispositivo:", error);
              Alert.alert("Error", "No se pudo desbloquear el dispositivo");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Configuración de seguridad</Text>
          <Text style={styles.subtitle}>
            Personaliza cómo quieres proteger tu dispositivo
          </Text>
        </View>

        {/* Sección de clave de seguridad */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Clave de seguridad</Text>
          <Text style={styles.settingDescription}>
            Esta clave es necesaria para desbloquear tu dispositivo si es
            bloqueado por actividad sospechosa.
          </Text>

          {showSecurityKey ? (
            <View style={styles.securityKeyContainer}>
              <Text style={styles.securityKey}>{securityKey}</Text>
              <TouchableOpacity
                style={styles.hideKeyButton}
                onPress={handleViewSecurityKey}
              >
                <Text style={styles.hideKeyText}>Ocultar clave</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.viewKeyButton}
              onPress={handleViewSecurityKey}
            >
              <Text style={styles.viewKeyText}>Ver clave de seguridad</Text>
              <Ionicons name="eye-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Sección de monitor de seguridad */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monitor de seguridad</Text>
            <View
              style={[
                styles.statusBadge,
                monitoringActive ? styles.statusActive : styles.statusInactive,
              ]}
            >
              <Text style={styles.statusText}>
                {monitoringActive ? "ACTIVO" : "INACTIVO"}
              </Text>
            </View>
          </View>

          <Text style={styles.settingDescription}>
            Accede al panel de monitoreo para ver el estado de seguridad de tu
            dispositivo y configurar opciones avanzadas.
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.monitorButton]}
            onPress={handleOpenSecurityMonitor}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.actionButtonText}>
              Abrir monitor de seguridad
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sección de bloqueo manual */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Control manual</Text>
          <Text style={styles.settingDescription}>
            Bloquea o desbloquea manualmente tu dispositivo.
          </Text>

          {isBlocked ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.unblockButton]}
              onPress={handleUnblockDevice}
            >
              <Ionicons name="lock-open-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                Desbloquear dispositivo
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.blockButton]}
              onPress={handleBlockDevice}
            >
              <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Bloquear dispositivo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Protección activa</Text>
              <Text style={styles.settingDescription}>
                Activa el monitoreo de seguridad para detectar actividades
                sospechosas
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleProtection}
              trackColor={{ false: "#D1D1D6", true: "#4CAF50" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={[styles.card, !settings.enabled && styles.disabledCard]}>
          <Text style={styles.cardTitle}>Comportamientos sospechosos</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Bloqueo automático</Text>
              <Text style={styles.settingDescription}>
                Bloquear automáticamente el dispositivo cuando se detecten
                actividades sospechosas
              </Text>
            </View>
            <Switch
              value={settings.autoBlockEnabled}
              onValueChange={handleToggleAutoBlock}
              disabled={!settings.enabled}
              trackColor={{ false: "#D1D1D6", true: "#007AFF" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>
              Umbral de actividades sospechosas:{" "}
              {settings.suspiciousAttemptsThreshold}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={settings.suspiciousAttemptsThreshold}
              onValueChange={handleThresholdChange}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#D1D1D6"
              thumbTintColor="#007AFF"
              disabled={!settings.enabled}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMinLabel}>Sensible</Text>
              <Text style={styles.sliderMaxLabel}>Tolerante</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, !settings.enabled && styles.disabledCard]}>
          <Text style={styles.cardTitle}>Opciones avanzadas</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Cifrado remoto</Text>
              <Text style={styles.settingDescription}>
                Cifrar datos sensibles cuando se active el protocolo de
                seguridad
              </Text>
            </View>
            <Switch
              value={settings.remoteWipeEnabled}
              onValueChange={handleToggleRemoteWipe}
              disabled={!settings.enabled}
              trackColor={{ false: "#D1D1D6", true: "#FF3B30" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#007AFF"
            />
            <Text style={styles.infoText}>
              El cifrado remoto es una medida extrema que protegerá tus datos
              sensibles en caso de robo. Asegúrate de tener copias de seguridad
              de tu información importante.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Comportamientos monitoreados</Text>

          <View style={styles.behaviorItem}>
            <Ionicons name="lock-open-outline" size={24} color="#007AFF" />
            <View style={styles.behaviorInfo}>
              <Text style={styles.behaviorTitle}>
                Intentos fallidos de desbloqueo
              </Text>
              <Text style={styles.behaviorDescription}>
                Detecta múltiples intentos incorrectos de desbloqueo del
                dispositivo
              </Text>
            </View>
          </View>

          <View style={styles.behaviorItem}>
            <Ionicons name="location-outline" size={24} color="#007AFF" />
            <View style={styles.behaviorInfo}>
              <Text style={styles.behaviorTitle}>
                Cambios inusuales de ubicación
              </Text>
              <Text style={styles.behaviorDescription}>
                Detecta movimientos geográficos rápidos o inusuales
              </Text>
            </View>
          </View>

          <View style={styles.behaviorItem}>
            <Ionicons name="trash-outline" size={24} color="#007AFF" />
            <View style={styles.behaviorInfo}>
              <Text style={styles.behaviorTitle}>
                Intentos de desinstalación
              </Text>
              <Text style={styles.behaviorDescription}>
                Detecta intentos de desinstalar la aplicación de seguridad
              </Text>
            </View>
          </View>

          <View style={styles.behaviorItem}>
            <Ionicons name="settings-outline" size={24} color="#007AFF" />
            <View style={styles.behaviorInfo}>
              <Text style={styles.behaviorTitle}>
                Cambios en la configuración
              </Text>
              <Text style={styles.behaviorDescription}>
                Detecta cambios sospechosos en la configuración del sistema
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.savingButton]}
          onPress={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar configuración</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SecurityScreen;
