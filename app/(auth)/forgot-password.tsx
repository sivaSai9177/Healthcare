import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/ui/card";
import { FormField, FormItem, FormMessage } from "@/components/shadcn/ui/form";
import { ArrowLeft } from "lucide-react-native";
import "@/app/global.css";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      // In a real app, this would send a password reset email
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        "Reset Email Sent",
        "If an account exists with this email, you will receive password reset instructions.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch {
      Alert.alert("Error", "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center p-4 min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <View className="flex-row items-center mb-2">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mr-2"
              >
                <ArrowLeft size={24} color="#000" />
              </TouchableOpacity>
              <CardTitle className="text-2xl flex-1">Forgot password?</CardTitle>
            </View>
            <CardDescription>Enter your email address and we&apos;ll send you a link to reset your password.</CardDescription>
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

              <Button
                variant="default"
                disabled={isLoading}
                className="w-full"
                onPress={() => form.handleSubmit(onSubmit)()}
              >
                {isLoading ? "Sending..." : "Send reset email"}
              </Button>
            </View>
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <View className="flex-row items-center space-x-1">
              <Text className="text-sm text-muted-foreground">
                Remember your password?
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
  );
}