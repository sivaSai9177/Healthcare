import { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';
import { DURATIONS, EASINGS } from './constants';

/**
 * Animation utility functions
 */

// Spring configurations
export const getSpringConfig = (preset: 'default' | 'gentle' | 'bouncy' | 'stiff' = 'default'): WithSpringConfig => {
  const configs = {
    default: {
      damping: 10,
      stiffness: 100,
      mass: 1,
    },
    gentle: {
      damping: 15,
      stiffness: 60,
      mass: 1,
    },
    bouncy: {
      damping: 8,
      stiffness: 150,
      mass: 0.5,
    },
    stiff: {
      damping: 20,
      stiffness: 200,
      mass: 1.5,
    },
  };

  return configs[preset];
};

// Timing configurations
export const getTimingConfig = (
  duration: number = DURATIONS.normal,
  easing: typeof EASINGS[keyof typeof EASINGS] = EASINGS.easeInOut
): WithTimingConfig => {
  return {
    duration,
    easing,
  };
};

// Calculate stagger delay
export const getStaggerDelay = (index: number, baseDelay: number = 50): number => {
  return index * baseDelay;
};

// Check if animations should be reduced
export const shouldReduceMotion = (): boolean => {
  // This would check device settings on native platforms
  // For now, always return false
  return false;
};