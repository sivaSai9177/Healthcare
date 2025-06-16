import React, { useCallback, useMemo } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { Input } from '@/components/universal/form';
import { VStack, HStack } from '@/components/universal/layout';

import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import { useShadow } from '@/hooks/useShadow';
import { useResponsive } from '@/hooks/responsive';
import { useDebounce } from '@/hooks/useDebounce';
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
import { AuthCard } from '../AuthCard';

const AnimatedView = Animated.View;

// Icon components
const Mail = ({ size, className }: { size: number; className?: string }) => (
  <Symbols name="envelope.fill" size={size} className={className} />
);
const ArrowLeft = ({ size, className }: { size: number; className?: string }) => (
  <Symbols name="chevron.left" size={size} className={className} />
);

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordProps {
  onSubmit: (email: string) => Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function ForgotPassword({
  onSubmit,
  onBack,
  isLoading = false,
  error = null,
  className,
}: ForgotPasswordProps) {
  const { spacing } = useSpacing();
  const { isMobile } = useResponsive();
  
  // Icon animation
  const iconScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  React.useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withSpring(1.05, { damping: 2 }),
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

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
    },
  });

  const email = form.watch('email');
  const debouncedEmail = useDebounce(email, 300);

  // Email validation
  const isValidEmail = useMemo(() => {
    try {
      z.string().email().parse(debouncedEmail);
      return true;
    } catch {
      return false;
    }
  }, [debouncedEmail]);

  const handleSubmit = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      haptic('error');
      return;
    }

    haptic('light');
    const data = form.getValues();
    
    // Animate icon on submit
    iconRotation.value = withSpring(360, {}, () => {
      iconRotation.value = 0;
    });
    
    await onSubmit(data.email);
  }, [form, onSubmit, iconRotation]);

  const handleBack = useCallback(() => {
    haptic('light');
    onBack?.();
  }, [onBack]);

  const isFormValid = form.formState.isValid;

  return (
    <AuthCard
      title="Forgot Password?"
      subtitle="Enter your email address and we'll send you a link to reset your password"
      showImage={!isMobile}
      className={className}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <AnimatedView
          entering={FadeIn.springify()}
          className="w-full"
        >
          <VStack gap={spacing[6] as any}>
            {/* Icon */}
            <AnimatedView
              entering={SlideInDown.delay(200).springify()}
              style={animatedIconStyle}
              className="self-center"
            >
              <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
                <Text size="4xl">🔐</Text>
              </View>
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
            <AnimatedView entering={SlideInDown.delay(300).springify()}>
              <VStack gap={spacing[4] as any}>
                <Input
                  label="Email Address"
                  placeholder="your@email.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(text) => form.setValue('email', text)}
                  onBlur={() => form.trigger('email')}
                  error={form.formState.errors.email?.message}
                  leftIcon={<Mail size={20} className="text-muted-foreground" />}
                  rightElement={
                    form.formState.touchedFields.email && email ? (
                      <AnimatedView entering={FadeIn}>
                        <Symbols 
                          name={isValidEmail ? "checkmark.circle.fill" : "xmark.circle.fill"}
                          size={20} 
                          className={isValidEmail ? "text-success" : "text-destructive"}
                        />
                      </AnimatedView>
                    ) : null
                  }
                  className="animate-fade-in"
                />

                <Button
                  onPress={handleSubmit}
                  isLoading={isLoading}
                  disabled={!isFormValid || isLoading}
                  size="lg"
                  className="w-full animate-fade-in delay-100"
                >
                  {isLoading ? "Sending..." : "Send Reset Email"}
                </Button>
              </VStack>
            </AnimatedView>

            {/* Additional Information */}
            <AnimatedView entering={SlideInDown.delay(400).springify()}>
              <View className="p-4 bg-muted/50 rounded-lg">
                <Text size="xs" colorTheme="mutedForeground" className="text-center">
                  If an account exists with this email address, you will receive password reset instructions shortly.
                </Text>
              </View>
            </AnimatedView>

            {/* Back to Login */}
            {onBack && (
              <AnimatedView entering={SlideInDown.delay(500).springify()}>
                <HStack justify="center" align="center">
                  <Text size="sm" colorTheme="mutedForeground">
                    Remember your password?
                  </Text>
                  <Button
                    variant="link"
                    size="sm"
                    onPress={handleBack}
                    className="ml-1"
                  >
                    <HStack gap={1} align="center">
                      <ArrowLeft size={16} className="text-primary" />
                      <Text size="sm" className="text-primary">
                        Back to Login
                      </Text>
                    </HStack>
                  </Button>
                </HStack>
              </AnimatedView>
            )}
          </VStack>
        </AnimatedView>
      </KeyboardAvoidingView>
    </AuthCard>
  );
}