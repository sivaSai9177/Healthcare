// Web overrides MUST be first - fixes _interopRequireDefault
import './web-overrides';
// Setup babel helpers
import './setup-babel-helpers';
// Polyfills
import './polyfills';
// Initialize web platform mocks
import '@/lib/core/platform/web-init';
// Start the app
import 'expo-router/entry';