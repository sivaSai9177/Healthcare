import { Platform, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';

export interface DeviceTypeInfo {
  // Standard devices
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Special devices
  isTV: boolean;
  isWatch: boolean;
  isVision: boolean;
  
  // Platform checks
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  isMacOS: boolean;
  isWindows: boolean;
  
  // Form factor
  formFactor: 'phone' | 'tablet' | 'desktop' | 'tv' | 'watch' | 'vision' | 'unknown';
  
  // Screen info
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
}

/**
 * Hook to detect device type and platform
 * Supports phones, tablets, desktops, TVs, watches, and Vision Pro
 */
export function useDeviceType(): DeviceTypeInfo {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);
  
  const { width, height } = dimensions;
  const isLandscape = width > height;
  const isPortrait = !isLandscape;
  
  // Platform detection
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';
  const isWeb = Platform.OS === 'web';
  const isMacOS = Platform.OS === 'macos';
  const isWindows = Platform.OS === 'windows';
  const isTV = Platform.isTV || false;
  
  // Special device detection
  const isWatch = width < 200 && (isIOS || isAndroid); // Apple Watch or WearOS
  const isVision = (Platform as any).OS === 'visionos'; // Vision Pro
  
  // Standard device detection based on screen size
  let isPhone = false;
  let isTablet = false;
  let isDesktop = false;
  let formFactor: DeviceTypeInfo['formFactor'] = 'unknown';
  
  if (isWatch) {
    formFactor = 'watch';
  } else if (isVision) {
    formFactor = 'vision';
  } else if (isTV) {
    formFactor = 'tv';
  } else if (isWeb || isMacOS || isWindows) {
    // Desktop/laptop detection
    isDesktop = width >= 1024;
    isTablet = width >= 768 && width < 1024;
    isPhone = width < 768;
    formFactor = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'phone';
  } else {
    // Mobile device detection
    const minDimension = Math.min(width, height);
    const maxDimension = Math.max(width, height);
    
    // Tablets typically have min dimension >= 600
    isTablet = minDimension >= 600;
    isPhone = !isTablet;
    isDesktop = false;
    formFactor = isTablet ? 'tablet' : 'phone';
  }
  
  return {
    // Standard devices
    isPhone,
    isTablet,
    isDesktop,
    
    // Special devices
    isTV,
    isWatch,
    isVision,
    
    // Platform checks
    isIOS,
    isAndroid,
    isWeb,
    isMacOS,
    isWindows,
    
    // Form factor
    formFactor,
    
    // Screen info
    width,
    height,
    isLandscape,
    isPortrait,
  };
}

/**
 * Hook for watch-optimized layouts
 * Provides utilities for small screen optimization
 */
export function useWatchLayout() {
  const { isWatch, width, height } = useDeviceType();
  
  return {
    isWatch,
    // Watch-specific layout helpers
    isRound: isWatch && width === height, // Circular watches
    isSquare: isWatch && width !== height, // Square watches
    // Simplified spacing for watches
    spacing: {
      xs: 2,
      sm: 4,
      md: 8,
      lg: 12,
    },
    // Optimized font sizes for small screens
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
    },
  };
}

/**
 * Hook for TV navigation
 * Provides focus-based navigation utilities
 */
export function useTVNavigation() {
  const { isTV } = useDeviceType();
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  return {
    isTV,
    focusedIndex,
    setFocusedIndex,
    // TV remote navigation helpers
    navigateUp: () => setFocusedIndex(prev => Math.max(0, prev - 1)),
    navigateDown: (maxIndex: number) => setFocusedIndex(prev => Math.min(maxIndex, prev + 1)),
    navigateLeft: () => setFocusedIndex(prev => Math.max(0, prev - 1)),
    navigateRight: (maxIndex: number) => setFocusedIndex(prev => Math.min(maxIndex, prev + 1)),
  };
}

/**
 * Hook for Vision Pro spatial layouts
 * Provides 3D spatial positioning utilities
 */
export function useVisionSpatial() {
  const { isVision } = useDeviceType();
  
  return {
    isVision,
    // Spatial layout helpers
    depthLevels: {
      background: -100,
      content: 0,
      foreground: 100,
      overlay: 200,
    },
    // 3D transform utilities
    transform3D: (z: number = 0) => ({
      transform: [{ translateZ: z }],
    }),
  };
}