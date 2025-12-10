import { View } from 'react-native';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}

export default function Card({
  children,
  variant = 'default',
  className = ''
}: CardProps) {
  const baseStyles = 'bg-white rounded-lg';

  const variantStyles = {
    default: '',
    elevated: 'shadow-md',
    outlined: 'border border-gray-200',
  };

  return (
    <View className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </View>
  );
}
