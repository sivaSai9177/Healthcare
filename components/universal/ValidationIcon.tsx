import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { Symbol } from './Symbols';

interface ValidationIconProps {
  status: 'success' | 'error' | 'none';
  size?: number;
}

export function ValidationIcon({ status, size = 20 }: ValidationIconProps) {
  const theme = useTheme();
  
  if (status === 'none') return null;
  
  const iconName = status === 'success' ? 'checkmark.circle.fill' : 'xmark.circle.fill';
  const color = status === 'success' ? (theme.success || theme.accent) : theme.destructive;
  
  return (
    <View style={{ width: size, height: size }}>
      <Symbol 
        name={iconName} 
        size={size} 
        color={color}
      />
    </View>
  );
}
