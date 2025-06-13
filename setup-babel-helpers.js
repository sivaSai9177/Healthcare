/**
 * Setup babel helpers for Metro bundler
 * This file must be imported at the very top of index.js
 */

// Define _interopRequireDefault in the global scope
(function() {
  // Check if we're in a browser environment
  const globalObj = (function() {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof window !== 'undefined') return window;
    if (typeof global !== 'undefined') return global;
    if (typeof self !== 'undefined') return self;
    throw new Error('Unable to locate global object');
  })();

  // Define the helper function
  const _interopRequireDefault = function(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  };

  // Make it available in multiple ways
  globalObj._interopRequireDefault = _interopRequireDefault;
  
  // For Metro's module system
  if (typeof module !== 'undefined' && module.exports) {
    module.exports._interopRequireDefault = _interopRequireDefault;
  }
  
  // Define as a variable in the current scope
  if (typeof define === 'function' && define.amd) {
    define('_interopRequireDefault', [], function() {
      return _interopRequireDefault;
    });
  }
  
  // Try to define it as a var
  try {
    globalObj.eval('var _interopRequireDefault = globalObj._interopRequireDefault;');
  } catch (e) {
    // Eval might be disabled
  }
  
  console.log('[setup-babel-helpers] _interopRequireDefault is now available');
})();