# Healthcare Alert Module - Complete Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [API Reference](#api-reference)
5. [Components](#components)
6. [Database Schema](#database-schema)
7. [WebSocket Integration](#websocket-integration)
8. [Security & Permissions](#security-permissions)
9. [Usage Examples](#usage-examples)
10. [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Healthcare Alert Module is a comprehensive real-time alert management system designed for hospital environments. It provides instant notification, escalation, and tracking of critical medical alerts.

### Key Capabilities
- **Real-time Alerts**: Instant notification via WebSocket
- **Automatic Escalation**: Time-based escalation through healthcare hierarchy
- **Alert Templates**: Quick creation of common alert types
- **Comprehensive Tracking**: Full audit trail and timeline for each alert
- **Role-based Access**: Granular permissions based on healthcare roles
- **Offline Support**: Event queue ensures no alerts are lost

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
├──────────────────┬──────────────────┬──────────────────┤
│  Alert Creation  │  Alert Display   │  Alert Actions   │
│  Components      │  Components      │  Components      │
└──────────────────┴──────────────────┴──────────────────┘
                           │
                    ┌──────▼──────┐
                    │  WebSocket   │
                    │  Connection  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Event Queue  │
                    │& Deduplication│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  tRPC API    │
                    │  Endpoints   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL  │
                    │  Database    │
                    └─────────────┘
```

### Data Flow

1. **Alert Creation**
   - Operator creates alert via UI
   - Alert saved to database
   - WebSocket event broadcast
   - Push notifications sent

2. **Alert Escalation**
   - Timer service monitors active alerts
   - Automatic escalation after timeout
   - Notifications to next tier
   - Timeline events recorded

3. **Alert Resolution**
   - Healthcare staff acknowledge/resolve
   - Status updates broadcast
   - Escalation timers stopped
   - Metrics updated

## 🚀 Features

### 1. Alert Management

#### Create Alert
```typescript
// Basic alert creation
const alert = await api.healthcare.createAlert.mutate({
  roomNumber: "302",
  alertType: "cardiac_arrest",
  urgencyLevel: 1,
  description: "Patient experiencing cardiac arrest",
  hospitalId: "hospital-uuid"
});

// Create from template
const alertFromTemplate = await api.healthcare.createAlertFromTemplate.mutate({
  templateId: "template-uuid",
  roomNumber: "ICU-1",
  description: "Additional details"
});
```

#### Alert Types
- `cardiac_arrest` - Critical cardiac events
- `code_blue` - Medical emergency
- `fire` - Fire emergency
- `security` - Security threat
- `medical_emergency` - General medical emergency

#### Urgency Levels
1. **Critical** - Immediate response required
2. **High** - Urgent response needed
3. **Medium** - Prompt attention required
4. **Low** - Standard priority
5. **Information** - Informational only

### 2. Alert Templates

Templates allow quick creation of common alert scenarios:

```typescript
// Create a template
const template = await api.healthcare.createAlertTemplate.mutate({
  name: "Cardiac Emergency - ICU",
  alertType: "cardiac_arrest",
  urgencyLevel: 1,
  defaultDescription: "Cardiac emergency in ICU, immediate response required",
  targetDepartment: "cardiology",
  icon: "❤️",
  color: "#FF0000"
});

// Get available templates
const templates = await api.healthcare.getAlertTemplates.query({
  hospitalId: "hospital-uuid",
  includeGlobal: true,
  activeOnly: true
});
```

### 3. Escalation System

Automatic escalation ensures alerts don't go unnoticed:

```typescript
// Default escalation tiers
const ESCALATION_TIERS = [
  { role: 'nurse', timeout_minutes: 2, next_tier: 'doctor' },
  { role: 'doctor', timeout_minutes: 3, next_tier: 'head_doctor' },
  { role: 'head_doctor', timeout_minutes: 2, next_tier: 'all_staff' }
];
```

The escalation timer service runs continuously to:
- Monitor active alerts
- Check for timeout conditions
- Escalate to next tier automatically
- Send notifications to new recipients

### 4. Real-time Updates

WebSocket integration provides instant updates:

```typescript
// Use WebSocket hook
const { isConnected, queueStats } = useAlertWebSocket({
  hospitalId: "hospital-uuid",
  onAlertCreated: (event) => {
    console.log("New alert:", event);
  },
  onAlertAcknowledged: (event) => {
    console.log("Alert acknowledged:", event);
  },
  showNotifications: true
});
```

### 5. Event Queue & Reliability

The event queue ensures no events are lost:

```typescript
// Event queue features
- Automatic deduplication (5-second window)
- Persistent storage for offline support
- Retry mechanism (3 attempts)
- Order preservation
- Queue size management (500 events max)
```

## 📚 API Reference

### Alert Endpoints

#### `createAlert`
Creates a new alert with validation and notifications.

**Input:**
```typescript
{
  roomNumber: string;         // Required, 1-10 chars
  alertType: AlertType;       // Required
  urgencyLevel: 1-5;         // Required
  description?: string;       // Optional, max 500 chars
  hospitalId: string;        // Required UUID
}
```

#### `getActiveAlerts`
Fetches active alerts with filtering and pagination.

**Input:**
```typescript
{
  hospitalId?: string;
  limit?: number;            // 1-100, default 20
  offset?: number;
  status?: 'active' | 'acknowledged' | 'resolved' | 'all';
  urgencyLevel?: number;
  alertType?: string;
  sortBy?: 'createdAt' | 'urgencyLevel' | 'acknowledgedAt';
  sortOrder?: 'asc' | 'desc';
}
```

#### `acknowledgeAlert`
Acknowledges an alert with detailed response information.

**Input:**
```typescript
{
  alertId: string;
  urgencyAssessment: 'maintain' | 'increase' | 'decrease';
  responseAction: 'responding' | 'delayed' | 'delegating' | 'monitoring';
  estimatedResponseTime?: number;  // minutes
  delegateTo?: string;             // user ID
  notes?: string;
}
```

#### `getAlertTimeline`
Gets complete timeline for an alert.

**Returns:**
```typescript
{
  alert: Alert;
  timeline: TimelineEvent[];
  totalEvents: number;
  responseTime: number | null;     // seconds
  resolutionTime: number | null;   // seconds
}
```

### Template Endpoints

#### `getAlertTemplates`
#### `createAlertTemplate`
#### `updateAlertTemplate`
#### `deleteAlertTemplate`
#### `createAlertFromTemplate`

## 🧩 Components

### Alert Creation Components

#### `AlertCreationFormSimplified`
Streamlined form for quick alert creation.

```tsx
<AlertCreationFormSimplified
  hospitalId="hospital-uuid"
  onSuccess={(alertData) => console.log("Created:", alertData)}
  embedded={true}
/>
```

#### `AlertTemplateSelector`
Template-based alert creation interface.

```tsx
<AlertTemplateSelector
  hospitalId="hospital-uuid"
  onSelectTemplate={(template) => console.log("Selected:", template)}
  onCreateAlert={(template, roomNumber) => console.log("Created from template")}
/>
```

### Alert Display Components

#### `AlertCardPremium`
Feature-rich alert card with actions.

```tsx
<AlertCardPremium
  alert={alertData}
  index={0}
  onPress={() => router.push(`/alerts/${alert.id}`)}
  onAcknowledge={handleAcknowledge}
  canAcknowledge={true}
  isHighlighted={true}
/>
```

#### `AlertListEnhanced`
Paginated alert list with filters.

#### `AlertTimeline`
Visual timeline of alert events.

### Alert Management Components

#### `AlertFilters`
Search and filter controls.

#### `AlertActions`
Action buttons for alert management.

#### `FloatingAlertButton`
Quick-access floating action button.

## 💾 Database Schema

### Core Tables

#### `alerts`
Main alerts table storing all alert records.

```sql
alerts (
  id UUID PRIMARY KEY,
  roomNumber VARCHAR(10) NOT NULL,
  alertType VARCHAR(50) NOT NULL,
  urgencyLevel INTEGER CHECK (1-5),
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  createdBy TEXT REFERENCES users(id),
  hospitalId UUID REFERENCES hospitals(id),
  -- Escalation fields
  currentEscalationTier INTEGER DEFAULT 1,
  nextEscalationAt TIMESTAMP,
  -- Timestamps
  createdAt TIMESTAMP DEFAULT NOW(),
  acknowledgedAt TIMESTAMP,
  resolvedAt TIMESTAMP
)
```

#### `alertTemplates`
Predefined alert templates for quick creation.

```sql
alertTemplates (
  id UUID PRIMARY KEY,
  hospitalId UUID REFERENCES hospitals(id),
  name VARCHAR(100) NOT NULL,
  alertType VARCHAR(50) NOT NULL,
  urgencyLevel INTEGER,
  defaultDescription TEXT,
  targetDepartment VARCHAR(50),
  icon VARCHAR(10),
  color VARCHAR(7),
  isActive BOOLEAN DEFAULT true,
  isGlobal BOOLEAN DEFAULT false
)
```

#### `alertEscalations`
Tracks escalation history.

#### `alertAcknowledgments`
Detailed acknowledgment records.

#### `alertTimelineEvents`
Complete event history for each alert.

## 🔌 WebSocket Integration

### Connection Management

The WebSocket connection is managed through the `useAlertWebSocket` hook:

```typescript
const {
  isConnected,        // Connection status
  connectionError,    // Error details if any
  isPolling,         // Fallback polling active
  queueStats         // Event queue statistics
} = useAlertWebSocket({
  hospitalId: "hospital-uuid",
  enabled: true,
  showNotifications: true,
  fallbackToPolling: true,
  pollingInterval: 5000
});
```

### Event Types

- `alert.created` - New alert created
- `alert.acknowledged` - Alert acknowledged by staff
- `alert.resolved` - Alert resolved
- `alert.escalated` - Alert escalated to next tier
- `alert.updated` - Alert details updated

### Event Queue

The event queue provides reliability:

```typescript
// Queue statistics
{
  queueSize: 5,              // Current queue size
  processedCount: 123,       // Total processed
  isProcessing: true,        // Processing active
  oldestEvent: Date          // Oldest pending event
}
```

## 🔐 Security & Permissions

### Role-based Permissions

```typescript
const rolePermissions = {
  admin: ['*'],
  operator: ['create_alerts', 'view_alerts', 'view_logs'],
  doctor: ['view_alerts', 'acknowledge_alerts', 'view_logs'],
  nurse: ['view_alerts', 'acknowledge_alerts', 'view_logs'],
  head_doctor: ['view_alerts', 'acknowledge_alerts', 'view_logs', 'view_analytics']
};
```

### Permission Guards

Components use permission guards:

```tsx
<PermissionGuard permission={PERMISSIONS.CREATE_ALERTS}>
  <AlertCreationForm />
</PermissionGuard>
```

### Audit Logging

All actions are logged for compliance:
- Alert creation/modification
- Acknowledgments
- Escalations
- Template management

## 📖 Usage Examples

### Complete Alert Flow

```typescript
// 1. Create an alert
const { alert } = await api.healthcare.createAlert.mutate({
  roomNumber: "302",
  alertType: "cardiac_arrest",
  urgencyLevel: 1,
  description: "Patient in cardiac arrest",
  hospitalId: currentHospital.id
});

// 2. Monitor via WebSocket
useAlertWebSocket({
  hospitalId: currentHospital.id,
  onAlertCreated: (event) => {
    // Show notification
    showNotification(`New alert in room ${event.data.roomNumber}`);
  }
});

// 3. Acknowledge the alert
await api.healthcare.acknowledgeAlert.mutate({
  alertId: alert.id,
  urgencyAssessment: "maintain",
  responseAction: "responding",
  estimatedResponseTime: 2,
  notes: "On my way to room 302"
});

// 4. Resolve the alert
await api.healthcare.resolveAlert.mutate({
  alertId: alert.id,
  resolution: "Patient stabilized, transferred to ICU"
});
```

### Using Templates

```typescript
// 1. Get available templates
const { templates } = await api.healthcare.getAlertTemplates.query({
  hospitalId: currentHospital.id,
  includeGlobal: true
});

// 2. Create alert from template
const { alert } = await api.healthcare.createAlertFromTemplate.mutate({
  templateId: templates[0].id,
  roomNumber: "405",
  description: "Additional context"
});
```

## 🔧 Troubleshooting

### Common Issues

#### WebSocket Connection Failed
- Check network connectivity
- Verify WebSocket server is running
- Check for firewall/proxy issues
- System falls back to polling automatically

#### Alerts Not Escalating
- Verify escalation timer service is running
- Check alert status (only 'active' alerts escalate)
- Review escalation tier configuration
- Check audit logs for errors

#### Missing Notifications
- Verify push notification permissions
- Check user notification preferences
- Ensure users are on duty
- Review notification service logs

### Debug Tools

```typescript
// Enable debug logging
logger.setLevel('debug', 'HEALTHCARE');

// Check queue stats
const stats = alertEventQueue.getStats();
console.log('Queue stats:', stats);

// Manual escalation (admin)
await api.healthcare.triggerEscalation.mutate({
  alertId: "alert-uuid"
});
```

## 🚦 Performance Considerations

### Optimization Strategies

1. **Query Caching**
   - 30-second cache for active alerts
   - Invalidation on WebSocket events

2. **Pagination**
   - Default 20 items per page
   - Cursor-based for large datasets

3. **Event Deduplication**
   - 5-second window
   - Prevents duplicate processing

4. **Connection Management**
   - Automatic reconnection
   - Exponential backoff
   - Fallback to polling

### Best Practices

1. Use templates for common scenarios
2. Keep descriptions concise
3. Set appropriate urgency levels
4. Acknowledge alerts promptly
5. Provide handover notes when ending shifts
6. Monitor escalation metrics

---

This documentation covers the complete alert module implementation. For specific integration questions or advanced scenarios, please refer to the inline code documentation or contact the development team.