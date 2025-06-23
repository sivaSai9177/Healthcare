# Shift Management Migration Guide

## Overview

This guide covers the migration from the previous shift management implementation to the enhanced version with proper validations, handover procedures, and improved UI.

## Breaking Changes

### 1. Context Access Pattern

**Before:**
```typescript
// Direct access to userHospitalId
const userHospitalId = ctx.userHospitalId;
```

**After:**
```typescript
// Access through hospitalContext
const userHospitalId = ctx.hospitalContext?.userHospitalId;
```

### 2. Hospital Validation

**Before:**
```typescript
// Incorrect validation comparing organizationId with hospitalId
if (currentUser.organizationId !== currentUser.hospitalId) {
  throw new Error('Organization mismatch');
}
```

**After:**
```typescript
// Proper hospital context validation
if (currentUser.hospitalId !== ctx.hospitalContext.userHospitalId) {
  throw new Error('Hospital assignment mismatch');
}
```

### 3. Hardcoded Demo Hospital

**Before:**
```typescript
const hospitalId = ctx.hospitalContext?.userOrganizationId || 'f155b026-01bd-4212-94f3-e7aedef2801d';
```

**After:**
```typescript
const hospitalId = ctx.hospitalContext?.userHospitalId || (ctx.user as any).defaultHospitalId;
if (!hospitalId) {
  throw new Error('Hospital assignment required');
}
```

## New Features

### 1. Shift Validations

```typescript
// Constants
const MAX_SHIFT_DURATION_HOURS = 24;
const MIN_BREAK_BETWEEN_SHIFTS_HOURS = 8;

// Validation errors
- "You need at least 8 hours break between shifts"
- "You are already on duty"
- "Shift exceeded maximum 24 hours"
```

### 2. Handover Requirements

```typescript
// Active alerts check
if (activeAlertCount > 0 && !input.handoverNotes) {
  throw new Error(`There are ${activeAlertCount} active alerts. Please provide handover notes.`);
}
```

### 3. Enhanced Status Endpoint

```typescript
// New getShiftStatus endpoint
const { data } = api.healthcare.getShiftStatus.useQuery();

// Returns:
{
  isOnDuty: boolean;
  canStartShift: boolean;
  canEndShift: boolean;
  startShiftReason?: string;
  endShiftReason?: string;
  activeAlertCount: number;
  requiresHandover: boolean;
  hoursUntilCanStart?: number;
  maxShiftDurationHours: number;
  minBreakHours: number;
}
```

## Migration Steps

### 1. Update API Endpoints

Replace all instances of direct context access:

```bash
# Find all occurrences
grep -r "ctx\.userHospitalId" src/

# Replace with
ctx.hospitalContext?.userHospitalId
```

### 2. Update Frontend Components

**Old ShiftStatus usage:**
```typescript
<ShiftStatus onShiftToggle={handleToggle} />
```

**New ShiftManagement usage:**
```typescript
import { ShiftManagement } from '@/components/blocks/healthcare';

<ShiftManagement 
  onShiftChange={(isOnDuty, duration) => {
    // Handle change
  }}
/>
```

### 3. Update Modal Navigation

**Add to modal layout:**
```typescript
<Stack.Screen
  name="shift-management"
  options={{
    presentation: 'modal',
    headerTitleAlign: 'center',
    headerTitle: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 32 }}>⏰</Text>
        <Text style={{ fontSize: 19, fontWeight: '600' }}>
          Shift Management
        </Text>
      </View>
    ),
  }}
/>
```

**Navigate to modal:**
```typescript
router.push('/(modals)/shift-management');
```

### 4. Update Queries

**Replace getOnDutyStatus with getShiftStatus:**
```typescript
// Old
const { data } = api.healthcare.getOnDutyStatus.useQuery();

// New - provides more information
const { data } = api.healthcare.getShiftStatus.useQuery();
```

### 5. Handle Handover Requirements

```typescript
// Check if handover is required
if (shiftStatus?.requiresHandover) {
  // Show handover form
  // Collect notes (min 10 characters)
  // Submit with toggleOnDuty mutation
}
```

## Database Updates

No schema changes required, but ensure:

1. **Clean up stale shifts:**
```sql
-- Find shifts without end time but marked as off duty
UPDATE healthcare_users 
SET shift_end_time = shift_start_time + INTERVAL '8 hours'
WHERE is_on_duty = false 
AND shift_end_time IS NULL 
AND shift_start_time IS NOT NULL;
```

2. **Fix long-running shifts:**
```sql
-- End shifts running > 24 hours
UPDATE healthcare_users 
SET is_on_duty = false,
    shift_end_time = NOW()
WHERE is_on_duty = true 
AND shift_start_time < NOW() - INTERVAL '24 hours';
```

## Testing Checklist

- [ ] Start shift - verify success
- [ ] Try to start shift again - should fail
- [ ] End shift after 1 minute - verify success
- [ ] Try to start new shift immediately - should fail (8hr break)
- [ ] Create active alert
- [ ] Try to end shift without handover - should fail
- [ ] End shift with handover notes - verify success
- [ ] Check shift duration display updates every minute
- [ ] Verify hospital context validation
- [ ] Test responsive layout on mobile/tablet/desktop

## Rollback Plan

If issues arise:

1. **Revert API changes:**
   - Restore direct `ctx.userHospitalId` access
   - Remove validation rules
   - Remove active alert checks

2. **Revert UI:**
   - Use old ShiftStatus component
   - Remove modal integration
   - Disable handover form

3. **Database cleanup:**
   ```sql
   -- Reset all active shifts
   UPDATE healthcare_users 
   SET is_on_duty = false,
       shift_end_time = NOW()
   WHERE is_on_duty = true;
   ```

## Support

For issues or questions:
- Check logs: `logger.healthcare.*`
- Review [Troubleshooting Guide](./shift-management.md#troubleshooting)
- Contact: healthcare-team@example.com

---

*Migration Guide v1.0 | Last Updated: January 2025*