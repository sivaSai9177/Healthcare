import React from 'react';
import { useRouter } from 'expo-router';
import { Register, useRegister, AuthScreenWrapper } from '@/components/blocks/auth';
import { logger } from '@/lib/core/debug/unified-logger';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, checkEmail, isLoading, error } = useRegister();
  
  React.useEffect(() => {
    logger.auth.debug('RegisterScreen mounted');
    return () => {
      logger.auth.debug('RegisterScreen unmounted');
    };
  }, []);

  const handleRegister = async (data: any) => {
    logger.auth.info('Registration attempt', { 
      email: data.email, 
      name: data.name,
      role: data.role,
      hasOrganizationCode: !!data.organizationCode,
      hasOrganizationName: !!data.organizationName
    });
    try {
      await register(data);
      // Navigation is handled by useRegister hook
    } catch (error) {
      // Error is already handled by useRegister hook
      logger.auth.error('Registration error', error);
    }
  };

  const handleCheckEmail = async (email: string) => {
    return checkEmail(email);
  };

  const handleSignIn = () => {
    logger.auth.info('Navigating to login');
    router.push('/(public)/auth/login');
  };

  return (
    <AuthScreenWrapper
      title="Create Account"
      subtitle="Join our platform"
      wideLayout
    >
      <Register
        onSubmit={handleRegister}
        onCheckEmail={handleCheckEmail}
        onSignIn={handleSignIn}
        isLoading={isLoading}
        error={error}
      />
    </AuthScreenWrapper>
  );
}