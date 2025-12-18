import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { register, isAuthLoading, setSellerRegistrationData } = useAppStore();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Erro', 'Você precisa aceitar os Termos de Uso para continuar');
      return;
    }

    try {
      // If seller, just navigate to detail pages without registering yet
      if (role === 'seller') {
        // Store registration data for later submission
        setSellerRegistrationData({ name, email, password });
        router.push('/auth/register-detail-1');
      } else {
        // For buyers, register immediately
        await register(name, email, password, password, '', role);
        Alert.alert(
          'Sucesso',
          'Conta criada com sucesso!',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Erro no Registro', error.message || 'Não foi possível criar a conta');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header with Back Button */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cadastro de novo usuário</Text>
          </View>

          {/* Logo and Title */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/user.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title} numberOfLines={1}>Jóia Perfeita</Text>
          </View>

          <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo*</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Digite seu nome completo"
                placeholderTextColor="#B3B3B3"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail*</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#B3B3B3"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha*</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#B3B3B3"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.inputGroup, styles.roleInputGroup]}>
            <Text style={styles.label}>Tipo de Conta</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'buyer' && styles.roleButtonActive]}
                onPress={() => setRole('buyer')}
              >
                <Image
                  source={require('../../assets/buyer.png')}
                  style={styles.roleIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.roleButtonText, role === 'buyer' && styles.roleButtonTextActive]} numberOfLines={1}>
                  Conta cliente
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleButton, role === 'seller' && styles.roleButtonActive]}
                onPress={() => setRole('seller')}
              >
                <Image
                  source={require('../../assets/buyer.png')}
                  style={styles.roleIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.roleButtonText, role === 'seller' && styles.roleButtonTextActive]} numberOfLines={1}>
                  Conta vendedor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and Conditions */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View style={styles.checkbox}>
              {acceptedTerms && (
                <Ionicons name="checkmark" size={16} color="#000" />
              )}
            </View>
            <Text style={styles.termsText}>
              Concordo com os <Text style={styles.termsLink}>Termos Jóia Perfeita</Text>{'\n'}
              Leia com atenção à nossa política de privacidade e termos de uso.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

        {/* Footer with Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, isAuthLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isAuthLoading}
          >
            {isAuthLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Criar conta</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#071327',
    marginLeft: 8,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logoContainer: {
    width: 90,
    height: 90,
    marginBottom: 12,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: '400',
    color: '#535252',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    marginTop: 6,
  },
  form: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  roleInputGroup: {
    marginTop: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    paddingHorizontal: 18,
    height: 56,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  roleButtonActive: {
    borderColor: '#F5C518',
    backgroundColor: '#FFFBF0',
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6b7280',
    textAlign: 'center',
  },
  roleButtonTextActive: {
    color: '#000000',
    fontWeight: '500',
  },
  roleIcon: {
    width: 44,
    height: 44,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  termsLink: {
    color: '#000000',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});
