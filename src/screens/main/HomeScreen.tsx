import React, { useEffect, useState } from 'react';
import { 
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  View // Keep View for simple layout containers if needed
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Keep Ionicons
import {
  Button,
  Card,
  Text as PaperText,
  Avatar,
  List,
  useTheme,
  MD3Colors // For specific MD3 colors if needed
} from 'react-native-paper';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { getCurrentUser } from '../../services/authService';
import { getSecuritySettings, blockDevice } from '../../services/securityService';
import { formatSecurityKey } from '../../utils/securityUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURITY_KEY = 'security_key';

const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const [userName, setUserName] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [securityEnabled, setSecurityEnabled] = useState(false);
  const [lastCheck, setLastCheck] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
    loadSecuritySettings();
  }, []);

  const loadUserData = async () => {
    try {
      const user = getCurrentUser();
      if (user) {
        // Obtener datos del usuario desde Firestore
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Usar el correo como nombre de usuario (puedes cambiar esto si tienes un campo de nombre)
          setUserName(user.email?.split('@')[0] || 'Usuario');
        }

        // Obtener clave de seguridad almacenada localmente
        const storedKey = await AsyncStorage.getItem(SECURITY_KEY);
        if (storedKey) {
          setSecurityKey(storedKey);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    }
  };

  const loadSecuritySettings = async () => {
    try {
      const settings = await getSecuritySettings();
      setSecurityEnabled(settings.enabled);
      setLastCheck(settings.lastChecked);
    } catch (error) {
      console.error('Error al cargar configuración de seguridad:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserData();
      await loadSecuritySettings();
    } finally {
      setRefreshing(false);
    }
  };

  const handleTestLock = () => {
    Alert.alert(
      'Probar bloqueo',
      '¿Estás seguro de que quieres probar el bloqueo del dispositivo? Necesitarás tu clave de seguridad para desbloquearlo.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Probar',
          onPress: async () => {
            try {
              await blockDevice('test');
              // La navegación a la pantalla de bloqueo se manejará automáticamente
            } catch (error) {
              console.error('Error al bloquear dispositivo:', error);
              Alert.alert('Error', 'No se pudo bloquear el dispositivo');
            }
          }
        }
      ]
    );
  };

  const handleShowSecurityKey = () => {
    Alert.alert(
      'Tu clave de seguridad',
      `Esta es tu clave de seguridad de 20 dígitos. Guárdala en un lugar seguro, la necesitarás para desbloquear tu dispositivo en caso de emergencia.\n\n${formatSecurityKey(securityKey)}`,
      [{ text: 'Entendido' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[theme.colors.primary]} // Android
            tintColor={theme.colors.primary} // iOS
          />
        }
      >
        <View style={styles.header}>
          <PaperText variant="headlineSmall" style={styles.greeting}>Hola, {userName}</PaperText>
          <PaperText variant="titleMedium" style={styles.subtitle}>
            {securityEnabled 
              ? 'Tu dispositivo está protegido' 
              : 'Tu dispositivo no está protegido'}
          </PaperText>
        </View>

        <Card style={styles.statusCard}>
          <Card.Title
            title={securityEnabled ? "Protección activa" : "Protección inactiva"}
            titleStyle={{ color: securityEnabled ? theme.colors.primary : MD3Colors.orangeA700 }}
            left={(props) => (
              <Avatar.Icon 
                {...props} 
                icon={securityEnabled ? "shield-check" : "shield-alert-outline"} 
                style={{ backgroundColor: securityEnabled ? theme.colors.primaryContainer : MD3Colors.orangeA100 }}
                color={securityEnabled ? theme.colors.onPrimaryContainer : MD3Colors.orangeA700}
              />
            )}
          />
          <Card.Content>
            <PaperText variant="bodyMedium" style={styles.statusDescription}>
              {securityEnabled 
                ? "Tu dispositivo está siendo monitoreado para detectar actividades sospechosas." 
                : "Activa la protección en la sección de Seguridad para proteger tu dispositivo."}
            </PaperText>
            {securityEnabled && (
              <PaperText variant="bodySmall" style={styles.lastCheck}>
                Última verificación: {new Date(lastCheck).toLocaleString()}
              </PaperText>
            )}
          </Card.Content>
        </Card>

        <View style={styles.actionsContainer}>
          <PaperText variant="titleMedium" style={styles.sectionTitle}>Acciones rápidas</PaperText>
          
          <List.Item
            title="Ver clave de seguridad"
            description="Muestra tu clave de 20 dígitos para desbloquear el dispositivo"
            titleStyle={styles.actionTitleStyle}
            descriptionStyle={styles.actionDescriptionStyle}
            left={props => <List.Icon {...props} icon={({ size, color }) => <Ionicons name="key-outline" size={size} color={theme.colors.primary} />} />}
            onPress={handleShowSecurityKey}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            style={styles.listItem}
          />
          
          <List.Item
            title="Probar bloqueo"
            description="Simula el bloqueo del dispositivo para probar la funcionalidad"
            titleStyle={styles.actionTitleStyle}
            descriptionStyle={styles.actionDescriptionStyle}
            left={props => <List.Icon {...props} icon={({ size, color }) => <Ionicons name="lock-closed-outline" size={size} color={theme.colors.primary} />} />}
            onPress={handleTestLock}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            style={styles.listItem}
          />
        </View>

        <View style={styles.infoContainer}>
          <PaperText variant="titleMedium" style={styles.sectionTitle}>Información importante</PaperText>
          
          <Card style={styles.infoCard}>
            <Card.Content style={styles.infoCardContent}>
              <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} style={styles.infoIcon} />
              <PaperText variant="bodyMedium" style={styles.infoText}>
                En caso de pérdida o robo, podrás bloquear tu dispositivo desde la interfaz web 
                o configurar comportamientos que activen el bloqueo automáticamente.
              </PaperText>
            </Card.Content>
          </Card>
          
          <Card style={styles.infoCard}>
            <Card.Content style={styles.infoCardContent}>
              <Ionicons name="warning-outline" size={24} color={MD3Colors.orangeA700} style={styles.infoIcon} />
              <PaperText variant="bodyMedium" style={styles.infoText}>
                Guarda tu clave de seguridad en un lugar seguro. La necesitarás para desbloquear 
                tu dispositivo en caso de activación del protocolo de seguridad.
              </PaperText>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor is handled by theme
  },
  scrollView: {
    padding: 16, // Adjusted padding
  },
  header: {
    marginBottom: 24, // Adjusted margin
  },
  greeting: {
    // fontSize and fontWeight from PaperText variant="headlineSmall"
    // color: theme.colors.onBackground, // Default for PaperText
  },
  subtitle: {
    // fontSize from PaperText variant="titleMedium"
    // color: theme.colors.onSurfaceVariant, // Default for PaperText
    marginTop: 4, // Adjusted margin
  },
  statusCard: {
    // backgroundColor: theme.colors.surface, // Default for Card
    // borderRadius: theme.roundness, // Default for Card
    // elevation: 1, // Default for Card, or adjust as needed
    marginBottom: 24, // Adjusted margin
  },
  // statusHeader is handled by Card.Title
  // statusTitle is handled by Card.Title titleStyle
  statusDescription: {
    // fontSize from PaperText variant="bodyMedium"
    // color: theme.colors.onSurfaceVariant, // Default for PaperText
    marginBottom: 8, // Adjusted margin
  },
  lastCheck: {
    // fontSize from PaperText variant="bodySmall"
    // color: theme.colors.onSurfaceVariant, // Default for PaperText
    fontStyle: 'italic',
  },
  actionsContainer: {
    marginBottom: 24, // Adjusted margin
  },
  sectionTitle: {
    // fontSize and fontWeight from PaperText variant="titleMedium"
    // color: theme.colors.onSurfaceVariant, // Default for PaperText
    marginBottom: 8, // Adjusted margin
  },
  listItem: {
    backgroundColor: theme.colors.surface, // Paper List.Item default might be transparent
    borderRadius: theme.roundness,
    marginBottom: 8,
    // elevation: 1, // If a slight elevation is desired for List.Items
  },
  actionTitleStyle: {
    fontWeight: '600', // As per original style
    // color: theme.colors.onSurface // Default for List.Item title
  },
  actionDescriptionStyle: {
    // color: theme.colors.onSurfaceVariant // Default for List.Item description
  },
  infoContainer: {
    marginBottom: 16, // Adjusted margin
  },
  infoCard: {
    // backgroundColor: theme.colors.surface, // Default for Card
    // borderRadius: theme.roundness, // Default for Card
    // elevation: 1, // Default for Card
    marginBottom: 12, // Adjusted margin
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align icon with the start of the text
  },
  infoIcon: {
    marginRight: 12, // Space between icon and text
    marginTop: 2, // Align icon slightly better with text lines
  },
  infoText: {
    flex: 1,
    // fontSize from PaperText variant="bodyMedium"
    // color: theme.colors.onSurfaceVariant, // Default for PaperText
    lineHeight: 20, // As per original style
  },
});

export default HomeScreen;
