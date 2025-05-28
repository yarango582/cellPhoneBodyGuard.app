import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  BackHandler,
  Keyboard,
  TouchableWithoutFeedback,
  Vibration,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import {
  unblockDevice,
  unblockDeviceWithKey,
  getFailedAttempts,
} from "../../services/securityService";
import { formatSecurityKey, cleanSecurityKey } from "../../utils/securityUtils";
import { verifySecurityKey } from "../../services/authService";
import { styles } from "./styles/UnlockScreenStyles";

const { width } = Dimensions.get("window");

const UnlockScreen: React.FC = () => {
  const navigation = useNavigation();
  const [securityKey, setSecurityKey] = useState("");
  const [formattedKey, setFormattedKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  // Animaciones
  const shakeAnimation = new Animated.Value(0);
  const warningOpacity = new Animated.Value(0);
  const keyIconSize = new Animated.Value(80);

  // Cargar el número de intentos fallidos al iniciar
  useEffect(() => {
    const loadFailedAttempts = async () => {
      const failedAttempts = await getFailedAttempts();
      setAttempts(failedAttempts);

      // Mostrar advertencia si ya hay intentos fallidos
      if (failedAttempts > 0) {
        setShowWarning(true);
        fadeInWarning();
      }
    };

    loadFailedAttempts();
  }, []);

  useEffect(() => {
    // Impedir que el usuario pueda volver atrás
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    // Pulsar el botón de volumen, encendido, etc. no debe permitirse
    // Nota: Esto es solo una simulación, en una app real necesitarías
    // permisos especiales y APIs nativas para bloquear completamente el dispositivo

    return () => backHandler.remove();
  }, []);

  // Formatear la clave mientras el usuario la escribe
  useEffect(() => {
    const cleaned = cleanSecurityKey(securityKey);
    setFormattedKey(formatSecurityKey(cleaned));
  }, [securityKey]);

  // Animar el icono de la llave al iniciar
  useEffect(() => {
    Animated.sequence([
      Animated.timing(keyIconSize, {
        toValue: 100,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(keyIconSize, {
        toValue: 80,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  // Función para animar la sacudida cuando hay un error
  const shakeError = () => {
    Vibration.vibrate([0, 50, 30, 50]);
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Función para mostrar la advertencia con animación
  const fadeInWarning = () => {
    Animated.timing(warningOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

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
      shakeError();
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Usar la nueva función mejorada para desbloquear con clave
      const isValid = await unblockDeviceWithKey(cleaned);

      if (isValid) {
        // Desbloquear exitoso
        Vibration.vibrate([0, 70, 50, 100]);

        Alert.alert(
          "Dispositivo desbloqueado",
          "Tu dispositivo ha sido desbloqueado correctamente.",
          [
            {
              text: "Continuar",
              onPress: () => {
                // Usar reset para volver a la pantalla principal
                // Esto funciona mejor con la estructura de navegación condicional
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
        // Incrementar contador de intentos (ya se incrementa en unblockDeviceWithKey)
        const failedAttempts = await getFailedAttempts();
        setAttempts(failedAttempts);
        shakeError();

        // Mostrar advertencia con animación
        setShowWarning(true);
        fadeInWarning();

        if (failedAttempts >= 5) {
          setError(
            "Demasiados intentos fallidos. Por favor, intenta más tarde o contacta con soporte."
          );
        } else {
          setError(
            `Clave de seguridad incorrecta. Intento fallido ${failedAttempts}/5.`
          );
        }
      }
    } catch (error) {
      console.error("Error al verificar clave:", error);
      setError(
        "Error al verificar la clave de seguridad. Por favor, intenta de nuevo."
      );
      shakeError();
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
        {/* Advertencia de bloqueo */}
        {showWarning && (
          <Animated.View
            style={[styles.warningBanner, { opacity: warningOpacity }]}
          >
            <Ionicons name="lock-open-outline" size={24} color="#fff" />
            <Text style={styles.warningText}>
              ADVERTENCIA: Dispositivo en modo de protección. Demasiados
              intentos fallidos bloquearán permanentemente el acceso y se
              notificará al propietario.
            </Text>
          </Animated.View>
        )}

        <View style={styles.content}>
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ translateX: shakeAnimation }] },
            ]}
          >
            <Animated.View>
              <Ionicons name="key" size={80} color="#007AFF" />
            </Animated.View>
          </Animated.View>

          <Text style={styles.title}>Desbloquear dispositivo</Text>

          <Text style={styles.instructions}>
            Introduce tu clave de seguridad de 20 dígitos para desbloquear el
            dispositivo. Esta clave fue enviada a tu correo electrónico cuando
            te registraste.
          </Text>

          {error ? (
            <Animated.Text
              style={[
                styles.errorText,
                { transform: [{ translateX: shakeAnimation }] },
              ]}
            >
              {error}
            </Animated.Text>
          ) : null}

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
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name="lock-open-outline"
                  size={20}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.unlockButtonText}>Desbloquear</Text>
              </>
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
          <Text
            style={[
              styles.attemptsText,
              attempts >= 3 ? styles.criticalText : null,
            ]}
          >
            {attempts > 0 ? `Intentos fallidos: ${attempts}/5` : ""}
          </Text>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default UnlockScreen;
