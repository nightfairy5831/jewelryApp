import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

const { width } = Dimensions.get('window');
const PRODUCT_WIDTH = (width - 48) / 2;

const categories = [
  { id: 'fashion', name: 'Moda', icon: 'shirt-outline', color: '#f59e0b' },
  { id: 'beauty', name: 'Beleza', icon: 'sparkles-outline', color: '#ec4899' },
  { id: 'sports', name: 'Esporte', icon: 'fitness-outline', color: '#3b82f6' },
  { id: 'tech', name: 'Tech', icon: 'phone-portrait-outline', color: '#8b5cf6' },
  { id: 'home', name: 'Casa', icon: 'home-outline', color: '#10b981' },
];

export default function ExplorarScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const products = useAppStore((state) => state.products);

  const filteredProdutos = useMemo(() => {
    let filtered = products;
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [products, selectedCategory, searchQuery]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explorar</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.categoriesSection}>
          <Text style={styles.categoryTitle}>Categorias</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              style={[styles.categoryChip, selectedCategory === null && styles.categoryChipActive]}
            >
              <Text style={[styles.categoryChipText, selectedCategory === null && styles.categoryChipTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && {
                    backgroundColor: category.color,
                    borderColor: category.color,
                  }
                ]}
              >
                <Ionicons
                  name={category.icon}
                  size={18}
                  color={selectedCategory === category.id ? '#fff' : '#374151'}
                  style={styles.categoryIcon}
                />
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && { color: '#fff' }
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory
              ? `${categories.find(c => c.id === selectedCategory)?.name} Produtos (${filteredProdutos.length})`
              : `Todos Produtos (${filteredProdutos.length})`
            }
          </Text>
          {filteredProdutos.length > 0 ? (
            <View style={styles.productGrid}>
              {filteredProdutos.map((product) => (
              <TouchableOpacity key={product.id} style={styles.productCard}>
                <Image
                  source={{ uri: product.thumbnail }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                {product.discount && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-{product.discount}%</Text>
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={12} color="#f59e0b" />
                    <Text style={styles.ratingText}>
                      {product.rating} ({product.reviewCount})
                    </Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>R$ {product.price.toFixed(2)}</Text>
                    {product.originalPrice && (
                      <Text style={styles.originalPrice}>
                        R$ {product.originalPrice.toFixed(2)}
                      </Text>
                    )}
                  </View>
                  {product.shipping.free && (
                    <View style={styles.shippingBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                      <Text style={styles.shippingText}>Frete grátis</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyStateText}>Nenhum produto encontrado</Text>
              <Text style={styles.emptyStateSubtext}>Tente outra busca ou categoria</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: "#111827" },
  categoriesSection: { backgroundColor: "#ffffff", paddingVertical: 16, marginBottom: 8 },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoriesScroll: { paddingHorizontal: 16 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  categoryIcon: { marginRight: 4 },
  categoryChipText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  categoryChipTextActive: { color: "#ffffff" },
  productsSection: { padding: 16 },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  productCard: {
    width: PRODUCT_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: { width: '100%', height: PRODUCT_WIDTH, backgroundColor: '#f3f4f6' },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4, height: 36 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginRight: 8 },
  originalPrice: { fontSize: 14, color: '#9ca3af', textDecorationLine: 'line-through' },
  shippingBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  shippingText: { fontSize: 11, color: '#10b981', marginLeft: 4, fontWeight: '600' },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyStateText: { fontSize: 16, color: "#6b7280", marginTop: 16 },
  emptyStateSubtext: { fontSize: 14, color: "#9ca3af", marginTop: 4 },
});
