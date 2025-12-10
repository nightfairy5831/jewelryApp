import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { useState } from 'react';
import { router } from 'expo-router';
import { orderApi, type ShippingAddress } from '../services/api';

export default function CheckoutScreen() {
  const { cart, authToken, isAuthenticated, fetchCart, fetchOrders } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'boleto'>('credit_card');

  const [address, setAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Brazil',
  });

  // Require authentication for checkout
  if (!isAuthenticated || !authToken) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.header}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={80} color="#3b82f6" />
          <Text style={styles.emptyTitle}>Faça login para continuar</Text>
          <Text style={styles.emptySubtitle}>
            Você precisa estar logado para finalizar sua compra
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.shopButtonText}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryShopButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.secondaryShopButtonText}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!cart || cart.cart.items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handlePlaceOrder = async () => {
    // Validate address
    if (!address.street || !address.city || !address.state || !address.postal_code) {
      Alert.alert('Error', 'Please fill in all shipping address fields');
      return;
    }

    if (!authToken) {
      Alert.alert('Error', 'Please login to place an order');
      return;
    }

    setLoading(true);
    try {
      const response = await orderApi.createOrder(authToken, {
        shipping_address: address,
        payment_method: paymentMethod,
      });

      // Refresh cart and orders
      await fetchCart();
      await fetchOrders();

      // Navigate to payment screen
      router.push(`/payment/${response.order.id}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.header}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              {cart.cart.items.length} item(s)
            </Text>
            <Text style={styles.summaryAmount}>R$ {cart.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Street Address"
              value={address.street}
              onChangeText={(text) => setAddress({ ...address, street: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="City"
              value={address.city}
              onChangeText={(text) => setAddress({ ...address, city: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="State"
              value={address.state}
              onChangeText={(text) => setAddress({ ...address, state: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Postal Code"
              value={address.postal_code}
              onChangeText={(text) => setAddress({ ...address, postal_code: text })}
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'credit_card' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('credit_card')}
          >
            <Ionicons
              name={paymentMethod === 'credit_card' ? 'radio-button-on' : 'radio-button-off'}
              size={24}
              color={paymentMethod === 'credit_card' ? '#D4AF37' : '#666'}
            />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Credit Card</Text>
              <Text style={styles.paymentSubtitle}>Pay securely with your card</Text>
            </View>
            <Ionicons name="card-outline" size={32} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'pix' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('pix')}
          >
            <Ionicons
              name={paymentMethod === 'pix' ? 'radio-button-on' : 'radio-button-off'}
              size={24}
              color={paymentMethod === 'pix' ? '#D4AF37' : '#666'}
            />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>PIX</Text>
              <Text style={styles.paymentSubtitle}>Instant payment</Text>
            </View>
            <Ionicons name="flash-outline" size={32} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'boleto' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('boleto')}
          >
            <Ionicons
              name={paymentMethod === 'boleto' ? 'radio-button-on' : 'radio-button-off'}
              size={24}
              color={paymentMethod === 'boleto' ? '#D4AF37' : '#666'}
            />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Boleto</Text>
              <Text style={styles.paymentSubtitle}>Pay with bank slip</Text>
            </View>
            <Ionicons name="document-text-outline" size={32} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Order Total */}
        <View style={styles.section}>
          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>R$ {cart.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping:</Text>
              <Text style={styles.totalValue}>R$ {cart.shipping.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax:</Text>
              <Text style={styles.totalValue}>R$ {cart.tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>R$ {cart.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.placeOrderButtonText}>Place Order</Text>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  inputContainer: {
    gap: 12,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionSelected: {
    borderColor: '#D4AF37',
    backgroundColor: '#fffbf0',
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  totalContainer: {
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  grandTotalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
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
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  shopButton: {
    marginTop: 24,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryShopButton: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D4AF37',
    minWidth: 200,
  },
  secondaryShopButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  placeOrderButton: {
    flexDirection: 'row',
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
