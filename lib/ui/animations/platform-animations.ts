import { Platform, ViewStyle } from 'react-native';
import { AnimatedStyle } from 'react-native-reanimated';

/**
 * Platform-specific animation utilities
 */

export interface AnimationStyle {
  transform?: Array<{
    translateX?: number;
    translateY?: number;
    scale?: number;
    rotate?: string;
  }>;
  opacity?: number;
}

/**
 * Create animation style that works across platforms
 */
export const createAnimationStyle = (style: AnimationStyle): AnimatedStyle<ViewStyle> => {
  if (Platform.OS === 'web') {
    // Web-specific optimizations
    return {
      ...style,
      // Force GPU acceleration on web
      transform: [
        ...(style.transform || []),
        { translateZ: 0 } as any,
      ],
    } as AnimatedStyle<ViewStyle>;
  }

  return style as AnimatedStyle<ViewStyle>;
};

/**
 * Check if platform supports native driver
 */
export const supportsNativeDriver = (): boolean => {
  return Platform.OS !== 'web';
};

/**
 * Get platform-specific animation config
 */
export const getPlatformAnimationConfig = () => {
  return {
    useNativeDriver: supportsNativeDriver(),
    // Web needs special handling for certain properties
    webConfig: Platform.OS === 'web' ? {
      transformOrigin: 'center',
      willChange: 'transform, opacity',
    } : undefined,
  };
};