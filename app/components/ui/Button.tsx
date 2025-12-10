import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import type { ReactNode } from 'react';

interface ButtonProps {
  onPress: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export default function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
}: ButtonProps) {
  const baseStyles = 'rounded-lg items-center justify-center flex-row';

  const variantStyles = {
    primary: 'bg-primary active:bg-primary-dark',
    secondary: 'bg-secondary active:bg-secondary/90',
    outline: 'border-2 border-primary bg-transparent',
    ghost: 'bg-transparent',
  };

  const sizeStyles = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const textVariantStyles = {
    primary: 'text-white font-semibold',
    secondary: 'text-white font-semibold',
    outline: 'text-primary font-semibold',
    ghost: 'text-primary font-semibold',
  };

  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const disabledStyles = disabled || loading ? 'opacity-50' : '';
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${widthStyles} ${className}`}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#3b82f6' : '#ffffff'} />
      ) : (
        <Text className={`${textVariantStyles[variant]} ${textSizeStyles[size]}`}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
