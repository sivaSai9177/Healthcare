import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import React from 'react';
import { log } from '@/lib/core/debug/logger';

// Haptic feedback types
export const HAPTIC_TYPES = {
  // Light feedback (most common)
  light: Haptics.ImpactFeedbackStyle.Light,
  
  // Medium feedback
  medium: Haptics.ImpactFeedbackStyle.Medium,
  
  // Heavy feedback
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
  
  // Soft feedback (iOS 13+)
  soft: Haptics.ImpactFeedbackStyle.Soft,
  
  // Rigid feedback (iOS 13+)
  rigid: Haptics.ImpactFeedbackStyle.Rigid,
  
  // Selection feedback (like picker wheel)
  selection: 'selection' as const,
  
  // Success notification
  success: 'success' as const,
  
  // Warning notification
  warning: 'warning' as const,
  
  // Error notification
  error: 'error' as const,
} as const;

// User preference store
let hapticEnabled = true;

// Set haptic preference
export function setHapticEnabled(enabled: boolean) {
  hapticEnabled = enabled;
  log.debug('Haptic feedback preference updated', 'HAPTICS', { enabled });
}

// Check if haptics are enabled
export function isHapticEnabled(): boolean {
  return hapticEnabled && Platform.OS !== 'web';
}

// Main haptic feedback function
export async function haptic(
  type: keyof typeof HAPTIC_TYPES = 'light',
  options?: {
    enableVibrateFallback?: boolean;
    ignoreAndroidSystemSettings?: boolean;
  }
): Promise<void> {
  if (!isHapticEnabled()) return;
  
  try {
    switch (type) {
      case 'selection':
        await Haptics.selectionAsync();
        break;
        
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
        
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
        
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
        
      default:
        await Haptics.impactAsync(HAPTIC_TYPES[type] as Haptics.ImpactFeedbackStyle);
    }
  } catch (error) {
    log.debug('Haptic feedback failed', 'HAPTICS', { error, type });
  }
}

// Convenience functions for common haptic patterns
export const haptics = {
  // Button press
  buttonPress: () => haptic('light'),
  
  // Toggle switch
  toggle: () => haptic('light'),
  
  // Tab selection
  tabSelect: () => haptic('selection'),
  
  // Pull to refresh
  pullToRefresh: () => haptic('medium'),
  
  // Long press
  longPress: () => haptic('medium'),
  
  // Swipe action
  swipe: () => haptic('light'),
  
  // Success action (form submit, save, etc)
  success: () => haptic('success'),
  
  // Warning action
  warning: () => haptic('warning'),
  
  // Error action (validation error, failed request)
  error: () => haptic('error'),
  
  // Navigation
  navigate: () => haptic('selection'),
  
  // Drag start
  dragStart: () => haptic('medium'),
  
  // Drag end
  dragEnd: () => haptic('light'),
  
  // Scale/zoom
  scale: () => haptic('light'),
  
  // Menu open
  menuOpen: () => haptic('light'),
  
  // Modal open
  modalOpen: () => haptic('light'),
  
  // Delete action
  delete: () => haptic('heavy'),
  
  // Notification
  notification: () => haptic('medium'),
};

// Hook for haptic feedback
export function useHaptic() {
  return {
    haptic,
    haptics,
    isEnabled: isHapticEnabled(),
    setEnabled: setHapticEnabled,
  };
}

// Higher-order component for adding haptic feedback
export function withHaptic<T extends { onPress?: () => void }>(
  Component: React.ComponentType<T>,
  hapticType: keyof typeof HAPTIC_TYPES = 'light'
) {
  return (props: T) => {
    const handlePress = () => {
      haptic(hapticType);
      props.onPress?.();
    };
    
    return <Component {...props} onPress={handlePress} />;
  };
}