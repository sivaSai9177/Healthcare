# Authentication Flow Documentation

## Overview

The authentication system in this application uses a modular block-based architecture with Better Auth for backend authentication and tRPC for API communication. The system supports multiple authentication methods and role-based access control.

## Authentication Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│    Login    │────▶│   Register   │────▶│Verify Email │
└──────┬──────┘     └──────────────┘     └──────┬──────┘
       │                                         │
       │            ┌──────────────┐             │
       └───────────▶│   Dashboard  │◀────────────┘
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │Profile Setup │
                    └──────────────┘
```

## Auth Components Structure

### 1. Auth Blocks (`/components/blocks/auth/`)

- **SignIn** - Login form with email/password and social login options
- **Register** - Multi-step registration with role selection
- **VerifyEmail** - Email verification with OTP code
- **ForgotPassword** - Password reset request
- **AuthCard** - Responsive wrapper for auth screens
- **PasswordStrengthIndicator** - Visual password requirements
- **SocialLoginButtons** - Reusable social auth buttons
- **TermsFooter** - Terms and privacy policy acceptance

### 2. Auth Screens (`/app/(auth)/`)

- `login.tsx` - Uses SignIn block
- `register.tsx` - Uses Register block
- `verify-email.tsx` - Uses VerifyEmail block
- `forgot-password.tsx` - Uses ForgotPassword block
- `complete-profile.tsx` - Profile completion flow

### 3. Navigation Guard (`/app/_layout.tsx`)

The NavigationGuard component handles:
- Authentication state checking
- Route protection
- Role-based redirects
- Email verification enforcement
- Profile completion checks

## Authentication Methods

### 1. Email/Password Authentication

```typescript
// Using the SignIn block
import { SignIn, useSignIn } from '@/components/blocks/auth/SignIn';

const { signIn, isLoading, error } = useSignIn();

await signIn({
  email: 'user@example.com',
  password: 'password123',
  rememberMe: true
});
```

### 2. Social Authentication

Supported providers:
- Google OAuth
- Apple Sign In (iOS/macOS)
- Facebook Login

```typescript
const { signInWithProvider } = useSignIn();

await signInWithProvider('google');
```

### 3. Registration Flow

```typescript
// Using the Register block
import { Register, useRegister } from '@/components/blocks/auth/Register';

const { register, checkEmail } = useRegister();

// Check if email exists
const { exists } = await checkEmail('user@example.com');

// Register new user
await register({
  name: 'John Doe',
  email: 'user@example.com',
  password: 'password123',
  role: 'user',
  organizationCode: 'ORG123', // For joining existing org
  acceptTerms: true,
  acceptPrivacy: true
});
```

## User Roles and Permissions

### System Roles
- **admin** - Full system access
- **manager** - Organization management
- **user** - Regular user
- **guest** - Limited access

### Organization Roles
- **doctor** - Healthcare provider
- **nurse** - Healthcare assistant
- **head_doctor** - Department head
- **operator** - System operator
- **member** - Organization member

## Route Protection

### Protected Route Groups

1. **Public Routes** (`/(auth)/*`)
   - Accessible without authentication
   - Redirects to dashboard if already authenticated

2. **Protected Routes**
   - `/(home)/*` - General authenticated routes
   - `/(healthcare)/*` - Healthcare-specific routes
   - `/(organization)/*` - Organization management
   - `/(admin)/*` - Admin-only routes
   - `/(manager)/*` - Manager-only routes

### Navigation Logic

```typescript
// NavigationGuard logic
if (!user && inProtectedGroup) {
  router.replace('/(auth)/login');
}

if (user && !user.emailVerified) {
  router.replace('/(auth)/verify-email');
}

if (user && user.needsProfileCompletion) {
  router.replace('/(auth)/complete-profile');
}

// Role-based dashboard routing
if (user.organizationRole === 'doctor') {
  router.replace('/(healthcare)/dashboard');
} else if (user.role === 'admin') {
  router.replace('/(home)/admin');
}
```

## API Integration

### Auth API Endpoints

The auth system uses Better Auth with these endpoints:

- `POST /api/auth/sign-in` - Email/password login
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-out` - Logout
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/session` - Get current session
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/google/callback` - OAuth callback

### tRPC Integration

```typescript
// Auth mutations
const signInMutation = api.auth.signIn.useMutation();
const signUpMutation = api.auth.signUp.useMutation();
const signOutMutation = api.auth.signOut.useMutation();

// Session query
const { data: session } = api.auth.getSession.useQuery();
```

## State Management

### Auth Store (`/lib/stores/auth-store.ts`)

```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Usage
const { user, isAuthenticated } = useAuthStore();
```

### Session Persistence

- Web: LocalStorage
- Mobile: SecureStore (Expo)
- Token refresh: Automatic with 7-day expiry

## Security Features

1. **Password Requirements**
   - Minimum 8 characters
   - Uppercase and lowercase letters
   - Numbers and special characters
   - Real-time strength indicator

2. **Email Verification**
   - Required for account activation
   - 6-digit OTP code
   - Resend functionality with cooldown

3. **Session Security**
   - JWT tokens with expiration
   - Secure storage on device
   - Automatic token refresh
   - Device fingerprinting

4. **Rate Limiting**
   - Login attempts: 5 per minute
   - Registration: 3 per hour
   - Password reset: 3 per hour

## Error Handling

Common auth errors:

```typescript
// Invalid credentials
{ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }

// Email already exists
{ code: 'EMAIL_EXISTS', message: 'Email already registered' }

// Invalid verification code
{ code: 'INVALID_CODE', message: 'Invalid or expired verification code' }

// Session expired
{ code: 'SESSION_EXPIRED', message: 'Please login again' }
```

## Testing Auth Flows

### Test Accounts

```
// Admin
email: admin@example.com
password: Admin123!

// Healthcare Provider
email: doctor@example.com
password: Doctor123!

// Regular User
email: user@example.com
password: User123!
```

### Testing Email Verification

For development, use code `123456` to bypass email sending.

## Migration Guide

### From Old Auth to New Block System

1. Replace auth screen imports:
```typescript
// Old
import LoginScreen from '@/app/(auth)/login';

// New
import { SignIn } from '@/components/blocks/auth/SignIn';
```

2. Update auth hooks:
```typescript
// Old
const { login } = useAuth();

// New
const { signIn } = useSignIn();
```

3. Update navigation:
```typescript
// Old
navigation.navigate('Login');

// New
router.push('/(auth)/login');
```

## Future Enhancements

1. **Two-Factor Authentication (2FA)**
   - SMS verification
   - Authenticator app support
   - Backup codes

2. **Biometric Authentication**
   - FaceID/TouchID for iOS
   - Fingerprint for Android
   - WebAuthn for web

3. **SSO Integration**
   - SAML support
   - Active Directory
   - Custom SSO providers

4. **Enhanced Security**
   - IP whitelisting
   - Geolocation verification
   - Device management