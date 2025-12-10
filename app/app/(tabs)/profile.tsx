import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { router } from 'expo-router';

const userIcon = require('../../assets/user.png');

export default function PerfilScreen() {
  const { currentUser, logout } = useAppStore();
  const [activeTab, setActiveTab] = useState<'wishes' | 'shopping' | 'message'>('wishes');

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  // Handle case when user is not logged in (guest mode)
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>
        <View style={styles.guestContainer}>
          <Ionicons name="person-circle-outline" size={120} color="#d1d5db" />
          <Text style={styles.guestTitle}>Entre para acessar seu perfil</Text>
          <Text style={styles.guestSubtitle}>
            Faça login ou crie uma conta para gerenciar suas compras, favoritos e mais.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerButtonText}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          {/* Centered User Icon */}
          <View style={styles.avatarContainer}>
            <Image source={userIcon} style={styles.avatarImage} />
          </View>

          {/* Name below icon */}
          <Text style={styles.userName}>{currentUser.name}</Text>

          {/* Created date below name */}
          <Text style={styles.userCreatedDate}>
            Membro desde {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'N/A'}
          </Text>

        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'wishes' && styles.tabActive]}
            onPress={() => setActiveTab('wishes')}
          >
            <Text style={[styles.tabText, activeTab === 'wishes' && styles.tabTextActive]}>
              Desejos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'shopping' && styles.tabActive]}
            onPress={() => setActiveTab('shopping')}
          >
            <Text style={[styles.tabText, activeTab === 'shopping' && styles.tabTextActive]}>
              Compras
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'message' && styles.tabActive]}
            onPress={() => setActiveTab('message')}
          >
            <Text style={[styles.tabText, activeTab === 'message' && styles.tabTextActive]}>
              Mensagens
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.homeButtonText}>Levar as compras para casa</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  logoutButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '300',
    color: '#111827',
  },
  profileSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 90,
    height: 90,
    marginBottom: 12,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 60,
    height: 60,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  userCreatedDate: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  viewOrdersButton: {
    marginTop: 16,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewOrdersButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 20,
  },
  homeButton: {
    backgroundColor: '#000000',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 24,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  loginButton: {
    marginTop: 32,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButton: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  registerButtonText: {
    color: '#3b82f6',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
