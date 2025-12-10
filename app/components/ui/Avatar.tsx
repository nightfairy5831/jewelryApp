import { View, Text } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isPremium?: boolean;
  className?: string;
}

export default function Avatar({
  uri,
  name = 'User',
  size = 'md',
  isPremium = false,
  className = '',
}: AvatarProps) {
  const sizeStyles = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-3xl',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View className={`relative ${className}`}>
      <View className={`${sizeStyles[size]} rounded-full overflow-hidden bg-primary/20 items-center justify-center`}>
        {uri ? (
          <Image
            source={{ uri }}
            className="w-full h-full"
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Text className={`${textSizeStyles[size]} font-bold text-primary`}>
            {getInitials(name)}
          </Text>
        )}
      </View>
      {isPremium && (
        <View className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full w-5 h-5 items-center justify-center border-2 border-white">
          <Text className="text-xs">👑</Text>
        </View>
      )}
    </View>
  );
}
