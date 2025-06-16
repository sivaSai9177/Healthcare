import React from 'react';
import { useRouter } from 'expo-router';
import { SignIn, useSignIn } from '@/components/blocks/auth';
import { logger } from '@/lib/core/debug/unified-logger';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, checkEmail, isLoading, error } = useSignIn();
  
  React.useEffect(() => {
    logger.auth.debug('LoginScreen mounted');
    return () => {
      logger.auth.debug('LoginScreen unmounted');
    };
  }, []);

  const handleSignIn = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    logger.auth.info('Sign in attempt', { email: data.email, rememberMe: data.rememberMe });
    try {
      await signIn(data);
      // Navigation is handled by useSignIn hook based on user state
    } catch (error) {
      // Error is already handled by useSignIn hook
      logger.auth.error('Sign in error', error);
    }
  };

  const handleForgotPassword = () => {
    logger.auth.info('Navigating to forgot password');
    router.push('/(public)/auth/forgot-password');
  };

  const handleSignUp = () => {
    logger.auth.info('Navigating to register');
    router.push('/(public)/auth/register');
  };

  const handleCheckEmail = async (email: string) => {
    return checkEmail(email);
  };

  return (
    <SignIn
      onSubmit={handleSignIn}
      onForgotPassword={handleForgotPassword}
      onSignUp={handleSignUp}
        onCheckEmail={handleCheckEmail}
        isLoading={isLoading}
        error={error}
      />
  );
}