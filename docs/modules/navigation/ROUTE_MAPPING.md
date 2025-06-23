# Route Mapping Reference

**Last Updated**: January 23, 2025  
**Status**: Complete Route Map

## Quick Reference Table

| URL Path | File Path | Component | Auth Required | Platform |
|----------|-----------|-----------|---------------|----------|
| `/` | `app/index.tsx` | Redirect to `/home` | No | All |
| `/home` | `app/(app)/(tabs)/home.tsx` | Dashboard | Yes | All |
| `/alerts` | `app/(app)/(tabs)/alerts/index.tsx` | AlertsList | Yes | All |
| `/alerts/[id]` | `app/(app)/(tabs)/alerts/[id].tsx` | AlertDetails | Yes | All |
| `/alerts/escalation-queue` | `app/(app)/(tabs)/alerts/escalation-queue.tsx` | EscalationQueue | Yes | All |
| `/alerts/history` | `app/(app)/(tabs)/alerts/history.tsx` | AlertHistory | Yes | All |
| `/patients` | `app/(app)/(tabs)/patients.tsx` | PatientsList | Yes | All |
| `/patients/[id]` | `app/(app)/patients/[id].tsx` | PatientDetails | Yes | All |
| `/settings` | `app/(app)/(tabs)/settings/index.tsx` | Settings | Yes | All |
| `/settings/notifications` | `app/(app)/(tabs)/settings/notifications.tsx` | NotificationSettings | Yes | All |
| `/auth/login` | `app/(public)/auth/login.tsx` | LoginScreen | No | All |
| `/auth/register` | `app/(public)/auth/register.tsx` | RegisterScreen | No | All |
| `/auth/complete-profile` | `app/(public)/auth/complete-profile.tsx` | CompleteProfile | No | All |
| `/create-alert` | `app/(modals)/create-alert.tsx` | CreateAlert | Yes | Modal |
| `/shifts/handover` | `app/(app)/shifts/handover.tsx` | ShiftHandover | Yes | All |

## Navigation Items to URL Mapping

### Sidebar Navigation (Desktop)
```typescript
// Current (INCORRECT)
{
  href: '/(app)/(tabs)/home',      // ❌ Wrong
  href: '/(app)/(tabs)/alerts',    // ❌ Wrong
}

// Fixed (CORRECT)
{
  href: '/home',                   // ✅ Correct
  href: '/alerts',                 // ✅ Correct
}
```

### Tab Navigation (Mobile)
```typescript
// Tabs automatically handle routing
<Tabs.Screen name="home" />      // → /home
<Tabs.Screen name="alerts" />    // → /alerts
<Tabs.Screen name="patients" />  // → /patients
<Tabs.Screen name="settings" />  // → /settings
```

## Dynamic Routes

### Alert Details
```typescript
// Navigate to specific alert
router.push(`/alerts/${alertId}`);
router.push({
  pathname: '/alerts/[id]',
  params: { id: alertId }
});
```

### Patient Details
```typescript
// Navigate to specific patient
router.push(`/patients/${patientId}`);
router.push({
  pathname: '/patients/[id]',
  params: { id: patientId }
});
```

## Route Groups Behavior

### (app) Group
- **Purpose**: Authenticated routes
- **URL Impact**: None (invisible in URL)
- **Auth Check**: Yes, in `_layout.tsx`

### (tabs) Group
- **Purpose**: Tab navigation container
- **URL Impact**: None (invisible in URL)
- **Navigation**: Bottom tabs on mobile, integrated in sidebar on desktop

### (public) Group
- **Purpose**: Unauthenticated routes
- **URL Impact**: None (invisible in URL)
- **Auth Check**: Redirects authenticated users

### (modals) Group
- **Purpose**: Modal presentation
- **URL Impact**: None (invisible in URL)
- **Presentation**: Modal overlay

## API Routes

| Endpoint | File Path | Purpose |
|----------|-----------|---------|
| `/api/auth/[...auth]` | `app/api/auth/[...auth]+api.ts` | Auth endpoints |
| `/api/trpc/[trpc]` | `app/api/trpc/[trpc]+api.ts` | TRPC endpoints |
| `/api/health` | `app/api/health+api.ts` | Health check |

## Deep Linking

### iOS
```
myapp://alerts/123
myapp://patients/456
```

### Android
```
myapp://alerts/123
myapp://patients/456
```

### Web
```
https://app.example.com/alerts/123
https://app.example.com/patients/456
```

## Navigation State Diagram

```
                    App Start
                        |
                   Check Auth
                    /       \
              No Auth       Has Auth
                |               |
         /auth/login      Check Profile
                            /       \
                    Incomplete    Complete
                         |           |
            /auth/complete-profile  /home
                                      |
                          Tab/Sidebar Navigation
                          /    |     |      \
                    /home /alerts /patients /settings
```

## Common Navigation Patterns

### 1. After Login
```typescript
// In login success handler
router.replace('/home');
```

### 2. After Creating Alert
```typescript
// Navigate to new alert
router.push(`/alerts/${newAlertId}`);
```

### 3. From Alert List to Details
```typescript
// In alert card press handler
const handleAlertPress = (alertId: string) => {
  router.push(`/alerts/${alertId}`);
};
```

### 4. Back Navigation
```typescript
// Go back
router.back();

// Check if can go back
if (router.canGoBack()) {
  router.back();
} else {
  router.replace('/home');
}
```

## Route Validation Checklist

- [ ] All routes start with `/` (no group prefixes)
- [ ] Dynamic routes use square brackets `[param]`
- [ ] Modal routes configured with proper presentation
- [ ] Auth redirects work correctly
- [ ] Deep links resolve to correct screens
- [ ] Back navigation maintains proper stack

## Troubleshooting Routes

### Route Not Found
1. Check file exists at correct path
2. Verify no typos in route name
3. Ensure `_layout.tsx` includes the route
4. Check for conflicting route names

### Wrong Screen Loads
1. Verify route priority (specific before dynamic)
2. Check for duplicate route definitions
3. Ensure proper file naming

### Navigation Not Working
1. Remove group prefixes from URLs
2. Use absolute paths (start with `/`)
3. Check auth requirements
4. Verify navigation method (push vs replace)