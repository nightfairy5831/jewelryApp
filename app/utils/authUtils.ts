import { Alert } from 'react-native';
import { router } from 'expo-router';

/**
 * Show a login prompt alert when authentication is required
 * @param message - Optional custom message to display
 */
export function promptLogin(message: string = 'Faça login para continuar') {
  Alert.alert('Login necessário', message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Login', onPress: () => router.push('/auth/login') },
  ]);
}

/**
 * Check if user is authenticated and show login prompt if not
 * @param authToken - The authentication token
 * @param message - Optional custom message
 * @returns true if authenticated, false otherwise
 */
export function requireAuth(authToken: string | null, message?: string): boolean {
  if (!authToken) {
    promptLogin(message);
    return false;
  }
  return true;
}
