/**
 * Animation Constants
 * Using Tailwind classes and durations
 */

// Animation types that map to Tailwind classes
export const ANIMATION_CLASSES = {
  // Fade animations
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  fadeInFast: 'animate-fade-in-fast',
  fadeInSlow: 'animate-fade-in-slow',
  
  // Scale animations
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',
  scaleInFast: 'animate-scale-in-fast',
  scaleInSlow: 'animate-scale-in-slow',
  
  // Slide animations
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  
  // Special effects
  shake: 'animate-shake',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
} as const;

// Transition classes
export const TRANSITION_CLASSES = {
  all: 'transition-all',
  opacity: 'transition-opacity',
  transform: 'transition-transform',
  colors: 'transition-colors',
} as const;

// Duration classes (matches Tailwind config)
export const DURATION_CLASSES = {
  instant: 'duration-0',
  fast: 'duration-150',
  normal: 'duration-300',
  slow: 'duration-500',
  slower: 'duration-700',
  slowest: 'duration-1000',
} as const;

// Delay classes for stagger effects
export const DELAY_CLASSES = {
  'stagger-1': 'delay-[50ms]',
  'stagger-2': 'delay-[100ms]',
  'stagger-3': 'delay-[150ms]',
  'stagger-4': 'delay-[200ms]',
  'stagger-5': 'delay-[250ms]',
  'stagger-6': 'delay-[300ms]',
} as const;

// Hover effect classes
export const HOVER_CLASSES = {
  scale: 'hover:scale-105',
  scaleDown: 'hover:scale-95',
  opacity: 'hover:opacity-80',
  brightness: 'hover:brightness-110',
} as const;

// Easing classes
export const EASING_CLASSES = {
  linear: 'ease-linear',
  in: 'ease-in',
  out: 'ease-out',
  inOut: 'ease-in-out',
} as const;

// Animation type mapping
export type AnimationType = keyof typeof ANIMATION_CLASSES;
export type TransitionType = keyof typeof TRANSITION_CLASSES;
export type DurationType = keyof typeof DURATION_CLASSES;
export type DelayType = keyof typeof DELAY_CLASSES;

// Numeric durations in milliseconds (for React Native)
export const DURATIONS = {
  instant: 0,
  fast: 150,
  normal: 350,
  slow: 500,
  slower: 700,
  slowest: 1000,
} as const;

// Easing functions for React Native
export const EASINGS = {
  linear: 'linear',
  accelerate: 'ease-in',
  decelerate: 'ease-out',
  standard: 'ease-in-out',
} as const;