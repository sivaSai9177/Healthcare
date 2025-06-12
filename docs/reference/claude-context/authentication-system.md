# 🔐 Authentication & Authorization System - Claude Context Module

*Last Updated: January 10, 2025*

## Core Implementation

- **Auth Library**: Better Auth 1.2.8 (not NextAuth)
- **Authorization**: tRPC middleware with role-based and permission-based access control
- **State Management**: Pure Zustand store (no Context API)
- **Session Storage**: AsyncStorage for mobile, localStorage for web
- **OAuth Providers**: Google (configured for web and mobile)

## Key Files

### Authentication Core
- `lib/auth/auth.ts` - Better Auth configuration
- `lib/auth/auth-client.ts` - Cross-platform auth client
- `lib/auth/get-session-with-bearer.ts` - Enhanced session retrieval for mobile Bearer tokens
- `lib/auth/auth-session-manager.ts` - Token extraction from cookie storage
- `lib/auth/mobile-token-store.ts` - Mobile-specific token storage
- `lib/stores/auth-store.ts` - Zustand auth store
- `app/api/auth/[...auth]+api.ts` - Auth API handler

### Authorization & Security
- `src/server/trpc.ts` - Authorization middleware implementation
- `src/server/routers/auth.ts` - All auth endpoints with role-based procedures
- `src/server/services/access-control.ts` - Permission checking service
- `src/server/services/audit.ts` - Audit logging service
- `src/server/middleware/audit.ts` - Audit middleware

## Authentication Flow

### 1. Email/Password Flow
```
User Registration → Email Verification (optional) → Login → Home
```

### 2. OAuth/Social Login Flow
```
1. User clicks Google Sign In → Redirects to OAuth provider
2. OAuth Callback → /app/auth-callback.tsx handles response
3. Check Profile Status:
   - If needsProfileCompletion === true OR role === 'guest'
   - Redirect to /complete-profile
4. Profile Completion (3 steps):
   - Step 1: Personal info (name, phone, bio)
   - Step 2: Role Selection (Guest/User/Manager/Admin)
   - Step 3: Professional details (org, department, job title)
5. Complete Profile → api.auth.completeProfile.useMutation()
6. Update user with selected role → Navigate to /(home)
```

### 3. Session Management
- **Duration**: 7-day expiry with auto-refresh on activity
- **Storage**: Persistent across app restarts
- **Multi-Session**: Support for multiple active sessions
- **Revocation**: Manual logout invalidates session

## Authorization System

### Role-Based Access Control (RBAC)
```typescript
// Available roles
type Role = 'guest' | 'user' | 'manager' | 'admin';

// Role hierarchy
- Guest: Browse-only access, must complete profile for full access
- User: Personal workspace (optional organization)
- Manager: Team management (requires organization creation)
- Admin: Full system access (requires organization creation)
```

### Permission-Based Access Control
```typescript
// Available permissions
type Permission = 
  | '*'              // Admin wildcard
  | 'manage_users'   // User management
  | 'view_analytics' // Analytics access
  | 'manage_content' // Content management
  | 'view_content'   // Content viewing
  | 'edit_profile';  // Profile editing
```

### tRPC Procedures
```typescript
// Public procedure - no auth required
publicProcedure

// Protected procedure - any authenticated user
protectedProcedure

// Role-based procedures
adminProcedure      // Admin only
managerProcedure    // Manager and above
userProcedure       // User and above

// Permission-based procedures
createPermissionProcedure('manage_users')
```

### Context Enhancement
The tRPC context provides helper functions:
- `ctx.user` - Current authenticated user
- `ctx.hasRole(role)` - Check if user has role
- `ctx.hasPermission(permission)` - Check if user has permission
- `ctx.requireRole(role)` - Throw if user lacks role
- `ctx.requirePermission(permission)` - Throw if user lacks permission

## Security Features

1. **Rate Limiting**: Enforced on auth endpoints
2. **Input Sanitization**: All inputs validated with Zod
3. **Password Requirements**: 
   - Minimum 8 characters
   - Must contain uppercase, lowercase, number
4. **Audit Logging**: All auth events logged
5. **Session Security**:
   - HTTP-only cookies
   - Secure flag in production
   - SameSite protection
6. **Token Security**:
   - JWT with short expiry
   - Refresh token rotation
   - Secure storage

## OAuth Configuration

### Google OAuth Setup
1. **Web Client ID**: For web platform
2. **iOS Client ID**: For iOS native
3. **Android Client ID**: For Android native
4. **Redirect URIs**: Platform-specific callbacks

### Mobile OAuth Considerations
- Requires development build (not Expo Go)
- Uses expo-auth-session for native flow
- Scheme configuration in app.json
- Better Auth expo plugin for token storage

## Common Patterns

### Check Authentication State
```typescript
import { useAuthStore } from '@/lib/stores/auth-store';

const Component = () => {
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  
  // Always check hasHydrated before using auth state
  if (!hasHydrated) return <LoadingView />;
  
  if (!isAuthenticated) return <LoginPrompt />;
  
  return <AuthenticatedContent user={user} />;
};
```

### Protect Routes
```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ProtectedScreen() {
  return (
    <ProtectedRoute>
      <YourContent />
    </ProtectedRoute>
  );
}
```

### Make Authenticated API Calls
```typescript
import { api } from '@/lib/trpc';

const { data, isLoading } = api.auth.getSession.useQuery();
const mutation = api.auth.updateProfile.useMutation();
```

## Mobile Token Storage

Better Auth expo plugin stores tokens in cookie format:
- Key: `better-auth_cookie`
- Format: Cookie string, not raw tokens
- Extraction: Session manager parses cookie string
- Platform: AsyncStorage on mobile, localStorage on web

---

*This module contains authentication and authorization details. For implementation patterns, see patterns-conventions.md.*