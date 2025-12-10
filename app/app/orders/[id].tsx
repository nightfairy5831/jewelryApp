import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { orderApi, type Order } from '../../services/api';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const { authToken, fetchOrders } = useAppStore();
  const [order, setOrder] = useState<Order | null>(null);
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
    } catch (error) {
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
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
      case 'pending': return '#FFA500';
      case 'confirmed': return '#2196F3';
      case 'shipped': return '#9C27B0';
      case 'delivered': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#666';
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
          <Text style={styles.headerTitle}>Order Details</Text>
        </View>

        {/* Order Info Card */}
        <View style={styles.card}>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderNumber}>#{order.order_number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.orderDate}>
            Placed on {new Date(order.created_at).toLocaleDateString('pt-BR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Order Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Status</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, order.status !== 'cancelled' && styles.timelineDotActive]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Order Placed</Text>
                <Text style={styles.timelineDate}>
                  {new Date(order.created_at).toLocaleString('pt-BR')}
                </Text>
              </View>
            </View>

            {order.paid_at && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotActive]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Payment Confirmed</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(order.paid_at).toLocaleString('pt-BR')}
                  </Text>
                </View>
              </View>
            )}

            {order.shipped_at && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotActive]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Shipped</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(order.shipped_at).toLocaleString('pt-BR')}
                  </Text>
                  {order.tracking_number && (
                    <Text style={styles.trackingNumber}>
                      Tracking: {order.tracking_number}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {order.status === 'delivered' && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotActive]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Delivered</Text>
                </View>
              </View>
            )}

            {order.status === 'cancelled' && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#F44336' }]} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: '#F44336' }]}>Cancelled</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shipping Address</Text>
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
          <Text style={styles.cardTitle}>Order Items ({order.items?.length || 0})</Text>
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
          <Text style={styles.cardTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>
              R$ {(Number(order.total_amount) - Number(order.shipping_amount) - Number(order.tax_amount)).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping:</Text>
            <Text style={styles.summaryValue}>R$ {Number(order.shipping_amount).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax:</Text>
            <Text style={styles.summaryValue}>R$ {Number(order.tax_amount).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>R$ {Number(order.total_amount).toFixed(2)}</Text>
          </View>
          <View style={styles.paymentMethodContainer}>
            <Ionicons name="card-outline" size={20} color="#666" />
            <Text style={styles.paymentMethodText}>
              {order.payment?.payment_method === 'credit_card' && 'Credit Card'}
              {order.payment?.payment_method === 'pix' && 'PIX'}
              {order.payment?.payment_method === 'boleto' && 'Boleto'}
            </Text>
          </View>
        </View>

        {/* Cancel Button */}
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
                  <Text style={styles.cancelButtonText}>Cancel Order</Text>
                </>
              )}
            </TouchableOpacity>
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
});
