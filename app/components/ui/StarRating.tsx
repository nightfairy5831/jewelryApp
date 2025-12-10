import { View, Text } from 'react-native';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  className = '',
}: StarRatingProps) {
  const sizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < maxRating; i++) {
      if (i < fullStars) {
        stars.push('⭐');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('⭐');
      } else {
        stars.push('☆');
      }
    }

    return stars.join('');
  };

  return (
    <View className={`flex-row items-center ${className}`}>
      <Text className={sizeStyles[size]}>{renderStars()}</Text>
      {showValue && (
        <Text className={`ml-1 ${sizeStyles[size]} text-gray-600 font-medium`}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}
