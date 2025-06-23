# Navigation Architecture Guide

**Version**: 1.0.0  
**Last Updated**: January 23, 2025  
**Priority**: CRITICAL - Must be completed before any feature development

## Table of Contents
1. [Overview](#overview)
2. [Route Structure](#route-structure)
3. [Navigation Patterns](#navigation-patterns)
4. [Authentication Flow](#authentication-flow)
5. [Platform-Specific Considerations](#platform-specific-considerations)
6. [Common Issues and Solutions](#common-issues-and-solutions)
7. [Testing Checklist](#testing-checklist)
8. [Implementation Guide](#implementation-guide)

## Overview

This guide documents the complete navigation architecture for the Healthcare Alert System using Expo Router. It serves as the single source of truth for all navigation-related decisions and implementations.

### Key Principles
- **URL-First**: Every screen has a meaningful URL
- **Platform Agnostic**: Works seamlessly on web, iOS, and Android
- **Type-Safe**: All routes are typed and validated
- **Deep Linkable**: Any screen can be accessed directly via URL
- **Progressive Enhancement**: Enhanced navigation on capable devices

## Route Structure

### File System to URL Mapping

```
app/
├── (app)/                    # Authenticated routes group
│   ├── (tabs)/              # Tab navigation group
│   │   ├── _layout.tsx      # Tab layout controller
│   │   ├── home.tsx         # URL: /home
│   │   ├── alerts/          
│   │   │   ├── _layout.tsx  # Alerts stack navigator
│   │   │   ├── index.tsx    # URL: /alerts
│   │   │   ├── [id].tsx     # URL: /alerts/[id]
│   │   │   ├── escalation-queue.tsx  # URL: /alerts/escalation-queue
│   │   │   └── history.tsx  # URL: /alerts/history
│   │   ├── patients.tsx     # URL: /patients
│   │   └── settings/
│   │       ├── _layout.tsx  # Settings stack navigator
│   │       ├── index.tsx    # URL: /settings
│   │       └── notifications.tsx # URL: /settings/notifications
│   ├── patients/
│   │   └── [id].tsx         # URL: /patients/[id]
│   └── shifts/
│       └── handover.tsx     # URL: /shifts/handover
├── (public)/                # Public routes group
│   └── auth/
│       ├── login.tsx        # URL: /auth/login
│       ├── register.tsx     # URL: /auth/register
│       └── complete-profile.tsx # URL: /auth/complete-profile
├── (modals)/                # Modal routes group
│   ├── create-alert.tsx     # URL: /create-alert (modal)
│   └── alert-details.tsx    # URL: /alert-details (modal)
└── +not-found.tsx          # 404 handler
```

### Route Groups Explained

1. **`(app)`** - Authenticated routes that require login
2. **`(tabs)`** - Routes displayed in tab navigation
3. **`(public)`** - Unauthenticated routes
4. **`(modals)`** - Routes presented as modals

**Important**: Group names in parentheses do NOT appear in URLs!

## Navigation Patterns

### 1. Tab Navigation (Mobile)
```typescript
// In app/(app)/(tabs)/_layout.tsx
<Tabs screenOptions={{ headerShown: false }}>
  <Tabs.Screen name="home" />
  <Tabs.Screen name="alerts" />
  <Tabs.Screen name="patients" />
  <Tabs.Screen name="settings" />
</Tabs>
```

### 2. Sidebar Navigation (Desktop)
```typescript
// Navigation items must use correct paths
const navItems = [
  { href: '/home', title: 'Dashboard' },
  { href: '/alerts', title: 'Alerts' },
  { href: '/patients', title: 'Patients' },
  { href: '/settings', title: 'Settings' }
];
```

### 3. Programmatic Navigation
```typescript
import { router } from 'expo-router';

// Navigate to a route
router.push('/alerts');
router.replace('/home');
router.back();

// Navigate with params
router.push({
  pathname: '/alerts/[id]',
  params: { id: 'alert-123' }
});
```

### 4. Declarative Navigation
```typescript
import { Link } from 'expo-router';

<Link href="/alerts">View Alerts</Link>
<Link href="/alerts/123">Alert Details</Link>
```

## Authentication Flow

### Flow Diagram
```
App Start
    ↓
Check Auth State (/_layout.tsx)
    ↓
Not Authenticated → Redirect to /auth/login
    ↓
Authenticated → Check Profile
    ↓
Incomplete Profile → /auth/complete-profile
    ↓
Complete Profile → /home
```

### Implementation in `(app)/_layout.tsx`
```typescript
export default function AppLayout() {
  const { isAuthenticated, hasHydrated, user } = useAuth();
  
  if (!hasHydrated) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }
  
  if (user?.needsProfileCompletion) {
    return <Redirect href="/auth/complete-profile" />;
  }
  
  return <Stack />;
}
```

## Platform-Specific Considerations

### Web
- Supports browser back/forward buttons
- URL bar reflects current route
- Deep linking works via standard URLs
- Sidebar navigation on desktop viewports

### Mobile (iOS/Android)
- Tab navigation at bottom
- Gesture-based navigation
- Deep linking via app schemes
- Hardware back button support (Android)

### Responsive Breakpoints
```typescript
const isDesktop = Platform.OS === 'web' && width >= 1024;

if (isDesktop) {
  return <SidebarLayout />;
} else {
  return <TabLayout />;
}
```

## Common Issues and Solutions

### Issue 1: 401 Authentication Errors
**Problem**: API calls fail with "Authentication required"
**Solution**: 
1. Ensure session is established before API calls
2. Add `enabled` flag to queries: `enabled: !!user && !!hospitalId`
3. Check hospital context is available

### Issue 2: Navigation to Wrong Routes
**Problem**: Clicking alerts goes to wrong URL
**Solution**: 
1. Remove group prefixes from hrefs: `/(app)/(tabs)/alerts` → `/alerts`
2. Use absolute paths starting with `/`

### Issue 3: Sidebar Items Not Active
**Problem**: Current route not highlighted in sidebar
**Solution**:
```typescript
const isActive = pathname === '/alerts' || pathname.startsWith('/alerts/');
```

### Issue 4: Back Navigation Issues
**Problem**: Back button doesn't work as expected
**Solution**:
1. Use `router.back()` for programmatic back
2. Ensure proper stack configuration in layouts

## Testing Checklist

### Navigation Flow Tests
- [ ] App starts and redirects unauthenticated users to login
- [ ] Successful login navigates to home
- [ ] Incomplete profiles redirect to complete-profile
- [ ] All main routes are accessible from navigation
- [ ] Deep links work for all routes
- [ ] Back navigation works correctly
- [ ] Modal routes open/close properly

### Platform-Specific Tests
- [ ] Web: Browser back/forward works
- [ ] Web: URL bar updates correctly
- [ ] Web: Sidebar navigation works on desktop
- [ ] Mobile: Tab navigation works
- [ ] Mobile: Gestures work (iOS)
- [ ] Android: Hardware back button works

### Authentication Tests
- [ ] Protected routes redirect to login
- [ ] Session persists across app restarts
- [ ] Logout clears navigation stack
- [ ] Role-based route access works

## Implementation Guide

### Step 1: Fix Navigation Hrefs
Update all navigation items to use correct paths without group prefixes.

### Step 2: Add Route Validation
Create a route validator to ensure all routes exist:
```typescript
const VALID_ROUTES = [
  '/home',
  '/alerts',
  '/alerts/escalation-queue',
  '/alerts/history',
  '/patients',
  '/settings',
  // ... etc
];

export function validateRoute(route: string): boolean {
  return VALID_ROUTES.includes(route);
}
```

### Step 3: Implement Navigation Logger
```typescript
import { router } from 'expo-router';
import { logger } from '@/lib/core/debug/unified-logger';

// Wrap router methods
const originalPush = router.push;
router.push = (href: any) => {
  logger.navigation.log('push', { href });
  return originalPush(href);
};
```

### Step 4: Add Navigation Debug Panel
Create a debug component that shows:
- Current route
- Navigation history
- Available routes
- Navigation errors

### Step 5: Fix Authentication Flow
Ensure proper redirects and session handling throughout the navigation flow.

## Best Practices

1. **Always use absolute paths** starting with `/`
2. **Don't include group names** in navigation hrefs
3. **Handle loading states** during navigation
4. **Validate routes** before navigation
5. **Log navigation events** for debugging
6. **Test on all platforms** regularly
7. **Keep URLs meaningful** and user-friendly
8. **Handle errors gracefully** with fallback routes

## Migration Notes

When fixing existing navigation:
1. Search for all `router.push` and `router.replace` calls
2. Update all `href` props in Link components
3. Update navigation configuration objects
4. Test each route individually
5. Verify deep linking works

## Resources

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Navigation Guide](https://reactnavigation.org/)
- [URL Structure Best Practices](https://docs.expo.dev/router/reference/url-parameters/)

---

**Note**: This guide is critical for the app's functionality. All developers must read and understand this before making navigation changes.