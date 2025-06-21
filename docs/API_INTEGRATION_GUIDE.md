# API Integration Guide

This guide covers the enhanced API integration patterns implemented to address error handling, SSR support, caching, and proper abstraction of TRPC calls.

## Overview

The new API integration system provides:
- ✅ Built-in error handling with user-friendly alerts
- ✅ SSR prefetching support for web platform
- ✅ Offline caching for mobile platforms
- ✅ Consistent loading and error states
- ✅ Optimistic updates for mutations
- ✅ Error boundaries for graceful failure handling
- ✅ Type-safe API hooks

## Core Hooks

### `useApiQuery`

Enhanced query hook with error handling and caching:

```typescript
import { useApiQuery } from '@/hooks/api';

const { 
  data, 
  isLoading, 
  error,
  isOffline,
  cachedData,
  refreshCache 
} = useApiQuery(
  ['queryKey'],
  () => api.module.method.query(params),
  {
    showErrorAlert: true,
    cacheKey: 'unique_cache_key',
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    offlineMode: true,
    errorTitle: 'Custom Error Title',
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.log('Error:', error),
  }
);
```

### `useApiMutation`

Enhanced mutation hook with optimistic updates:

```typescript
import { useApiMutation } from '@/hooks/api';

const mutation = useApiMutation(
  (variables) => api.module.method.mutate(variables),
  {
    showErrorAlert: true,
    showSuccessAlert: true,
    errorTitle: 'Operation Failed',
    successTitle: 'Success',
    optimistic: true,
    invalidateQueries: [['queryKey']],
    hapticFeedback: true,
  }
);

// Use with automatic feedback
await mutation.mutateWithFeedback({ data });
```

### `useApiSubscription`

WebSocket subscription hook with reconnection:

```typescript
import { useApiSubscription } from '@/hooks/api';

const {
  data,
  error,
  isConnected,
  isReconnecting,
  reconnect,
  disconnect
} = useApiSubscription(
  ['subscriptionKey'],
  () => api.module.subscribe(),
  {
    onData: (data) => console.log('New data:', data),
    onError: (error) => console.log('Connection error:', error),
    retryAttempts: 3,
    retryDelay: 5000,
  }
);
```

## Healthcare-Specific Hooks

### Alert Management

```typescript
import { 
  useActiveAlerts,
  useAcknowledgeAlert,
  useResolveAlert,
  useCreateAlert 
} from '@/hooks/healthcare';

// Fetch alerts with caching
const { data: alerts, refetch } = useActiveAlerts({
  enabled: true,
  refetchInterval: 30000,
});

// Mutations with optimistic updates
const acknowledgeMutation = useAcknowledgeAlert();
const resolveMutation = useResolveAlert();
const createMutation = useCreateAlert();

// Usage
await acknowledgeMutation.mutateWithFeedback({
  alertId: 'alert-123',
  notes: 'Acknowledged by nurse',
});
```

### Metrics and Patients

```typescript
import { useHealthcareMetrics, usePatients } from '@/hooks/healthcare';

// Fetch metrics with caching
const { data: metrics } = useHealthcareMetrics({
  timeRange: 'day',
  enabled: true,
});

// Fetch patients
const { data: patients } = usePatients({
  status: 'active',
  enabled: true,
});
```

## Error Boundaries

### API Error Boundary

Wrap components that make API calls:

```tsx
import { ApiErrorBoundary } from '@/components/blocks/errors';

export default function MyComponent() {
  return (
    <ApiErrorBoundary retryRoute="/alerts">
      <AlertsContent />
    </ApiErrorBoundary>
  );
}
```

### With HOC

```tsx
import { withApiErrorBoundary } from '@/components/blocks/errors';

const MyComponent = () => {
  // Component logic
};

export default withApiErrorBoundary(MyComponent, {
  retryRoute: '/home',
  showDetails: true,
});
```

## SSR Prefetching

### Page-Level Prefetching

```tsx
import { useSSRPrefetchHealthcare } from '@/lib/api/use-ssr-prefetch';

export default function HealthcarePage() {
  const { hospitalId } = useHospitalContext();
  
  // Prefetch data for SSR
  useSSRPrefetchHealthcare(hospitalId);
  
  // Rest of component
}
```

### Custom Prefetching

```tsx
import { useSSRPrefetch } from '@/lib/api/use-ssr-prefetch';

export default function CustomPage() {
  useSSRPrefetch(
    async () => {
      // Custom prefetch logic
      const data = await api.custom.getData.query();
      return data;
    },
    {
      enabled: true,
      dependencies: [userId],
    }
  );
}
```

## Offline Support

The API hooks automatically cache data on mobile platforms using SecureStore:

1. **Automatic Caching**: Query results are cached with timestamps
2. **Cache Duration**: Configurable per query (default 5 minutes)
3. **Offline Fallback**: Cached data is used when offline
4. **Manual Cache Control**: Use `refreshCache()` to force update

```typescript
const { 
  data,
  isOffline,
  cachedData,
  refreshCache 
} = useActiveAlerts();

// Show offline indicator
if (isOffline && cachedData) {
  return <OfflineIndicator data={cachedData} />;
}
```

## Migration Guide

### Before (Direct TRPC Usage)

```typescript
const { data, isLoading, error } = api.healthcare.getActiveAlerts.useQuery(
  { hospitalId },
  { 
    enabled: !!hospitalId,
    onError: (err) => showErrorAlert('Error', err.message),
  }
);

const mutation = api.healthcare.acknowledgeAlert.useMutation({
  onSuccess: () => showSuccessAlert('Success'),
  onError: (err) => showErrorAlert('Error', err.message),
});
```

### After (Enhanced Hooks)

```typescript
// Automatic error handling, caching, and SSR support
const { data, isLoading, isOffline } = useActiveAlerts();

// Built-in feedback and optimistic updates
const mutation = useAcknowledgeAlert();
await mutation.mutateWithFeedback({ alertId });
```

## Best Practices

1. **Always use error boundaries** around components making API calls
2. **Prefer domain-specific hooks** (useHealthcareQuery) over generic ones
3. **Enable caching** for frequently accessed data
4. **Use optimistic updates** for better UX in mutations
5. **Handle offline states** gracefully on mobile
6. **Prefetch critical data** on web for better performance
7. **Invalidate related queries** after mutations

## Error Handling Patterns

### Global Error Handling

All API errors are automatically:
- Logged with context
- Tracked in error detection system
- Displayed as user-friendly alerts
- Reported to monitoring (if configured)

### Custom Error Handling

```typescript
const { data } = useApiQuery(
  ['custom'],
  queryFn,
  {
    showErrorAlert: false, // Disable automatic alerts
    onError: (error) => {
      // Custom error handling
      if (error.data?.code === 'UNAUTHORIZED') {
        router.push('/login');
      }
    },
  }
);
```

## Performance Optimization

1. **Query Keys**: Use consistent, hierarchical query keys
2. **Stale Time**: Configure based on data freshness needs
3. **Cache Duration**: Balance between freshness and performance
4. **Prefetching**: Use for predictable navigation patterns
5. **Invalidation**: Be specific about what to invalidate

## Testing

When testing components using these hooks:

```typescript
import { renderHook } from '@testing-library/react-hooks';
import { TRPCProvider } from '@/lib/api/trpc';

const wrapper = ({ children }) => (
  <TRPCProvider>{children}</TRPCProvider>
);

test('should fetch alerts', async () => {
  const { result, waitFor } = renderHook(
    () => useActiveAlerts(),
    { wrapper }
  );
  
  await waitFor(() => result.current.isSuccess);
  expect(result.current.data).toBeDefined();
});
```