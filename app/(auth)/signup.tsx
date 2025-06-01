import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
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
import { showErrorAlert, showSuccessAlert } from "@/lib/alert";
import "@/app/global.css";

const roleOptions = [
  { value: "operator", label: "Operator" },
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Registered Nurse" },
  { value: "head_doctor", label: "Head of Doctor" },
];

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "doctor",
      hospitalId: "",
    },
  });

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    try {
      await signUp({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        hospitalId: data.hospitalId || undefined,
      });
      
      showSuccessAlert(
        "Account Created",
        "Your account has been created and you're now logged in!"
      );
      // Navigation will be handled automatically by the auth context
      // Don't manually navigate - let AuthProvider handle it
    } catch (error: any) {
      console.log("Signup error:", error);
      showErrorAlert("Signup Failed", error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="flex-1 justify-center items-center p-4 min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              Create an account
            </CardTitle>
            <CardDescription className="text-center">
              Join Hospital Alert System
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
                      placeholder="Dr. John Doe"
                      autoComplete="name"
                      error={form.formState.errors.name?.message}
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
                name="hospitalId"
                render={({ field }) => (
                  <FormItem>
                    <Input
                      label="Hospital ID (Optional)"
                      placeholder="HOSP-12345"
                      autoCapitalize="characters"
                      error={form.formState.errors.hospitalId?.message}
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
                      autoComplete="new-password"
                      error={form.formState.errors.password?.message}
                      {...field}
                      onChangeText={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <Input
                      label="Confirm Password"
                      placeholder="••••••••"
                      secureTextEntry
                      autoComplete="new-password"
                      error={form.formState.errors.confirmPassword?.message}
                      {...field}
                      onChangeText={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                variant="default"
                disabled={isLoading}
                className="w-full"
                onPress={() => form.handleSubmit(onSubmit)()}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
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