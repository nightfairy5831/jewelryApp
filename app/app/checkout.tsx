import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { orderApi, shippingApi, type ShippingAddress } from '../services/api';

export default function CheckoutScreen() {
  const { cart, authToken, fetchCart, fetchOrders } = useAppStore();
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams();

  // Parse selected item IDs from params
  const selectedItemIds: number[] = useMemo(() => {
    if (params.selectedItems) {
      try {
        return JSON.parse(params.selectedItems as string);
      } catch {
        return [];
      }
    }
    // If no selection passed, use all items
    return cart?.cart?.items?.map(item => item.id) || [];
  }, [params.selectedItems, cart]);

  // Filter cart items to only selected ones
  const selectedCartItems = useMemo(() => {
    if (!cart?.cart?.items) return [];
    return cart.cart.items.filter(item => selectedItemIds.includes(item.id));
  }, [cart, selectedItemIds]);

  const [address, setAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Brazil',
  });

  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [shippingDays, setShippingDays] = useState<number | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const shippingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate totals for selected items only
  const selectedTotals = useMemo(() => {
    const subtotal = selectedCartItems.reduce((sum, item) => sum + (Number(item.price_at_time_of_add) * item.quantity), 0);
    const shipping = shippingCost ?? 0;
    const tax = selectedCartItems.length > 0 ? (subtotal * 0.1) : 0;
    const total = subtotal + shipping + tax;
    return { subtotal, shipping, tax, total };
  }, [selectedCartItems, shippingCost]);

  const fetchShippingEstimate = useCallback(async (postalCode: string) => {
    if (!authToken || !postalCode || postalCode.replace(/\D/g, '').length < 8) {
      setShippingCost(null);
      setShippingDays(null);
      return;
    }

    setShippingLoading(true);
    try {
      const result = await shippingApi.getEstimate(authToken, postalCode, selectedItemIds);
      if (result.success) {
        setShippingCost(result.shipping_cost);
        setShippingDays(result.estimated_days);
      } else {
        setShippingCost(null);
        setShippingDays(null);
      }
    } catch {
      setShippingCost(null);
      setShippingDays(null);
    } finally {
      setShippingLoading(false);
    }
  }, [authToken, selectedItemIds]);

  const handlePostalCodeChange = useCallback((text: string) => {
    setAddress(prev => ({ ...prev, postal_code: text }));
    if (shippingTimerRef.current) clearTimeout(shippingTimerRef.current);
    shippingTimerRef.current = setTimeout(() => fetchShippingEstimate(text), 800);
  }, [fetchShippingEstimate]);

  useEffect(() => {
    return () => {
      if (shippingTimerRef.current) clearTimeout(shippingTimerRef.current);
    };
  }, []);

  // Require authentication for checkout
  const isAuthenticated = !!authToken;
  if (!isAuthenticated || !authToken) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Finalizar Compra</Text>
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

  if (!cart || selectedCartItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Nenhum item selecionado</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <Text style={styles.shopButtonText}>Voltar aos Desejos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handlePlaceOrder = async () => {
    // Validate address
    if (!address.street || !address.city || !address.state || !address.postal_code) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos de endereço');
      return;
    }

    if (!authToken) {
      Alert.alert('Erro', 'Por favor, faça login para finalizar o pedido');
      return;
    }

    if (selectedItemIds.length === 0) {
      Alert.alert('Erro', 'Nenhum item selecionado');
      return;
    }

    setLoading(true);
    try {
      // Create order from selected cart items only
      const response = await orderApi.createOrder(authToken, {
        shipping_address: address,
        cart_item_ids: selectedItemIds,
        shipping_amount: shippingCost ?? 0,
      });

      // Navigate to payment screen immediately
      router.replace(`/payment/${response.order.id}`);

      // Refresh cart and orders in background (after navigation)
      fetchCart().catch(console.error);
      fetchOrders().catch(console.error);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao criar pedido');
      setLoading(false);
    }
    // Note: Don't setLoading(false) in finally - we're navigating away
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Finalizar Compra</Text>
      </View>

      <ScrollView style={styles.scrollView}>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              {selectedCartItems.length} item(s) selecionado(s)
            </Text>
            <Text style={styles.summaryAmount}>R$ {selectedTotals.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endereço de Entrega</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Endereço"
              value={address.street}
              onChangeText={(text) => setAddress({ ...address, street: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Cidade"
              value={address.city}
              onChangeText={(text) => setAddress({ ...address, city: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Estado"
              value={address.state}
              onChangeText={(text) => setAddress({ ...address, state: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="CEP"
              value={address.postal_code}
              onChangeText={handlePostalCodeChange}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Payment Method Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pagamento</Text>
          <View style={styles.paymentOptionsInfo}>
            <View style={styles.paymentOption}>
              <Ionicons name="card-outline" size={24} color="#D4AF37" />
              <View style={styles.paymentOptionInfo}>
                <Text style={styles.paymentOptionTitle}>Cartão de Crédito</Text>
                <Text style={styles.paymentOptionFee}>Taxa: 10%</Text>
              </View>
            </View>
            <View style={styles.paymentOption}>
              <Ionicons name="qr-code-outline" size={24} color="#D4AF37" />
              <View style={styles.paymentOptionInfo}>
                <Text style={styles.paymentOptionTitle}>PIX</Text>
                <Text style={styles.paymentOptionFee}>Taxa: 8%</Text>
              </View>
            </View>
          </View>
          <Text style={styles.paymentNote}>
            Você escolherá o método de pagamento na próxima tela.
            Cada vendedor receberá um pagamento separado.
          </Text>
        </View>

        {/* Order Total */}
        <View style={styles.section}>
          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal (Produtos):</Text>
              <Text style={styles.totalValue}>R$ {selectedTotals.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Taxa (8-10%):</Text>
              <Text style={styles.totalValue}>R$ {(selectedTotals.subtotal * 0.08).toFixed(2)} - R$ {(selectedTotals.subtotal * 0.10).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Frete:</Text>
              {shippingLoading ? (
                <ActivityIndicator size="small" color="#D4AF37" />
              ) : shippingCost !== null ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.totalValue}>R$ {shippingCost.toFixed(2)}</Text>
                  {shippingDays && (
                    <Text style={{ fontSize: 12, color: '#888' }}>{shippingDays} dias úteis</Text>
                  )}
                </View>
              ) : (
                <Text style={[styles.totalValue, { color: '#999' }]}>Informe o CEP</Text>
              )}
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total Estimado:</Text>
              <Text style={styles.grandTotalValue}>R$ {(selectedTotals.subtotal * 1.08 + selectedTotals.shipping).toFixed(2)} - R$ {(selectedTotals.subtotal * 1.10 + selectedTotals.shipping).toFixed(2)}</Text>
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
              <Text style={styles.placeOrderButtonText}>Finalizar Pedido</Text>
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
  paymentOptionsInfo: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  paymentOptionFee: {
    fontSize: 12,
    color: '#666',
  },
  paymentNote: {
    fontSize: 12,
    color: '#888',
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 18,
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
    backgroundColor: '#000000',
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
