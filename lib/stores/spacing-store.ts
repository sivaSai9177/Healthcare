import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import PlatformStorage from '@/lib/core/platform-storage';
import { Platform } from 'react-native';
import { 
  SpacingDensity, 
  spacingTheme, 
  getSpacing,
  SpacingScale 
} from '@/lib/design/spacing';

interface SpacingStore {
  // Current settings
  density: SpacingDensity;
  
  // Computed values
  spacing: Record<SpacingScale, number>;
  componentSpacing: typeof spacingTheme.componentSpacing[SpacingDensity];
  typographyScale: typeof spacingTheme.typographyScale[SpacingDensity];
  componentSizes: typeof spacingTheme.componentSizes[SpacingDensity];
  
  // Actions
  setDensity: (density: SpacingDensity) => void;
  reset: () => void;
  
  // Computed helpers
  getSpacingValue: (scale: SpacingScale) => number;
}

export const useSpacingStore = create<SpacingStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        density: 'medium',
        spacing: getSpacing('medium'),
        componentSpacing: spacingTheme.componentSpacing.medium,
        typographyScale: spacingTheme.typographyScale.medium,
        componentSizes: spacingTheme.componentSizes.medium,
        
        // Actions
        setDensity: (density) =>
          set((state) => {
            state.density = density;
            state.spacing = getSpacing(density);
            state.componentSpacing = spacingTheme.componentSpacing[density];
            state.typographyScale = spacingTheme.typographyScale[density];
            state.componentSizes = spacingTheme.componentSizes[density];
          }),
          
        reset: () =>
          set((state) => {
            state.density = 'medium';
            state.spacing = getSpacing('medium');
            state.componentSpacing = spacingTheme.componentSpacing.medium;
            state.typographyScale = spacingTheme.typographyScale.medium;
            state.componentSizes = spacingTheme.componentSizes.medium;
          }),
          
        // Computed helpers
        getSpacingValue: (scale) => {
          const spacing = get().spacing;
          return spacing[scale] || 0;
        },
      })),
      {
        name: 'spacing-preferences',
        storage: Platform.OS === 'web' 
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
            },
        partialize: (state) => {
          return { density: state.density };
        },
      }
    ),
    {
      name: 'spacing-store',
    }
  )
);

// Helper hooks
export const useSpacing = () => {
  const store = useSpacingStore();
  return {
    spacing: store.spacing,
    density: store.density,
    componentSpacing: store.componentSpacing,
    typographyScale: store.typographyScale,
    componentSizes: store.componentSizes,
    setDensity: store.setDensity,
  };
};