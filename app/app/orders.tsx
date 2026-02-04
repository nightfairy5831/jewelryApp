import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import type { Order } from '../services/api';
import { orderApi } from '../services/api';
import OrderCard from '../components/order/OrderCard';

export default function OrdersScreen() {
  const { orders, authToken, fetchOrders } = useAppStore();
  const isAuthenticated = !!authToken;
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleViewAddress = (order: Order) => {
    setSelectedOrder(order);
    setAddressModalVisible(true);
  };

  const handleViewReason = (order: Order) => {
    setSelectedOrder(order);
    setReasonModalVisible(true);
  };

  const handleCompletePayment = (order: Order) => {
    router.push(`/payment/${order.id}`);
  };

  const handleCancelOrder = (order: Order) => {
    if (!authToken) return;

    Alert.alert(
      'Cancelar Pedido',
      'Tem certeza que deseja cancelar este pedido?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderApi.cancelOrder(authToken, order.id);
              Alert.alert('Pedido cancelado', 'Seu pedido foi cancelado com sucesso.');
              fetchOrders();
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Falha ao cancelar pedido');
            }
          },
        },
      ]
    );
  };

  const handleConfirmDelivery = async (order: Order) => {
    if (!authToken) return;

    Alert.alert(
      'Confirmar Recebimento',
      'Você confirma que recebeu o produto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setConfirmingDelivery(order.id);
            try {
              await orderApi.confirmDelivery(authToken, order.id);
              Alert.alert('Sucesso!', 'Entrega confirmada com sucesso.');
              fetchOrders();
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Falha ao confirmar entrega');
            } finally {
              setConfirmingDelivery(null);
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Login Necessário</Text>
          <Text style={styles.emptyText}>Faça login para ver seus pedidos</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Ionicons name="receipt-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Nenhum pedido</Text>
          <Text style={styles.emptyText}>Comece a comprar para ver seus pedidos aqui</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.shopButtonText}>Começar a Comprar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Meus Pedidos</Text>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.ordersContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            viewType="buyer"
            onViewAddress={handleViewAddress}
            onViewReason={handleViewReason}
            onConfirmDelivery={handleConfirmDelivery}
            onCompletePayment={handleCompletePayment}
            onCancelOrder={handleCancelOrder}
            isLoading={confirmingDelivery === order.id}
          />
        ))}
      </ScrollView>

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
                  </View>
                </View>
              </View>
            ) : (
              <Text style={styles.noDataText}>Endereço não disponível</Text>
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

      {/* Cancellation Reason Modal */}
      <Modal
        visible={reasonModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReasonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Motivo do Cancelamento</Text>

            <Text style={styles.reasonText}>
              {selectedOrder?.cancellation_reason || 'Motivo não informado pelo vendedor.'}
            </Text>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setReasonModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  ordersContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  shopButton: {
    marginTop: 24,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: 24,
    backgroundColor: '#333',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    marginBottom: 16,
  },
  addressContainer: {
    marginBottom: 20,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
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
  },
  noDataText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 20,
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 20,
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
