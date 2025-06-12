/**
 * Animation Testing Setup
 * Provides utilities and mocks for testing animations across platforms
 */

import { Platform } from 'react-native';

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = jest.requireActual('react-native-reanimated/mock');
  
  // Mock additional functions not in the default mock
  Reanimated.withSpring = (toValue: number, config?: any, callback?: any) => {
    if (callback) callback(true);
    return { value: toValue };
  };
  
  Reanimated.withTiming = (toValue: number, config?: any, callback?: any) => {
    if (callback) callback(true);
    return { value: toValue };
  };
  
  Reanimated.withSequence = (...animations: any[]) => {
    return animations[animations.length - 1];
  };
  
  Reanimated.withDelay = (delay: number, animation: any) => {
    return animation;
  };
  
  Reanimated.interpolate = (value: number, inputRange: number[], outputRange: number[]) => {
    // Simple linear interpolation for testing
    const ratio = value / inputRange[inputRange.length - 1];
    return outputRange[0] + (outputRange[outputRange.length - 1] - outputRange[0]) * ratio;
  };
  
  Reanimated.runOnJS = (fn: Function) => {
    return (...args: any[]) => fn(...args);
  };
  
  Reanimated.useSharedValue = (initialValue: any) => {
    const value = { value: initialValue };
    return value;
  };
  
  Reanimated.useAnimatedStyle = (styleFactory: Function) => {
    const style = styleFactory();
    return style;
  };
  
  // Mock entrance animations
  Reanimated.FadeIn = { duration: 300 };
  Reanimated.FadeOut = { duration: 300 };
  Reanimated.ZoomIn = { duration: 300 };
  Reanimated.ZoomOut = { duration: 300 };
  Reanimated.SlideInDown = { duration: 300 };
  Reanimated.SlideInUp = { duration: 300 };
  Reanimated.SlideInLeft = { duration: 300 };
  Reanimated.SlideInRight = { duration: 300 };
  
  // Create animated component factory
  Reanimated.createAnimatedComponent = (Component: any) => Component;
  
  // Export default
  Reanimated.default = Reanimated;
  
  return Reanimated;
});

// Mock haptics
jest.mock('@/lib/ui/haptics', () => ({
  haptic: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    selection: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    impact: jest.fn(),
  }
}));

// Mock NativeWind
jest.mock('nativewind', () => ({
  styled: (component: any) => component,
  hairlineWidth: () => 1,
}));

// Animation test utilities
export const animationTestUtils = {
  /**
   * Set platform for testing
   */
  setPlatform: (platform: 'ios' | 'android' | 'web') => {
    Object.defineProperty(Platform, 'OS', {
      get: jest.fn(() => platform),
      configurable: true,
    });
    
    Platform.select = jest.fn((obj) => {
      return obj[platform] || obj.default;
    });
  },
  
  /**
   * Wait for animation to complete
   */
  waitForAnimation: (duration: number = 300) => {
    return new Promise(resolve => setTimeout(resolve, duration));
  },
  
  /**
   * Mock animation timing
   */
  mockAnimationTiming: () => {
    jest.useFakeTimers();
    return {
      runAllTimers: () => jest.runAllTimers(),
      advanceTimersByTime: (time: number) => jest.advanceTimersByTime(time),
      cleanup: () => jest.useRealTimers(),
    };
  },
  
  /**
   * Get computed styles for web
   */
  getWebStyles: (element: any) => {
    const className = element.props?.className || '';
    const classes = className.split(' ').filter(Boolean);
    return {
      classes,
      hasClass: (cls: string) => classes.includes(cls),
      hasAnimation: (type: string) => classes.some(cls => cls.includes(type)),
    };
  },
  
  /**
   * Get animated styles for native
   */
  getNativeStyles: (element: any) => {
    const style = element.props?.style || {};
    return {
      opacity: style.opacity,
      transform: style.transform,
      scale: style.transform?.find((t: any) => t.scale)?.scale,
      translateX: style.transform?.find((t: any) => t.translateX)?.translateX,
      translateY: style.transform?.find((t: any) => t.translateY)?.translateY,
    };
  },
  
  /**
   * Mock reduced motion preference
   */
  mockReducedMotion: (enabled: boolean) => {
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: enabled && query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    }
  },
  
  /**
   * Create mock animation store
   */
  createMockAnimationStore: (overrides = {}) => {
    return {
      enableAnimations: true,
      animationSpeed: 1,
      reducedMotion: false,
      debugMode: false,
      variant: 'moderate',
      setEnableAnimations: jest.fn(),
      setAnimationSpeed: jest.fn(),
      setReducedMotion: jest.fn(),
      setDebugMode: jest.fn(),
      setVariant: jest.fn(),
      hydrate: jest.fn(),
      hasHydrated: true,
      ...overrides,
    };
  },
  
  /**
   * Assert animation completed
   */
  expectAnimationCompleted: (callback: jest.Mock) => {
    expect(callback).toHaveBeenCalledWith(true);
  },
  
  /**
   * Assert haptic feedback
   */
  expectHapticFeedback: (type: string = 'light') => {
    const haptic = require('@/lib/ui/haptics').haptic;
    expect(haptic[type]).toHaveBeenCalled();
  },
};

// Export Platform for direct access
export { Platform };

// Export test helpers
export const resetAllMocks = () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
};

export const setupTest = (platform: 'ios' | 'android' | 'web' = 'ios') => {
  animationTestUtils.setPlatform(platform);
  resetAllMocks();
};