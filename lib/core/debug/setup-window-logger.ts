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
      console.log('🐛 Window logger setup complete');
      
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
      console.log('🐛 Available debug commands:');
      console.log('  - window.debugger.help() - Show all commands');
      console.log('  - window.debugger.listModules() - List registered modules');
      console.log('  - window.debugger.enableModule("Auth") - Enable specific module');
      console.log('  - window.getLogger("MyModule") - Get logger for a module');
    }
  }
}

// Auto-setup if this file is imported
setupWindowLogger();