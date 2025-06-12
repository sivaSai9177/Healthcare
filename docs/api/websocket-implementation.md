# WebSocket Real-time System Implementation

## Overview
The WebSocket real-time system has been implemented to provide live updates for healthcare alerts and metrics. This replaces the polling-based approach with efficient, bidirectional communication.

## Architecture

### Server Components

1. **WebSocket Server** (`/src/server/websocket/index.ts`)
   - Runs on port 3001 by default (configurable via `WEBSOCKET_PORT`)
   - Integrates with tRPC for type-safe subscriptions
   - Handles authentication via Bearer tokens
   - Implements connection tracking and heartbeat

2. **Alert Subscription Service** (`/src/server/services/alert-subscriptions.ts`)
   - Event-based system using EventEmitter
   - Supports hospital-wide and alert-specific subscriptions
   - Provides reconnection support with event history

3. **Healthcare Router Subscriptions** (`/src/server/routers/healthcare.ts`)
   - `subscribeToAlerts` - Real-time alert events
   - `subscribeToMetrics` - Live dashboard metrics

### Client Components

1. **tRPC Client Configuration** (`/lib/api/trpc.tsx`)
   - Automatic WebSocket fallback to HTTP
   - Authentication token injection
   - Reconnection handling

2. **React Hooks** (`/hooks/healthcare/useAlertSubscription.ts`)
   - `useAlertSubscription` - Subscribe to hospital alerts
   - `useMetricsSubscription` - Subscribe to live metrics
   - Automatic query invalidation on events

## Usage

### Starting the WebSocket Server

```bash
# Start WebSocket server (default port 3001)
bun run scripts/start-websocket-server.ts

# Or with custom port
WEBSOCKET_PORT=3002 bun run scripts/start-websocket-server.ts
```

### Client-side Usage

```tsx
// Subscribe to alerts in a component
import { useAlertSubscription } from '@/hooks/healthcare/useAlertSubscription';

function AlertDashboard() {
  const hospitalId = 'your-hospital-id';
  
  const { events, isConnected } = useAlertSubscription({
    hospitalId,
    onEvent: (event) => {
      console.log('New alert event:', event);
    },
  });
  
  return (
    <View>
      {isConnected ? (
        <Text>Connected to real-time alerts</Text>
      ) : (
        <Text>Connecting...</Text>
      )}
    </View>
  );
}
```

### Testing WebSocket Connections

```bash
# Test WebSocket subscriptions
bun run scripts/test-websocket-alerts.ts

# Test with specific hospital ID
TEST_HOSPITAL_ID=your-id bun run scripts/test-websocket-alerts.ts
```

## Event Types

The system supports the following real-time events:

1. **Alert Events**
   - `alert.created` - New alert created
   - `alert.acknowledged` - Alert acknowledged by staff
   - `alert.resolved` - Alert resolved
   - `alert.escalated` - Alert escalated to higher tier
   - `alert.updated` - Alert details updated

2. **Metrics Updates**
   - Active alerts count
   - Critical alerts count
   - Staff online count
   - Response rate
   - Average response time

## Configuration

### Environment Variables

```env
# WebSocket Configuration
EXPO_PUBLIC_ENABLE_WS=true
EXPO_PUBLIC_WS_PORT=3001
EXPO_PUBLIC_WEBSOCKET_URL=ws://localhost:3001/api/trpc  # Optional override
```

### Security

- Authentication via Bearer tokens in connection params
- Role-based access control for subscriptions
- Automatic session validation

## Fallback Behavior

If WebSocket connection fails, the system automatically falls back to:
1. HTTP polling for alerts (5-second interval)
2. Standard tRPC queries for metrics

## Performance Considerations

1. **Connection Pooling**
   - Reuses WebSocket connections across components
   - Automatic cleanup on unmount

2. **Event Batching**
   - Groups multiple events in high-traffic scenarios
   - Configurable update intervals for metrics

3. **Memory Management**
   - Event queue limited to 100 most recent events
   - Automatic garbage collection for old subscriptions

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure WebSocket server is running
   - Check firewall settings for port 3001
   - Verify CORS configuration

2. **Authentication Errors**
   - Ensure valid Bearer token is provided
   - Check session expiration
   - Verify user has required permissions

3. **Missing Events**
   - Check hospital ID matches
   - Verify subscription is active
   - Check network connectivity

### Debug Mode

Enable debug logging:
```typescript
// In your app initialization
import { log } from '@/lib/core/debug/logger';
log.setLevel('debug');
```

## Next Steps

1. Implement event persistence for offline support
2. Add subscription metrics and monitoring
3. Implement custom event filtering
4. Add support for presence indicators
5. Implement typing indicators for chat features