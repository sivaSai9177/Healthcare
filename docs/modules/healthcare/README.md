# Healthcare Module

The core module for healthcare alert management, providing real-time alert creation, automatic escalation, shift management, and analytics.

## Overview

The Healthcare module is designed to streamline communication in healthcare facilities by providing instant alert creation and intelligent routing to appropriate staff members.

### Key Features
- 🚨 **Real-time Alerts**: Instant notification system
- 🔄 **Automatic Escalation**: Time-based alert escalation
- 👥 **Role-based Access**: Doctor, Nurse, Operator roles
- 📊 **Analytics Dashboard**: Real-time metrics and reports
- 🏥 **Multi-hospital Support**: Organization-wide management

## Architecture

```
healthcare/
├── components/          # UI components
│   ├── AlertList.tsx
│   ├── AlertCreationForm.tsx
│   ├── ShiftStatus.tsx
│   └── MetricsOverview.tsx
├── hooks/              # Business logic hooks
│   ├── useAlerts.ts
│   ├── useShift.ts
│   └── useHealthcareMetrics.ts
├── services/           # Backend services
│   ├── alertService.ts
│   ├── escalationService.ts
│   └── notificationService.ts
└── types/              # TypeScript definitions
    └── healthcare.ts
```

## API Reference

### Alert Management

#### Create Alert
```ts
api.healthcare.createAlert.mutate({
  roomNumber: 'A301',
  alertType: 'medical_emergency',
  urgencyLevel: 4,
  description: 'Patient needs immediate attention',
  patientId: 'patient-123', // optional
});
```

#### Acknowledge Alert
```ts
api.healthcare.acknowledgeAlert.mutate({
  alertId: 'alert-123',
  notes: 'On my way to the room',
});
```

#### Resolve Alert
```ts
api.healthcare.resolveAlert.mutate({
  alertId: 'alert-123',
  resolution: 'Patient treated and stable',
});
```

### Shift Management

#### Start Shift
```ts
api.healthcare.toggleOnDuty.mutate({
  status: true,
});
```

#### End Shift with Handover
```ts
api.healthcare.endShift.mutate({
  handoverNotes: 'All patients stable, see notes for room B202',
  criticalAlerts: ['alert-456'],
});
```

## Usage Examples

### Alert List Component
```tsx
import { AlertList } from '@/components/blocks/healthcare';

export function AlertsPage() {
  return (
    <AlertList 
      filterStatus="active"
      filterUrgency="high"
      onAlertPress={(alert) => {
        router.push(`/alert/${alert.id}`);
      }}
    />
  );
}
```

### Using Alert Hook
```tsx
import { useAlerts } from '@/hooks/healthcare';

export function MyComponent() {
  const { alerts, isLoading, acknowledgeAlert } = useAlerts();
  
  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeAlert(alertId);
  };
  
  return (
    // Your UI
  );
}
```

## Role Permissions

| Action | Operator | Nurse | Doctor | Admin |
|--------|----------|-------|--------|-------|
| Create Alert | ✅ | ❌ | ❌ | ✅ |
| View Alerts | ✅ | ✅ | ✅ | ✅ |
| Acknowledge | ❌ | ✅ | ✅ | ✅ |
| Resolve | ❌ | ✅ | ✅ | ✅ |
| View Analytics | ❌ | ✅ | ✅ | ✅ |

## Escalation Rules

Alerts automatically escalate based on urgency level:

| Urgency | Initial | Tier 2 | Tier 3 |
|---------|---------|--------|--------|
| 5 (Critical) | 5 min | 10 min | 15 min |
| 4 (High) | 10 min | 20 min | 30 min |
| 3 (Medium) | 15 min | 30 min | 45 min |
| 2 (Low) | 30 min | 60 min | 90 min |
| 1 (Info) | 60 min | - | - |

## WebSocket Events

The module uses WebSocket for real-time updates:

```ts
// Listen for new alerts
socket.on('alert:new', (alert) => {
  // Handle new alert
});

// Listen for status updates
socket.on('alert:statusChanged', ({ alertId, status }) => {
  // Update UI
});

// Listen for escalations
socket.on('alert:escalated', ({ alertId, tier }) => {
  // Show escalation notification
});
```

## Testing

### Unit Tests
```bash
bun run test:healthcare:unit
```

### Integration Tests
```bash
bun run test:healthcare:integration
```

### Test Coverage
- Unit Tests: 100% ✅
- Integration Tests: 0% (environment issues)
- Component Tests: 20%

## Common Issues

### WebSocket Connection
If real-time updates aren't working:
1. Check Docker is running: `docker ps`
2. Verify WebSocket URL in `.env`
3. Check browser console for errors

### Alert Creation Fails
1. Verify user has operator role
2. Check hospital assignment
3. Ensure room number is provided

## Performance Considerations

- Alert lists are paginated (20 per page)
- Metrics are cached for 5 minutes
- WebSocket reconnects automatically
- Offline queue for actions

## Future Enhancements

1. **AI-Powered Predictions**: Predict alert urgency
2. **Voice Commands**: Create alerts via voice
3. **Video Consultations**: Direct video calls
4. **Advanced Analytics**: ML-based insights
5. **Integration APIs**: Third-party systems

## Contributing

When adding features to the Healthcare module:
1. Follow existing patterns
2. Add comprehensive tests
3. Update this documentation
4. Consider performance impact
5. Ensure accessibility

---

For more details, see:
- [API Documentation](../../api/healthcare-api.md)
- [Testing Guide](./testing.md)
- [Troubleshooting](./troubleshooting.md)