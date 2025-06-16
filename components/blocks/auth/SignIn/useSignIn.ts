import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';
import { showErrorAlert } from '@/lib/core/alert';
import { log } from '@/lib/core/debug/logger';
import { generateUUID } from '@/lib/core/crypto';
import { toAppUser } from '@/lib/stores/auth-store';
import { Platform } from 'react-native';

interface SignInData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export function useSignIn() {
  const { updateAuth, setLoading, setError } = useAuth();
  
  // Sign in mutation
  const signInMutation = api.auth.signIn.useMutation({
    onSuccess: async (data: any) => {
      log.auth.login('Sign in successful via tRPC', { userId: data?.user?.id });
      
      if (data?.user) {
        // Convert user to AppUser with safe defaults
        const appUser = toAppUser(data.user, 'user');

        // Update auth store with user and session - better-auth handles session storage
        const session = data.session || {
          id: data.sessionToken || generateUUID(),
          token: data.token || data.sessionToken,
          userId: appUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };
        updateAuth(appUser, session);
        
        // For mobile, manually store the token as Better Auth plugin might not be working
        if (Platform.OS !== 'web' && (data.token || data.sessionToken)) {
          const { mobileStorage } = require('@/lib/core/secure-storage');
          const token = data.token || data.sessionToken;
          
          // Store in multiple formats to ensure compatibility
          mobileStorage.setItem('better-auth_session-token', token);
          mobileStorage.setItem('better-auth.session-token', token);
          mobileStorage.setItem('better-auth_cookie', `better-auth.session-token=${token}; Path=/`);
          
          log.debug('Manually stored session token for mobile', 'SIGN_IN', {
            tokenPreview: token.substring(0, 20) + '...',
            storageKeys: ['better-auth_session-token', 'better-auth.session-token', 'better-auth_cookie']
          });
        }
        
        // Debug: Check cookies on web
        if (Platform.OS === 'web') {
          log.debug('Checking cookies after login', 'SIGN_IN', {
            allCookies: document.cookie,
            hasSessionCookie: document.cookie.includes('better-auth.session'),
            localStorage: {
              hasAuthStorage: !!localStorage.getItem('app-auth-storage'),
            }
          });
        }
        
        log.auth.login('Login successful - better-auth handles session storage');
      }
    },
    onError: (error) => {
      log.auth.error('Sign in failed', error);
      
      // Handle rate limiting and other specific errors
      let title = "Login Failed";
      let message = error.message || "Failed to sign in. Please check your credentials.";
      
      if (error.message?.includes('Too many requests') || error.message?.includes('Rate limit')) {
        title = "Too Many Attempts";
        message = "Please wait a few minutes before trying again.";
      } else if (error.message?.includes('We encountered an issue')) {
        // This is the generic Better Auth error - likely a session/cookie issue
        title = "Session Error";
        message = "There was an issue with your session. Please clear your browser data or try again in a few moments.";
      } else if (error.message?.includes('Invalid credentials')) {
        title = "Invalid Credentials";
        message = "The email or password you entered is incorrect.";
      }
      
      setError(message);
      showErrorAlert(title, message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const signIn = useCallback(async (data: SignInData) => {
    log.auth.debug('Starting login attempt', { email: data.email });
    
    // Check for recent logout on web to prevent session conflicts
    if (Platform.OS === 'web') {
      try {
        const lastLogoutStr = localStorage.getItem('last-logout-timestamp');
        if (lastLogoutStr) {
          const lastLogout = parseInt(lastLogoutStr, 10);
          const timeSinceLogout = Date.now() - lastLogout;
          
          // If logout was less than 2 seconds ago, wait a bit
          if (timeSinceLogout < 2000) {
            log.debug('Recent logout detected, adding delay', 'SIGN_IN', { timeSinceLogout });
            await new Promise(resolve => setTimeout(resolve, 2000 - timeSinceLogout));
          }
          
          // Clear the timestamp after checking
          localStorage.removeItem('last-logout-timestamp');
        }
      } catch (e) {
        // Ignore storage errors
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await signInMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });
      log.auth.login('Login process completed successfully');
    } catch (error: any) {
      log.auth.error('Login process failed', error);
      throw error;
    }
  }, [signInMutation, setLoading, setError]);

  const checkEmail = useCallback(async (_email: string) => {
    // For now, we'll just return a simple response since this is mainly for UX
    // The actual validation happens on the server during sign in
    return { exists: false };
  }, []);

  return {
    signIn,
    checkEmail,
    isLoading: signInMutation.isPending,
    error: signInMutation.error?.message,
  };
}