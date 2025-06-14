/**
 * Enhanced Animation Hooks
 * Provides unified animation API for both web (Tailwind) and native (Reanimated)
 */

import { useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { cn } from '@/lib/core/utils';

// Duration mapping
const DURATION_MAP = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700,
  slowest: 1000,
} as const;

type DurationType = keyof typeof DURATION_MAP;
type DirectionType = 'up' | 'down' | 'left' | 'right';

interface BaseAnimationOptions {
  duration?: DurationType;
  delay?: number;
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  onComplete?: () => void;
}

interface FadeAnimationOptions extends BaseAnimationOptions {
  initialOpacity?: number;
  loop?: boolean;
  reverse?: boolean;
}

interface ScaleAnimationOptions extends BaseAnimationOptions {
  initialScale?: number;
  finalScale?: number;
  springConfig?: 'gentle' | 'bouncy' | 'stiff';
}

interface EntranceAnimationOptions extends BaseAnimationOptions {
  type?: 'fade' | 'scale' | 'slide' | 'scale-fade';
  from?: DirectionType;
  distance?: number;
}

interface ListAnimationOptions {
  itemCount: number;
  staggerDelay?: number;
  animationType?: 'fade' | 'slide' | 'scale';
  duration?: DurationType;
}

/**
 * Fade Animation Hook
 * Provides fade in/out animations with optional looping
 */
export function useFadeAnimation(options: FadeAnimationOptions = {}) {
  const { shouldAnimate, getAnimationDuration } = useAnimationStore();
  const {
    duration = 'normal',
    delay = 0,
    initialOpacity = 0,
    loop = false,
    reverse = false,
    onComplete,
  } = options;

  const opacity = useSharedValue(initialOpacity);
  const animDuration = getAnimationDuration(DURATION_MAP[duration]);

  // Web implementation - return Tailwind classes
  if (Platform.OS === 'web') {
    const animationClass = shouldAnimate() ? cn(
      'animate-fade-in',
      duration !== 'normal' && `duration-${duration}`,
      delay > 0 && `delay-${delay}`,
      loop && 'animate-infinite',
      reverse && 'animate-reverse'
    ) : '';

    return {
      className: animationClass,
      animatedStyle: {},
      fadeIn: () => {},
      fadeOut: () => {},
    };
  }

  // Native implementation - use Reanimated
  const fadeIn = useCallback(() => {
    'worklet';
    if (!shouldAnimate()) {
      opacity.value = 1;
      if (onComplete) runOnJS(onComplete)();
      return;
    }

    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: animDuration }, (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      })
    );
  }, [opacity, delay, animDuration, shouldAnimate, onComplete]);

  const fadeOut = useCallback(() => {
    'worklet';
    if (!shouldAnimate()) {
      opacity.value = 0;
      if (onComplete) runOnJS(onComplete)();
      return;
    }

    opacity.value = withDelay(
      delay,
      withTiming(0, { duration: animDuration }, (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      })
    );
  }, [opacity, delay, animDuration, shouldAnimate, onComplete]);

  useEffect(() => {
    if (loop && shouldAnimate()) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: animDuration }),
          withTiming(initialOpacity, { duration: animDuration })
        ),
        -1,
        reverse
      );
    }
  }, [loop, reverse, opacity, animDuration, initialOpacity, shouldAnimate]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return {
    className: '',
    animatedStyle,
    fadeIn,
    fadeOut,
  };
}

/**
 * Scale Animation Hook
 * Provides scale animations with spring physics
 */
export function useScaleAnimation(options: ScaleAnimationOptions = {}) {
  const { shouldAnimate } = useAnimationStore();
  const {
    duration = 'normal',
    delay = 0,
    initialScale = 0.95,
    finalScale = 1,
    springConfig = 'gentle',
    onComplete,
  } = options;

  const scale = useSharedValue(initialScale);

  // Web implementation
  if (Platform.OS === 'web') {
    const animationClass = shouldAnimate() ? cn(
      'animate-scale-in',
      duration !== 'normal' && `duration-${duration}`,
      delay > 0 && `delay-${delay}`
    ) : '';

    return {
      className: animationClass,
      animatedStyle: {},
      scaleIn: () => {},
      scaleOut: () => {},
    };
  }

  // Spring configurations
  const springConfigs = {
    gentle: { damping: 15, stiffness: 200 },
    bouncy: { damping: 10, stiffness: 150 },
    stiff: { damping: 20, stiffness: 300 },
  };

  const config = springConfigs[springConfig];

  const scaleIn = useCallback(() => {
    'worklet';
    if (!shouldAnimate()) {
      scale.value = finalScale;
      if (onComplete) runOnJS(onComplete)();
      return;
    }

    scale.value = withDelay(
      delay,
      withSpring(finalScale, config, (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      })
    );
  }, [scale, delay, finalScale, config, shouldAnimate, onComplete]);

  const scaleOut = useCallback(() => {
    'worklet';
    if (!shouldAnimate()) {
      scale.value = initialScale;
      if (onComplete) runOnJS(onComplete)();
      return;
    }

    scale.value = withDelay(
      delay,
      withSpring(initialScale, config, (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      })
    );
  }, [scale, delay, initialScale, config, shouldAnimate, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    className: '',
    animatedStyle,
    scaleIn,
    scaleOut,
  };
}

/**
 * Entrance Animation Hook
 * Provides various entrance animations for components
 */
export function useEntranceAnimation(options: EntranceAnimationOptions = {}) {
  const { shouldAnimate, getAnimationDuration } = useAnimationStore();
  const {
    type = 'fade',
    duration = 'normal',
    delay = 0,
    from = 'down',
    distance = 20,
    onComplete,
  } = options;

  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(type === 'scale' || type === 'scale-fade' ? 0.95 : 1);
  const animDuration = getAnimationDuration(DURATION_MAP[duration]);

  // Calculate stagger delay for web
  const staggerIndex = Math.min(Math.ceil(delay / 50), 6);
  const staggerClass = staggerIndex > 0 ? `delay-stagger-${staggerIndex}` : '';

  // Web implementation
  if (Platform.OS === 'web') {
    const animationMap = {
      fade: 'animate-fade-in',
      scale: 'animate-scale-in',
      slide: `animate-slide-in-${from}`,
      'scale-fade': 'animate-scale-in',
    };

    const animationClass = shouldAnimate() ? cn(
      animationMap[type],
      duration !== 'normal' && `duration-${duration}`,
      staggerClass
    ) : '';

    return {
      className: animationClass,
      animatedStyle: {},
    };
  }

  // Native implementation
  useEffect(() => {
    if (!shouldAnimate()) {
      opacity.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      scale.value = 1;
      if (onComplete) onComplete();
      return;
    }

    // Set initial positions
    if (type === 'slide' || type === 'scale-fade') {
      switch (from) {
        case 'up':
          translateY.value = -distance;
          break;
        case 'down':
          translateY.value = distance;
          break;
        case 'left':
          translateX.value = -distance;
          break;
        case 'right':
          translateX.value = distance;
          break;
      }
    }

    // Animate to final position
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: animDuration })
    );

    if (type === 'slide' || type === 'scale-fade') {
      translateX.value = withDelay(
        delay,
        withTiming(0, { duration: animDuration })
      );
      translateY.value = withDelay(
        delay,
        withTiming(0, { duration: animDuration })
      );
    }

    if (type === 'scale' || type === 'scale-fade') {
      scale.value = withDelay(
        delay,
        withSpring(1, { damping: 15, stiffness: 200 }, (finished) => {
          if (finished && onComplete) runOnJS(onComplete)();
        })
      );
    }
  }, [type, from, distance, delay, animDuration, shouldAnimate, onComplete, opacity, translateX, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value } as any,
      { translateY: translateY.value } as any,
      { scale: scale.value } as any,
    ],
  }));

  return {
    className: '',
    animatedStyle,
  };
}

/**
 * List Animation Hook
 * Provides staggered animations for list items
 */
export function useListAnimation(options: ListAnimationOptions) {
  const { itemCount, staggerDelay = 50, animationType = 'fade', duration = 'normal' } = options;
  
  return useMemo(() => {
    return Array.from({ length: itemCount }, (_, index) => {
      const delay = index * staggerDelay;
      const staggerIndex = Math.min(index + 1, 6);
      
      if (Platform.OS === 'web') {
        const animationMap = {
          fade: 'animate-fade-in',
          slide: 'animate-slide-in-up',
          scale: 'animate-scale-in',
        };
        
        return {
          className: cn(
            animationMap[animationType],
            duration !== 'normal' && `duration-${duration}`,
            `delay-stagger-${staggerIndex}`
          ),
          style: {
            '--stagger-delay': `${delay}ms`,
          } as React.CSSProperties,
        };
      }
      
      // For native, return entrance animation with delay
      return useEntranceAnimation({
        type: animationType === 'slide' ? 'slide' : animationType as any,
        delay,
        duration,
      });
    });
  }, [itemCount, staggerDelay, animationType, duration]);
}

/**
 * Page Transition Hook
 * Provides page-level transition animations
 */
export function usePageTransition(type: 'fade' | 'slide' | 'scale' = 'fade') {
  const { shouldAnimate } = useAnimationStore();
  
  if (Platform.OS === 'web') {
    const transitionMap = {
      fade: 'animate-fade-in duration-normal',
      slide: 'animate-slide-in-right duration-normal',
      scale: 'animate-scale-in duration-normal',
    };
    
    return {
      entering: shouldAnimate() ? transitionMap[type] : '',
      exiting: shouldAnimate() ? 'animate-fade-out duration-fast' : '',
    };
  }
  
  // For native, return appropriate animation configurations
  return {
    entering: useEntranceAnimation({ type, duration: 'normal' }),
    exiting: useFadeAnimation({ duration: 'fast' }),
  };
}

/**
 * Interaction Animation Hook
 * Provides hover, press, and focus animations
 */
export function useInteractionAnimation() {
  const { shouldAnimate } = useAnimationStore();
  
  if (Platform.OS === 'web') {
    return {
      hover: shouldAnimate() ? 'hover:scale-[1.02] transition-transform duration-200' : '',
      press: shouldAnimate() ? 'active:scale-[0.98] transition-transform duration-150' : '',
      focus: shouldAnimate() ? 'focus:ring-2 focus:ring-primary transition-all duration-200' : '',
    };
  }
  
  // For native, we handle these in the component with Reanimated
  return {
    hover: '',
    press: '',
    focus: '',
  };
}