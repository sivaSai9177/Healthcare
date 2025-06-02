import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Select } from "@/components/shadcn/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/ui/card";
import { FormField, FormItem, FormMessage } from "@/components/shadcn/ui/form";
import { showErrorAlert, showSuccessAlert } from "@/lib/core/alert";
import { useAuth } from "@/hooks/useAuth";
import { authClient } from "@/lib/auth/auth-client";
import "@/app/global.css";

const profileSchema = z.object({
  role: z.enum(["operator", "doctor", "nurse", "head_doctor"]),
  hospitalId: z.string().optional(),
});

type ProfileInput = z.infer<typeof profileSchema>;

const roleOptions = [
  { value: "operator", label: "Operator" },
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Registered Nurse" },
  { value: "head_doctor", label: "Head of Doctor" },
];

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      role: "doctor",
      hospitalId: "",
    },
  });

  const onSubmit = async (data: ProfileInput) => {
    setIsLoading(true);
    try {
      // Update user profile
      const response = await authClient.updateUser({
        role: data.role,
        hospitalId: data.hospitalId || undefined,
      });

      if (response.data) {
        showSuccessAlert("Profile Updated", "Your profile has been completed successfully!");
        await refreshUser();
        router.replace("/(home)");
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      showErrorAlert("Update Failed", error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // If user already has a role (not default), redirect to home
  React.useEffect(() => {
    if (user && user.role !== "doctor" && !user.needsProfileCompletion) {
      router.replace("/(home)");
    }
  }, [user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">
                Complete Your Profile
              </CardTitle>
              <CardDescription className="text-center">
                Welcome {user?.name}! Please complete your profile to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <View style={{ gap: 16 }}>
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        label="Role"
                        placeholder="Select your role"
                        items={roleOptions}
                        value={field.value}
                        onValueChange={field.onChange}
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
                        placeholder="Enter your hospital ID"
                        autoCapitalize="none"
                        error={form.formState.errors.hospitalId?.message}
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
                  {isLoading ? "Updating..." : "Complete Profile"}
                </Button>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}