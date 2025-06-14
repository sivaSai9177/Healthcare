# Auth Blocks Module Documentation

## Overview

The Auth Blocks module provides a complete authentication solution with reusable block components that integrate with Better Auth backend. All components follow the block architecture pattern with proper separation of concerns.

## Architecture

```
components/blocks/auth/
├── SignIn/
│   ├── SignIn.tsx          # Main sign-in component
│   ├── useSignIn.ts        # Sign-in business logic hook
│   ├── types.ts            # TypeScript interfaces
│   └── index.ts            # Public exports
├── Register/
│   ├── Register.tsx        # Multi-step registration form
│   ├── useRegister.ts      # Registration logic hook
│   ├── types.ts            # TypeScript interfaces
│   └── index.ts
├── VerifyEmail/
│   ├── VerifyEmail.tsx     # Email verification component
│   ├── useVerifyEmail.ts   # Verification logic hook
│   ├── types.ts
│   └── index.ts
├── ForgotPassword/
│   ├── ForgotPassword.tsx  # Password reset request
│   ├── useForgotPassword.ts
│   ├── types.ts
│   └── index.ts
├── ProtectedRoute/
│   ├── ProtectedRoute.tsx  # Route protection HOC
│   ├── useRouteProtection.ts
│   └── index.ts
├── components/
│   ├── AuthCard.tsx        # Shared auth card wrapper
│   ├── AuthFormField.tsx   # Shared form field component
│   ├── PasswordStrengthIndicator.tsx
│   ├── SocialLoginButtons.tsx
│   └── TermsFooter.tsx
└── index.ts                # Module exports
```

## Components

### SignIn Block

**Purpose**: Handles user authentication with email/password

**Features**:
- Real-time email validation with debounce
- Email existence check via API
- Password visibility toggle
- Remember me functionality
- Loading states and error handling
- Smooth animations with React Native Reanimated

**Usage**:
```tsx
import { SignIn, useSignIn } from '@/components/blocks/auth/SignIn';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, checkEmail, isLoading, error } = useSignIn();

  return (
    <SignIn
      onSubmit={signIn}
      onForgotPassword={() => router.push('/forgot-password')}
      onSignUp={() => router.push('/register')}
      onCheckEmail={checkEmail}
      isLoading={isLoading}
      error={error}
    />
  );
}
```

### Register Block

**Purpose**: Multi-step user registration with role selection

**Features**:
- 3-step registration flow
- Real-time email availability check
- Role selection (user, manager, admin, guest)
- Organization code support
- Password strength indicator
- Terms acceptance
- Progress tracking

**Usage**:
```tsx
import { Register, useRegister } from '@/components/blocks/auth/Register';

export default function RegisterScreen() {
  const { register, checkEmail, isLoading, error } = useRegister();

  return (
    <Register
      onSubmit={register}
      onCheckEmail={checkEmail}
      onSignIn={() => router.push('/login')}
      isLoading={isLoading}
      error={error}
    />
  );
}
```

### VerifyEmail Block

**Purpose**: Email verification with 6-digit code

**Features**:
- Auto-submit on 6 digits
- Resend functionality with cooldown
- Countdown timer
- Auto-focus management
- Loading states

**Usage**:
```tsx
import { VerifyEmail, useVerifyEmail } from '@/components/blocks/auth/VerifyEmail';

export default function VerifyEmailScreen() {
  const { verifyEmail, resendCode, isLoading, error } = useVerifyEmail();

  return (
    <VerifyEmail
      email={user.email}
      onSubmit={verifyEmail}
      onResend={resendCode}
      onSkip={() => router.push('/dashboard')}
      isLoading={isLoading}
      error={error}
    />
  );
}
```

### ForgotPassword Block

**Purpose**: Password reset request

**Features**:
- Email validation
- Loading states
- Success feedback
- Auto-redirect after success

**Usage**:
```tsx
import { ForgotPassword, useForgotPassword } from '@/components/blocks/auth/ForgotPassword';

export default function ForgotPasswordScreen() {
  const { resetPassword, isLoading, error, success } = useForgotPassword();

  return (
    <ForgotPassword
      onSubmit={resetPassword}
      onBack={() => router.back()}
      isLoading={isLoading}
      error={error}
      success={success}
    />
  );
}
```

### ProtectedRoute Component

**Purpose**: Route protection with role-based access control

**Features**:
- Authentication check
- Role-based access
- Loading states
- Redirect handling

**Usage**:
```tsx
import { ProtectedRoute } from '@/components/blocks/auth/ProtectedRoute';

// As wrapper
<ProtectedRoute requiredRoles={['admin', 'manager']}>
  <AdminDashboard />
</ProtectedRoute>

// As HOC
const ProtectedAdminDashboard = withProtectedRoute(AdminDashboard, {
  requiredRoles: ['admin']
});
```

## Shared Components

### AuthCard
- Consistent card styling for auth screens
- Responsive padding and shadows
- Logo placement

### AuthFormField
- Reusable form field with validation
- Error messages
- Icon support
- Consistent styling

### PasswordStrengthIndicator
- Visual password strength feedback
- Real-time updates
- Color-coded indicators

### SocialLoginButtons
- OAuth provider buttons
- Consistent styling
- Loading states
- Platform-specific rendering

### TermsFooter
- Terms and privacy policy links
- Consistent footer for auth screens

## API Integration

All auth blocks integrate with Better Auth through tRPC:

```typescript
// Backend endpoints used
- api.auth.signIn
- api.auth.signUp
- api.auth.signOut
- api.auth.resetPassword
- api.auth.verifyEmail
- api.auth.resendVerificationEmail
- api.auth.checkEmailExists
- api.auth.session
```

## State Management

Auth state is managed through:
- `useAuth()` hook from `/hooks/useAuth`
- Zustand store at `/lib/stores/auth-store`
- Session persistence with AsyncStorage/SecureStore

## Navigation Flow

```
Login → Dashboard (authenticated)
     ↓
     → Register → Verify Email → Profile Completion → Dashboard
     ↓
     → Forgot Password → Check Email → Login

Protected Routes:
- Check authentication
- Check email verification
- Check profile completion
- Check role permissions
```

## Design System Integration

All components use:
- Tailwind/NativeWind for styling
- `useSpacing()` for consistent spacing
- `useShadow()` for elevation
- `useResponsive()` for responsive design
- React Native Reanimated for animations
- Haptic feedback for interactions

## Best Practices

1. **Error Handling**: All components handle and display errors gracefully
2. **Loading States**: Proper loading indicators during async operations
3. **Validation**: Client-side validation with Zod schemas
4. **Accessibility**: Proper labels, focus management
5. **Security**: No sensitive data in logs, secure token storage
6. **Performance**: Debounced API calls, optimized re-renders

## Testing

Each block includes:
- Unit tests for hooks
- Component tests with React Testing Library
- Integration tests with API mocks
- E2E tests for complete flows

## Migration Notes

- All components migrated from `useTheme()` to Tailwind classes
- Removed direct color references
- Added proper TypeScript types
- Integrated with Better Auth v1.0
- Added React Native Reanimated animations

## Future Enhancements

1. **Social Login**: Complete OAuth integration
2. **2FA**: Two-factor authentication
3. **Biometric Auth**: Face ID/Touch ID support
4. **Magic Links**: Passwordless authentication
5. **Session Management**: Multiple device sessions