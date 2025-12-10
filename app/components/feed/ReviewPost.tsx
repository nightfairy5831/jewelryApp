import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { Review } from '../../data/reviews';
import { Card, Avatar, StarRating } from '../ui';
import { useAppStore } from '../../store/useAppStore';

interface ReviewPostProps {
  review: Review;
}

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width - 32; // Account for horizontal padding

export default function ReviewPost({ review }: ReviewPostProps) {
  const router = useRouter();
  const { currentUser, toggleLike, toggleFollow } = useAppStore();

  const isLiked = review.likes?.includes(currentUser.id) || false;
  const isFollowing = currentUser.following?.includes(review.userId) || false;
  const isOwnReview = review.userId === currentUser.id;

  const handleLike = () => {
    toggleLike(review.id);
  };

  const handleFollow = () => {
    if (!isOwnReview) {
      toggleFollow(review.userId);
    }
  };

  const handleUserPress = () => {
    // Navigate to user profile
    console.log('Navigate to user:', review.userId);
  };

  return (
    <View className="mx-4 my-3 bg-white rounded-2xl overflow-hidden" style={{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 5,
    }}>
      {/* Header */}
      <View className="p-4 pb-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleUserPress}
            className="flex-row items-center flex-1"
            activeOpacity={0.7}
          >
            <Avatar
              uri={review.userAvatar}
              name={review.userName}
              size="md"
              isPremium={review.isPremium}
            />
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text className="font-bold text-gray-900" numberOfLines={1}>
                  {review.userName}
                </Text>
                {review.isVerifiedPurchase && (
                  <View className="ml-2 bg-secondary/10 rounded-full px-2 py-0.5">
                    <Text className="text-xs text-secondary font-medium">✓ Verified</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs text-gray-500">{review.timeAgo}</Text>
            </View>
          </TouchableOpacity>

          {!isOwnReview && (
            <TouchableOpacity
              onPress={handleFollow}
              className={`px-4 py-1.5 rounded-full ${
                isFollowing ? 'bg-gray-200' : 'bg-primary'
              }`}
              activeOpacity={0.8}
            >
              <Text
                className={`text-xs font-semibold ${
                  isFollowing ? 'text-gray-700' : 'text-white'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <View className="mb-2">
          <Image
            source={{ uri: review.images[0] }}
            style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
            contentFit="cover"
            transition={200}
          />
          {review.images.length > 1 && (
            <View className="absolute bottom-3 right-3 bg-black/60 rounded-full px-2 py-1">
              <Text className="text-white text-xs font-medium">
                +{review.images.length - 1}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Review Content */}
      <View className="px-4 pb-3">
        {/* Rating */}
        <View className="mb-2">
          <StarRating rating={review.rating} size="md" showValue />
        </View>

        {/* Review Text */}
        <Text className="text-gray-900 mb-3 leading-5">
          {review.content}
        </Text>

        {/* Product Reference */}
        <View className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
          <View className="flex-row items-center">
            <Image
              source={{ uri: review.productImage }}
              className="w-12 h-12 rounded-lg"
              contentFit="cover"
            />
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-gray-900 text-sm" numberOfLines={1}>
                {review.productName}
              </Text>
              <Text className="text-primary font-bold text-sm">
                R$ {review.productPrice.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity
              onPress={handleLike}
              className="flex-row items-center"
              activeOpacity={0.7}
            >
              <Text className="text-xl mr-1">{isLiked ? '❤️' : '🤍'}</Text>
              <Text className={`text-sm font-medium ${isLiked ? 'text-red-500' : 'text-gray-600'}`}>
                {review.likesCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center ml-4" activeOpacity={0.7}>
              <Text className="text-xl mr-1">💬</Text>
              <Text className="text-sm text-gray-600 font-medium">
                {review.commentsCount || 0}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.7}>
            <Text className="text-xl">🔗</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
