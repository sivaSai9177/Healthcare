/**
 * Web-specific overrides and polyfills
 * This file patches issues with React Native Web and Metro
 */

// Define _interopRequireDefault before any modules try to use it
if (typeof window !== 'undefined') {
  // Create the helper function
  const interopHelper = function(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  };
  
  // Define it globally in multiple ways to ensure availability
  window._interopRequireDefault = interopHelper;
  
  // Also define on globalThis
  if (typeof globalThis !== 'undefined') {
    globalThis._interopRequireDefault = interopHelper;
  }
  
  // Define as a const in the global scope for modules
  Object.defineProperty(window, '_interopRequireDefault', {
    value: interopHelper,
    writable: false,
    enumerable: true,
    configurable: false
  });
  
  // Inject into the module system before Metro initializes
  // This is critical for fixing the HMRClient error
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // For Metro's module system, we need to inject early
    const script = document.createElement('script');
    script.textContent = `
      if (typeof _interopRequireDefault === 'undefined') {
        var _interopRequireDefault = function(obj) {
          return obj && obj.__esModule ? obj : { default: obj };
        };
      }
    `;
    if (document.head) {
      document.head.insertBefore(script, document.head.firstChild);
    }
  }
  
  // Override the module factory to inject the helper
  if (typeof __r !== 'undefined' && typeof __d !== 'undefined') {
    const originalDefine = __d;
    __d = function(factory, moduleId, dependencies) {
      const wrappedFactory = function(global, require, module, exports, dependencyMap) {
        // Inject the helper into the module scope
        const _interopRequireDefault = window._interopRequireDefault;
        return factory.call(this, global, require, module, exports, dependencyMap);
      };
      return originalDefine.call(this, wrappedFactory, moduleId, dependencies);
    };
  }
}