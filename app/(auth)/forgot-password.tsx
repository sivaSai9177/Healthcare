import React from 'react';
import { ForgotPassword, useForgotPassword, AuthCard } from '@/components/blocks/auth';

export default function ForgotPasswordScreen() {
  const { sendResetEmail, goBack, isLoading, error } = useForgotPassword();

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