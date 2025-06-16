import React, { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { VStack, HStack } from '@/components/universal/layout';
import { Button } from '@/components/universal/interaction';
import { Input, Form } from '@/components/universal/form';
import { Text } from '@/components/universal/typography';
import { Avatar, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/universal/display';
import { Skeleton } from '@/components/universal/feedback';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';
import { log } from '@/lib/core/debug/logger';
import { SpacingScale } from '@/lib/design';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Symbol } from '@/components/universal/display/Symbols';

// Profile update schema
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditBlockProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProfileEditBlock: React.FC<ProfileEditBlockProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user, refresh } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      department: user?.department || '',
      jobTitle: user?.jobTitle || '',
      bio: user?.bio || '',
    },
  });

  const updateProfileMutation = api.auth.updateProfile.useMutation({
    onSuccess: async () => {
      log.info('Profile updated successfully', 'PROFILE_EDIT');
      await refresh(); // Refresh user data
      setIsEditing(false);
      onSuccess?.();
      
      Alert.alert(
        'Success',
        'Your profile has been updated successfully.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      log.error('Failed to update profile', 'PROFILE_EDIT', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update profile. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const handleSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleAvatarPress = () => {
    Alert.alert(
      'Change Avatar',
      'Avatar upload will be available in the next update.',
      [{ text: 'OK' }]
    );
  };

  if (!user) {
    return (
      <Card>
        <CardContent>
          <Skeleton className="h-[200px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <HStack spacing={4 as SpacingScale} alignItems="center">
          <VStack alignItems="center" spacing={2 as SpacingScale}>
            <Avatar
              source={user.image ? { uri: user.image } : undefined}
              name={user.name || 'User'}
              size="xl"
            />
            {isEditing && (
              <Button
                size="xs"
                variant="outline"
                onPress={handleAvatarPress}
                icon={<Symbol name="camera" size={16} />}
              >
                Change
              </Button>
            )}
          </VStack>
          <VStack flex={1} spacing={1 as SpacingScale}>
            <CardTitle>{user.name || 'User'}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
            {user.role && (
              <Text size="sm" colorTheme="mutedForeground">
                Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
            )}
          </VStack>
        </HStack>
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
          <Form form={form} onSubmit={handleSubmit}>
            <VStack spacing={4 as SpacingScale}>
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <VStack spacing={1 as SpacingScale}>
                      <Text size="sm" weight="medium">Full Name</Text>
                      <Input
                        {...field}
                        placeholder="Enter your full name"
                        error={fieldState.error?.message}
                      />
                    </VStack>
                  )}
                />

                <Controller
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <VStack spacing={1 as SpacingScale}>
                      <Text size="sm" weight="medium">Email</Text>
                      <Input
                        {...field}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={false} // Email cannot be changed
                        className="opacity-50"
                        error={fieldState.error?.message}
                      />
                      <Text size="xs" colorTheme="mutedForeground">
                        Email cannot be changed
                      </Text>
                    </VStack>
                  )}
                />

                <Controller
                  control={form.control}
                  name="phoneNumber"
                  render={({ field, fieldState }) => (
                    <VStack spacing={1 as SpacingScale}>
                      <Text size="sm" weight="medium">Phone Number</Text>
                      <Input
                        {...field}
                        placeholder="Enter your phone number"
                        keyboardType="phone-pad"
                        error={fieldState.error?.message}
                      />
                    </VStack>
                  )}
                />

                <Controller
                  control={form.control}
                  name="department"
                  render={({ field, fieldState }) => (
                    <VStack spacing={1 as SpacingScale}>
                      <Text size="sm" weight="medium">Department</Text>
                      <Input
                        {...field}
                        placeholder="Enter your department"
                        error={fieldState.error?.message}
                      />
                    </VStack>
                  )}
                />

                <Controller
                  control={form.control}
                  name="jobTitle"
                  render={({ field, fieldState }) => (
                    <VStack spacing={1 as SpacingScale}>
                      <Text size="sm" weight="medium">Job Title</Text>
                      <Input
                        {...field}
                        placeholder="Enter your job title"
                        error={fieldState.error?.message}
                      />
                    </VStack>
                  )}
                />

                <Controller
                  control={form.control}
                  name="bio"
                  render={({ field, fieldState }) => (
                    <VStack spacing={1 as SpacingScale}>
                      <Text size="sm" weight="medium">Bio</Text>
                      <Input
                        {...field}
                        placeholder="Tell us about yourself"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        error={fieldState.error?.message}
                      />
                      <Text size="xs" colorTheme="mutedForeground">
                        {field.value?.length || 0}/500 characters
                      </Text>
                    </VStack>
                  )}
                />

                <HStack spacing={2 as SpacingScale} justifyContent="flex-end">
                  <Button
                    variant="outline"
                    onPress={() => {
                      form.reset();
                      setIsEditing(false);
                      onCancel?.();
                    }}
                    disabled={updateProfileMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="solid"
                    isLoading={updateProfileMutation.isPending}
                    onPress={form.handleSubmit(handleSubmit)}
                  >
                    Save Changes
                  </Button>
                </HStack>
              </VStack>
          </Form>
        ) : (
          <VStack spacing={4 as SpacingScale}>
            <VStack spacing={3 as SpacingScale}>
              {user.phoneNumber && (
                <HStack justifyContent="space-between">
                  <Text colorTheme="mutedForeground">Phone</Text>
                  <Text>{user.phoneNumber}</Text>
                </HStack>
              )}
              {user.department && (
                <HStack justifyContent="space-between">
                  <Text colorTheme="mutedForeground">Department</Text>
                  <Text>{user.department}</Text>
                </HStack>
              )}
              {user.jobTitle && (
                <HStack justifyContent="space-between">
                  <Text colorTheme="mutedForeground">Job Title</Text>
                  <Text>{user.jobTitle}</Text>
                </HStack>
              )}
              {user.bio && (
                <VStack spacing={1 as SpacingScale}>
                  <Text colorTheme="mutedForeground">Bio</Text>
                  <Text>{user.bio}</Text>
                </VStack>
              )}
            </VStack>

            <Button
              variant="outline"
              fullWidth
              onPress={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          </VStack>
        )}
      </CardContent>
    </Card>
  );
};