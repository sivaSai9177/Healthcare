import React from 'react';
import { ForgotPassword, useForgotPassword, AuthCard } from '@/components/blocks/auth';
import { logger } from '@/lib/core/debug/unified-logger';

export default function ForgotPasswordScreen() {
  const { sendResetEmail, goBack, isLoading, error } = useForgotPassword();
  
  React.useEffect(() => {
    logger.auth.debug('ForgotPasswordScreen mounted');
    return () => {
      logger.auth.debug('ForgotPasswordScreen unmounted');
    };
  }, []);

  return (
    <AuthCard
      title="Reset Password"
      subtitle="Enter your email to receive a password reset link"
    >
      <ForgotPassword
        onSubmit={sendResetEmail}
        onBack={goBack}
        isLoading={isLoading}
        error={error}
      />
    </AuthCard>
  );
}