# WebSocket Implementation for Healthcare Alerts

## Overview

The healthcare module now supports real-time updates via WebSocket subscriptions using tRPC. This implementation provides:

- Real-time alert notifications
- Live metrics updates
- Automatic fallback to polling when WebSocket is unavailable
- Seamless integration with existing tRPC infrastructure

## Architecture

### Server-Side Components

1. **tRPC WebSocket Server** (`src/server/websocket/trpc-websocket.ts`)
   - Integrated WebSocket server using `@trpc/server/adapters/ws`
   - Runs on port 3002 by default (configurable via `EXPO_PUBLIC_WS_PORT`)
   - Handles authentication via Bearer tokens
   - Automatically started with the main API server

2. **Alert Subscription Service** (`src/server/services/alert-subscriptions.ts`)
   - Event-driven architecture using Node.js EventEmitter
   - Provides observables for tRPC subscriptions
   - Handles alert lifecycle events (created, acknowledged, resolved, escalated)

3. **Healthcare Router Subscriptions** (`src/server/routers/healthcare.ts`)
   - `subscribeToAlerts`: Real-time alert events for a hospital
   - `subscribeToMetrics`: Live metrics updates with configurable intervals

### Client-Side Components

1. **tRPC Client Configuration** (`lib/api/trpc.tsx`)
   - Split link configuration for HTTP/WebSocket routing
   - Automatic WebSocket connection management
   - Fallback to HTTP-only mode when WebSocket is disabled

2. **Alert WebSocket Hook** (`hooks/healthcare/useAlertWebSocket.ts`)
   - Primary hook for real-time alert subscriptions
   - Automatic fallback to polling when WebSocket fails
   - Built-in notification support
   - Connection status tracking

3. **Updated Components**
   - `AlertList`: Now uses WebSocket for real-time updates
   - Automatic query invalidation on new events
   - Optimistic updates support

## Usage

### Basic Alert Subscription

```typescript
import { useAlertWebSocket } from '@/hooks/healthcare';

function MyComponent() {
  const { isConnected, isPolling } = useAlertWebSocket({
    hospitalId: 'hospital-id',
    enabled: true,
    showNotifications: true,
    onAlertCreated: (event) => {
      console.log('New alert:', event);
    },
    onAlertAcknowledged: (event) => {
      console.log('Alert acknowledged:', event);
    },
  });

  return (
    <div>
      {isConnected ? 'Real-time updates' : isPolling ? 'Polling mode' : 'Disconnected'}
    </div>
  );
}
```

### Metrics Subscription

The metrics subscription is automatically handled by the `useAlertWebSocket` hook and updates the query cache directly.

## Configuration

### Environment Variables

```bash
# Enable WebSocket functionality
EXPO_PUBLIC_ENABLE_WS=true

# WebSocket server port (default: 3002)
EXPO_PUBLIC_WS_PORT=3002
```

### Starting the Servers

#### Development with Healthcare

```bash
# Starts all services including WebSocket server
bun run local:healthcare
```

#### Standalone WebSocket Server

```bash
# Start only the WebSocket server
bun run scripts/start-trpc-websocket.ts
```

#### Testing WebSocket

```bash
# Run WebSocket integration tests
bun run scripts/test-trpc-websocket.ts
```

## Fallback Behavior

The system automatically falls back to polling when:

1. WebSocket is disabled (`EXPO_PUBLIC_ENABLE_WS=false`)
2. WebSocket connection fails
3. Running in test environment
4. Browser doesn't support WebSocket

Default polling interval: 5 seconds (configurable)

## Troubleshooting

### WebSocket Not Connecting

1. Check if WebSocket server is running:
   ```bash
   lsof -i :3002
   ```

2. Verify environment variables:
   ```bash
   echo $EXPO_PUBLIC_ENABLE_WS
   echo $EXPO_PUBLIC_WS_PORT
   ```

3. Check logs:
   ```bash
   tail -f logs/websocket-server.log
   ```

### Authentication Issues

1. Ensure you have a valid session token
2. Check that Bearer token is being passed in WebSocket connection params
3. Verify session hasn't expired

### Performance Issues

1. Adjust metrics subscription interval (default: 30 seconds)
2. Consider implementing debouncing for frequent updates
3. Use `useOptimisticAlertUpdate` for immediate UI feedback

## Future Enhancements

1. **Reconnection Logic**: Automatic reconnection with exponential backoff
2. **Message Queue**: Buffer events during disconnection
3. **Selective Subscriptions**: Subscribe to specific alert types or departments
4. **Presence System**: Show which staff members are online
5. **Direct Messaging**: Real-time chat between healthcare staff

## Security Considerations

1. All WebSocket connections require authentication
2. Hospital-based isolation ensures data privacy
3. SSL/TLS should be enabled in production (`wss://`)
4. Rate limiting on subscription creation
5. Connection timeout after inactivity