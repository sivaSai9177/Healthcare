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
      setError(error.message);
      showErrorAlert("Login Failed", error.message || "Failed to sign in. Please check your credentials.");
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const signIn = useCallback(async (data: SignInData) => {
    log.auth.debug('Starting login attempt', { email: data.email });
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