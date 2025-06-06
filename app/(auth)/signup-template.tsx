import React from "react";
import { TouchableOpacity, Pressable } from "react-native";
import { Link } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { toAppUser } from "@/lib/stores/auth-store";
import { api } from "@/lib/trpc";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { showErrorAlert, showSuccessAlert } from "@/lib/core/alert";
import { log } from "@/lib/core/logger";
import { generateUUID } from "@/lib/core/crypto";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { RoleSelector, UserRole } from "@/components/RoleSelector";
import { OrganizationField } from "@/components/OrganizationField";
import { useTheme } from "@/lib/theme/theme-provider";
import { Container } from "@/components/universal/Container";
import { ValidationIcon } from "@/components/ui/ValidationIcon";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Box } from "@/components/universal/Box";
import { Text, Heading2, Caption } from "@/components/universal/Text";
import { VStack, HStack } from "@/components/universal/Stack";
import { Button } from "@/components/universal/Button";
import { Input } from "@/components/universal/Input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/universal/Card";
import { Checkbox } from "@/components/universal/Checkbox";

export default function SignupScreen() {
  const { updateAuth, setLoading, setError } = useAuth();
  const theme = useTheme();
  const [selectedRole, setSelectedRole] = React.useState<UserRole>(); // No default - user must choose
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Use tRPC mutation for sign up
  const signUpMutation = api.auth.signUp.useMutation({
    onSuccess: (data: any) => {
      log.auth.signup('Sign up successful via tRPC', { userId: data.user?.id });
      setLoading(false); // Ensure loading is cleared on success
      if (data.user) {
        // Convert user to AppUser with form values as fallback
        const formRole = form.getValues('role') as 'admin' | 'manager' | 'user' | 'guest';
        const appUser = toAppUser(data.user, formRole || 'user');
        // Ensure organizationId from form is preserved if not in user data
        if (!appUser.organizationId && form.getValues('organizationId')) {
          appUser.organizationId = form.getValues('organizationId');
        }

        // Create a session for the new user
        const session = {
          id: generateUUID(),
          token: 'new-user-session', // This would come from Better Auth in a real setup
          userId: appUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };
        updateAuth(appUser, session);
        showSuccessAlert("Account Created", "Welcome to the app!");
      }
    },
    onError: (error) => {
      log.auth.error('Sign up failed', error);
      setLoading(false); // Ensure loading is cleared on error
      setError(error.message);
      showErrorAlert("Signup Failed", error.message || "Failed to create account. Please try again.");
    },
    onSettled: () => {
      setLoading(false); // Fallback to ensure loading is always cleared
    },
  });

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    mode: "onTouched", // Validate on blur, not on every change
    reValidateMode: "onChange", // Re-validate on change after first validation
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined, // User must select a role
      organizationCode: undefined,
      organizationName: undefined,
      organizationId: undefined,
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });

  // Ensure role is synced with form when state changes
  React.useEffect(() => {
    form.setValue('role', selectedRole);
    form.trigger('role');
  }, [selectedRole]); // Removed form from dependencies as it's stable

  // Watch form values
  const acceptTerms = form.watch('acceptTerms');
  const acceptPrivacy = form.watch('acceptPrivacy');
  const formValues = form.watch();
  
  // Check if form has minimum valid values for enabling button
  const hasValidValues = React.useMemo(() => {
    const { name, email, password, confirmPassword, role } = formValues;
    
    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasName = name && name.length >= 2;
    const hasValidEmail = email && emailRegex.test(email);
    const hasPassword = password && password.length >= 12;
    const passwordsMatch = password === confirmPassword;
    const hasRole = !!role;
    
    return hasName && hasValidEmail && hasPassword && passwordsMatch && hasRole && acceptTerms && acceptPrivacy;
  }, [formValues, acceptTerms, acceptPrivacy]);
  
  // Debug form state
  React.useEffect(() => {
    const isButtonDisabled = signUpMutation.isPending || !hasValidValues;
    log.auth.debug('Form state', {
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      values: formValues,
      acceptTerms,
      acceptPrivacy,
      isButtonDisabled,
      isPending: signUpMutation.isPending,
      hasValidValues
    });
  }, [form.formState.isValid, form.formState.errors, acceptTerms, acceptPrivacy, formValues, signUpMutation.isPending, hasValidValues]);

  const onSubmit = async (data: SignUpInput) => {
    log.auth.signup('Starting signup attempt', { email: data.email });
    
    // Check if form has validation errors before submitting
    if (!form.formState.isValid) {
      log.auth.debug('Form has validation errors, preventing submission', { 
        errors: form.formState.errors 
      });
      showErrorAlert("Invalid Form", "Please fix the validation errors before submitting.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare submission data based on role
      const submissionData: any = {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        acceptTerms: data.acceptTerms,
        acceptPrivacy: data.acceptPrivacy,
        organizationId: data.organizationId || undefined,
      };

      // Add organization fields based on role
      if (data.role === 'user' && data.organizationCode) {
        submissionData.organizationCode = data.organizationCode;
      }
      
      if ((data.role === 'manager' || data.role === 'admin') && data.organizationName) {
        submissionData.organizationName = data.organizationName;
      }

      log.auth.signup('Submitting with role-based data', { 
        role: data.role, 
        hasOrgCode: !!data.organizationCode,
        hasOrgName: !!data.organizationName
      });

      await signUpMutation.mutateAsync(submissionData);
      
      log.auth.signup('Signup process completed', { email: data.email });
      // Navigation will be handled by Expo Router's protected routes
      
    } catch (error: any) {
      log.auth.error('Signup error', error);
      setLoading(false); // Ensure loading state is cleared
      setError(error.message || "Failed to create account");
      // Error handling is done in the mutation's onError
      // Clear the form password on error
      form.setValue("password", "");
      form.setValue("confirmPassword", "");
    }
  };

  return (
    <Container 
      safe
      scroll
      maxWidth="sm"
      centered
      scrollProps={{
        keyboardShouldPersistTaps: 'handled',
        showsVerticalScrollIndicator: false,
      }}
    >
      <VStack p={4} pb={10} pt={2}>
        <Card>
          <CardHeader>
            <VStack spacing={1} alignItems="center">
              <CardTitle>Create an account</CardTitle>
              <CardDescription>Join our platform</CardDescription>
            </VStack>
          </CardHeader>
          <CardContent>
            <VStack spacing={4}>
              <Input
                label="Full Name"
                placeholder="John Doe"
                autoComplete="name"
                error={form.formState.errors.name?.message}
                success={form.formState.touchedFields.name && !form.formState.errors.name && !!form.watch('name')}
                hint="Enter your full name"
                value={form.watch('name')}
                onChangeText={(text) => {
                  form.setValue('name', text);
                  if (form.formState.touchedFields.name) {
                    form.trigger('name');
                  }
                }}
                onBlur={() => {
                  form.trigger('name');
                }}
                leftElement={
                  <IconSymbol 
                    name="person.fill" 
                    size={20} 
                    color={theme.mutedForeground}
                  />
                }
                rightElement={
                  form.formState.touchedFields.name && form.watch('name') ? (
                    <ValidationIcon 
                      status={form.formState.errors.name ? 'error' : 'success'} 
                    />
                  ) : null
                }
              />

              <Input
                label="Email"
                placeholder="user@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                error={form.formState.errors.email?.message}
                success={form.formState.touchedFields.email && !form.formState.errors.email && !!form.watch('email')}
                hint="Use your email address"
                value={form.watch('email')}
                onChangeText={(text) => {
                  form.setValue('email', text);
                  if (form.formState.touchedFields.email) {
                    form.trigger('email');
                  }
                }}
                onBlur={() => {
                  form.trigger('email');
                }}
                leftElement={
                  <IconSymbol 
                    name="envelope.fill" 
                    size={20} 
                    color={theme.mutedForeground}
                  />
                }
                rightElement={
                  form.formState.touchedFields.email && form.watch('email') ? (
                    <ValidationIcon 
                      status={form.formState.errors.email ? 'error' : 'success'} 
                    />
                  ) : null
                }
              />

              <RoleSelector
                selectedRole={selectedRole}
                onRoleSelect={(role) => {
                  setSelectedRole(role);
                  form.setValue('role', role);
                  // Clear organization fields when role changes
                  if (role === 'guest') {
                    form.setValue('organizationCode', undefined);
                    form.setValue('organizationName', undefined);
                  } else if (role === 'user') {
                    form.setValue('organizationCode', '');
                    form.setValue('organizationName', undefined);
                  } else if (role === 'manager' || role === 'admin') {
                    form.setValue('organizationCode', undefined);
                    form.setValue('organizationName', '');
                  }
                  // Trigger full form validation after role change
                  setTimeout(() => form.trigger(), 0);
                }}
              />

              <OrganizationField
                form={form}
                role={selectedRole}
              />

              <Box>
                <Input
                  label="Password"
                  placeholder="••••••••••••"
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  error={form.formState.errors.password?.message}
                  success={form.formState.touchedFields.password && !form.formState.errors.password && !!form.watch('password')}
                  hint="12+ chars with uppercase, lowercase, number & special character"
                  value={form.watch('password')}
                  onChangeText={(text) => {
                    form.setValue('password', text);
                    if (form.formState.touchedFields.password) {
                      form.trigger('password');
                    }
                  }}
                  onBlur={() => {
                    form.trigger('password');
                  }}
                  leftElement={
                    <IconSymbol 
                      name="lock.fill" 
                      size={20} 
                      color={theme.mutedForeground}
                    />
                  }
                  rightElement={
                    <Box flexDirection="row" alignItems="center" gap={2}>
                      {form.formState.touchedFields.password && form.watch('password') && (
                        <ValidationIcon 
                          status={form.formState.errors.password ? 'error' : 'success'} 
                        />
                      )}
                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ padding: 4 }}
                      >
                        <IconSymbol 
                          name={showPassword ? 'eye.slash.fill' : 'eye.fill' as any} 
                          size={20} 
                          color={theme.mutedForeground}
                        />
                      </Pressable>
                    </Box>
                  }
                />
                
                {/* Password strength indicators */}
                {form.watch('password') && (
                  <Box mt={2}>
                    <Box flexDirection="row" flexWrap="wrap" gap={2}>
                      <Box 
                        px={2} 
                        py={1} 
                        rounded="sm"
                        bg={(form.watch('password')?.length >= 12) ? (theme.success || theme.accent) + '20' : theme.destructive + '20'}
                      >
                        <Text size="xs" color={(form.watch('password')?.length >= 12) ? (theme.success || theme.accent) : theme.destructive}>
                          {(form.watch('password')?.length >= 12) ? '✓' : '✗'} 12+ characters
                        </Text>
                      </Box>
                      <Box 
                        px={2} 
                        py={1} 
                        rounded="sm"
                        bg={/[A-Z]/.test(form.watch('password') || '') ? (theme.success || theme.accent) + '20' : theme.destructive + '20'}
                      >
                        <Text size="xs" color={/[A-Z]/.test(form.watch('password') || '') ? (theme.success || theme.accent) : theme.destructive}>
                          {/[A-Z]/.test(form.watch('password') || '') ? '✓' : '✗'} Uppercase
                        </Text>
                      </Box>
                      <Box 
                        px={2} 
                        py={1} 
                        rounded="sm"
                        bg={/[a-z]/.test(form.watch('password') || '') ? (theme.success || theme.accent) + '20' : theme.destructive + '20'}
                      >
                        <Text size="xs" color={/[a-z]/.test(form.watch('password') || '') ? (theme.success || theme.accent) : theme.destructive}>
                          {/[a-z]/.test(form.watch('password') || '') ? '✓' : '✗'} Lowercase
                        </Text>
                      </Box>
                      <Box 
                        px={2} 
                        py={1} 
                        rounded="sm"
                        bg={/\d/.test(form.watch('password') || '') ? (theme.success || theme.accent) + '20' : theme.destructive + '20'}
                      >
                        <Text size="xs" color={/\d/.test(form.watch('password') || '') ? (theme.success || theme.accent) : theme.destructive}>
                          {/\d/.test(form.watch('password') || '') ? '✓' : '✗'} Number
                        </Text>
                      </Box>
                      <Box 
                        px={2} 
                        py={1} 
                        rounded="sm"
                        bg={/[@$!%*?&]/.test(form.watch('password') || '') ? (theme.success || theme.accent) + '20' : theme.destructive + '20'}
                      >
                        <Text size="xs" color={/[@$!%*?&]/.test(form.watch('password') || '') ? (theme.success || theme.accent) : theme.destructive}>
                          {/[@$!%*?&]/.test(form.watch('password') || '') ? '✓' : '✗'} Special (@$!%*?&)
                        </Text>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>

              <Input
                label="Confirm Password"
                placeholder="••••••••••••"
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                error={form.formState.errors.confirmPassword?.message}
                success={form.formState.touchedFields.confirmPassword && !form.formState.errors.confirmPassword && !!form.watch('confirmPassword')}
                hint="Re-enter your password to confirm"
                value={form.watch('confirmPassword')}
                onChangeText={(text) => {
                  form.setValue('confirmPassword', text);
                  if (form.formState.touchedFields.confirmPassword) {
                    form.trigger('confirmPassword');
                  }
                }}
                onBlur={() => {
                  form.trigger('confirmPassword');
                }}
                leftElement={
                  <IconSymbol 
                    name="lock.shield.fill" 
                    size={20} 
                    color={theme.mutedForeground}
                  />
                }
                rightElement={
                  <Box flexDirection="row" alignItems="center" gap={2}>
                    {form.formState.touchedFields.confirmPassword && form.watch('confirmPassword') && (
                      <ValidationIcon 
                        status={form.formState.errors.confirmPassword ? 'error' : 'success'} 
                      />
                    )}
                    <Pressable
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ padding: 4 }}
                    >
                      <IconSymbol 
                        name={showConfirmPassword ? 'eye.slash.fill' : 'eye.fill' as any} 
                        size={20} 
                        color={theme.mutedForeground}
                      />
                    </Pressable>
                  </Box>
                }
              />

              <Box flexDirection="row" alignItems="flex-start" gap={3}>
                <Checkbox
                  checked={form.watch('acceptTerms')}
                  onCheckedChange={(checked) => {
                    form.setValue('acceptTerms', checked);
                    form.trigger('acceptTerms');
                  }}
                  style={{ marginTop: 2 }}
                />
                <Box flex={1}>
                  <Text size="sm" lineHeight="relaxed">
                    I accept the{" "}
                    <Text size="sm" weight="medium" colorTheme="primary">Terms of Service</Text>
                  </Text>
                  {form.formState.errors.acceptTerms && (
                    <Text size="sm" colorTheme="destructive" mt={1}>
                      {form.formState.errors.acceptTerms.message}
                    </Text>
                  )}
                </Box>
              </Box>

              <Box flexDirection="row" alignItems="flex-start" gap={3}>
                <Checkbox
                  checked={form.watch('acceptPrivacy')}
                  onCheckedChange={(checked) => {
                    form.setValue('acceptPrivacy', checked);
                    form.trigger('acceptPrivacy');
                  }}
                  style={{ marginTop: 2 }}
                />
                <Box flex={1}>
                  <Text size="sm" lineHeight="relaxed">
                    I accept the{" "}
                    <Text size="sm" weight="medium" colorTheme="primary">Privacy Policy</Text>
                  </Text>
                  {form.formState.errors.acceptPrivacy && (
                    <Text size="sm" colorTheme="destructive" mt={1}>
                      {form.formState.errors.acceptPrivacy.message}
                    </Text>
                  )}
                </Box>
              </Box>

              <Button
                size="lg"
                fullWidth
                isLoading={signUpMutation.isPending}
                isDisabled={!hasValidValues || signUpMutation.isPending}
                onPress={() => form.handleSubmit(onSubmit)()}
              >
                {signUpMutation.isPending ? "Creating account..." : "Create account"}
              </Button>

              <Box alignItems="center" my={4}>
                <Caption>OR</Caption>
              </Box>

              <GoogleSignInButton />
            </VStack>
          </CardContent>
          <CardFooter flexDirection="column" alignItems="center">
            <Box flexDirection="row" alignItems="center" gap={1}>
              <Caption>
                Already have an account?
              </Caption>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text size="sm" weight="medium" colorTheme="primary">
                    Sign in
                  </Text>
                </TouchableOpacity>
              </Link>
            </Box>
          </CardFooter>
        </Card>
      </VStack>
    </Container>
  );
}