/**
 * Simplified Animation System
 * Cross-platform animations using Tailwind utilities
 */

export * from './constants';
export * from './hooks';
export * from './utils';
export * from './platform-animations';
export * from './layout-animations';

// Re-export commonly used animation utilities
export { 
  useAnimation,
  useTransition,
  useStaggerAnimation,
  useSpringAnimation 
} from './hooks';

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