import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { sellerApi, type SellerDashboard } from '../../services/api';
import FABMenu from '../../components/FABMenu';

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { currentUser, authToken, isAuthenticated } = useAppStore();

  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchDashboard();
    }
  }, [isAuthenticated, authToken]);

  const fetchDashboard = async () => {
    if (!authToken) return;

    try {
      setError(null);
      const data = await sellerApi.getDashboard(authToken);
      setDashboard(data);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="log-in-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Please login to access seller dashboard</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (currentUser?.role !== 'seller') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Seller access required</Text>
          <Text style={styles.emptySubtext}>
            Request seller role from your profile settings
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboard}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const analytics = dashboard?.analytics;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Painel do Vendedor</Text>
        <Text style={styles.headerSubtitle}>Bem-vindo, {currentUser?.name}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="cube-outline" size={24} color="#2563eb" />
            </View>
            <Text style={styles.statValue}>{analytics?.products.total || 0}</Text>
            <Text style={styles.statLabel}>Produtos</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#16a34a" />
            </View>
            <Text style={styles.statValue}>{analytics?.products.approved || 0}</Text>
            <Text style={styles.statLabel}>Aprovados</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="time-outline" size={24} color="#ca8a04" />
            </View>
            <Text style={styles.statValue}>{analytics?.products.pending || 0}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fce7f3' }]}>
              <Ionicons name="cart-outline" size={24} color="#be185d" />
            </View>
            <Text style={styles.statValue}>{analytics?.orders.total || 0}</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </View>
        </View>

        {/* Revenue Card */}
        {analytics && analytics.orders.revenue > 0 && (
          <View style={styles.revenueCard}>
            <View style={styles.revenueHeader}>
              <Ionicons name="trending-up" size={24} color="#16a34a" />
              <Text style={styles.revenueTitle}>Receita Total</Text>
            </View>
            <Text style={styles.revenueValue}>
              R$ {analytics.orders.revenue.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/seller/product-form')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="add-circle" size={32} color="#2563eb" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Adicionar Produto</Text>
              <Text style={styles.actionDescription}>
                Cadastre um novo produto para venda
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/seller-products')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="list" size={32} color="#2563eb" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Meus Produtos</Text>
              <Text style={styles.actionDescription}>
                Visualize e gerencie seus produtos
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/seller-orders')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="receipt-outline" size={32} color="#2563eb" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Meus Pedidos</Text>
              <Text style={styles.actionDescription}>
                Gerencie pedidos e envios
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Recent Products */}
        {dashboard?.recent_products && dashboard.recent_products.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Produtos Recentes</Text>
            {dashboard.recent_products.slice(0, 3).map((product: any) => (
              <View key={product.id} style={styles.listItem}>
                <Ionicons name="cube" size={20} color="#2563eb" />
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{product.name}</Text>
                  <Text style={styles.listItemSubtitle}>
                    Status: {product.status} • R$ {parseFloat(product.current_price || product.base_price).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Orders */}
        {dashboard?.recent_orders && dashboard.recent_orders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pedidos Recentes</Text>
            {dashboard.recent_orders.slice(0, 3).map((order: any) => (
              <View key={order.id} style={styles.listItem}>
                <Ionicons name="receipt" size={20} color="#be185d" />
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>#{order.order_number}</Text>
                  <Text style={styles.listItemSubtitle}>
                    {order.status} • R$ {parseFloat(order.total_amount).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB Menu */}
      <FABMenu mode="main" />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  revenueCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  revenueTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginLeft: 8,
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#15803d',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIconContainer: {
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});
