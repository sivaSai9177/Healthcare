import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { cn } from '@/lib/core/utils';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: any;
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  className,
  style,
}: PrimaryButtonProps) {
  const getVariantStyles = () => {
    const base = 'rounded-lg items-center justify-center flex-row';
    
    switch (variant) {
      case 'primary':
        return `${base} bg-blue-600 ${disabled || loading ? 'opacity-50' : ''}`;
      case 'secondary':
        return `${base} bg-gray-600 ${disabled || loading ? 'opacity-50' : ''}`;
      case 'outline':
        return `${base} bg-transparent border-2 border-gray-300 ${disabled || loading ? 'opacity-50' : ''}`;
      case 'ghost':
        return `${base} bg-transparent ${disabled || loading ? 'opacity-50' : ''}`;
      default:
        return `${base} bg-blue-600 ${disabled || loading ? 'opacity-50' : ''}`;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-10 px-4';
      case 'md':
        return 'h-12 px-6';
      case 'lg':
        return 'h-14 px-8';
      default:
        return 'h-12 px-6';
    }
  };

  const getTextColor = () => {
    if (disabled || loading) return '#999999';
    
    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'secondary':
        return '#ffffff';
      case 'outline':
        return '#374151';
      case 'ghost':
        return '#374151';
      default:
        return '#ffffff';
    }
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      className={cn(getVariantStyles(), getSizeStyles(), className)}
      style={[
        style,
        { opacity: isDisabled ? 0.5 : 1 }
      ]}
    >
      {({ pressed }) => (
        <View 
          className="flex-row items-center justify-center"
          style={{ opacity: pressed && !isDisabled ? 0.8 : 1 }}
        >
          {loading && (
            <ActivityIndicator 
              size="small" 
              color={getTextColor()} 
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={{
              color: getTextColor(),
              fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}