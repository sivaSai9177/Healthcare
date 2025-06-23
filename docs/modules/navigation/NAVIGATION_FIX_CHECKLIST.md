# Navigation Fix Checklist

**Priority**: CRITICAL  
**Last Updated**: January 23, 2025  
**Assigned To**: All Developers  
**Deadline**: Before any feature development

## Pre-Fix Checklist

- [ ] Read NAVIGATION_ARCHITECTURE_GUIDE.md completely
- [ ] Review ROUTE_MAPPING.md for correct URLs
- [ ] Backup current branch
- [ ] Create new branch: `fix/navigation-architecture`

## Fix Implementation Steps

### Step 1: Fix EnhancedSidebar.tsx Navigation Items
**File**: `components/blocks/navigation/EnhancedSidebar.tsx`

- [ ] Line 142: Change `href: '/(app)/(tabs)/alerts'` → `href: '/alerts'`
- [ ] Line 149: Change `href: '/(app)/(tabs)/alerts/escalation-queue'` → `href: '/alerts/escalation-queue'`
- [ ] Line 157: Change `href: '/(app)/(tabs)/alerts/history'` → `href: '/alerts/history'`
- [ ] Line 165: Change `href: '/(app)/(tabs)/patients'` → `href: '/patients'`
- [ ] Line 177: Change `href: '/(app)/shifts/schedule'` → `href: '/shifts/schedule'`
- [ ] Line 183: Change `href: '/(app)/shifts/handover'` → `href: '/shifts/handover'`
- [ ] Line 189: Change `href: '/(app)/shifts/reports'` → `href: '/shifts/reports'`
- [ ] Line 202: Change `href: '/(app)/analytics/response-analytics'` → `href: '/analytics/response-analytics'`
- [ ] Line 209: Change `href: '/(app)/analytics/performance'` → `href: '/analytics/performance'`
- [ ] Line 216: Change `href: '/(app)/analytics/trends'` → `href: '/analytics/trends'`
- [ ] Line 228: Change `href: '/(app)/logs/activity-logs'` → `href: '/logs/activity-logs'`
- [ ] Line 234: Change `href: '/(app)/logs/audit'` → `href: '/logs/audit'`
- [ ] Line 242: Change `href: '/(app)/(tabs)/settings'` → `href: '/settings'`
- [ ] Line 62: Change `url: '/(app)/(tabs)/home'` → `url: '/home'`
- [ ] Line 66: Change `url: '/(app)/(tabs)/alerts'` → `url: '/alerts'`
- [ ] Line 71: Change `url: '/(app)/(tabs)/patients'` → `url: '/patients'`
- [ ] Line 77: Change `url: '/(app)/(tabs)/settings'` → `url: '/settings'`
- [ ] Line 300: Change `router.push('/(app)/(tabs)/home')` → `router.push('/home')`
- [ ] Line 304: Change `router.push('/(app)/(tabs)/alerts')` → `router.push('/alerts')`
- [ ] Line 308: Change `router.push('/(app)/(tabs)/patients')` → `router.push('/patients')`
- [ ] Line 312: Change `router.push('/(app)/(tabs)/settings')` → `router.push('/settings')`
- [ ] Line 588: Change `router.push('/(modals)/notification-center')` → `router.push('/notification-center')`
- [ ] Line 651: Change `router.push('/(modals)/create-alert')` → `router.push('/create-alert')`
- [ ] Line 706: Change `href: '/(app)/docs'` → `href: '/docs'`
- [ ] Line 714: Change `href: '/(app)/support'` → `href: '/support'`
- [ ] Line 758: Change `router.push('/(app)/(tabs)/settings')` → `router.push('/settings')`
- [ ] Add `href: '/alerts'` to alerts parent menu item (line ~130-136)

### Step 2: Fix Authentication Flow
**File**: `app/(app)/(tabs)/alerts/index.tsx`

- [ ] Add hospital context validation before API calls
- [ ] Add proper error handling for missing hospital assignment
- [ ] Update enabled flag: `enabled: !!user && !!hospitalId && canViewAlerts`

### Step 3: Fix Hospital Context Hook
**File**: `hooks/healthcare/useHospitalContext.ts`

- [ ] Add fallback to check healthcare_users table
- [ ] Add proper error messages for missing hospital
- [ ] Return proper loading state

### Step 4: Update Tab Layout URLs
**File**: `app/(app)/(tabs)/_layout.tsx`

- [ ] Verify all desktop sidebar items match route mapping
- [ ] Update any remaining `/(app)/(tabs)` prefixes

### Step 5: Create Route Validator
**File**: `lib/navigation/route-validator.ts`

```typescript
export const VALID_ROUTES = [
  '/',
  '/home',
  '/alerts',
  '/alerts/escalation-queue',
  '/alerts/history',
  '/patients',
  '/settings',
  '/settings/notifications',
  '/auth/login',
  '/auth/register',
  '/auth/complete-profile',
  '/create-alert',
  '/shifts/handover',
] as const;

export function isValidRoute(route: string): boolean {
  return VALID_ROUTES.includes(route as any) || 
         route.match(/^\/alerts\/[a-zA-Z0-9-]+$/) || 
         route.match(/^\/patients\/[a-zA-Z0-9-]+$/);
}
```

### Step 6: Add Navigation Logger
**File**: `lib/navigation/navigation-logger.ts`

```typescript
import { router } from 'expo-router';
import { logger } from '@/lib/core/debug/unified-logger';

export function initializeNavigationLogger() {
  const originalPush = router.push;
  const originalReplace = router.replace;
  
  router.push = (href: any) => {
    logger.navigation.log('push', { href, timestamp: new Date() });
    return originalPush(href);
  };
  
  router.replace = (href: any) => {
    logger.navigation.log('replace', { href, timestamp: new Date() });
    return originalReplace(href);
  };
}
```

### Step 7: Fix Alert Card Navigation
**Files**: Various alert list components

- [ ] Update `onAlertPress` to use: `router.push('/alerts/${alertId}')`
- [ ] Remove any `/(app)/(tabs)` prefixes

### Step 8: Update Navigation Debug Component
**File**: `components/blocks/debug/NavigationDebugger.tsx`

- [ ] Create component to show current route
- [ ] Add route validation display
- [ ] Show navigation history

## Testing Checklist

### Basic Navigation
- [ ] Start app → redirects to login if not authenticated
- [ ] Login → navigates to /home
- [ ] Click Alerts in sidebar → navigates to /alerts
- [ ] Click Active Alerts → stays on /alerts
- [ ] Click Escalation Queue → navigates to /alerts/escalation-queue
- [ ] Click Alert History → navigates to /alerts/history
- [ ] Click specific alert → navigates to /alerts/[id]
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
- [ ] Alerts screen loads without 401 errors
- [ ] Hospital context properly initialized
- [ ] API calls include proper authentication

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

## Post-Fix Checklist

- [ ] All navigation tests pass
- [ ] No console errors during navigation
- [ ] URLs are clean (no group prefixes)
- [ ] Deep linking works
- [ ] Performance is acceptable
- [ ] Documentation is updated
- [ ] Code review completed
- [ ] Merged to main branch

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