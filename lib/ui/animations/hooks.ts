/**
 * Simplified Animation Hooks
 * Cross-platform animation hooks using Tailwind utilities
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform, Animated } from 'react-native';
import { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { 
  ANIMATION_CLASSES, 
  TRANSITION_CLASSES,
  DURATION_CLASSES,
  DELAY_CLASSES,
  AnimationType,
  DurationType 
} from './constants';

interface AnimationOptions {
  duration?: DurationType;
  delay?: number;
  onComplete?: () => void;
}

/**
 * Universal animation hook that works on both web and native
 * On web: Returns Tailwind classes
 * On native: Uses Reanimated
 */
export function useAnimation(type: AnimationType, options: AnimationOptions = {}) {
  const { enableAnimations } = useAnimationStore();
  const [isAnimating, setIsAnimating] = useState(false);
  
  if (Platform.OS === 'web') {
    // Web implementation using Tailwind classes
    const animationClass = enableAnimations ? ANIMATION_CLASSES[type] : '';
    const durationClass = options.duration ? DURATION_CLASSES[options.duration] : '';
    
    const className = [animationClass, durationClass].filter(Boolean).join(' ');
    
    const trigger = useCallback(() => {
      if (!enableAnimations) {
        options.onComplete?.();
        return;
      }
      
      setIsAnimating(true);
      
      // Calculate duration
      const durations = {
        instant: 0,
        fast: 150,
        normal: 300,
        slow: 500,
        slower: 700,
        slowest: 1000,
      };
      
      const duration = durations[options.duration || 'normal'] + (options.delay || 0);
      
      setTimeout(() => {
        setIsAnimating(false);
        options.onComplete?.();
      }, duration);
    }, [enableAnimations, options]);
    
    return {
      className,
      trigger,
      isAnimating,
    };
  }
  
  // Native implementation using Reanimated
  const animatedValue = useSharedValue(0);
  
  const trigger = useCallback(() => {
    'worklet';
    if (!enableAnimations) {
      animatedValue.value = 1;
      if (options.onComplete) {
        runOnJS(options.onComplete)();
      }
      return;
    }
    
    const durations = {
      instant: 0,
      fast: 150,
      normal: 300,
      slow: 500,
      slower: 700,
      slowest: 1000,
    };
    
    const duration = durations[options.duration || 'normal'];
    
    animatedValue.value = withDelay(
      options.delay || 0,
      withTiming(1, { duration }, (finished) => {
        if (finished && options.onComplete) {
          runOnJS(options.onComplete)();
        }
      })
    );
  }, [enableAnimations, options, animatedValue]);
  
  const animatedStyle = useAnimatedStyle(() => {
    switch (type) {
      case 'fadeIn':
        return { opacity: animatedValue.value };
      case 'fadeOut':
        return { opacity: 1 - animatedValue.value };
      case 'scaleIn':
        return {
          opacity: animatedValue.value,
          transform: [{ scale: interpolate(animatedValue.value, [0, 1], [0.95, 1]) }],
        };
      case 'scaleOut':
        return {
          opacity: 1 - animatedValue.value,
          transform: [{ scale: interpolate(animatedValue.value, [0, 1], [1, 0.95]) }],
        };
      case 'slideInUp':
        return {
          opacity: animatedValue.value,
          transform: [{ translateY: interpolate(animatedValue.value, [0, 1], [20, 0]) }],
        };
      case 'slideInDown':
        return {
          opacity: animatedValue.value,
          transform: [{ translateY: interpolate(animatedValue.value, [0, 1], [-20, 0]) }],
        };
      case 'slideInLeft':
        return {
          opacity: animatedValue.value,
          transform: [{ translateX: interpolate(animatedValue.value, [0, 1], [-20, 0]) }],
        };
      case 'slideInRight':
        return {
          opacity: animatedValue.value,
          transform: [{ translateX: interpolate(animatedValue.value, [0, 1], [20, 0]) }],
        };
      default:
        return {};
    }
  });
  
  return {
    animatedStyle,
    trigger,
    isAnimating,
  };
}

/**
 * Transition hook for hover and state changes
 * Uses Tailwind transition utilities
 */
export function useTransition(type: keyof typeof TRANSITION_CLASSES = 'all', duration: DurationType = 'normal') {
  const { enableAnimations } = useAnimationStore();
  
  const className = enableAnimations 
    ? `${TRANSITION_CLASSES[type]} ${DURATION_CLASSES[duration]}`
    : '';
    
  return { className };
}

/**
 * Stagger animation hook for lists
 */
export function useStaggerAnimation(itemCount: number, options: AnimationOptions = {}) {
  const animations = Array.from({ length: itemCount }, (_, index) => {
    const delayClass = DELAY_CLASSES[`stagger-${Math.min(index + 1, 6)}` as keyof typeof DELAY_CLASSES];
    return {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      ...useAnimation('fadeIn', { ...options, delay: index * 50 }),
      delayClass,
    };
  });
  
  return animations;
}

/**
 * Spring animation hook (native only, falls back to timing on web)
 */
export function useSpringAnimation(options: {
  from?: number;
  to?: number;
  tension?: number;
  friction?: number;
  onComplete?: () => void;
} = {}) {
  const { enableAnimations } = useAnimationStore();
  const { from = 0, to = 1, tension = 100, friction = 10, onComplete } = options;
  
  const animatedValue = useSharedValue(from);
  
  const trigger = useCallback(() => {
    'worklet';
    if (!enableAnimations) {
      animatedValue.value = to;
      if (onComplete) {
        runOnJS(onComplete)();
      }
      return;
    }
    
    if (Platform.OS === 'web') {
      // Use timing on web
      animatedValue.value = withTiming(to, { duration: 300 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      });
    } else {
      // Use spring on native
      animatedValue.value = withSpring(to, { damping: friction, stiffness: tension }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      });
    }
  }, [enableAnimations, to, tension, friction, onComplete, animatedValue]);
  
  return {
    value: animatedValue,
    trigger,
  };
}