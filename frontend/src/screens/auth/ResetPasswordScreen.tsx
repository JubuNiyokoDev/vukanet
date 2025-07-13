import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useRoute} from '@react-navigation/native';

const ResetPasswordScreen: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  
  // @ts-ignore
  const {token} = route.params || {};

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);
    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert(
        'Succès',
        'Votre mot de passe a été réinitialisé avec succès',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login' as never),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Icon name="lock-reset" size={40} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>Nouveau mot de passe</Text>
              <Text style={styles.subtitle}>
                Créez un nouveau mot de passe sécurisé
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nouveau mot de passe"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}>
                  <Icon
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                />
              </View>

              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Exigences du mot de passe :</Text>
                <View style={styles.requirement}>
                  <Icon 
                    name={password.length >= 6 ? 'check-circle' : 'radio-button-unchecked'} 
                    size={16} 
                    color={password.length >= 6 ? '#10B981' : '#9CA3AF'} 
                  />
                  <Text style={[styles.requirementText, password.length >= 6 && styles.requirementMet]}>
                    Au moins 6 caractères
                  </Text>
                </View>
                <View style={styles.requirement}>
                  <Icon 
                    name={password === confirmPassword && password.length > 0 ? 'check-circle' : 'radio-button-unchecked'} 
                    size={16} 
                    color={password === confirmPassword && password.length > 0 ? '#10B981' : '#9CA3AF'} 
                  />
                  <Text style={[styles.requirementText, password === confirmPassword && password.length > 0 && styles.requirementMet]}>
                    Les mots de passe correspondent
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isLoading && styles.submitButtonDisabled,
                ]}
                onPress={handleResetPassword}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      Réinitialiser
                    </Text>
                    <Icon name="check" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login' as never)}>
                <Text style={styles.loginLinkText}>
                  Retour à la connexion
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  passwordRequirements: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
  },
  requirementMet: {
    color: '#10B981',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default ResetPasswordScreen;