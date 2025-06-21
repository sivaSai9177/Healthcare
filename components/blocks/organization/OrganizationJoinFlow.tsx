import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useJoinOrganization } from '@/lib/stores/organization-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/universal/display';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { Input } from '@/components/universal/form';
import { VStack, HStack } from '@/components/universal/layout';
import { Symbol } from '@/components/universal/display/Symbols';
import { haptic } from '@/lib/ui/haptics';

interface OrganizationJoinFlowProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OrganizationJoinFlow({ onSuccess, onCancel }: OrganizationJoinFlowProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const joinMutation = useJoinOrganization();

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Please enter an organization code');
      return;
    }

    setError(null);
    haptic('light');

    try {
      await joinMutation.mutateAsync({ code: code.trim().toUpperCase() });
      
      haptic('success');
      
      if (Platform.OS === 'web') {
        // On web, show a success message in the UI instead of Alert
        if (onSuccess) {
          onSuccess();
        } else {
          router.replace('/(home)' as any);
        }
      } else {
        Alert.alert(
          'Success!',
          'You have successfully joined the organization.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onSuccess) {
                  onSuccess();
                } else {
                  router.replace('/(home)' as any);
                }
              },
            },
          ]
        );
      }
    } catch (err: any) {
      haptic('error');
      setError(err.message || 'Failed to join organization');
    }
  };

  const handleCancel = () => {
    haptic('light');
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        className="flex-1 bg-background" 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center items-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="items-center">
              <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
                <Symbol name="building.2.fill" size={32} color="primary" />
              </View>
              <CardTitle>Join Organization</CardTitle>
              <CardDescription className="text-center">
                Enter the organization code provided by your administrator
              </CardDescription>
            </CardHeader>

            <CardContent>
              <VStack gap={4}>
                <VStack gap={2}>
                  <Text size="sm" weight="medium">Organization Code</Text>
                  <Input
                    placeholder="e.g., ACME-X3K9P2"
                    value={code}
                    onChangeText={(text) => {
                      setCode(text.toUpperCase());
                      setError(null);
                    }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoComplete="off"
                    maxLength={12}
                    error={error || undefined}
                    editable={!joinMutation.isPending}
                  />
                  {error && (
                    <Text size="sm" colorTheme="destructive">
                      {error}
                    </Text>
                  )}
                  <Text size="xs" colorTheme="mutedForeground">
                    The code is typically 10-12 characters long
                  </Text>
                </VStack>

                <VStack gap={3}>
                  <Button
                    variant="default"
                    size="default"
                    onPress={handleSubmit}
                    disabled={!code.trim() || joinMutation.isPending}
                    isLoading={joinMutation.isPending}
                    className="w-full"
                  >
                    {joinMutation.isPending ? 'Joining...' : 'Join Organization'}
                  </Button>

                  <Button
                    variant="ghost"
                    size="default"
                    onPress={handleCancel}
                    disabled={joinMutation.isPending}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </VStack>

                <View className="border-t border-border pt-4">
                  <VStack gap={2} className="items-center">
                    <Text size="sm" colorTheme="mutedForeground">
                      Don&apos;t have a code?
                    </Text>
                    <HStack gap={3}>
                      <Button
                        variant="link"
                        size="sm"
                        onPress={() => {
                          haptic('light');
                          router.push('/(app)/organization/browse' as any);
                        }}
                        disabled={joinMutation.isPending}
                      >
                        Browse Organizations
                      </Button>
                      <Text size="sm" colorTheme="mutedForeground">or</Text>
                      <Button
                        variant="link"
                        size="sm"
                        onPress={() => {
                          haptic('light');
                          router.push('/(app)/organization/create' as any);
                        }}
                        disabled={joinMutation.isPending}
                      >
                        Create New
                      </Button>
                    </HStack>
                  </VStack>
                </View>
              </VStack>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}