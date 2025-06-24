import React from 'react';
import { ScrollView } from 'react-native';
import { Container, Text, VStack, Card, HStack, Button, Symbol } from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ShiftReportsScreen() {
  const theme = useTheme();
  const { spacing } = useSpacing();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView>
        <Container maxWidth="4xl">
          <VStack gap={spacing[6] as any} py={spacing[6] as any}>
            <VStack gap={spacing[2] as any}>
              <Text size="3xl" weight="bold">Shift Reports</Text>
              <Text colorTheme="mutedForeground">
                View shift summaries and reports
              </Text>
            </VStack>

            <Card>
              <VStack gap={spacing[4] as any} p={spacing[6] as any}>
                <HStack alignItems="center" gap={spacing[2] as any}>
                  <Symbol name="doc.text" size={24} color={theme.primary} />
                  <Text size="lg" weight="medium">Coming Soon</Text>
                </HStack>
                <Text colorTheme="mutedForeground">
                  The shift reporting feature is currently under development.
                </Text>
              </VStack>
            </Card>
          </VStack>
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
}