/**
 * Hooks Barrel Export
 * Central export point for all custom React hooks
 */

import { Platform, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';

// Authentication Hook
export { useAuth } from './useAuth';

// Healthcare Hooks
export * from './healthcare';

// Organization Hooks  
export * from './organization';

// Theme & Styling Hooks
export { useColorScheme } from './useColorScheme';
export { useShadow, useShadowClass, useInteractiveShadow, shadowPresets } from './useShadow';

// SSE (Server-Sent Events) Hook
// export { useSSESubscription } from './useSSESubscription'; // TODO: Implement SSE hook

// Responsive Design Hooks
export * from './responsive';

// Animation Hooks (re-export from lib)
export {
  useAnimation,
  useTransition,
  useStaggerAnimation,
  useSpringAnimation,
} from '@/lib/ui/animations/hooks';

export {
  useFadeAnimation,
  useScaleAnimation,
  useEntranceAnimation,
  useListAnimation,
  usePageTransition,
  useInteractionAnimation,
} from '@/lib/ui/animations/enhanced-hooks';

// Animation Variant Hooks
export { useAnimationVariant, useComponentAnimation } from './useAnimationVariant';
export { useNavigationTransition } from './useNavigationTransition';

// Push Notifications Hook
export { usePushNotifications } from './usePushNotifications';

// Platform Detection
export const usePlatform = () => {
  return {
    isWeb: Platform.OS === 'web',
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    isNative: Platform.OS !== 'web',
  };
};

// Window Dimensions Hook
export const useWindowDimensions = () => {
  if (typeof window !== 'undefined') {
    const [dimensions, setDimensions] = useState({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    useEffect(() => {
      const handleResize = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    return dimensions;
  }

  // Fallback for non-web platforms
  return Dimensions.get('window');
};