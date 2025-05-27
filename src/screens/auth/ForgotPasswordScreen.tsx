import React, { useState } from 'react';
import { 
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword } from '../../services/authService';
import { Button, TextInput as PaperTextInput, ActivityIndicator as PaperActivityIndicator, Text as PaperText, IconButton, useTheme } from 'react-native-paper';

type ForgotPasswordScreenProps = {
  navigation: StackNavigationProp<any>;
};

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const theme = useTheme();
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
        <View style={styles.contentContainer}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.primary}
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />

          <View style={styles.header}>
            <PaperText variant="headlineMedium" style={styles.title}>Recuperar contraseña</PaperText>
            <PaperText variant="bodyLarge" style={styles.subtitle}>
              Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
            </PaperText>
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

            <Button
              mode="contained"
              onPress={handleResetPassword}
              loading={isLoading}
              disabled={isLoading}
              style={styles.resetButton}
            >
              Enviar correo
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.cancelButton}
            >
              Volver al inicio de sesión
            </Button>
          </View>
        </View>
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
    justifyContent: 'center', // Center the content vertically
  },
  contentContainer: { // Added a wrapper for content
    paddingHorizontal: 20,
  },
  backButton: {
    // marginTop: 10, // Adjusted by contentContainer
    // Removed padding and width, IconButton has its own sizing
    alignSelf: 'flex-start',
    marginLeft: -8, // Counteract IconButton's internal padding
  },
  header: {
    marginTop: 10, // Reduced margin as IconButton takes space
    marginBottom: 30, // Adjusted margin
    alignItems: 'center',
  },
  title: {
    // Handled by PaperText variant="headlineMedium"
    textAlign: 'center',
  },
  subtitle: {
    // Handled by PaperText variant="bodyLarge"
    marginTop: 10,
    lineHeight: 22,
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
    // Height, fontSize, color are handled by PaperTextInput
    marginBottom: 20, // Adjusted margin
  },
  resetButton: {
    // backgroundColor is handled by mode="contained"
    // borderRadius is handled by Paper.Button
    height: 50,
    justifyContent: 'center',
    marginBottom: 15,
  },
  // resetButtonText is handled by Paper.Button
  cancelButton: {
    // alignItems and justifyContent handled by Paper.Button
    // padding handled by Paper.Button
    marginTop: 5, // Add some space from the main button
  },
  // cancelButtonText is handled by Paper.Button
});

export default ForgotPasswordScreen;
