import React, { useState, useCallback, useMemo } from 'react';
import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Input, 
  Button, 
  Text, 
  VStack, 
  HStack,
  ValidationIcon,
  Checkbox,
  Progress
} from '@/components/universal';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User,
  Building2,
  Shield,
  CheckCircle
} from '@/components/universal/display/Symbols';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useResponsive } from '@/hooks/responsive';
import { haptic } from '@/lib/ui/haptics';
import Animated, { 
  FadeIn, 
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useDebounce } from '@/hooks/useDebounce';
import { RoleSelector } from '@/components/blocks/forms/RoleSelector/RoleSelector';
import { OrganizationField } from '@/components/blocks/forms/OrganizationField/OrganizationField';
import { PasswordStrengthIndicator } from '@/components/blocks/auth/PasswordStrengthIndicator';
import type { UserRole } from '@/types/auth';

const AnimatedView = Animated.View;

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.string().optional(),
  organizationCode: z.string().optional(),
  organizationName: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: 'You must accept the privacy policy',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  onCheckEmail?: (email: string) => Promise<{ exists: boolean }>;
  onSignIn?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}


export function Register({
  onSubmit,
  onCheckEmail,
  onSignIn,
  isLoading = false,
  error = null,
  className,
}: RegisterProps) {
  const { spacing } = useSpacing();
  const { isMobile, isTablet } = useResponsive();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>();
  
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: undefined,
      organizationCode: undefined,
      organizationName: undefined,
      acceptTerms: false,
      acceptPrivacy: false,
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

  // Update form when role changes
  React.useEffect(() => {
    form.setValue('role', selectedRole);
    form.trigger('role');
  }, [selectedRole, form]);

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

  const toggleConfirmPassword = useCallback(() => {
    haptic('light');
    setShowConfirmPassword((prev) => !prev);
  }, []);

  // Animation for form
  const formScale = useSharedValue(1);
  const animatedFormStyle = useAnimatedStyle(() => ({
    transform: [{ scale: formScale.value }],
  }));

  const isFormValid = form.formState.isValid && selectedRole && !emailExists;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={className}
      style={{ flex: 1 }}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatedView
          entering={FadeIn.springify()}
          style={animatedFormStyle}
          className="p-4"
        >
          <VStack gap={spacing[4] as any}>
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

            {/* Form Fields */}
            <VStack gap={spacing[3] as any}>
              {/* Name and Email Row */}
              <HStack gap={spacing[3] as any} className={isMobile ? "flex-col" : ""}>
                {/* Name Field */}
                <View className="flex-1">
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    autoComplete="name"
                    value={form.watch('name')}
                    onChangeText={(text) => form.setValue('name', text)}
                    onBlur={() => form.trigger('name')}
                    error={form.formState.errors.name?.message}
                    leftIcon={<User size={20} className="text-muted-foreground" />}
                    rightElement={
                      form.formState.touchedFields.name && form.watch('name') && !form.formState.errors.name ? (
                        <AnimatedView entering={FadeIn}>
                          <CheckCircle size={20} className="text-success" />
                        </AnimatedView>
                      ) : null
                    }
                    className="animate-fade-in"
                  />
                </View>

                {/* Email Field */}
                <View className="flex-1">
                  <Input
                    label="Email"
                    placeholder="user@example.com"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={(text) => form.setValue('email', text)}
                    onBlur={() => form.trigger('email')}
                    error={form.formState.errors.email?.message || (emailExists ? "Email already exists" : undefined)}
                    leftIcon={<Mail size={20} className="text-muted-foreground" />}
                    rightElement={
                      isCheckingEmail ? (
                        <View className="animate-pulse">
                          <ValidationIcon isValid={false} isLoading />
                        </View>
                      ) : emailExists !== null ? (
                        <AnimatedView entering={FadeIn}>
                          <ValidationIcon isValid={!emailExists} />
                        </AnimatedView>
                      ) : null
                    }
                    className="animate-fade-in delay-100"
                  />
                  {emailExists && onSignIn && (
                    <AnimatedView entering={FadeIn} className="mt-1">
                      <Pressable onPress={onSignIn}>
                        <Text size="xs" className="text-primary">
                          Email already exists. Sign in instead?
                        </Text>
                      </Pressable>
                    </AnimatedView>
                  )}
                </View>
              </HStack>

              {/* Password and Confirm Password Row */}
              <HStack gap={spacing[3] as any} className={isMobile ? "flex-col" : ""}>
                {/* Password Field */}
                <View className="flex-1">
                  <Input
                    label="Password"
                    placeholder="Create a password"
                    secureTextEntry={!showPassword}
                    autoComplete="password-new"
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
                    className="animate-fade-in delay-200"
                  />
                  <PasswordStrengthIndicator password={password} className="mt-2" />
                </View>

                {/* Confirm Password Field */}
                <View className="flex-1">
                  <Input
                    label="Confirm Password"
                    placeholder="Re-enter password"
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="password-new"
                    value={form.watch('confirmPassword')}
                    onChangeText={(text) => form.setValue('confirmPassword', text)}
                    onBlur={() => form.trigger('confirmPassword')}
                    error={form.formState.errors.confirmPassword?.message}
                    leftIcon={<Shield size={20} className="text-muted-foreground" />}
                    rightElement={
                      <Pressable onPress={toggleConfirmPassword} className="p-2">
                        {showConfirmPassword ? (
                          <EyeOff size={20} className="text-muted-foreground" />
                        ) : (
                          <Eye size={20} className="text-muted-foreground" />
                        )}
                      </Pressable>
                    }
                    className="animate-fade-in delay-300"
                  />
                </View>
              </HStack>

              {/* Role Selection */}
              <AnimatedView entering={SlideInDown.delay(400).springify()}>
                <RoleSelector
                  selectedRole={selectedRole}
                  onRoleSelect={setSelectedRole}
                />
              </AnimatedView>

              {/* Organization Field */}
              {selectedRole && (
                <AnimatedView entering={SlideInDown.delay(500).springify()}>
                  <OrganizationField
                    form={form}
                    role={selectedRole}
                  />
                </AnimatedView>
              )}

              {/* Terms and Privacy */}
              <AnimatedView entering={SlideInDown.delay(600).springify()}>
                <VStack gap={spacing[2] as any}>
                  <Checkbox
                    checked={form.watch('acceptTerms')}
                    onCheckedChange={(checked) => form.setValue('acceptTerms', checked as boolean)}
                    label={
                      <Text size="sm">
                        I accept the{' '}
                        <Text size="sm" className="text-primary underline">
                          Terms and Conditions
                        </Text>
                      </Text>
                    }
                    error={form.formState.errors.acceptTerms?.message}
                  />
                  
                  <Checkbox
                    checked={form.watch('acceptPrivacy')}
                    onCheckedChange={(checked) => form.setValue('acceptPrivacy', checked as boolean)}
                    label={
                      <Text size="sm">
                        I accept the{' '}
                        <Text size="sm" className="text-primary underline">
                          Privacy Policy
                        </Text>
                      </Text>
                    }
                    error={form.formState.errors.acceptPrivacy?.message}
                  />
                </VStack>
              </AnimatedView>
            </VStack>

            {/* Submit Button */}
            <Button
              onPress={handleSubmit}
              isLoading={isLoading}
              disabled={!isFormValid || isLoading}
              size="lg"
              className={cn(
                "animate-fade-in delay-700",
                "transition-all duration-200"
              )}
            >
              Create Account
            </Button>

            {/* Sign In Link */}
            {onSignIn && (
              <HStack justify="center" align="center" className="animate-fade-in delay-800">
                <Text size="sm" colorTheme="mutedForeground">
                  Already have an account?
                </Text>
                <Pressable onPress={onSignIn}>
                  <Text size="sm" className="text-primary ml-1">
                    Sign in
                  </Text>
                </Pressable>
              </HStack>
            )}
          </VStack>
        </AnimatedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}