/**
 * Suppress common warnings in Expo Go
 * These warnings are expected and don't affect functionality
 */

// Set up Reanimated mocks before any imports to prevent initialization errors
import { Platform } from 'react-native';

if (typeof globalThis !== 'undefined' && typeof window !== 'undefined') {
  // We're on web - set up mocks immediately
  // Make properties writable so Reanimated can override them
  Object.defineProperty(globalThis, '_WORKLET', {
    value: false,
    writable: true,
    configurable: true
  });
  Object.defineProperty(globalThis, '__reanimatedWorkletInit', {
    value: () => {},
    writable: true,
    configurable: true
  });
  Object.defineProperty(globalThis, '__reanimatedModuleProxy', {
    value: undefined,
    writable: true,
    configurable: true
  });
  Object.defineProperty(globalThis, 'ProgressTransitionRegister', {
    value: undefined,
    writable: true,
    configurable: true
  });
  Object.defineProperty(globalThis, 'LayoutAnimationRepository', {
    value: undefined,
    writable: true,
    configurable: true
  });
  Object.defineProperty(globalThis, 'UpdatePropsManager', {
    value: undefined,
    writable: true,
    configurable: true
  });
}

// Suppress warnings in development
if (__DEV__) {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  // Patterns to suppress
  const suppressPatterns = [
    // AsyncStorage warning (common in Expo Go)
    'AsyncStorage has been extracted',
    // ViewPropTypes deprecation warning
    'ViewPropTypes will be removed',
    'ColorPropType will be removed',
    // Require cycle warnings (often from dependencies)
    'Require cycle:',
    // Fast refresh warnings
    'Fast refresh only works when',
    // Expo constants warning
    'Constants.platform.ios.model',
    // Network request warnings in tunnel mode
    'Network request failed',
    // Tunnel mode specific warnings
    'Unable to resolve host',
    // Reanimated warnings on web
    'Reanimated',
    'ProgressTransitionRegister',
    'LayoutAnimationRepository',
    'UpdatePropsManager',
    // Shadow style deprecation warnings
    '"shadow*" style props are deprecated',
    'shadowColor',
    'shadowOffset',
    'shadowOpacity',
    'shadowRadius',
  ];
  
  console.warn = (...args: unknown[]) => {
    const message = args[0];
    if (message && typeof message === 'string') {
      for (const pattern of suppressPatterns) {
        if (message.includes(pattern)) {
          return; // Suppress this warning
        }
      }
    }
    originalWarn.apply(console, args);
  };
  
  // Also suppress specific errors in development
  console.error = (...args: unknown[]) => {
    const message = args[0];
    if (message && typeof message === 'string') {
      // Suppress network errors in tunnel mode during development
      if (message.includes('Network request failed') && message.includes('exp.direct')) {
// TODO: Replace with structured logging - console.log('[SUPPRESSED] Network error in tunnel mode - this is expected');
        return;
      }
      // Suppress errors that are already being shown by error boundary
      if (message.includes('Error boundary') || message.includes('socialIcons')) {
        return; // Already handled by error boundary
      }
      // Suppress Reanimated errors on web
      if ((message.includes('Reanimated') || message.includes('ProgressTransitionRegister') || message.includes('LayoutAnimationRepository') || message.includes('UpdatePropsManager') || message.includes('easing function is not a worklet'))) {
        return; // Silently suppress, no need to log
      }
      // Suppress auth error that's already shown to user
      if (message.includes('[AUTH]Login process failed') && message.includes('Invalid email or password')) {
        return; // User is already shown the error in UI
      }
    }
    originalError.apply(console, args);
  };
}