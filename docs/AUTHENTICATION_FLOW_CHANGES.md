# Authentication Flow Changes Documentation

## Overview
This document outlines the significant changes made to the authentication flow to fix runtime errors and navigation conflicts after TypeScript fixes were completed.

## Key Issues Resolved

### 1. _interopRequireDefault Error
**Problem**: `_interopRequireDefault is not a function` error in browser console
**Root Cause**: Babel helpers were not properly injected before module execution
**Solution**: Added webpack BannerPlugin to inject the helper before any modules load

```javascript
// webpack.config.js
new webpack.BannerPlugin({
  banner: `
    if (typeof window !== 'undefined' && !window._interopRequireDefault) {
      window._interopRequireDefault = function(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      };
    }
  `,
  raw: true,
  entryOnly: false
})
```

### 2. Navigation Race Conditions
**Problem**: Multiple navigation guards causing redirect loops and conflicts
**Root Cause**: Navigation logic was duplicated across index.tsx, auth layout, and main layout
**Solution**: Centralized all navigation logic in NavigationGuard component

## Authentication Flow Architecture

### User Roles (from PRD)
1. **System Roles**: admin, manager, user, guest
2. **Healthcare Organization Roles**: operator, nurse, doctor, head_doctor

### Navigation Guard Logic
The NavigationGuard component in `app/_layout.tsx` now handles all routing decisions:

```typescript
// Centralized navigation logic
- Check authentication state
- Check email verification (if required)
- Check profile completion
- Route to appropriate dashboard based on role
```

### Routing Hierarchy
1. **Unauthenticated Users** → `/(auth)/login`
2. **Email Not Verified** → `/(auth)/verify-email` (if verification required)
3. **Profile Incomplete** → `/(auth)/complete-profile`
4. **Healthcare Staff** → `/(healthcare)/dashboard`
5. **Operator** → `/(home)/operator-dashboard`
6. **Admin** → `/(home)/admin`
7. **Manager** → `/(home)/manager`
8. **Regular Users** → `/(home)`

## Key Changes Made

### 1. AppUser Type Enhancement
Added `emailVerified` field to support email verification flow:

```typescript
// lib/stores/auth-store.ts
export interface AppUser extends User {
  role: 'admin' | 'manager' | 'user' | 'guest' | 'operator' | 'nurse' | 'doctor' | 'head_doctor';
  organizationRole?: 'operator' | 'doctor' | 'nurse' | 'head_doctor';
  emailVerified?: boolean; // Added field
}
```

### 2. Simplified Index Component
Removed all navigation logic to prevent conflicts:

```typescript
// app/index.tsx
export default function Index() {
  const theme = useTheme();
  const { hasHydrated } = useAuth();
  
  // Just show loading - NavigationGuard handles routing
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}
```

### 3. Auth Layout Simplification
Removed redirect logic to prevent loops:

```typescript
// app/(auth)/_layout.tsx
// No redirects - let NavigationGuard handle it
// This prevents redirect loops
```

### 4. Environment-Based Email Verification
Added support for optional email verification:

```typescript
const requiresEmailVerification = process.env.EXPO_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'true';
```

## Benefits of Centralized Navigation

1. **Single Source of Truth**: All navigation logic in one place
2. **No Race Conditions**: Eliminates competing navigation attempts
3. **Easier Debugging**: Clear flow from one component
4. **Better Performance**: Reduces unnecessary re-renders
5. **Maintainability**: Easier to update routing rules

## Testing the Authentication Flow

1. **New User Registration**:
   - Register → Email Verification (if enabled) → Profile Completion → Dashboard

2. **Existing User Login**:
   - Login → Dashboard (based on role)

3. **Healthcare Staff Login**:
   - Login → Healthcare Dashboard

4. **Protected Route Access**:
   - Unauthenticated access to protected routes → Login page

## Future Considerations

1. **Organization Switching**: Currently handled but may need enhancement for multi-org users
2. **Role Elevation**: Consider flows for users with multiple roles
3. **Session Timeout**: Add automatic redirect on session expiry
4. **Deep Linking**: Ensure deep links work with navigation guard

## Migration Notes

When updating from the previous authentication system:
1. Remove any navigation logic from individual pages
2. Let NavigationGuard handle all routing decisions
3. Ensure user roles are properly set in the database
4. Test email verification flow if enabled