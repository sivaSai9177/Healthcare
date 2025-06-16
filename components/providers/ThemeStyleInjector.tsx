import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { useThemeStore } from '@/lib/stores/theme-store';

// Convert hex to HSL for CSS variables
function hexToHSL(hex: string): string {
  // Remove the hash if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  if (max === min) {
    return `0 0% ${Math.round(l * 100)}%`;
  }
  
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ThemeStyleInjector({ children }: { children?: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  const colorScheme = useThemeStore((state) => state.getEffectiveColorScheme());
  
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    // Update CSS variables
    const root = document.documentElement;
    
    // Apply theme colors as CSS variables
    Object.entries(theme).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('#')) {
        // Convert camelCase to kebab-case and handle special cases
        let cssVar = key;
        
        // Map theme keys to CSS variable names
        if (key === 'cardForeground') cssVar = 'card-foreground';
        else if (key === 'popoverForeground') cssVar = 'popover-foreground';
        else if (key === 'primaryForeground') cssVar = 'primary-foreground';
        else if (key === 'secondaryForeground') cssVar = 'secondary-foreground';
        else if (key === 'mutedForeground') cssVar = 'muted-foreground';
        else if (key === 'accentForeground') cssVar = 'accent-foreground';
        else if (key === 'destructiveForeground') cssVar = 'destructive-foreground';
        else if (key === 'successForeground') cssVar = 'success-foreground';
        else cssVar = key;
        
        const hslValue = hexToHSL(value);
        root.style.setProperty(`--${cssVar}`, hslValue);
      }
    });
    
    // Update dark mode class
    if (colorScheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
  }, [theme, colorScheme]);
  
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