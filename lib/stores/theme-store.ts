import { create } from 'zustand';
import { persist, devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import PlatformStorage from '../core/platform-storage';
import { Platform, Appearance } from 'react-native';
import { themes, getTheme, ExtendedTheme } from '../theme/registry';

type ColorScheme = 'light' | 'dark';

interface ThemeState {
  // Theme selection
  themeId: string;
  colorScheme: ColorScheme;
  systemColorScheme: ColorScheme;
  useSystemTheme: boolean;
  
  // Computed theme
  theme: ExtendedTheme;
  
  // Available themes
  availableThemes: typeof themes;
  
  // Actions
  setThemeId: (themeId: string) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
  setUseSystemTheme: (useSystem: boolean) => void;
  
  // Helpers
  getCurrentTheme: () => ExtendedTheme;
  getEffectiveColorScheme: () => ColorScheme;
}

const storage = Platform.OS === 'web' 
  ? {
      getItem: (name: string) => {
        const value = localStorage.getItem(name);
        return value ? JSON.parse(value) : null;
      },
      setItem: (name: string, value: any) => {
        localStorage.setItem(name, JSON.stringify(value));
      },
      removeItem: (name: string) => {
        localStorage.removeItem(name);
      },
    }
  : {
      getItem: async (name: string) => {
        const value = await PlatformStorage.getItem(name);
        return value ? JSON.parse(value) : null;
      },
      setItem: async (name: string, value: any) => {
        await PlatformStorage.setItem(name, JSON.stringify(value));
      },
      removeItem: async (name: string) => {
        await PlatformStorage.removeItem(name);
      },
    };

// Convert hex to HSL for CSS variables
function hexToHSL(hex: string): string {
  // Handle rgba format
  if (hex.startsWith('rgba')) {
    return hex; // Return as-is for now
  }
  
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

// Helper to update appearance and CSS variables
const updateAppearance = (scheme: ColorScheme, theme: ExtendedTheme) => {
  // Update the system appearance if possible
  if (Appearance.setColorScheme) {
    Appearance.setColorScheme(scheme);
  }
  
  // Update web document class and CSS variables
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    
    // Update color scheme
    if (scheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    
    // Apply theme colors as CSS variables
    Object.entries(theme).forEach(([key, value]) => {
      if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgba'))) {
        // Convert camelCase to kebab-case
        const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        
        // Convert hex to HSL if needed
        const hslValue = value.startsWith('#') ? hexToHSL(value) : value;
        root.style.setProperty(`--${cssVar}`, hslValue);
      }
    });
  }
};

export const useThemeStore = create<ThemeState>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          // Initial state - will be overridden by persisted state
          themeId: 'default',
          colorScheme: 'light',
          systemColorScheme: Appearance.getColorScheme() || 'light',
          useSystemTheme: true,
          theme: getTheme('default').colors[Appearance.getColorScheme() || 'light'],
          availableThemes: themes,
          
          // Actions
          setThemeId: (themeId) => {
            set((state) => {
              if (themes[themeId]) {
                state.themeId = themeId;
                const effectiveScheme = state.useSystemTheme ? state.systemColorScheme : state.colorScheme;
                state.theme = getTheme(themeId).colors[effectiveScheme];
                updateAppearance(effectiveScheme, state.theme);
              }
            });
          },
          
          setColorScheme: (scheme) => {
            set((state) => {
              state.colorScheme = scheme;
              state.useSystemTheme = false;
              state.theme = getTheme(state.themeId).colors[scheme];
              updateAppearance(scheme, state.theme);
            });
          },
          
          toggleColorScheme: () => {
            const state = get();
            const currentScheme = state.useSystemTheme ? state.systemColorScheme : state.colorScheme;
            const newScheme = currentScheme === 'light' ? 'dark' : 'light';
            get().setColorScheme(newScheme);
          },
          
          setUseSystemTheme: (useSystem) => {
            set((state) => {
              state.useSystemTheme = useSystem;
              const effectiveScheme = useSystem ? state.systemColorScheme : state.colorScheme;
              state.theme = getTheme(state.themeId).colors[effectiveScheme];
              updateAppearance(effectiveScheme, state.theme);
            });
          },
          
          // Helpers
          getCurrentTheme: () => {
            const state = get();
            const effectiveScheme = state.useSystemTheme ? state.systemColorScheme : state.colorScheme;
            return getTheme(state.themeId).colors[effectiveScheme];
          },
          
          getEffectiveColorScheme: () => {
            const state = get();
            return state.useSystemTheme ? state.systemColorScheme : state.colorScheme;
          },
        })),
        {
          name: 'theme-preferences',
          storage: storage as any,
          partialize: (state) => ({
            themeId: state.themeId,
            colorScheme: state.colorScheme,
            useSystemTheme: state.useSystemTheme,
          }),
          onRehydrateStorage: () => (state) => {
            // After rehydration, update the theme object
            if (state) {
              const effectiveScheme = state.useSystemTheme ? state.systemColorScheme : state.colorScheme;
              state.theme = getTheme(state.themeId).colors[effectiveScheme];
              updateAppearance(effectiveScheme, state.theme);
            }
          },
        }
      )
    ),
    {
      name: 'theme-store',
    }
  )
);

// Subscribe to system theme changes
if (Platform.OS !== 'web') {
  Appearance.addChangeListener((preferences) => {
    const newScheme = preferences.colorScheme || 'light';
    useThemeStore.setState((state) => {
      const newTheme = state.useSystemTheme ? getTheme(state.themeId).colors[newScheme] : state.theme;
      if (state.useSystemTheme) {
        updateAppearance(newScheme, newTheme);
      }
      return {
        systemColorScheme: newScheme,
        theme: newTheme,
      };
    });
  });
}

// Convenience hooks
export const useTheme = () => useThemeStore((state) => state.theme);
export const useColorScheme = () => useThemeStore((state) => state.getEffectiveColorScheme());
export const useThemeId = () => useThemeStore((state) => state.themeId);
export const useThemeActions = () => useThemeStore((state) => ({
  setThemeId: state.setThemeId,
  setColorScheme: state.setColorScheme,
  toggleColorScheme: state.toggleColorScheme,
  setUseSystemTheme: state.setUseSystemTheme,
}));