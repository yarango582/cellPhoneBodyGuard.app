import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  Alert,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useNavigation,
  CommonActions,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";

// Importar servicios de seguridad mejorados
import {
  isDeviceBlocked,
  unlockDeviceWithKey,
  incrementFailedAttempts,
  getFailedAttempts,
  logSecurityEvent,
  SecurityEventType,
} from "../../services/deviceSecurityService";

// Utilidades
import { formatSecurityKey, cleanSecurityKey } from "../../utils/securityUtils";

const { width, height } = Dimensions.get("window");

type EnhancedLockScreenProps = {
  route: {
    params?: {
      reason?: string;
    };
  };
};

const EnhancedLockScreen: React.FC<EnhancedLockScreenProps> = ({ route }) => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const lockReason = route.params?.reason || "security_protocol";

  const [securityKey, setSecurityKey] = useState("");
  const [formattedKey, setFormattedKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showInput, setShowInput] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const lockIconAnim = useRef(new Animated.Value(1)).current;

  // Cargar intentos fallidos
  useEffect(() => {
    const loadFailedAttempts = async () => {
      const failedAttempts = await getFailedAttempts();
      setAttempts(failedAttempts);
    };

    loadFailedAttempts();

    // Animación de entrada
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(lockIconAnim, {
            toValue: 1.1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(lockIconAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  // Prevenir navegación hacia atrás
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Alertar al usuario que no puede salir
        Alert.alert(
          "Dispositivo bloqueado",
          "No puedes salir de esta pantalla mientras el dispositivo está bloqueado.",
          [{ text: "Entendido" }]
        );
        return true; // Prevenir acción por defecto
      };

      // Agregar el event listener y guardar la función de limpieza
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      // Devolver la función de limpieza que usa el método remove()
      return () => backHandler.remove();
    }, [])
  );

  // Formatear la clave mientras el usuario la escribe
  useEffect(() => {
    const cleaned = cleanSecurityKey(securityKey);
    setFormattedKey(formatSecurityKey(cleaned));
  }, [securityKey]);

  // Animación de error
  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Manejar cambio en la clave
  const handleKeyChange = (text: string) => {
    // Limpiar y limitar a 20 dígitos
    const cleaned = cleanSecurityKey(text);
    if (cleaned.length <= 20) {
      setSecurityKey(cleaned);
    }
  };

  // Desbloquear dispositivo
  const handleUnlock = async () => {
    Keyboard.dismiss();

    // Validar longitud
    const cleaned = cleanSecurityKey(securityKey);
    if (cleaned.length !== 20) {
      setError("La clave de seguridad debe tener 20 dígitos");
      shakeError();
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Intentar desbloquear
      const unlocked = await unlockDeviceWithKey(cleaned);

      if (unlocked) {
        // Animación exitosa
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          // Navegar al inicio
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Main" }],
            })
          );
        });
      } else {
        // Incrementar intentos (ya lo hace unlockDeviceWithKey)
        const failedAttempts = await getFailedAttempts();
        setAttempts(failedAttempts);

        setError(
          failedAttempts >= 5
            ? "Demasiados intentos fallidos. Contacta con soporte."
            : "Clave de seguridad incorrecta. Inténtalo de nuevo."
        );

        shakeError();
      }
    } catch (error) {
      console.error("Error al desbloquear:", error);
      setError("Error al procesar la solicitud. Inténtalo de nuevo.");
      shakeError();
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener texto de razón del bloqueo
  const getLockReasonText = (): string => {
    switch (lockReason) {
      case "suspicious_activity":
        return "Se ha detectado actividad sospechosa en tu dispositivo.";
      case "remote_lock":
        return "Tu dispositivo ha sido bloqueado remotamente.";
      case "too_many_failed_attempts":
        return "Demasiados intentos fallidos de desbloqueo.";
      case "test":
        return "Esto es una prueba del sistema de bloqueo.";
      default:
        return "El protocolo de seguridad ha sido activado.";
    }
  };

  // Mostrar entrada de clave
  const handleShowInput = () => {
    setShowInput(true);

    // Animar transición
    Animated.timing(fadeAnim, {
      toValue: 0.5,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  // Llamada de emergencia
  const handleEmergencyCall = () => {
    Alert.alert(
      "Llamada de emergencia",
      "En un dispositivo real, esta opción permitiría realizar llamadas de emergencia incluso con el dispositivo bloqueado.",
      [{ text: "Entendido" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateX: shakeAnim }],
          },
        ]}
      >
        {!showInput ? (
          // Pantalla de bloqueo principal
          <>
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: lockIconAnim }] },
              ]}
            >
              <Ionicons name="lock-closed" size={100} color="#FF3B30" />
            </Animated.View>

            <Text style={styles.title}>Dispositivo bloqueado</Text>

            <Text style={styles.message}>{getLockReasonText()}</Text>

            <Text style={styles.instructions}>
              Para desbloquear el dispositivo, necesitarás introducir tu clave
              de seguridad de 20 dígitos que recibiste por correo electrónico al
              registrarte.
            </Text>

            <TouchableOpacity
              style={styles.unlockButton}
              onPress={handleShowInput}
            >
              <Text style={styles.unlockButtonText}>
                Introducir clave de seguridad
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={handleEmergencyCall}
            >
              <Text style={styles.emergencyButtonText}>
                Llamada de emergencia
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // Pantalla de entrada de clave
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardContainer}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="key"
                  size={60}
                  color="#FF3B30"
                  style={styles.keyIcon}
                />

                <Text style={styles.inputTitle}>
                  Introduce tu clave de seguridad
                </Text>

                <Text style={styles.inputInstructions}>
                  Introduce la clave de 20 dígitos que recibiste por correo
                  electrónico.
                </Text>

                <TextInput
                  style={styles.securityKeyInput}
                  value={formattedKey}
                  onChangeText={handleKeyChange}
                  placeholder="XXXX XXXX XXXX XXXX XXXX"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  autoFocus={true}
                  maxLength={24} // 20 dígitos + 4 espacios
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {attempts > 0 && (
                  <Text style={[styles.attemptsText, { color: attempts >= 3 ? "#FF3B30" : "#aaa" }]}>
                    Intentos fallidos: {attempts}/5
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleUnlock}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Desbloquear</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setShowInput(false)}
                  disabled={isLoading}
                >
                  <Text style={styles.backButtonText}>Volver</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        )}
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Cell Phone Bodyguard - Protocolo de seguridad activo
        </Text>
      </View>
    </SafeAreaView>
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
  message: {
    fontSize: 18,
    color: "#FF3B30",
    marginBottom: 30,
    textAlign: "center",
    fontWeight: "500",
  },
  instructions: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 40,
    textAlign: "center",
    lineHeight: 24,
  },
  unlockButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
  },
  unlockButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emergencyButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#555",
  },
  emergencyButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#555",
    fontSize: 12,
  },
  // Estilos para pantalla de entrada
  keyboardContainer: {
    width: "100%",
    flex: 1,
  },
  inputContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  keyIcon: {
    marginBottom: 20,
  },
  inputTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
  },
  inputInstructions: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 30,
    textAlign: "center",
  },
  securityKeyInput: {
    backgroundColor: "#222",
    color: "#fff",
    fontSize: 22,
    padding: 15,
    borderRadius: 8,
    width: "100%",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 20,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
  },
  attemptsText: {
    fontSize: 14,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
  },
  backButtonText: {
    color: "#aaa",
    fontSize: 16,
  },
});

export default EnhancedLockScreen;
