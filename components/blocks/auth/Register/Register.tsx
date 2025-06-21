import React, { useState, useCallback } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Checkbox } from '@/components/universal/form';
import { Button } from '@/components/universal/interaction';
import { Text } from '@/components/universal/typography';
import { VStack, HStack } from '@/components/universal/layout';
import { Progress, ValidationIcon } from '@/components/universal/feedback';
import { 
  Mail, 
  Lock, 
  User,
  Shield,
  CheckCircle,
  Symbol
} from '@/components/universal/display/Symbols';
import { logger } from '@/lib/core/debug/unified-logger';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useResponsive } from '@/hooks/responsive';
import { haptic } from '@/lib/ui/haptics';
import Animated, { 
  FadeIn, 
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { RoleSelectorGrid } from '@/components/blocks/forms/RoleSelector/RoleSelectorGrid';
import { HealthcareRoleSelector } from '@/components/blocks/forms/RoleSelector/HealthcareRoleSelector';
import { OrganizationField } from '@/components/blocks/forms/OrganizationField/OrganizationField';
import { PasswordStrengthIndicator } from '@/components/blocks/auth/PasswordStrengthIndicator';
import { SocialLoginButtons } from '@/components/blocks/auth/SocialLoginButtons';
import { authStyles } from '@/components/blocks/auth/styles/authStyles';
import { useTheme } from '@/lib/theme/provider';
import type { UserRole } from '@/types/auth';

const AnimatedView = Animated.View;

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.string().min(1, 'Please select a role'),
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

// Healthcare roles are now directly used from HealthcareRoleSelector

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
}: RegisterProps) {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>();
  
  // Log component mount
  React.useEffect(() => {
    logger.auth.info('Register component mounted');
    return () => {
      logger.auth.info('Register component unmounted');
    };
  }, []);
  
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange', // Changed to onChange for immediate validation
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      organizationCode: undefined,
      organizationName: undefined,
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });

  const email = form.watch('email');
  const password = form.watch('password');
  
  // Use centralized email validation hook
  const { emailExists, isCheckingEmail, isValidEmail } = useEmailValidation(email, {
    onCheckEmail,
    debounceDelay: 500,
    minLength: 3
  });

  // Update form when role changes
  React.useEffect(() => {
    if (selectedRole) {
      form.setValue('role', selectedRole, { shouldValidate: true });
    }
  }, [selectedRole, form]);

  const handleSubmit = useCallback(async () => {
    logger.auth.info('Register submit button clicked');
    
    const isValid = await form.trigger();
    logger.auth.info('Register form validation result', { isValid, errors: form.formState.errors });
    
    if (!isValid) {
      logger.auth.warn('Register form validation failed', { errors: form.formState.errors });
      haptic('error');
      return;
    }

    haptic('light');
    const data = form.getValues();
    logger.auth.info('Register submitting form', { 
      name: data.name,
      email: data.email,
      role: data.role,
      hasOrgCode: !!data.organizationCode,
      hasOrgName: !!data.organizationName
    });
    
    try {
      await onSubmit(data);
      logger.auth.info('Register form submitted successfully');
    } catch (error) {
      logger.auth.error('Register form submission failed', error);
    }
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

  // Watch all form values to trigger validation
  const formValues = form.watch();
  
  // Calculate form validity based on actual values and validation state
  const isFormValid = React.useMemo(() => {
    const hasRequiredFields = !!(formValues.name && formValues.email && formValues.password && 
                                formValues.confirmPassword && selectedRole && 
                                formValues.acceptTerms && formValues.acceptPrivacy);
    
    const hasNoErrors = Object.keys(form.formState.errors).length === 0;
    const emailAvailable = emailExists === false || emailExists === null; // null means not checked yet
    
    return hasRequiredFields && hasNoErrors && emailAvailable;
  }, [formValues, form.formState.errors, selectedRole, emailExists]);
  
  // Log form state changes
  React.useEffect(() => {
    logger.auth.debug('Register form state changed', {
      hasRequiredFields: !!(formValues.name && formValues.email && formValues.password && 
                           formValues.confirmPassword && selectedRole && 
                           formValues.acceptTerms && formValues.acceptPrivacy),
      errors: Object.keys(form.formState.errors),
      selectedRole,
      emailExists,
      isFormValid,
      touchedFields: Object.keys(form.formState.touchedFields)
    });
  }, [formValues, form.formState.errors, selectedRole, emailExists, isFormValid]);

  return (
    <View style={{ width: '100%' }}>
      <AnimatedView
        entering={FadeIn.springify()}
        style={animatedFormStyle}
      >
        <VStack gap={spacing[3] as any}>
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

            {/* Social Login Section - Moved to top */}
            <VStack gap={spacing[3] as any}>
              {/* Social Buttons */}
              <SocialLoginButtons
                providers={['google']}
                onProviderSelect={(provider) => {
                  logger.auth.debug('Social sign-up selected', { provider });
                }}
                fullWidth
                buttonSize="lg"
                variant="outline"
              />
              
              {/* Divider */}
              <View style={{ position: 'relative', marginVertical: spacing[1] }}>
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
                      Or register with email
                    </Text>
                  </View>
                </View>
              </View>
            </VStack>

            {/* Form Fields */}
            <VStack gap={spacing[3] as any}>
              {/* Row 1: Name and Email Fields */}
              <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: spacing[2] }}>
                {/* Name Field */}
                <View style={isMobile ? { width: '100%' } : { flex: 1 }}>
                  <Input
                    id="register-name"
                    name="name"
                    floatingLabel={false}
                    label="Full Name"
                    placeholder="John Doe"
                    autoComplete="name"
                    value={form.watch('name')}
                    onChangeText={(text) => {
                      form.setValue('name', text, { shouldValidate: true });
                    }}
                    onBlur={() => form.trigger('name')}
                    error={form.formState.errors.name?.message}
                    leftElement={<User size={20} color={theme.mutedForeground} />}
                    rightElement={
                      form.formState.touchedFields.name && form.watch('name') && !form.formState.errors.name ? (
                        <CheckCircle size={20} color={theme.success || authStyles.colors.success} />
                      ) : null
                    }
                  />
                </View>

                {/* Email Field */}
                <View style={isMobile ? { width: '100%', marginTop: spacing[2] } : { flex: 1 }}>
                  <Input
                    id="register-email"
                    name="email"
                    floatingLabel={false}
                    label="Email"
                    placeholder="user@example.com"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={(text) => {
                      form.setValue('email', text, { shouldValidate: true });
                    }}
                    onBlur={() => form.trigger('email')}
                    error={form.formState.errors.email?.message || (emailExists ? "Email already exists" : undefined)}
                    leftElement={<Mail size={20} color={theme.mutedForeground} />}
                    rightElement={
                      isCheckingEmail ? (
                        <Text size="xs" style={{ color: theme.mutedForeground }}>Checking...</Text>
                      ) : emailExists !== null && email.length > 0 ? (
                        <ValidationIcon status={emailExists ? "error" : "success"} />
                      ) : null
                    }
                  />
                  {emailExists && onSignIn && (
                    <Pressable onPress={onSignIn} style={{ marginTop: spacing[0.5] }}>
                      <Text size="xs" style={{ color: authStyles.colors.primary }}>
                        Email already exists. Sign in instead?
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Row 2: Password Fields */}
              <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: spacing[2] }}>
                {/* Password Field */}
                <View style={isMobile ? { width: '100%' } : { flex: 1 }}>
                  <Input
                    id="register-password"
                    name="password"
                    floatingLabel={false}
                    label="Password"
                    placeholder="Create a password"
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    value={password}
                    onChangeText={(text) => {
                      form.setValue('password', text, { shouldValidate: true });
                      // Also trigger confirmPassword validation if it has a value
                      if (form.getValues('confirmPassword')) {
                        form.trigger('confirmPassword');
                      }
                    }}
                    onBlur={() => form.trigger('password')}
                    error={form.formState.errors.password?.message}
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

                {/* Confirm Password Field */}
                <View style={isMobile ? { width: '100%', marginTop: spacing[2] } : { flex: 1 }}>
                  <Input
                    id="register-confirm-password"
                    name="confirmPassword"
                    floatingLabel={false}
                    label="Confirm Password"
                    placeholder="Re-enter password"
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="off"
                    value={form.watch('confirmPassword')}
                    onChangeText={(text) => {
                      form.setValue('confirmPassword', text, { shouldValidate: true });
                    }}
                    onBlur={() => form.trigger('confirmPassword')}
                    error={form.formState.errors.confirmPassword?.message}
                    leftElement={<Shield size={20} color={theme.mutedForeground} />}
                    rightElement={
                      <Pressable 
                        onPress={toggleConfirmPassword} 
                        style={[{ padding: spacing[1] }, Platform.OS === 'web' ? { cursor: 'pointer' } as any : undefined]}
                      >
                        <Symbol 
                          name={showConfirmPassword ? 'eye.slash' : 'eye'} 
                          size={20} 
                          color={theme.mutedForeground} 
                        />
                      </Pressable>
                    }
                  />
                </View>
              </View>

              {/* Password Strength Indicator */}
              <View style={{ marginTop: -spacing[1], marginBottom: spacing[1] }}>
                <PasswordStrengthIndicator password={password} />
              </View>

              {/* Role Selection */}
              <AnimatedView entering={SlideInDown.delay(200).springify()}>
                <HealthcareRoleSelector
                  selectedRole={selectedRole}
                  onRoleSelect={(role) => {
                    setSelectedRole(role);
                  }}
                />
              </AnimatedView>

              {/* Organization Field */}
              {selectedRole && (
                <AnimatedView 
                  entering={SlideInDown.delay(300).springify()}
                  style={{ width: '100%', marginTop: -spacing[1] }}
                  pointerEvents="box-none"
                >
                  <OrganizationField
                    form={form}
                    role={selectedRole}
                  />
                </AnimatedView>
              )}

              {/* Terms and Privacy */}
              <AnimatedView entering={SlideInDown.delay(400).springify()}>
                <VStack gap={1}>
                  <HStack gap={2} align="start">
                    <Checkbox
                      checked={form.watch('acceptTerms')}
                      onCheckedChange={(checked) => form.setValue('acceptTerms', checked as boolean, { shouldValidate: true })}
                    />
                    <Pressable 
                      onPress={() => form.setValue('acceptTerms', !form.watch('acceptTerms'), { shouldValidate: true })}
                      style={{ flex: 1 }}
                    >
                      <Text size="sm" colorTheme="foreground">
                        I accept the{' '}
                        <Text size="sm" style={{ color: theme.primary, textDecorationLine: 'underline' }}>
                          Terms and Conditions
                        </Text>
                      </Text>
                      {form.formState.errors.acceptTerms && (
                        <Text size="xs" colorTheme="destructive">{form.formState.errors.acceptTerms.message}</Text>
                      )}
                    </Pressable>
                  </HStack>
                  
                  <HStack gap={2} align="start">
                    <Checkbox
                      checked={form.watch('acceptPrivacy')}
                      onCheckedChange={(checked) => form.setValue('acceptPrivacy', checked as boolean, { shouldValidate: true })}
                    />
                    <Pressable 
                      onPress={() => form.setValue('acceptPrivacy', !form.watch('acceptPrivacy'), { shouldValidate: true })}
                      style={{ flex: 1 }}
                    >
                      <Text size="sm" colorTheme="foreground">
                        I accept the{' '}
                        <Text size="sm" style={{ color: theme.primary, textDecorationLine: 'underline' }}>
                          Privacy Policy
                        </Text>
                      </Text>
                      {form.formState.errors.acceptPrivacy && (
                        <Text size="xs" colorTheme="destructive">{form.formState.errors.acceptPrivacy.message}</Text>
                      )}
                    </Pressable>
                  </HStack>
                </VStack>
              </AnimatedView>
            </VStack>

            {/* Submit Button */}
            <Button
              onPress={() => {
                logger.auth.info('Create Account button pressed', { isFormValid, isLoading });
                handleSubmit();
              }}
              isLoading={isLoading}
              disabled={!isFormValid || isLoading}
              variant={isFormValid && !isLoading ? "default" : "secondary"}
              size="lg"
              fullWidth
            >
              Create Account
            </Button>

            {/* Social login moved to top */}

            {/* Sign In Link */}
            {onSignIn && (
              <HStack justify="center" align="center">
                <Text size="sm" colorTheme="mutedForeground">
                  Already have an account?
                </Text>
                <Pressable onPress={onSignIn} style={{ marginLeft: spacing[1] }}>
                  <Text size="sm" style={{ color: theme.primary }}>
                    Sign in
                  </Text>
                </Pressable>
              </HStack>
            )}
          </VStack>
        </AnimatedView>
    </View>
  );
}