import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  BackHandler,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, TextInput as PaperTextInput, ActivityIndicator as PaperActivityIndicator, Text as PaperText, Avatar, MD3DarkTheme } from "react-native-paper";
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
      <SafeAreaView style={[styles.container, { backgroundColor: MD3DarkTheme.colors.background }]}>
        <View style={styles.content}>
          <Avatar.Icon 
            icon={({ size, color }) => <Ionicons name="key" size={size} color={color} />} 
            size={80} 
            color={MD3DarkTheme.colors.onPrimary}
            style={[styles.iconContainer, { backgroundColor: MD3DarkTheme.colors.primary }]} 
          />

          <PaperText variant="headlineMedium" style={[styles.title, { color: MD3DarkTheme.colors.onSurface }]}>
            Desbloquear dispositivo
          </PaperText>

          <PaperText variant="bodyMedium" style={[styles.instructions, { color: MD3DarkTheme.colors.onSurfaceVariant }]}>
            Introduce tu clave de seguridad de 20 dígitos para desbloquear el
            dispositivo. Esta clave fue enviada a tu correo electrónico cuando
            te registraste.
          </PaperText>

          {error ? (
            <PaperText variant="bodyMedium" style={[styles.errorText, { color: MD3DarkTheme.colors.error }]}>
              {error}
            </PaperText>
          ) : null}

          <PaperTextInput
            mode="outlined"
            style={styles.input}
            value={formattedKey}
            onChangeText={handleKeyChange}
            placeholder="0000 0000 0000 0000 0000"
            placeholderTextColor={MD3DarkTheme.colors.onSurfaceVariant}
            keyboardType="number-pad"
            maxLength={24} // 20 dígitos + 4 espacios
            autoFocus={true}
            textColor={MD3DarkTheme.colors.onSurface}
            theme={{ colors: { background: MD3DarkTheme.colors.surfaceVariant } }} // For input background
          />

          <Button
            mode="contained"
            onPress={handleUnlock}
            loading={isLoading}
            disabled={isLoading}
            style={styles.unlockButton}
            buttonColor={MD3DarkTheme.colors.primary}
            textColor={MD3DarkTheme.colors.onPrimary}
          >
            Desbloquear
          </Button>

          <Button
            mode="text"
            onPress={handleForgotKey}
            style={styles.forgotButton}
            textColor={MD3DarkTheme.colors.primary}
          >
            ¿Olvidaste tu clave de seguridad?
          </Button>
        </View>

        <View style={styles.footer}>
          <PaperText variant="bodySmall" style={[styles.footerText, { color: MD3DarkTheme.colors.onSurfaceVariant }]}>
            SecureWipe - Protocolo de seguridad activo
          </PaperText>
          {attempts > 0 && (
            <PaperText variant="bodySmall" style={[styles.attemptsText, { color: MD3DarkTheme.colors.error }]}>
              {`Intentos fallidos: ${attempts}/5`}
            </PaperText>
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor is set directly using MD3DarkTheme.colors.background
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
    // backgroundColor for Avatar.Icon is set directly
  },
  title: {
    // fontSize and fontWeight from PaperText variant="headlineMedium"
    // color from MD3DarkTheme.colors.onSurface
    marginBottom: 20,
    textAlign: "center",
  },
  instructions: {
    // fontSize from PaperText variant="bodyMedium"
    // color from MD3DarkTheme.colors.onSurfaceVariant
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 24,
  },
  errorText: {
    // fontSize from PaperText variant="bodyMedium"
    // color from MD3DarkTheme.colors.error
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    // backgroundColor is handled by PaperTextInput theme prop or direct style
    // color is handled by PaperTextInput textColor prop
    // fontSize is handled by PaperTextInput
    // padding, borderRadius are handled by PaperTextInput
    textAlign: "center", // Keep this for the input text itself
    letterSpacing: 2,   // Keep this
    width: "100%",      // Ensure it takes full width
    marginBottom: 30,   // Keep this
  },
  unlockButton: {
    // backgroundColor from Button's buttonColor prop
    // paddingVertical, paddingHorizontal, borderRadius handled by Paper.Button
    marginBottom: 20,
    width: "100%",
    // alignItems: "center", // Handled by Paper.Button
  },
  // disabledButton style handled by Paper.Button's disabled state
  // unlockButtonText color from Button's textColor prop, fontSize, fontWeight from Paper.Button labelStyle
  forgotButton: {
    // padding handled by Paper.Button
  },
  // forgotButtonText color from Button's textColor prop, fontSize from Paper.Button labelStyle
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    // color from MD3DarkTheme.colors.onSurfaceVariant
    // fontSize from PaperText variant="bodySmall"
  },
  attemptsText: {
    // color from MD3DarkTheme.colors.error
    // fontSize from PaperText variant="bodySmall"
    marginTop: 5,
  },
});

export default UnlockScreen;
