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
import { SpacingScale } from '@/lib/design';
import { useBreakpoint } from '@/hooks/responsive';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [screenWidth, setScreenWidth] = React.useState(SCREEN_WIDTH);
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
    <Box p={isTabletOrDesktop ? 12 : 6} flex={1}>
      <VStack spacing={6}>

        {/* Header */}
        {!isMobile ? (
          <VStack spacing={2} alignItems="center">
            <Heading1>Forgot password?</Heading1>
            <Text colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
              Enter your email address and we&apos;ll send you a link to reset your password
            </Text>
          </VStack>
        ) : (
          <VStack spacing={2} alignItems="center">
            <Box style={{ marginBottom: 16, height: 60, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 56, lineHeight: 60 }}>🔐</Text>
            </Box>
            <Text colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
              Enter your email address and we&apos;ll send you a link to reset your password
            </Text>
          </VStack>
        )}

        {/* Form */}
        <VStack spacing={4}>
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
        <Box alignItems="center">
          <HStack spacing={1}>
            <Caption>Remember your password?</Caption>
            <TextLink 
              href="/(auth)/login"
              size="sm"
              weight="medium"
              variant="solid"
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
      <Box
        flex={1}
        justifyContent="center"
        alignItems="center"
        p={8 as SpacingScale}
      >
        <VStack spacing={6} alignItems="center">
          {/* Lock Emoji */}
          <Text style={{ fontSize: 80 }}>
            🔐
          </Text>
          
          {/* Minimal Text */}
          <VStack spacing={2} alignItems="center">
            <Text 
              size="3xl" 
              weight="bold" 
              style={{ color: theme.foreground }}
            >
              Password Reset
            </Text>
            <Text 
              size="lg" 
              style={{ 
                color: theme.mutedForeground,
                textAlign: 'center',
                maxWidth: 300,
              }}
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
          <Box flex={6} style={{ display: 'flex' as any }}>
            {formContent}
          </Box>
          <Box flex={4} style={{ display: 'flex' as any }}>
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
          <Box flex={1} bgTheme="background">
            {formContent}
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <Box 
        flex={1} 
        bgTheme="muted"
        justifyContent="center"
        alignItems="center"
        px={isTabletOrDesktop ? 6 : 4}
        style={Platform.OS === 'web' ? { 
          minHeight: '100vh' as any,
          width: '100%',
        } : {
          flex: 1,
          width: '100%',
        }}
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
          flex={1} 
          bgTheme="muted"
          justifyContent="center"
          alignItems="center"
          style={{ 
            flex: 1,
            width: '100%',
            paddingVertical: 20,
          }}
        >
          {cardContent}
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}