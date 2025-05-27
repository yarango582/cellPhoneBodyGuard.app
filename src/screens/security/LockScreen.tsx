import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={80} color="#FF3B30" />
        </View>

        <Text style={styles.title}>Dispositivo bloqueado</Text>

        <Text style={styles.message}>{getLockReasonText()}</Text>

        <Text style={styles.instructions}>
          Para desbloquear el dispositivo, necesitarás introducir tu clave de
          seguridad de 20 dígitos que recibiste por correo electrónico al
          registrarte.
        </Text>

        <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
          <Text style={styles.unlockButtonText}>Desbloquear dispositivo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleEmergencyCall}
        >
          <Text style={styles.emergencyButtonText}>Llamada de emergencia</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          SecureWipe - Protocolo de seguridad activo
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
    color: "#fff",
    marginBottom: 30,
    textAlign: "center",
  },
  instructions: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 40,
    textAlign: "center",
    lineHeight: 24,
  },
  unlockButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  unlockButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  emergencyButton: {
    borderWidth: 1,
    borderColor: "#666",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  emergencyButtonText: {
    color: "#ccc",
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
});

export default LockScreen;
