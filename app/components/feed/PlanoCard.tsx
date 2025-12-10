import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Plano } from '../../data/planos';
import Button from '../ui/Button';

interface PlanoCardProps {
  plano: Plano;
  onSubscribe: () => void;
}

export default function PlanoCard({ plano, onSubscribe }: PlanoCardProps) {
  return (
    <View className="mx-4 my-3">
      <LinearGradient
        colors={['#3b82f6', '#2563eb', '#1d4ed8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-xl p-6"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Text className="text-3xl mr-2">👑</Text>
            <Text className="text-white text-2xl font-bold">{plano.name}</Text>
          </View>
          {plano.discount && (
            <View className="bg-yellow-400 rounded-full px-3 py-1">
              <Text className="text-xs font-bold text-gray-900">
                -{plano.discount}%
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text className="text-white/90 text-sm mb-4">{plano.description}</Text>

        {/* Price */}
        <View className="mb-4">
          <View className="flex-row items-end mb-1">
            <Text className="text-white text-4xl font-bold">
              R$ {plano.price.toFixed(2)}
            </Text>
            <Text className="text-white/70 text-sm ml-2 mb-2">/{plano.billingCycle}</Text>
          </View>
          {plano.originalPrice && (
            <Text className="text-white/60 text-sm line-through">
              R$ {plano.originalPrice.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Benefits */}
        <View className="mb-5">
          {plano.benefits.map((benefit, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <Text className="text-white mr-2">✓</Text>
              <Text className="text-white/90 text-sm flex-1">{benefit}</Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={onSubscribe}
          className="bg-white rounded-lg py-4 items-center active:bg-gray-100"
          activeOpacity={0.8}
        >
          <Text className="text-primary font-bold text-base">
            Subscribe Now
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}
