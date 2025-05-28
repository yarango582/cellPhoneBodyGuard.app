import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Pantallas de autenticación
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

// Pantallas principales
import HomeScreen from "../screens/main/HomeScreen";
import SettingsScreen from "../screens/main/SettingsScreen";
import SecurityScreen from "../screens/main/SecurityScreen";

// Pantallas de seguridad
import LockScreen from "../screens/security/LockScreen";
import UnlockScreen from "../screens/security/UnlockScreen";
import EnhancedLockScreen from "../screens/security/EnhancedLockScreen";
import LockConfirmScreen from "../screens/security/LockConfirmScreen";
import SecurityMonitorScreen from "../screens/security/SecurityMonitorScreen";

// Servicios
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { isDeviceBlocked } from "../services/deviceSecurityService";
const DEVICE_BLOCKED_KEY = "device_blocked";

// Tipos de navegación
type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

type MainTabParamList = {
  Home: undefined;
  Security: undefined;
  Settings: undefined;
};

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Lock: { reason?: string };
  Unlock: undefined;
  EnhancedLockScreen: { reason?: string };
  UnlockScreen: undefined;
  LockConfirm: undefined;
  SecurityMonitor: undefined;
};

// Navegadores
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

// Navegador de autenticación
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
    </AuthStack.Navigator>
  );
};

// Navegador principal con tabs
const MainNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Security") {
            iconName = focused ? "shield" : "shield-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          } else {
            iconName = "help-circle";
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        headerShown: true,
      })}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Inicio" }}
      />
      <MainTab.Screen
        name="Security"
        component={SecurityScreen}
        options={{ title: "Seguridad" }}
      />
      <MainTab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Ajustes" }}
      />
    </MainTab.Navigator>
  );
};

// Navegador raíz
const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    setIsLoading(true); // Indicate loading when the effect runs

    // Subscribe to auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      // setLoading will be handled after block status is also checked
    });

    // Check device block status - verificar tanto en Firebase como localmente
    const checkDeviceBlockStatus = async () => {
      try {
        // Primero verificamos el valor almacenado localmente (más rápido)
        const localBlockStatus = await AsyncStorage.getItem(DEVICE_BLOCKED_KEY);
        
        if (localBlockStatus === "true") {
          setIsBlocked(true);
        } else {
          // Si no está bloqueado localmente, verificamos en Firebase
          const firebaseBlockStatus = await isDeviceBlocked();
          setIsBlocked(firebaseBlockStatus);
          
          // Actualizar el estado local para que coincida con Firebase
          await AsyncStorage.setItem(DEVICE_BLOCKED_KEY, firebaseBlockStatus ? "true" : "false");
        }
      } catch (error) {
        console.error("Error checking device block status:", error);
        // Por seguridad, si hay un error, asumimos que está bloqueado
        setIsBlocked(true);
      } finally {
        // Esto asegura que loading sea false después de que se procese el estado de autenticación inicial
        // (onAuthStateChanged se dispara inmediatamente) y se verifique el estado de bloqueo.
        setIsLoading(false);
      }
    };

    checkDeviceBlockStatus();

    // Cleanup subscription on unmount
    return () => {
      unsubscribeAuth();
    };
  }, []);

  if (isLoading) {
    // Aquí podrías mostrar una pantalla de carga
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isBlocked ? (
          // Si el dispositivo está bloqueado, mostrar pantalla de desbloqueo mejorada
          <RootStack.Screen 
            name="EnhancedLockScreen" 
            component={EnhancedLockScreen}
            options={{ gestureEnabled: false, headerShown: false }}
          />
        ) : isAuthenticated ? (
          // Si está autenticado y no bloqueado, mostrar pantalla principal
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          // Si no está autenticado, mostrar pantallas de autenticación
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}

        {/* Pantallas de seguridad */}
        <RootStack.Screen
          name="Lock"
          component={LockScreen}
          options={{ gestureEnabled: false, headerShown: false }}
        />
        <RootStack.Screen
          name="Unlock"
          component={UnlockScreen}
          options={{ gestureEnabled: false, headerShown: false }}
        />
        <RootStack.Screen
          name="EnhancedLockScreen"
          component={EnhancedLockScreen}
          options={{ gestureEnabled: false, headerShown: false }}
        />
        <RootStack.Screen
          name="LockConfirm"
          component={LockConfirmScreen}
          options={{
            title: "Confirmar Bloqueo",
            headerStyle: { backgroundColor: "#f8f8f8" },
            headerTintColor: "#333",
          }}
        />
        <RootStack.Screen
          name="SecurityMonitor"
          component={SecurityMonitorScreen}
          options={{
            title: "Monitor de Seguridad",
            headerStyle: { backgroundColor: "#f8f8f8" },
            headerTintColor: "#333",
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
