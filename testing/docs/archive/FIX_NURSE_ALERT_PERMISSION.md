# Fix: Nurse Alert Creation Permission Issue

## Problem
Nurses were unable to create alerts despite having the CREATE_ALERTS permission added to their role in the frontend permissions file (`lib/auth/permissions.ts`). The error message showed "Access denied. Required permission: create_alerts".

## Root Cause
The issue was that the backend TRPC context (`src/server/trpc.ts`) had its own hardcoded permission mappings that were not synchronized with the frontend permissions file. This created a mismatch where:
- Frontend showed nurses could create alerts (UI elements were visible)
- Backend rejected the requests (TRPC procedure denied access)

## Solution

### Immediate Fix
Added 'create_alerts' permission to nurse, doctor, and head_doctor roles in the TRPC context:
```typescript
nurse: ['create_alerts', 'acknowledge_alerts', 'view_alerts', 'view_tasks', 'view_patients', 'view_healthcare_data'],
doctor: ['create_alerts', 'view_patients', 'acknowledge_alerts', 'view_alerts', 'resolve_alerts', 'view_healthcare_data'],
head_doctor: ['create_alerts', 'view_patients', 'acknowledge_alerts', 'view_alerts', 'resolve_alerts', 'view_analytics', 'manage_users', 'manage_departments', 'view_healthcare_data'],
```

### Long-term Fix
Updated the TRPC context to use the centralized permission system instead of hardcoded permissions:
```typescript
hasPermission: (permission: string) => {
  const userRole = (ctx.session.user as any).role || 'user';
  // Import the centralized permission system
  const { hasPermission: checkPermission } = require('@/lib/auth/permissions');
  return checkPermission(userRole, permission);
},
```

## Benefits
1. **Single Source of Truth**: Permissions are now defined in one place (`lib/auth/permissions.ts`)
2. **Consistency**: Frontend and backend use the same permission definitions
3. **Maintainability**: Future permission changes only need to be made in one file
4. **Reduced Errors**: No more frontend/backend permission mismatches

## Testing
To verify the fix:
1. Log in as a nurse
2. Navigate to the healthcare dashboard
3. Click the floating alert button
4. Create an alert - it should now work successfully

## Prevention
To prevent similar issues:
1. Always use the centralized permission system
2. Never hardcode permissions in multiple places
3. Test both frontend visibility and backend access when adding new permissions