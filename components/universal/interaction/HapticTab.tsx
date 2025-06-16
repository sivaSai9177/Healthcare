import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface HapticTabProps extends PressableProps {
  children: React.ReactNode;
}

export function HapticTab({ children, onPress, ...rest }: HapticTabProps) {
  const handlePress = (event: any) => {
    // Trigger haptic feedback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Silently ignore haptic errors (e.g., on web)
    }
    onPress?.(event);
  };

  return (
    <Pressable onPress={handlePress} {...rest}>
      {children}
    </Pressable>
  );
}