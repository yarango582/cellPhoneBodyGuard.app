import React, { useState } from 'react';
import { 
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { loginUser } from '../../services/authService';
import { Button, TextInput as PaperTextInput, ActivityIndicator as PaperActivityIndicator, Text as PaperText, useTheme } from 'react-native-paper';

type LoginScreenProps = {
  navigation: StackNavigationProp<any>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    // Validar campos
    if (!email.trim()) {
      setError('El correo electrónico es obligatorio');
      return;
    }

    if (!password) {
      setError('La contraseña es obligatoria');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await loginUser(email, password);
      // La navegación se maneja automáticamente en AppNavigator
    } catch (error: any) {
      let errorMessage = 'Error al iniciar sesión';
      
      // Manejar errores específicos de Firebase
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este correo electrónico';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
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
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={80} color={theme.colors.primary} />
            <PaperText variant="headlineMedium" style={styles.title}>SecureWipe</PaperText>
            <PaperText variant="titleMedium" style={styles.subtitle}>Protección avanzada para tu dispositivo</PaperText>
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

            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPasswordButton}
            >
              ¿Olvidaste tu contraseña?
            </Button>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
            >
              Iniciar sesión
            </Button>

            <View style={styles.registerContainer}>
              <PaperText style={styles.registerText}>¿No tienes una cuenta? </PaperText>
              <Button mode="text" onPress={() => navigation.navigate('Register')} style={styles.registerButton}>
                Regístrate
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
    backgroundColor: '#f8f8f8', // Keep or use theme.colors.background
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'center', // Center content vertically
  },
  header: {
    alignItems: 'center',
    marginBottom: 30, // Adjusted margin
  },
  title: {
    // Handled by PaperText variant="headlineMedium"
    marginTop: 15, // Adjusted margin
    textAlign: 'center',
  },
  subtitle: {
    // Handled by PaperText variant="titleMedium"
    marginTop: 5,
    textAlign: 'center',
    marginBottom: 20, // Adjusted margin
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 15, // Adjusted margin
  },
  loginButton: {
    // backgroundColor is handled by mode="contained"
    // borderRadius is handled by Paper.Button
    height: 50,
    justifyContent: 'center', // Text is centered by default in Paper.Button
    marginTop: 10, // Add some margin
  },
  // loginButtonText is handled by Paper.Button
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center', // Align items for better look with Button
    marginTop: 20,
  },
  registerText: {
    // color: '#666', // Or theme.colors.onSurfaceVariant
    fontSize: 14,
    marginRight: -8, // Adjust spacing with button
  },
  registerButton: {
    // No specific styles needed if using mode="text" defaults
  }
});

export default LoginScreen;
