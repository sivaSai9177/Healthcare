import React, { useState } from 'react';
import { Alert } from 'react-native';
import { VStack, HStack } from '@/components/universal/layout';
import { Button } from '@/components/universal/interaction';
import { Input, Form } from '@/components/universal/form';
import { Text } from '@/components/universal/typography';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/universal/display';
import { Progress } from '@/components/universal/feedback';
import { api } from '@/lib/api/trpc';
import { log } from '@/lib/core/debug/logger';
import { SpacingScale } from '@/lib/design';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Symbol } from '@/components/universal/display/Symbols';
import { PasswordStrengthIndicator } from '@/components/blocks/auth';

// Password validation schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface PasswordChangeBlockProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PasswordChangeBlock: React.FC<PasswordChangeBlockProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changePasswordMutation = api.auth.changePassword.useMutation({
    onSuccess: () => {
      log.info('Password changed successfully', 'PASSWORD_CHANGE');
      form.reset();
      onSuccess?.();
      
      Alert.alert(
        'Success',
        'Your password has been changed successfully. Please log in again with your new password.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      log.error('Failed to change password', 'PASSWORD_CHANGE', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to change password. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const handleSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const newPassword = form.watch('newPassword');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form form={form} onSubmit={handleSubmit}>
          <VStack spacing={4 as SpacingScale}>
            <Controller
              control={form.control}
              name="currentPassword"
              render={({ field, fieldState }) => (
                <VStack spacing={1 as SpacingScale}>
                  <Text size="sm" weight="medium">Current Password</Text>
                  <HStack spacing={2 as SpacingScale}>
                    <Input
                      {...field}
                      placeholder="Enter current password"
                      secureTextEntry={!showCurrentPassword}
                      autoCapitalize="none"
                      error={fieldState.error?.message}
                      style={{ flex: 1 }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                      icon={showCurrentPassword ? <Symbol name="eye.slash" size={20} /> : <Symbol name="eye" size={20} />}
                    />
                  </HStack>
                </VStack>
              )}
            />

            <Controller
              control={form.control}
              name="newPassword"
              render={({ field, fieldState }) => (
                <VStack spacing={1 as SpacingScale}>
                  <Text size="sm" weight="medium">New Password</Text>
                  <HStack spacing={2 as SpacingScale}>
                    <Input
                      {...field}
                      placeholder="Enter new password"
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      error={fieldState.error?.message}
                      style={{ flex: 1 }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      icon={showNewPassword ? <Symbol name="eye.slash" size={20} /> : <Symbol name="eye" size={20} />}
                    />
                  </HStack>
                  {newPassword && (
                    <PasswordStrengthIndicator password={newPassword} />
                  )}
                </VStack>
              )}
            />

            <Controller
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <VStack spacing={1 as SpacingScale}>
                  <Text size="sm" weight="medium">Confirm New Password</Text>
                  <HStack spacing={2 as SpacingScale}>
                    <Input
                      {...field}
                      placeholder="Confirm new password"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      error={fieldState.error?.message}
                      style={{ flex: 1 }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      icon={showConfirmPassword ? <Symbol name="eye.slash" size={20} /> : <Symbol name="eye" size={20} />}
                    />
                  </HStack>
                </VStack>
              )}
            />

            <VStack spacing={2 as SpacingScale}>
              <Text size="sm" weight="medium" colorTheme="mutedForeground">
                Password Requirements:
              </Text>
              <VStack spacing={1 as SpacingScale}>
                <HStack spacing={2 as SpacingScale} alignItems="center">
                  {newPassword.length >= 8 ? (
                    <Symbol name="checkmark" size={16} className="text-success" />
                  ) : (
                    <Symbol name="xmark" size={16} className="text-muted-foreground" />
                  )}
                  <Text size="sm" colorTheme={newPassword.length >= 8 ? 'success' : 'mutedForeground'}>
                    At least 8 characters
                  </Text>
                </HStack>
                <HStack spacing={2 as SpacingScale} alignItems="center">
                  {/[A-Z]/.test(newPassword) ? (
                    <Symbol name="checkmark" size={16} className="text-success" />
                  ) : (
                    <Symbol name="xmark" size={16} className="text-muted-foreground" />
                  )}
                  <Text size="sm" colorTheme={/[A-Z]/.test(newPassword) ? 'success' : 'mutedForeground'}>
                    One uppercase letter
                  </Text>
                </HStack>
                <HStack spacing={2 as SpacingScale} alignItems="center">
                  {/[a-z]/.test(newPassword) ? (
                    <Symbol name="checkmark" size={16} className="text-success" />
                  ) : (
                    <Symbol name="xmark" size={16} className="text-muted-foreground" />
                  )}
                  <Text size="sm" colorTheme={/[a-z]/.test(newPassword) ? 'success' : 'mutedForeground'}>
                    One lowercase letter
                  </Text>
                </HStack>
                <HStack spacing={2 as SpacingScale} alignItems="center">
                  {/[0-9]/.test(newPassword) ? (
                    <Symbol name="checkmark" size={16} className="text-success" />
                  ) : (
                    <Symbol name="xmark" size={16} className="text-muted-foreground" />
                  )}
                  <Text size="sm" colorTheme={/[0-9]/.test(newPassword) ? 'success' : 'mutedForeground'}>
                    One number
                  </Text>
                </HStack>
                <HStack spacing={2 as SpacingScale} alignItems="center">
                  {/[^A-Za-z0-9]/.test(newPassword) ? (
                    <Symbol name="checkmark" size={16} className="text-success" />
                  ) : (
                    <Symbol name="xmark" size={16} className="text-muted-foreground" />
                  )}
                  <Text size="sm" colorTheme={/[^A-Za-z0-9]/.test(newPassword) ? 'success' : 'mutedForeground'}>
                    One special character
                  </Text>
                </HStack>
              </VStack>
            </VStack>

            <HStack spacing={2 as SpacingScale} justifyContent="flex-end">
              <Button
                variant="outline"
                onPress={() => {
                  form.reset();
                  onCancel?.();
                }}
                disabled={changePasswordMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                isLoading={changePasswordMutation.isPending}
                disabled={!form.formState.isValid}
                onPress={form.handleSubmit(handleSubmit)}
              >
                Change Password
              </Button>
            </HStack>
          </VStack>
        </Form>
      </CardContent>
    </Card>
  );
};