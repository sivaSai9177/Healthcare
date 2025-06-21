import React, { useState, useCallback } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { 
  FadeIn, 
  FadeOut, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';
import { Input , Checkbox } from '@/components/universal/form';
import { Button } from '@/components/universal/interaction';
import { Text } from '@/components/universal/typography';
import { VStack, HStack } from '@/components/universal/layout';
import { Mail, Lock, Symbol } from '@/components/universal/display/Symbols';
import { ValidationIcon } from '@/components/universal/feedback';
import { logger } from '@/lib/core/debug/unified-logger';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { authStyles } from '@/components/blocks/auth/styles/authStyles';
import { useTheme } from '@/lib/theme/provider';
import { SocialLoginButtons } from '../SocialLoginButtons';

const AnimatedView = Animated.View;

// Validation schema
const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface SignInProps {
  onSubmit: (data: SignInFormData) => Promise<void>;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  onCheckEmail?: (email: string) => Promise<{ exists: boolean }>;
  isLoading?: boolean;
  error?: string | null;
  showRememberMe?: boolean;
  className?: string;
}

export function SignIn({
  onSubmit,
  onForgotPassword,
  onSignUp,
  onCheckEmail,
  isLoading = false,
  error = null,
  showRememberMe = true,
  className,
}: SignInProps) {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  
  // Log component mount
  React.useEffect(() => {
    logger.info('SignIn: Component mounted');
    return () => {
      logger.info('SignIn: Component unmounted');
    };
  }, []);
  
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange', // Changed to onChange for immediate validation
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const formValues = form.watch();
  const email = formValues.email || '';
  const password = formValues.password || '';
  
  // Use centralized email validation hook
  const { isValidEmail } = useEmailValidation(email, {
    onCheckEmail,
    debounceDelay: 500,
    minLength: 3
  });

  const handleSubmit = useCallback(async () => {
    logger.info('SignIn: Submit button clicked');
    
    const isValid = await form.trigger();
    logger.debug('SignIn: Form validation result', { isValid });
    
    if (!isValid) {
      logger.warn('SignIn: Form validation failed', { errors: Object.keys(form.formState.errors) });
      haptic('error');
      return;
    }

    haptic('light');
    const data = form.getValues();
    logger.debug('SignIn: Submitting form', { email: data.email, rememberMe: data.rememberMe });
    
    try {
      await onSubmit(data);
      logger.info('SignIn: Form submitted successfully');
    } catch (error) {
      logger.error('SignIn: Form submission failed', error);
    }
  }, [form, onSubmit]);

  const togglePassword = useCallback(() => {
    haptic('light');
    setShowPassword((prev) => !prev);
  }, []);

  const handleForgotPassword = useCallback(() => {
    haptic('light');
    onForgotPassword?.();
  }, [onForgotPassword]);

  // Animation for form
  const formScale = useSharedValue(1);
  const animatedFormStyle = useAnimatedStyle(() => ({
    transform: [{ scale: formScale.value }],
  }));

  const handlePressIn = () => {
    formScale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    formScale.value = withSpring(1);
  };

  // Calculate form validity based on actual values and validation state
  const isFormValid = React.useMemo(() => {
    const hasRequiredFields = !!(formValues.email && formValues.password);
    const hasNoErrors = Object.keys(form.formState.errors).length === 0;
    // For login: we don't need to check if email exists - that's what login will verify
    // Only check that email format is valid
    return hasRequiredFields && hasNoErrors && isValidEmail;
  }, [formValues, form.formState.errors, isValidEmail]);

  return (
    <View style={{ width: '100%' }}>
      <AnimatedView
        entering={FadeIn.springify()}
        style={animatedFormStyle}
      >
        <VStack gap={authStyles.spacing.sectionGap}>
          {/* Error Message */}
          {error && (
            <AnimatedView entering={FadeIn} exiting={FadeOut}>
              <View style={authStyles.patterns.errorBox}>
                <Text size="sm" style={{ color: authStyles.colors.destructive, textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            </AnimatedView>
          )}

          {/* Form Fields Section */}
          <VStack gap={authStyles.spacing.formGap}>
            {/* Email Field */}
            <View>
              <Input
                id="signin-email"
                name="email"
                label="Email"
                placeholder="your@email.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => form.setValue('email', text, { shouldValidate: true })}
                onBlur={() => form.trigger('email')}
                error={form.formState.errors.email?.message}
                floatingLabel={false}
                leftElement={<Mail size={20} color={theme.mutedForeground} />}
                rightElement={
                  email.length > 0 && isValidEmail ? (
                    <ValidationIcon status="success" />
                  ) : null
                }
              />
            </View>

            {/* Password Field */}
            <View>
              <Input
                id="signin-password"
                name="password"
                label="Password"
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                value={password}
                onChangeText={(text) => form.setValue('password', text, { shouldValidate: true })}
                onBlur={() => form.trigger('password')}
                error={form.formState.errors.password?.message}
                floatingLabel={false}
                leftElement={<Lock size={20} color={theme.mutedForeground} />}
                rightElement={
                  <Pressable 
                    onPress={togglePassword} 
                    style={[{ padding: spacing[1] }, Platform.OS === 'web' ? { cursor: 'pointer' } as any : undefined]}
                  >
                    <Symbol 
                      name={showPassword ? 'eye.slash' : 'eye'} 
                      size={20} 
                      color={theme.mutedForeground} 
                    />
                  </Pressable>
                }
              />
            </View>

            {/* Remember Me & Forgot Password */}
            <HStack justify="between" align="center" style={{ marginTop: -spacing[1] }}>
              {showRememberMe ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                  <Checkbox
                    checked={formValues.rememberMe || false}
                    onCheckedChange={(checked: boolean) => form.setValue('rememberMe', checked)}
                  />
                  <Pressable 
                    onPress={() => form.setValue('rememberMe', !formValues.rememberMe)}
                    style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : undefined}
                  >
                    <Text size="xs">Remember me</Text>
                  </Pressable>
                </View>
              ) : (
                <View />
              )}
              
              {onForgotPassword && (
                <Pressable 
                  onPress={handleForgotPassword}
                  style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : undefined}
                >
                  <Text size="xs" style={{ color: theme.primary }}>
                    Forgot password?
                  </Text>
                </Pressable>
              )}
            </HStack>
          </VStack>

          {/* Submit Button */}
          <Button
            onPress={handleSubmit}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            isLoading={isLoading}
            disabled={!isFormValid || isLoading}
            variant={isFormValid && !isLoading ? "default" : "secondary"}
            size="lg"
            fullWidth
          >
            Sign In
          </Button>

          {/* Social Login Section */}
          <VStack gap={authStyles.spacing.sectionGap}>
            {/* Divider */}
            <View style={{ position: 'relative', marginVertical: spacing[2] }}>
              <View style={{ 
                height: 1, 
                backgroundColor: theme.border || authStyles.colors.border,
                width: '100%' 
              }} />
              <View style={{ 
                position: 'absolute', 
                top: -10, 
                left: 0, 
                right: 0, 
                alignItems: 'center' 
              }}>
                <View style={{ 
                  backgroundColor: theme.background, 
                  paddingHorizontal: spacing[4] 
                }}>
                  <Text size="sm" colorTheme="mutedForeground">
                    Or continue with
                  </Text>
                </View>
              </View>
            </View>

            {/* Social Buttons */}
            <SocialLoginButtons
              providers={['google']}
              onProviderSelect={(provider) => {
                logger.auth.debug('Social sign-in selected', { provider });
              }}
              fullWidth
              buttonSize="lg"
              variant="outline"
            />
          </VStack>

          {/* Register Link */}
          {onSignUp && (
            <HStack justify="center" align="center">
              <Text size="sm" colorTheme="mutedForeground">
                Don&apos;t have an account?
              </Text>
              <Pressable 
                onPress={onSignUp} 
                style={[{ marginLeft: spacing[1] }, Platform.OS === 'web' ? { cursor: 'pointer' } as any : undefined]}
              >
                <Text size="sm" style={{ color: theme.primary }}>
                  Register
                </Text>
              </Pressable>
            </HStack>
          )}
        </VStack>
      </AnimatedView>
    </View>
  );
}