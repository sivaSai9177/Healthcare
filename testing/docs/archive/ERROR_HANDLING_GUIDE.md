# Dynamic Error Handling System

## Overview

This guide documents the comprehensive error handling system implemented throughout the healthcare MVP application. The system provides automatic error detection, recovery strategies, offline support, and user-friendly error displays.

## Architecture

### Core Components

1. **ErrorProvider** (`/components/providers/ErrorProvider.tsx`)
   - Central context provider for error state management
   - Integrates with `useErrorDetection` hook
   - Provides recovery strategies based on error types
   - Manages error state across the application

2. **Error Boundaries**
   - **Global ErrorBoundary**: Catches all unhandled JavaScript errors
   - **AuthErrorBoundary**: Specialized for authentication flows
   - **HealthcareErrorBoundary**: Specialized for healthcare operations

3. **Error Display Components**
   - **ErrorBanner**: Global error display with recovery actions
   - **ErrorRecovery**: Inline error recovery suggestions
   - **ErrorDisplay**: Flexible error display (toast, banner, inline, full)

### Error Types

The system recognizes and handles these error types:
- `session-timeout`: Session expiration errors
- `connection-lost`: Network connectivity issues
- `unauthorized`: Permission/authentication errors
- `server-error`: 5xx server errors
- `rate-limit`: Too many requests (429) errors

## Usage

### Basic Error Handling

```typescript
import { useError } from '@/components/providers/ErrorProvider';

function MyComponent() {
  const { error, clearError, isOnline } = useError();
  
  // Check online status
  if (!isOnline) {
    return <OfflineMessage />;
  }
  
  // Handle errors
  if (error) {
    return <ErrorRecovery />;
  }
}
```

### Async Operations with Error Handling

```typescript
import { useAsyncError } from '@/hooks/useAsyncError';

function MyComponent() {
  const { executeAsync, isLoading, error } = useAsyncError({
    retries: 2,
    retryDelay: 1000,
  });
  
  const handleSubmit = async () => {
    await executeAsync(
      async () => {
        await api.someOperation();
      },
      'operation-context'
    );
  };
}
```

### Offline Queue for Healthcare Operations

```typescript
import { useOfflineQueue } from '@/lib/error/offline-queue';

function AlertCreation() {
  const { enqueue } = useOfflineQueue();
  const { isOnline } = useError();
  
  const createAlert = async (data) => {
    if (!isOnline) {
      // Queue for offline processing
      await enqueue('alert', 'create', data);
      return;
    }
    
    // Normal online submission
    await api.healthcare.createAlert(data);
  };
}
```

## Error Recovery Strategies

The system provides automatic recovery strategies for each error type:

### Session Timeout
1. Refresh session automatically
2. Redirect to login if refresh fails

### Connection Lost
1. Monitor connection status
2. Auto-retry when connection restored
3. Queue operations for offline processing

### Server Errors
1. Exponential backoff retry
2. Circuit breaker pattern to prevent cascading failures
3. Fallback to cached data when available

## Integration Points

### Authentication Flow
- Error boundary wraps all auth screens
- Automatic session refresh on timeout
- Clear error feedback for login failures

### Healthcare Alert Creation
- Offline queue for critical alerts
- Retry logic for network failures
- Real-time connection status indicator

## Testing Error Scenarios

In development mode, use the error testing utilities:

```typescript
import { useErrorTesting } from '@/lib/error/error-test-utils';

function DebugPanel() {
  const { triggerError, scenarios } = useErrorTesting();
  
  return (
    <View>
      {scenarios.map(scenario => (
        <Button
          key={scenario.type}
          onPress={() => triggerError(scenario)}
          title={`Test ${scenario.type}`}
        />
      ))}
    </View>
  );
}
```

## Best Practices

1. **Always wrap async operations** with error handling
2. **Use appropriate error boundaries** for different app sections
3. **Provide clear recovery actions** for users
4. **Queue critical operations** when offline
5. **Log errors with context** for debugging
6. **Test error scenarios** during development

## Configuration

### Retry Configuration
```typescript
const retryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  factor: 2,
};
```

### Offline Queue Configuration
```typescript
const STORAGE_KEY = '@healthcare/offline_queue';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 3;
```

## Monitoring and Debugging

1. All errors are logged with the unified logger
2. Error context includes:
   - Error type and message
   - Stack trace (in dev mode)
   - User context
   - Request ID for server errors
   - Timestamp

3. Debug panel shows:
   - Current error state
   - Network status
   - Queued operations
   - Error history

## Future Enhancements

1. **Error Analytics**: Track error patterns and frequency
2. **Smart Recovery**: Learn from successful recovery patterns
3. **Progressive Degradation**: Provide limited functionality when services are down
4. **Error Reporting**: Automated error reporting to monitoring services