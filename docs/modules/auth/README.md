# Authentication Module

The comprehensive authentication module built on Better Auth v1.2.8, providing secure user management, OAuth integration, and role-based access control.

## Overview

The Authentication module provides a complete authentication solution with email/password, OAuth providers, session management, and role-based permissions for the healthcare system.

### Key Features
- 🔐 **Secure Authentication**: Email/password with bcrypt hashing
- 🌐 **OAuth Providers**: Google, GitHub, Apple Sign-In
- 🔑 **Session Management**: JWT-based with automatic refresh
- 👥 **Role System**: Admin, Manager, Doctor, Nurse, Operator
- 🏥 **Hospital Context**: Multi-hospital user assignments
- ✉️ **Email Verification**: Required for new accounts
- 🔄 **Password Recovery**: Secure reset flow
- 📱 **Multi-device Support**: Web and mobile sessions

## Architecture

```
auth/
├── components/          # UI components
│   ├── SignIn.tsx
│   ├── SignUp.tsx
│   ├── ForgotPassword.tsx
│   ├── VerifyEmail.tsx
│   └── ProfileCompletion.tsx
├── hooks/              # Auth hooks
│   ├── useAuth.ts
│   ├── useSession.ts
│   ├── usePermissions.ts
│   └── useHospitalContext.ts
├── lib/                # Core logic
│   ├── auth-client.ts
│   ├── permissions.ts
│   └── session-manager.ts
└── types/              # TypeScript types
    └── auth.ts
```

## API Reference

### Authentication

#### Sign In
```ts
import { authClient } from '@/lib/auth/auth-client';

// Email/Password
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'secure-password',
});

// OAuth
await authClient.signIn.social({
  provider: 'google',
  callbackURL: '/auth-callback',
});
```

#### Sign Up
```ts
await authClient.signUp.email({
  email: 'user@example.com',
  password: 'secure-password',
  name: 'John Doe',
  data: {
    role: 'nurse',
    hospitalId: 'hosp-123',
  },
});
```

#### Sign Out
```ts
await authClient.signOut();
```

### Session Management

#### Get Current Session
```ts
const { data: session } = await authClient.getSession();

if (session) {
  console.log('User:', session.user);
  console.log('Expires:', session.expiresAt);
}
```

#### Refresh Session
```ts
await authClient.refreshSession();
```

### Profile Management

#### Update Profile
```ts
await authClient.updateUser({
  name: 'Jane Doe',
  image: 'https://example.com/avatar.jpg',
});
```

#### Complete Healthcare Profile
```ts
api.auth.completeHealthcareProfile.mutate({
  role: 'doctor',
  hospitalId: 'hosp-123',
  department: 'emergency',
  licenseNumber: 'MD-12345',
});
```

## Usage Examples

### Auth Hook
```tsx
import { useAuth } from '@/hooks/useAuth';

export function MyComponent() {
  const { user, isLoading, signOut } = useAuth();
  
  if (isLoading) return <Text>Loading...</Text>;
  
  if (!user) return <SignIn />;
  
  return (
    <View>
      <Text>Welcome, {user.name}!</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}
```

### Permission Guard
```tsx
import { PermissionGuard } from '@/components/blocks/auth';

export function AdminPanel() {
  return (
    <PermissionGuard 
      permission="admin:access"
      fallback={<Text>Access Denied</Text>}
    >
      <AdminContent />
    </PermissionGuard>
  );
}
```

### Hospital Context
```tsx
import { useHospitalContext } from '@/hooks/healthcare';

export function HospitalDashboard() {
  const { currentHospital, switchHospital } = useHospitalContext();
  
  return (
    <View>
      <Text>Current: {currentHospital.name}</Text>
      <HospitalSelector onSelect={switchHospital} />
    </View>
  );
}
```

## Role Permissions

### Permission Matrix

| Permission | Admin | Manager | Doctor | Nurse | Operator |
|------------|-------|---------|--------|-------|----------|
| View Patients | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Alerts | ✅ | ❌ | ❌ | ❌ | ✅ |
| Acknowledge Alerts | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ✅ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

### Custom Permissions
```ts
// lib/auth/permissions.ts
export const permissions = {
  // Healthcare permissions
  'alerts:create': ['admin', 'operator'],
  'alerts:acknowledge': ['admin', 'manager', 'doctor', 'nurse'],
  'alerts:resolve': ['admin', 'doctor', 'nurse'],
  
  // Admin permissions
  'users:manage': ['admin', 'manager'],
  'system:configure': ['admin'],
  'analytics:export': ['admin', 'manager'],
};
```

## Session Configuration

### Session Options
```ts
// lib/auth/auth-client.ts
export const sessionOptions = {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24,      // Update after 1 day
  cookieName: 'healthcare-session',
  secure: process.env.NODE_ENV === 'production',
};
```

### Session Timeout
```ts
// Auto logout after 30 minutes of inactivity
import { SessionTimeoutManager } from '@/lib/auth/session-timeout-manager';

const manager = new SessionTimeoutManager({
  timeout: 30 * 60 * 1000, // 30 minutes
  warningTime: 5 * 60 * 1000, // 5 minute warning
  onTimeout: () => authClient.signOut(),
});
```

## OAuth Configuration

### Supported Providers
1. **Google**
   - Client ID in `BETTER_AUTH_GOOGLE_ID`
   - Client Secret in `BETTER_AUTH_GOOGLE_SECRET`

2. **GitHub**
   - Client ID in `BETTER_AUTH_GITHUB_ID`
   - Client Secret in `BETTER_AUTH_GITHUB_SECRET`

3. **Apple** (iOS only)
   - Service ID in `BETTER_AUTH_APPLE_ID`
   - Private Key in `BETTER_AUTH_APPLE_SECRET`

### OAuth Flow
```tsx
// components/blocks/auth/SocialButtons.tsx
export function SocialButtons() {
  const handleOAuth = (provider: string) => {
    authClient.signIn.social({
      provider,
      callbackURL: '/auth-callback',
    });
  };
  
  return (
    <>
      <Button onPress={() => handleOAuth('google')}>
        Continue with Google
      </Button>
      <Button onPress={() => handleOAuth('github')}>
        Continue with GitHub
      </Button>
    </>
  );
}
```

## Email Configuration

### Email Templates
- **Verification**: Sent after registration
- **Password Reset**: Sent for password recovery
- **Welcome**: Sent after email verification

### Email Provider
```ts
// Using Resend for transactional emails
const emailConfig = {
  provider: 'resend',
  apiKey: process.env.RESEND_API_KEY,
  from: 'noreply@healthcare.app',
};
```

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Rate Limiting
- Sign in: 5 attempts per 15 minutes
- Sign up: 3 accounts per hour per IP
- Password reset: 3 requests per hour

### Security Headers
```ts
// Automatically set by Better Auth
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000',
}
```

## Testing

### Unit Tests
```bash
bun run test:auth:unit
```

### Integration Tests
```bash
bun run test:auth:integration
```

### Test User Credentials
```ts
// For development only
const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
  },
  doctor: {
    email: 'doctor@test.com',
    password: 'Doctor123!',
  },
  nurse: {
    email: 'nurse@test.com',
    password: 'Nurse123!',
  },
};
```

## Common Issues

### Session Not Persisting
1. Check cookie settings in production
2. Verify HTTPS is enabled
3. Check CORS configuration

### OAuth Redirect Issues
1. Verify callback URLs in provider dashboard
2. Check redirect URI configuration
3. Ensure proper URL encoding

### Email Not Sending
1. Verify email provider API key
2. Check spam folder
3. Review email template syntax

## Migration Guide

### From Previous Auth System
```ts
// Old system
const user = await oldAuth.login(email, password);

// New system
const { data } = await authClient.signIn.email({
  email,
  password,
});
```

### Database Migration
```sql
-- Add Better Auth tables
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  emailVerified BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  expiresAt TIMESTAMP NOT NULL,
  token TEXT UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Performance Optimization

### Session Caching
- Sessions cached for 5 minutes
- Automatic cache invalidation on update
- Background refresh for active sessions

### Token Management
- Access tokens: 15 minute expiry
- Refresh tokens: 7 day expiry
- Automatic renewal before expiry

## Future Enhancements

1. **Biometric Authentication**: Face ID / Touch ID
2. **Two-Factor Authentication**: SMS/TOTP
3. **SSO Integration**: SAML/LDAP
4. **Passwordless Login**: Magic links
5. **Device Management**: Track active sessions

---

For more details, see:
- [API Documentation](../../api/auth-api.md)
- [Security Guide](../../guides/security.md)
- [Testing Guide](./testing.md)