# Module Logger Guide

This guide explains how to use the module-wise debug logger that can be accessed from the browser console.

## Quick Start

### Browser Console Access

When running in development mode, open your browser console and type:

```javascript
// Show help
window.debugger.help()

// List all registered modules
window.debugger.listModules()

// Enable logging for specific module
window.debugger.enableModule('Auth')

// Disable logging for specific module
window.debugger.disableModule('Auth')

// Get logs for a specific module
window.debugger.getModuleLogs('Auth')

// Get all error logs
window.debugger.getErrors()

// Export all logs as text
window.debugger.exportHistory()
```

### Using Module Logger in Code

```typescript
import { getModuleLogger } from '@/lib/core/debug/window-logger';

// Create a logger for your module
const logger = getModuleLogger('YourModuleName');

// Use the logger
logger.info('Component mounted');
logger.debug('State updated', { newState: state });
logger.warn('Deprecated method called');
logger.error('Failed to fetch data', error);

// Performance timing
logger.time('api-call');
// ... do work ...
logger.timeEnd('api-call');

// Group related logs
logger.group('User Action');
logger.info('Button clicked');
logger.debug('Processing...');
logger.groupEnd();
```

## Example Implementation

Here's how to integrate the module logger into a component:

```typescript
// components/MyComponent.tsx
import React, { useEffect } from 'react';
import { getModuleLogger } from '@/lib/core/debug/window-logger';

const logger = getModuleLogger('MyComponent');

export function MyComponent() {
  useEffect(() => {
    logger.info('Component mounted');
    
    return () => {
      logger.info('Component unmounted');
    };
  }, []);

  const handleClick = async () => {
    logger.time('handleClick');
    logger.debug('Button clicked', { timestamp: Date.now() });
    
    try {
      const result = await someAsyncOperation();
      logger.info('Operation successful', { result });
    } catch (error) {
      logger.error('Operation failed', error);
    } finally {
      logger.timeEnd('handleClick');
    }
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

## Module Naming Conventions

Use consistent module names for better organization:

- **Components**: Use component name (e.g., 'LoginForm', 'UserProfile')
- **Hooks**: Use hook name (e.g., 'useAuth', 'useOrganization')
- **API**: Use endpoint group (e.g., 'API:Auth', 'API:Healthcare')
- **Stores**: Use store name (e.g., 'Store:Theme', 'Store:Auth')
- **Services**: Use service name (e.g., 'NotificationService', 'WebSocketService')

## Advanced Usage

### Filtering Logs

```javascript
// Get logs for specific time range
const recentLogs = window.debugger.getHistory({
  startTime: new Date(Date.now() - 60000), // Last minute
  component: 'Auth'
});

// Get only errors and warnings
const issues = window.debugger.getHistory({
  level: 1 // 0=ERROR, 1=WARN, 2=INFO, 3=DEBUG, 4=TRACE
});
```

### Setting Log Levels

```javascript
// Set global log level
window.debugger.setLogLevel('DEBUG'); // or 'ERROR', 'WARN', 'INFO', 'TRACE'
```

### Batch Operations

```javascript
// Disable all modules
window.debugger.disableAllModules();

// Enable specific modules
['Auth', 'API', 'Navigation'].forEach(module => {
  window.debugger.enableModule(module);
});
```

## Legacy Logger Access

The window debugger also provides access to the legacy logger:

```javascript
// Legacy logger methods
window.debugger.log.auth.login('User logged in', { userId: '123' });
window.debugger.log.api.request('Fetching data', { endpoint: '/users' });
window.debugger.log.store.update('Theme changed', { theme: 'dark' });
```

## Production Considerations

- The window debugger is only available in development mode or when `EXPO_PUBLIC_DEBUG_MODE=true`
- In production builds, all debug code is stripped out
- Module loggers have minimal performance impact when disabled

## Troubleshooting

### Logger Not Available in Console

1. Ensure you're in development mode
2. Check that the app has fully loaded
3. Try refreshing the page
4. Verify `EXPO_PUBLIC_DEBUG_MODE` is set to `true` if needed

### Missing Logs

1. Check if the module is enabled: `window.debugger.listEnabledModules()`
2. Verify the log level: `window.debugger.setLogLevel('TRACE')`
3. Ensure the module name matches exactly

### Performance Issues

1. Disable verbose modules: `window.debugger.disableModule('VerboseModule')`
2. Clear log history: `window.debugger.clearHistory()`
3. Set higher log level: `window.debugger.setLogLevel('ERROR')`