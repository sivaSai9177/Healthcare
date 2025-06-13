// CRITICAL: Define babel helpers IMMEDIATELY before any module loading
// These must be available before ANY require() calls

(function() {
  'use strict';
  
  // Helper for CommonJS interop
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  // Helper for wildcard imports
  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    }
    if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
      return { default: obj };
    }
    var cache = {};
    if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cache[key] = obj[key];
        }
      }
    }
    cache.default = obj;
    return cache;
  }

  // Define on ALL possible global objects
  var globalTargets = [];
  
  // Add all possible global references
  if (typeof globalThis !== 'undefined') globalTargets.push(globalThis);
  if (typeof window !== 'undefined') globalTargets.push(window);
  if (typeof global !== 'undefined') globalTargets.push(global);
  if (typeof self !== 'undefined') globalTargets.push(self);
  
  // Also define directly in the global scope
  if (typeof window !== 'undefined') {
    window._interopRequireDefault = _interopRequireDefault;
    window._interopRequireWildcard = _interopRequireWildcard;
  }
  
  // Define on each target
  globalTargets.forEach(function(target) {
    try {
      Object.defineProperty(target, '_interopRequireDefault', {
        value: _interopRequireDefault,
        writable: false,
        enumerable: false,
        configurable: false
      });
      Object.defineProperty(target, '_interopRequireWildcard', {
        value: _interopRequireWildcard,
        writable: false,
        enumerable: false,
        configurable: false
      });
    } catch (e) {
      // Fallback to simple assignment
      target._interopRequireDefault = _interopRequireDefault;
      target._interopRequireWildcard = _interopRequireWildcard;
    }
  });
  
  // ALSO define as var in the global scope for Metro
  if (typeof window !== 'undefined') {
    try {
      // This ensures it's available in the module scope
      window.eval('var _interopRequireDefault = window._interopRequireDefault;');
      window.eval('var _interopRequireWildcard = window._interopRequireWildcard;');
    } catch (e) {
      // Ignore eval errors
    }
  }
  
  console.log('[polyfills] Babel helpers loaded successfully');
})();