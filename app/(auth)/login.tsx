import React from "react";
import { TouchableOpacity, Pressable, Platform, ScrollView, KeyboardAvoidingView } from "react-native";
import { Link } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import debounce from 'lodash.debounce';
import { useAuth } from "@/hooks/useAuth";
import { toAppUser } from "@/lib/stores/auth-store";
import { api } from "@/lib/trpc";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";
import { showErrorAlert } from "@/lib/core/alert";
import { log } from "@/lib/core/logger";
import { generateUUID } from "@/lib/core/crypto";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useTheme } from "@/lib/theme/theme-provider";
import { Container } from "@/components/universal/Container";
import { ValidationIcon } from "@/components/ui/ValidationIcon";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Box } from "@/components/universal/Box";
import { Text, Heading1, Caption } from "@/components/universal/Text";
import { VStack, HStack } from "@/components/universal/Stack";
import { Button } from "@/components/universal/Button";
import { Input } from "@/components/universal/Input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/universal/Card";

export default function LoginScreen() {
  const { updateAuth, setLoading, setError } = useAuth();
  const theme = useTheme();
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailExists, setEmailExists] = React.useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = React.useState(false);
  
  // Memoize mutation callbacks to prevent recreation on every render
  const onSuccess = React.useCallback((data: any) => {
    log.auth.login('Sign in successful via tRPC', { userId: data.user?.id });
    if (data.user && data.token) {
      // Convert user to AppUser with safe defaults
      const appUser = toAppUser(data.user, 'user');

      // Update auth store with user and session
      const session = {
        id: generateUUID(),
        token: data.token,
        userId: appUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };
      updateAuth(appUser, session);
    }
  }, [updateAuth]);

  const onError = React.useCallback((error: any) => {
    log.auth.error('Sign in failed', error);
    setError(error.message);
    showErrorAlert("Login Failed", error.message || "Failed to sign in. Please check your credentials.");
  }, [setError]);

  const onSettled = React.useCallback(() => {
    setLoading(false);
  }, [setLoading]);
  
  // Use tRPC mutation for sign in
  const signInMutation = api.auth.signIn.useMutation({
    onSuccess,
    onError,
    onSettled,
  });

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Watch form values for button state
  const email = form.watch('email');
  const password = form.watch('password');
  
  // Email validation using Zod
  const emailSchema = z.string().email();
  const [shouldCheckEmail, setShouldCheckEmail] = React.useState(false);
  const [hasInteractedWithEmail, setHasInteractedWithEmail] = React.useState(false);
  
  // Validate email with Zod
  const isValidEmail = React.useMemo(() => {
    try {
      emailSchema.parse(email);
      return true;
    } catch {
      return false;
    }
  }, [email]);
  
  // Only enable query when all conditions are met
  const enableQuery = shouldCheckEmail && isValidEmail && hasInteractedWithEmail;
  
  // Debug logging
  React.useEffect(() => {
    log.debug('Email validation state', 'LOGIN', {
      email,
      isValidEmail,
      shouldCheckEmail,
      touched: form.formState.touchedFields.email,
      hasInteractedWithEmail,
      enableQuery,
    });
  }, [email, isValidEmail, shouldCheckEmail, form.formState.touchedFields.email, hasInteractedWithEmail, enableQuery]);
  
  // Use the query hook with strict conditions
  const checkEmailQuery = api.auth.checkEmailExists.useQuery(
    { email: enableQuery ? email : 'noreply@example.com' }, // Use placeholder when disabled
    {
      enabled: enableQuery,
      retry: false,
      staleTime: 30000, // Cache for 30 seconds
      gcTime: 60000, // Keep in cache for 1 minute
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );
  
  // Log query results
  React.useEffect(() => {
    if (checkEmailQuery.data && enableQuery) {
      const data = checkEmailQuery.data as { exists: boolean; isAvailable: boolean };
      log.debug('Email check success', 'LOGIN', { email, exists: data.exists, isAvailable: data.isAvailable });
    }
    if (checkEmailQuery.error) {
      log.error('Email check error', 'LOGIN', checkEmailQuery.error);
    }
  }, [checkEmailQuery.data, checkEmailQuery.error, email, enableQuery]);
  
  // Debounced email check - use ref to get current values
  const emailRef = React.useRef(email);
  const isValidEmailRef = React.useRef(isValidEmail);
  
  React.useEffect(() => {
    emailRef.current = email;
    isValidEmailRef.current = isValidEmail;
  }, [email, isValidEmail]);
  
  const debouncedEmailCheck = React.useMemo(
    () => debounce(() => {
      const currentEmail = emailRef.current;
      const currentIsValid = isValidEmailRef.current;
      
      log.debug('Debounce triggered', 'LOGIN', { 
        email: currentEmail, 
        isValidEmail: currentIsValid 
      });
      
      if (currentIsValid) {
        setShouldCheckEmail(true);
      }
    }, 500), // 500ms debounce delay
    []
  );
  
  // Trigger email check when email changes
  React.useEffect(() => {
    // Always reset flag when email changes
    setShouldCheckEmail(false);
    
    if (hasInteractedWithEmail && isValidEmail && email.length > 0) {
      debouncedEmailCheck();
    } else {
      debouncedEmailCheck.cancel();
    }
    
    return () => {
      debouncedEmailCheck.cancel();
    };
  }, [email, isValidEmail, hasInteractedWithEmail, debouncedEmailCheck]);
  
  // For UI consistency - properly type the data
  const emailCheckData = enableQuery && checkEmailQuery.data ? checkEmailQuery.data as { exists: boolean; isAvailable: boolean } : null;
  const isCheckingEmail = enableQuery && checkEmailQuery.isFetching;
  
  // Check if form has valid values (not just validation state)
  const hasValidValues = React.useMemo(() => {
    const isPasswordValid = password && password.length >= 1;
    
    return isValidEmail && isPasswordValid;
  }, [isValidEmail, password]);

  const onSubmit = async (data: SignInInput) => {
    log.auth.debug('Starting login attempt', { email: data.email });
    
    // Trigger validation for all fields before submission
    const isValid = await form.trigger();
    
    if (!isValid) {
      log.auth.debug('Form validation errors preventing submission');
      showErrorAlert("Invalid Form", "Please fix the validation errors before submitting.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await signInMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });
      log.auth.login('Login process completed successfully');
      
      // Navigation will be handled by Expo Router's protected routes
      
    } catch (error: any) {
      log.auth.error('Login process failed', error);
      // Clear the form password on error
      form.setValue("password", "");
    }
  };

  const content = (
    <Box 
      width="100%" 
      maxWidth={400} 
      p={4}
      style={{
        width: '100%',
      }}
    >
      <Card 
        shadow="lg"
        bgTheme="card"
        borderTheme="border"
        style={{
          ...(Platform.OS === 'web' && {
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }),
        }}
      >
            <CardHeader>
              <VStack spacing={1} alignItems="center">
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Login to your account</CardDescription>
              </VStack>
            </CardHeader>
            <CardContent>
              <VStack spacing={4}>
              {/* Email Input */}
              <Input
                label="Email"
                placeholder="your@email.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                name="email"
                id="email"
                error={form.formState.errors.email?.message}
                success={hasInteractedWithEmail && !form.formState.errors.email && !!email && emailCheckData?.exists === true}
                value={form.watch("email")}
                onChangeText={(value) => {
                  form.setValue("email", value);
                  setHasInteractedWithEmail(true); // Mark as interacted when user types
                  if (form.formState.touchedFields.email) {
                    form.trigger("email");
                  }
                }}
                onBlur={() => {
                  setHasInteractedWithEmail(true); // Also mark on blur
                  form.trigger("email");
                }}
                leftElement={
                  <IconSymbol 
                    name="envelope.fill" 
                    size={20} 
                    color={theme.mutedForeground}
                  />
                }
                rightElement={
                  form.formState.touchedFields.email && form.watch("email") ? (
                    isCheckingEmail ? (
                      <Text size="xs" colorTheme="mutedForeground">Checking...</Text>
                    ) : emailCheckData ? (
                      <ValidationIcon 
                        status={
                          form.formState.errors.email ? 'error' : 
                          emailCheckData?.exists ? 'success' : 
                          'error'
                        } 
                      />
                    ) : null
                  ) : null
                }
              />
              
              {/* Email validation message */}
              {form.formState.touchedFields.email && !form.formState.errors.email && emailCheckData && (
                <Text size="sm" colorTheme={emailCheckData.exists ? "success" : "destructive"}>
                  {emailCheckData.exists ? "Email found - please enter your password" : "Email not found - please check or sign up"}
                </Text>
              )}

              {/* Password Input with Forgot Link */}
              <Box>
                <Box flexDirection="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Text size="sm" weight="medium" colorTheme="foreground">
                    Password
                  </Text>
                  <Link href="/(auth)/forgot-password" asChild>
                    <TouchableOpacity>
                      <Text size="sm" colorTheme="primary">
                        Forgot your password?
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </Box>
                <Input
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  name="password"
                  id="password"
                  error={form.formState.errors.password?.message}
                  success={form.formState.touchedFields.password && !form.formState.errors.password && !!form.watch("password")}
                  value={form.watch("password")}
                  onChangeText={(value) => {
                    form.setValue("password", value);
                    if (form.formState.touchedFields.password) {
                      form.trigger("password");
                    }
                  }}
                  onBlur={() => {
                    form.trigger("password");
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
                      {form.formState.touchedFields.password && form.watch("password") && (
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
              </Box>

              {/* Submit Button */}
              <Button
                size="lg"
                fullWidth
                isDisabled={!hasValidValues || signInMutation.isPending}
                onPress={() => form.handleSubmit(onSubmit)()}
                isLoading={signInMutation.isPending}
              >
                {signInMutation.isPending ? "Signing in..." : "Login"}
              </Button>

              {/* Divider */}
              <Box alignItems="center" my={4}>
                <Caption>OR</Caption>
              </Box>

              {/* Social Login */}
              <GoogleSignInButton />
            </VStack>
          </CardContent>
          <CardFooter flexDirection="column" alignItems="center">
            <Box flexDirection="row" alignItems="center" gap={1}>
              <Caption>
                Don&apos;t have an account?
              </Caption>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                  <Text size="sm" weight="medium" colorTheme="primary">
                    Sign up
                  </Text>
                </TouchableOpacity>
              </Link>
            </Box>
          </CardFooter>
      </Card>
    </Box>
  );

  if (Platform.OS === 'web') {
    return (
      <Box 
        flex={1} 
        bgTheme="background"
        justifyContent="center"
        alignItems="center"
        style={{ 
          height: '100%',
          width: '100%',
          position: 'absolute' as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Box 
          flex={1} 
          bgTheme="background"
          justifyContent="center"
          alignItems="center"
          style={{ 
            flex: 1,
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {content}
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}