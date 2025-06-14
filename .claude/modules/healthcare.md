# Healthcare Module Context

## Overview
Complete healthcare alert system with real-time notifications, escalation logic, and comprehensive patient management.

## Module Status
- **MVP**: ✅ Complete (98%)
- **Real-time**: ✅ WebSocket implemented
- **Notifications**: ✅ Multi-channel ready
- **UI**: 🔄 Needs Tailwind migration

## Architecture

### Frontend Structure
```
app/(healthcare)/
├── dashboard.tsx
├── patients.tsx
├── alerts.tsx
├── alert-details.tsx
├── alert-history.tsx
├── activity-logs.tsx
└── response-analytics.tsx

components/healthcare/
├── AlertTimeline.tsx
├── EscalationTimer.tsx
└── PatientVitals.tsx

components/blocks/healthcare/
├── MetricsOverviewBlock.tsx
├── AlertListBlock.tsx
├── PatientCardBlock.tsx
├── AlertCreationBlock.tsx
├── ActivePatientsBlock.tsx
└── AlertSummaryBlock.tsx
```

### Backend Structure
```
src/server/routers/healthcare.ts
src/server/services/
├── alert-service.ts
├── patient-service.ts
├── vitals-service.ts
├── escalation-service.ts
└── notification-dispatcher.ts
```

## Key Features

### 1. Alert System
- Create alerts with severity levels
- Auto-escalation based on timers
- Acknowledgment workflow
- Complete audit trail
- Timeline visualization

### 2. Patient Management
- CRUD operations
- Unique MRN (Medical Record Number)
- Vital signs tracking
- Care team assignment
- Activity history

### 3. Real-time Updates
- WebSocket on port 3001
- Alert subscriptions
- Metrics updates
- Live dashboards

### 4. Notification System
- Email (Nodemailer ready)
- SMS (Twilio structure)
- Push (Expo notifications)
- In-app real-time alerts

## Database Schema

### Core Tables
- `patients` - Patient records
- `alerts` - Alert instances
- `alert_timeline` - Alert history
- `alert_acknowledgments` - Response tracking
- `notification_logs` - Delivery tracking
- `vitals` - Patient measurements

### Key Relationships
```
Patient -> Alerts (1:many)
Alert -> Timeline Events (1:many)
Alert -> Acknowledgments (1:many)
User -> Alerts (many:many via assignments)
```

## API Endpoints

### tRPC Procedures
```typescript
// Patient operations
patient.create
patient.update
patient.list
patient.getById

// Alert operations
alert.create
alert.acknowledge
alert.updateStatus
alert.escalate
alert.getTimeline

// Real-time
alert.subscribe
metrics.subscribe
```

## Alert Workflow

1. **Creation**
   - Staff creates alert
   - Auto-assigns based on rules
   - Starts escalation timer

2. **Notification**
   - Immediate push/email
   - In-app notification
   - Dashboard update

3. **Acknowledgment**
   - Staff acknowledges
   - Provides response action
   - Updates urgency assessment

4. **Escalation**
   - Timer-based escalation
   - Notifies next tier
   - Tracks in timeline

5. **Resolution**
   - Alert resolved
   - Final notes added
   - Metrics updated

## User Roles

### Healthcare Roles
- **Operator**: Creates alerts, basic view
- **Nurse**: Responds to alerts, patient care
- **Doctor**: All nurse permissions + prescriptions
- **Head Doctor**: Full access, can override

### Escalation Tiers
1. Nurse (5 min)
2. Doctor (10 min)
3. Head Doctor (15 min)

## Current Issues

### UI/UX
- Blocks need Tailwind migration
- Inconsistent spacing/density
- Shadow system not standardized

### Performance
- Chart components not lazy loaded
- Real-time updates need optimization
- Large patient lists need pagination

### Code Quality
- TODOs in escalation logic
- Console.logs in alert service
- TypeScript 'any' in timeline

## Testing

### Unit Tests
```bash
bun test src/server/services/alert-service.test.ts
bun test components/healthcare/
```

### E2E Tests
```bash
bun test:e2e healthcare/alert-flow
```

### Manual Testing
1. Create patient
2. Add vitals (trigger alert)
3. Watch escalation
4. Acknowledge alert
5. Verify timeline

## Environment Variables

```env
# WebSocket
EXPO_PUBLIC_WS_URL=ws://localhost:3001

# Notifications
EMAIL_FROM=noreply@hospital.com
SMTP_HOST=smtp.gmail.com
EXPO_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false

# Features
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=false
```

## Quick Commands

```bash
# Start with healthcare
bun run local:healthcare

# Test healthcare APIs
bun test src/server/routers/healthcare.test.ts

# Open healthcare dashboard
open http://localhost:8081/healthcare/dashboard
```

## Next Steps

1. **Complete UI Migration**
   - Migrate all 6 healthcare blocks
   - Standardize with density system
   - Remove theme dependencies

2. **Optimize Performance**
   - Implement virtual scrolling
   - Lazy load charts
   - Optimize WS messages

3. **Enhance Features**
   - Add shift management
   - Implement handover notes
   - Add voice alerts option