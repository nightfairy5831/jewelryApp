import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { router } from 'expo-router';
import type { Order } from '../../services/api';
import OrderCard from '../../components/order/OrderCard';

const userIcon = require('../../assets/user.png');

interface Review {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

export default function PerfilScreen() {
  const { logout, authToken, orders, fetchOrders } = useAppStore();
  const { user: currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'compras' | 'avaliacoes'>('compras');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authToken && activeTab === 'compras') {
      fetchOrders();
    }
  }, [authToken, activeTab]);

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
            try {
              await logout();
            } catch (error) {
              console.error('Logout failed:', error);
            } finally {
              // Always navigate to home after logout attempt
              router.replace('/(tabs)');
            }
          },
        },
      ]
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)')}>
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
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerButton} onPress={() => router.push('/auth/register')}>
            <Text style={styles.registerButtonText}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleViewReason = (order: Order) => {
    Alert.alert('Motivo do cancelamento', order.cancellation_reason || 'Sem motivo informado');
  };

  const handleConfirmDelivery = async (order: Order) => {
    Alert.alert(
      'Confirmar entrega',
      'Confirma que recebeu o pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => {
          // TODO: Call API to confirm delivery
        }},
      ]
    );
  };

  const renderComprasTab = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      );
    }

    if (orders.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="bag-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>Nenhuma compra realizada</Text>
        </View>
      );
    }

    return (
      <View style={styles.orderList}>
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            viewType="buyer"
            onViewReason={handleViewReason}
            onConfirmDelivery={handleConfirmDelivery}
          />
        ))}
      </View>
    );
  };

  const renderAvaliacoesTab = () => {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="star-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyStateText}>Nenhuma avaliação</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image source={userIcon} style={styles.avatarImage} />
          </View>
          <Text style={styles.userName}>{currentUser.name}</Text>
          <Text style={styles.userCreatedDate}>
            Membro desde {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'N/A'}
          </Text>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'compras' && styles.tabActive]}
            onPress={() => setActiveTab('compras')}
          >
            <Text style={[styles.tabText, activeTab === 'compras' && styles.tabTextActive]}>
              Compras
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'avaliacoes' && styles.tabActive]}
            onPress={() => setActiveTab('avaliacoes')}
          >
            <Text style={[styles.tabText, activeTab === 'avaliacoes' && styles.tabTextActive]}>
              Avaliações
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'compras' && renderComprasTab()}
          {activeTab === 'avaliacoes' && renderAvaliacoesTab()}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.homeButtonText}>Levar as compras para casa</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#fff',
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
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827', marginLeft: 12 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: 20, fontWeight: '300', color: '#111827' },
  logoutButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  profileSection: { backgroundColor: '#fff', padding: 20, marginBottom: 8, alignItems: 'center' },
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
  avatarImage: { width: 60, height: 60 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  userCreatedDate: { fontSize: 14, color: '#6b7280' },
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
  tabActive: { backgroundColor: '#000' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  tabContent: { padding: 16, paddingBottom: 100 },
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 14, color: '#6b7280', marginTop: 12 },
  productList: { gap: 12 },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  orderNumber: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  purchaseDate: { fontSize: 12, color: '#9ca3af' },
  reviewButton: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewButtonDisabled: { backgroundColor: '#e5e7eb' },
  reviewButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  reviewButtonTextDisabled: { color: '#9ca3af' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 20,
  },
  homeButton: { backgroundColor: '#000', height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  homeButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  guestTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 24, textAlign: 'center' },
  guestSubtitle: { fontSize: 16, color: '#6b7280', marginTop: 12, textAlign: 'center', lineHeight: 24 },
  loginButton: {
    marginTop: 32,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  registerButton: {
    marginTop: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  registerButtonText: { color: '#3b82f6', fontSize: 18, fontWeight: 'bold' },
  shopNowButton: {
    marginTop: 16,
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopNowButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  wishlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wishlistCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  wishlistImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
  },
  removeWishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 6,
  },
  wishlistInfo: {
    padding: 10,
  },
  wishlistProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  wishlistPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  // Order card styles
  orderList: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orderItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderItemRatingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  orderStatusMessage: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  orderCardFooter: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderFooterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
  },
  orderFooterButtonBlue: {
    backgroundColor: '#2563eb',
  },
  orderFooterButtonBlack: {
    backgroundColor: '#000',
  },
  orderFooterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  orderFooterButtonTextWhite: {
    color: '#fff',
  },
});
