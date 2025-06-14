# Hospital Alert System - Project Structure

**Last Updated**: January 11, 2025  
**Status**: Implementation Ready

## Project File Structure

```
my-expo/
├── app/
│   ├── (healthcare)/                    # Healthcare route group
│   │   ├── _layout.tsx                 ✅ Stack navigator
│   │   ├── alerts.tsx                  ✅ Alert management screen
│   │   ├── patients.tsx                ✅ Patient list screen
│   │   ├── escalation-queue.tsx        🚧 Escalation monitoring
│   │   ├── alert-history.tsx           🚧 Historical alerts
│   │   ├── shift-handover.tsx          🚧 Shift management
│   │   └── response-analytics.tsx      🚧 Analytics dashboard
│   │
│   ├── (modals)/                        # Modal screens
│   │   ├── create-alert.tsx            ✅ Alert creation
│   │   ├── patient-details.tsx         ✅ Patient info
│   │   ├── alert-details.tsx           🚧 Full alert view
│   │   ├── acknowledge-alert.tsx       🚧 Acknowledge modal
│   │   └── escalation-details.tsx      🚧 Escalation view
│   │
│   └── (home)/                          # Main dashboards
│       ├── operator-dashboard.tsx       ✅ Operator interface
│       ├── healthcare-dashboard.tsx     ✅ Medical staff interface
│       └── index.tsx                    ✅ Role-based redirect
│
├── components/
│   ├── healthcare/                      # Healthcare components
│   │   ├── AlertCreationForm.tsx       ✅ Alert form
│   │   ├── AlertDashboard.tsx          ✅ Dashboard component
│   │   ├── EscalationTimer.tsx         ✅ Timer component
│   │   └── blocks/                      # Healthcare blocks
│   │       ├── AlertCreationBlock.tsx  ✅
│   │       ├── AlertListBlock.tsx      ✅
│   │       ├── MetricsOverviewBlock.tsx ✅
│   │       └── PatientCardBlock.tsx    ✅
│   │
│   └── app/blocks/healthcare/           # App-level blocks
│       ├── AlertSummaryBlock.tsx        ✅ Overview block
│       ├── ActivePatientsBlock.tsx      ✅ Patient status
│       ├── EscalationQueueBlock.tsx     🚧 Active escalations
│       ├── AlertHistoryBlock.tsx        🚧 Recent history
│       ├── ShiftOverviewBlock.tsx       🚧 Shift status
│       ├── ResponseMetricsBlock.tsx     🚧 Performance KPIs
│       ├── AlertTimelineBlock.tsx       🚧 Timeline view
│       ├── QuickAlertCreationBlock.tsx  🚧 Quick create
│       ├── TeamStatusBlock.tsx          🚧 Team availability
│       └── CriticalAlertsBlock.tsx      🚧 Priority alerts
│
├── src/
│   ├── db/
│   │   ├── healthcare-schema.ts        ✅ Database schema
│   │   └── combined-schema.ts          ✅ Integrated schema
│   │
│   └── server/
│       ├── routers/
│       │   ├── healthcare.ts           ✅ Healthcare API
│       │   └── patient.ts              ✅ Patient API
│       │
│       └── services/
│           ├── alert-subscriptions.ts   ✅ Alert service
│           ├── escalation-timer.ts      ✅ Escalation logic
│           └── healthcare-access.ts     ✅ Access control
│
├── hooks/healthcare/                    # Healthcare hooks
│   ├── useAlertActivity.ts             ✅ Alert activity
│   └── useAlertSubscription.ts         ✅ Real-time alerts
│
├── types/
│   └── healthcare.ts                    ✅ TypeScript types
│
└── docs/
    ├── HOSPITAL_ALERT_PRD.md           ✅ Product requirements
    ├── HOSPITAL_ALERT_IMPLEMENTATION_PLAN.md ✅ Implementation guide
    ├── ALERT_ACKNOWLEDGMENT_GUIDE.md   ✅ Acknowledgment reference
    └── projects/hospital-alert-mvp/     # Project documentation
        ├── INDEX.md                     ✅ Project index
        ├── architecture/                # System architecture
        ├── modules/                     # Module docs
        ├── progress/                    # Progress tracking
        ├── tasks/                       # Task breakdown
        └── testing/                     # Test plans
```

## Implementation Status Legend
- ✅ Complete
- 🚧 To be implemented
- 📝 Documentation only
- 🔄 In progress

## Key Implementation Areas

### 1. Route Groups
- **(healthcare)/** - Healthcare-specific screens
- **(modals)/** - Modal dialogs
- **(home)/** - Dashboard screens

### 2. Component Structure
- **healthcare/** - Original healthcare components
- **app/blocks/healthcare/** - New modular blocks

### 3. API Structure
- **routers/** - tRPC routers
- **services/** - Business logic

### 4. Database
- **healthcare-schema.ts** - Healthcare tables
- **combined-schema.ts** - Full schema

## Development Workflow

### 1. Screen Development
1. Create screen in appropriate route group
2. Implement role-based access
3. Add to navigation layout
4. Test on all platforms

### 2. Block Development
1. Create block in app/blocks/healthcare/
2. Define TypeScript interface
3. Implement with animations
4. Export from index.ts

### 3. API Development
1. Update healthcare router
2. Add service logic
3. Update types
4. Test endpoints

## File Naming Conventions

### Screens
- `kebab-case.tsx` - e.g., alert-history.tsx
- Descriptive names indicating purpose

### Blocks
- `PascalCaseBlock.tsx` - e.g., AlertSummaryBlock.tsx
- Always suffix with "Block"

### Services
- `kebab-case.ts` - e.g., alert-subscriptions.ts
- Action-oriented names

## Import Paths

```typescript
// Screens
import AlertHistory from '@/app/(healthcare)/alert-history';

// Blocks
import { AlertSummaryBlock } from '@/components/app/blocks/healthcare';

// Components
import { AlertCreationForm } from '@/components/healthcare';

// Hooks
import { useAlertSubscription } from '@/hooks/healthcare';

// Types
import type { Alert, AlertAcknowledgment } from '@/types/healthcare';

// API
import { api } from '@/lib/api/trpc';
```

## Related Documentation

1. **[Hospital Alert PRD](./HOSPITAL_ALERT_PRD.md)** - Product requirements
2. **[Implementation Plan](./HOSPITAL_ALERT_IMPLEMENTATION_PLAN.md)** - Technical implementation
3. **[Acknowledgment Guide](./ALERT_ACKNOWLEDGMENT_GUIDE.md)** - Acknowledgment system
4. **[Master Task Manager](./docs/multi-agent/MASTER_TASK_MANAGER.md)** - Task tracking
5. **[Project Index](./docs/projects/hospital-alert-mvp/INDEX.md)** - Project documentation

## Next Steps

1. Create remaining healthcare screens (4 screens)
2. Create additional modal screens (3 modals)
3. Implement healthcare blocks (8 blocks)
4. Integrate real-time WebSocket updates
5. Add push notification support
6. Implement acknowledgment system
7. Create analytics dashboards
8. Complete testing suite

---

*This structure document serves as the source of truth for Hospital Alert System file organization*