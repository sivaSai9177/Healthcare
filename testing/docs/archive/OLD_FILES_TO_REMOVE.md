# Old Files and Folders to Remove

## Folders to Remove (After Testing)

### 1. Old Auth Routes
- `/app/(auth)` - Replaced by `/app/(public)/auth`
  - login.tsx
  - register.tsx
  - forgot-password.tsx
  - verify-email.tsx
  - complete-profile.tsx
  - _layout.tsx

### 2. Old Role-Based Folders
- `/app/(healthcare)` - Replaced by feature-based organization
  - dashboard.tsx → `/app/(app)/(tabs)/home.tsx` (renders healthcare dashboard)
  - alerts.tsx → `/app/(app)/(tabs)/alerts.tsx`
  - patients.tsx → `/app/(app)/(tabs)/patients.tsx`
  - Other healthcare screens → `/app/(app)/alerts/`, `/app/(app)/shifts/`

- `/app/(home)` - Replaced by `/app/(app)/(tabs)`
  - index.tsx → `/app/(app)/(tabs)/home.tsx`
  - operator-dashboard.tsx → `/app/(app)/(tabs)/home/operator-dashboard.tsx`
  - admin.tsx → `/app/(app)/(tabs)/home/admin-dashboard.tsx`
  - manager.tsx → `/app/(app)/(tabs)/home/manager-dashboard.tsx`
  - settings.tsx → `/app/(app)/(tabs)/settings.tsx`

- `/app/(organization)` - Replaced by `/app/(app)/organization`
  - dashboard.tsx → `/app/(app)/organization/dashboard.tsx`
  - Organization settings now in `/app/(app)/organization/settings.tsx`

- `/app/(admin)` - Replaced by `/app/(app)/admin`
  - audit.tsx → `/app/(app)/admin/audit.tsx`
  - system.tsx → `/app/(app)/admin/system.tsx`

- `/app/(manager)` - No longer needed (manager features in tabs)

### 3. Redirect-Only Files
These files only contain redirects and can be removed:
- `/app/(home)/healthcare.tsx`
- `/app/(home)/operator.tsx`
- Various other redirect files

## Migration Verification Checklist

Before removing old files:

1. [ ] Test authentication flow:
   - Login
   - Register
   - Forgot password
   - Email verification
   - Profile completion

2. [ ] Test role-based navigation:
   - Operator dashboard
   - Healthcare dashboard (doctor, nurse, head_doctor)
   - Admin dashboard
   - Manager dashboard
   - Regular user dashboard

3. [ ] Test feature screens:
   - Alert management
   - Patient management
   - Shift handover
   - Organization settings
   - Admin screens (audit, system, users, organizations)
   - Profile and security settings

4. [ ] Test modal screens:
   - Create alert
   - Escalation details
   - Other modals

5. [ ] Verify all navigation paths work correctly

## Important Notes

- Keep backup of old structure before removing
- Test thoroughly on all platforms (iOS, Android, Web)
- Update any remaining imports that reference old paths
- Ensure all blocks are properly imported in new locations