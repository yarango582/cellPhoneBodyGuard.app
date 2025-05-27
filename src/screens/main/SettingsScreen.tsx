import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  View // Keep View for simple layout containers if needed
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; // Keep Ionicons
import {
  Card,
  List,
  Avatar,
  Switch as PaperSwitch,
  Button,
  Text as PaperText,
  useTheme,
  Divider,
  ActivityIndicator as PaperActivityIndicator
} from "react-native-paper";
import { getCurrentUser, logoutUser } from "../../services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <PaperText variant="headlineMedium" style={styles.title}>Ajustes</PaperText>
          <PaperText variant="bodyLarge" style={styles.subtitle}>
            Gestiona tu cuenta y configuración
          </PaperText>
        </View>

        <Card style={styles.card}>
          <Card.Title title="Cuenta" titleVariant="titleLarge" />
          <Card.Content>
            <List.Item
              title={userEmail}
              description="Cuenta activa"
              titleStyle={styles.profileEmail}
              descriptionStyle={styles.profileStatus}
              left={props => <Avatar.Icon {...props} icon="person" style={{ backgroundColor: theme.colors.primary }} />}
            />
            <Divider />
            <List.Item
              title="Panel web administrativo"
              left={props => <List.Icon {...props} icon={({ size, color }) => <Ionicons name="globe-outline" size={size} color={theme.colors.primary} />} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleOpenWebPanel}
            />
            <Divider />
            <List.Item
              title="Cerrar sesión"
              titleStyle={{ color: theme.colors.error }}
              left={props => <List.Icon {...props} icon={({ size }) => <Ionicons name="log-out-outline" size={size} color={theme.colors.error} />} />}
              onPress={handleLogout}
              disabled={isLoading}
              right={() => isLoading ? <PaperActivityIndicator animating={true} color={theme.colors.error} style={styles.logoutLoader} /> : <View style={{ width: 20 }} />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Notificaciones" titleVariant="titleLarge" />
          <Card.Content>
            <List.Item
              title="Notificaciones push"
              description="Recibir alertas sobre actividades sospechosas"
              right={() => (
                <PaperSwitch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                />
              )}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Seguridad" titleVariant="titleLarge" />
          <Card.Content>
            <List.Item
              title="Autenticación biométrica"
              description="Usar huella digital o reconocimiento facial para autenticación"
              right={() => (
                <PaperSwitch
                  value={biometricEnabled}
                  onValueChange={handleToggleBiometric}
                />
              )}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Soporte" titleVariant="titleLarge" />
          <Card.Content>
            <List.Item
              title="Contactar soporte"
              left={props => <List.Icon {...props} icon={({ size, color }) => <Ionicons name="mail-outline" size={size} color={theme.colors.primary} />} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleContactSupport}
            />
            <Divider />
            <List.Item
              title="Política de privacidad"
              left={props => <List.Icon {...props} icon={({ size, color }) => <Ionicons name="shield-outline" size={size} color={theme.colors.primary} />} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleOpenPrivacyPolicy}
            />
            <Divider />
            <List.Item
              title="Términos de servicio"
              left={props => <List.Icon {...props} icon={({ size, color }) => <Ionicons name="document-text-outline" size={size} color={theme.colors.primary} />} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleOpenTerms}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Información de la aplicación" titleVariant="titleLarge" />
          <Card.Content>
            <List.Item
              title="Versión"
              right={() => <PaperText variant="bodyMedium">{Application.nativeApplicationVersion || "1.0.0"}</PaperText>}
            />
            <Divider />
            <List.Item
              title="Build"
              right={() => <PaperText variant="bodyMedium">{Application.nativeBuildVersion || "1"}</PaperText>}
            />
          </Card.Content>
        </Card>

        <Button
          mode="text"
          onPress={handleDeleteAccount}
          textColor={theme.colors.error}
          style={styles.deleteAccountButton}
        >
          Eliminar cuenta
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
    // color: theme.colors.onBackground // Default
  },
  subtitle: {
    // Handled by PaperText variant="bodyLarge"
    // color: theme.colors.onSurfaceVariant // Default
    marginTop: 4, // Adjusted margin
  },
  card: {
    // backgroundColor: theme.colors.surface, // Default for Card
    // borderRadius: theme.roundness, // Default for Card
    // elevation: 1, // Default for Card, or adjust as needed
    marginBottom: 16, // Adjusted margin
  },
  // cardTitle is handled by Card.Title titleVariant prop
  profileEmail: {
    // fontSize: 16, // Handled by List.Item titleStyle or PaperText variant
    fontWeight: "600", // Keep if desired
    // color: theme.colors.onSurface // Default
  },
  profileStatus: {
    // fontSize: 14, // Handled by List.Item descriptionStyle or PaperText variant
    // color: theme.colors.primary // Example if you want to use primary color
  },
  logoutLoader: {
    marginRight: 8, // Adjust as needed
  },
  // settingButton, settingButtonText, settingRow, settingInfo, settingTitle, settingDescription are replaced by List.Item props and styles
  // infoRow, infoLabel, infoValue are replaced by List.Item
  deleteAccountButton: {
    // alignItems and padding handled by Paper.Button
    marginTop: 16, // Adjusted margin
  },
  // deleteAccountText is handled by Paper.Button textColor prop
});

export default SettingsScreen;
