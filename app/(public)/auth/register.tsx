import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Register, useRegister, AuthCard } from '@/components/blocks/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, checkEmail, isLoading, error } = useRegister();

  const handleRegister = async (data: any) => {
    try {
      await register(data);
      // Navigation is handled by useRegister hook based on user state
    } catch (error) {
      // Error is already handled by useRegister hook
      console.error('Registration error:', error);
    }
  };

  const handleCheckEmail = async (email: string) => {
    return checkEmail(email);
  };

  const handleSignIn = () => {
    router.push('/auth/login' as any);
  };

  try {
    return (
      <AuthCard
        title="Create Account"
        subtitle="Get started with your healthcare platform"
      >
        <Register
          onSubmit={handleRegister}
          onCheckEmail={handleCheckEmail}
          onSignIn={handleSignIn}
          isLoading={isLoading}
          error={error}
        />
      </AuthCard>
    );
  } catch (err) {
    console.error('RegisterScreen render error:', err);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text>Error loading register screen</Text>
        <Text style={{ marginTop: 10, color: 'red' }}>{err?.toString()}</Text>
      </View>
    );
  }
}