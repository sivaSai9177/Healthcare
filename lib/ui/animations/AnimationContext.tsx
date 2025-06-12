import React, { createContext, useContext, ReactNode } from 'react';
import { useAnimationStore } from '@/lib/stores/animation-store';

/**
 * Animation Context for managing animation preferences
 * Note: Most animation state is now managed by Zustand store
 * This context is kept for compatibility
 */

interface AnimationContextValue {
  animationsEnabled: boolean;
  reducedMotion: boolean;
  animationSpeed: number;
}

const AnimationContext = createContext<AnimationContextValue | undefined>(undefined);

export const AnimationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { enabled, reducedMotion, speed } = useAnimationStore();

  const value: AnimationContextValue = {
    animationsEnabled: enabled,
    reducedMotion,
    animationSpeed: speed,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimationContext = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    // Return default values if context not available
    return {
      animationsEnabled: true,
      reducedMotion: false,
      animationSpeed: 1,
    };
  }
  return context;
};