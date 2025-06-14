import React, { useState, useCallback, useMemo } from 'react';
import { View, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
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
import { 
  Input, 
  Button, 
  Text, 
  VStack, 
  HStack,
  ValidationIcon,
  Checkbox 
} from '@/components/universal';
import { Eye, EyeOff, Mail, Lock } from '@/components/universal/display/Symbols';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import { useDebounce } from '@/hooks/useDebounce';

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
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const email = form.watch('email');
  const password = form.watch('password');
  const debouncedEmail = useDebounce(email, 500);

  // Email validation
  const isValidEmail = useMemo(() => {
    try {
      z.string().email().parse(email);
      return true;
    } catch {
      return false;
    }
  }, [email]);

  // Check email existence
  React.useEffect(() => {
    if (onCheckEmail && debouncedEmail && isValidEmail) {
      setIsCheckingEmail(true);
      onCheckEmail(debouncedEmail)
        .then(({ exists }) => setEmailExists(exists))
        .catch(() => setEmailExists(null))
        .finally(() => setIsCheckingEmail(false));
    } else {
      setEmailExists(null);
    }
  }, [debouncedEmail, isValidEmail, onCheckEmail]);

  const handleSubmit = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      haptic('error');
      return;
    }

    haptic('light');
    const data = form.getValues();
    await onSubmit(data);
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

  const isFormValid = isValidEmail && password.length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={className}
    >
      <Animated.View
        entering={FadeIn.springify()}
        style={animatedFormStyle}
      >
        <VStack gap={spacing[4] as any}>
          {/* Error Message */}
          {error && (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <View className="p-3 bg-destructive/10 rounded-lg">
                <Text size="sm" className="text-destructive text-center">
                  {error}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Email Field */}
          <VStack gap={spacing[2] as any}>
            <Input
              label="Email"
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
                isCheckingEmail ? (
                  <View className="animate-pulse">
                    <ValidationIcon status="none" />
                  </View>
                ) : emailExists !== null ? (
                  <Animated.View entering={FadeIn}>
                    <ValidationIcon status={emailExists ? "success" : "error"} />
                  </Animated.View>
                ) : null
              }
            />
            {emailExists === false && (
              <Animated.View entering={FadeIn}>
                <Text size="xs" className="text-muted-foreground">
                  No account found with this email
                </Text>
              </Animated.View>
            )}
          </VStack>

          {/* Password Field */}
          <VStack gap={spacing[2] as any}>
            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              autoComplete="password"
              value={password}
              onChangeText={(text) => form.setValue('password', text)}
              onBlur={() => form.trigger('password')}
              error={form.formState.errors.password?.message}
              leftIcon={<Lock size={20} className="text-muted-foreground" />}
              rightElement={
                <Pressable onPress={togglePassword} className="p-2">
                  {showPassword ? (
                    <EyeOff size={20} className="text-muted-foreground" />
                  ) : (
                    <Eye size={20} className="text-muted-foreground" />
                  )}
                </Pressable>
              }
            />
          </VStack>

          {/* Remember Me & Forgot Password */}
          <HStack justify="between" align="center">
            {showRememberMe ? (
              <View className="flex-row items-center gap-2">
                <Checkbox
                  checked={form.watch('rememberMe') || false}
                  onCheckedChange={(checked: boolean) => form.setValue('rememberMe', checked)}
                />
                <Pressable onPress={() => form.setValue('rememberMe', !form.watch('rememberMe'))}>
                  <Text size="sm">Remember me</Text>
                </Pressable>
              </View>
            ) : (
              <View />
            )}
            
            {onForgotPassword && (
              <Pressable onPress={handleForgotPassword}>
                <Text size="sm" className="text-primary">
                  Forgot password?
                </Text>
              </Pressable>
            )}
          </HStack>

          {/* Submit Button */}
          <Button
            onPress={handleSubmit}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            isLoading={isLoading}
            disabled={!isFormValid || isLoading}
            size="lg"
            className={cn(
              "transition-all duration-200"
            )}
          >
            Sign In
          </Button>

          {/* Register Link */}
          {onSignUp && (
            <HStack justify="center" align="center" className="mt-4">
              <Text size="sm" colorTheme="mutedForeground">
                Don&apos;t have an account?
              </Text>
              <Pressable onPress={onSignUp} className="ml-1">
                <Text size="sm" className="text-primary">
                  Register
                </Text>
              </Pressable>
            </HStack>
          )}
        </VStack>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}