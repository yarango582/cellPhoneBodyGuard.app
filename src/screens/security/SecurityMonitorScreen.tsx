import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  getSecuritySettings,
  updateSecuritySettings,
  getSuspiciousActivityCount,
  resetSuspiciousActivityCount,
  isMonitoringActive,
  getLastMonitoringCheck,
  setMonitoringActive,
} from "../../services/securityService";

import { styles } from "./styles/SecurityMonitorScreenStyles";

const SecurityMonitorScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    enabled: false,
    suspiciousAttemptsThreshold: 3,
    autoBlockEnabled: true,
    remoteWipeEnabled: false,
    lastChecked: "",
  });
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [lastCheck, setLastCheck] = useState("");

  // Cargar configuración inicial
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar configuración de seguridad
      const securitySettings = await getSecuritySettings();
      setSettings(securitySettings);

      // Cargar contador de actividades sospechosas
      const count = await getSuspiciousActivityCount();
      setSuspiciousCount(count);

      // Verificar si el monitoreo está activo
      const monitoringActive = await isMonitoringActive();
      setIsActive(monitoringActive);

      // Obtener última verificación
      const lastCheckTime = await getLastMonitoringCheck();
      setLastCheck(lastCheckTime || "Nunca");
    } catch (error) {
      console.error("Error al cargar datos de seguridad:", error);
      Alert.alert(
        "Error",
        "No se pudieron cargar los datos de seguridad. Por favor, intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMonitoring = async (value: boolean) => {
    try {
      if (value) {
        // Mostrar advertencia antes de activar
        Alert.alert(
          "Activar Monitoreo de Seguridad",
          "Al activar el monitoreo de seguridad, la aplicación monitoreará constantemente tu dispositivo en busca de actividades sospechosas y podrá bloquearlo automáticamente si detecta un riesgo.\n\n¿Estás seguro de que deseas activar esta función?",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Activar",
              onPress: async () => {
                setLoading(true);
                try {
                  // Usar la nueva función para activar el monitoreo
                  await setMonitoringActive(true);
                  await updateSecuritySettings({
                    ...settings,
                    enabled: true,
                  });
                  setSettings((prev) => ({ ...prev, enabled: true }));
                  setIsActive(true);

                  Alert.alert(
                    "Monitoreo Activado",
                    "El monitoreo de seguridad ha sido activado correctamente. Tu dispositivo ahora está protegido."
                  );
                } catch (error) {
                  console.error("Error al activar monitoreo:", error);
                  Alert.alert(
                    "Error",
                    "No se pudo activar el monitoreo. Intenta nuevamente."
                  );
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
      } else {
        // Mostrar confirmación antes de desactivar
        Alert.alert(
          "Desactivar Monitoreo de Seguridad",
          "Al desactivar el monitoreo de seguridad, tu dispositivo quedará sin protección contra actividades sospechosas.\n\n¿Estás seguro de que deseas desactivar esta función?",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Desactivar",
              style: "destructive",
              onPress: async () => {
                setLoading(true);
                try {
                  // Usar la nueva función para desactivar el monitoreo
                  await setMonitoringActive(false);
                  await updateSecuritySettings({
                    ...settings,
                    enabled: false,
                  });
                  setSettings((prev) => ({ ...prev, enabled: false }));
                  setIsActive(false);

                  Alert.alert(
                    "Monitoreo Desactivado",
                    "El monitoreo de seguridad ha sido desactivado correctamente."
                  );
                } catch (error) {
                  console.error("Error al desactivar monitoreo:", error);
                  Alert.alert(
                    "Error",
                    "No se pudo desactivar el monitoreo. Intenta nuevamente."
                  );
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error al cambiar estado del monitoreo:", error);
      Alert.alert(
        "Error",
        "No se pudo cambiar el estado del monitoreo. Intenta nuevamente."
      );
      setLoading(false);
    }
  };

  const handleToggleAutoBlock = async (value: boolean) => {
    try {
      setLoading(true);
      await updateSecuritySettings({
        ...settings,
        autoBlockEnabled: value,
      });
      setSettings((prev) => ({ ...prev, autoBlockEnabled: value }));
      setLoading(false);
    } catch (error) {
      console.error("Error al cambiar configuración:", error);
      Alert.alert(
        "Error",
        "No se pudo actualizar la configuración. Por favor, intenta de nuevo."
      );
      setLoading(false);
    }
  };

  const handleChangeThreshold = async (value: number) => {
    try {
      setLoading(true);
      await updateSecuritySettings({
        ...settings,
        suspiciousAttemptsThreshold: value,
      });
      setSettings((prev) => ({ ...prev, suspiciousAttemptsThreshold: value }));
      setLoading(false);
    } catch (error) {
      console.error("Error al cambiar umbral:", error);
      Alert.alert(
        "Error",
        "No se pudo actualizar el umbral. Por favor, intenta de nuevo."
      );
      setLoading(false);
    }
  };

  const handleResetCounter = async () => {
    try {
      setLoading(true);
      await resetSuspiciousActivityCount();
      setSuspiciousCount(0);
      setLoading(false);
      Alert.alert(
        "Contador Reiniciado",
        "El contador de actividades sospechosas ha sido reiniciado correctamente."
      );
    } catch (error) {
      console.error("Error al reiniciar contador:", error);
      Alert.alert(
        "Error",
        "No se pudo reiniciar el contador. Por favor, intenta de nuevo."
      );
      setLoading(false);
    }
  };

  const handleTestLock = () => {
    navigation.navigate("LockConfirm" as never);
  };

  // Función simplificada para el botón de activar/desactivar monitoreo
  const toggleMonitoring = async () => {
    try {
      setLoading(true);
      // Usar la función del servicio para activar/desactivar el monitoreo
      await setMonitoringActive(!isActive);
      setIsActive(!isActive);

      // Actualizar la configuración
      await updateSecuritySettings({
        ...settings,
        enabled: !isActive,
      });
      setSettings((prev) => ({ ...prev, enabled: !isActive }));

      // Mostrar mensaje de confirmación
      Alert.alert(
        isActive ? "Monitoreo desactivado" : "Monitoreo activado",
        isActive
          ? "El monitoreo de seguridad ha sido desactivado. Tu dispositivo ya no será monitoreado para detectar actividades sospechosas."
          : "El monitoreo de seguridad ha sido activado. Se te notificará cuando se detecten actividades sospechosas."
      );
    } catch (error) {
      console.error("Error al cambiar estado del monitoreo:", error);
      Alert.alert(
        "Error",
        "No se pudo cambiar el estado del monitoreo. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons
            name={isActive ? "shield-checkmark" : "shield-outline"}
            size={60}
            color={isActive ? "#28A745" : "#6C757D"}
          />
          <Text style={styles.title}>Monitor de Seguridad</Text>
          <Text style={styles.subtitle}>
            Estado: {isActive ? "Activo" : "Inactivo"}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Estado del monitoreo:</Text>
            <View
              style={[
                styles.statusIndicator,
                isActive ? styles.statusActive : styles.statusInactive,
              ]}
            >
              <Text style={styles.statusText}>
                {isActive ? "ACTIVO" : "INACTIVO"}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Última verificación:</Text>
            <Text style={styles.statusValue}>{lastCheck}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Actividades sospechosas:</Text>
            <Text
              style={[
                styles.statusValue,
                suspiciousCount > 0 && styles.warningText,
              ]}
            >
              {suspiciousCount} detectadas
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Umbral de bloqueo:</Text>
            <Text style={styles.statusValue}>
              {settings.suspiciousAttemptsThreshold} actividades
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Bloqueo automático:</Text>
            <Text
              style={[
                styles.statusValue,
                settings.autoBlockEnabled
                  ? styles.enabledText
                  : styles.disabledText,
              ]}
            >
              {settings.autoBlockEnabled ? "Habilitado" : "Deshabilitado"}
            </Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Configuración</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="shield" size={24} color="#007AFF" />
              <Text style={styles.settingLabel}>Monitoreo de seguridad</Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={toggleMonitoring}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isActive ? "#007AFF" : "#f4f3f4"}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="lock-closed" size={24} color="#007AFF" />
              <Text style={styles.settingLabel}>Bloqueo automático</Text>
            </View>
            <Switch
              value={settings.autoBlockEnabled}
              onValueChange={handleToggleAutoBlock}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={settings.autoBlockEnabled ? "#007AFF" : "#f4f3f4"}
              disabled={!settings.enabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="options" size={24} color="#007AFF" />
              <Text style={styles.settingLabel}>Umbral de actividades</Text>
            </View>
            <View style={styles.thresholdControls}>
              <TouchableOpacity
                style={styles.thresholdButton}
                onPress={() =>
                  handleChangeThreshold(
                    Math.max(1, settings.suspiciousAttemptsThreshold - 1)
                  )
                }
                disabled={
                  !settings.enabled || settings.suspiciousAttemptsThreshold <= 1
                }
              >
                <Text style={styles.thresholdButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.thresholdValue}>
                {settings.suspiciousAttemptsThreshold}
              </Text>
              <TouchableOpacity
                style={styles.thresholdButton}
                onPress={() =>
                  handleChangeThreshold(
                    Math.min(10, settings.suspiciousAttemptsThreshold + 1)
                  )
                }
                disabled={
                  !settings.enabled ||
                  settings.suspiciousAttemptsThreshold >= 10
                }
              >
                <Text style={styles.thresholdButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Acciones</Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.resetButton]}
            onPress={handleResetCounter}
            disabled={suspiciousCount === 0}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>
              Reiniciar contador de actividades
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.testButton]}
            onPress={handleTestLock}
          >
            <Ionicons name="lock-closed" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Probar bloqueo manual</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
          <Text style={styles.infoText}>
            El monitor de seguridad analiza constantemente el comportamiento del
            dispositivo en busca de actividades sospechosas, como intentos de
            acceso no autorizados, cambios en la configuración del sistema o
            movimientos geográficos inusuales.
          </Text>
          <Text style={styles.infoText}>
            Si se detecta un número de actividades sospechosas superior al
            umbral configurado, el dispositivo se bloqueará automáticamente y
            notificará al propietario por correo electrónico.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SecurityMonitorScreen;
