import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/contexts/ColorSchemeContext';
import { themes, getTheme, ThemeDefinition, ExtendedTheme } from './registry';
import { useThemeStore, useTheme as useZustandTheme } from '@/lib/stores/theme-store';
import { log } from '@/lib/core/debug/logger';

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

const THEME_STORAGE_KEY = '@app/selected-theme';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within EnhancedThemeProvider');
  }
  return context.theme;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within EnhancedThemeProvider');
  }
  return context;
}

export function EnhancedThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [themeId, setThemeIdState] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedThemeId = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedThemeId && themes[savedThemeId]) {
        setThemeIdState(savedThemeId);
      }
    } catch (error) {
      log.error('Error loading theme preference', 'THEME', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeId = async (newThemeId: string) => {
    if (themes[newThemeId]) {
      setThemeIdState(newThemeId);
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeId);
      } catch (error) {
        log.error('Error saving theme preference', 'THEME', error);
      }
    }
  };

  const theme = useMemo(() => {
    const selectedTheme = getTheme(themeId);
    return colorScheme === 'dark' 
      ? selectedTheme.colors.dark 
      : selectedTheme.colors.light;
  }, [themeId, colorScheme]);

  // Always provide a theme, even during loading
  const defaultTheme = useMemo(() => {
    const defaultThemeDefinition = getTheme('default');
    return colorScheme === 'dark' 
      ? defaultThemeDefinition.colors.dark 
      : defaultThemeDefinition.colors.light;
  }, [colorScheme]);

  const value = useMemo(() => ({
    theme: isLoading ? defaultTheme : theme,
    themeId: isLoading ? 'default' : themeId,
    setThemeId,
    colorScheme: colorScheme || 'light',
    availableThemes: themes,
  }), [theme, themeId, colorScheme, isLoading, defaultTheme]);

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
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
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