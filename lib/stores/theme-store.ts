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

// Helper to update appearance
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
                updateAppearance(effectiveScheme);
              }
            });
          },
          
          setColorScheme: (scheme) => {
            set((state) => {
              state.colorScheme = scheme;
              state.useSystemTheme = false;
              state.theme = getTheme(state.themeId).colors[scheme];
              updateAppearance(scheme);
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
              updateAppearance(effectiveScheme);
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
              updateAppearance(effectiveScheme);
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
    useThemeStore.setState((state) => ({
      systemColorScheme: newScheme,
      theme: state.useSystemTheme ? getTheme(state.themeId).colors[newScheme] : state.theme,
    }));
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