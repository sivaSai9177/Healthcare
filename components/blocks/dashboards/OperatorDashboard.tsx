import React, { Suspense } from 'react';
import { Platform, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme/provider';
import { api } from '@/lib/api/trpc';
import { 
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Box,
  Heading1,
  Avatar,
  Badge,
  Skeleton,
} from '@/components/universal';
import { 
  AlertSummary,
  EscalationSummary,
  AlertList,
} from '@/components/blocks/healthcare';
import { OrganizationSwitcher } from '@/components/blocks/organization';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { haptic } from '@/lib/ui/haptics';
import { useActiveOrganization } from '@/lib/stores/organization-store';

export default function OperatorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const shadowMd = useShadow({ size: 'md' });
  const [refreshing, setRefreshing] = React.useState(false);
  const { organization: activeOrganization } = useActiveOrganization();
  
  const hospitalId = activeOrganization?.id;
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);
  
  const handleCreateAlert = () => {
    haptic('medium');
    router.push('/(modals)/create-alert');
  };
  
  const content = (
    <VStack gap={5}>
      {/* Header */}
      <VStack gap={3}>
        <HStack justifyContent="space-between" alignItems="center">
          <Box flex={1}>
            <Heading1>Alert Operations</Heading1>
            <Text colorTheme="mutedForeground">
              {user?.name || 'Operator'}
            </Text>
          </Box>
          <Avatar
            source={user?.image ? { uri: user.image } : undefined}
            name={user?.name || 'User'}
            size="xl"
          />
        </HStack>
        
        {/* Organization Switcher */}
        <OrganizationSwitcher variant="compact" />
      </VStack>
      
      {/* Alert Summary */}
      <Suspense fallback={<Skeleton height={200} />}>
        <AlertSummary showDetails={false} maxItems={3} />
      </Suspense>
      
      {/* Escalation Summary */}
      <Suspense fallback={<Skeleton height={200} />}>
        <EscalationSummary hospitalId={hospitalId} />
      </Suspense>
      
      {/* Quick Actions */}
      <Card style={shadowMd}>
        <Box p={4}>
          <VStack gap={3}>
            <Text size="lg" weight="bold">Quick Actions</Text>
            <HStack gap={2}>
              <Button
                onPress={handleCreateAlert}
                variant="destructive"
                fullWidth
              >
                Create New Alert
              </Button>
              <Button
                onPress={() => router.push('/alerts/escalation-queue' as any)}
                variant="outline"
                fullWidth
              >
                Escalation Queue
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Card>
      
      {/* Recent Alerts */}
      <VStack gap={3}>
        <HStack align="center" justify="between">
          <Text size="lg" weight="bold">Recent Alerts</Text>
          <Button
            onPress={() => router.push('/alerts/history' as any)}
            variant="ghost"
            size="sm"
          >
            View History
          </Button>
        </HStack>
        <Suspense fallback={<Skeleton height={300} />}>
          <AlertList 
            hospitalId={hospitalId} 
            role="operator"
            scrollEnabled={Platform.OS === 'web'}
          />
        </Suspense>
      </VStack>
    </VStack>
  );
  
  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[6] }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        >
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  return (
    <Container>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <VStack p={4} gap={4}>
          {content}
        </VStack>
      </ScrollView>
    </Container>
  );
}