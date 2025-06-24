# Navigation Fix Checklist

**Priority**: CRITICAL  
**Last Updated**: January 23, 2025  
**Current Status**: All Implementation Steps (1-8) Completed ✅  
**Assigned To**: All Developers  
**Deadline**: Before any feature development

## Pre-Fix Checklist

- [x] Read NAVIGATION_ARCHITECTURE_GUIDE.md completely
- [x] Review ROUTE_MAPPING.md for correct URLs
- [x] Backup current branch
- [x] Create new branch: `fix/navigation-architecture`

## Fix Implementation Steps

### Step 1: Fix EnhancedSidebar.tsx Navigation Items ✅ COMPLETED
**File**: `components/blocks/navigation/EnhancedSidebar.tsx`

- [x] Line 126: Change `href: '/(app)/(tabs)/home'` → `href: '/home'`
- [x] Line 142: Change `href: '/(app)/(tabs)/alerts'` → `href: '/alerts'`
- [x] Line 149: Change `href: '/(app)/(tabs)/alerts/escalation-queue'` → `href: '/alerts/escalation-queue'`
- [x] Line 157: Change `href: '/(app)/(tabs)/alerts/history'` → `href: '/alerts/history'`
- [x] Line 165: Change `href: '/(app)/(tabs)/patients'` → `href: '/patients'`
- [x] Line 177: Change `href: '/(app)/shifts/schedule'` → `href: '/shifts/schedule'`
- [x] Line 183: Change `href: '/(app)/shifts/handover'` → `href: '/shifts/handover'`
- [x] Line 189: Change `href: '/(app)/shifts/reports'` → `href: '/shifts/reports'`
- [x] Line 202: Change `href: '/(app)/analytics/response-analytics'` → `href: '/analytics/response-analytics'`
- [x] Line 209: Change `href: '/(app)/analytics/performance'` → `href: '/analytics/performance'`
- [x] Line 216: Change `href: '/(app)/analytics/trends'` → `href: '/analytics/trends'`
- [x] Line 228: Change `href: '/(app)/logs/activity-logs'` → `href: '/logs/activity-logs'`
- [x] Line 234: Change `href: '/(app)/logs/audit'` → `href: '/logs/audit'`
- [x] Line 242: Change `href: '/(app)/(tabs)/settings'` → `href: '/settings'`
- [x] Line 300: Change `router.push('/(app)/(tabs)/home')` → `router.push('/home')`
- [x] Line 304: Change `router.push('/(app)/(tabs)/alerts')` → `router.push('/alerts')`
- [x] Line 308: Change `router.push('/(app)/(tabs)/patients')` → `router.push('/patients')`
- [x] Line 312: Change `router.push('/(app)/(tabs)/settings')` → `router.push('/settings')`
- [x] Line 588: Change `router.push('/(modals)/notification-center')` → `router.push('/notification-center')`
- [x] Line 651: Change `router.push('/(modals)/create-alert')` → `router.push('/create-alert')`
- [x] Line 706: Change `href: '/(app)/docs'` → `href: '/docs'`
- [x] Line 714: Change `href: '/(app)/support'` → `href: '/support'`
- [x] Line 758: Change `router.push('/(app)/(tabs)/settings')` → `router.push('/settings')`
- [x] Add `href: '/alerts'` to alerts parent menu item (line ~133)

### Step 2: Fix Authentication Flow ✅ COMPLETED
**File**: `app/(app)/(tabs)/alerts/index.tsx`

- [x] Add hospital context validation before API calls
- [x] Add proper error handling for missing hospital assignment
- [x] Update enabled flag: `enabled: !!user && !!hospitalId && canViewAlerts`

### Step 3: Fix Hospital Context Hook ✅ COMPLETED
**File**: `hooks/healthcare/useHospitalContext.ts`

- [x] Add fallback to check healthcare_users table
- [x] Add proper error messages for missing hospital
- [x] Return proper loading state

### Step 4: Update Tab Layout URLs ✅ COMPLETED
**File**: `app/(app)/(tabs)/_layout.tsx`

- [x] Verify all desktop sidebar items match route mapping
- [x] Update any remaining `/(app)/(tabs)` prefixes
- [x] Fixed sidebarItems array (lines 55-80)

### Step 5: Create Route Validator ✅ COMPLETED
**File**: `lib/navigation/route-validator.ts`

- [x] Created comprehensive route validator with all valid routes
- [x] Added dynamic route validation for alerts/[id] and patients/[id]
- [x] Added helper functions for route validation and access control
- [x] Added breadcrumb generation functionality

### Step 6: Add Navigation Logger ✅ COMPLETED
**File**: `lib/navigation/navigation-logger.ts`

- [x] Created comprehensive navigation logger that wraps router methods
- [x] Added navigation history tracking with max size limit
- [x] Added route validation integration
- [x] Added navigation statistics and analytics
- [x] Integrated with app startup in _layout.tsx

### Step 7: Fix Alert Card Navigation ✅ COMPLETED
**Files**: Various alert list components

- [x] Update `onAlertPress` to use: `router.push('/alerts/${alertId}')`
- [x] Remove any `/(app)/(tabs)` prefixes
- [x] Fixed AlertItem.tsx navigation from `/alert-details?id=` to `/alerts/${id}`
- [x] Updated routes.ts alertDetails helper function

### Step 8: Update Navigation Debug Component ✅ COMPLETED
**File**: `components/blocks/debug/NavigationDebugger.tsx`

- [x] Created comprehensive NavigationDebugger component
- [x] Shows current route with validation status
- [x] Displays navigation history with invalid route warnings
- [x] Shows navigation statistics
- [x] Provides quick navigation to all valid routes
- [x] Added to root layout for development debugging

## Testing Checklist

### Basic Navigation
- [x] Start app → redirects to login if not authenticated
- [ ] Login → navigates to /home
- [x] Click Alerts in sidebar → navigates to /alerts
- [x] Click Active Alerts → stays on /alerts
- [x] Click Escalation Queue → navigates to /alerts/escalation-queue
- [ ] Click Alert History → navigates to /alerts/history
- [x] Click specific alert → navigates to /alerts/[id]
- [ ] Back button works correctly

### Authentication Flow
- [ ] Unauthenticated access to /alerts → redirects to /auth/login
- [ ] Login with incomplete profile → redirects to /auth/complete-profile
- [ ] Complete profile → redirects to /home
- [ ] Logout → clears stack and goes to /auth/login

### Platform-Specific
- [ ] Web: URL bar shows correct route
- [ ] Web: Browser back/forward works
- [ ] Web: Direct URL access works
- [ ] Mobile: Tab navigation works
- [ ] Mobile: Gestures work
- [ ] Android: Hardware back button works

### API Integration
- [x] Alerts screen loads without 401 errors
- [x] Hospital context properly initialized
- [x] API calls include proper authentication

### Error Handling
- [ ] Invalid routes show 404 page
- [ ] Network errors handled gracefully
- [ ] Missing permissions show appropriate message

## Verification Commands

```bash
# Search for old navigation patterns
grep -r "/(app)/(tabs)" --include="*.tsx" --include="*.ts"
grep -r "/(app)/" --include="*.tsx" --include="*.ts"

# Verify all navigation calls
grep -r "router.push" --include="*.tsx" --include="*.ts"
grep -r "router.replace" --include="*.tsx" --include="*.ts"
grep -r "<Link href=" --include="*.tsx"
```

## Quick Fix Commands

To fix remaining navigation patterns in bulk:

```bash
# Fix all (app)/(tabs) patterns
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak 's|/(app)/(tabs)/|/|g'

# Fix remaining (app) patterns
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak 's|/(app)/|/|g'

# Fix (modals) patterns
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak 's|/(modals)/|/|g'

# Clean up backup files
find . -name "*.bak" -delete
```

**Note**: Review changes carefully after running these commands!

## Post-Fix Checklist

- [ ] All navigation tests pass
- [ ] No console errors during navigation
- [x] URLs are clean (no group prefixes) - Step 1 complete
- [ ] Deep linking works
- [ ] Performance is acceptable
- [x] Documentation is updated
- [ ] Code review completed
- [ ] Merged to main branch

## Completed Items Summary

### ✅ Completed (January 23, 2025)
1. Created all navigation documentation (NAVIGATION_ARCHITECTURE_GUIDE.md, ROUTE_MAPPING.md, NAVIGATION_FIX_CHECKLIST.md)
2. Fixed all navigation URLs in EnhancedSidebar.tsx (Step 1)
3. Fixed tab layout URLs in _layout.tsx (Step 4)
4. Created new branch and committed changes
5. Ran bulk navigation pattern fixes across entire codebase
6. Fixed authentication flow with proper hospital context validation (Step 2)
7. Verified hospital context hook has proper fallbacks (Step 3)
8. Created comprehensive route validator with all valid routes (Step 5)
9. Implemented navigation logger with history tracking (Step 6)
10. Fixed alert card navigation to use `/alerts/${id}` pattern (Step 7)
11. Created and integrated NavigationDebugger component (Step 8)

### ⏳ Still Pending
1. Complete all testing
2. Verify all navigation paths work correctly
3. Run final verification commands

### 🚨 Additional Files Requiring Navigation Fixes

Found additional files with old navigation patterns that need updating:

#### Files with `/(app)/(tabs)` patterns:
- `app/index.tsx` - Line with redirect to home
- `app/(app)/organization/settings.tsx` - Button to go back
- `app/(app)/(tabs)/settings/index.tsx` - Navigation to members and notifications
- `app/(app)/(tabs)/settings/members.tsx` - Back navigation and invitations
- `app/(app)/(tabs)/patients.tsx` - Multiple home navigation buttons
- `app/(app)/(tabs)/home.tsx` - Settings navigation
- `app/(app)/(tabs)/alerts/index.tsx` - Redirect and alert details navigation
- `app/(app)/(tabs)/alerts/escalation-queue.tsx` - Back to alerts navigation
- `app/(app)/(tabs)/alerts/history.tsx` - Back to alerts navigation
- `app/auth-callback.tsx` - Post-auth redirect
- `app/(modals)/create-alert.tsx` - After create navigation

#### Files with `/(app)/` patterns:
- `app/(app)/organization/dashboard.tsx` - Organization settings navigation
- `components/blocks/organization/OrganizationJoinFlow.tsx` - Organization flows
- `components/blocks/organization/OrganizationSwitcher.tsx` - Organization navigation
- `components/blocks/healthcare/ShiftStatus.tsx` - Shift handover navigation

## Rollback Plan

If issues arise:
1. `git checkout main`
2. `git branch -D fix/navigation-architecture`
3. Notify team of issues found
4. Create new plan to address problems

## Success Criteria

- Zero navigation-related errors in console
- All routes accessible via sidebar/tabs
- Authentication flow works seamlessly
- URLs match expected patterns
- All platforms tested successfully

---

**Remember**: Navigation is critical to user experience. Test thoroughly before marking complete!