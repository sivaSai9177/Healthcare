import React from 'react';
import { Platform, View } from 'react-native';
import { useThemeStore } from '@/lib/stores/theme-store';

/**
 * ThemeStyleInjector
 * 
 * Handles platform-specific theme injection:
 * - Web: CSS variables are handled by the theme store
 * - Native: Wraps children with background color
 */
export function ThemeStyleInjector({ children }: { children?: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  
  // On native platforms, wrap children with a View that has the background color
  if (Platform.OS !== 'web' && children) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        {children}
      </View>
    );
  }
  
  return children ? <>{children}</> : null;
}