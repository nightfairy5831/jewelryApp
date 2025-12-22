import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { useAppStore } from '../../store/useAppStore';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useEffect, useMemo, useState, useRef } from 'react';
import { router } from 'expo-router';
import ProductDetailContent from '../../components/product/ProductDetailContent';
import Model3DViewer from '../../components/product/Model3DViewer';

const GOLDEN_RATIO = 0.618;

export default function CatalogScreen() {
  const {
    catalogMode,
    currentProductIndex,
    filteredProducts,
    currentFilterSet,
    selectedFilters,
    isLoading,
    error,
    selectedMediaIndex,
    setCatalogMode,
    nextProduct,
    previousProduct,
    selectFilter,
    goBackFilter,
    loadProducts,
    setSelectedMediaIndex,
    addToCart,
    authToken,
    cartItemsCount,
  } = useAppStore();

  // Fetch user data from token
  const { user: currentUser, isAuthenticated } = useCurrentUser();

  const [addingToCart, setAddingToCart] = useState(false);
  const videoRef = useRef<Video>(null);

  // Load products from API on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Redirect sellers to seller dashboard (only after products loaded to avoid premature navigation)
  useEffect(() => {
    if (currentUser && currentUser.role === 'seller' && !isLoading) {
      router.replace('/(tabs)/seller-dashboard');
    }
  }, [currentUser, isLoading]);

  // Reset button state when switching to detail mode or changing product
  useEffect(() => {
    setAddingToCart(false);
  }, [catalogMode, currentProductIndex]);

  const currentProduct = filteredProducts[currentProductIndex];

  // Build media items array (3D model, video, and images)
  const mediaItems = useMemo(() => {
    if (!currentProduct) return [];
    const items = [];

    // Add 3D model if available
    if (currentProduct.model_3d_url) {
      items.push({ type: '3d', url: currentProduct.model_3d_url });
    }

    // Add video (max 1)
    if (currentProduct.videos && currentProduct.videos[0]) {
      items.push({ type: 'video', url: currentProduct.videos[0] });
    }

    // Add images (max 4)
    if (currentProduct.images) {
      currentProduct.images.slice(0, 4).forEach(img => {
        items.push({ type: 'image', url: img });
      });
    }

    return items;
  }, [currentProduct]);

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Carregando produtos...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="cloud-offline-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handlePlusClick = () => {
    setCatalogMode(catalogMode === 'browse' ? 'detail' : 'browse');
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated || !authToken) {
      Alert.alert('Login Necessário', 'Por favor, faça login para adicionar produtos ao carrinho', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Fazer Login', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    if (!currentProduct) return;

    setAddingToCart(true);
    try {
      await addToCart(parseInt(currentProduct.id), 1);
      Alert.alert('Sucesso!', 'Produto adicionado aos desejos', [
        { text: 'CONTINUAR COMPRANDO', style: 'cancel' },
        { text: 'IR PARA DESEJOS', onPress: () => router.push('/(tabs)/cart') },
      ]);
    } catch (error: any) {
      console.error('❌ Add to cart error:', error);

      // Check if it's an auth error
      if (error.message?.includes('Session expired') || error.message?.includes('Not authenticated')) {
        Alert.alert('Sessão Expirada', 'Por favor, faça login novamente', [
          { text: 'Fazer Login', onPress: () => router.push('/auth/login') },
        ]);
      } else {
        Alert.alert('Erro', error.message || 'Falha ao adicionar ao carrinho');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated || !authToken) {
      Alert.alert('Login Necessário', 'Por favor, faça login para continuar', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Fazer Login', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    if (!currentProduct) return;

    setAddingToCart(true);
    try {
      // Clear cart and add only this product
      await addToCart(parseInt(currentProduct.id), 1, true); // true = clear cart first

      // Navigate to checkout
      router.push('/checkout');
    } catch (error: any) {
      console.error('❌ Buy now error:', error);

      if (error.message?.includes('Session expired') || error.message?.includes('Not authenticated')) {
        Alert.alert('Sessão Expirada', 'Por favor, faça login novamente', [
          { text: 'Fazer Login', onPress: () => router.push('/auth/login') },
        ]);
      } else {
        Alert.alert('Erro', error.message || 'Falha ao processar');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleFilterClick = (filterId: string, filterType?: string) => {
    if (filterType === 'action') {
      // Handle action clicks (wallet, profile)
      if (filterId === 'wallet') {
        router.push('/(tabs)/cart');
      } else if (filterId === 'profile') {
        router.push('/(tabs)/profile');
      }
      return;
    }
    if (filterType === 'back') {
      // Handle back button
      goBackFilter();
      return;
    }
    selectFilter(filterId);
  };

  // If a category is selected, show back button + 3 subcategories
  const leftIcons = selectedFilters.length > 0
    ? [
        { id: 'back', name: 'Voltar', icon: 'arrow-back', iconType: 'ionicon' as const, type: 'back' },
        ...currentFilterSet.slice(0, 3)
      ]
    : currentFilterSet.slice(0, 4);

  return (
    <View style={styles.container}>

      {/* PRODUCT SECTION - 61.8% */}
      <View style={styles.productSection}>
        {currentProduct ? (
          <>
            {catalogMode === 'browse' ? (
              /* BROWSE MODE - Show thumbnail only */
              <>
                {currentProduct.thumbnail ? (
                  <Image
                    source={{ uri: currentProduct.thumbnail }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.productImage}>
                    <Ionicons name="image-outline" size={64} color="#d1d5db" />
                  </View>
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.3)']}
                  style={styles.gradientOverlay}
                />
              </>
            ) : (
              /* DETAIL MODE - Show media viewer with slider */
              <View style={styles.mediaViewerContainer}>
                {/* Top: Main viewer (70%) */}
                <View style={styles.mainViewer}>
                  {mediaItems[selectedMediaIndex]?.type === '3d' && mediaItems[selectedMediaIndex]?.url && (
                    <Model3DViewer modelUrl={mediaItems[selectedMediaIndex].url} />
                  )}
                  {mediaItems[selectedMediaIndex]?.type === 'image' && mediaItems[selectedMediaIndex]?.url && (
                    <Image
                      source={{ uri: mediaItems[selectedMediaIndex].url }}
                      style={styles.mainMedia}
                      resizeMode="cover"
                    />
                  )}
                  {mediaItems[selectedMediaIndex]?.type === 'video' && mediaItems[selectedMediaIndex]?.url && (
                    <Video
                      ref={videoRef}
                      source={{ uri: mediaItems[selectedMediaIndex].url }}
                      style={styles.mainMedia}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      isLooping
                    />
                  )}
                </View>

                {/* Bottom: Thumbnail slider (30%) */}
                <View style={styles.thumbnailSlider}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {mediaItems.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.thumbnailItem,
                          selectedMediaIndex === idx && styles.thumbnailItemActive
                        ]}
                        onPress={() => setSelectedMediaIndex(idx)}
                      >
                        {item.type === '3d' && (
                          <View style={styles.thumbnailIcon}>
                            <Ionicons name="cube" size={24} color="#fff" />
                          </View>
                        )}
                        {item.type === 'image' && item.url && (
                          <Image source={{ uri: item.url }} style={styles.thumbnailImage} />
                        )}
                        {item.type === 'video' && (
                          <View style={styles.thumbnailIcon}>
                            <Ionicons name="play" size={24} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Controls: HORIZONTAL - 3 Dots and Arrows on same line */}
            <View style={styles.controlsOverlay}>
              <TouchableOpacity style={styles.plusButton} onPress={handlePlusClick}>
                <Ionicons
                  name={catalogMode === 'detail' ? 'close' : 'ellipsis-horizontal'}
                  size={28}
                  color="#000"
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.arrowButton} onPress={previousProduct}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.arrowButton} onPress={nextProduct}>
                <Ionicons name="arrow-forward" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>Nenhum produto</Text>
        )}
      </View>

      <View style={styles.divider} />

      {/* FILTER SECTION - 38.2% */}
      <View style={styles.filterSection}>

        {catalogMode === 'browse' ? (
          /* BROWSE MODE: Show filters */
          <View style={styles.filterGrid}>

            {/* LEFT SECTION - 60% (DYNAMIC 2x2 grid) */}
            <View style={styles.leftSection}>
              <View style={styles.gridRow}>
                <TouchableOpacity
                  style={styles.peopleCell}
                  onPress={() => handleFilterClick(leftIcons[0].id, leftIcons[0].type)}
                >
                  {leftIcons[0].iconType === 'image' ? (
                    <Image source={leftIcons[0].icon as any} style={styles.categoryIconImage} resizeMode="contain" />
                  ) : (
                    <Ionicons name={leftIcons[0].icon as any} size={48} color="#1f2937" />
                  )}
                  <Text style={styles.filterLabel}>{leftIcons[0].name}</Text>
                </TouchableOpacity>

                <View style={styles.verticalDividerSmall} />

                <TouchableOpacity
                  style={styles.peopleCell}
                  onPress={() => handleFilterClick(leftIcons[1].id, leftIcons[1].type)}
                >
                  {leftIcons[1].iconType === 'image' ? (
                    <Image source={leftIcons[1].icon as any} style={styles.categoryIconImage} resizeMode="contain" />
                  ) : (
                    <Ionicons name={leftIcons[1].icon as any} size={48} color="#1f2937" />
                  )}
                  <Text style={styles.filterLabel}>{leftIcons[1].name}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.horizontalDivider} />

              <View style={styles.gridRow}>
                <TouchableOpacity
                  style={styles.peopleCell}
                  onPress={() => handleFilterClick(leftIcons[2].id, leftIcons[2].type)}
                >
                  {leftIcons[2].iconType === 'image' ? (
                    <Image source={leftIcons[2].icon as any} style={styles.categoryIconImage} resizeMode="contain" />
                  ) : (
                    <Ionicons name={leftIcons[2].icon as any} size={48} color="#1f2937" />
                  )}
                  <Text style={styles.filterLabel}>{leftIcons[2].name}</Text>
                </TouchableOpacity>

                <View style={styles.verticalDividerSmall} />

                <TouchableOpacity
                  style={styles.peopleCell}
                  onPress={() => handleFilterClick(leftIcons[3].id, leftIcons[3].type)}
                >
                  {leftIcons[3].iconType === 'image' ? (
                    <Image source={leftIcons[3].icon as any} style={styles.categoryIconImage} resizeMode="contain" />
                  ) : (
                    <Ionicons name={leftIcons[3].icon as any} size={48} color="#1f2937" />
                  )}
                  <Text style={styles.filterLabel}>{leftIcons[3].name}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.verticalDivider} />

            {/* RIGHT SECTION - 40% (Wallet + Profile on top, Cart on bottom) */}
            <View style={styles.rightSection}>

              {/* Top Row: User Profile */}
              <TouchableOpacity
                style={styles.topIconRow}
                onPress={() => {
                  if (currentUser) {
                    router.push('/(tabs)/profile');
                  } else {
                    router.push('/auth/login');
                  }
                }}
              >
                {currentUser ? (
                  <>
                    {currentUser.avatar ? (
                      <Image
                        source={{ uri: currentUser.avatar }}
                        style={styles.userAvatar}
                      />
                    ) : (
                      <View style={styles.userAvatarPlaceholder}>
                        <Text style={styles.userInitial}>
                          {currentUser.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.userName} numberOfLines={2}>
                      {currentUser.name}
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={styles.userAvatarPlaceholder}>
                      <Ionicons name="person" size={24} color="#9ca3af" />
                    </View>
                    <Text style={styles.userName}>LOGIN</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.horizontalDivider} />

              {/* Bottom: Wishlist */}
              <TouchableOpacity
                style={styles.cartCell}
                onPress={() => router.push('/(tabs)/cart')}
              >
                <Image source={require('../../assets/icon.png')} style={styles.wishesIconLarge} resizeMode="contain" />
                <View style={styles.wishesCountBadge}>
                  <Text style={styles.wishesCountText}>
                    {cartItemsCount}
                  </Text>
                </View>
                <Text style={styles.wishesLabel}>Desejos</Text>
              </TouchableOpacity>

            </View>

          </View>
        ) : (
          /* DETAIL MODE: Show product detail component */
          <ScrollView style={styles.detailScrollView} showsVerticalScrollIndicator={false}>
            <ProductDetailContent
              product={currentProduct}
              compact={true}
            />
          </ScrollView>
        )}

      </View>

      {/* Sticky Buttons - Only visible in detail mode */}
      {catalogMode === 'detail' && currentProduct && (
        <View style={styles.stickyButtonContainer}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)']}
            style={styles.gradientBackground}
          />
          <View style={styles.buttonRow}>
            {/* Desejo Button - Add to Cart */}
            <TouchableOpacity
              style={[styles.desejoButton, addingToCart && styles.buttonDisabled]}
              onPress={handleAddToCart}
              disabled={addingToCart}
            >
              {addingToCart ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Ionicons name="heart-outline" size={20} color="#000000" />
                  <Text style={styles.desejoButtonText}>Desejo</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Comprar Button - Buy Now */}
            <TouchableOpacity
              style={[styles.comprarButton, addingToCart && styles.buttonDisabled]}
              onPress={handleBuyNow}
              disabled={addingToCart}
            >
              <Text style={styles.comprarButtonText}>Comprar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },

  // PRODUCT SECTION
  productSection: {
    flex: GOLDEN_RATIO,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
    alignSelf: 'center',
    marginTop: '50%',
  },

  // Media Viewer (Detail Mode)
  mediaViewerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mainViewer: {
    flex: 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  mainMedia: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  modelPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  placeholderText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  thumbnailSlider: {
    flex: 0.25,
    backgroundColor: '#f9fafb',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  thumbnailItem: {
    width: 80,
    height: 80,
    marginHorizontal: 6,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailItemActive: {
    borderColor: '#3b82f6',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#374151',
  },

  // Controls - HORIZONTAL: Plus and Arrows on same line
  controlsOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  plusButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  arrowButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },

  // FILTER SECTION
  filterSection: {
    flex: 1 - GOLDEN_RATIO,
    backgroundColor: '#ffffff',
  },
  detailScrollView: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  filterGrid: {
    flex: 1,
    flexDirection: 'row',
  },

  // LEFT SECTION - 60% (DYNAMIC)
  leftSection: {
    flex: 0.6,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  peopleCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#fafafa',
  },

  // RIGHT SECTION - 40% (ALWAYS FIXED)
  rightSection: {
    flex: 0.4,
  },

  // Top Icon Row - User Profile
  topIconRow: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },

  // FAB Style Buttons (matching FABMenu.tsx)
  fabStyleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  fabStyleProfileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },

  // Cart Cell - Large bottom section (FAB style)
  cartCell: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#fafafa',
  },
  fabStyleCartButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    position: 'relative',
  },
  cartBadgeInline: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  cartBadgeTextInline: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // DETAIL MODE - Product info
  productDetailGrid: {
    flex: 1,
    flexDirection: 'row',
  },
  detailInfoSection: {
    flex: 0.6,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  detailInfoSectionFullWidth: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    lineHeight: 20,
  },
  detailPrice: {
    fontSize: 24,
    color: '#000',
    fontWeight: '800',
    marginBottom: 4,
  },
  detailOriginalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Dividers
  verticalDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  verticalDividerSmall: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },

  // Labels
  filterLabel: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  categoryIconImage: {
    width: 48,
    height: 48,
  },
  wishesIcon: {
    width: 50,
    height: 50,
    tintColor: '#ffffff',
  },
  wishesIconLarge: {
    width: 50,
    height: 50,
  },
  wishesCountBadge: {
    backgroundColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 1,
    marginTop: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishesCountText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  wishesLabel: {
    fontSize: 11,
    color: '#1f2937',
    fontWeight: '700',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  userName: {
    fontSize: 11,
    color: '#1f2937',
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userInitial: {
    fontSize: 20,
    color: '#1f2937',
    fontWeight: '700',
  },

  // Loading state
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },

  // Error state
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Add to Cart Button
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 50,
    marginTop: 20,
    marginBottom: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Sticky Buttons Container
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 10,
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  desejoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1D5DB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 6,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  desejoButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  comprarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  comprarButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
