import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../store/useAppStore';
import { useCurrentUser } from '../hooks/useCurrentUser';
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
      <Text style={styles.splashTitle}>Joia Perfetia</Text>
      <ActivityIndicator size="large" color="#D4AF37" style={styles.splashLoader} />
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { authToken, checkAuth, fetchCart } = useAppStore();
  const [isAppReady, setIsAppReady] = useState(false);

  // Simplified: isAuthenticated = token exists
  const isAuthenticated = !!authToken;

  // Fetch user data only when authenticated (for role-based routing)
  // NOTE: This runs in parallel, doesn't block app initialization
  const { user: currentUser } = useCurrentUser();

  useEffect(() => {
    // Check authentication status on mount
    const initializeApp = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsAppReady(true);
      }
    };

    initializeApp();
  }, []);

  // Fetch cart when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAppReady) return;

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';

    // Allow guest browsing - only redirect authenticated users from auth pages
    // Wait for currentUser to be available before redirecting
    if (isAuthenticated && currentUser && inAuthGroup) {
      // Redirect to main app based on role
      if (currentUser.role === 'seller') {
        router.replace('/(tabs)/seller-dashboard');
      } else {
        router.replace('/(tabs)'); // Explicitly go to index for buyers/guests
      }
    } else if (isAuthenticated && inTabsGroup && currentUser) {
      // Only do role-based routing if we have user data AND user is authenticated
      const currentRoute = segments[1];

      if (currentUser.role === 'seller') {
        // Seller trying to access buyer's product catalog
        if (!currentRoute || currentRoute === 'seller-dashboard') {
          // Keep seller on dashboard, no redirect needed
        } else {
          // Seller navigated to buyer route, allow it
        }
      } else if (currentUser.role === 'buyer' || currentUser.role === 'admin') {
        // Buyer/Admin trying to access seller dashboard
        if (currentRoute === 'seller-dashboard') {
          router.replace('/(tabs)');
        }
      }
    } else if (!isAuthenticated && inTabsGroup && segments[1] === 'seller-dashboard') {
      // If user is not authenticated but on seller-dashboard, redirect to main catalog
      router.replace('/(tabs)');
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
        <Stack.Screen name="checkout" />
        <Stack.Screen name="orders" />
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
