import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../store/useAppStore';
import '../global.css';

function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <StatusBar style="dark" />
      <Image
        source={require('../assets/icon.png')}
        style={styles.splashLogo}
        resizeMode="contain"
      />
      <Text style={styles.splashTitle}>Perfect Jewel</Text>
      <ActivityIndicator size="large" color="#D4AF37" style={styles.splashLoader} />
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, checkAuth, currentUser } = useAppStore();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Check authentication status on mount
    const initializeApp = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        // Minimal splash time - auth verification happens in background
        setTimeout(() => {
          setIsAppReady(true);
        }, 300);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (!isAppReady) return;

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';

    // Allow guest browsing - only redirect authenticated users from auth pages
    if (isAuthenticated && inAuthGroup && currentUser) {
      // Only redirect if we have user data loaded
      // Redirect based on user role after login
      if (currentUser.role === 'seller') {
        router.replace('/(tabs)/seller-dashboard');
      } else {
        router.replace('/(tabs)'); // Buyer goes to product catalog
      }
    } else if (isAuthenticated && inTabsGroup && currentUser) {
      // Protect routes based on role
      const currentRoute = segments[1];

      if (currentUser.role === 'seller') {
        // Seller trying to access buyer's product catalog
        if (currentRoute === 'index' || !currentRoute) {
          router.replace('/(tabs)/seller-dashboard');
        }
      } else if (currentUser.role === 'buyer' || currentUser.role === 'admin') {
        // Buyer/Admin trying to access seller dashboard
        if (currentRoute === 'seller-dashboard') {
          router.replace('/(tabs)');
        }
      }
    }
  }, [isAuthenticated, currentUser, segments, isAppReady]);

  // Show splash screen while initializing
  if (!isAppReady) {
    return <SplashScreen />;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  splashLoader: {
    marginTop: 40,
  },
});
