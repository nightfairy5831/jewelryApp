import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image as RNImage } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG } from '../../config/api';

interface Review {
  id: number;
  buyer_name: string;
  buyer_avatar: string | null;
  rating: number;
  description: string | null;
  image: string | null;
  created_at: string;
}

export default function ReviewsPage() {
  const { productId, productName } = useLocalSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/products/${productId}/reviews`);
      const data = await response.json();
      setReviews(data.reviews || []);
      setAverageRating(data.average_rating || 0);
      setTotalReviews(data.total_reviews || 0);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[...Array(5)].map((_, i) => (
          <Ionicons
            key={i}
            name={i < Math.floor(rating) ? 'star' : 'star-outline'}
            size={16}
            color="#FFCC00"
          />
        ))}
      </View>
    );
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      {/* Review Image */}
      {item.image && (
        <RNImage
          source={{ uri: item.image }}
          style={styles.reviewImage}
          resizeMode="cover"
        />
      )}

      {/* Buyer Info and Rating */}
      <View style={styles.reviewHeader}>
        <View style={styles.buyerInfo}>
          {item.buyer_avatar ? (
            <RNImage source={{ uri: item.buyer_avatar }} style={styles.buyerAvatar} />
          ) : (
            <View style={styles.buyerAvatarFallback}>
              <Text style={styles.buyerAvatarText}>
                {item.buyer_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.buyerName}>{item.buyer_name}</Text>
        </View>
        <View style={styles.ratingRow}>
          {renderStars(item.rating)}
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Review Description */}
      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Avaliações',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma avaliação ainda</Text>
            <Text style={styles.emptySubtext}>Seja o primeiro a avaliar!</Text>
          </View>
        ) : (
          <FlatList
            data={reviews}
            renderItem={renderReview}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  buyerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  buyerAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyerAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  reviewImage: {
    width: '100%',
    height: 280,
  },
});
