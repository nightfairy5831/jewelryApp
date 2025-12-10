import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { Product } from '../../data/products';
import { Card, StarRating } from '../ui';
import { useAppStore } from '../../store/useAppStore';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { currentUser, toggleSave, addToCart, isAuthenticated } = useAppStore();
  const isSaved = currentUser?.savedProducts?.includes(product.id) || false;

  const shippingInfo = product.shipping?.free
    ? `Free shipping • Arrives in ${product.shipping.days} days`
    : `Shipping • Arrives in ${product.shipping?.days || 5} days`;

  const handleSave = (e: any) => {
    e.stopPropagation();
    toggleSave(product.id);
  };

  const handleAddToCart = async (e: any) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to add items to cart', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    try {
      await addToCart(Number(product.id), 1);
      Alert.alert('Success', 'Product added to cart');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add to cart');
    }
  };

  return (
    <View className="mx-4 my-3 bg-white rounded-2xl overflow-hidden" style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
      }}>
        {/* Product Image */}
        <View className="relative">
          <Image
            source={{ uri: product.images[0] }}
            className="w-full h-64"
            contentFit="cover"
            transition={200}
          />

          {/* Discount Badge */}
          {product.discount > 0 && (
            <View className="absolute top-3 left-3 bg-red-500 rounded-lg px-2 py-1">
              <Text className="text-white font-bold text-xs">
                -{product.discount}%
              </Text>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            className="absolute top-3 right-3 bg-white rounded-full w-10 h-10 items-center justify-center active:bg-gray-100"
            activeOpacity={0.8}
          >
            <Text className="text-lg">{isSaved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>

          {/* Category Tag */}
          <View className="absolute bottom-3 left-3 bg-white/90 rounded-full px-3 py-1">
            <Text className="text-xs font-semibold text-gray-700 capitalize">
              {product.category}
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <View className="p-4">
          <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={2}>
            {product.name}
          </Text>

          <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
            {product.description}
          </Text>

          {/* Rating */}
          <View className="flex-row items-center mb-3">
            <StarRating rating={product.rating} size="sm" showValue />
            <Text className="text-xs text-gray-500 ml-1">
              ({product.reviewCount})
            </Text>
          </View>

          {/* Price */}
          <View className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-end">
                <Text className="text-2xl font-bold text-primary">
                  R$ {product.price.toFixed(2)}
                </Text>
              </View>
              {product.originalPrice && (
                <Text className="text-sm text-gray-400 line-through">
                  R$ {product.originalPrice.toFixed(2)}
                </Text>
              )}
            </View>

            {/* Quick Add Button */}
            <TouchableOpacity
              className="bg-primary rounded-lg px-4 py-2 active:bg-primary-dark"
              activeOpacity={0.8}
              onPress={handleAddToCart}
            >
              <Text className="text-white font-semibold text-sm">Add</Text>
            </TouchableOpacity>
          </View>

          {/* Shipping Info */}
          {shippingInfo && (
            <View className="mt-3 pt-3 border-t border-gray-100">
              <Text className="text-xs text-gray-500">
                📦 {shippingInfo}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
