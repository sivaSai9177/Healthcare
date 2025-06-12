// Polyfill for _interopRequireDefault
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

// Polyfill for _interopRequireWildcard
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

// Make them available globally for all modules
global._interopRequireDefault = _interopRequireDefault;
global._interopRequireWildcard = _interopRequireWildcard;
window._interopRequireDefault = _interopRequireDefault;
window._interopRequireWildcard = _interopRequireWildcard;

// Also add to globalThis for modern environments
if (typeof globalThis !== 'undefined') {
  globalThis._interopRequireDefault = _interopRequireDefault;
  globalThis._interopRequireWildcard = _interopRequireWildcard;
}