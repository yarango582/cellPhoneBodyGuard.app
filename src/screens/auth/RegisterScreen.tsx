import React, { useState } from 'react';
import { 
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { registerUser } from '../../services/authService';
import { Button, TextInput as PaperTextInput, ActivityIndicator as PaperActivityIndicator, Text as PaperText, IconButton, useTheme } from 'react-native-paper';

type RegisterScreenProps = {
  navigation: StackNavigationProp<any>;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleRegister = async () => {
    // Validar campos
    if (!email.trim()) {
      setError('El correo electrónico es obligatorio');
      return;
    }

    if (!validateEmail(email)) {
      setError('Introduce un correo electrónico válido');
      return;
    }

    if (!password) {
      setError('La contraseña es obligatoria');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await registerUser(email, password);
      
      Alert.alert(
        'Registro exitoso',
        'Se ha enviado una clave de seguridad de 20 dígitos a tu correo electrónico. Guárdala en un lugar seguro, la necesitarás para desbloquear tu dispositivo en caso de emergencia.',
        [{ text: 'Entendido' }]
      );
      
      // La navegación se maneja automáticamente en AppNavigator
    } catch (error: any) {
      let errorMessage = 'Error al registrar usuario';
      
      // Manejar errores específicos de Firebase
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Ya existe una cuenta con este correo electrónico';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es demasiado débil';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.primary}
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />

          <View style={styles.header}>
            <PaperText variant="headlineMedium" style={styles.title}>Crear cuenta</PaperText>
            <PaperText variant="bodyLarge" style={styles.subtitle}>Regístrate para proteger tu dispositivo</PaperText>
          </View>

          <View style={styles.formContainer}>
            {error ? <PaperText style={[styles.errorText, { color: theme.colors.error }]}>{error}</PaperText> : null}

            <PaperTextInput
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
              left={<PaperTextInput.Icon icon="email-outline" />}
              style={styles.input}
            />

            <PaperTextInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              mode="outlined"
              left={<PaperTextInput.Icon icon="lock-outline" />}
              right={<PaperTextInput.Icon icon={showPassword ? "eye-off-outline" : "eye-outline"} onPress={() => setShowPassword(!showPassword)} />}
              style={styles.input}
            />

            <PaperTextInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              mode="outlined"
              left={<PaperTextInput.Icon icon="lock-check-outline" />}
              style={styles.input}
            />

            <PaperText variant="bodySmall" style={styles.securityKeyInfo}>
              Al registrarte, recibirás una clave de seguridad de 20 dígitos en tu correo electrónico. 
              Esta clave será necesaria para desbloquear tu dispositivo en caso de activación del protocolo de seguridad.
            </PaperText>

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
            >
              Registrarse
            </Button>

            <View style={styles.loginContainer}>
              <PaperText style={styles.loginText}>¿Ya tienes una cuenta? </PaperText>
              <Button mode="text" onPress={() => navigation.navigate('Login')} style={styles.loginButton}>
                Inicia sesión
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8', // Or theme.colors.background
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginTop: 10, // Keep or adjust
    // Removed padding and width, IconButton has its own sizing
    alignSelf: 'flex-start', // Ensure it stays to the left
  },
  header: {
    marginTop: 10, // Reduced margin as IconButton takes space
    marginBottom: 30,
    alignItems: 'center', // Center title/subtitle
  },
  title: {
    // Handled by PaperText variant="headlineMedium"
    textAlign: 'center',
  },
  subtitle: {
    // Handled by PaperText variant="bodyLarge"
    marginTop: 5,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff', // Or theme.colors.surface
    borderRadius: 10, // Or theme.roundness
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    // Color from theme.colors.error
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15, // Adjusted margin
    // Height, fontSize, color are handled by PaperTextInput
  },
  securityKeyInfo: {
    // Handled by PaperText variant="bodySmall"
    // color: '#666', // Or theme.colors.onSurfaceVariant
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center', // Improved readability
  },
  registerButton: {
    // backgroundColor is handled by mode="contained"
    // borderRadius is handled by Paper.Button
    height: 50,
    justifyContent: 'center', // Text is centered by default
    marginTop: 10, // Add some margin
  },
  // registerButtonText is handled by Paper.Button
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center', // Align items for better look with Button
    marginTop: 20,
  },
  loginText: {
    // color: '#666', // Or theme.colors.onSurfaceVariant
    fontSize: 14,
    marginRight: -8, // Adjust spacing with button
  },
  loginButton: {
    // No specific styles needed if using mode="text" defaults
  }
});

export default RegisterScreen;
