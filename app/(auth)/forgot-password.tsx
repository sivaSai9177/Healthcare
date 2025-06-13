import React from "react";
import { Platform, Dimensions, KeyboardAvoidingView, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LinearGradient } from 'expo-linear-gradient';
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { showErrorAlert, showSuccessAlert } from "@/lib/core/alert";
import { log } from "@/lib/core/debug/logger";
import { api } from "@/lib/api/trpc";
import { useTheme } from "@/lib/theme/provider";
import { Symbol as IconSymbol , ValidationIcon } from '@/components/universal';
import { Box } from "@/components/universal/Box";
import { Text, Heading1, Caption } from "@/components/universal/Text";
import { VStack, HStack } from "@/components/universal/Stack";
import { Button } from "@/components/universal/Button";
import { Input } from "@/components/universal/Input";
import { Card } from "@/components/universal/Card";
import { TextLink } from "@/components/universal/Link";
import { useSpacing } from '@/lib/stores/spacing-store';
import { useBreakpoint, useResponsive } from '@/hooks/responsive';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [screenWidth, setScreenWidth] = React.useState(Dimensions.get('window').width);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Update screen width on resize (web)
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => {
        setScreenWidth(Dimensions.get('window').width);
      };
      
      const subscription = Dimensions.addEventListener('change', handleResize);
      return () => subscription?.remove();
    }
  }, []);
  
  const breakpoint = useBreakpoint();
  const isTabletOrDesktop = ['md', 'lg', 'xl', '2xl'].includes(breakpoint);
  const isLargeScreen = ['lg', 'xl', '2xl'].includes(breakpoint);
  const { isMobile } = useResponsive();
  const { spacing } = useSpacing();

  // Use tRPC mutation for password reset
  const resetPasswordMutation = api.auth.resetPassword.useMutation();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
    },
  });

  const email = form.watch('email');
  const emailSchema = React.useMemo(() => z.string().email(), []);
  
  const isValidEmail = React.useMemo(() => {
    try {
      emailSchema.parse(email);
      return true;
    } catch {
      return false;
    }
  }, [email, emailSchema]);

  const onSubmit = async (data: ForgotPasswordInput) => {
    log.auth.debug('Password reset requested', { email: data.email });
    setIsLoading(true);
    
    try {
      await resetPasswordMutation.mutateAsync({
        email: data.email,
      });
      
      showSuccessAlert(
        "Reset Email Sent",
        "If an account exists with this email, you will receive password reset instructions."
      );
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: any) {
      log.auth.error('Password reset process failed', error);
      showErrorAlert("Error", "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <Box className={`flex-1 ${isTabletOrDesktop ? 'p-12' : 'p-6'}`}>
      <VStack gap={6}>

        {/* Header */}
        {!isMobile ? (
          <VStack gap={2} align="center">
            <Heading1>Forgot password?</Heading1>
            <Text variant="muted" className="text-center">
              Enter your email address and we&apos;ll send you a link to reset your password
            </Text>
          </VStack>
        ) : (
          <VStack gap={2} align="center">
            <Box className="mb-4 h-[60px] justify-center items-center">
              <Text className="text-[56px] leading-[60px]">🔐</Text>
            </Box>
            <Text variant="muted" className="text-center">
              Enter your email address and we&apos;ll send you a link to reset your password
            </Text>
          </VStack>
        )}

        {/* Form */}
        <VStack gap={4}>
          <Input
            label="Email"
            placeholder="your@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            error={form.formState.errors.email?.message}
            success={form.formState.touchedFields.email && !form.formState.errors.email && !!email}
            value={email}
            onChangeText={(value) => {
              form.setValue("email", value);
              if (form.formState.touchedFields.email) {
                form.trigger("email");
              }
            }}
            onBlur={() => form.trigger("email")}
            leftElement={
              <IconSymbol 
                name="envelope.fill" 
                size={20} 
                color={theme.mutedForeground}
              />
            }
            rightElement={
              form.formState.touchedFields.email && email ? (
                <ValidationIcon 
                  status={form.formState.errors.email ? 'error' : 'success'} 
                />
              ) : null
            }
          />

          <Button
            size="lg"
            fullWidth
            isDisabled={!isValidEmail || isLoading || resetPasswordMutation.isPending}
            onPress={() => form.handleSubmit(onSubmit)()}
            isLoading={isLoading || resetPasswordMutation.isPending}
          >
            {isLoading ? "Sending..." : "Send reset email"}
          </Button>
        </VStack>

        {/* Login link */}
        <Box className="items-center">
          <HStack gap={1}>
            <Caption>Remember your password?</Caption>
            <TextLink 
              href="/(auth)/login"
              size="sm"
              weight="medium"
            >
              Login
            </TextLink>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );

  const imageColumn = (
    <LinearGradient
      colors={['#e8e9eb', '#f2f3f5', 'theme.background']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flex: 1,
        position: 'relative',
        height: '100%',
        width: '100%',
      }}
    >
      <Box className="flex-1 justify-center items-center p-8">
        <VStack gap={6} align="center">
          {/* Lock Emoji */}
          <Text style={{ fontSize: 80 }}>
            🔐
          </Text>
          
          {/* Minimal Text */}
          <VStack gap={2} align="center">
            <Text 
              size="3xl" 
              weight="bold" 
              className="text-foreground"
            >
              Password Reset
            </Text>
            <Text 
              size="lg" 
              variant="muted"
              className="text-center max-w-[300px]"
            >
              We&apos;ll help you get back into your account securely
            </Text>
          </VStack>
        </VStack>
      </Box>
    </LinearGradient>
  );

  const cardContent = (
    <Card 
      shadow="xl"
      bgTheme="card"
      borderTheme="border"
      style={{
        width: isTabletOrDesktop ? '70%' : '100%',
        maxWidth: isTabletOrDesktop ? 800 : 400,
        overflow: 'hidden',
        ...(Platform.OS === 'web' && {
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }),
      }}
    >
      {isLargeScreen ? (
        <Box 
          flexDirection="row" 
          style={{ 
            minHeight: 600,
            width: '100%',
            display: 'flex' as any,
          }}
        >
          <Box className="flex-[6] flex">
            {formContent}
          </Box>
          <Box className="flex-[4] flex">
            {imageColumn}
          </Box>
        </Box>
      ) : (
        formContent
      )}
    </Card>
  );

  // Mobile layout - no card, full screen
  if (isMobile) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ backgroundColor: theme.background }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Box className="flex-1 bg-background">
            {formContent}
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <Box 
        className={`flex-1 bg-muted justify-center items-center w-full ${isTabletOrDesktop ? 'px-6' : 'px-4'}`}
        style={Platform.OS === 'web' ? { 
          minHeight: '100vh',
        } : {}}
      >
        {cardContent}
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
          className="flex-1 bg-muted justify-center items-center w-full py-5"
        >
          {cardContent}
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}