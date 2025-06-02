import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/shadcn/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card';
import { Input } from '@/components/shadcn/ui/input';
import { Select } from '@/components/shadcn/ui/select';
import { UserRole } from '@/lib/validations/auth';
import { z } from 'zod';

interface ProfileCompletionFlowProps {
  onComplete?: () => void;
  showSkip?: boolean;
}

const profileCompletionSchema = z.object({
  role: UserRole,
  organizationId: z.string().optional(),
  phoneNumber: z.string().optional(),
  department: z.string().optional(),
});

type ProfileCompletionData = z.infer<typeof profileCompletionSchema>;

export function ProfileCompletionFlow({ onComplete, showSkip = false }: ProfileCompletionFlowProps) {
  const router = useRouter();
  const { user, checkSession } = useAuth();
  const [formData, setFormData] = useState<ProfileCompletionData>({
    role: user?.role || 'user',
    organizationId: user?.organizationId || '',
    phoneNumber: '',
    department: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await checkSession();
      if (onComplete) {
        onComplete();
      } else {
        router.replace('/(home)');
      }
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to update profile');
    },
  });

  const handleSubmit = async () => {
    try {
      const validatedData = profileCompletionSchema.parse(formData);
      await updateProfileMutation.mutateAsync(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleSkip = () => {
    if (onComplete) {
      onComplete();
    } else {
      router.replace('/(home)');
    }
  };

  const handleInputChange = (field: keyof ProfileCompletionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Please provide additional information to complete your profile setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <View className="space-y-2">
              <Text className="text-sm font-medium">Role</Text>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
                options={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'user', label: 'User' },
                  { value: 'guest', label: 'Guest' }
                ]}
                placeholder="Select your role"
                error={errors.role}
              />
            </View>

            <View className="space-y-2">
              <Text className="text-sm font-medium">Organization ID (Optional)</Text>
              <Input
                placeholder="Enter your organization ID"
                value={formData.organizationId}
                onChangeText={(value) => handleInputChange('organizationId', value)}
              />
              {errors.organizationId && (
                <Text className="text-destructive text-sm">{errors.organizationId}</Text>
              )}
            </View>

            <View className="space-y-2">
              <Text className="text-sm font-medium">Phone Number (Optional)</Text>
              <Input
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                keyboardType="phone-pad"
              />
              {errors.phoneNumber && (
                <Text className="text-destructive text-sm">{errors.phoneNumber}</Text>
              )}
            </View>

            <View className="space-y-2">
              <Text className="text-sm font-medium">Department (Optional)</Text>
              <Input
                placeholder="Enter your department"
                value={formData.department}
                onChangeText={(value) => handleInputChange('department', value)}
              />
              {errors.department && (
                <Text className="text-destructive text-sm">{errors.department}</Text>
              )}
            </View>

            <View className="space-y-2 pt-4">
              <Button
                onPress={handleSubmit}
                disabled={updateProfileMutation.isPending}
                className="w-full"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Complete Profile'}
              </Button>
              
              {showSkip && (
                <Button
                  variant="outline"
                  onPress={handleSkip}
                  disabled={updateProfileMutation.isPending}
                  className="w-full"
                >
                  Skip for Now
                </Button>
              )}
            </View>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}