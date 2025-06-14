# Authentication Module

## Overview
The authentication module provides a comprehensive authentication solution using Better Auth v1.2.8 with support for email/password, Google OAuth, and magic links. It includes profile completion flow, organization management integration, and enterprise-grade security features.

## Current Status: ✅ Production Ready
- **Last Updated**: January 14, 2025
- **Version**: 2.0.0
- **Stability**: Stable with known workarounds

## Architecture

### Core Components

#### 1. **Better Auth Configuration** (`lib/auth/auth-server.ts`)
- Server-side Better Auth setup with plugins
- OAuth (Google) configuration
- Magic link support
- Organization plugin integration
- Advanced security features
- Session management with cookie-based auth

#### 2. **Auth Client** (`lib/auth/auth-client.ts`)
- Client-side Better Auth configuration
- OAuth sign-out workaround for v1.2.8
- Session monitoring integration
- Token refresh support
- Cross-platform compatibility (web/mobile)

#### 3. **Auth Store** (`lib/stores/auth-store.ts`)
- Zustand-based state management
- Session persistence
- Role-based access control
- Permission checking
- Hydration support

#### 4. **Profile Completion Flow**
- Multi-step form with role-based steps
- Organization field collection for managers/admins
- Integration with organization creation
- Validation with Zod schemas

## Features

### 1. **Authentication Methods**
- ✅ Email/Password with validation
- ✅ Google OAuth with profile auto-fill
- ✅ Magic Links (passwordless)
- ✅ Session persistence
- ✅ Remember me functionality

### 2. **Profile Completion**
- Dynamic steps based on user role
- Organization creation for managers/admins
- Terms acceptance
- Phone number and department collection
- Automatic progression after OAuth

### 3. **Security Features**
- Rate limiting on auth endpoints
- Session timeout monitoring
- Token refresh mechanism
- Audit logging for compliance
- Secure storage on mobile
- CSRF protection

### 4. **Organization Integration**
- Organization name collection during signup
- Deferred organization creation (via organization router)
- Role-based organization access
- Support for multiple organization membership

## Known Issues & Workarounds

### 1. **OAuth Sign-Out 500 Error**
- **Issue**: Better Auth v1.2.8 returns 500 on OAuth session sign-out
- **Cause**: JSON parsing error with OAuth provider data
- **Workaround**: Error is caught and suppressed at multiple levels
- **Impact**: None - sign-out works correctly
- **Files**: `auth-client.ts`, `auth-server.ts`, `[...auth]+api.ts`

### 2. **Sign-Out Timeout**
- **Issue**: Sign-out requests may timeout
- **Workaround**: 5-second timeout with graceful handling
- **Impact**: None - local session cleared immediately

## API Endpoints

### tRPC Routes (`src/server/routers/auth.ts`)
```typescript
// Public endpoints
auth.signIn - Email/password login
auth.signUp - New user registration  
auth.getSession - Get current session
auth.forgotPassword - Password reset request
auth.resetPassword - Complete password reset
auth.verifyEmail - Email verification
auth.resendVerificationEmail - Resend verification

// Protected endpoints
auth.completeProfile - Complete profile after OAuth
auth.updateProfile - Update user profile
auth.changePassword - Change password
auth.checkUsername - Username availability
```

## Usage Examples

### Sign In
```typescript
import { api } from '@/lib/api/trpc';

const { mutate: signIn } = api.auth.signIn.useMutation({
  onSuccess: (data) => {
    // Handle successful login
    router.push('/dashboard');
  }
});

signIn({ 
  email: 'user@example.com', 
  password: 'password123' 
});
```

### OAuth Sign In
```typescript
import { GoogleSignInButton } from '@/components/blocks/auth';

<GoogleSignInButton 
  onSuccess={() => router.push('/complete-profile')}
  onError={(error) => console.error(error)}
/>
```

### Profile Completion
```typescript
import { ProfileCompletionFlow } from '@/components/blocks/auth';

<ProfileCompletionFlow 
  onComplete={() => router.push('/dashboard')}
/>
```

### Sign Out
```typescript
import { SignOutButton } from '@/components/blocks/auth';

<SignOutButton 
  showConfirmation={false}
  redirectTo="/(auth)/login"
/>
```

## Configuration

### Environment Variables
```env
# Better Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_BASE_URL=http://localhost:8081

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Service
EMAIL_FROM=noreply@example.com
RESEND_API_KEY=your-resend-key

# Security
EXPO_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false
ENABLE_TWO_FACTOR=false
```

### Security Configuration
```typescript
// lib/auth/security-config.ts
export const SECURITY_CONFIG = {
  password: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },
  session: {
    timeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    warningTime: 5 * 60 * 1000, // 5 min warning
  },
  rateLimit: {
    signIn: { max: 5, window: 10 * 60 * 1000 },
    signUp: { max: 3, window: 60 * 60 * 1000 }
  }
};
```

## Testing

### Manual Testing
1. Sign up with email/password
2. Complete profile with organization
3. Sign out and sign in again
4. Test Google OAuth flow
5. Verify session persistence
6. Test password reset flow

### Test Checklist
- [x] Email/password authentication
- [x] Google OAuth with profile completion
- [x] Session persistence across refreshes
- [x] Sign-out functionality (with workarounds)
- [x] Rate limiting protection
- [x] Token refresh mechanism
- [x] Mobile authentication
- [x] Organization field collection

## Middleware Integration

### Rate Limiting
```typescript
// Applied automatically to auth endpoints
auth.signIn: 5 attempts per 10 minutes
auth.signUp: 3 attempts per hour
auth.resetPassword: 3 attempts per 15 minutes
```

### Audit Logging
All authentication events are logged:
- Login attempts (success/failure)
- Sign-outs
- Password changes
- Profile updates
- OAuth callbacks

## Migration Notes

### From v1.x to v2.0
1. Organization creation moved to organization router
2. Profile completion is now required for all OAuth users
3. Session management uses Better Auth's built-in features
4. Rate limiting is enforced on all auth endpoints

## Future Enhancements
1. Two-factor authentication support
2. Passkey/WebAuthn integration
3. Social login providers (GitHub, Apple)
4. Enhanced session security with device tracking
5. Improved organization invitation flow

## Related Documentation
- [Organization Module](./ORGANIZATION_MODULE.md)
- [Security Guide](../BETTER_AUTH_SECURITY_GUIDE.md)
- [OAuth Setup Guide](../guides/authentication/google-oauth-setup.md)
- [Session Management](../guides/authentication/auth-session-management.md)