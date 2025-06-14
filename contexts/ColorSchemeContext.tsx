import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme, Appearance, Platform } from 'react-native';
import PlatformStorage from '@/lib/core/platform-storage';

export type ColorScheme = 'light' | 'dark';

interface ColorSchemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
}

const ColorSchemeContext = createContext<ColorSchemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme-preference';

// Web-safe storage wrapper
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return PlatformStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore storage errors on web
      }
    } else {
      await PlatformStorage.setItem(key, value);
    }
  }
};

export function ColorSchemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('light');

  useEffect(() => {
    // Load saved preference once on mount
    storage.getItem(THEME_STORAGE_KEY).then((savedTheme) => {
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setColorSchemeState(savedTheme);
        updateAppearance(savedTheme);
      } else {
        // Use system preference if no saved theme
        const systemScheme = Appearance.getColorScheme() || 'light';
        setColorSchemeState(systemScheme);
        updateAppearance(systemScheme);
      }
    });
  }, []); // Empty dependency array to prevent infinite loops

  const updateAppearance = (scheme: ColorScheme) => {
    // Update the system appearance if possible
    if (Appearance.setColorScheme) {
      Appearance.setColorScheme(scheme);
    }
    
    // Update web document class
    if (typeof document !== 'undefined') {
      if (scheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    }
  };

  const setColorScheme = async (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    await storage.setItem(THEME_STORAGE_KEY, scheme);
    updateAppearance(scheme);
  };

  const toggleColorScheme = () => {
    const newScheme = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newScheme);
  };

  return (
    <ColorSchemeContext.Provider value={{ colorScheme, setColorScheme, toggleColorScheme }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme() {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error('useColorScheme must be used within a ColorSchemeProvider');
  }
  return context.colorScheme;
}

export function useColorSchemeContext() {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error('useColorSchemeContext must be used within a ColorSchemeProvider');
  }
  return context;
}