import { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { haptic } from '@/lib/ui/haptics';
import { log } from '@/lib/core/debug/logger';

export interface SwipeConfig {
  enabled?: boolean;
  threshold?: number;
  velocity?: number;
  direction?: 'horizontal' | 'vertical' | 'both';
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

/**
 * Create a swipe gesture handler
 */
export function createSwipeGesture(config: SwipeConfig) {
  const {
    enabled = true,
    threshold = 50,
    velocity = 100,
    direction = 'horizontal',
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = config;

  if (!enabled || Platform.OS === 'web') {
    return null;
  }

  const gesture = Gesture.Pan()
    .onEnd((event) => {
      const { translationX, translationY, velocityX, velocityY } = event;

      // Horizontal swipes
      if (direction === 'horizontal' || direction === 'both') {
        if (translationX > threshold && velocityX > velocity && onSwipeRight) {
          log.debug('Swipe right detected', 'GESTURE');
          haptic('light');
          onSwipeRight();
        } else if (translationX < -threshold && velocityX < -velocity && onSwipeLeft) {
          log.debug('Swipe left detected', 'GESTURE');
          haptic('light');
          onSwipeLeft();
        }
      }

      // Vertical swipes
      if (direction === 'vertical' || direction === 'both') {
        if (translationY > threshold && velocityY > velocity && onSwipeDown) {
          log.debug('Swipe down detected', 'GESTURE');
          haptic('light');
          onSwipeDown();
        } else if (translationY < -threshold && velocityY < -velocity && onSwipeUp) {
          log.debug('Swipe up detected', 'GESTURE');
          haptic('light');
          onSwipeUp();
        }
      }
    });

  return gesture;
}

/**
 * Hook for swipe-back navigation (iOS style)
 */
export function useSwipeBack(enabled = true) {
  useEffect(() => {
    if (!enabled || Platform.OS !== 'ios') return;

    // Swipe back is handled by React Navigation's native stack
    // This is just for logging/tracking
    log.debug('Swipe back navigation enabled', 'GESTURE');
  }, [enabled]);
}

/**
 * Hook for tab swipe navigation
 */
export function useTabSwipe(tabs: string[], currentIndex: number, onTabChange: (index: number) => void) {
  const swipeGesture = createSwipeGesture({
    enabled: Platform.OS !== 'web',
    direction: 'horizontal',
    threshold: 50,
    velocity: 100,
    onSwipeLeft: () => {
      const nextIndex = Math.min(currentIndex + 1, tabs.length - 1);
      if (nextIndex !== currentIndex) {
        log.debug('Tab swipe left', 'GESTURE', { from: currentIndex, to: nextIndex });
        onTabChange(nextIndex);
      }
    },
    onSwipeRight: () => {
      const prevIndex = Math.max(currentIndex - 1, 0);
      if (prevIndex !== currentIndex) {
        log.debug('Tab swipe right', 'GESTURE', { from: currentIndex, to: prevIndex });
        onTabChange(prevIndex);
      }
    },
  });

  return swipeGesture;
}

/**
 * Hook for pull-to-dismiss modal
 */
export function usePullToDismiss(onDismiss: () => void, enabled = true) {
  const dismissGesture = createSwipeGesture({
    enabled: enabled && Platform.OS !== 'web',
    direction: 'vertical',
    threshold: 100,
    velocity: 200,
    onSwipeDown: () => {
      log.debug('Pull to dismiss triggered', 'GESTURE');
      haptic('medium');
      onDismiss();
    },
  });

  return dismissGesture;
}

/**
 * Gesture-enabled screen wrapper
 */
export function GestureScreen({ children, gesture }: { children: React.ReactNode; gesture?: any }) {
  if (!gesture || Platform.OS === 'web') {
    return children as React.ReactElement;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        {children}
      </GestureDetector>
    </GestureHandlerRootView>
  );
}