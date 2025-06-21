/**
 * Main Library Exports
 * Central export point for all library modules
 */

// API & Data Layer
export { api } from './api/trpc';
export { resolveApiUrl, setApiUrl, getCurrentApiUrl } from './api/api-resolver';

// Authentication
export * from './auth';

// Core Utilities (selective exports to avoid conflicts)
export {
  // Utils
  cn,
  // Alert
  showErrorAlert,
  showSuccessAlert,
} from './core';

// Config (selective exports)
export { getApiUrlSync } from './core/config';

// Debug utilities
export { log } from './core/debug/logger';
export { routerDebugger } from './core/debug/router-debug';
export { trpcLogger } from './core/debug/trpc-logger-enhanced';

// Platform utilities
export { secureStorage } from './core/secure-storage';

// Design System
export * from './design';

// Navigation
export { NavigationHelper } from './navigation/navigation-helper';
export * from './navigation/transitions';
export * from './navigation/gesture-handler';
export { navigation } from './navigation';

// State Management
export {
  useAuthStore,
  useAnimationStore,
  useSidebarStore,
  useDialogStore,
  useToastStore,
  useThemeStore,
  useSpacingStore,
  useDebugStore,
} from './stores';

// Theme System
export * from './theme';

// UI Utilities
export * from './ui';

// Validations
export * from './validations';