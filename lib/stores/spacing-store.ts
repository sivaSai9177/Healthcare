import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
        storage: {
          getItem: async (name) => {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: async (name, value) => {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: async (name) => {
            await AsyncStorage.removeItem(name);
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