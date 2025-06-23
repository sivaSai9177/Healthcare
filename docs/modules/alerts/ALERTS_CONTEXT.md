# Alerts Module Context Document

**Purpose**: Technical reference for developers working on the alerts module  
**Audience**: Developers, QA Engineers, DevOps  
**Last Updated**: January 23, 2025

## Module Overview

The alerts module is a critical real-time system for managing healthcare emergencies. It handles creation, distribution, acknowledgment, and escalation of time-sensitive medical alerts across hospital departments.

### Core Responsibilities
- Real-time alert creation and distribution
- Automatic escalation based on response times
- Department-based routing
- Comprehensive audit trail
- Performance metrics tracking
- Multi-channel notifications (in-app, push, future: SMS/email)

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├─────────────────┬─────────────────┬────────────────────────┤
│   React Native  │    Expo Router   │   TanStack Query      │
│   Components    │    Navigation    │   State Management    │
└─────────────────┴─────────────────┴────────────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │   tRPC Client     │
                  │   Type-safe API   │
                  └─────────┬─────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
    │WebSocket│      │  HTTP API  │     │   Redis   │
    │  Server │      │  Endpoints │     │   Cache   │
    └────┬────┘      └─────┬─────┘     └─────┬─────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                    ┌───────▼────────┐
                    │   PostgreSQL   │
                    │    Database    │
                    └────────────────┘
```

### Data Flow Patterns

1. **Alert Creation Flow**
   ```
   User → UI Form → Validation → API Call → Database → WebSocket Broadcast → All Connected Clients
   ```

2. **Alert Escalation Flow**
   ```
   Timer Service → Check Unacknowledged → Escalate → Update DB → Notify Next Tier → Reset Timer
   ```

3. **Real-time Update Flow**
   ```
   Database Change → Trigger → WebSocket Event → Event Queue → Deduplication → Client Update
   ```

## Key Files and Their Purposes

### Frontend Components

#### Screens
- **`/app/(app)/(tabs)/alerts/index.tsx`**
  - Main alerts list screen
  - Handles filtering, searching, real-time updates
  - Performance critical - needs optimization

- **`/app/(app)/(tabs)/alerts/[id].tsx`**
  - Alert detail view
  - Shows timeline, acknowledgments, patient info
  - Handles alert actions (acknowledge, resolve)

- **`/app/(modals)/create-alert.tsx`**
  - Alert creation modal
  - Form validation and submission
  - Template selection integration

#### Components
- **`/components/blocks/healthcare/AlertCardPremium.tsx`**
  - Primary alert display component
  - Handles animations and interactions
  - Shows urgency indicators and actions

- **`/components/blocks/healthcare/AlertFilters.tsx`**
  - Filter UI for alert list
  - Manages search, urgency, status filters
  - Needs state persistence

- **`/components/blocks/healthcare/AlertTimeline.tsx`**
  - Visual timeline of alert events
  - Shows escalations and acknowledgments
  - Uses Reanimated for smooth animations

### Hooks and State Management

- **`/hooks/healthcare/useAlertWebSocket.ts`**
  - WebSocket connection management
  - Handles reconnection and event processing
  - Integrates with event queue

- **`/hooks/healthcare/useHealthcareApi.ts`**
  - tRPC query hooks for alerts
  - Manages caching and optimistic updates
  - Provides typed API access

- **`/lib/websocket/event-queue.ts`**
  - Event deduplication and queuing
  - Offline support with persistence
  - Retry mechanism for failed events

### Backend Services

- **`/src/server/routers/healthcare.ts`**
  - Main API endpoints for alerts
  - Handles CRUD operations
  - Implements permission checks

- **`/src/server/services/escalation-timer.ts`**
  - Background service for escalations
  - Redis-based timer management
  - Configurable escalation rules

- **`/src/server/services/alert-subscriptions.ts`**
  - WebSocket subscription management
  - Tracks connected clients
  - Handles targeted notifications

### Database Schema

- **`/src/db/healthcare-schema.ts`**
  - Alert table definitions
  - Related tables (escalations, acknowledgments)
  - Indexes for performance

### Type Definitions

- **`/types/alert.ts`**
  - Comprehensive TypeScript types
  - Shared between frontend and backend
  - Single source of truth

## API Endpoints Reference

### Queries
```typescript
// Get active alerts for a hospital
api.healthcare.getActiveAlerts.useQuery({ 
  hospitalId,
  options: { limit, offset, urgencyLevel, status }
})

// Get alert details with timeline
api.healthcare.getAlertDetails.useQuery({ alertId })

// Get alert analytics
api.healthcare.getAlertAnalytics.useQuery({ 
  hospitalId,
  dateRange: { start, end }
})
```

### Mutations
```typescript
// Create new alert
api.healthcare.createAlert.useMutation()
// Input: { roomNumber, alertType, urgencyLevel, description, hospitalId }

// Acknowledge alert
api.healthcare.acknowledgeAlert.useMutation()
// Input: { alertId, notes, responseAction, estimatedResponseTime }

// Resolve alert
api.healthcare.resolveAlert.useMutation()
// Input: { alertId, resolution }

// Create alert from template
api.healthcare.createAlertFromTemplate.useMutation()
// Input: { templateId, roomNumber, additionalInfo }
```

### Subscriptions
```typescript
// Subscribe to real-time alerts
api.healthcare.subscribeToAlerts.useSubscription({
  hospitalId,
  departmentId // optional
})
```

## Common Patterns and Best Practices

### 1. Error Handling
```typescript
// Always use try-catch with mutations
try {
  await acknowledgeMutation.mutateAsync({ alertId });
  haptic('success');
} catch (error) {
  haptic('error');
  log.error('Failed to acknowledge', 'ALERTS', error);
  // Error toast handled by mutation options
}
```

### 2. Optimistic Updates
```typescript
// Use optimistic updates for better UX
const utils = api.useContext();
acknowledgeMutation.mutate(data, {
  onMutate: async () => {
    // Cancel queries
    await utils.healthcare.getActiveAlerts.cancel();
    // Snapshot previous value
    const previous = utils.healthcare.getActiveAlerts.getData();
    // Optimistically update
    utils.healthcare.getActiveAlerts.setData(/* updated data */);
    return { previous };
  },
  onError: (err, data, context) => {
    // Rollback on error
    utils.healthcare.getActiveAlerts.setData(context.previous);
  }
});
```

### 3. WebSocket Event Handling
```typescript
// Always validate and deduplicate events
useAlertWebSocket({
  hospitalId,
  onAlertCreated: (event) => {
    // Validate event structure
    if (!isValidAlertEvent(event)) return;
    // Refetch queries
    queryClient.invalidateQueries(['alerts']);
  }
});
```

### 4. Performance Optimization
```typescript
// Use React.memo for expensive components
export const AlertCard = React.memo(({ alert }) => {
  // Component logic
}, (prev, next) => prev.alert.id === next.alert.id);

// Virtualize long lists
<VirtualList
  data={alerts}
  renderItem={({ item }) => <AlertCard alert={item} />}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index
  })}
/>
```

## Development Guidelines

### Adding New Alert Types
1. Update `alertTypeEnum` in database schema
2. Add type to TypeScript definitions
3. Update validation schemas
4. Add UI handling in creation form
5. Update routing rules if needed
6. Add tests for new type

### Implementing New Features
1. Start with TypeScript types
2. Create database migrations if needed
3. Implement API endpoints with tests
4. Build UI components
5. Add integration tests
6. Update documentation

### Performance Considerations
- Limit initial data fetch to 50 items
- Implement pagination or virtual scrolling
- Use React.memo for list items
- Debounce search/filter inputs
- Cache WebSocket connections
- Minimize re-renders with proper deps

### Security Guidelines
- Always check permissions before operations
- Validate hospital context
- Sanitize user inputs
- Use parameterized queries
- Audit log all actions
- Implement rate limiting

## Testing Strategy

### Unit Tests
```typescript
// Test individual functions
describe('Alert Utils', () => {
  test('calculateEscalationTime returns correct value', () => {
    const result = calculateEscalationTime(1, 'cardiac_arrest');
    expect(result).toBe(120); // 2 minutes
  });
});
```

### Integration Tests
```typescript
// Test API endpoints
describe('Alert API', () => {
  test('createAlert requires valid permissions', async () => {
    const response = await request(app)
      .post('/api/healthcare/createAlert')
      .send(invalidData);
    expect(response.status).toBe(403);
  });
});
```

### E2E Tests
```typescript
// Test complete workflows
describe('Alert Lifecycle', () => {
  test('Alert creation to resolution flow', async () => {
    // Create alert
    await page.click('[data-testid="create-alert"]');
    // Fill form
    // Submit
    // Verify alert appears
    // Acknowledge
    // Resolve
  });
});
```

## Troubleshooting Guide

### Common Issues

1. **WebSocket Connection Drops**
   - Check network stability
   - Verify WebSocket server is running
   - Check for proxy/firewall issues
   - Review connection logs

2. **Alerts Not Updating**
   - Verify WebSocket connection
   - Check browser console for errors
   - Ensure correct hospital context
   - Clear cache and reconnect

3. **Performance Issues**
   - Check number of active alerts
   - Monitor WebSocket message frequency
   - Review React DevTools for re-renders
   - Check network latency

4. **Permission Errors**
   - Verify user role and permissions
   - Check hospital assignment
   - Review auth token validity
   - Check API error responses

### Debug Commands
```bash
# Check WebSocket connections
npm run ws:debug

# Monitor alert escalations
npm run escalation:monitor

# Test alert creation
npm run test:alert:create

# Check performance metrics
npm run perf:alerts
```

## Environment Variables

```env
# WebSocket Configuration
WEBSOCKET_URL=ws://localhost:3001
WEBSOCKET_RETRY_DELAY=1000
WEBSOCKET_MAX_RETRIES=5

# Alert Configuration
ALERT_ESCALATION_ENABLED=true
ALERT_DEFAULT_TIMEOUT=300000 # 5 minutes
ALERT_MAX_ESCALATION_LEVEL=5

# Performance
ALERT_LIST_PAGE_SIZE=50
ALERT_CACHE_TTL=30000 # 30 seconds
ALERT_VIRTUALIZATION_THRESHOLD=100
```

## Monitoring and Metrics

### Key Metrics to Track
- Alert creation rate
- Average acknowledgment time
- Escalation frequency
- WebSocket connection stability
- API response times
- Error rates by endpoint

### Logging Standards
```typescript
// Use structured logging
log.info('Alert created', 'ALERTS', {
  alertId: alert.id,
  userId: user.id,
  hospitalId: hospital.id,
  urgencyLevel: alert.urgencyLevel,
  responseTime: Date.now() - startTime
});
```

## Future Considerations

### Planned Enhancements
1. Machine learning for alert prediction
2. Voice-activated alert creation
3. Integration with wearable devices
4. Multi-language support
5. Advanced analytics dashboard
6. Automated alert routing based on staff availability

### Scalability Plans
- Implement alert archiving for old data
- Add database partitioning by hospital
- Consider microservice extraction
- Implement read replicas for queries
- Add CDN for static assets
- Optimize WebSocket with clustering

## Resources and References

### Internal Documentation
- [Healthcare ERD](../../db/healthcare-erd.md)
- [Data Flow Diagrams](../../db/healthcare-dataflow.md)
- [API Documentation](../../api/healthcare-api-implementation.md)
- [WebSocket Guide](../../api/websocket-implementation.md)

### External Resources
- [React Native Performance](https://reactnative.dev/docs/performance)
- [WebSocket Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [PostgreSQL Optimization](https://www.postgresql.org/docs/current/performance-tips.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Team Contacts
- Technical Lead: [Contact Info]
- Backend Developer: [Contact Info]
- Frontend Developer: [Contact Info]
- QA Engineer: [Contact Info]
- DevOps: [Contact Info]