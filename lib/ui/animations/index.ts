/**
 * Simplified Animation System
 * Cross-platform animations using Tailwind utilities
 */

export * from './constants';
export * from './hooks';
export * from './utils';
export * from './platform-animations';
export * from './layout-animations';
export * from './enhanced-hooks';

// Re-export commonly used animation utilities
export { 
  useAnimation,
  useTransition,
  useStaggerAnimation,
  useSpringAnimation 
} from './hooks';

// Enhanced animation hooks
export {
  useFadeAnimation,
  useScaleAnimation,
  useEntranceAnimation,
  useListAnimation,
  usePageTransition,
  useInteractionAnimation,
} from './enhanced-hooks';

export {
  ANIMATION_CLASSES,
  TRANSITION_CLASSES,
  DURATION_CLASSES,
  DELAY_CLASSES,
  HOVER_CLASSES,
  EASING_CLASSES,
} from './constants';

// Animation context
export { AnimationProvider, useAnimationContext } from './AnimationContext';