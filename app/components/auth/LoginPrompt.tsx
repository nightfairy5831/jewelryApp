import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type IconName = 'cart-outline' | 'heart-outline' | 'person-circle-outline' | 'chatbubbles-outline';

interface LoginPromptProps {
  icon?: IconName;
  title?: string;
  message?: string;
  onLoginPress?: () => void;
  onRegisterPress?: () => void;
}

export default function LoginPrompt({
  icon = 'person-circle-outline',
  title = 'Faça login para continuar',
  message = 'Entre na sua conta para acessar este recurso',
  onLoginPress,
  onRegisterPress,
}: LoginPromptProps) {
  const handleLoginPress = () => {
    if (onLoginPress) {
      onLoginPress();
    } else {
      router.push('/auth/login');
    }
  };

  const handleRegisterPress = () => {
    if (onRegisterPress) {
      onRegisterPress();
    } else {
      router.push('/auth/register');
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={80} color="#d1d5db" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
        <Text style={styles.loginButtonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.registerButton} onPress={handleRegisterPress}>
        <Text style={styles.registerButtonText}>Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 24,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  loginButton: {
    marginTop: 32,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButton: {
    marginTop: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  registerButtonText: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
