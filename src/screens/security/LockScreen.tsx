import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  BackHandler,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Text as PaperText, Avatar, MD3DarkTheme } from "react-native-paper";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, CommonActions } from "@react-navigation/native";

type LockScreenProps = {
  route: {
    params?: {
      reason?: string;
    };
  };
};

const LockScreen: React.FC<LockScreenProps> = ({ route }) => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const lockReason = route.params?.reason || "security_protocol";

  useEffect(() => {
    // Impedir que el usuario pueda volver atrás
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    return () => backHandler.remove();
  }, []);

  const getLockReasonText = (): string => {
    switch (lockReason) {
      case "suspicious_activity":
        return "Se ha detectado actividad sospechosa en tu dispositivo.";
      case "remote_lock":
        return "Tu dispositivo ha sido bloqueado remotamente.";
      case "test":
        return "Esto es una prueba del sistema de bloqueo.";
      default:
        return "El protocolo de seguridad ha sido activado.";
    }
  };

  const handleUnlock = () => {
    navigation.navigate("Unlock");
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      "Llamada de emergencia",
      "En un dispositivo real, esta opción permitiría realizar llamadas de emergencia incluso con el dispositivo bloqueado.",
      [{ text: "Entendido" }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: MD3DarkTheme.colors.background }]}>
      <View style={styles.content}>
        <Avatar.Icon 
          icon={({ size, color }) => <Ionicons name="lock-closed" size={size} color={color} />} 
          size={80} 
          color={MD3DarkTheme.colors.surface}
          style={[styles.iconContainer, { backgroundColor: MD3DarkTheme.colors.error }]} 
        />

        <PaperText variant="headlineMedium" style={[styles.title, { color: MD3DarkTheme.colors.onSurface }]}>
          Dispositivo bloqueado
        </PaperText>

        <PaperText variant="bodyLarge" style={[styles.message, { color: MD3DarkTheme.colors.onSurface }]}>
          {getLockReasonText()}
        </PaperText>

        <PaperText variant="bodyMedium" style={[styles.instructions, { color: MD3DarkTheme.colors.onSurfaceVariant }]}>
          Para desbloquear el dispositivo, necesitarás introducir tu clave de
          seguridad de 20 dígitos que recibiste por correo electrónico al
          registrarte.
        </PaperText>

        <Button 
          mode="contained" 
          onPress={handleUnlock} 
          style={styles.unlockButton}
          buttonColor={MD3DarkTheme.colors.error}
          textColor={MD3DarkTheme.colors.onError}
        >
          Desbloquear dispositivo
        </Button>

        <Button 
          mode="outlined" 
          onPress={handleEmergencyCall} 
          style={styles.emergencyButton}
          textColor={MD3DarkTheme.colors.onSurfaceVariant}
        >
          Llamada de emergencia
        </Button>
      </View>

      <View style={styles.footer}>
        <PaperText variant="bodySmall" style={[styles.footerText, { color: MD3DarkTheme.colors.onSurfaceVariant }]}>
          SecureWipe - Protocolo de seguridad activo
        </PaperText>
      </View>
    </SafeAreaView>
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
  message: {
    // fontSize from PaperText variant="bodyLarge"
    // color from MD3DarkTheme.colors.onSurface
    marginBottom: 30,
    textAlign: "center",
  },
  instructions: {
    // fontSize from PaperText variant="bodyMedium"
    // color from MD3DarkTheme.colors.onSurfaceVariant
    marginBottom: 40,
    textAlign: "center",
    lineHeight: 24,
  },
  unlockButton: {
    // backgroundColor from Button's buttonColor prop
    // paddingVertical, paddingHorizontal, borderRadius handled by Paper.Button
    marginBottom: 20,
    width: "100%",
    // alignItems: "center", // Handled by Paper.Button
  },
  // unlockButtonText color from Button's textColor prop, fontSize, fontWeight from Paper.Button labelStyle
  emergencyButton: {
    // borderWidth, borderColor from Paper.Button mode="outlined" and theme
    // paddingVertical, paddingHorizontal, borderRadius handled by Paper.Button
    width: "100%",
    // alignItems: "center", // Handled by Paper.Button
  },
  // emergencyButtonText color from Button's textColor prop, fontSize from Paper.Button labelStyle
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    // color from MD3DarkTheme.colors.onSurfaceVariant
    // fontSize from PaperText variant="bodySmall"
  },
});

export default LockScreen;
