import React from 'react';
import { ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme/provider';
import { Container, VStack, HStack, Text, Button } from '@/components/universal';
import { SystemSettingsBlock, SystemHealthBlock } from '@/components/blocks/admin';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Symbol } from '@/components/universal/display/Symbols';

export default function SystemScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();

  // Check admin access
  if (!user || user.role !== 'admin') {
    return (
      <Container>
        <VStack p={4} gap={4 as any} alignItems="center" justifyContent="center" style={{ flex: 1 }}>
          <Text size="base">Access Restricted</Text>
          <Text colorTheme="mutedForeground">
            This section is only available to administrators
          </Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </VStack>
      </Container>
    );
  }

  const content = (
    <VStack gap={4 as any}>
      {/* Header */}
      <HStack alignItems="center" gap={2 as any}>
        <Button
          onPress={() => router.back()}
          variant="ghost"
          size="icon"
        >
          <Symbol name="chevron.left" size={24} />
        </Button>
        <VStack gap={1 as any}>
          <Text size="2xl" weight="bold">System Settings</Text>
          <Text size="sm" colorTheme="mutedForeground">
            Configure system-wide settings and monitoring
          </Text>
        </VStack>
      </HStack>

      {/* System Health Monitoring */}
      <SystemHealthBlock />

      {/* System Settings Configuration */}
      <SystemSettingsBlock />
    </VStack>
  );

  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing[4] as any, paddingBottom: spacing[6] as any }}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <Container>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing[16] as any }}
        showsVerticalScrollIndicator={false}
      >
        <VStack p={6} gap={4 as any}>
          {content}
        </VStack>
      </ScrollView>
    </Container>
  );
}