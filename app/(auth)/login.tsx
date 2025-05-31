import "@/app/global.css";
import { Button } from "@/components/shadcn/ui/button";
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
import { showErrorAlert } from "@/lib/alert";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import { Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const { signIn } = useAuth();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    console.log("[LOGIN] Starting login attempt for:", data.email);
    console.log("[LOGIN] Platform.OS:", Platform.OS);
    
    try {
      await signIn(data.email, data.password);
      console.log("Login successful");
      // Don't manually navigate - let AuthProvider handle it
      // The useAuth context will trigger navigation in auth layout
    } catch (error: any) {
      console.log("Login error:", error);
      const errorMessage = error?.message || "Failed to sign in";
      showErrorAlert("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center p-4 min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to your Hospital Alert account
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
                      placeholder="doctor@hospital.com"
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

              <Button
                variant="default"
                disabled={isLoading}
                className="w-full"
                onPress={() => form.handleSubmit(onSubmit)()}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
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
  );
}