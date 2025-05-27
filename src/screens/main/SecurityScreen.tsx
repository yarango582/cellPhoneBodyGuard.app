import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  Alert,
  View // Keep View for simple layout containers if needed
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; // Keep Ionicons
import {
  Card,
  Switch as PaperSwitch,
  Button,
  Text as PaperText,
  ActivityIndicator as PaperActivityIndicator,
  useTheme,
  List,
  Avatar,
  IconButton, // Not explicitly in list, but good for icon-only buttons
  MD3Colors // For specific colors if needed
} from "react-native-paper";
import Slider from "@react-native-community/slider";
import {
  getSecuritySettings,
  updateSecuritySettings,
  SecuritySettings,
  blockDevice,
  unblockDevice,
  isDeviceBlockedLocally
} from "../../services/securityService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUser } from "../../services/authService";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../../config/firebase";

const SECURITY_KEY = "security_key";

const SecurityScreen: React.FC = () => {
  const theme = useTheme();
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

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    checkBlockStatus();
    loadSecurityKey();
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
        <PaperActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <PaperText style={styles.loadingText}>Cargando configuración...</PaperText>
      </View>
    );
  }

  // Función para mostrar/ocultar la clave de seguridad
  const handleViewSecurityKey = () => {
    setShowSecurityKey(!showSecurityKey);
  };

  // Función para bloquear manualmente el dispositivo
  const handleBlockDevice = () => {
    Alert.alert(
      "Bloquear dispositivo",
      "¿Estás seguro de que quieres bloquear tu dispositivo? Necesitarás tu clave de seguridad para desbloquearlo.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Bloquear",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              await blockDevice("manual_block");
              setIsBlocked(true);
              Alert.alert(
                "Dispositivo bloqueado",
                "Tu dispositivo ha sido bloqueado. Usa tu clave de seguridad para desbloquearlo."
              );
            } catch (error) {
              console.error("Error al bloquear dispositivo:", error);
              Alert.alert("Error", "No se pudo bloquear el dispositivo");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <PaperText variant="headlineMedium" style={styles.title}>Configuración de seguridad</PaperText>
          <PaperText variant="bodyLarge" style={styles.subtitle}>
            Personaliza cómo quieres proteger tu dispositivo
          </PaperText>
        </View>

        <Card style={styles.card}>
          <Card.Title title="Clave de seguridad" titleVariant="titleLarge" />
          <Card.Content>
            <PaperText variant="bodyMedium" style={styles.settingDescription}>
              Esta clave es necesaria para desbloquear tu dispositivo si es
              bloqueado por actividad sospechosa.
            </PaperText>
            {showSecurityKey ? (
              <View style={styles.securityKeyContainer}>
                <PaperText variant="titleMedium" style={styles.securityKey}>{securityKey}</PaperText>
                <Button
                  mode="text"
                  onPress={handleViewSecurityKey}
                  style={styles.hideKeyButton}
                >
                  Ocultar clave
                </Button>
              </View>
            ) : (
              <Button
                mode="outlined"
                onPress={handleViewSecurityKey}
                icon={({ size, color }) => <Ionicons name="eye-outline" size={size} color={color} />}
                style={styles.viewKeyButton}
              >
                Ver clave de seguridad
              </Button>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Control manual" titleVariant="titleLarge" />
          <Card.Content>
            <PaperText variant="bodyMedium" style={styles.settingDescription}>
              Bloquea o desbloquea manualmente tu dispositivo.
            </PaperText>
            {isBlocked ? (
              <Button
                mode="contained"
                onPress={handleUnblockDevice}
                icon={({ size, color }) => <Ionicons name="lock-open-outline" size={size} color={color} />}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]} // Or a green color
                labelStyle={styles.actionButtonText}
              >
                Desbloquear dispositivo
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleBlockDevice}
                icon={({ size, color }) => <Ionicons name="lock-closed-outline" size={size} color={color} />}
                style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                labelStyle={styles.actionButtonText}
              >
                Bloquear dispositivo
              </Button>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <List.Item
              title="Protección activa"
              description="Activa el monitoreo de seguridad para detectar actividades sospechosas"
              titleStyle={styles.settingTitle}
              descriptionStyle={styles.settingDescriptionListItem}
              right={() => (
                <PaperSwitch
                  value={settings.enabled}
                  onValueChange={handleToggleProtection}
                />
              )}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card} disabled={!settings.enabled}>
          <Card.Title title="Comportamientos sospechosos" titleVariant="titleLarge" />
          <Card.Content>
            <List.Item
              title="Bloqueo automático"
              description="Bloquear automáticamente el dispositivo cuando se detecten actividades sospechosas"
              titleStyle={styles.settingTitle}
              descriptionStyle={styles.settingDescriptionListItem}
              disabled={!settings.enabled}
              right={() => (
                <PaperSwitch
                  value={settings.autoBlockEnabled}
                  onValueChange={handleToggleAutoBlock}
                  disabled={!settings.enabled}
                />
              )}
            />
            <View style={styles.sliderContainer}>
              <PaperText variant="bodyMedium" style={styles.sliderLabel}>
                Umbral de actividades sospechosas: {settings.suspiciousAttemptsThreshold}
              </PaperText>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={settings.suspiciousAttemptsThreshold}
                onValueChange={handleThresholdChange}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.outline}
                thumbTintColor={theme.colors.primary}
                disabled={!settings.enabled}
              />
              <View style={styles.sliderLabels}>
                <PaperText variant="labelSmall" style={styles.sliderMinLabel}>Sensible</PaperText>
                <PaperText variant="labelSmall" style={styles.sliderMaxLabel}>Tolerante</PaperText>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card} disabled={!settings.enabled}>
          <Card.Title title="Opciones avanzadas" titleVariant="titleLarge" />
          <Card.Content>
            <List.Item
              title="Cifrado remoto"
              description="Cifrar datos sensibles cuando se active el protocolo de seguridad"
              titleStyle={styles.settingTitle}
              descriptionStyle={styles.settingDescriptionListItem}
              disabled={!settings.enabled}
              right={() => (
                <PaperSwitch
                  value={settings.remoteWipeEnabled}
                  onValueChange={handleToggleRemoteWipe}
                  disabled={!settings.enabled}
                  color={theme.colors.error} // For the 'on' state of the switch
                />
              )}
            />
            <View style={[styles.infoBox, { backgroundColor: theme.colors.primaryContainer }]}>
              <Avatar.Icon size={32} icon="information-outline" style={{ backgroundColor: 'transparent' }} color={theme.colors.onPrimaryContainer}/>
              <PaperText variant="bodyMedium" style={[styles.infoText, { color: theme.colors.onPrimaryContainer }]}>
                El cifrado remoto es una medida extrema que protegerá tus datos sensibles en caso de robo. Asegúrate de tener copias de seguridad de tu información importante.
              </PaperText>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Comportamientos monitoreados" titleVariant="titleLarge" />
          <Card.Content>
            <List.Item
              title="Intentos fallidos de desbloqueo"
              description="Detecta múltiples intentos incorrectos de desbloqueo del dispositivo"
              left={props => <List.Icon {...props} icon={({size, color}) => <Ionicons name="lock-open-outline" size={size} color={theme.colors.primary} />} />}
            />
            <List.Item
              title="Cambios inusuales de ubicación"
              description="Detecta movimientos geográficos rápidos o inusuales"
              left={props => <List.Icon {...props} icon={({size, color}) => <Ionicons name="location-outline" size={size} color={theme.colors.primary} />} />}
            />
            <List.Item
              title="Intentos de desinstalación"
              description="Detecta intentos de desinstalar la aplicación de seguridad"
              left={props => <List.Icon {...props} icon={({size, color}) => <Ionicons name="trash-outline" size={size} color={theme.colors.primary} />} />}
            />
            <List.Item
              title="Cambios en la configuración"
              description="Detecta cambios sospechosos en la configuración del sistema"
              left={props => <List.Icon {...props} icon={({size, color}) => <Ionicons name="settings-outline" size={size} color={theme.colors.primary} />} />}
            />
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSaveSettings}
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveButton}
        >
          Guardar configuración
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor handled by theme
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: theme.colors.background, // Handled by SafeAreaView
  },
  loadingText: {
    marginTop: 10,
    // fontSize: 16, // Handled by PaperText variant
    // color: theme.colors.onSurfaceVariant, // Default
  },
  scrollView: {
    padding: 16, // Adjusted padding
    paddingBottom: 32, // Adjusted padding
  },
  header: {
    marginBottom: 24, // Adjusted margin
    alignItems: 'center',
  },
  title: {
    // Handled by PaperText variant="headlineMedium"
  },
  subtitle: {
    // Handled by PaperText variant="bodyLarge"
    marginTop: 4, // Adjusted margin
  },
  card: {
    marginBottom: 16, // Adjusted margin
    // elevation: 1, // Default for Card
  },
  // disabledCard opacity is handled by Paper.Card disabled prop
  // cardTitle is handled by Card.Title titleVariant prop
  settingDescription: { // For general descriptions in Card.Content
    marginBottom: 10,
    // color: theme.colors.onSurfaceVariant // Default for PaperText
  },
  settingDescriptionListItem: { // For List.Item descriptions
    // color: theme.colors.onSurfaceVariant // Default for List.Item
  },
  settingTitle: { // For List.Item titles
    // fontWeight: "600", // Default for List.Item title
    // color: theme.colors.onSurface // Default for List.Item title
  },
  sliderContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  sliderLabel: {
    // fontSize: 14, // Handled by PaperText variant
    // color: theme.colors.onSurfaceVariant, // Default
    marginBottom: 10,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -5,
  },
  sliderMinLabel: {
    // fontSize: 12, // Handled by PaperText variant
    // color: theme.colors.onSurfaceVariant, // Default
  },
  sliderMaxLabel: {
    // fontSize: 12, // Handled by PaperText variant
    // color: theme.colors.onSurfaceVariant, // Default
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8, // Or theme.roundness
    padding: 12,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    // fontSize: 14, // Handled by PaperText variant
    marginLeft: 10,
    lineHeight: 20,
  },
  // behaviorItem, behaviorInfo, behaviorTitle, behaviorDescription are replaced by List.Item
  saveButton: {
    // backgroundColor: theme.colors.primary, // Default for mode="contained"
    // paddingVertical: 12, // Handled by Paper.Button
    // paddingHorizontal: 24, // Handled by Paper.Button
    // borderRadius: theme.roundness, // Default for Paper.Button
    marginTop: 20,
  },
  // savingButton styling is handled by Button's loading prop
  // saveButtonText styling is handled by Button's labelStyle or default
  securityKeyContainer: {
    // backgroundColor: theme.colors.surfaceVariant, // Example
    padding: 15,
    borderRadius: 8, // Or theme.roundness
    marginTop: 10,
    alignItems: 'center', // Center text and button
  },
  securityKey: {
    // fontSize: 18, // Handled by PaperText variant
    fontWeight: "600", // Keep if desired
    // color: theme.colors.onSurfaceVariant, // Default
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 10, // Space for button
  },
  viewKeyButton: {
    marginTop: 10,
  },
  hideKeyButton: {
    marginTop: 10,
  },
  actionButton: {
    marginTop: 15,
    paddingVertical: 8, // Make button a bit larger
  },
  actionButtonText: {
    // color: theme.colors.onError or theme.colors.onPrimary // Default based on button color
    // fontSize: 16, // Default for Paper.Button label
    // fontWeight: "600", // Default for Paper.Button label
  },
});

export default SecurityScreen;
