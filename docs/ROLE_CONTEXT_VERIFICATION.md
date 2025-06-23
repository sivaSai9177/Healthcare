# Role Context Verification

This document outlines the proper context that should be provided for each role when they login and access the dashboard.

## Context Components

### 1. **User Context**
- User ID
- Email
- Name
- Role
- Organization ID
- Default Hospital ID
- Profile completion status

### 2. **Hospital Context**
- Hospital ID (from user.defaultHospitalId or hospital store)
- Hospital Name
- Organization ID
- Can access healthcare features
- Has valid hospital assignment

### 3. **Permission Context**
Based on role permissions defined in `/lib/auth/permissions.ts`:

## Role-Specific Contexts

### **OPERATOR Role**
```typescript
{
  user: {
    role: 'operator',
    organizationId: string,
    defaultHospitalId: string
  },
  permissions: {
    canCreateAlerts: true,
    canViewAlerts: true,
    canAcknowledgeAlerts: false,  // Cannot acknowledge
    canResolveAlerts: false,       // Cannot resolve
    canStartShift: true,
    canEndShift: true,
    canViewShiftStatus: true,
    canManageShifts: false,
    canViewAnalytics: false,
    canManageTeam: false
  },
  hospitalContext: {
    hospitalId: string,
    canAccessHealthcare: true
  }
}
```

### **NURSE Role**
```typescript
{
  user: {
    role: 'nurse',
    organizationId: string,
    defaultHospitalId: string
  },
  permissions: {
    canCreateAlerts: true,
    canViewAlerts: true,
    canAcknowledgeAlerts: true,   // Can acknowledge
    canResolveAlerts: false,       // Cannot resolve
    canStartShift: true,
    canEndShift: true,
    canViewShiftStatus: true,
    canManageShifts: false,
    canViewAnalytics: false,
    canManageTeam: false
  },
  hospitalContext: {
    hospitalId: string,
    canAccessHealthcare: true
  }
}
```

### **DOCTOR Role**
```typescript
{
  user: {
    role: 'doctor',
    organizationId: string,
    defaultHospitalId: string
  },
  permissions: {
    canCreateAlerts: true,
    canViewAlerts: true,
    canAcknowledgeAlerts: true,
    canResolveAlerts: true,        // Can resolve
    canStartShift: true,
    canEndShift: true,
    canViewShiftStatus: true,
    canManageShifts: false,
    canViewAnalytics: false,
    canManageTeam: false
  },
  hospitalContext: {
    hospitalId: string,
    canAccessHealthcare: true
  }
}
```

### **HEAD_DOCTOR Role**
```typescript
{
  user: {
    role: 'head_doctor',
    organizationId: string,
    defaultHospitalId: string
  },
  permissions: {
    canCreateAlerts: true,
    canViewAlerts: true,
    canAcknowledgeAlerts: true,
    canResolveAlerts: true,
    canEscalateAlerts: true,       // Can escalate
    canStartShift: true,
    canEndShift: true,
    canViewShiftStatus: true,
    canManageShifts: true,         // Can manage shifts
    canViewAnalytics: true,        // Can view analytics
    canManageTeam: true,           // Can manage team
    canViewReports: true,
    canCreateReports: true
  },
  hospitalContext: {
    hospitalId: string,
    canAccessHealthcare: true
  }
}
```

## Context Validation Points

### 1. **Frontend (React/React Native)**
- `useHospitalContext()` hook validates hospital assignment
- `useHealthcareAccess()` hook checks permissions
- `HospitalProvider` manages hospital state
- Dashboard components conditionally render based on permissions

### 2. **Backend (tRPC)**
- `authMiddleware` validates authentication
- Hospital context injected into `ctx.hospitalContext`
- Permission-based procedures:
  - `healthcareProcedure` - requires healthcare role
  - `doctorProcedure` - requires doctor permissions
  - `shiftManagementProcedure` - requires shift permissions
  - `viewShiftStatusProcedure` - requires view shift status permission

### 3. **Database**
- User's `defaultHospitalId` stored in users table
- Healthcare-specific data in `healthcare_users` table
- Hospital assignment validated on API calls

## Testing Context

Run the verification script to test all roles:
```bash
bun run scripts/test/verify-role-contexts.ts
```

This will:
1. Login with each role
2. Verify user profile data
3. Check hospital context
4. Test permission-based API access
5. Log comprehensive results

## Common Issues & Solutions

### Issue: "No hospital context"
**Solution**: Ensure user has `defaultHospitalId` set or hospital selected in store

### Issue: "Permission denied"
**Solution**: Check role has required permission in `/lib/auth/permissions.ts`

### Issue: "Hospital mismatch"
**Solution**: Verify user's hospital matches the requested resource's hospital

## Monitoring

Enable Healthcare Logging in Debug Console to monitor:
- Hospital context resolution
- Permission checks
- API access attempts
- Context validation errors