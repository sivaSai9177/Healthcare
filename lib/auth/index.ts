/**
 * Universal Authentication Module
 * Enhanced auth using better-auth with security best practices
 */

// Core authentication
export { authClient, authClientEnhanced } from './auth-client';
export type { AuthClient } from './auth-client';
export { sessionManager } from './auth-session-manager';

// Server-side authentication (only for server/API routes)
export { auth } from './auth-server';
export type { Auth } from './auth-server';

// Security configuration
export { securityConfig, securityHelpers } from './security-config';
export type { SecurityConfig } from './security-config';

// Authentication hooks
export {
  useSession,
  useSecureSession,
  useAuth,
  usePermissions,
  useRequireAuth,
  useOAuthSignIn,
} from './hooks';

// Legacy exports for backward compatibility
export { tokenRefreshManager } from './token-refresh-manager';
export { sessionTimeoutManager } from './session-timeout-manager';
export { SignOutManager, signOut, signOutAllDevices } from './signout-manager';
export type { SignOutOptions } from './signout-manager';

// Types
export type { Session, User } from 'better-auth/types';