import { create } from 'zustand';
import { persist, devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface AnimationState {
  // User preferences
  reducedMotion: boolean;
  animationSpeed: number; // 0.5 = slow, 1 = normal, 2 = fast
  enableAnimations: boolean;
  debugMode: boolean; // Disable animations for debugging
  
  // Settings
  setReducedMotion: (value: boolean) => void;
  setAnimationSpeed: (value: number) => void;
  setEnableAnimations: (value: boolean) => void;
  setDebugMode: (value: boolean) => void;
  
  // Helpers
  getAnimationDuration: (baseDuration: number) => number;
  shouldAnimate: () => boolean;
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
        const value = await AsyncStorage.getItem(name);
        return value ? JSON.parse(value) : null;
      },
      setItem: async (name: string, value: any) => {
        await AsyncStorage.setItem(name, JSON.stringify(value));
      },
      removeItem: async (name: string) => {
        await AsyncStorage.removeItem(name);
      },
    };

export const useAnimationStore = create<AnimationState>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          // Default values
          reducedMotion: false,
          animationSpeed: 1,
          enableAnimations: true,
          debugMode: false,
          
          // Setters
          setReducedMotion: (value) => set((state) => {
            state.reducedMotion = value;
          }),
          setAnimationSpeed: (value) => set((state) => {
            state.animationSpeed = Math.max(0.1, Math.min(5, value));
          }),
          setEnableAnimations: (value) => set((state) => {
            state.enableAnimations = value;
          }),
          setDebugMode: (value) => set((state) => {
            state.debugMode = value;
          }),
          
          // Helpers
          getAnimationDuration: (baseDuration) => {
            const state = get();
            if (!state.enableAnimations || state.reducedMotion || state.debugMode) return 0;
            return baseDuration / state.animationSpeed;
          },
          
          shouldAnimate: () => {
            const state = get();
            return state.enableAnimations && !state.reducedMotion && !state.debugMode;
          },
        })),
        {
          name: 'animation-preferences',
          storage: storage as any,
        }
      )
    ),
    {
      name: 'animation-store',
    }
  )
);