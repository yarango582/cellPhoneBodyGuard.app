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

// Servicios
import { getCurrentUser } from "../services/authService";
import { isDeviceBlockedLocally } from "../services/securityService";

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
  Lock: undefined;
  Unlock: undefined;
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
    // Verificar estado de autenticación y bloqueo
    const checkAuthAndBlockStatus = async () => {
      try {
        // Verificar si hay un usuario autenticado
        const user = getCurrentUser();
        setIsAuthenticated(!!user);

        // Verificar si el dispositivo está bloqueado
        const blocked = await isDeviceBlockedLocally();
        setIsBlocked(blocked);
      } catch (error) {
        console.error("Error al verificar estado:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndBlockStatus();
  }, []);

  if (isLoading) {
    // Aquí podrías mostrar una pantalla de carga
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isBlocked ? (
          // Si el dispositivo está bloqueado, mostrar pantalla de desbloqueo
          <RootStack.Screen name="Unlock" component={UnlockScreen} />
        ) : isAuthenticated ? (
          // Si está autenticado y no bloqueado, mostrar pantalla principal
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          // Si no está autenticado, mostrar pantallas de autenticación
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
        {/* Pantalla de bloqueo que se puede mostrar en cualquier momento */}
        <RootStack.Screen
          name="Lock"
          component={LockScreen}
          options={{ gestureEnabled: false }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
