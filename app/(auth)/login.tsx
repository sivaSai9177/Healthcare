import React from 'react';
import { View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SignIn, useSignIn, AuthCard, ContinueWithSocial } from '@/components/blocks/auth';
import { Button } from '@/components/universal';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, checkEmail, isLoading, error } = useSignIn();

  const handleSignIn = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    try {
      await signIn(data);
      // Navigation is handled by useSignIn hook based on user state
    } catch (error) {
      // Error is already handled by useSignIn hook
      // TODO: Replace with structured logging
      // console.error('Sign in error:', error);
    }
  };

  // Social sign in will be implemented later
  // const handleSocialSignIn = async (provider: 'google' | 'apple' | 'facebook') => {
  //   try {
  //     await signInWithProvider(provider);
  //   } catch (error) {
  //     showErrorAlert('Social Sign In Failed', 'Please try again or use email/password');
  //   }
  // };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleSignUp = () => {
    router.push('/(auth)/register');
  };

  const handleCheckEmail = async (email: string) => {
    return checkEmail(email);
  };

  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Sign in to your account"
    >
      <View className="space-y-6">
        <ContinueWithSocial
          onProviderSelect={async (provider) => {
            // Social sign-in is now handled directly in SocialLoginButtons
// TODO: Replace with structured logging - console.log('Social sign-in:', provider);
          }}
          providers={['google']}
          dividerText="Or sign in with email"
        />
        
        <SignIn
          onSubmit={handleSignIn}
          onForgotPassword={handleForgotPassword}
          onSignUp={handleSignUp}
          onCheckEmail={handleCheckEmail}
          isLoading={isLoading}
          error={error}
        />
      </View>
      
      {/* Temporary button for debugging authentication issues */}
      {Platform.OS === 'web' && process.env.NODE_ENV === 'development' && (
        <View className="absolute bottom-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.push('/(modals)/clear-session')}
          >
            Clear Session (Debug)
          </Button>
        </View>
      )}
    </AuthCard>
  );
}