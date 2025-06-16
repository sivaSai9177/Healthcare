import React, { createContext, useContext, useMemo } from 'react';
import { themes, ExtendedTheme } from './registry';
import { useThemeStore } from '@/lib/stores/theme-store';

export type Theme = ExtendedTheme;

// Enhanced theme context with theme selection
interface ThemeContextValue {
  theme: Theme;
  themeId: string;
  setThemeId: (themeId: string) => void;
  colorScheme: 'light' | 'dark';
  availableThemes: typeof themes;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  // Always get the current theme from the store
  const theme = useThemeStore((state) => state.getCurrentTheme());
  return theme;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within EnhancedThemeProvider');
  }
  return context;
}

export function EnhancedThemeProvider({ children }: { children: React.ReactNode }) {
  // Get all values from the theme store
  const theme = useThemeStore((state) => state.theme);
  const themeId = useThemeStore((state) => state.themeId);
  const setThemeId = useThemeStore((state) => state.setThemeId);
  const colorScheme = useThemeStore((state) => state.getEffectiveColorScheme());
  const availableThemes = useThemeStore((state) => state.availableThemes);

  const value = useMemo(() => ({
    theme,
    themeId,
    setThemeId,
    colorScheme,
    availableThemes,
  }), [theme, themeId, setThemeId, colorScheme, availableThemes]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Legacy support - export the default provider name
export const ShadcnThemeProvider = EnhancedThemeProvider;

// Theme utilities
export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? 'theme.foreground' : 'theme.background';
};

// Generate complementary colors
export const generatePalette = (primaryColor: string) => {
  // This is a simplified version - in production, use a proper color library
  const adjustColor = (color: string, amount: number) => {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  return {
    primary: primaryColor,
    primaryLight: adjustColor(primaryColor, 40),
    primaryDark: adjustColor(primaryColor, -40),
    secondary: adjustColor(primaryColor, 80),
    accent: adjustColor(primaryColor, -80),
  };
};

// Re-export types
export type { ExtendedTheme } from './registry';

// Alias exports for compatibility
export const ThemeProvider = EnhancedThemeProvider;