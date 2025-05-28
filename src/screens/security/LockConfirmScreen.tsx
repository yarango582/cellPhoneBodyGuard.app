import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { blockDevice } from "../../services/securityService";
import { styles } from "./styles/LockConfirmScreenStyles";

const LockConfirmScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleConfirmLock = async () => {
    // Vibrar para indicar una acción importante
    Vibration.vibrate([0, 100, 50, 100]);

    // Mostrar alerta de confirmación final
    Alert.alert(
      "CONFIRMACIÓN DE BLOQUEO",
      "¡ATENCIÓN! Al activar el bloqueo de seguridad:\n\n" +
        "• El dispositivo quedará bloqueado\n" +
        "• Solo podrás desbloquearlo con tu clave de seguridad\n" +
        "• No podrás usar otras aplicaciones\n" +
        "• No podrás apagar el dispositivo\n\n" +
        "¿Estás seguro de que quieres activar el bloqueo?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Activar Bloqueo",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await blockDevice("manual_lock");
              // La navegación a la pantalla de bloqueo se maneja en blockDevice
            } catch (error) {
              console.error("Error al bloquear dispositivo:", error);
              Alert.alert(
                "Error",
                "No se pudo activar el bloqueo. Por favor, intenta de nuevo."
              );
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={80} color="#FF3B30" />
        </View>

        <Text style={styles.title}>Activar Bloqueo de Seguridad</Text>

        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={24} color="#FF3B30" />
          <Text style={styles.warningTitle}>ADVERTENCIA IMPORTANTE</Text>
        </View>

        <Text style={styles.description}>
          Estás a punto de activar el bloqueo de seguridad en tu dispositivo.
          Esta acción bloqueará completamente el acceso a tu dispositivo y solo
          podrás desbloquearlo usando tu clave de seguridad de 20 dígitos.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            Qué sucederá al activar el bloqueo:
          </Text>
          <View style={styles.infoItem}>
            <Ionicons name="lock-closed" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              El dispositivo quedará bloqueado inmediatamente
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="key" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              Necesitarás tu clave de seguridad para desbloquear
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="apps" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              No podrás usar otras aplicaciones mientras esté bloqueado
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="power" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              No podrás apagar el dispositivo ni acceder a la barra de
              notificaciones
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.lockButton, isLoading && styles.disabledButton]}
            onPress={handleConfirmLock}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.lockButtonText}>Activar Bloqueo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LockConfirmScreen;
