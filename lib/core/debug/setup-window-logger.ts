/**
 * Setup Window Logger
 * This file should be imported early in the application to ensure
 * the window logger is available for debugging
 */

import { Platform } from 'react-native';
import { windowDebugger, getModuleLogger } from './window-logger';

// Initialize window logger
export function setupWindowLogger() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Import to trigger window exposure
    if (__DEV__ || process.env.EXPO_PUBLIC_DEBUG_MODE === 'true') {

      // Create some common module loggers to register them
      getModuleLogger('App');
      getModuleLogger('Auth');
      getModuleLogger('API');
      getModuleLogger('Navigation');
      getModuleLogger('Store');
      getModuleLogger('Healthcare');
      getModuleLogger('Organization');
      getModuleLogger('UI');
      getModuleLogger('Hooks');
      getModuleLogger('Components');
      
      // Show available commands

    }
  }
}

// Auto-setup if this file is imported
setupWindowLogger();