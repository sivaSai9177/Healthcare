/**
 * Auth Blocks - Authentication and user management components
 * These blocks handle all authentication flows including:
 * - Sign in/up
 * - Password reset
 * - Email verification
 * - Profile completion
 * - Social authentication
 */

// Core Auth Components
export { SignIn, useSignIn } from './SignIn/index';
export type { SignInProps } from './SignIn/types';

export { Register, useRegister } from './Register/index';
export type { RegisterProps } from './Register/types';

export { ForgotPassword, useForgotPassword } from './ForgotPassword/index';

export { VerifyEmail, useVerifyEmail } from './VerifyEmail/index';

// Profile Completion
export { ProfileCompletionFlowEnhanced as ProfileCompletionFlow } from './ProfileCompletion/ProfileCompletionFlowEnhanced';

// Supporting Components
export { AuthCard } from './AuthCard/index';
export type { AuthCardProps } from './AuthCard/types';

export { AuthFormField } from './AuthFormField/index';
export type { AuthFormFieldProps } from './AuthFormField/types';

export { GoogleSignIn, GoogleSignIn as GoogleSignInButton, useGoogleSignIn } from './GoogleSignIn/index';
export type { GoogleSignInProps } from './GoogleSignIn/types';

export { PasswordStrengthIndicator } from './PasswordStrengthIndicator/index';
export { SocialLoginButtons, ContinueWithSocial } from './SocialLoginButtons/index';
export { TermsFooter } from './TermsFooter/index';

// Protected Route
export { ProtectedRoute } from './ProtectedRoute';

// OAuth Error Handler
export { OAuthErrorHandler } from './OAuthErrorHandler/index';
export type { OAuthError } from './OAuthErrorHandler';

// Session Management
export { SessionTimeoutWarning } from './SessionTimeoutWarning/index';

// Sign Out
export { SignOutButton } from './SignOutButton/index';
export type { SignOutButtonProps } from './SignOutButton';

// Auth Screen Wrapper
export { AuthScreenWrapper } from './AuthScreenWrapper/index';

// Permission Guards
export { PermissionGuard } from './PermissionGuard';
export { HospitalPermissionGuard } from './HospitalPermissionGuard';

// Security Components
export { ActiveSessions } from './ActiveSessions/index';