import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getCurrentUser, logoutUser } from "../../services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { styles } from "./styles/SettingsScreenStyles";

const SettingsScreen: React.FC = () => {
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    loadUserData();
    loadSettings();
  }, []);

  const loadUserData = () => {
    const user = getCurrentUser();
    if (user) {
      setUserEmail(user.email || "");
    }
  };

  const loadSettings = async () => {
    try {
      const notificationsValue = await AsyncStorage.getItem(
        "notifications_enabled"
      );
      setNotificationsEnabled(notificationsValue !== "false");

      const biometricValue = await AsyncStorage.getItem("biometric_enabled");
      setBiometricEnabled(biometricValue === "true");
    } catch (error) {
      console.error("Error al cargar ajustes:", error);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    try {
      setNotificationsEnabled(value);
      await AsyncStorage.setItem(
        "notifications_enabled",
        value ? "true" : "false"
      );
    } catch (error) {
      console.error("Error al guardar configuración de notificaciones:", error);
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    try {
      setBiometricEnabled(value);
      await AsyncStorage.setItem("biometric_enabled", value ? "true" : "false");
    } catch (error) {
      console.error("Error al guardar configuración biométrica:", error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          onPress: async () => {
            setIsLoading(true);
            try {
              await logoutUser();
              // La navegación se manejará automáticamente en AppNavigator
            } catch (error) {
              console.error("Error al cerrar sesión:", error);
              Alert.alert("Error", "No se pudo cerrar sesión");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar cuenta",
      "Esta acción eliminará permanentemente tu cuenta y todos tus datos. Esta acción no se puede deshacer. ¿Estás seguro?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar cuenta",
          style: "destructive",
          onPress: () => {
            // Implementar lógica para eliminar cuenta
            Alert.alert(
              "Función no disponible",
              "Esta función no está disponible en la versión actual."
            );
          },
        },
      ]
    );
  };

  const handleOpenWebPanel = () => {
    // Abrir el panel web administrativo
    Linking.openURL("https://securewipe-app.web.app");
  };

  const handleContactSupport = () => {
    // Enviar correo al soporte
    Linking.openURL(
      "mailto:support@securewipe-app.com?subject=Soporte%20SecureWipe"
    );
  };

  const handleOpenPrivacyPolicy = () => {
    // Abrir política de privacidad
    Linking.openURL("https://securewipe-app.web.app/privacy");
  };

  const handleOpenTerms = () => {
    // Abrir términos de servicio
    Linking.openURL("https://securewipe-app.web.app/terms");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Ajustes</Text>
          <Text style={styles.subtitle}>
            Gestiona tu cuenta y configuración
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cuenta</Text>

          <View style={styles.profileInfo}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={30} color="#fff" />
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileEmail}>{userEmail}</Text>
              <Text style={styles.profileStatus}>Cuenta activa</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleOpenWebPanel}
          >
            <Ionicons name="globe-outline" size={24} color="#007AFF" />
            <Text style={styles.settingButtonText}>
              Panel web administrativo
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleLogout}
            disabled={isLoading}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            {isLoading ? (
              <ActivityIndicator color="#FF3B30" style={{ marginLeft: 10 }} />
            ) : (
              <Text style={[styles.settingButtonText, { color: "#FF3B30" }]}>
                Cerrar sesión
              </Text>
            )}
            <View style={{ width: 20 }} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notificaciones</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Notificaciones push</Text>
              <Text style={styles.settingDescription}>
                Recibir alertas sobre actividades sospechosas
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: "#D1D1D6", true: "#4CAF50" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seguridad</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Autenticación biométrica</Text>
              <Text style={styles.settingDescription}>
                Usar huella digital o reconocimiento facial para autenticación
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: "#D1D1D6", true: "#4CAF50" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Soporte</Text>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleContactSupport}
          >
            <Ionicons name="mail-outline" size={24} color="#007AFF" />
            <Text style={styles.settingButtonText}>Contactar soporte</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleOpenPrivacyPolicy}
          >
            <Ionicons name="shield-outline" size={24} color="#007AFF" />
            <Text style={styles.settingButtonText}>Política de privacidad</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleOpenTerms}
          >
            <Ionicons name="document-text-outline" size={24} color="#007AFF" />
            <Text style={styles.settingButtonText}>Términos de servicio</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información de la aplicación</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versión</Text>
            <Text style={styles.infoValue}>
              {Application.nativeApplicationVersion || "1.0.0"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>
              {Application.nativeBuildVersion || "1"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteAccountText}>Eliminar cuenta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
