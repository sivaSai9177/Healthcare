/**
 * Hooks Barrel Export
 * Central export point for all custom React hooks
 */

// Authentication Hook
export { useAuth } from './useAuth';

// Healthcare Hooks
export * from './healthcare';

// Organization Hooks  
export * from './organization';

// Theme & Styling Hooks
export { useColorScheme } from './useColorScheme';
export { useThemeColor } from './useThemeColor';

// SSE (Server-Sent Events) Hook
export { useSSESubscription } from './useSSESubscription';

// Responsive Design Hooks
export * from './responsive';

// Animation Hooks (re-export from lib)
export {
  useFadeAnimation,
  useScaleAnimation,
  useSlideAnimation,
  useBounceAnimation,
  useShakeAnimation,
  useEntranceAnimation,
  useCreateAnimatedStyle,
} from '@/lib/ui/animations/hooks';

// Animation Variant Hooks
export { useAnimationVariant, useComponentAnimation } from './useAnimationVariant';
export { useNavigationTransition } from './useNavigationTransition';

// Platform Detection
export const usePlatform = () => {
  const { Platform } = require('react-native');
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
    const [dimensions, setDimensions] = require('react').useState({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    require('react').useEffect(() => {
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
  const { Dimensions } = require('react-native');
  return Dimensions.get('window');
};