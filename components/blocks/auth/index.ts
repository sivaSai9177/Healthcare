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
export { SignIn } from './SignIn';
export { useSignIn } from './SignIn';
export type { SignInProps } from './SignIn/types';

export { Register } from './Register';
export { useRegister } from './Register';
export type { RegisterProps } from './Register/types';

export { ForgotPassword } from './ForgotPassword';
export { useForgotPassword } from './ForgotPassword';

export { VerifyEmail } from './VerifyEmail';
export { useVerifyEmail } from './VerifyEmail';

// Profile Completion
export { ProfileCompletionFlowMigrated as ProfileCompletionFlow } from './ProfileCompletion/ProfileCompletionFlowMigrated';

// Supporting Components
export { AuthCard } from './AuthCard';
export type { AuthCardProps } from './AuthCard/types';

export { AuthFormField } from './AuthFormField';
export type { AuthFormFieldProps } from './AuthFormField/types';

export { GoogleSignIn, GoogleSignIn as GoogleSignInButton } from './GoogleSignIn';
export { useGoogleSignIn } from './GoogleSignIn';
export type { GoogleSignInProps } from './GoogleSignIn/types';

export { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
export { SocialLoginButtons, ContinueWithSocial } from './SocialLoginButtons';
export { TermsFooter } from './TermsFooter';

// Protected Route
export { ProtectedRoute } from './ProtectedRoute';

// OAuth Error Handler
export { OAuthErrorHandler } from './OAuthErrorHandler';
export type { OAuthError } from './OAuthErrorHandler';

// Session Management
export { SessionTimeoutWarning } from './SessionTimeoutWarning';

// Sign Out
export { SignOutButton } from './SignOutButton';
export type { SignOutButtonProps } from './SignOutButton';

// Auth Screen Wrapper
export { AuthScreenWrapper } from './AuthScreenWrapper';