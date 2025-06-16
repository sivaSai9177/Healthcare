import React, { useState, useEffect, useCallback } from 'react';
import { View, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { Input } from '@/components/universal/form';
import { VStack, HStack } from '@/components/universal/layout';

const Mail = ({ size, className }: { size: number; className?: string }) => (
  <Symbols name="envelope.fill" size={size} className={className} />
);
const ArrowLeft = ({ size, className }: { size: number; className?: string }) => (
  <Symbols name="chevron.left" size={size} className={className} />
);
const RefreshCw = ({ size, className }: { size: number; className?: string }) => (
  <Symbols name="arrow.clockwise" size={size} className={className} />
);
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import { useShadow } from '@/hooks/useShadow';
import { useResponsive } from '@/hooks/responsive';
import Animated, { 
  FadeIn, 
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence
} from 'react-native-reanimated';

const AnimatedView = Animated.View;

// Validation schema
const verifyEmailSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

type VerifyEmailData = z.infer<typeof verifyEmailSchema>;

interface VerifyEmailProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function VerifyEmail({
  email,
  onVerify,
  onResend,
  onBack,
  isLoading = false,
  error = null,
  className,
}: VerifyEmailProps) {
  const { spacing } = useSpacing();
  const shadowLg = useShadow({ size: 'lg' });
  const { isMobile } = useResponsive();
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Icon animation
  const iconScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withSpring(1.1, { damping: 2 }),
        withSpring(1, { damping: 2 })
      ),
      -1,
      true
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` }
    ] as any,
  }));

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const form = useForm<VerifyEmailData>({
    resolver: zodResolver(verifyEmailSchema),
    mode: 'onChange',
    defaultValues: {
      code: '',
    },
  });

  const handleSubmit = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      haptic('error');
      return;
    }

    haptic('light');
    const data = form.getValues();
    await onVerify(data.code);
  }, [form, onVerify]);

  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    
    haptic('light');
    setResending(true);
    iconRotation.value = withSpring(360);
    
    try {
      await onResend();
      setCountdown(60); // 60 second cooldown
      setTimeout(() => {
        iconRotation.value = 0;
      }, 500);
    } finally {
      setResending(false);
    }
  }, [countdown, onResend, iconRotation]);

  const handleBack = useCallback(() => {
    haptic('light');
    onBack?.();
  }, [onBack]);

  // Auto-submit when 6 digits are entered
  const code = form.watch('code');
  useEffect(() => {
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      handleSubmit();
    }
  }, [code, handleSubmit]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={cn("flex-1", className)}
    >
      <View className="flex-1 items-center justify-center p-4">
        <AnimatedView
          entering={FadeIn.springify()}
          className={cn(
            "w-full",
            isMobile ? "max-w-sm" : "max-w-md"
          )}
        >
          <View 
            className="bg-card rounded-2xl p-8"
            style={shadowLg as any}
          >
            <VStack gap={spacing[6] as any} align="center">
              {/* Icon */}
              <AnimatedView
                entering={SlideInDown.delay(200).springify()}
                style={animatedIconStyle}
              >
                <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
                  <Mail size={40} className="text-primary" />
                </View>
              </AnimatedView>

              {/* Header */}
              <AnimatedView entering={SlideInDown.delay(300).springify()}>
                <VStack gap={spacing[2] as any} align="center">
                  <Text size="2xl" weight="bold" className="text-center">
                    Verify Your Email
                  </Text>
                  <Text size="sm" colorTheme="mutedForeground" className="text-center">
                    We've sent a verification code to
                  </Text>
                  <Text size="base" weight="semibold" className="text-center">
                    {email}
                  </Text>
                </VStack>
              </AnimatedView>

              {/* Error Message */}
              {error && (
                <AnimatedView entering={FadeIn} exiting={FadeOut}>
                  <View className="p-3 bg-destructive/10 rounded-lg">
                    <Text size="sm" className="text-destructive text-center">
                      {error}
                    </Text>
                  </View>
                </AnimatedView>
              )}

              {/* Form */}
              <AnimatedView 
                entering={SlideInDown.delay(400).springify()}
                className="w-full"
              >
                <VStack gap={spacing[4] as any}>
                  <Input
                    label="Verification Code"
                    placeholder="123456"
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus
                    value={form.watch('code')}
                    onChangeText={(text) => {
                      // Only allow digits
                      const cleaned = text.replace(/[^\d]/g, '');
                      form.setValue('code', cleaned);
                      form.trigger('code');
                    }}
                    error={form.formState.errors.code?.message}
                    className="text-center text-2xl font-mono"
                    autoComplete="one-time-code"
                  />

                  <Button
                    onPress={handleSubmit}
                    isLoading={isLoading}
                    disabled={!form.formState.isValid || isLoading}
                    size="lg"
                    className="w-full"
                  >
                    Verify Email
                  </Button>
                </VStack>
              </AnimatedView>

              {/* Resend Section */}
              <AnimatedView entering={SlideInDown.delay(500).springify()}>
                <HStack gap={2} align="center">
                  <Text size="sm" colorTheme="mutedForeground">
                    Didn't receive the code?
                  </Text>
                  <Button
                    variant="link"
                    size="sm"
                    onPress={handleResend}
                    disabled={countdown > 0 || resending}
                    className="relative"
                  >
                    {resending ? (
                      <ActivityIndicator size="small" />
                    ) : countdown > 0 ? (
                      <Text size="sm" className="text-primary">
                        Resend in {countdown}s
                      </Text>
                    ) : (
                      <HStack gap={1} align="center">
                        <RefreshCw size={16} className="text-primary" />
                        <Text size="sm" className="text-primary">
                          Resend
                        </Text>
                      </HStack>
                    )}
                  </Button>
                </HStack>
              </AnimatedView>

              {/* Back Button */}
              {onBack && (
                <AnimatedView entering={SlideInDown.delay(600).springify()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={handleBack}
                    className="mt-2"
                  >
                    <HStack gap={2} align="center">
                      <ArrowLeft size={16} className="text-muted-foreground" />
                      <Text size="sm" colorTheme="mutedForeground">
                        Back to Login
                      </Text>
                    </HStack>
                  </Button>
                </AnimatedView>
              )}
            </VStack>
          </View>
        </AnimatedView>
      </View>
    </KeyboardAvoidingView>
  );
}