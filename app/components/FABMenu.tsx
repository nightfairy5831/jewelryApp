import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore } from '../store/useAppStore';
import { useCurrentUser } from '../hooks/useCurrentUser';

interface FABMenuProps {
  mode?: 'main' | 'forum'; // main shows forum+logout, forum shows back+logout
}

export default function FABMenu({ mode = 'main' }: FABMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAppStore();
  const { user: currentUser } = useCurrentUser();

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    setIsOpen(false);
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          // Explicitly navigate to index to avoid staying on seller-dashboard
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  const handleForum = () => {
    setIsOpen(false);
    router.push('/(tabs)/forum');
  };

  const handleBackToMain = () => {
    setIsOpen(false);
    if (currentUser?.role === 'seller') {
      router.push('/(tabs)/seller-dashboard');
    } else {
      router.push('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      {/* Option Buttons - Show when open */}
      {isOpen && (
        <>
          {mode === 'main' ? (
            <>
              {/* Forum Button */}
              <TouchableOpacity
                style={[styles.optionButton, styles.option1]}
                onPress={handleForum}
              >
                <Ionicons name="chatbubbles" size={24} color="#ffffff" />
              </TouchableOpacity>

              {/* Logout Button */}
              <TouchableOpacity
                style={[styles.optionButton, styles.option2]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out" size={24} color="#ffffff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Back to Main Button */}
              <TouchableOpacity
                style={[styles.optionButton, styles.option1]}
                onPress={handleBackToMain}
              >
                <Ionicons name="home" size={24} color="#ffffff" />
              </TouchableOpacity>

              {/* Logout Button */}
              <TouchableOpacity
                style={[styles.optionButton, styles.option2]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out" size={24} color="#ffffff" />
              </TouchableOpacity>
            </>
          )}
        </>
      )}

      {/* Main FAB Button */}
      <TouchableOpacity
        style={[styles.fab, isOpen && styles.fabOpen]}
        onPress={handleToggle}
      >
        <Ionicons
          name={isOpen ? 'close' : 'menu'}
          size={28}
          color="#ffffff"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabOpen: {
    backgroundColor: '#dc2626',
  },
  optionButton: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  option1: {
    bottom: 70,
    left: -60,
    backgroundColor: '#2563eb',
  },
  option2: {
    bottom: 70,
    right: -60,
    backgroundColor: '#ef4444',
  },
});
