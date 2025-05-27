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
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword } from '../../services/authService';

type ForgotPasswordScreenProps = {
  navigation: StackNavigationProp<any>;
};

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleResetPassword = async () => {
    // Validar campo de correo
    if (!email.trim()) {
      setError('El correo electrónico es obligatorio');
      return;
    }

    if (!validateEmail(email)) {
      setError('Introduce un correo electrónico válido');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await resetPassword(email);
      
      Alert.alert(
        'Correo enviado',
        'Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico.',
        [
          { 
            text: 'Volver al inicio de sesión', 
            onPress: () => navigation.navigate('Login') 
          }
        ]
      );
    } catch (error: any) {
      let errorMessage = 'Error al enviar correo de restablecimiento';
      
      // Manejar errores específicos de Firebase
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este correo electrónico';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido';
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
          </Text>
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

          <TouchableOpacity 
            style={styles.resetButton}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.resetButtonText}>Enviar correo</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.cancelButtonText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  backButton: {
    marginTop: 10,
    padding: 5,
    width: 40,
  },
  header: {
    marginTop: 30,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    lineHeight: 22,
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
    marginBottom: 30,
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
  resetButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default ForgotPasswordScreen;
