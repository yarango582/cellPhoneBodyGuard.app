import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  BackHandler,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { unblockDevice } from "../../services/securityService";
import { formatSecurityKey, cleanSecurityKey } from "../../utils/securityUtils";
import { verifySecurityKey } from "../../services/authService";

const UnlockScreen: React.FC = () => {
  const navigation = useNavigation();
  const [securityKey, setSecurityKey] = useState("");
  const [formattedKey, setFormattedKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // Impedir que el usuario pueda volver atrás
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    return () => backHandler.remove();
  }, []);

  // Formatear la clave mientras el usuario la escribe
  useEffect(() => {
    const cleaned = cleanSecurityKey(securityKey);
    setFormattedKey(formatSecurityKey(cleaned));
  }, [securityKey]);

  const handleKeyChange = (text: string) => {
    // Eliminar caracteres no numéricos
    const cleaned = cleanSecurityKey(text);

    // Limitar a 20 dígitos
    if (cleaned.length <= 20) {
      setSecurityKey(cleaned);
    }
  };

  const handleUnlock = async () => {
    // Validar longitud de la clave
    const cleaned = cleanSecurityKey(securityKey);
    if (cleaned.length !== 20) {
      setError("La clave de seguridad debe tener 20 dígitos");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const isValid = await verifySecurityKey(cleaned);

      if (isValid) {
        // Desbloquear el dispositivo
        await unblockDevice();

        Alert.alert(
          "Dispositivo desbloqueado",
          "Tu dispositivo ha sido desbloqueado correctamente.",
          [
            {
              text: "Continuar",
              onPress: () => {
                // Resetear la navegación para volver a la pantalla principal
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: "Main" }],
                  })
                );
              },
            },
          ]
        );
      } else {
        // Incrementar contador de intentos
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 5) {
          setError(
            "Demasiados intentos fallidos. Por favor, intenta más tarde o contacta con soporte."
          );
        } else {
          setError(
            "Clave de seguridad incorrecta. Por favor, verifica e intenta de nuevo."
          );
        }
      }
    } catch (error) {
      console.error("Error al verificar clave:", error);
      setError(
        "Error al verificar la clave de seguridad. Por favor, intenta de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotKey = () => {
    Alert.alert(
      "Recuperar clave de seguridad",
      "Tu clave de seguridad fue enviada a tu correo electrónico cuando te registraste. Si no puedes encontrarla, contacta con soporte para recibir ayuda.",
      [{ text: "Entendido" }]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="key" size={80} color="#007AFF" />
          </View>

          <Text style={styles.title}>Desbloquear dispositivo</Text>

          <Text style={styles.instructions}>
            Introduce tu clave de seguridad de 20 dígitos para desbloquear el
            dispositivo. Esta clave fue enviada a tu correo electrónico cuando
            te registraste.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formattedKey}
              onChangeText={handleKeyChange}
              placeholder="0000 0000 0000 0000 0000"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={24} // 20 dígitos + 4 espacios
              autoFocus={true}
            />
          </View>

          <TouchableOpacity
            style={[styles.unlockButton, isLoading && styles.disabledButton]}
            onPress={handleUnlock}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.unlockButtonText}>Desbloquear</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={handleForgotKey}
          >
            <Text style={styles.forgotButtonText}>
              ¿Olvidaste tu clave de seguridad?
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            SecureWipe - Protocolo de seguridad activo
          </Text>
          <Text style={styles.attemptsText}>
            {attempts > 0 ? `Intentos fallidos: ${attempts}/5` : ""}
          </Text>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  instructions: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 24,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#1c1c1e",
    color: "#fff",
    fontSize: 20,
    padding: 15,
    borderRadius: 10,
    textAlign: "center",
    letterSpacing: 2,
  },
  unlockButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#0a5dc2",
  },
  unlockButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  forgotButton: {
    padding: 10,
  },
  forgotButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
  attemptsText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 5,
  },
});

export default UnlockScreen;
