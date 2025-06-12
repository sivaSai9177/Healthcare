/**
 * Animation Variant System
 * Provides consistent motion patterns across the design system
 */

export type AnimationVariant = 'subtle' | 'moderate' | 'energetic' | 'none';

export interface AnimationVariantConfig {
  scale: {
    hover: number;
    press: number;
  };
  duration: {
    instant: number;
    fast: number;
    normal: number;
    slow: number;
  };
  spring: {
    damping: number;
    stiffness: number;
    mass?: number;
  };
  stagger: {
    base: number;
    multiplier: number;
  };
  entrance: {
    fade: boolean;
    scale: boolean;
    slide: boolean;
    distance: number;
  };
  easing: {
    standard: number[];
    accelerate: number[];
    decelerate: number[];
  };
}

export const animationVariants: Record<AnimationVariant, AnimationVariantConfig> = {
  subtle: {
    scale: {
      hover: 1.01,
      press: 0.99,
    },
    duration: {
      instant: 0,
      fast: 150,
      normal: 250,
      slow: 400,
    },
    spring: {
      damping: 20,
      stiffness: 300,
      mass: 1,
    },
    stagger: {
      base: 30,
      multiplier: 0.8,
    },
    entrance: {
      fade: true,
      scale: false,
      slide: false,
      distance: 10,
    },
    easing: {
      standard: [0.4, 0, 0.2, 1],
      accelerate: [0.4, 0, 1, 1],
      decelerate: [0, 0, 0.2, 1],
    },
  },
  moderate: {
    scale: {
      hover: 1.03,
      press: 0.97,
    },
    duration: {
      instant: 0,
      fast: 200,
      normal: 300,
      slow: 500,
    },
    spring: {
      damping: 15,
      stiffness: 200,
      mass: 1,
    },
    stagger: {
      base: 50,
      multiplier: 1,
    },
    entrance: {
      fade: true,
      scale: true,
      slide: false,
      distance: 20,
    },
    easing: {
      standard: [0.4, 0, 0.2, 1],
      accelerate: [0.4, 0, 1, 1],
      decelerate: [0, 0, 0.2, 1],
    },
  },
  energetic: {
    scale: {
      hover: 1.05,
      press: 0.95,
    },
    duration: {
      instant: 0,
      fast: 250,
      normal: 400,
      slow: 600,
    },
    spring: {
      damping: 10,
      stiffness: 150,
      mass: 1.2,
    },
    stagger: {
      base: 80,
      multiplier: 1.2,
    },
    entrance: {
      fade: true,
      scale: true,
      slide: true,
      distance: 30,
    },
    easing: {
      standard: [0.4, 0, 0.2, 1],
      accelerate: [0.4, 0, 1, 1],
      decelerate: [0, 0, 0.2, 1],
    },
  },
  none: {
    scale: {
      hover: 1,
      press: 1,
    },
    duration: {
      instant: 0,
      fast: 0,
      normal: 0,
      slow: 0,
    },
    spring: {
      damping: 100,
      stiffness: 1000,
      mass: 1,
    },
    stagger: {
      base: 0,
      multiplier: 0,
    },
    entrance: {
      fade: false,
      scale: false,
      slide: false,
      distance: 0,
    },
    easing: {
      standard: [0, 0, 0, 0],
      accelerate: [0, 0, 0, 0],
      decelerate: [0, 0, 0, 0],
    },
  },
};

// Component-specific animation types
export type ButtonAnimationType = 'scale' | 'glow' | 'ripple' | 'shake' | 'none';
export type CardAnimationType = 'lift' | 'tilt' | 'reveal' | 'none';
export type ListAnimationType = 'stagger' | 'cascade' | 'wave' | 'none';
export type StackAnimationType = 'stagger' | 'fade' | 'slide' | 'none';
export type ContainerAnimationType = 'fade' | 'slide' | 'parallax' | 'none';
export type GridAnimationType = 'stagger' | 'cascade' | 'wave' | 'none';
export type ScrollContainerAnimationType = 'scroll-fade' | 'parallax' | 'none';
export type ScrollHeaderAnimationType = 'shrink' | 'fade' | 'blur' | 'none';
export type SeparatorAnimationType = 'shimmer' | 'pulse' | 'width' | 'none';
export type InputAnimationType = 'focus' | 'shake' | 'pulse' | 'none';
export type CheckboxAnimationType = 'check' | 'bounce' | 'scale' | 'none';
export type SwitchAnimationType = 'toggle' | 'slide' | 'glow' | 'none';
export type ToggleAnimationType = 'press' | 'scale' | 'fade' | 'none';
export type SelectAnimationType = 'dropdown' | 'fade' | 'slide' | 'none';
export type RadioAnimationType = 'select' | 'pulse' | 'scale' | 'none';
export type SliderAnimationType = 'drag' | 'track-fill' | 'thumb' | 'none';
export type SearchAnimationType = 'expand' | 'focus' | 'clear' | 'none';
export type FormAnimationType = 'validate' | 'submit' | 'error' | 'none';

// Helper to get animation config
export function getAnimationConfig(variant: AnimationVariant = 'moderate'): AnimationVariantConfig {
  return animationVariants[variant];
}

// Helper to combine variant with custom overrides
export function mergeAnimationConfig(
  variant: AnimationVariant,
  overrides?: Partial<AnimationVariantConfig>
): AnimationVariantConfig {
  const base = getAnimationConfig(variant);
  
  if (!overrides) return base;
  
  return {
    scale: { ...base.scale, ...overrides.scale },
    duration: { ...base.duration, ...overrides.duration },
    spring: { ...base.spring, ...overrides.spring },
    stagger: { ...base.stagger, ...overrides.stagger },
    entrance: { ...base.entrance, ...overrides.entrance },
    easing: { ...base.easing, ...overrides.easing },
  };
}

// Animation preset combinations for common use cases
export const animationPresets = {
  // Button presets
  buttonSubtle: {
    variant: 'subtle' as AnimationVariant,
    type: 'scale' as ButtonAnimationType,
  },
  buttonModerate: {
    variant: 'moderate' as AnimationVariant,
    type: 'scale' as ButtonAnimationType,
  },
  buttonEnergetic: {
    variant: 'energetic' as AnimationVariant,
    type: 'ripple' as ButtonAnimationType,
  },
  
  // Card presets
  cardHover: {
    variant: 'subtle' as AnimationVariant,
    type: 'lift' as CardAnimationType,
  },
  cardInteractive: {
    variant: 'moderate' as AnimationVariant,
    type: 'tilt' as CardAnimationType,
  },
  
  // List presets
  listSubtle: {
    variant: 'subtle' as AnimationVariant,
    type: 'stagger' as ListAnimationType,
  },
  listDynamic: {
    variant: 'energetic' as AnimationVariant,
    type: 'cascade' as ListAnimationType,
  },
} as const;

// Global animation preferences (can be connected to context/store)
export interface AnimationPreferences {
  variant: AnimationVariant;
  reducedMotion: boolean;
  deviceTier: 'low' | 'medium' | 'high';
}

export const defaultAnimationPreferences: AnimationPreferences = {
  variant: 'moderate',
  reducedMotion: false,
  deviceTier: 'high',
};

// Helper to adjust animation based on preferences
export function getAdjustedAnimation(
  baseVariant: AnimationVariant,
  preferences: AnimationPreferences
): AnimationVariant {
  // If reduced motion is preferred, always return 'none'
  if (preferences.reducedMotion) return 'none';
  
  // Adjust based on device tier
  if (preferences.deviceTier === 'low') {
    if (baseVariant === 'energetic') return 'subtle';
    if (baseVariant === 'moderate') return 'subtle';
  }
  
  if (preferences.deviceTier === 'medium') {
    if (baseVariant === 'energetic') return 'moderate';
  }
  
  return baseVariant;
}