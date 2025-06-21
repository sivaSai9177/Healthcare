# Comprehensive Logging Guide

This guide explains the multi-layered logging infrastructure in the Healthcare Alert System, covering all logging components, their purposes, and usage examples.

## Table of Contents

1. [Overview](#overview)
2. [Logging Architecture](#logging-architecture)
3. [Configuration](#configuration)
4. [Using the Loggers](#using-the-loggers)
5. [Debug Tools](#debug-tools)
6. [External Logging Service](#external-logging-service)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

The logging system consists of multiple layers:

- **Unified Logger**: Central logging system with category-based logging
- **Window Debugger**: Browser-exposed debugging tools
- **tRPC Logger**: Enhanced logging for tRPC procedures
- **External Logging Service**: Standalone service for log aggregation
- **Debug Panel**: Visual debugging interface in the app

## Logging Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Code                        │
├─────────────────────────────────────────────────────────────┤
│                     Unified Logger                           │
│  ┌─────────────┬──────────────┬──────────────┬───────────┐ │
│  │   Console   │ Debug Panel  │   PostHog    │  External │ │
│  │   Output    │ Integration  │  Analytics   │  Service  │ │
│  └─────────────┴──────────────┴──────────────┴───────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Specialized Loggers                       │
│  ┌─────────────┬──────────────┬──────────────┬───────────┐ │
│  │    tRPC     │    Router    │    Auth      │Healthcare │ │
│  │   Logger    │   Debugger   │   Logger     │  Logger   │ │
│  └─────────────┴──────────────┴──────────────┴───────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

```bash
# Core Configuration
LOG_LEVEL=debug                    # error | warn | info | debug | trace
EXPO_PUBLIC_DEBUG_MODE=true        # Enable debug features

# External Logging Service
LOGGING_SERVICE_ENABLED=true
LOGGING_SERVICE_URL=http://localhost:3003
LOGGING_BATCH_SIZE=50
LOGGING_FLUSH_INTERVAL=5000
LOGGING_MAX_RETRIES=3
LOGGING_RETRY_DELAY=1000
LOGGING_TIMEOUT=10000

# CORS Configuration
LOGGING_ALLOWED_ORIGINS=http://localhost:8081,http://localhost:3000
LOGGING_ALLOW_CREDENTIALS=false
LOGGING_CORS_MAX_AGE=86400

# Storage Configuration
LOGGING_MAX_SIZE=10000
LOGGING_RETENTION_MS=86400000      # 24 hours
LOGGING_ENABLE_COMPRESSION=false

# Category Configuration
LOGGING_ENABLED_CATEGORIES=*       # or AUTH,API,TRPC,HEALTHCARE
LOGGING_DISABLED_CATEGORIES=       # Categories to exclude

# Console Configuration
LOGGING_CONSOLE_ENABLED=true
LOGGING_CONSOLE_COLORIZE=true
LOGGING_CONSOLE_TIMESTAMPS=true

# PostHog Analytics
EXPO_PUBLIC_POSTHOG_ENABLED=false
EXPO_PUBLIC_POSTHOG_API_KEY=your-api-key
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Programmatic Configuration

```typescript
import { getLoggingConfig, validateLoggingConfig } from '@/lib/core/debug/logging-config';

// Get current configuration
const config = getLoggingConfig();

// Override configuration
const customConfig = validateLoggingConfig({
  logLevel: 'debug',
  service: {
    enabled: true,
    url: 'https://logs.example.com',
  },
  categories: {
    enabled: ['AUTH', 'HEALTHCARE'],
    disabled: ['TRACE'],
  },
});
```

## Using the Loggers

### 1. Unified Logger

The unified logger is the primary logging interface:

```typescript
import { logger } from '@/lib/core/debug/unified-logger';

// Category-specific logging
logger.auth.info('User logged in', { userId: '123' });
logger.auth.error('Authentication failed', error);

logger.api.request('GET', '/api/users');
logger.api.response('GET', '/api/users', 200, 145); // 145ms

logger.trpc.request('user.getProfile', 'query', { id: '123' });
logger.trpc.error('user.getProfile', 'query', error, 100);

logger.healthcare.alertCreated({
  alertType: 'CODE_BLUE',
  roomNumber: '305',
  patientId: 'P123',
});

// Generic logging
logger.info('Application started', 'SYSTEM');
logger.error('Critical error', 'SYSTEM', error);
logger.debug('Debug information', 'CUSTOM_CATEGORY', { data });
```

### 2. Module-Specific Loggers

For component-specific logging:

```typescript
import { getModuleLogger } from '@/lib/core/debug/window-logger';

const logger = getModuleLogger('MyComponent');

logger.info('Component initialized');
logger.debug('Rendering with props', props);
logger.error('Failed to fetch data', error);
```

### 3. tRPC Enhanced Logger

Automatically used by tRPC middleware:

```typescript
// In tRPC procedures
export const myProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    // Logging happens automatically via middleware
    // Manual logging if needed:
    logger.trpc.request('custom.action', 'query', input);
  });
```

### 4. Router Debugger

For navigation debugging:

```typescript
import { routerDebugger } from '@/lib/core/debug/router-debug';

// Initialize after navigation is ready
routerDebugger.initialize();

// Get navigation history
const history = routerDebugger.getHistory();

// Get route statistics
const stats = routerDebugger.getRouteStatistics();
```

## Debug Tools

### Window Debugger (Browser Only)

Open browser console and use:

```javascript
// Help and available commands
window.debugger.help()

// Module management
window.debugger.listModules()
window.debugger.enableModule('Auth')
window.debugger.disableModule('Router')
window.debugger.enableAllModules()

// Log history
window.debugger.getHistory()
window.debugger.getErrors()
window.debugger.getWarnings()
window.debugger.getModuleLogs('Healthcare')

// Export logs
const logs = window.debugger.exportHistory()

// Get specific module logger
const authLogger = window.getLogger('Auth')
authLogger.info('Custom log message')
```

### Debug Panel Integration

The unified logger automatically sends logs to the Debug Panel:

```typescript
// Logs appear in the Debug Panel UI
logger.auth.info('This appears in Debug Panel');

// Access debug panel directly
import { debugLog } from '@/components/blocks/debug/utils/logger';
debugLog.info('Direct debug panel log');
```

## External Logging Service

### Starting the Service

```bash
# Using npm scripts
npm run logging:start

# Or directly with Bun
bun run src/server/logging/start-standalone.ts
```

### Service Endpoints

- `GET /health` - Health check
- `POST /log` - Log single event
- `POST /log/batch` - Log multiple events
- `GET /stats` - Get logging statistics
- `GET /logs?category=AUTH&limit=100` - Query logs

### Sending Logs Manually

```typescript
// The enhanced tRPC logger handles this automatically
// But you can send logs manually:

fetch('http://localhost:3003/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'custom',
    message: 'Manual log entry',
    timestamp: new Date().toISOString(),
    metadata: { custom: 'data' },
  }),
});
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ERROR - Critical issues that need immediate attention
logger.error('Database connection failed', 'SYSTEM', error);

// WARN - Important issues that don't break functionality
logger.warn('API rate limit approaching', 'API', { remaining: 10 });

// INFO - Important business events
logger.info('User completed registration', 'AUTH', { userId });

// DEBUG - Detailed information for debugging
logger.debug('Cache miss for key', 'CACHE', { key, ttl });

// TRACE - Very detailed information (usually disabled)
logger.trace('Entering function', 'FUNCTION', { args });
```

### 2. Use Structured Logging

```typescript
// Good - Structured data
logger.healthcare.alertCreated({
  alertId: alert.id,
  alertType: alert.type,
  severity: alert.severity,
  timestamp: alert.createdAt,
});

// Bad - Unstructured string
console.log(`Alert created: ${alert.id} of type ${alert.type}`);
```

### 3. Include Context

```typescript
// Include relevant context
logger.api.error('API call failed', {
  endpoint: '/api/users',
  method: 'POST',
  statusCode: 500,
  userId: ctx.user?.id,
  requestId: req.id,
  error: error.message,
});
```

### 4. Use Categories Consistently

```typescript
// Use predefined categories
logger.auth.info('...');      // AUTH category
logger.api.info('...');        // API category
logger.healthcare.info('...'); // HEALTHCARE category

// Or specify custom categories
logger.info('Custom event', 'CUSTOM_MODULE');
```

### 5. Avoid Sensitive Information

```typescript
// Good - Sanitized data
logger.auth.info('User logged in', { 
  userId: user.id,
  email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
});

// Bad - Exposing sensitive data
logger.auth.info('User logged in', { 
  userId: user.id,
  password: user.password, // Never log passwords!
  ssn: user.ssn,          // Never log SSN!
});
```

## Troubleshooting

### Logs Not Appearing

1. Check if logging is enabled:
   ```typescript
   const config = getLoggingConfig();
   console.log('Logging enabled:', config.enabled);
   ```

2. Verify category is enabled:
   ```typescript
   console.log('Enabled categories:', config.categories.enabled);
   ```

3. Check log level:
   ```typescript
   console.log('Current log level:', config.logLevel);
   ```

### External Service Connection Issues

1. Check if service is running:
   ```bash
   curl http://localhost:3003/health
   ```

2. Verify CORS configuration:
   ```typescript
   // Check allowed origins
   console.log('Allowed origins:', config.cors.allowedOrigins);
   ```

3. Check network connectivity:
   ```typescript
   // Test manual connection
   fetch('http://localhost:3003/health')
     .then(res => res.json())
     .then(console.log)
     .catch(console.error);
   ```

### Performance Issues

1. Reduce batch size for real-time logging:
   ```env
   LOGGING_BATCH_SIZE=10
   LOGGING_FLUSH_INTERVAL=1000
   ```

2. Disable unnecessary categories:
   ```env
   LOGGING_ENABLED_CATEGORIES=AUTH,HEALTHCARE
   LOGGING_DISABLED_CATEGORIES=TRACE,DEBUG
   ```

3. Disable console output in production:
   ```env
   LOGGING_CONSOLE_ENABLED=false
   ```

### Debug Panel Not Showing Logs

1. Ensure Debug Panel is enabled:
   ```typescript
   import { useDebugStore } from '@/lib/stores/debug-store';
   const { enableDebugPanel } = useDebugStore();
   enableDebugPanel();
   ```

2. Check if logs are being sent:
   ```typescript
   import { debugLog } from '@/components/blocks/debug/utils/logger';
   debugLog.info('Test message');
   ```

## Examples

### Complete Healthcare Alert Logging Flow

```typescript
// When creating an alert
logger.healthcare.info('Creating new alert', {
  requestedBy: ctx.user.id,
  alertType: input.alertType,
  roomNumber: input.roomNumber,
});

try {
  const alert = await createAlert(input);
  
  logger.healthcare.alertCreated({
    alertId: alert.id,
    ...alert,
  });
  
  // Send to external service for monitoring
  logger.info('Alert created successfully', 'HEALTHCARE', {
    alertId: alert.id,
    responseTime: Date.now() - startTime,
  });
  
} catch (error) {
  logger.healthcare.error('Failed to create alert', {
    error: error.message,
    input,
    userId: ctx.user.id,
  });
  throw error;
}
```

### Authentication Flow Logging

```typescript
// OAuth start
logger.auth.info('OAuth flow initiated', {
  provider: 'google',
  redirectUri: callbackUrl,
});

// OAuth callback
try {
  const user = await handleOAuthCallback(code);
  logger.auth.login(user.id, 'oauth-google', {
    firstLogin: !user.lastLoginAt,
  });
} catch (error) {
  logger.auth.error('OAuth callback failed', {
    provider: 'google',
    error: error.message,
    code: error.code,
  });
}

// Session management
logger.auth.sessionRefresh(user.id, session.id);
```

### API Request Logging

```typescript
// Middleware example
export async function loggingMiddleware(req: Request, next: () => Promise<Response>) {
  const start = Date.now();
  const method = req.method;
  const url = new URL(req.url);
  
  logger.api.request(method, url.pathname, {
    query: Object.fromEntries(url.searchParams),
    headers: req.headers,
  });
  
  try {
    const response = await next();
    const duration = Date.now() - start;
    
    logger.api.response(method, url.pathname, response.status, duration);
    
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    logger.api.error(method, url.pathname, error, duration);
    throw error;
  }
}
```

## Conclusion

The logging infrastructure provides comprehensive debugging and monitoring capabilities. Use the appropriate logger for your use case, follow the best practices, and leverage the debug tools for efficient development and troubleshooting.