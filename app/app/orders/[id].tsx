import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { orderApi, paymentApi, type Order, type OrderPaymentStatus } from '../../services/api';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const { authToken, fetchOrders } = useAppStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<OrderPaymentStatus['payments']>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    if (!authToken || !id) return;

    try {
      setLoading(true);
      const orderData = await orderApi.getOrderById(authToken, Number(id));
      setOrder(orderData);

      // Load payment details for refund functionality
      try {
        const paymentStatus = await paymentApi.getOrderPaymentStatus(authToken, Number(id));
        setPayments(paymentStatus.payments);
      } catch {
        // Payments may not exist yet
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundRequest = (payment: OrderPaymentStatus['payments'][0]) => {
    router.push({
      pathname: '/refund/[paymentId]',
      params: {
        paymentId: payment.id.toString(),
        amount: payment.amount.toString(),
        sellerName: payment.seller_name,
        orderNumber: order?.order_number || '',
      },
    });
  };

  const handleCancelOrder = async () => {
    if (!authToken || !order) return;

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await orderApi.cancelOrder(authToken, order.id);
              await fetchOrders();
              await loadOrder();
              Alert.alert('Success', 'Order cancelled successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel order');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Order not found</Text>
        </View>
      </View>
    );
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '#9ca3af';
      case 'confirmed': return '#f97316';
      case 'accepted': return '#f97316';
      case 'shipped': return '#2563eb';
      case 'delivered': return '#16a34a';
      case 'cancelled': return '#dc2626';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Aguardando pagamento';
      case 'confirmed': return 'Aguardando o vendedor';
      case 'accepted': return 'Aguardando envio';
      case 'shipped': return 'Postado';
      case 'delivered': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Pedido</Text>
        </View>

        {/* Order Info Card */}
        <View style={styles.card}>
          <View style={styles.orderInfoRow}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusTextWhite}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
            {order.status === 'cancelled' && order.cancellation_reason && (
              <TouchableOpacity
                onPress={() => Alert.alert('Motivo do cancelamento', order.cancellation_reason)}
              >
                <Text style={styles.seeReasonText}>Ver motivo</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.orderDate}>
            Compra feita dia {new Date(order.created_at).toLocaleDateString('pt-BR')}
          </Text>
        </View>

        {/* Tracking Info - Only for shipped/delivered orders */}
        {order.tracking_number && ['shipped', 'delivered'].includes(order.status) && (
          <View style={styles.card}>
            <View style={styles.trackingContainer}>
              <View style={styles.trackingInfo}>
                <Ionicons name="cube-outline" size={20} color="#111827" />
                <Text style={styles.trackingCode} numberOfLines={1}>
                  {order.tracking_number}
                </Text>
              </View>
              <TouchableOpacity style={styles.trackingButton}>
                <Text style={styles.trackingButtonText}>Rastreamento</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.trackingHint}>
              Seu pedido foi postado, confirme quando ele chegar.
            </Text>
          </View>
        )}

        {/* Status Message */}
        <View style={styles.card}>
          <Text style={styles.statusMessage}>
            {order.status === 'pending' && 'Aguardando confirmação do pagamento.'}
            {order.status === 'confirmed' && 'Aguardando o vendedor confirmar o seu pedido.'}
            {order.status === 'accepted' && 'Seu pedido foi aceito e está sendo confeccionado.'}
            {order.status === 'shipped' && 'Seu pedido foi postado, confirme quando ele chegar.'}
            {order.status === 'delivered' && 'Pedido entregue com sucesso!'}
            {order.status === 'cancelled' && 'Seu pedido foi cancelado pelo vendedor.'}
          </Text>
        </View>

        {/* Shipping Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Endereço de Entrega</Text>
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={24} color="#666" />
            <View style={styles.addressText}>
              <Text style={styles.addressLine}>{order.shipping_address.street}</Text>
              <Text style={styles.addressLine}>
                {order.shipping_address.city}, {order.shipping_address.state}
              </Text>
              <Text style={styles.addressLine}>{order.shipping_address.postal_code}</Text>
              <Text style={styles.addressLine}>{order.shipping_address.country}</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Itens do Pedido ({order.items?.length || 0})</Text>
          {order.items?.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Image
                source={{ uri: item.product?.thumbnail || item.product?.images?.[0] || 'https://via.placeholder.com/60' }}
                style={styles.itemImage}
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product?.name || 'Product'}
                </Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                <Text style={styles.itemPrice}>R$ {Number(item.unit_price).toFixed(2)}</Text>
              </View>
              <Text style={styles.itemTotal}>R$ {Number(item.total_price).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo do Pagamento</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>
              R$ {(Number(order.total_amount) - Number(order.shipping_amount) - Number(order.tax_amount)).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frete:</Text>
            <Text style={styles.summaryValue}>R$ {Number(order.shipping_amount).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxas:</Text>
            <Text style={styles.summaryValue}>R$ {Number(order.tax_amount).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>R$ {Number(order.total_amount).toFixed(2)}</Text>
          </View>
          <View style={styles.paymentMethodContainer}>
            <Ionicons name="card-outline" size={20} color="#666" />
            <Text style={styles.paymentMethodText}>
              {order.payment?.payment_method === 'credit_card' && 'Cartão de Crédito'}
              {order.payment?.payment_method === 'pix' && 'PIX'}
              {order.payment?.payment_method === 'boleto' && 'Boleto'}
            </Text>
          </View>
        </View>

        {/* Cancel Button - Only for pending orders */}
        {order.status === 'pending' && (
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.cancelButton, cancelling && styles.cancelButtonDisabled]}
              onPress={handleCancelOrder}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={24} color="#fff" />
                  <Text style={styles.cancelButtonText}>Cancelar Pedido</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Refund Request Section - Show for accepted/shipped/delivered orders with completed payments */}
        {['accepted', 'shipped', 'delivered'].includes(order.status) && payments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Solicitar Reembolso</Text>
            <Text style={styles.refundInfo}>
              Caso tenha algum problema com seu pedido, você pode solicitar reembolso para cada vendedor.
            </Text>
            {payments
              .filter(p => p.status === 'completed')
              .map((payment) => (
                <View key={payment.id} style={styles.refundPaymentCard}>
                  <View style={styles.refundPaymentInfo}>
                    <Text style={styles.refundSellerName}>{payment.seller_name}</Text>
                    <Text style={styles.refundAmount}>R$ {Number(payment.amount).toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.refundButton}
                    onPress={() => handleRefundRequest(payment)}
                  >
                    <Ionicons name="return-down-back" size={16} color="#D4AF37" />
                    <Text style={styles.refundButtonText}>Solicitar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            {payments.filter(p => p.status === 'refunded').length > 0 && (
              <View style={styles.refundedSection}>
                <Text style={styles.refundedTitle}>Reembolsados:</Text>
                {payments
                  .filter(p => p.status === 'refunded')
                  .map((payment) => (
                    <View key={payment.id} style={styles.refundedItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.refundedText}>
                        {payment.seller_name} - R$ {Number(payment.amount).toFixed(2)}
                      </Text>
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTextWhite: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  seeReasonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    textDecorationLine: 'underline',
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  trackingCode: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  trackingButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trackingButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  trackingHint: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    marginTop: 4,
    marginRight: 12,
  },
  timelineDotActive: {
    backgroundColor: '#D4AF37',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timelineDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  trackingNumber: {
    fontSize: 14,
    color: '#D4AF37',
    marginTop: 4,
    fontWeight: '600',
  },
  addressContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addressText: {
    flex: 1,
  },
  addressLine: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: '#F44336',
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  refundInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  refundPaymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  refundPaymentInfo: {
    flex: 1,
  },
  refundSellerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  refundAmount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  refundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 6,
    gap: 4,
  },
  refundButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4AF37',
  },
  refundedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  refundedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  refundedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  refundedText: {
    fontSize: 14,
    color: '#4CAF50',
  },
});
