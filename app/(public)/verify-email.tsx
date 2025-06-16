import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VerifyEmail, useVerifyEmail, AuthCard } from '@/components/blocks/auth';
import { View, Text } from 'react-native';
import { Button } from '@/components/universal';
import { logger } from '@/lib/core/debug/unified-logger';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { verify, resend, goBack, isLoading, isResending, error, email } = useVerifyEmail({
    email: params.email,
  });
  
  React.useEffect(() => {
    logger.auth.debug('VerifyEmailScreen mounted', { email: params.email });
    return () => {
      logger.auth.debug('VerifyEmailScreen unmounted');
    };
  }, [params.email]);

  // If no email is available, show error
  if (!email) {
    return (
      <AuthCard
        title="Email Required"
        subtitle="Please provide an email address"
      >
        <View className="items-center justify-center">
          <Text className="text-muted-foreground mb-6 text-center">
            Please return to the registration screen and try again.
          </Text>
          <Button onPress={() => router.replace('/(auth)/register')} fullWidth>
            Back to Register
          </Button>
        </View>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verify Your Email"
      subtitle="We sent a verification code to your email"
    >
      <VerifyEmail
        email={email}
        onVerify={verify}
        onResend={resend}
        onBack={goBack}
        isLoading={isLoading}
        error={error}
      />
    </AuthCard>
  );
}