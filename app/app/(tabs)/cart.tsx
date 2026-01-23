import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useEffect, useState, useMemo } from 'react';
import { router } from 'expo-router';

export default function CartScreen() {
  const {
    cart,
    cartItemsCount,
    fetchCart,
    removeFromCart,
    updateCartQuantity,
  } = useAppStore();

  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchCart();
  }, []);

  // Initialize all items as selected when cart loads
  useEffect(() => {
    if (cart?.cart?.items) {
      setSelectedItems(new Set(cart.cart.items.map(item => item.id)));
    }
  }, [cart?.cart?.items?.length]);

  const toggleItemSelection = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (!cart?.cart?.items) return;

    const allItemIds = cart.cart.items.map(item => item.id);
    const allSelected = allItemIds.every(id => selectedItems.has(id));

    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allItemIds));
    }
  };

  // Calculate totals based on selected items only
  const selectedTotals = useMemo(() => {
    if (!cart?.cart?.items) return { subtotal: 0, shipping: 0, tax: 0, total: 0, count: 0 };

    const selectedCartItems = cart.cart.items.filter(item => selectedItems.has(item.id));
    const subtotal = selectedCartItems.reduce((sum, item) => sum + (Number(item.price_at_time_of_add) * item.quantity), 0);
    const shipping = selectedCartItems.length > 0 ? cart.shipping : 0;
    const tax = selectedCartItems.length > 0 ? (subtotal * 0.1) : 0; // 10% tax approximation
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total, count: selectedCartItems.length };
  }, [cart, selectedItems]);

  const isAllSelected = cart?.cart?.items && cart.cart.items.length > 0 &&
    cart.cart.items.every(item => selectedItems.has(item.id));

  if (!cart || cartItemsCount === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add some products to get started</Text>
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

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      Alert.alert('Invalid Quantity', 'Quantity must be at least 1');
      return;
    }
    await updateCartQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = async (itemId: number) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => await removeFromCart(itemId),
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      Alert.alert('Selecione itens', 'Por favor, selecione pelo menos um item para comprar.');
      return;
    }
    // Pass selected item IDs to checkout
    const selectedItemIds = Array.from(selectedItems);
    router.push({ pathname: '/checkout', params: { selectedItems: JSON.stringify(selectedItemIds) } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Header with Icon */}
        <View style={styles.headerContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.headerIcon}
            resizeMode="contain"
          />
          <Text style={styles.header}>Desejos</Text>
        </View>

        {/* Select All Row */}
        <TouchableOpacity style={styles.selectAllRow} onPress={toggleSelectAll}>
          <View style={[styles.checkbox, isAllSelected && styles.checkboxSelected]}>
            {isAllSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.selectAllText}>Selecionar todos</Text>
        </TouchableOpacity>

        <ScrollView style={styles.scrollView}>
          {cart.cart.items.map((item) => {
            const itemTotal = Number(item.price_at_time_of_add) * item.quantity;
            const installmentPrice = itemTotal / 12;

            return (
              <View key={item.id} style={styles.cartItem}>
                {/* Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => toggleItemSelection(item.id)}
                >
                  <View style={[styles.checkbox, selectedItems.has(item.id) && styles.checkboxSelected]}>
                    {selectedItems.has(item.id) && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                </TouchableOpacity>

                <Image
                  source={{ uri: item.product?.images?.[0] || item.product?.thumbnail || 'https://via.placeholder.com/60' }}
                  style={styles.productImage}
                />
                <View style={styles.itemDetails}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {item.product?.name || 'Product'}
                    </Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#D4AF37" />
                      <Text style={styles.ratingText}>4.5</Text>
                    </View>
                  </View>
                  <Text style={styles.totalPrice}>
                    Total: R$ {itemTotal.toFixed(2).replace('.', ',')}
                  </Text>
                  <Text style={styles.installmentPrice}>
                    12x R$ {installmentPrice.toFixed(2).replace('.', ',')}
                  </Text>

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={18} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={18} color="#333" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(item.id)}
                >
                  <Ionicons name="trash-outline" size={22} color="#ff4444" />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>R$ {selectedTotals.subtotal.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frete:</Text>
            <Text style={styles.summaryValue}>R$ {selectedTotals.shipping.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxas:</Text>
            <Text style={styles.summaryValue}>R$ {selectedTotals.tax.toFixed(2).replace('.', ',')}</Text>
          </View>

          <View style={styles.dottedDivider} />

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>R$ {selectedTotals.total.toFixed(2).replace('.', ',')}</Text>
          </View>

          <View style={styles.solidDivider} />

          <View style={styles.footerButtonsContainer}>
            <TouchableOpacity
              style={styles.footerBackButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.checkoutButton, selectedItems.size === 0 && styles.checkoutButtonDisabled]}
              onPress={handleCheckout}
              disabled={selectedItems.size === 0}
            >
              <Text style={styles.checkoutButtonText}>Comprar Desejo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 12,
    marginTop: 40
  },
  headerIcon: {
    width: 80,
    height: 80,
    marginRight: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#111827',
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
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  shopButton: {
    marginTop: 24,
    backgroundColor: '#111827',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    marginVertical: 8,
    padding: 8,
    borderRadius: 30,
    alignItems: 'center',
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  productName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 4,
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  installmentPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#16a34a',
    marginTop: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: '#fff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 6,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#111827',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    marginTop: 4,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  dottedDivider: {
    height: 1,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    borderStyle: 'dotted',
    marginVertical: 8,
  },
  solidDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  footerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  footerBackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  checkoutButtonDisabled: {
    opacity: 0.5,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  selectAllText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  checkboxContainer: {
    paddingRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
});
