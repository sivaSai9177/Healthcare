# Shift Management Module

## Overview

The Shift Management module is a comprehensive system for healthcare staff to manage their work shifts, ensuring proper handover procedures and maintaining continuity of care. This module integrates seamlessly with the alert system to enforce handover requirements when active alerts exist.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Components](#components)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Business Logic](#business-logic)
7. [UI/UX Guidelines](#uiux-guidelines)
8. [Integration Guide](#integration-guide)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

## Features

### Core Functionality
- **Shift Toggle**: Start and end shifts with a single action
- **Duration Tracking**: Real-time tracking of shift duration
- **Validation Rules**: Enforced maximum shift duration and minimum break periods
- **Handover Management**: Required handover notes when active alerts exist
- **Hospital Context**: Shifts are scoped to specific hospitals
- **Audit Trail**: Complete logging of all shift activities

### User Experience
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Real-time Updates**: Live shift status with minute-by-minute duration updates
- **Visual Feedback**: Animated status indicators and haptic feedback
- **Smart Validations**: Clear error messages explaining why actions are blocked
- **Success Animations**: Celebratory feedback on shift start/end

## Architecture

### Component Structure
```
components/blocks/healthcare/
├── ShiftManagement.tsx       # Main shift management UI component
├── ShiftStatus.tsx           # Compact shift status display
└── index.ts                  # Module exports

app/(modals)/
├── shift-management.tsx      # Modal wrapper for shift management
└── _layout.tsx              # Modal layout configuration

src/server/routers/
└── healthcare.ts            # API endpoints for shift operations
```

### Data Flow
1. **Frontend Components** → Query shift status via tRPC
2. **API Layer** → Validate permissions and hospital context
3. **Database** → Store shift data and handover information
4. **Real-time Updates** → Refresh UI based on polling intervals

## Components

### ShiftManagement Component

The main UI component for comprehensive shift management.

```typescript
import { ShiftManagement } from '@/components/blocks/healthcare';

// Basic usage
<ShiftManagement 
  onShiftChange={(isOnDuty) => console.log('Shift status:', isOnDuty)}
  embedded={false}
/>
```

#### Props
- `onShiftChange?: (isOnDuty: boolean, duration?: number) => void` - Callback when shift status changes
- `embedded?: boolean` - Whether to render without scroll wrapper (default: false)

#### Features
- **ShiftStatusCard**: Displays current shift status with animations
- **HandoverForm**: Collects handover notes when ending shift with active alerts
- **ShiftStats**: Shows on-duty staff count and active alerts
- **Validation Messages**: Displays why shift actions might be blocked

### ShiftStatus Component

A compact component for displaying shift status in navigation or headers.

```typescript
import { ShiftStatus } from '@/components/blocks/healthcare';

// Usage in navigation
<ShiftStatus onShiftToggle={() => refetch()} />
```

#### Features
- Minimal UI footprint
- Quick access to shift management modal
- Real-time duration display
- Visual status indicator

### Modal Integration

The shift management modal provides a full-screen experience for managing shifts.

```typescript
// Navigate to shift management
router.push('/(modals)/shift-management');
```

## API Endpoints

### getShiftStatus

Get comprehensive shift status with validation information.

```typescript
const { data } = api.healthcare.getShiftStatus.useQuery();

// Response
{
  isOnDuty: boolean;
  shiftStartTime?: Date;
  shiftEndTime?: Date;
  canStartShift: boolean;
  canEndShift: boolean;
  startShiftReason?: string;
  endShiftReason?: string;
  shiftDurationHours?: number;
  hoursUntilCanStart?: number;
  activeAlertCount: number;
  requiresHandover: boolean;
  maxShiftDurationHours: number;
  minBreakHours: number;
}
```

### toggleOnDuty

Start or end a shift with optional handover notes.

```typescript
const mutation = api.healthcare.toggleOnDuty.useMutation();

// Start shift
mutation.mutate({ isOnDuty: true });

// End shift with handover
mutation.mutate({ 
  isOnDuty: false, 
  handoverNotes: "Patient in room 302 requires monitoring..." 
});
```

#### Validation Rules
- Cannot start shift if already on duty
- Minimum 8-hour break between shifts
- Maximum 24-hour shift duration
- Handover notes required if active alerts exist

### getOnDutyStatus

Get basic duty status (legacy endpoint, prefer getShiftStatus).

```typescript
const { data } = api.healthcare.getOnDutyStatus.useQuery();
```

### getOnDutyStaff

Get list of staff currently on duty.

```typescript
const { data } = api.healthcare.getOnDutyStaff.useQuery({
  hospitalId: 'hospital-uuid',
  department: 'emergency' // optional
});
```

## Database Schema

### healthcareUsers Table

Extended user information for healthcare staff.

```sql
healthcareUsers {
  userId: text (PK, FK -> users.id)
  hospitalId: varchar(255)
  isOnDuty: boolean (default: false)
  shiftStartTime: timestamp
  shiftEndTime: timestamp
  -- other fields...
}
```

### shiftLogs Table

Historical record of all shifts.

```sql
shiftLogs {
  id: uuid (PK)
  userId: text (FK -> users.id)
  hospitalId: uuid (FK -> hospitals.id)
  shiftStart: timestamp
  shiftEnd: timestamp
  durationMinutes: integer
  status: varchar(20) -- 'active', 'completed', 'cancelled'
  handoverId: uuid
  createdAt: timestamp
}
```

### shiftHandovers Table

Detailed handover information between shifts.

```sql
shiftHandovers {
  id: uuid (PK)
  fromUserId: text (FK -> users.id)
  toUserId: text (FK -> users.id, nullable)
  hospitalId: uuid (FK -> hospitals.id)
  shiftLogId: uuid (FK -> shiftLogs.id)
  handoverNotes: text
  criticalAlerts: jsonb (default: '[]')
  followUpRequired: jsonb (default: '[]')
  status: varchar(20) -- 'pending', 'accepted', 'declined', 'expired'
  createdAt: timestamp
  acceptedAt: timestamp
  acknowledgmentNotes: text
}
```

### healthcareAuditLogs Table

Audit trail for all shift activities.

```sql
-- Shift-related audit log entries
{
  action: 'shift_started' | 'shift_ended'
  metadata: {
    shiftStartTime: timestamp
    shiftEndTime: timestamp
    handoverNotes?: string
    duration?: number (minutes)
    durationHours?: number
  }
}
```

## Business Logic

### Shift Validation Rules

1. **Maximum Shift Duration**: 24 hours
   - Warning displayed after 20 hours
   - Shift can still be ended after 24 hours with a warning

2. **Minimum Break Between Shifts**: 8 hours
   - Enforced when starting a new shift
   - Shows hours remaining until eligible

3. **Handover Requirements**:
   - Required when active alerts exist in the hospital
   - Minimum 10 characters for handover notes
   - Notes stored in audit log

4. **Hospital Context**:
   - Shifts are scoped to specific hospitals
   - User must have valid hospital assignment
   - Hospital context validated on every operation

### Permission Requirements

- **Healthcare Roles**: doctor, nurse, operator, head_doctor
- **Hospital Assignment**: Required for all shift operations
- **No Special Permissions**: Any healthcare staff can manage their own shifts

### State Management

```typescript
// Shift states
type ShiftState = 
  | { isOnDuty: false; canStart: boolean; reason?: string }
  | { isOnDuty: true; duration: number; canEnd: boolean };

// Validation states
type ValidationState = {
  requiresHandover: boolean;
  activeAlertCount: number;
  hoursUntilCanStart?: number;
  exceedsMaxDuration: boolean;
};
```

## UI/UX Guidelines

### Visual Design

1. **Status Indicators**:
   - Green pulse animation for active shifts
   - Gray/muted for off-duty status
   - Clock icon as primary visual element

2. **Color Coding**:
   - Success (green): Active shift
   - Warning (amber): Approaching max duration
   - Destructive (red): Active alerts requiring handover
   - Muted: Off-duty or disabled states

3. **Responsive Breakpoints**:
   - Mobile: < 768px - Single column, compact spacing
   - Tablet: 768px - 1024px - Wider cards, medium spacing
   - Desktop: > 1024px - Maximum 600px width, large spacing

### Interaction Patterns

1. **Starting Shift**:
   - Single tap/click to start
   - Immediate visual feedback (haptic + animation)
   - Success animation with auto-dismiss

2. **Ending Shift**:
   - Check for active alerts
   - If alerts exist, show handover form
   - Validate handover notes before submission
   - Success animation with duration summary

3. **Error Handling**:
   - Clear error messages explaining restrictions
   - Visual indicators for disabled states
   - Countdown timers for time-based restrictions

### Accessibility

- High contrast between text and backgrounds
- Clear focus states for keyboard navigation
- Descriptive button labels
- ARIA labels for screen readers
- Minimum touch target size: 44x44px

## Integration Guide

### Basic Integration

```typescript
// In your healthcare dashboard
import { ShiftManagement } from '@/components/blocks/healthcare';

export function HealthcareDashboard() {
  return (
    <VStack gap={4}>
      <ShiftManagement 
        onShiftChange={(isOnDuty) => {
          // Handle shift change
          refetchDashboardData();
        }}
      />
      {/* Other dashboard components */}
    </VStack>
  );
}
```

### Modal Integration

```typescript
// Add shift management button
<Button onPress={() => router.push('/(modals)/shift-management')}>
  Manage Shift
</Button>
```

### With Navigation

```typescript
// In your navigation sidebar
import { ShiftStatus } from '@/components/blocks/healthcare';

<NavigationSidebar>
  <ShiftStatus />
  {/* Other navigation items */}
</NavigationSidebar>
```

### Custom Styling

```typescript
// Override default styles
<ShiftManagement
  embedded={true}
  style={{
    maxWidth: 400,
    padding: customSpacing,
  }}
/>
```

## Testing

### Unit Tests

```typescript
// Test shift validation logic
describe('Shift Validations', () => {
  it('should prevent starting shift without minimum break', async () => {
    const { result } = renderHook(() => 
      api.healthcare.toggleOnDuty.useMutation()
    );
    
    // End current shift
    await act(async () => {
      await result.current.mutateAsync({ isOnDuty: false });
    });
    
    // Try to start immediately
    await expect(
      result.current.mutateAsync({ isOnDuty: true })
    ).rejects.toThrow(/8 hours break/);
  });
});
```

### Integration Tests

```typescript
// Test complete shift flow
describe('Shift Management Flow', () => {
  it('should require handover when alerts exist', async () => {
    // Create active alert
    await createTestAlert();
    
    // Try to end shift without handover
    const { getByText } = render(<ShiftManagement />);
    fireEvent.press(getByText('End Shift'));
    
    // Should show handover form
    expect(getByText(/active alerts/i)).toBeTruthy();
    expect(getByText(/handover notes/i)).toBeTruthy();
  });
});
```

### E2E Tests

```typescript
// Test full user journey
test('Healthcare staff shift workflow', async () => {
  // Login as nurse
  await loginAs('nurse@hospital.com');
  
  // Start shift
  await element(by.text('Start Shift')).tap();
  await expect(element(by.text('On Duty'))).toBeVisible();
  
  // Wait for duration update
  await waitFor(element(by.text(/Duration: \d+h/)))
    .toBeVisible()
    .withTimeout(65000);
  
  // End shift
  await element(by.text('End Shift')).tap();
  await element(by.id('handover-notes')).typeText('All patients stable');
  await element(by.text('Submit')).tap();
  
  // Verify success
  await expect(element(by.text('Shift Ended!'))).toBeVisible();
});
```

## Troubleshooting

### Common Issues

1. **"Hospital assignment required" error**
   - Ensure user has `defaultHospitalId` or selected hospital
   - Check `hospitalContext` is properly initialized
   - Verify user profile completion

2. **"You are already on duty" error**
   - Check database for stale shift records
   - Ensure `shiftEndTime` is set when ending shifts
   - Clear browser/app cache

3. **Handover form not showing**
   - Verify active alerts query is working
   - Check hospital ID matches between alerts and user
   - Ensure proper permissions for viewing alerts

4. **Shift duration not updating**
   - Check refetch interval (should be 60000ms)
   - Verify date parsing for `shiftStartTime`
   - Ensure component stays mounted

### Debug Queries

```sql
-- Check user's current shift status
SELECT 
  hu.user_id,
  hu.is_on_duty,
  hu.shift_start_time,
  hu.shift_end_time,
  u.email,
  h.name as hospital_name
FROM healthcare_users hu
JOIN users u ON hu.user_id = u.id
JOIN hospitals h ON hu.hospital_id = h.id
WHERE u.email = 'user@example.com';

-- Find stuck shifts (on duty > 24 hours)
SELECT 
  user_id,
  shift_start_time,
  EXTRACT(EPOCH FROM (NOW() - shift_start_time))/3600 as hours_on_duty
FROM healthcare_users
WHERE is_on_duty = true
  AND shift_start_time < NOW() - INTERVAL '24 hours';

-- Active alerts by hospital
SELECT 
  h.name as hospital_name,
  COUNT(*) as active_alerts
FROM alerts a
JOIN hospitals h ON a.hospital_id = h.id
WHERE a.status = 'active'
GROUP BY h.name;
```

### Logging

Enable debug logging for shift operations:

```typescript
// In your app initialization
import { logger } from '@/lib/core/debug/unified-logger';

logger.setLevel('healthcare', 'debug');
```

Key log points:
- `ShiftStatus component mounted` - Component initialization
- `Shift toggle requested` - User action
- `Shift toggled successfully` - Successful operation
- `Failed to toggle shift` - Error details

---

## Future Enhancements

1. **Shift Scheduling**: Implement the `shiftSchedules` table for advance planning
2. **Shift Swapping**: Allow staff to request shift swaps
3. **Break Tracking**: Monitor breaks during shifts
4. **Overtime Alerts**: Notify managers of excessive shift durations
5. **Shift Reports**: Analytics on shift patterns and coverage
6. **Mobile Notifications**: Push notifications for shift reminders
7. **Biometric Clock-in**: Fingerprint/Face ID for shift start
8. **Location Verification**: Ensure staff are on-site when starting shift

---

*Last Updated: January 2025*
*Module Version: 1.0.0*