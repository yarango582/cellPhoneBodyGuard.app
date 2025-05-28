import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { loginUser } from "../../services/authService";
import { styles } from "./styles/LoginScreenStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LoginScreenProps = {
  navigation: StackNavigationProp<any>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Prevenir que el usuario pueda salir de la app con el botón de retroceso si está bloqueada
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Verificar si el dispositivo está bloqueado
        AsyncStorage.getItem("device_blocked").then((isBlocked) => {
          if (isBlocked === "true") {
            // Si está bloqueado, no permitir salir de la app
            Alert.alert(
              "Dispositivo bloqueado",
              "No puedes salir de la aplicación mientras el dispositivo está bloqueado."
            );
            return true; // Prevenir la acción por defecto
          }
          return false; // Permitir la acción por defecto
        });
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  const handleLogin = async () => {
    // Validar campos
    if (!email.trim()) {
      setError("El correo electrónico es obligatorio");
      return;
    }

    if (!password) {
      setError("La contraseña es obligatoria");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await loginUser(email, password);
      
      // Verificar si el dispositivo está bloqueado
      if (result.isBlocked) {
        // Navegar a la pantalla de bloqueo
        navigation.reset({
          index: 0,
          routes: [{ name: "EnhancedLockScreen", params: { reason: result.blockReason } }],
        });
      } else {
        // La navegación se maneja automáticamente en AppNavigator para dispositivos no bloqueados
      }
    } catch (error: any) {
      let errorMessage = "Error al iniciar sesión";

      // Manejar errores específicos de Firebase
      if (error.code === "auth/user-not-found") {
        errorMessage = "No existe una cuenta con este correo electrónico";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Contraseña incorrecta";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Correo electrónico inválido";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Demasiados intentos fallidos. Intenta más tarde";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={80} color="#007AFF" />
            <Text style={styles.title}>SecureWipe</Text>
            <Text style={styles.subtitle}>
              Protección avanzada para tu dispositivo
            </Text>
          </View>

          <View style={styles.formContainer}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotPasswordText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerLink}>Regístrate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
