import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "react-native-paper";

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
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
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
  const theme = useTheme(); // Access theme

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
        tabBarActiveTintColor: theme.colors.primary, // Use theme color
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant, // Use theme color
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

    // Check device block status
    const checkDeviceBlockStatus = async () => {
      try {
        const blocked = await isDeviceBlockedLocally();
        setIsBlocked(blocked);
      } catch (error) {
        console.error("Error checking device block status:", error);
        // Optionally set some error state here to inform the user
      } finally {
        // This ensures loading is false after both initial auth state is processed
        // (onAuthStateChanged fires immediately) and block status is checked.
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
