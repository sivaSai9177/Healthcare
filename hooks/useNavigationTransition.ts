import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { usePathname } from 'expo-router';
import { useSharedValue, withTiming, withSpring } from 'react-native-reanimated';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { haptic } from '@/lib/ui/haptics';
import { log } from '@/lib/core/debug/logger';

export interface NavigationTransitionOptions {
  type?: 'fade' | 'slide' | 'scale' | 'none';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  animationVariant?: 'subtle' | 'moderate' | 'energetic';
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
  hapticOnStart?: boolean;
  hapticOnEnd?: boolean;
}

/**
 * Hook for managing navigation transitions
 */
export function useNavigationTransition(options: NavigationTransitionOptions = {}) {
  const {
    type = 'fade',
    direction = 'right',
    duration,
    animationVariant = 'moderate',
    onTransitionStart,
    onTransitionEnd,
    hapticOnStart = true,
    hapticOnEnd = false,
  } = options;

  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({ variant: animationVariant });

  // Animation values
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const animDuration = duration ?? config.duration.normal;
  const isActive = shouldAnimate() && isAnimated && type !== 'none';

  useEffect(() => {
    if (pathname !== previousPathname.current) {
      log.debug('Navigation transition', 'NAV_TRANSITION', {
        from: previousPathname.current,
        to: pathname,
        type,
        direction,
      });

      if (isActive) {
        // Haptic feedback on start
        if (hapticOnStart && Platform.OS !== 'web') {
          haptic('light');
        }

        // Call transition start callback
        onTransitionStart?.();

        // Animate based on type
        switch (type) {
          case 'fade':
            opacity.value = 0;
            opacity.value = withTiming(1, { duration: animDuration }, () => {
              onTransitionEnd?.();
              if (hapticOnEnd && Platform.OS !== 'web') {
                haptic('light');
              }
            });
            break;

          case 'slide':
            const slideDistance = 50;
            switch (direction) {
              case 'left':
                translateX.value = slideDistance;
                break;
              case 'right':
                translateX.value = -slideDistance;
                break;
              case 'up':
                translateY.value = slideDistance;
                break;
              case 'down':
                translateY.value = -slideDistance;
                break;
            }
            
            translateX.value = withSpring(0, config.spring);
            translateY.value = withSpring(0, config.spring, () => {
              onTransitionEnd?.();
              if (hapticOnEnd && Platform.OS !== 'web') {
                haptic('light');
              }
            });
            break;

          case 'scale':
            scale.value = 0.9;
            opacity.value = 0;
            scale.value = withSpring(1, config.spring);
            opacity.value = withTiming(1, { duration: animDuration }, () => {
              onTransitionEnd?.();
              if (hapticOnEnd && Platform.OS !== 'web') {
                haptic('light');
              }
            });
            break;
        }
      } else {
        // No animation, just call callbacks
        onTransitionStart?.();
        onTransitionEnd?.();
      }

      previousPathname.current = pathname;
    }
  }, [pathname]);

  const startTransition = (callback: () => void) => {
    if (isActive) {
      // Start transition animation first
      onTransitionStart?.();
      
      // Small delay to allow animation to start, then execute callback
      setTimeout(callback, 50);
    } else {
      // No animation, execute immediately
      callback();
    }
  };

  return {
    opacity,
    translateX,
    translateY,
    scale,
    isTransitioning: pathname !== previousPathname.current,
    startTransition,
  };
}

/**
 * Hook for tab navigation transitions
 */
export function useTabTransition(activeTab: string) {
  const previousTab = useRef(activeTab);
  const { shouldAnimate } = useAnimationStore();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (activeTab !== previousTab.current && shouldAnimate()) {
      // Quick fade transition for tab content
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: 200 });
      
      // Tab haptic
      if (Platform.OS !== 'web') {
        haptic('selection');
      }
      
      previousTab.current = activeTab;
    }
  }, [activeTab]);

  return { opacity };
}

/**
 * Hook for modal transitions
 */
export function useModalTransition(visible: boolean) {
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({ variant: 'moderate' });
  
  const scale = useSharedValue(visible ? 1 : 0.9);
  const opacity = useSharedValue(visible ? 1 : 0);
  const translateY = useSharedValue(visible ? 0 : 50);

  useEffect(() => {
    if (shouldAnimate() && isAnimated) {
      if (visible) {
        // Open animation
        scale.value = withSpring(1, config.spring);
        opacity.value = withTiming(1, { duration: config.duration.normal });
        translateY.value = withSpring(0, config.spring);
        
        if (Platform.OS !== 'web') {
          haptic('medium');
        }
      } else {
        // Close animation
        scale.value = withTiming(0.9, { duration: config.duration.fast });
        opacity.value = withTiming(0, { duration: config.duration.fast });
        translateY.value = withTiming(50, { duration: config.duration.fast });
      }
    } else {
      // No animation
      scale.value = visible ? 1 : 0.9;
      opacity.value = visible ? 1 : 0;
      translateY.value = visible ? 0 : 50;
    }
  }, [visible]);

  return { scale, opacity, translateY };
}