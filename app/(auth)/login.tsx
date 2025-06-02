import "@/app/global.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/ui/card";
import { FormField, FormItem, FormMessage } from "@/components/shadcn/ui/form";
import { Input } from "@/components/shadcn/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toAppUser } from "@/lib/stores/auth-store";
import { showErrorAlert } from "@/lib/core/alert";
import { generateUUID } from "@/lib/core/crypto";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { api } from "@/lib/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import { ScrollView, Text, TouchableOpacity, View, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function LoginScreen() {
  const { updateAuth, setLoading, setError } = useAuth();
  
  // Use tRPC mutation for sign in
  const signInMutation = api.auth.signIn.useMutation({
    onSuccess: (data) => {
      console.log("[LOGIN] Sign in successful via tRPC:", data);
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
    },
    onError: (error) => {
      console.error("[LOGIN] Sign in failed:", error);
      setError(error.message);
      showErrorAlert("Login Failed", error.message || "Failed to sign in. Please check your credentials.");
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange", // Enable real-time validation
    reValidateMode: "onChange", // Re-validate on change
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    console.log("[LOGIN] Starting login attempt for:", data.email);
    
    // Check if form has validation errors before submitting
    if (!form.formState.isValid) {
      console.log("[LOGIN] Form has validation errors, preventing submission");
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
      console.log("[LOGIN] Login process completed");
      
      // Navigation will be handled by Expo Router's protected routes
      
    } catch (error: any) {
      console.error("[LOGIN] Login error:", error);
      // Error handling is done in the mutation's onError
      // Clear the form password on error
      form.setValue("password", "");
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
              Welcome back
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <View className="space-y-4">
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
                render={({ field }) => (
                  <FormItem>
                    <Input
                      label="Password"
                      placeholder="••••••••"
                      secureTextEntry
                      autoComplete="password"
                      error={form.formState.errors.password?.message}
                      {...field}
                      onChangeText={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <View className="flex-row justify-end">
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text className="text-sm text-primary">
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <Pressable
                disabled={signInMutation.isPending || !form.formState.isValid}
                onPress={() => form.handleSubmit(onSubmit)()}
                style={[
                  {
                    backgroundColor: '#1f2937',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 6,
                    opacity: (signInMutation.isPending || !form.formState.isValid) ? 0.5 : 1,
                  }
                ]}
                className="w-full h-12 flex-row items-center justify-center"
              >
                {signInMutation.isPending && (
                  <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                )}
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  {signInMutation.isPending ? "Signing in..." : "Sign in"}
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
                Don&apos;t have an account?
              </Text>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                  <Text className="text-sm text-primary font-medium">
                    Sign up
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