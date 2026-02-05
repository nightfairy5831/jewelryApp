import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { sellerApi, messageApi, refundApi, type SellerDashboard } from '../../services/api';
import FABMenu from '../../components/FABMenu';
import GoldPriceIndicator from '../../components/ui/GoldPriceIndicator';

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { authToken, logout } = useAppStore();
  const { user: currentUser, isAuthenticated } = useCurrentUser();

  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mpStatus, setMpStatus] = useState<{ connected: boolean; user_id: string | null }>({ connected: false, user_id: null });
  const [mpLoading, setMpLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [refundCount, setRefundCount] = useState(0);
  const [pollingForMp, setPollingForMp] = useState(false);

  // Check if seller can perform actions (must be approved and have MP connected)
  const isApproved = currentUser?.seller_status === 'approved';
  const canPerformActions = isApproved && mpStatus.connected;

  const fetchMpStatus = useCallback(async () => {
    if (!authToken) return;
    try {
      const status = await sellerApi.getMercadoPagoStatus(authToken);
      setMpStatus(status);
    } catch (err) {
      console.error('Error fetching MP status:', err);
    }
  }, [authToken]);

  const fetchMessageCount = useCallback(async () => {
    if (!authToken) return;
    try {
      const messages = await messageApi.getMyMessages(authToken);
      setMessageCount(messages?.length || 0);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [authToken]);

  const fetchRefundCount = useCallback(async () => {
    if (!authToken) return;
    try {
      const refunds = await refundApi.getSellerRefunds(authToken);
      setRefundCount(refunds?.refund_requests?.length || 0);
    } catch (err) {
      console.error('Error fetching refunds:', err);
    }
  }, [authToken]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'seller' && authToken) {
      fetchDashboard();
      fetchMpStatus();
      fetchMessageCount();
      fetchRefundCount();
    } else if (!isAuthenticated || (currentUser && currentUser.role !== 'seller')) {
      setLoading(false);
    }
  }, [isAuthenticated, authToken, currentUser]);

  // Poll for MP connection status after OAuth
  useEffect(() => {
    if (!pollingForMp || !authToken) return;

    let pollCount = 0;
    const maxPolls = 30; 
    const pollInterval = 1000; // Poll every second

    const interval = setInterval(async () => {
      pollCount++;

      try {
        const status = await sellerApi.getMercadoPagoStatus(authToken);

        if (status.connected && !mpStatus.connected) {
          setMpStatus(status);
          setPollingForMp(false);
          Alert.alert(
            'Sucesso!',
            'Sua conta do Mercado Pago foi conectada com sucesso.',
            [{ text: 'OK' }]
          );
          clearInterval(interval);
        } else if (pollCount >= maxPolls) {
          setPollingForMp(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling MP status:', err);
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollingForMp, authToken, mpStatus.connected]);

  const fetchDashboard = async () => {
    if (!authToken) return;

    try {
      setError(null);
      const data = await sellerApi.getDashboard(authToken);
      setDashboard(data);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);

      // If session expired, clear all user data and redirect to index
      if (err.message?.includes('Session expired')) {
        await logout();
        router.replace('/(tabs)');
        return;
      }

      setError(err.message || 'Falha ao carregar o painel');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectMercadoPago = async () => {
    if (!authToken) return;

    setMpLoading(true);
    try {
      const { oauth_url } = await sellerApi.getMercadoPagoOAuthUrl(authToken);

      if (oauth_url) {
        // Open OAuth URL for both sandbox and production modes
        await Linking.openURL(oauth_url);

        // Start polling for connection status
        setPollingForMp(true);

        Alert.alert(
          'Autenticação Iniciada',
          'Complete o processo de autenticação no navegador. Quando terminar, feche a janela do navegador e volte ao aplicativo.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Erro', 'URL de autenticação não disponível');
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao conectar com Mercado Pago');
    } finally {
      setMpLoading(false);
    }
  };

  const handleDisconnectMercadoPago = () => {
    Alert.alert(
      'Desconectar Mercado Pago',
      'Tem certeza que deseja desconectar sua conta do Mercado Pago? Você não poderá receber pagamentos até reconectar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            if (!authToken) return;
            setMpLoading(true);
            try {
              await sellerApi.disconnectMercadoPago(authToken);
              setMpStatus({ connected: false, user_id: null });
              Alert.alert('Sucesso', 'Conta do Mercado Pago desconectada');
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Falha ao desconectar');
            } finally {
              setMpLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="log-in-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Faça login para acessar o painel do vendedor</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (currentUser?.role !== 'seller') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Acesso de vendedor necessário</Text>
          <Text style={styles.emptySubtext}>
            Solicite o papel de vendedor nas configurações do seu perfil
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
          <Text style={styles.loadingText}>Carregando painel...</Text>
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
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
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
      >
        {/* Gold Price Indicator */}
        <View style={styles.goldPriceContainer}>
          <GoldPriceIndicator />
        </View>

        {/* Status Banner - Show when not approved or MP not connected */}
        {(!isApproved || !mpStatus.connected) && (
          <View style={styles.statusBanner}>
            <View style={styles.statusBannerContent}>
              <Ionicons
                name={!mpStatus.connected ? "card-outline" : "time-outline"}
                size={24}
                color={!mpStatus.connected ? "#dc2626" : "#ca8a04"}
              />
              <View style={styles.statusBannerText}>
                <Text style={styles.statusBannerTitle}>
                  {!mpStatus.connected
                    ? "Conecte sua conta Mercado Pago"
                    : "Aguardando aprovação"}
                </Text>
                <Text style={styles.statusBannerDescription}>
                  {!mpStatus.connected
                    ? "Você precisa conectar sua conta para receber pagamentos e ser aprovado como vendedor."
                    : "Sua conta está em análise. Você poderá gerenciar produtos após aprovação."}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Mercado Pago Connection Card */}
        <View style={styles.mpCard}>
          <View style={styles.mpCardHeader}>
            <View style={styles.mpLogoContainer}>
              <Ionicons name="card" size={28} color="#009ee3" />
            </View>
            <View style={styles.mpCardInfo}>
              <Text style={styles.mpCardTitle}>Mercado Pago</Text>
              <Text style={[
                styles.mpCardStatus,
                { color: mpStatus.connected ? '#16a34a' : '#dc2626' }
              ]}>
                {mpStatus.connected ? 'Conectado' : 'Não conectado'}
              </Text>
            </View>
          </View>

          {mpStatus.connected ? (
            <View style={styles.mpConnectedInfo}>
              <Text style={styles.mpUserId}>ID: {mpStatus.user_id}</Text>
              <TouchableOpacity
                style={styles.mpDisconnectButton}
                onPress={handleDisconnectMercadoPago}
                disabled={mpLoading}
              >
                {mpLoading ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <Text style={styles.mpDisconnectText}>Desconectar</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.mpConnectButton}
              onPress={handleConnectMercadoPago}
              disabled={mpLoading}
            >
              {mpLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="link" size={20} color="#ffffff" />
                  <Text style={styles.mpConnectText}>Conectar Mercado Pago</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => canPerformActions && router.push('/(tabs)/seller-products')}
            disabled={!canPerformActions}
          >
            <View style={[styles.statIconContainer, { backgroundColor: '#bfdbfe' }]}>
              <Ionicons name="cube-outline" size={24} color="#1e40af" />
            </View>
            <Text style={styles.statValue}>{analytics?.products.total || 0}</Text>
            <Text style={styles.statLabel}>Produtos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => canPerformActions && router.push('/(tabs)/seller-orders')}
            disabled={!canPerformActions}
          >
            <View style={[styles.statIconContainer, { backgroundColor: '#bbf7d0' }]}>
              <Ionicons name="receipt-outline" size={24} color="#15803d" />
            </View>
            <Text style={styles.statValue}>{analytics?.orders.total || 0}</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => canPerformActions && router.push('/(tabs)/seller-messages')}
            disabled={!canPerformActions}
          >
            <View style={[styles.statIconContainer, { backgroundColor: '#e9d5ff' }]}>
              <Ionicons name="chatbubbles-outline" size={24} color="#7c3aed" />
            </View>
            <Text style={styles.statValue}>{messageCount}</Text>
            <Text style={styles.statLabel}>Mensagens</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => canPerformActions && router.push('/(tabs)/seller-refunds')}
            disabled={!canPerformActions}
          >
            <View style={[styles.statIconContainer, { backgroundColor: '#fed7aa' }]}>
              <Ionicons name="cash-outline" size={24} color="#ea580c" />
            </View>
            <Text style={styles.statValue}>{refundCount}</Text>
            <Text style={styles.statLabel}>Reembolsos</Text>
          </TouchableOpacity>
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
            style={[styles.actionCard, !canPerformActions && styles.actionCardDisabled]}
            onPress={() => canPerformActions && router.push('/(tabs)/product-form')}
            disabled={!canPerformActions}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="add-circle" size={32} color={canPerformActions ? "#2563eb" : "#9ca3af"} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, !canPerformActions && styles.actionTitleDisabled]}>
                Adicionar Produto
              </Text>
              <Text style={styles.actionDescription}>
                {canPerformActions
                  ? "Cadastre um novo produto para venda"
                  : "Conecte o MP e aguarde aprovação"}
              </Text>
            </View>
            {canPerformActions ? (
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            ) : (
              <Ionicons name="lock-closed" size={24} color="#9ca3af" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, !canPerformActions && styles.actionCardDisabled]}
            onPress={() => canPerformActions && router.push('/(tabs)/seller-products')}
            disabled={!canPerformActions}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="list" size={32} color={canPerformActions ? "#2563eb" : "#9ca3af"} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, !canPerformActions && styles.actionTitleDisabled]}>
                Meus Produtos
              </Text>
              <Text style={styles.actionDescription}>
                {canPerformActions
                  ? "Visualize e gerencie seus produtos"
                  : "Conecte o MP e aguarde aprovação"}
              </Text>
            </View>
            {canPerformActions ? (
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            ) : (
              <Ionicons name="lock-closed" size={24} color="#9ca3af" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, !canPerformActions && styles.actionCardDisabled]}
            onPress={() => canPerformActions && router.push('/(tabs)/seller-orders')}
            disabled={!canPerformActions}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="receipt-outline" size={32} color={canPerformActions ? "#2563eb" : "#9ca3af"} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, !canPerformActions && styles.actionTitleDisabled]}>
                Minhas vendas
              </Text>
              <Text style={styles.actionDescription}>
                {canPerformActions
                  ? "Gerencie pedidos e envios"
                  : "Conecte o MP e aguarde aprovação"}
              </Text>
            </View>
            {canPerformActions ? (
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            ) : (
              <Ionicons name="lock-closed" size={24} color="#9ca3af" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, !canPerformActions && styles.actionCardDisabled]}
            onPress={() => canPerformActions && router.push('/(tabs)/seller-messages')}
            disabled={!canPerformActions}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="chatbubbles-outline" size={32} color={canPerformActions ? "#2563eb" : "#9ca3af"} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, !canPerformActions && styles.actionTitleDisabled]}>
                Mensagens
              </Text>
              <Text style={styles.actionDescription}>
                {canPerformActions
                  ? "Converse com seus clientes"
                  : "Conecte o MP e aguarde aprovação"}
              </Text>
            </View>
            {canPerformActions ? (
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            ) : (
              <Ionicons name="lock-closed" size={24} color="#9ca3af" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, !canPerformActions && styles.actionCardDisabled]}
            onPress={() => canPerformActions && router.push('/(tabs)/seller-refunds')}
            disabled={!canPerformActions}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="cash-outline" size={32} color={canPerformActions ? "#2563eb" : "#9ca3af"} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, !canPerformActions && styles.actionTitleDisabled]}>
                Reembolsos
              </Text>
              <Text style={styles.actionDescription}>
                {canPerformActions
                  ? "Gerenciar solicitações de reembolso"
                  : "Conecte o MP e aguarde aprovação"}
              </Text>
            </View>
            {canPerformActions ? (
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            ) : (
              <Ionicons name="lock-closed" size={24} color="#9ca3af" />
            )}
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
  goldPriceContainer: {
    padding: 16,
    paddingBottom: 0,
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
  // Status Banner Styles
  statusBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  statusBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  statusBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  statusBannerDescription: {
    fontSize: 13,
    color: '#a16207',
    lineHeight: 18,
  },
  // Mercado Pago Card Styles
  mpCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mpCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mpLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mpCardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  mpCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  mpCardStatus: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  mpConnectedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  mpUserId: {
    fontSize: 13,
    color: '#6b7280',
  },
  mpDisconnectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  mpDisconnectText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#dc2626',
  },
  mpConnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009ee3',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  mpConnectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Disabled Action Card Styles
  actionCardDisabled: {
    opacity: 0.6,
    backgroundColor: '#f3f4f6',
  },
  actionTitleDisabled: {
    color: '#9ca3af',
  },
});
