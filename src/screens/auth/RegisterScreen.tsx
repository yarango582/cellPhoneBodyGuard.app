import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { registerUser } from '../../services/authService';

type RegisterScreenProps = {
  navigation: StackNavigationProp<any>;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para proteger tu dispositivo</Text>
          </View>

          <View style={styles.formContainer}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.securityKeyInfo}>
              Al registrarte, recibirás una clave de seguridad de 20 dígitos en tu correo electrónico. 
              Esta clave será necesaria para desbloquear tu dispositivo en caso de activación del protocolo de seguridad.
            </Text>

            <TouchableOpacity 
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Registrarse</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Inicia sesión</Text>
              </TouchableOpacity>
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
    backgroundColor: '#f8f8f8',
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
    marginTop: 10,
    padding: 5,
    width: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 5,
  },
  securityKeyInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
