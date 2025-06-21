import { useEffect, useRef } from 'react';
import { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  runOnJS,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useTheme } from '@/lib/theme/provider';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { DURATIONS } from '@/lib/ui/animations/constants';
import { haptic } from '@/lib/ui/haptics';

interface LayoutTransitionOptions {
  type?: 'fade' | 'slide' | 'scale' | 'glass';
  duration?: number;
  delay?: number;
  onComplete?: () => void;
  hapticFeedback?: boolean;
}

export function useLayoutTransition(options: LayoutTransitionOptions = {}) {
  const {
    type = 'fade',
    duration = DURATIONS.normal,
    delay = 0,
    onComplete,
    hapticFeedback = true,
  } = options;

  const theme = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const { reducedMotion } = useAnimationStore();
  
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(50);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const blur = useSharedValue(10);
  
  const previousSegments = useRef(segments);
  const isTransitioning = useRef(false);

  // Detect route changes
  useEffect(() => {
    const hasRouteChanged = 
      segments.length !== previousSegments.current.length ||
      segments.some((seg, i) => seg !== previousSegments.current[i]);

    if (hasRouteChanged && !isTransitioning.current) {
      isTransitioning.current = true;
      
      // Trigger haptic on route change
      if (hapticFeedback && Platform.OS !== 'web') {
        runOnJS(haptic)('light');
      }

      // Reset values for exit animation
      cancelAnimation(opacity);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(scale);
      cancelAnimation(blur);

      // Animate in
      const animateDuration = reducedMotion ? 0 : duration;
      const animateDelay = reducedMotion ? 0 : delay;

      if (type === 'fade' || type === 'glass') {
        opacity.value = withDelay(
          animateDelay,
          withTiming(1, {
            duration: animateDuration,
            easing: Easing.out(Easing.ease),
          }, () => {
            if (onComplete) runOnJS(onComplete)();
            isTransitioning.current = false;
          })
        );
      }

      if (type === 'slide') {
        translateX.value = withDelay(
          animateDelay,
          withSpring(0, {
            damping: 20,
            stiffness: 90,
            mass: 1,
          })
        );
        opacity.value = withDelay(
          animateDelay,
          withTiming(1, { duration: animateDuration })
        );
      }

      if (type === 'scale' || type === 'glass') {
        scale.value = withDelay(
          animateDelay,
          withSpring(1, {
            damping: 15,
            stiffness: 150,
            mass: 1,
          })
        );
      }

      if (type === 'glass' && Platform.OS === 'web') {
        blur.value = withDelay(
          animateDelay,
          withTiming(0, {
            duration: animateDuration,
            easing: Easing.out(Easing.ease),
          })
        );
      }

      previousSegments.current = segments;
    }
  }, [segments, type, duration, delay, onComplete, hapticFeedback, reducedMotion]);

  // Create animated styles based on transition type
  const animatedStyle = useAnimatedStyle(() => {
    const styles: any = {};

    if (type === 'fade' || type === 'glass') {
      styles.opacity = opacity.value;
    }

    if (type === 'slide') {
      styles.transform = [{ translateX: translateX.value }];
      styles.opacity = opacity.value;
    }

    if (type === 'scale') {
      styles.transform = [{ scale: scale.value }];
      styles.opacity = opacity.value;
    }

    if (type === 'glass') {
      styles.transform = [
        { scale: scale.value },
        { translateX: translateX.value * 0.5 },
      ];
      
      if (Platform.OS === 'web') {
        // Apply glass effect on web
        styles.backdropFilter = `blur(${blur.value}px)`;
        styles.WebkitBackdropFilter = `blur(${blur.value}px)`;
      }
    }

    return styles;
  });

  // Helper to manually trigger transition
  const triggerTransition = (reverse = false) => {
    const animateDuration = reducedMotion ? 0 : duration;
    
    if (reverse) {
      // Exit animation
      opacity.value = withTiming(0, { duration: animateDuration });
      translateX.value = withTiming(50, { duration: animateDuration });
      scale.value = withTiming(0.95, { duration: animateDuration });
      blur.value = withTiming(10, { duration: animateDuration });
    } else {
      // Enter animation
      opacity.value = withTiming(1, { duration: animateDuration });
      translateX.value = withSpring(0);
      scale.value = withSpring(1);
      blur.value = withTiming(0, { duration: animateDuration });
    }
  };

  return {
    animatedStyle,
    opacity,
    translateX,
    translateY,
    scale,
    blur,
    triggerTransition,
    isTransitioning: isTransitioning.current,
  };
}

// Hook for animating layout changes within a screen
export function useLayoutAnimation(options: {
  trigger?: any;
  type?: 'spring' | 'timing';
  duration?: number;
} = {}) {
  const { trigger, type = 'spring', duration = DURATIONS.normal } = options;
  const { reducedMotion } = useAnimationStore();
  
  const animatedValue = useSharedValue(0);
  
  useEffect(() => {
    if (reducedMotion) {
      animatedValue.value = 1;
      return;
    }

    if (type === 'spring') {
      animatedValue.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
        mass: 1,
      });
    } else {
      animatedValue.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [trigger, type, duration, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedValue.value,
    transform: [
      {
        scale: interpolate(
          animatedValue.value,
          [0, 1],
          [0.95, 1]
        ),
      },
    ],
  }));

  return { animatedStyle, animatedValue };
}