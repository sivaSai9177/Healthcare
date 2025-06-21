import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SignIn, AuthCard, useSignIn } from '@/components/blocks/auth';
import { Button } from '@/components/universal';
import { useError } from '@/components/providers/ErrorProvider';
import { useAsyncError } from '@/hooks/useAsyncError';
import { logger } from '@/lib/core/debug/unified-logger';

export default function LoginScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ reason?: string }>();
  const { signIn, checkEmail, isLoading, error } = useSignIn();
  const { clearError } = useError();
  const { executeAsync } = useAsyncError({
    retries: 2,
    retryDelay: 1000,
  });

  // Log the reason for redirect if present
  useEffect(() => {
    if (searchParams.reason) {
      logger.auth.debug('Login screen accessed with reason', {
        reason: searchParams.reason,
        platform: Platform.OS
      });
    }
  }, [searchParams.reason]);

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSignIn = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    await executeAsync(
      async () => {
        await signIn(data);
        // Navigation is handled by useSignIn hook based on user state
      },
      'authentication'
    );
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password' as any);
  };

  const handleSignUp = () => {
    router.push('/auth/register' as any);
  };

  const handleCheckEmail = async (email: string) => {
    return checkEmail(email);
  };

  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Sign in to your account"
    >
      <SignIn
        onSubmit={handleSignIn}
        onForgotPassword={handleForgotPassword}
        onSignUp={handleSignUp}
        onCheckEmail={handleCheckEmail}
        isLoading={isLoading}
        error={error}
      />
      
      {/* Temporary button for debugging authentication issues */}
      {Platform.OS === 'web' && process.env.NODE_ENV === 'development' && (
        <View className="absolute bottom-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.push('/clear-session' as any)}
          >
            Clear Session (Debug)
          </Button>
        </View>
      )}
    </AuthCard>
  );
}