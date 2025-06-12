import { useMemo } from 'react';
import { 
  AnimationVariant, 
  AnimationVariantConfig,
  AnimationPreferences,
  getAnimationConfig,
  getAdjustedAnimation,
  defaultAnimationPreferences,
} from '@/lib/design';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useReducedMotion } from '@/hooks/responsive';

interface UseAnimationVariantOptions {
  variant?: AnimationVariant;
  preferences?: Partial<AnimationPreferences>;
  overrides?: Partial<AnimationVariantConfig>;
}

export function useAnimationVariant({
  variant = 'moderate',
  preferences,
  overrides,
}: UseAnimationVariantOptions = {}) {
  const { shouldAnimate } = useAnimationStore();
  const reducedMotion = useReducedMotion();
  
  // Combine preferences
  const finalPreferences = useMemo<AnimationPreferences>(() => ({
    ...defaultAnimationPreferences,
    ...preferences,
    reducedMotion: reducedMotion || preferences?.reducedMotion || false,
  }), [reducedMotion, preferences]);
  
  // Get adjusted variant based on preferences
  const adjustedVariant = useMemo(() => 
    getAdjustedAnimation(variant, finalPreferences),
    [variant, finalPreferences]
  );
  
  // Get final config
  const config = useMemo(() => {
    const baseConfig = getAnimationConfig(adjustedVariant);
    
    if (!overrides) return baseConfig;
    
    // Merge with overrides
    return {
      scale: { ...baseConfig.scale, ...overrides.scale },
      duration: { ...baseConfig.duration, ...overrides.duration },
      spring: { ...baseConfig.spring, ...overrides.spring },
      stagger: { ...baseConfig.stagger, ...overrides.stagger },
      entrance: { ...baseConfig.entrance, ...overrides.entrance },
      easing: { ...baseConfig.easing, ...overrides.easing },
    };
  }, [adjustedVariant, overrides]);
  
  // Helper functions
  const getSpringConfig = (type: 'default' | 'gentle' | 'wobbly' | 'stiff' = 'default') => {
    switch (type) {
      case 'gentle':
        return { damping: 25, stiffness: 350 };
      case 'wobbly':
        return { damping: 8, stiffness: 120 };
      case 'stiff':
        return { damping: 30, stiffness: 500 };
      default:
        return config.spring;
    }
  };
  
  const getDuration = (speed: 'instant' | 'fast' | 'normal' | 'slow' = 'normal') => {
    return config.duration[speed];
  };
  
  const getEasing = (type: 'standard' | 'accelerate' | 'decelerate' = 'standard') => {
    return config.easing[type];
  };
  
  return {
    // Current variant
    variant: adjustedVariant,
    
    // Configuration
    config,
    
    // Animation state
    isAnimated: shouldAnimate() && adjustedVariant !== 'none',
    
    // Common values
    hoverScale: config.scale.hover,
    pressScale: config.scale.press,
    duration: config.duration.normal,
    spring: config.spring,
    
    // Helper functions
    getSpringConfig,
    getDuration,
    getEasing,
    
    // Stagger helpers
    getStaggerDelay: (index: number, total: number, reverse = false) => {
      const base = config.stagger.base;
      const multiplier = config.stagger.multiplier;
      
      if (reverse) {
        return base + (total - index - 1) * base * multiplier;
      }
      return base + index * base * multiplier;
    },
    
    // Entrance animation helpers
    shouldFadeIn: config.entrance.fade,
    shouldScaleIn: config.entrance.scale,
    shouldSlideIn: config.entrance.slide,
    slideDistance: config.entrance.distance,
  };
}

// Hook for component-specific animation types
export function useComponentAnimation<T extends string>(
  componentType: T,
  animationType?: T,
  variant?: AnimationVariant
) {
  const { config, isAnimated } = useAnimationVariant({ variant });
  
  return {
    type: animationType || componentType,
    config,
    isAnimated,
    
    // Component-specific helpers based on type
    isActive: (type: T) => isAnimated && animationType === type,
  };
}