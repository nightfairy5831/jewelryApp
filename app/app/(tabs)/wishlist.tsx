import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import LoginPrompt from '../../components/auth/LoginPrompt';

export default function WishlistScreen() {
  const {
    wishlist,
    authToken,
    fetchWishlist,
    removeFromWishlist,
    addToCart,
  } = useAppStore();
  const isAuthenticated = !!authToken;
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWishlist();
    setRefreshing(false);
  };

  const handleRemove = async (productId: number) => {
    await removeFromWishlist(productId);
  };

  const handleAddToCart = async (productId: number) => {
    try {
      await addToCart(productId, 1);
      Alert.alert('Success', 'Product added to cart');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add to cart');
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lista de Desejos</Text>
          <View style={{ width: 40 }} />
        </View>
        <LoginPrompt
          icon="heart-outline"
          title="Faça login para ver seus favoritos"
          message="Entre na sua conta para salvar produtos e acessar sua lista de desejos"
        />
      </View>
    );
  }

  if (wishlist.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Ionicons name="heart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptyText}>Save products you love to find them later</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Wishlist ({wishlist.length})</Text>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.grid}>
          {wishlist.map((item) => (
            <View key={item.id} style={styles.productCard}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: item.product?.thumbnail || item.product?.images?.[0] || 'https://via.placeholder.com/150' }}
                  style={styles.productImage}
                />
                <TouchableOpacity
                  style={styles.heartButton}
                  onPress={() => handleRemove(item.product_id)}
                >
                  <Ionicons name="heart" size={24} color="#D4AF37" />
                </TouchableOpacity>
              </View>

              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.product?.name || 'Product'}
                </Text>
                <Text style={styles.productPrice}>
                  R$ {item.product?.price.toFixed(2)}
                </Text>

                <TouchableOpacity
                  style={styles.addToCartButton}
                  onPress={() => handleAddToCart(item.product_id)}
                >
                  <Ionicons name="cart-outline" size={20} color="#fff" />
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  productCard: {
    width: '50%',
    padding: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  productInfo: {
    padding: 8,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
  },
  addToCartButton: {
    flexDirection: 'row',
    backgroundColor: '#D4AF37',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
