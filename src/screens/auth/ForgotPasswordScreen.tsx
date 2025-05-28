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
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { resetPassword } from "../../services/authService";
import { styles } from "./styles/ForgotPasswordScreenStyles";

type ForgotPasswordScreenProps = {
  navigation: StackNavigationProp<any>;
};

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigation,
}) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleResetPassword = async () => {
    // Validar campo de correo
    if (!email.trim()) {
      setError("El correo electrónico es obligatorio");
      return;
    }

    if (!validateEmail(email)) {
      setError("Introduce un correo electrónico válido");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await resetPassword(email);

      Alert.alert(
        "Correo enviado",
        "Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico.",
        [
          {
            text: "Volver al inicio de sesión",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (error: any) {
      let errorMessage = "Error al enviar correo de restablecimiento";

      // Manejar errores específicos de Firebase
      if (error.code === "auth/user-not-found") {
        errorMessage = "No existe una cuenta con este correo electrónico";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Correo electrónico inválido";
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            Introduce tu correo electrónico y te enviaremos un enlace para
            restablecer tu contraseña
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

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.resetButtonText}>Enviar correo</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.cancelButtonText}>
              Volver al inicio de sesión
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
