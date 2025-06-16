import React from 'react';
import { ScrollView } from 'react-native';
import { Container, VStack, Text } from '@/components/universal';
import { SystemSettingsBlock, SystemHealthBlock } from '@/components/blocks/admin';
import { useSpacing } from '@/lib/stores/spacing-store';

export default function SystemScreen() {
  const { spacing } = useSpacing();

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: spacing[16] }}
    >
      <Container maxWidth="full" padding={6}>
        <VStack spacing="lg">
          {/* Header */}
          <VStack spacing="xs">
            <Text size="2xl" weight="bold">System Settings</Text>
            <Text size="sm" className="text-muted-foreground">
              Configure system-wide settings and monitoring
            </Text>
          </VStack>

          {/* System Health Monitoring */}
          <SystemHealthBlock />

          {/* System Settings Configuration */}
          <SystemSettingsBlock />
        </VStack>
      </Container>
    </ScrollView>
  );
}