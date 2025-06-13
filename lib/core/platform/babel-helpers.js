/**
 * Babel helper functions for module interop
 * This must be loaded before any other modules
 */

// Define on both window and globalThis for maximum compatibility
const targets = [globalThis];
if (typeof window !== 'undefined') {
  targets.push(window);
}

targets.forEach(target => {
  // Helper for CommonJS interop
  if (!target._interopRequireDefault) {
    Object.defineProperty(target, '_interopRequireDefault', {
      value: function(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      },
      writable: true,
      configurable: true
    });
  }

  // Helper for wildcard imports
  if (!target._interopRequireWildcard) {
    Object.defineProperty(target, '_interopRequireWildcard', {
      value: function(obj) {
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
      },
      writable: true,
      configurable: true
    });
  }

  // Additional helpers that might be needed
  if (!target._getRequireWildcardCache) {
    Object.defineProperty(target, '_getRequireWildcardCache', {
      value: function() {
        if (typeof WeakMap !== 'function') return null;
        var cache = new WeakMap();
        target._getRequireWildcardCache = function() { return cache; };
        return cache;
      },
      writable: true,
      configurable: true
    });
  }
});

// Make sure it's available immediately
if (typeof _interopRequireDefault === 'undefined' && globalThis._interopRequireDefault) {
  var _interopRequireDefault = globalThis._interopRequireDefault;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis._interopRequireDefault;
  module.exports.default = globalThis._interopRequireDefault;
  module.exports._interopRequireDefault = globalThis._interopRequireDefault;
}

// Also make available as exports
if (typeof exports !== 'undefined') {
  exports.default = globalThis._interopRequireDefault;
  exports._interopRequireDefault = globalThis._interopRequireDefault;
}

// Log to confirm loading
console.log('[babel-helpers] Module interop helpers loaded');