import { useEffect, useState } from 'react';
import { Platform, AccessibilityInfo } from 'react-native';

/**
 * Hook to detect if the user prefers reduced motion
 * Works across platforms:
 * - iOS/Android: Uses AccessibilityInfo
 * - Web: Uses matchMedia for prefers-reduced-motion
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web implementation
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      const handleChange = () => {
        setReducedMotion(mediaQuery.matches);
      };
      
      // Set initial value
      setReducedMotion(mediaQuery.matches);
      
      // Listen for changes
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      // Native implementation
      const updateReducedMotion = (isReduceMotionEnabled: boolean) => {
        setReducedMotion(isReduceMotionEnabled);
      };
      
      // Get initial value
      AccessibilityInfo.isReduceMotionEnabled().then(updateReducedMotion);
      
      // Listen for changes
      const subscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        updateReducedMotion
      );
      
      return () => {
        subscription?.remove();
      };
    }
  }, []);

  return reducedMotion;
}