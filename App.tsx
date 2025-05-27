import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import AppNavigator from "./src/navigation/AppNavigator";
import { registerBackgroundTask } from "./src/services/securityService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mantener la pantalla de splash visible mientras cargamos recursos
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Efecto para inicializar Firebase Auth después de que la app esté lista
  useEffect(() => {
    let unsubscribe: any;

    const initializeAuth = async () => {
      try {
        // Importar dinámicamente para evitar problemas de inicialización
        const { auth } = await import("./src/config/firebase");
        const { onAuthStateChanged } = await import("firebase/auth");

        // Pequeña demora para asegurar que Firebase esté completamente inicializado
        await new Promise((resolve) => setTimeout(resolve, 200));

        unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log(
            "Estado de autenticación cambiado:",
            user ? "Usuario autenticado" : "No autenticado"
          );
          setAuthInitialized(true);
        });
      } catch (error) {
        console.error("Error al inicializar autenticación:", error);
        // Continuar de todos modos para no bloquear la app
        setAuthInitialized(true);
      }
    };

    // Solo inicializar auth después de que otros recursos estén listos
    if (isReady) {
      initializeAuth();
    }

    // Limpiar suscripción al desmontar
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isReady]);

  useEffect(() => {
    // Función para cargar recursos iniciales
    async function prepare() {
      try {
        console.log("Iniciando preparación de la aplicación...");

        // Cargar fuentes y otros recursos
        await Font.loadAsync({
          ...Ionicons.font,
        });

        // Inicializar tareas en segundo plano para monitoreo de seguridad
        try {
          const securityEnabled = await AsyncStorage.getItem(
            "security_settings"
          );
          if (securityEnabled && JSON.parse(securityEnabled).enabled) {
            await registerBackgroundTask();
          }
        } catch (securityError) {
          console.warn("Error al configurar seguridad:", securityError);
        }

        // Simular un tiempo de carga para mostrar la pantalla de splash
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("Preparación completada");
      } catch (e) {
        console.warn("Error al preparar la aplicación:", e);
      } finally {
        // Indicar que la aplicación está lista para renderizar
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    // Ocultar la pantalla de splash cuando todo esté listo
    if (isReady && authInitialized) {
      console.log("Ocultando splash screen...");
      SplashScreen.hideAsync();
      setInitializing(false);
    }
  }, [isReady, authInitialized]);

  if (!isReady || initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando SecureWipe...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={MD3LightTheme}>
        <StatusBar style="auto" />
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});
