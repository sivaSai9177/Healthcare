# Alerts Integration Documentation

## Overview
The alerts module provides real-time monitoring and notification capabilities for healthcare environments. It includes WebSocket-based real-time updates, alert history tracking, and escalation management.

## Components

### 1. WebSocket Server
- **Location**: `src/server/websocket/bun-trpc-ws.ts`
- **Port**: 3002
- **Path**: `/api/trpc`
- **Features**:
  - TRPC protocol support for subscriptions
  - Dynamic hospital ID handling (no hardcoded IDs)
  - Test alert generation in development mode
  - Heartbeat messages every 30 seconds

### 2. Frontend Integration

#### Active Alerts Screen (`app/(app)/(tabs)/alerts/index.tsx`)
- Real-time updates via `useAlertWebSocket` hook
- Automatic refresh when alerts are created/acknowledged/resolved
- Permission-based access control
- Filtering by urgency and status

#### Alert History Screen (`app/(app)/alerts/history.tsx`)
- Historical alert data with time range filtering
- Search functionality by room number
- Statistics display (total, resolved, average response time)

#### Escalation Queue Screen (`app/(app)/alerts/escalation-queue.tsx`)
- Shows only escalated alerts (tier 2+)
- Bulk acknowledgment capabilities
- Real-time updates for escalated alerts
- Grouped display by escalation tier

### 3. API Integration
The healthcare router includes WebSocket subscription endpoints:
- `healthcare.subscribeToAlerts` - Real-time alert updates
- `healthcare.subscribeToMetrics` - Real-time metrics updates

## Setup Instructions

### Starting the Environment
Run the native expo script which includes WebSocket setup:
```bash
bun run native
```

This script will:
1. Start PostgreSQL, Redis, and Logging services
2. Build and start the WebSocket server container
3. Run database migrations
4. Start the Expo development server

### Verifying Integration
Run the verification script:
```bash
./scripts/verify-alerts-integration.sh
```

This checks:
- WebSocket server status
- API server connectivity
- Database tables
- Environment variables

## Testing Real-Time Alerts

1. **Development Mode**: Test alerts are automatically generated every 30 seconds for connected hospitals
2. **WebSocket Connection**: The frontend automatically connects when navigating to the alerts screen
3. **Console Monitoring**: Check browser/app console for WebSocket connection messages
4. **Docker Logs**: Monitor real-time activity with:
   ```bash
   docker logs -f myexpo-websocket-local
   ```

## Environment Variables
- `EXPO_PUBLIC_WS_URL`: WebSocket URL (e.g., `ws://localhost:3002/api/trpc`)
- `EXPO_PUBLIC_WS_PORT`: WebSocket port (default: 3002)
- `NODE_ENV`: Set to "development" for test alert generation

## Troubleshooting

### WebSocket Not Connecting
1. Ensure the WebSocket container is running: `docker ps | grep websocket`
2. Check the WebSocket URL in environment variables
3. Verify port 3002 is not blocked by firewall

### No Real-Time Updates
1. Check browser console for WebSocket errors
2. Verify hospital ID is set correctly in the app
3. Check Docker logs for subscription messages

### Test Alerts Not Appearing
1. Ensure `NODE_ENV=development` is set
2. Check that there are active WebSocket connections
3. Monitor Docker logs for alert emission messages

## Architecture Notes
- WebSocket server runs in a separate Docker container for isolation
- Uses Bun runtime for better performance
- Implements TRPC protocol for type-safe subscriptions
- Dynamically handles multiple hospital connections without hardcoding IDs