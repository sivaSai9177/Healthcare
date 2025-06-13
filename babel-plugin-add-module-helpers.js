/**
 * Babel plugin to inject module helpers at the top of each file
 */

module.exports = function(babel) {
  const { types: t, template } = babel;
  
  return {
    name: 'add-module-helpers',
    visitor: {
      Program(path) {
        // Check if _interopRequireDefault is already defined
        const hasHelper = path.scope.hasBinding('_interopRequireDefault');
        
        if (!hasHelper) {
          // Use template to create the helper
          const buildHelper = template(`
            var _interopRequireDefault = (function() {
              if (typeof globalThis !== 'undefined' && globalThis._interopRequireDefault) {
                return globalThis._interopRequireDefault;
              }
              if (typeof window !== 'undefined' && window._interopRequireDefault) {
                return window._interopRequireDefault;
              }
              return function(obj) {
                return obj && obj.__esModule ? obj : { default: obj };
              };
            })();
          `);
          
          // Insert at the beginning of the file
          const helperAST = buildHelper();
          path.unshiftContainer('body', helperAST);
        }
      }
    }
  };
};