import React, { useState, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/stores/auth-store';
import { api } from '@/lib/api/trpc';
import {
  Text,
  Button,
  Card,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  useToast,
  VStack,
  HStack,
  Heading,
  Paragraph,
} from '@/components/universal';
import { Mail, ArrowLeft, RefreshCw } from '@/components/universal/Symbols';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';

import { log } from '@/lib/core/debug/logger';

// Import Input separately to avoid circular dependency
import { Input } from '@/components/universal/Input';

// Validation schema
const verifyEmailSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

type VerifyEmailData = z.infer<typeof verifyEmailSchema>;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const theme = useTheme();
  const spacing = useSpacing();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const email = params.email || user?.email;

  // Redirect if already verified
  useEffect(() => {
    if (user?.emailVerified) {
      log.auth.info('User already verified, redirecting');
      router.replace('/(home)');
    }
  }, [user, router]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const form = useForm<VerifyEmailData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: '',
    },
  });

  // Verify email mutation
  const verifyMutation = api.auth.verifyEmail.useMutation({
    onSuccess: () => {
      log.auth.info('Email verified successfully');
      showSuccessAlert('Email Verified', 'Your email has been verified successfully!');
      
      // Check if profile needs completion
      if (user?.needsProfileCompletion) {
        router.replace('/(auth)/complete-profile');
      } else {
        router.replace('/(home)');
      }
    },
    onError: (error) => {
      log.auth.error('Email verification failed', error);
      showErrorAlert('Verification Failed', error.message || 'Invalid verification code');
    },
  });

  // Resend code mutation
  const resendMutation = api.auth.resendVerificationEmail.useMutation({
    onSuccess: () => {
      log.auth.info('Verification email resent');
      toast({
        title: "Email Sent",
        description: "A new verification code has been sent to your email",
      });
      setCountdown(60); // 60 second cooldown
    },
    onError: (error) => {
      log.auth.error('Failed to resend verification email', error);
      showErrorAlert('Error', error.message || 'Failed to send verification email');
    },
  });

  const onSubmit = (data: VerifyEmailData) => {
    if (!email) {
      showErrorAlert('Error', 'Email address not found');
      return;
    }
    
    verifyMutation.mutate({
      email,
      code: data.code,
    });
  };

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    
    setResending(true);
    await resendMutation.mutateAsync({ email });
    setResending(false);
  };

  if (!email) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No email address provided</Text>
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={{ marginTop: spacing.md }}
        >
          <ArrowLeft size={20} />
          <Text>Go Back</Text>
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ 
        flex: 1, 
        padding: spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
      }}>
        <Card style={{ width: '100%', padding: spacing.xl }}>
          <VStack space={spacing.lg} style={{ alignItems: 'center' }}>
            {/* Icon */}
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.primary + '20',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Mail size={40} color={theme.colors.primary} />
            </View>

            {/* Header */}
            <VStack space={spacing.sm} style={{ alignItems: 'center' }}>
              <Heading size="lg">Verify Your Email</Heading>
              <Paragraph style={{ textAlign: 'center', color: theme.colors.mutedForeground }}>
                We&apos;ve sent a verification code to
              </Paragraph>
              <Text style={{ fontWeight: '600' }}>{email}</Text>
            </VStack>

            {/* Form */}
            <Form {...form}>
              <VStack space={spacing.md} style={{ width: '100%' }}>
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="123456"
                          keyboardType="numeric"
                          maxLength={6}
                          autoFocus
                          style={{ textAlign: 'center', fontSize: 24 }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  onPress={form.handleSubmit(onSubmit)}
                  loading={verifyMutation.isPending}
                  disabled={!form.formState.isValid}
                  style={{ width: '100%' }}
                >
                  Verify Email
                </Button>
              </VStack>
            </Form>

            {/* Resend Section */}
            <HStack space={spacing.xs} style={{ alignItems: 'center' }}>
              <Text style={{ color: theme.colors.mutedForeground }}>
                Didn&apos;t receive the code?
              </Text>
              <Button
                variant="link"
                size="sm"
                onPress={handleResend}
                disabled={countdown > 0 || resending}
              >
                {resending ? (
                  <ActivityIndicator size="small" />
                ) : countdown > 0 ? (
                  <Text>Resend in {countdown}s</Text>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <Text>Resend</Text>
                  </>
                )}
              </Button>
            </HStack>

            {/* Back to Login */}
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.replace('/(auth)/login')}
              style={{ marginTop: spacing.sm }}
            >
              <ArrowLeft size={16} />
              <Text>Back to Login</Text>
            </Button>
          </VStack>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}