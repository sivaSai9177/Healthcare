import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api/trpc';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';
import { log } from '@/lib/core/debug/logger';

interface UseForgotPasswordOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useForgotPassword(options: UseForgotPasswordOptions = {}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset password mutation
  const resetPasswordMutation = api.auth.resetPassword.useMutation({
    onSuccess: () => {
      log.auth.info('Password reset email sent successfully');
      showSuccessAlert(
        'Reset Email Sent',
        'If an account exists with this email, you will receive password reset instructions.'
      );
      setError(null);
      
      if (options.onSuccess) {
        options.onSuccess();
      } else {
        // Default behavior - navigate back after delay
        setTimeout(() => {
          router.back();
        }, 2000);
      }
    },
    onError: (error: any) => {
      log.auth.error('Password reset failed', error);
      const errorMessage = error.message || 'Failed to send reset email';
      setError(errorMessage);
      
      if (options.onError) {
        options.onError(errorMessage);
      } else {
        showErrorAlert('Error', errorMessage);
      }
    },
  });

  const sendResetEmail = useCallback(async (email: string) => {
    log.auth.debug('Password reset requested', { email });
    setIsLoading(true);
    setError(null);
    
    try {
      await resetPasswordMutation.mutateAsync({ email });
    } finally {
      setIsLoading(false);
    }
  }, [resetPasswordMutation]);

  const goBack = useCallback(() => {
    router.replace('/(auth)/login');
  }, [router]);

  return {
    sendResetEmail,
    goBack,
    isLoading: isLoading || resetPasswordMutation.isPending,
    error,
  };
}