import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';
import { showErrorAlert, showSuccessAlert } from '@/lib/core/alert';
import { log } from '@/lib/core/debug/logger';
import { generateUUID } from '@/lib/core/crypto';
import { toAppUser } from '@/lib/stores/auth-store';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  organizationCode?: string;
  organizationName?: string;
  organizationId?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export function useRegister() {
  const { updateAuth, setLoading, setError } = useAuth();
  
  // Sign up mutation
  const signUpMutation = api.auth.signUp.useMutation({
    onSuccess: (data) => {
      log.auth.signup('Sign up successful via tRPC', { userId: data.user?.id });
      setLoading(false);
      
      if (data.user && data.token) {
        const appUser = toAppUser(data.user, data.user.role || 'user');
        
        const session = {
          id: generateUUID(),
          token: data.token,
          userId: appUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
        
        updateAuth(appUser, session);
        showSuccessAlert("Account Created", "Welcome to the app!");
      } else {
        console.error('[Register] No user or token in response');
        showErrorAlert("Registration Error", "Account created but login failed. Please login manually.");
      }
    },
    onError: (error) => {
      log.auth.error('Sign up failed', error);
      setLoading(false);
      setError(error.message);
      showErrorAlert("Signup Failed", error.message || "Failed to create account. Please try again.");
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  // Check if email exists
  const checkEmailMutation = api.auth.checkEmailExists.useMutation();

  const register = useCallback(async (data: RegisterData) => {
    log.auth.debug('Starting registration', { email: data.email, role: data.role });
    setLoading(true);
    setError(null);
    
    try {
      // Prepare signup data
      const signupData: any = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        acceptTerms: data.acceptTerms,
        acceptPrivacy: data.acceptPrivacy,
      };

      // Add organization data based on role
      if (data.organizationCode) {
        signupData.organizationCode = data.organizationCode;
      }
      if (data.organizationName) {
        signupData.organizationName = data.organizationName;
      }
      if (data.organizationId) {
        signupData.organizationId = data.organizationId;
      }

      await signUpMutation.mutateAsync(signupData);
      log.auth.signup('Registration process completed successfully');
    } catch (error: any) {
      log.auth.error('Registration process failed', error);
      throw error;
    }
  }, [signUpMutation, setLoading, setError]);

  const checkEmail = useCallback(async (email: string) => {
    try {
      const result = await checkEmailMutation.mutateAsync({ email });
      return { exists: result.exists };
    } catch (error) {
      log.error('Email check failed', 'AUTH', error);
      return { exists: false }; // Default to false on error
    }
  }, [checkEmailMutation]);

  return {
    register,
    checkEmail,
    isLoading: signUpMutation.isPending,
    error: signUpMutation.error?.message,
  };
}