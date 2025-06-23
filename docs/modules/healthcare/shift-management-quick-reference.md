# Shift Management Quick Reference

## 🚀 Quick Start

### Basic Usage

```typescript
import { ShiftManagement } from '@/components/blocks/healthcare';

// In your component
<ShiftManagement onShiftChange={(isOnDuty) => console.log(isOnDuty)} />
```

### Navigate to Modal

```typescript
router.push('/(modals)/shift-management');
```

## 📋 API Endpoints

### Get Shift Status
```typescript
const { data } = api.healthcare.getShiftStatus.useQuery();
// Returns: { isOnDuty, canStartShift, canEndShift, activeAlertCount, ... }
```

### Toggle Shift
```typescript
const mutation = api.healthcare.toggleOnDuty.useMutation();

// Start shift
mutation.mutate({ isOnDuty: true });

// End shift with handover
mutation.mutate({ 
  isOnDuty: false, 
  handoverNotes: "All patients stable..." 
});
```

## ⚡ Key Features

### Validation Rules
- **Max Shift**: 24 hours
- **Min Break**: 8 hours between shifts
- **Handover**: Required if active alerts exist (min 10 chars)

### Status Indicators
- 🟢 **Green Pulse**: On duty
- 🔶 **Amber Warning**: > 20 hours on shift
- 🔴 **Red Alert**: Active alerts need handover
- ⏱️ **Countdown**: Time until can start next shift

## 🎨 UI Components

### Full Management
```typescript
<ShiftManagement 
  onShiftChange={(isOnDuty, duration) => {}}
  embedded={false} // With scroll wrapper
/>
```

### Compact Status
```typescript
<ShiftStatus onShiftToggle={() => {}} />
```

### Custom Modal Header
```typescript
headerTitle: () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <Text style={{ fontSize: 32 }}>⏰</Text>
    <Text style={{ fontSize: 19, fontWeight: '600' }}>
      Shift Management
    </Text>
  </View>
)
```

## 🔍 Common Queries

### Check Active Alerts
```typescript
const { data } = api.healthcare.getActiveAlerts.useQuery({
  hospitalId: hospitalContext.hospitalId
});
```

### Get On-Duty Staff
```typescript
const { data } = api.healthcare.getOnDutyStaff.useQuery({
  hospitalId: hospitalContext.hospitalId,
  department: 'emergency' // optional
});
```

## 🛠️ Troubleshooting

### Common Errors

| Error | Solution |
|-------|----------|
| "Hospital assignment required" | Ensure user has `defaultHospitalId` |
| "Already on duty" | Check for stale shift records |
| "Need X hours break" | Wait or check `shiftEndTime` in DB |
| "Handover notes required" | Active alerts exist, provide notes |

### Debug SQL
```sql
-- Check user shift status
SELECT * FROM healthcare_users WHERE user_id = 'USER_ID';

-- Find long shifts
SELECT * FROM healthcare_users 
WHERE is_on_duty = true 
AND shift_start_time < NOW() - INTERVAL '24 hours';
```

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px (max-width: 600px)

## 🎯 Best Practices

1. **Always check hospital context** before shift operations
2. **Use getShiftStatus** for comprehensive status (not getOnDutyStatus)
3. **Handle loading states** - shifts affect critical operations
4. **Show clear feedback** - users need confirmation of shift changes
5. **Test break validations** - ensure 8-hour rule works correctly

## 🔗 Related Modules

- [Alert Management](./alert-management.md)
- [Healthcare Permissions](./permissions.md)
- [Hospital Context](./hospital-context.md)
- [Audit Logging](./audit-logging.md)

---

*Quick Reference v1.0 | [Full Documentation](./shift-management.md)*