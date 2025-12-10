import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { sellerApi } from '../../services/api';

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    id: number;
    name: string;
  };
}

interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  tracking_number?: string;
  created_at: string;
  buyer?: {
    name: string;
    email: string;
  };
  items: OrderItem[];
  payment?: {
    payment_method: string;
    status: string;
  };
}

export default function SellerOrdersScreen() {
  const router = useRouter();
  const { authToken, currentUser } = useAppStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shippingModalVisible, setShippingModalVisible] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingLoading, setShippingLoading] = useState(false);

  useEffect(() => {
    if (authToken) {
      fetchOrders();
    }
  }, [authToken, filterStatus]);

  const fetchOrders = async () => {
    if (!authToken) return;

    try {
      setError(null);
      const filters: any = {};

      if (filterStatus !== 'all') {
        filters.status = filterStatus;
      }

      const response = await sellerApi.getOrders(authToken, filters);
      setOrders(response.data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Falha ao carregar pedidos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleMarkAsShipped = (order: Order) => {
    setSelectedOrder(order);
    setTrackingNumber('');
    setShippingModalVisible(true);
  };

  const confirmShipping = async () => {
    if (!authToken || !selectedOrder) return;

    setShippingLoading(true);

    try {
      await sellerApi.markAsShipped(
        authToken,
        selectedOrder.id,
        trackingNumber.trim() || undefined
      );

      Alert.alert('Sucesso!', 'Pedido marcado como enviado');
      setShippingModalVisible(false);
      setSelectedOrder(null);
      setTrackingNumber('');
      fetchOrders();
    } catch (err: any) {
      console.error('Error marking as shipped:', err);
      Alert.alert('Erro', err.message || 'Falha ao marcar como enviado');
    } finally {
      setShippingLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f97316';
      case 'confirmed':
        return '#2563eb';
      case 'shipped':
        return '#7c3aed';
      case 'delivered':
        return '#16a34a';
      case 'cancelled':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'confirmed':
        return 'Confirmado';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (!currentUser || currentUser.role !== 'seller') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Acesso restrito a vendedores</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/seller-dashboard')}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Pedidos</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pending', label: 'Pendentes' },
          { key: 'shipped', label: 'Enviados' },
          { key: 'delivered', label: 'Entregues' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              filterStatus === filter.key && styles.filterTabActive,
            ]}
            onPress={() => {
              setFilterStatus(filter.key);
              setLoading(true);
            }}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === filter.key && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Carregando pedidos...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
            <Text style={styles.emptySubtext}>
              {filterStatus === 'all'
                ? 'Você ainda não recebeu pedidos'
                : 'Nenhum pedido com este status'}
            </Text>
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            {orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                {/* Order Header */}
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderNumber}>#{order.order_number}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(order.status)}20` },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                      {getStatusLabel(order.status)}
                    </Text>
                  </View>
                </View>

                {/* Buyer Info */}
                {order.buyer && (
                  <View style={styles.buyerInfo}>
                    <Ionicons name="person-outline" size={16} color="#6b7280" />
                    <Text style={styles.buyerText}>{order.buyer.name}</Text>
                  </View>
                )}

                {/* Order Items */}
                <View style={styles.itemsContainer}>
                  {order.items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.product?.name || `Produto #${item.product_id}`}
                      </Text>
                      <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                      <Text style={styles.itemPrice}>R$ {parseFloat(item.total_price.toString()).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                {/* Order Total */}
                <View style={styles.orderTotal}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    R$ {parseFloat(order.total_amount.toString()).toFixed(2)}
                  </Text>
                </View>

                {/* Payment Info */}
                {order.payment && (
                  <View style={styles.paymentInfo}>
                    <Ionicons name="card-outline" size={14} color="#6b7280" />
                    <Text style={styles.paymentText}>
                      {order.payment.payment_method.replace('_', ' ')} • {order.payment.status}
                    </Text>
                  </View>
                )}

                {/* Tracking Number */}
                {order.tracking_number && (
                  <View style={styles.trackingInfo}>
                    <Ionicons name="cube-outline" size={14} color="#7c3aed" />
                    <Text style={styles.trackingText}>
                      Rastreio: {order.tracking_number}
                    </Text>
                  </View>
                )}

                {/* Action Button */}
                {order.status === 'confirmed' && (
                  <TouchableOpacity
                    style={styles.shipButton}
                    onPress={() => handleMarkAsShipped(order)}
                  >
                    <Ionicons name="send" size={16} color="#ffffff" />
                    <Text style={styles.shipButtonText}>Marcar como Enviado</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Shipping Modal */}
      <Modal
        visible={shippingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShippingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Marcar como Enviado</Text>
            <Text style={styles.modalSubtitle}>
              Pedido #{selectedOrder?.order_number}
            </Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Número de Rastreamento (opcional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: BR123456789BR"
                value={trackingNumber}
                onChangeText={setTrackingNumber}
                editable={!shippingLoading}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShippingModalVisible(false)}
                disabled={shippingLoading}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmShipping}
                disabled={shippingLoading}
              >
                {shippingLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 0,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTabActive: {
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabTextActive: {
    color: '#2563eb',
    fontWeight: '600',
    borderBottomColor: '#2563eb',
  },
  content: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  errorText: {
    fontSize: 14,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
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
  ordersContainer: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  orderDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  buyerText: {
    fontSize: 13,
    color: '#6b7280',
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#6b7280',
    marginHorizontal: 12,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#faf5ff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  trackingText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
  },
  shipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  shipButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  modalInputGroup: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
