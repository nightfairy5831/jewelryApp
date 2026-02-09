import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import type { Product } from '../../data/products';
import { API_CONFIG } from '../../config/api';

interface ProductDetailContentProps {
  product: Product;
  compact?: boolean; // For showing in index page detail mode
  onCustomizationChange?: (customization: RingCustomization) => void;
}

export interface RingCustomization {
  size?: string;
  size_1?: string;
  name_1?: string;
  size_2?: string;
  name_2?: string;
}

export default function ProductDetailContent({ product, compact = false, onCustomizationChange }: ProductDetailContentProps) {
  const [customization, setCustomization] = useState<RingCustomization>({});
  const [productRating, setProductRating] = useState(5);
  const [reviewCount, setReviewCount] = useState(0);
  const [showRingSizeGuide, setShowRingSizeGuide] = useState(false);

  const sellerName = product.seller?.name || 'Joalheria Premium';
  const sellerInitial = sellerName.charAt(0).toUpperCase();
  const installmentPrice = (product.price / 12).toFixed(2);

  // Fetch average rating from reviews API
  useEffect(() => {
    const fetchRating = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products/${product.id}/reviews`);
        const data = await response.json();
        setProductRating(data.average_rating || 5);
        setReviewCount(data.total_reviews || 0);
      } catch (error) {
        console.error('Failed to fetch product rating:', error);
      }
    };
    fetchRating();
  }, [product.id]);

  const updateCustomization = (field: keyof RingCustomization, value: string) => {
    const updated = { ...customization, [field]: value };
    setCustomization(updated);
    onCustomizationChange?.(updated);
  };

  const needsRingSize = (product.category === 'Male' || product.category === 'Female') && product.subcategory === 'Rings';
  const needsWeddingCustomization = product.category === 'Wedding Rings';

  const containerStyle = compact ? styles.contentCompact : styles.content;

  return (
    <>
      <Modal
        visible={showRingSizeGuide}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRingSizeGuide(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRingSizeGuide(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowRingSizeGuide(false)}
            >
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
            <Image
              source={require('../../assets/ring_size.png')}
              style={styles.ringSizeImage}
              contentFit="contain"
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={containerStyle}>
      {/* Seller Section */}
      <View style={styles.sellerSection}>
        <View style={styles.sellerLogoContainer}>
          <Text style={styles.sellerLogo}>{sellerInitial}</Text>
        </View>
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName}>{sellerName}</Text>
          <View style={styles.sellerRating}>
            <Ionicons name="star" size={16} color="#FFCC00" />
            <Text style={styles.ratingText}>{productRating.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      {/* 2. Product Title & Categories */}
      <View style={styles.titleSection}>
        <Text style={styles.productTitle}>{product.name}</Text>
        <View style={styles.categoryTags}>
          {product.category && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{product.category}</Text>
            </View>
          )}
          {product.subcategory && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{product.subcategory}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 3. Material */}
      <Text style={styles.material}>
        Material: {product.material || (product.gold_karat ? `Ouro ${product.gold_karat.toUpperCase()}` : 'Ouro 18K')}
      </Text>

      {/* 4. Free Shipping Badge */}
      {product.shipping?.free && (
        <View style={styles.shippingBadge}>
          <Text style={styles.shippingText}>Frete grátis</Text>
        </View>
      )}

      {/* 5. Pricing */}
      <View style={styles.pricingSection}>
        <Text style={styles.currentPrice}>R$ {product.price.toFixed(2)}</Text>
        <Text style={styles.installmentPrice}>12x R$ {installmentPrice}</Text>
      </View>

      {/* 6. Payment Methods */}
      <Image
        source={require('../../assets/payment.png')}
        style={styles.paymentImage}
        contentFit="contain"
      />

      {/* 7. Other Properties */}
      {((product.properties && Object.keys(product.properties).length > 0) || product.gold_weight_grams) && (
        <View style={styles.propertiesSection}>
          {product.gold_weight_grams && (
            <Text style={styles.property}>
              Peso: {product.gold_weight_grams}g
            </Text>
          )}
          {product.properties && Object.entries(product.properties).map(([key, value]) => (
            <Text key={key} style={styles.property}>
              {key}: {value}
            </Text>
          ))}
        </View>
      )}

      {/* 8. Description */}
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionLabel}>Descrição:</Text>
        <Text style={styles.descriptionText}>{product.description}</Text>
      </View>

      {/* Ring Customization Fields */}
      {needsRingSize && (
        <View style={styles.customizationBox}>
          <View style={styles.ringSizeHeader}>
            <Text style={styles.customizationLabel}>Tamanho do Anel:</Text>
            <TouchableOpacity onPress={() => setShowRingSizeGuide(true)}>
              <Text style={styles.ringSizeGuideButton}>Não sei meu aro</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ex: 18"
            value={customization.size || ''}
            onChangeText={(value) => updateCustomization('size', value)}
            keyboardType="numeric"
          />
        </View>
      )}

      {needsWeddingCustomization && (
        <View style={styles.customizationBox}>
          <View style={styles.ringSizeHeader}>
            <Text style={styles.customizationLabel}>Alianças de Casamento:</Text>
            <TouchableOpacity onPress={() => setShowRingSizeGuide(true)}>
              <Text style={styles.ringSizeGuideButton}>Não sei meu aro</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ringPairContainer}>
            <Text style={styles.ringLabel}>Aliança Masculina:</Text>
            <TextInput
              style={styles.input}
              placeholder="Tamanho (Ex: 21)"
              value={customization.size_1 || ''}
              onChangeText={(value) => updateCustomization('size_1', value)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Nome para gravação (Ex: Maria)"
              value={customization.name_1 || ''}
              onChangeText={(value) => updateCustomization('name_1', value)}
            />
          </View>

          <View style={styles.ringPairContainer}>
            <Text style={styles.ringLabel}>Aliança Feminina:</Text>
            <TextInput
              style={styles.input}
              placeholder="Tamanho (Ex: 18)"
              value={customization.size_2 || ''}
              onChangeText={(value) => updateCustomization('size_2', value)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Nome para gravação (Ex: João)"
              value={customization.name_2 || ''}
              onChangeText={(value) => updateCustomization('name_2', value)}
            />
          </View>
        </View>
      )}

      {/* 9. Expandable Sections */}
      <View style={styles.expandableContainer}>
        <View style={styles.divider} />

        {/* Questions Section - Navigate to Forum */}
        <TouchableOpacity
          style={styles.expandableHeader}
          onPress={() => router.push({ pathname: '/(tabs)/forum', params: { sellerId: String(product.seller?.id || ''), sellerName: product.seller?.name || 'Vendedor' } })}
        >
          <Text style={styles.expandableTitle}>Perguntas ao vendedor</Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color="#000"
          />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Reviews Section - Navigate to Reviews Page */}
        <TouchableOpacity
          style={styles.expandableHeader}
          onPress={() => router.push({ pathname: '/reviews/[productId]', params: { productId: product.id, productName: product.name } })}
        >
          <Text style={styles.expandableTitle}>Avaliações</Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color="#000"
          />
        </TouchableOpacity>

        <View style={styles.divider} />
      </View>

      {/* Add to Cart button moved to sticky footer in index.tsx */}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  contentCompact: {
    padding: 16,
    paddingBottom: 16,
    backgroundColor: '#fafafa',
  },
  sellerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sellerLogoContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  sellerLogo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  sellerInfo: {
    marginLeft: 10,
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 5,
  },
  titleSection: {
    marginBottom: 15,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  categoryTags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  material: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    marginBottom: 15,
  },
  propertiesSection: {
    marginBottom: 15,
  },
  property: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  shippingBadge: {
    backgroundColor: '#FFCC00',
    borderRadius: 50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  shippingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pricingSection: {
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  installmentPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  paymentImage: {
    width: 280,
    height: 42,
    marginBottom: 15,
  },
  descriptionBox: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  expandableContainer: {
    marginTop: 10,
    marginBottom: 40
  },
  divider: {
    height: 1,
    backgroundColor: '#DDDDDD',
    marginVertical: 16,
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 0,
  },
  expandableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  expandableContent: {
    marginTop: 16,
    marginBottom: 20
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
  },
  customizationBox: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  ringSizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customizationLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  ringSizeGuideButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  ringPairContainer: {
    marginBottom: 16,
  },
  ringLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    padding: 12,
    fontSize: 14,
    color: '#000',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    height: '85%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -40,
    right: 0,
    zIndex: 10,
  },
  ringSizeImage: {
    width: '100%',
    height: '100%',
  },
});
