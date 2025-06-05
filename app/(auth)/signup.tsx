import React from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { toAppUser } from "@/lib/stores/auth-store";
import { api } from "@/lib/trpc";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { Input } from "@/components/shadcn/ui/input.simple";
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
import { RoleSelector, UserRole } from "@/components/RoleSelector";
import { OrganizationField } from "@/components/OrganizationField";
import { Checkbox } from "@/components/shadcn/ui/checkbox";
import "@/app/global.css";

export default function SignupScreen() {
  const { updateAuth, setLoading, setError } = useAuth();
  const [selectedRole, setSelectedRole] = React.useState<UserRole>(); // No default - user must choose

  // Use tRPC mutation for sign up
  const signUpMutation = api.auth.signUp.useMutation({
    onSuccess: (data) => {
      console.log("[SIGNUP] Sign up successful via tRPC:", data);
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
      console.error("[SIGNUP] Sign up failed:", error);
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
    mode: "onChange", // Enable real-time validation
    reValidateMode: "onChange", // Re-validate on change
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

  // Debug form state
  const acceptTerms = form.watch('acceptTerms');
  const acceptPrivacy = form.watch('acceptPrivacy');
  const formValues = form.watch();
  React.useEffect(() => {
    const isButtonDisabled = signUpMutation.isPending || !form.formState.isValid || !acceptTerms || !acceptPrivacy;
    console.log("[SIGNUP] Form state:", {
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      values: formValues,
      acceptTerms,
      acceptPrivacy,
      isButtonDisabled,
      isPending: signUpMutation.isPending
    });
  }, [form.formState.isValid, form.formState.errors, acceptTerms, acceptPrivacy, formValues, signUpMutation.isPending]);

  const onSubmit = async (data: SignUpInput) => {
    console.log("[SIGNUP] Starting signup attempt for:", data.email);
    
    // Check if form has validation errors before submitting
    if (!form.formState.isValid) {
      console.log("[SIGNUP] Form has validation errors, preventing submission");
      console.log("[SIGNUP] Validation errors:", form.formState.errors);
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

      console.log("[SIGNUP] Submitting with role-based data:", { 
        role: data.role, 
        hasOrgCode: !!data.organizationCode,
        hasOrgName: !!data.organizationName,
        submissionData: submissionData
      });

      await signUpMutation.mutateAsync(submissionData);
      
      console.log("[SIGNUP] Signup process completed");
      // Navigation will be handled by Expo Router's protected routes
      
    } catch (error: any) {
      console.error("[SIGNUP] Signup error:", error);
      setLoading(false); // Ensure loading state is cleared
      setError(error.message || "Failed to create account");
      // Error handling is done in the mutation's onError
      // Clear the form password on error
      form.setValue("password", "");
      form.setValue("confirmPassword", "");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', padding: 16 }}>
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
                control={form.control}
                role={selectedRole}
                className="mt-4"
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

              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        style={{ marginTop: 2 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, lineHeight: 20, color: '#1f2937' }}>
                          I accept the{" "}
                          <Text style={{ fontWeight: '500', color: '#1f2937' }}>Terms of Service</Text>
                        </Text>
                      </View>
                    </View>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acceptPrivacy"
                render={({ field }) => (
                  <FormItem>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        style={{ marginTop: 2 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, lineHeight: 20, color: '#1f2937' }}>
                          I accept the{" "}
                          <Text style={{ fontWeight: '500', color: '#1f2937' }}>Privacy Policy</Text>
                        </Text>
                      </View>
                    </View>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Pressable
                disabled={signUpMutation.isPending || !form.formState.isValid || !acceptTerms || !acceptPrivacy}
                onPress={() => form.handleSubmit(onSubmit)()}
                style={[
                  {
                    backgroundColor: '#1f2937',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 6,
                    opacity: (signUpMutation.isPending || !form.formState.isValid || !acceptTerms || !acceptPrivacy) ? 0.5 : 1,
                  }
                ]}
                className="w-full h-12 flex-row items-center justify-center"
              >
                {signUpMutation.isPending && (
                  <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                )}
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  {signUpMutation.isPending ? "Creating account..." : "Create account"}
                </Text>
              </Pressable>

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