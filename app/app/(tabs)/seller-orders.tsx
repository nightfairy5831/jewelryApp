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
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { sellerApi } from '../../services/api';
import type { Order } from '../../services/api';
import OrderCard from '../../components/order/OrderCard';

export default function SellerOrdersScreen() {
  const router = useRouter();
  const { authToken } = useAppStore();
  const { user: currentUser } = useCurrentUser();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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

  const handleAccept = async (order: Order) => {
    if (!authToken) return;
    setActionLoading(order.id);

    try {
      await sellerApi.acceptOrder(authToken, order.id);
      Alert.alert('Sucesso!', 'Pedido aceito! Agora você pode confeccionar o produto.');
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao aceitar pedido');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (order: Order) => {
    setSelectedOrder(order);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    if (!authToken || !selectedOrder) return;

    if (!rejectReason.trim()) {
      Alert.alert('Erro', 'Digite o motivo da recusa');
      return;
    }

    setActionLoading(selectedOrder.id);

    try {
      await sellerApi.rejectOrder(authToken, selectedOrder.id, rejectReason.trim());
      Alert.alert('Pedido Recusado', 'O comprador será notificado.');
      setRejectModalVisible(false);
      setSelectedOrder(null);
      setRejectReason('');
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao recusar pedido');
    } finally {
      setActionLoading(null);
    }
  };

  const handleShip = async (order: Order, trackingNumber: string) => {
    if (!authToken) return;
    setActionLoading(order.id);

    try {
      await sellerApi.markAsShipped(authToken, order.id, trackingNumber);
      Alert.alert('Sucesso!', 'Produto enviado com sucesso');
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao enviar produto');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewAddress = (order: Order) => {
    setSelectedOrder(order);
    setAddressModalVisible(true);
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
          { key: 'confirmed', label: 'Novas' },
          { key: 'accepted', label: 'Aguardando' },
          { key: 'shipped', label: 'Postados' },
          { key: 'delivered', label: 'Concluídos' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={styles.filterTab}
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
        contentContainerStyle={styles.ordersContainer}
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
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              viewType="seller"
              onAccept={handleAccept}
              onReject={handleReject}
              onShip={handleShip}
              onViewAddress={handleViewAddress}
              isLoading={actionLoading === order.id}
            />
          ))
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Recusar Pedido</Text>
            <Text style={styles.modalSubtitle}>Pedido #{selectedOrder?.order_number}</Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Motivo da recusa *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Explique o motivo da recusa para o comprador..."
                value={rejectReason}
                onChangeText={setRejectReason}
                editable={actionLoading !== selectedOrder?.id}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setRejectModalVisible(false)}
                disabled={actionLoading === selectedOrder?.id}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalRejectButton}
                onPress={confirmReject}
                disabled={actionLoading === selectedOrder?.id}
              >
                {actionLoading === selectedOrder?.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalRejectText}>Recusar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Address Modal */}
      <Modal
        visible={addressModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Endereço de Entrega</Text>
            <Text style={styles.modalSubtitle}>Pedido #{selectedOrder?.order_number}</Text>

            {selectedOrder?.shipping_address ? (
              <View style={styles.addressContainer}>
                <View style={styles.addressRow}>
                  <Ionicons name="location" size={20} color="#2563eb" />
                  <View style={styles.addressDetails}>
                    <Text style={styles.addressStreet}>
                      {selectedOrder.shipping_address.street}
                    </Text>
                    <Text style={styles.addressCity}>
                      {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}
                    </Text>
                    <Text style={styles.addressPostal}>
                      CEP: {selectedOrder.shipping_address.postal_code}
                    </Text>
                    <Text style={styles.addressCountry}>
                      {selectedOrder.shipping_address.country}
                    </Text>
                  </View>
                </View>

                {selectedOrder.buyer && (
                  <View style={styles.buyerDetails}>
                    <Text style={styles.buyerLabel}>Destinatário:</Text>
                    <Text style={styles.buyerName}>{selectedOrder.buyer.name}</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.noAddressText}>Endereço não disponível</Text>
            )}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setAddressModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
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
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  ordersContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
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
    color: '#fff',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
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
  textArea: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    height: 100,
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
  modalRejectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
  },
  modalRejectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  addressContainer: {
    marginBottom: 20,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  addressDetails: {
    flex: 1,
  },
  addressStreet: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  addressCity: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  addressPostal: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  addressCountry: {
    fontSize: 13,
    color: '#6b7280',
  },
  buyerDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  buyerLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  buyerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  noAddressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 20,
  },
  modalCloseButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});
