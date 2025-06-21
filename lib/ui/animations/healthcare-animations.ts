/**
 * Healthcare-specific animations for the Liquid Glass theme
 */

import { Platform } from 'react-native';
import {
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

// Spring configurations for healthcare interactions
export const healthcareSpringConfigs = {
  gentle: {
    damping: 18,
    stiffness: 200,
    mass: 1,
  },
  responsive: {
    damping: 15,
    stiffness: 300,
    mass: 0.8,
  },
  bouncy: {
    damping: 12,
    stiffness: 250,
    mass: 0.8,
  },
  snappy: {
    damping: 20,
    stiffness: 400,
    mass: 0.5,
  },
};

// Timing configurations
export const healthcareTimings = {
  instant: 0,
  fast: 150,
  normal: 300,
  smooth: 500,
  slow: 700,
};

// Alert-specific animations
export const alertAnimations = {
  // Urgent alert pulse
  urgentPulse: (value: any) => {
    'worklet';
    return withRepeat(
      withSequence(
        withTiming(1.05, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  },

  // Alert acknowledgment
  acknowledge: (scale: any, opacity: any) => {
    'worklet';
    scale.value = withSequence(
      withSpring(0.95, healthcareSpringConfigs.responsive),
      withSpring(1, healthcareSpringConfigs.bouncy)
    );
    opacity.value = withTiming(0.8, { duration: 200 });
  },

  // Alert resolution
  resolve: (scale: any, translateY: any, opacity: any) => {
    'worklet';
    scale.value = withSpring(0.95, healthcareSpringConfigs.gentle);
    translateY.value = withDelay(
      100,
      withSpring(-10, healthcareSpringConfigs.gentle)
    );
    opacity.value = withDelay(
      200,
      withTiming(0, { duration: 300 })
    );
  },

  // New alert entry
  enter: (scale: any, translateY: any, opacity: any, delay: number = 0) => {
    'worklet';
    scale.value = withDelay(
      delay,
      withSpring(1, healthcareSpringConfigs.bouncy)
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, healthcareSpringConfigs.responsive)
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300 })
    );
  },
};

// Shift status animations
export const shiftAnimations = {
  // Shift start
  startShift: (scale: any, glowOpacity: any) => {
    'worklet';
    scale.value = withSequence(
      withSpring(1.1, healthcareSpringConfigs.bouncy),
      withSpring(1, healthcareSpringConfigs.gentle)
    );
    glowOpacity.value = withSequence(
      withTiming(0.3, { duration: 300 }),
      withTiming(0, { duration: 500 })
    );
  },

  // Shift end
  endShift: (scale: any, opacity: any) => {
    'worklet';
    scale.value = withSpring(0.95, healthcareSpringConfigs.gentle);
    opacity.value = withTiming(0.8, { duration: 300 });
  },
};

// Metric animations
export const metricAnimations = {
  // Value update
  updateValue: (value: any, newValue: number) => {
    'worklet';
    return withSpring(newValue, healthcareSpringConfigs.responsive);
  },

  // Progress bar fill
  fillProgress: (progress: any, targetValue: number) => {
    'worklet';
    return withTiming(targetValue, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  },

  // Metric highlight
  highlight: (scale: any, glowOpacity: any) => {
    'worklet';
    scale.value = withSequence(
      withSpring(1.05, healthcareSpringConfigs.snappy),
      withSpring(1, healthcareSpringConfigs.gentle)
    );
    glowOpacity.value = withSequence(
      withTiming(0.2, { duration: 200 }),
      withTiming(0, { duration: 400 })
    );
  },
};

// Glass shimmer effect
export const glassShimmerAnimation = (progress: any) => {
  'worklet';
  return withRepeat(
    withTiming(1, {
      duration: 2000,
      easing: Easing.inOut(Easing.ease),
    }),
    -1,
    false
  );
};

// Button press animations for glass variants
export const glassButtonPress = {
  pressIn: (scale: any, translateY: any, shadowOpacity: any) => {
    'worklet';
    scale.value = withSpring(0.98, healthcareSpringConfigs.snappy);
    translateY.value = withSpring(1, healthcareSpringConfigs.snappy);
    shadowOpacity.value = withTiming(0.2, { duration: 100 });
  },

  pressOut: (scale: any, translateY: any, shadowOpacity: any) => {
    'worklet';
    scale.value = withSpring(1, healthcareSpringConfigs.responsive);
    translateY.value = withSpring(0, healthcareSpringConfigs.responsive);
    shadowOpacity.value = withTiming(0.4, { duration: 200 });
  },
};

// Platform-specific adjustments
export const getPlatformAnimation = (type: 'scale' | 'opacity' | 'transform', config: any) => {
  if (Platform.OS === 'web') {
    // Web animations are handled by CSS transitions
    return config;
  }
  
  // Native animations use Reanimated
  return config;
};