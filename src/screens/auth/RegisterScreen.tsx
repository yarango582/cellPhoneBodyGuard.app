import React, { useState } from "react";
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
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { registerUser } from "../../services/authService";
import { styles } from "./styles/RegisterScreenStyles";

type RegisterScreenProps = {
  navigation: StackNavigationProp<any>;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleRegister = async () => {
    // Validar campos
    if (!email.trim()) {
      setError("El correo electrónico es obligatorio");
      return;
    }

    if (!validateEmail(email)) {
      setError("Introduce un correo electrónico válido");
      return;
    }

    if (!password) {
      setError("La contraseña es obligatoria");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await registerUser(email, password);

      Alert.alert(
        "Registro exitoso",
        "Se ha enviado una clave de seguridad de 20 dígitos a tu correo electrónico. Guárdala en un lugar seguro, la necesitarás para desbloquear tu dispositivo en caso de emergencia.",
        [{ text: "Entendido" }]
      );

      // La navegación se maneja automáticamente en AppNavigator
    } catch (error: any) {
      let errorMessage = "Error al registrar usuario";

      // Manejar errores específicos de Firebase
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Ya existe una cuenta con este correo electrónico";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Correo electrónico inválido";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "La contraseña es demasiado débil";
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>
              Regístrate para proteger tu dispositivo
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

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.securityKeyInfo}>
              Al registrarte, recibirás una clave de seguridad de 20 dígitos en
              tu correo electrónico. Esta clave será necesaria para desbloquear
              tu dispositivo en caso de activación del protocolo de seguridad.
            </Text>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Registrarse</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
