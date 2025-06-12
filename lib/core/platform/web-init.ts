// Web initialization - must run before any other imports
// This file sets up global mocks for Reanimated on web platform

declare global {
  var _WORKLET: boolean | undefined;
  var __reanimatedWorkletInit: (() => void) | undefined;
  var __reanimatedModuleProxy: any;
  var ProgressTransitionRegister: any;
  var LayoutAnimationRepository: any;
  var _frameTimestamp: any;
  var _WORKLET_RUNTIME: any;
  var _IS_FABRIC: boolean | undefined;
}

if (typeof window !== 'undefined' && typeof globalThis !== 'undefined') {
  // We're on web - set up mocks immediately
  // Use Object.defineProperty to make them non-configurable
  const mockProps: Record<string, any> = {
    _WORKLET: false,
    __reanimatedWorkletInit: () => {},
    __reanimatedModuleProxy: undefined,
    ProgressTransitionRegister: undefined,
    LayoutAnimationRepository: undefined,
    UpdatePropsManager: undefined,
    _frameTimestamp: null,
    _WORKLET_RUNTIME: undefined,
    _IS_FABRIC: false,
// TODO: Replace with structured logging - _log: console.log,
    _getAnimationTimestamp: () => performance.now(),
    _setGlobalConsole: () => {},
  };

  Object.keys(mockProps).forEach(key => {
    try {
      Object.defineProperty(globalThis, key, {
        value: mockProps[key],
        writable: true,  // Allow Reanimated to write to these
        configurable: true,  // Allow reconfiguration
        enumerable: false
      });
    } catch (e) {
      // Property might already be defined, ignore
    }
  });

  // Also define on window for extra safety
  Object.keys(mockProps).forEach(key => {
    try {
      Object.defineProperty(window, key, {
        value: mockProps[key],
        writable: true,  // Allow Reanimated to write to these
        configurable: true,  // Allow reconfiguration
        enumerable: false
      });
    } catch (e) {
      // Property might already be defined, ignore
    }
  });
}

export {};