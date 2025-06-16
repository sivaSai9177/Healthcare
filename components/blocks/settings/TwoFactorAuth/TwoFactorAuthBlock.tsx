import React, { useState } from 'react';
import { Alert } from 'react-native';
import { VStack, HStack, Separator } from '@/components/universal/layout';
import { Button } from '@/components/universal/interaction';
import { Input, Form } from '@/components/universal/form';
import { Text } from '@/components/universal/typography';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/universal/display';
import { Symbol } from '@/components/universal/display/Symbols';
import { api } from '@/lib/api/trpc';
import { useAuth } from '@/hooks/useAuth';
import { log } from '@/lib/core/debug/logger';
import { SpacingScale } from '@/lib/design';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Email validation schema
const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface TwoFactorAuthBlockProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TwoFactorAuthBlock: React.FC<TwoFactorAuthBlockProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user, refresh } = useAuth();
  const [isEnabling, setIsEnabling] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.email || '',
    },
  });

  // Check if 2FA is enabled
  const { data: twoFactorStatus, refetch } = api.auth.getTwoFactorStatus.useQuery(
    undefined,
    {
      enabled: !!user,
    }
  );

  // Enable 2FA mutation
  const enableTwoFactorMutation = api.auth.enableTwoFactor.useMutation({
    onSuccess: async () => {
      log.info('Two-factor authentication enabled', 'TWO_FACTOR');
      await refetch();
      await refresh();
      setIsEnabling(false);
      onSuccess?.();
      
      Alert.alert(
        'Success',
        'Two-factor authentication has been enabled for your account.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      log.error('Failed to enable two-factor authentication', 'TWO_FACTOR', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to enable two-factor authentication. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  // Disable 2FA mutation
  const disableTwoFactorMutation = api.auth.disableTwoFactor.useMutation({
    onSuccess: async () => {
      log.info('Two-factor authentication disabled', 'TWO_FACTOR');
      await refetch();
      await refresh();
      
      Alert.alert(
        'Success',
        'Two-factor authentication has been disabled for your account.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      log.error('Failed to disable two-factor authentication', 'TWO_FACTOR', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to disable two-factor authentication. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  // Send magic link mutation
  const sendMagicLinkMutation = api.auth.sendMagicLink.useMutation({
    onSuccess: () => {
      log.info('Magic link sent', 'TWO_FACTOR');
      setMagicLinkSent(true);
      
      // Start countdown
      let timer = 60;
      setCountdown(timer);
      const interval = setInterval(() => {
        timer -= 1;
        setCountdown(timer);
        if (timer <= 0) {
          clearInterval(interval);
          setMagicLinkSent(false);
        }
      }, 1000);
      
      Alert.alert(
        'Magic Link Sent',
        'We\'ve sent a magic link to your email address. Click the link to enable two-factor authentication.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      log.error('Failed to send magic link', 'TWO_FACTOR', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send magic link. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const handleEnableTwoFactor = () => {
    setIsEnabling(true);
  };

  const handleSendMagicLink = (data: EmailFormData) => {
    sendMagicLinkMutation.mutate({ email: data.email });
  };

  const handleDisableTwoFactor = () => {
    Alert.alert(
      'Disable Two-Factor Authentication',
      'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: () => disableTwoFactorMutation.mutate(),
        },
      ]
    );
  };

  const isEnabled = twoFactorStatus?.enabled || false;

  return (
    <Card>
      <CardHeader>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack spacing={1 as SpacingScale}>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Add an extra layer of security with magic link authentication
            </CardDescription>
          </VStack>
          <Badge variant={isEnabled ? 'success' : 'secondary'}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </HStack>
      </CardHeader>
      
      <CardContent>
        <VStack spacing={4 as SpacingScale}>
          {!isEnabled && !isEnabling ? (
            <>
              <HStack spacing={3 as SpacingScale} alignItems="center">
                <Symbol name="shield" size={48} className="text-muted-foreground" />
                <VStack flex={1} spacing={1 as SpacingScale}>
                  <Text weight="medium">Enhanced Security</Text>
                  <Text size="sm" colorTheme="mutedForeground">
                    Two-factor authentication adds an extra layer of security by requiring
                    a magic link sent to your email for login.
                  </Text>
                </VStack>
              </HStack>
              
              <Separator />
              
              <VStack spacing={2 as SpacingScale}>
                <Text size="sm" weight="medium">Benefits:</Text>
                <VStack spacing={1 as SpacingScale} pl={4 as SpacingScale}>
                  <HStack spacing={2 as SpacingScale}>
                    <Symbol name="checkmark" size={16} className="text-success" />
                    <Text size="sm">Protects against password theft</Text>
                  </HStack>
                  <HStack spacing={2 as SpacingScale}>
                    <Symbol name="checkmark" size={16} className="text-success" />
                    <Text size="sm">No need to remember complex passwords</Text>
                  </HStack>
                  <HStack spacing={2 as SpacingScale}>
                    <Symbol name="checkmark" size={16} className="text-success" />
                    <Text size="sm">Quick and secure email-based authentication</Text>
                  </HStack>
                </VStack>
              </VStack>
              
              <Button
                variant="solid"
                fullWidth
                onPress={handleEnableTwoFactor}
                icon={<Symbol name="shield.checkered" size={20} />}
              >
                Enable Two-Factor Authentication
              </Button>
            </>
          ) : isEnabling ? (
            <>
              <Text size="sm" colorTheme="mutedForeground">
                To enable two-factor authentication, we'll send a magic link to your email
                address. Click the link to confirm and enable this feature.
              </Text>
              
              <Form form={form} onSubmit={handleSendMagicLink}>
                <VStack spacing={3 as SpacingScale}>
                  <FormItem
                    name="email"
                    label="Email Address"
                  >
                    {(field) => (
                      <Input
                        {...field}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!magicLinkSent}
                        onChangeText={field.onChange}
                      />
                    )}
                  </FormItem>
                  
                  <HStack spacing={2 as SpacingScale}>
                    <Button
                      variant="outline"
                      flex={1}
                      onPress={() => {
                        setIsEnabling(false);
                        onCancel?.();
                      }}
                      disabled={sendMagicLinkMutation.isPending || magicLinkSent}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="solid"
                      flex={1}
                      isLoading={sendMagicLinkMutation.isPending}
                      disabled={magicLinkSent}
                      onPress={form.handleSubmit(handleSendMagicLink)}
                    >
                      {magicLinkSent ? `Resend in ${countdown}s` : 'Send Magic Link'}
                    </Button>
                  </HStack>
                </VStack>
              </Form>
              
              {magicLinkSent && (
                <Card borderTheme="primary" bgTheme="primary" className="bg-opacity-5">
                  <CardContent>
                    <HStack spacing={2 as SpacingScale} alignItems="center">
                      <Symbol name="envelope.badge" size={20} className="text-primary" />
                      <Text size="sm" colorTheme="primary">
                        Check your email for the magic link to enable two-factor authentication.
                      </Text>
                    </HStack>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <>
              <HStack spacing={3 as SpacingScale} alignItems="center">
                <Symbol name="shield.checkered" size={48} className="text-success" />
                <VStack flex={1} spacing={1 as SpacingScale}>
                  <Text weight="medium" colorTheme="success">
                    Two-Factor Authentication Active
                  </Text>
                  <Text size="sm" colorTheme="mutedForeground">
                    Your account is protected with magic link authentication.
                  </Text>
                </VStack>
              </HStack>
              
              <Separator />
              
              <Text size="sm" colorTheme="mutedForeground">
                When you sign in, we'll send a magic link to your registered email address.
                Simply click the link to access your account securely.
              </Text>
              
              <Button
                variant="destructive"
                fullWidth
                onPress={handleDisableTwoFactor}
                isLoading={disableTwoFactorMutation.isPending}
              >
                Disable Two-Factor Authentication
              </Button>
            </>
          )}
        </VStack>
      </CardContent>
    </Card>
  );
};