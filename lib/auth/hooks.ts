/**
 * Enhanced authentication hooks with security best practices
 * These hooks provide secure, type-safe authentication functionality
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { authClient, authClientEnhanced } from './auth-client';
import { sessionManager } from './auth-session-manager';
import { securityConfig } from './security-config';
import { log } from '../core/debug/logger';
import type { User, Session } from 'better-auth/types';

// Re-export the useSession hook from Better Auth
export { useSession } from 'better-auth/react';

/**
 * Enhanced session hook with security features
 */
export function useSecureSession() {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);
  const validationTimer = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const warningTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Get base session from Better Auth
  const { data: session, error, isPending } = authClient.useSession();
  
  // Track user activity for idle timeout
  const resetInactivityTimer = useCallback(() => {
    if (!securityConfig.session.idleTimeout.enabled) return;
    
    // Clear existing timers
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    
    // Set warning timer
    warningTimer.current = setTimeout(() => {
      log.warn('Session idle warning', 'AUTH_HOOKS', {
        timeUntilTimeout: securityConfig.session.idleTimeout.warning,
      });
      
      // You could show a warning modal here
      // showIdleWarning();
    }, securityConfig.session.idleTimeout.duration - securityConfig.session.idleTimeout.warning);
    
    // Set logout timer
    inactivityTimer.current = setTimeout(() => {
      log.info('Session expired due to inactivity', 'AUTH_HOOKS');
      handleSessionExpired('idle_timeout');
    }, securityConfig.session.idleTimeout.duration);
  }, []);
  
  // Handle session expiration
  const handleSessionExpired = useCallback(async (reason: string) => {
    try {
      await authClient.signOut();
      router.replace('/login?reason=' + reason);
    } catch (error) {
      log.error('Failed to handle session expiration', 'AUTH_HOOKS', { error });
    }
  }, [router]);
  
  // Validate session periodically
  const validateSession = useCallback(async () => {
    if (isValidating) return;
    
    setIsValidating(true);
    try {
      const validation = await authClientEnhanced.security.validateSession();
      
      if (!validation.valid) {
        log.warn('Session validation failed', 'AUTH_HOOKS', validation);
        handleSessionExpired(validation.reason || 'invalid_session');
      } else {
        setLastValidation(new Date());
        
        // Check if session is expiring soon
        const expiringSoon = await authClientEnhanced.security.isSessionExpiringSoon();
        if (expiringSoon) {
          log.info('Session expiring soon, attempting refresh', 'AUTH_HOOKS');
          await authClient.getSession(); // This will trigger a refresh if needed
        }
      }
    } catch (error) {
      log.error('Session validation error', 'AUTH_HOOKS', { error });
    } finally {
      setIsValidating(false);
    }
  }, [isValidating, handleSessionExpired]);
  
  // Set up periodic validation
  useEffect(() => {
    if (!session) return;
    
    // Initial validation
    validateSession();
    
    // Set up periodic validation
    const interval = setInterval(validateSession, 5 * 60 * 1000); // Every 5 minutes
    
    return () => {
      clearInterval(interval);
    };
  }, [session, validateSession]);
  
  // Track user activity (web only)
  useEffect(() => {
    if (Platform.OS !== 'web' || !session) return;
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });
    
    // Initial timer setup
    resetInactivityTimer();
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
    };
  }, [session, resetInactivityTimer]);
  
  // Handle app state changes (mobile only)
  useEffect(() => {
    if (Platform.OS === 'web' || !session) return;
    
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground, validate session
        validateSession();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [session, validateSession]);
  
  return {
    session,
    user: session?.user,
    isLoading: isPending,
    isValidating,
    error,
    lastValidation,
    // Utility functions
    refreshSession: validateSession,
    resetActivity: resetInactivityTimer,
  };
}

/**
 * Hook for handling authentication with security checks
 */
export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const signIn = useCallback(async (email: string, password: string, options?: {
    rememberMe?: boolean;
    deviceName?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Additional client-side validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Sign in with Better Auth
      const result = await authClient.signIn.email({
        email: email.toLowerCase().trim(),
        password,
        rememberMe: options?.rememberMe,
      });
      
      if (!result) {
        throw new Error('Sign in failed');
      }
      
      // Store session token for mobile
      if (Platform.OS !== 'web' && result.token) {
        await sessionManager.storeSession({
          token: result.token,
          userId: result.user.id,
        });
      }
      
      // Log successful sign in
      log.info('User signed in successfully', 'AUTH_HOOKS', {
        userId: result.user.id,
        email: result.user.email,
        rememberMe: options?.rememberMe,
      });
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Sign in failed';
      setError(errorMessage);
      log.error('Sign in error', 'AUTH_HOOKS', { error: errorMessage });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const signUp = useCallback(async (data: {
    email: string;
    password: string;
    name: string;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate password
      const passwordValidation = securityConfig.securityHelpers.isPasswordValid(data.password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join('. '));
      }
      
      // Check if email contains password
      if (data.password.toLowerCase().includes(data.email.split('@')[0].toLowerCase())) {
        throw new Error('Password cannot contain your email address');
      }
      
      // Sign up with Better Auth
      const result = await authClient.signUp.email({
        email: data.email.toLowerCase().trim(),
        password: data.password,
        name: data.name.trim(),
        data: {
          acceptedTerms: data.acceptTerms,
          acceptedPrivacy: data.acceptPrivacy,
          signupDate: new Date().toISOString(),
          signupSource: Platform.OS,
        },
      });
      
      if (!result) {
        throw new Error('Sign up failed');
      }
      
      // Store session token for mobile
      if (Platform.OS !== 'web' && result.token) {
        await sessionManager.storeSession({
          token: result.token,
          userId: result.user.id,
        });
      }
      
      log.info('User signed up successfully', 'AUTH_HOOKS', {
        userId: result.user.id,
        email: result.user.email,
      });
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Sign up failed';
      setError(errorMessage);
      log.error('Sign up error', 'AUTH_HOOKS', { error: errorMessage });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const signOut = useCallback(async (options?: { everywhere?: boolean }) => {
    setIsLoading(true);
    
    try {
      await authClientEnhanced.signOutEnhanced(options);
      
      // Clear any local state
      setError(null);
      
      // Redirect to login
      router.replace('/login');
      
      log.info('User signed out successfully', 'AUTH_HOOKS', {
        everywhere: options?.everywhere,
      });
    } catch (err: any) {
      log.error('Sign out error', 'AUTH_HOOKS', { error: err });
      // Still redirect even if sign out fails
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);
  
  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authClient.forgetPassword({
        email: email.toLowerCase().trim(),
        redirectTo: `${Platform.OS === 'web' ? window.location.origin : 'exp://localhost:8081'}/reset-password`,
      });
      
      log.info('Password reset email sent', 'AUTH_HOOKS', { email });
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send reset email';
      setError(errorMessage);
      log.error('Forgot password error', 'AUTH_HOOKS', { error: errorMessage });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate new password
      const passwordValidation = securityConfig.securityHelpers.isPasswordValid(newPassword);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join('. '));
      }
      
      await authClient.resetPassword({
        newPassword,
        token,
      });
      
      log.info('Password reset successfully', 'AUTH_HOOKS');
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reset password';
      setError(errorMessage);
      log.error('Reset password error', 'AUTH_HOOKS', { error: errorMessage });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const verifyEmail = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authClient.verifyEmail({
        token,
      });
      
      log.info('Email verified successfully', 'AUTH_HOOKS');
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to verify email';
      setError(errorMessage);
      log.error('Email verification error', 'AUTH_HOOKS', { error: errorMessage });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    signIn,
    signUp,
    signOut,
    forgotPassword,
    resetPassword,
    verifyEmail,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for checking user permissions
 */
export function usePermissions() {
  const { session } = useSecureSession();
  const user = session?.user as User & { role?: string };
  
  const hasRole = useCallback((role: string): boolean => {
    if (!user?.role) return false;
    return user.role === role;
  }, [user]);
  
  const hasAnyRole = useCallback((roles: string[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  }, [user]);
  
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user?.role) return false;
    
    // Define role-permission mapping
    const permissions: Record<string, string[]> = {
      admin: ['*'], // Admin has all permissions
      manager: [
        'view_dashboard',
        'manage_team',
        'view_reports',
        'manage_alerts',
        'view_analytics',
      ],
      user: [
        'view_dashboard',
        'view_own_data',
        'manage_own_profile',
        'create_alerts',
      ],
      guest: [
        'view_public_content',
      ],
    };
    
    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }, [user]);
  
  const isAuthenticated = !!session;
  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');
  const isUser = hasRole('user');
  const isGuest = hasRole('guest') || !user?.role;
  
  return {
    user,
    hasRole,
    hasAnyRole,
    hasPermission,
    isAuthenticated,
    isAdmin,
    isManager,
    isUser,
    isGuest,
  };
}

/**
 * Hook for protecting routes
 */
export function useRequireAuth(options?: {
  redirectTo?: string;
  allowedRoles?: string[];
  requiredPermission?: string;
}) {
  const router = useRouter();
  const { session, isLoading } = useSecureSession();
  const { hasAnyRole, hasPermission } = usePermissions();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (isLoading) return;
    
    // Not authenticated
    if (!session) {
      log.info('Unauthenticated access attempt', 'AUTH_HOOKS', {
        redirectTo: options?.redirectTo || '/login',
      });
      router.replace(options?.redirectTo || '/login');
      setIsAuthorized(false);
      return;
    }
    
    // Check role requirements
    if (options?.allowedRoles && !hasAnyRole(options.allowedRoles)) {
      log.warn('Unauthorized access attempt', 'AUTH_HOOKS', {
        userRole: (session.user as any).role,
        requiredRoles: options.allowedRoles,
      });
      router.replace('/unauthorized');
      setIsAuthorized(false);
      return;
    }
    
    // Check permission requirements
    if (options?.requiredPermission && !hasPermission(options.requiredPermission)) {
      log.warn('Insufficient permissions', 'AUTH_HOOKS', {
        userRole: (session.user as any).role,
        requiredPermission: options.requiredPermission,
      });
      router.replace('/unauthorized');
      setIsAuthorized(false);
      return;
    }
    
    setIsAuthorized(true);
  }, [session, isLoading, router, hasAnyRole, hasPermission, options]);
  
  return {
    isAuthorized,
    isLoading,
  };
}

/**
 * Hook for handling OAuth authentication
 */
export function useOAuthSignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const signInWithProvider = useCallback(async (provider: 'google' | 'apple' | 'github') => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: Platform.OS === 'web' 
          ? `${window.location.origin}/auth-callback`
          : 'exp://localhost:8081/auth-callback',
      });
      
      log.info('OAuth sign in initiated', 'AUTH_HOOKS', { provider });
    } catch (err: any) {
      const errorMessage = err.message || `Failed to sign in with ${provider}`;
      setError(errorMessage);
      log.error('OAuth sign in error', 'AUTH_HOOKS', { provider, error: errorMessage });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    signInWithGoogle: () => signInWithProvider('google'),
    signInWithApple: () => signInWithProvider('apple'),
    signInWithGitHub: () => signInWithProvider('github'),
    isLoading,
    error,
    clearError: () => setError(null),
  };
}