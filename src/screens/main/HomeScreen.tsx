import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../../config/firebase";
import { getCurrentUser } from "../../services/authService";
import {
  getSecuritySettings,
  blockDevice,
} from "../../services/securityService";
import { formatSecurityKey } from "../../utils/securityUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "./styles/HomeScreenStyles";

const SECURITY_KEY = "security_key";

const HomeScreen: React.FC = () => {
  const [userName, setUserName] = useState("");
  const [securityKey, setSecurityKey] = useState("");
  const [securityEnabled, setSecurityEnabled] = useState(false);
  const [lastCheck, setLastCheck] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
    loadSecuritySettings();
  }, []);

  const loadUserData = async () => {
    try {
      const user = getCurrentUser();
      if (user) {
        // Obtener datos del usuario desde Firestore
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Usar el correo como nombre de usuario (puedes cambiar esto si tienes un campo de nombre)
          setUserName(user.email?.split("@")[0] || "Usuario");
        }

        // Obtener clave de seguridad almacenada localmente
        const storedKey = await AsyncStorage.getItem(SECURITY_KEY);
        if (storedKey) {
          setSecurityKey(storedKey);
        }
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
    }
  };

  const loadSecuritySettings = async () => {
    try {
      const settings = await getSecuritySettings();
      setSecurityEnabled(settings.enabled);
      setLastCheck(settings.lastChecked);
    } catch (error) {
      console.error("Error al cargar configuración de seguridad:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserData();
      await loadSecuritySettings();
    } finally {
      setRefreshing(false);
    }
  };

  const handleTestLock = () => {
    Alert.alert(
      "Probar bloqueo",
      "¿Estás seguro de que quieres probar el bloqueo del dispositivo? Necesitarás tu clave de seguridad para desbloquearlo.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Probar",
          onPress: async () => {
            try {
              await blockDevice("test");
              // La navegación a la pantalla de bloqueo se manejará automáticamente
            } catch (error) {
              console.error("Error al bloquear dispositivo:", error);
              Alert.alert("Error", "No se pudo bloquear el dispositivo");
            }
          },
        },
      ]
    );
  };

  const handleShowSecurityKey = () => {
    Alert.alert(
      "Tu clave de seguridad",
      `Esta es tu clave de seguridad de 20 dígitos. Guárdala en un lugar seguro, la necesitarás para desbloquear tu dispositivo en caso de emergencia.\n\n${formatSecurityKey(
        securityKey
      )}`,
      [{ text: "Entendido" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, {userName}</Text>
          <Text style={styles.subtitle}>
            {securityEnabled
              ? "Tu dispositivo está protegido"
              : "Tu dispositivo no está protegido"}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={securityEnabled ? "shield-checkmark" : "shield-outline"}
              size={24}
              color={securityEnabled ? "#4CAF50" : "#FF9800"}
            />
            <Text
              style={[
                styles.statusTitle,
                { color: securityEnabled ? "#4CAF50" : "#FF9800" },
              ]}
            >
              {securityEnabled ? "Protección activa" : "Protección inactiva"}
            </Text>
          </View>

          <Text style={styles.statusDescription}>
            {securityEnabled
              ? "Tu dispositivo está siendo monitoreado para detectar actividades sospechosas."
              : "Activa la protección en la sección de Seguridad para proteger tu dispositivo."}
          </Text>

          {securityEnabled && (
            <Text style={styles.lastCheck}>
              Última verificación: {new Date(lastCheck).toLocaleString()}
            </Text>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShowSecurityKey}
          >
            <Ionicons name="key-outline" size={24} color="#007AFF" />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Ver clave de seguridad</Text>
              <Text style={styles.actionDescription}>
                Muestra tu clave de 20 dígitos para desbloquear el dispositivo
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTestLock}
          >
            <Ionicons name="lock-closed-outline" size={24} color="#007AFF" />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Probar bloqueo</Text>
              <Text style={styles.actionDescription}>
                Simula el bloqueo del dispositivo para probar la funcionalidad
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Información importante</Text>

          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#007AFF"
            />
            <Text style={styles.infoText}>
              En caso de pérdida o robo, podrás bloquear tu dispositivo desde la
              interfaz web o configurar comportamientos que activen el bloqueo
              automáticamente.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="warning-outline" size={24} color="#FF9800" />
            <Text style={styles.infoText}>
              Guarda tu clave de seguridad en un lugar seguro. La necesitarás
              para desbloquear tu dispositivo en caso de activación del
              protocolo de seguridad.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
