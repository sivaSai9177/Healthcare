import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { toAppUser } from "@/lib/stores/auth-store";
import { api } from "@/lib/trpc";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Select } from "@/components/shadcn/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/ui/card";
import { FormField, FormItem, FormMessage } from "@/components/shadcn/ui/form";
import { showErrorAlert, showSuccessAlert } from "@/lib/core/alert";
import { generateUUID } from "@/lib/core/crypto";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import "@/app/global.css";

const roleOptions = [
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "user", label: "User" },
  { value: "guest", label: "Guest" },
];

export default function SignupScreen() {
  const { updateAuth, setLoading, setError } = useAuth();

  // Use tRPC mutation for sign up
  const signUpMutation = api.auth.signUp.useMutation({
    onSuccess: (data) => {
      console.log("[SIGNUP] Sign up successful via tRPC:", data);
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
      console.error("[SIGNUP] Sign up failed:", error);
      setError(error.message);
      showErrorAlert("Signup Failed", error.message || "Failed to create account. Please try again.");
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: "onChange", // Enable real-time validation
    reValidateMode: "onChange", // Re-validate on change
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user",
      organizationId: "",
    },
  });

  const onSubmit = async (data: SignupInput) => {
    console.log("[SIGNUP] Starting signup attempt for:", data.email);
    
    // Check if form has validation errors before submitting
    if (!form.formState.isValid) {
      console.log("[SIGNUP] Form has validation errors, preventing submission");
      showErrorAlert("Invalid Form", "Please fix the validation errors before submitting.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await signUpMutation.mutateAsync({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        organizationId: data.organizationId || undefined,
      });
      
      console.log("[SIGNUP] Signup process completed");
      // Navigation will be handled by Expo Router's protected routes
      
    } catch (error: any) {
      console.error("[SIGNUP] Signup error:", error);
      // Error handling is done in the mutation's onError
      // Clear the form password on error
      form.setValue("password", "");
      form.setValue("confirmPassword", "");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              Create an account
            </CardTitle>
            <CardDescription className="text-center">
              Join our platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <View className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Input
                      label="Full Name"
                      placeholder="John Doe"
                      autoComplete="name"
                      error={form.formState.errors.name?.message}
                      success={!form.formState.errors.name && field.value && field.value.length >= 2}
                      hint="Enter your full name"
                      {...field}
                      onChangeText={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Input
                      label="Email"
                      placeholder="user@example.com"
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                      error={form.formState.errors.email?.message}
                      success={!form.formState.errors.email && field.value && field.value.includes('@')}
                      hint="Use your email address"
                      {...field}
                      onChangeText={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      label="Role"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={roleOptions}
                      placeholder="Select your role"
                      error={form.formState.errors.role?.message}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <Input
                      label="Organization ID (Optional)"
                      placeholder="ORG-12345"
                      autoCapitalize="characters"
                      error={form.formState.errors.organizationId?.message}
                      {...field}
                      onChangeText={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => {
                  const hasMinLength = field.value && field.value.length >= 12;
                  const hasUppercase = field.value && /[A-Z]/.test(field.value);
                  const hasLowercase = field.value && /[a-z]/.test(field.value);
                  const hasNumber = field.value && /\d/.test(field.value);
                  const hasSpecial = field.value && /[@$!%*?&]/.test(field.value);
                  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
                  
                  return (
                    <FormItem>
                      <Input
                        label="Password"
                        placeholder="••••••••••••"
                        secureTextEntry
                        autoComplete="new-password"
                        error={form.formState.errors.password?.message}
                        success={!form.formState.errors.password && isValid}
                        hint="12+ chars with uppercase, lowercase, number & special character"
                        {...field}
                        onChangeText={field.onChange}
                      />
                      
                      {/* Password strength indicators */}
                      {field.value && (
                        <View className="mt-2 space-y-1">
                          <View className="flex-row flex-wrap gap-2">
                            <Text className={`text-xs px-2 py-1 rounded ${hasMinLength ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {hasMinLength ? '✓' : '✗'} 12+ characters
                            </Text>
                            <Text className={`text-xs px-2 py-1 rounded ${hasUppercase ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {hasUppercase ? '✓' : '✗'} Uppercase
                            </Text>
                            <Text className={`text-xs px-2 py-1 rounded ${hasLowercase ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {hasLowercase ? '✓' : '✗'} Lowercase
                            </Text>
                            <Text className={`text-xs px-2 py-1 rounded ${hasNumber ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {hasNumber ? '✓' : '✗'} Number
                            </Text>
                            <Text className={`text-xs px-2 py-1 rounded ${hasSpecial ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {hasSpecial ? '✓' : '✗'} Special (@$!%*?&)
                            </Text>
                          </View>
                        </View>
                      )}
                      
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => {
                  const passwordValue = form.watch('password');
                  const passwordsMatch = field.value && passwordValue && field.value === passwordValue;
                  
                  return (
                    <FormItem>
                      <Input
                        label="Confirm Password"
                        placeholder="••••••••••••"
                        secureTextEntry
                        autoComplete="new-password"
                        error={form.formState.errors.confirmPassword?.message}
                        success={!form.formState.errors.confirmPassword && passwordsMatch}
                        hint="Re-enter your password to confirm"
                        {...field}
                        onChangeText={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <Button
                variant="default"
                disabled={signUpMutation.isPending || !form.formState.isValid}
                className="w-full"
                onPress={() => form.handleSubmit(onSubmit)()}
              >
                {signUpMutation.isPending ? "Creating account..." : "Create account"}
              </Button>

              <View style={{ alignItems: 'center', marginVertical: 16 }}>
                <Text style={{ color: '#666666', fontSize: 14 }}>OR</Text>
              </View>

              <GoogleSignInButton />
            </View>
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <View className="flex-row items-center space-x-1">
              <Text className="text-sm text-muted-foreground">
                Already have an account?
              </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-sm text-primary font-medium">
                    Sign in
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </CardFooter>
        </Card>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}