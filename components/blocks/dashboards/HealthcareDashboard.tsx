import React, { Suspense } from 'react';
import { Platform, ScrollView, RefreshControl, View } from 'react-native';
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
  Grid,
} from '@/components/universal';
import { 
  ShiftStatus,
  MetricsOverview,
  AlertSummary,
  ActivePatients,
  EscalationSummary,
} from '@/components/blocks/healthcare';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { useAlertWebSocket } from '@/hooks/healthcare';

export default function HealthcareDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const shadowMd = useShadow({ size: 'md' });
  const [refreshing, setRefreshing] = React.useState(false);
  
  // Hospital context
  const hospitalId = user?.organizationId || 'demo-hospital';
  const role = user?.role as 'doctor' | 'nurse' | 'head_doctor';
  
  // Enable real-time updates
  useAlertWebSocket({
    hospitalId,
    showNotifications: true,
    enabled: true,
  });
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);
  
  const content = (
    <VStack gap={5}>
      {/* Header */}
      <HStack justifyContent="space-between" alignItems="center">
        <Box flex={1}>
          <Heading1>Healthcare Dashboard</Heading1>
          <Text colorTheme="mutedForeground">
            {user?.name || 'Healthcare Professional'}
          </Text>
        </Box>
        <Avatar
          source={user?.image ? { uri: user.image } : undefined}
          name={user?.name || 'User'}
          size="xl"
        />
      </HStack>
      
      {/* Shift Status */}
      <Suspense fallback={<Skeleton height={120} />}>
        <ShiftStatus />
      </Suspense>
      
      {/* Metrics Overview */}
      <Suspense fallback={<Skeleton height={400} />}>
        <MetricsOverview hospitalId={hospitalId} />
      </Suspense>
      
      {/* Alert Summary */}
      <Suspense fallback={<Skeleton height={200} />}>
        <AlertSummary showDetails={true} maxItems={5} />
      </Suspense>
      
      {/* Quick Navigation */}
      <Card style={shadowMd}>
        <Box p={3}>
          <VStack gap={2}>
            <Text size="lg" weight="bold">Quick Actions</Text>
            <Grid columns={2} gap={2}>
              <Button
                onPress={() => router.push('/alerts' as any)}
                variant="outline"
                fullWidth
              >
                View Alerts
              </Button>
              <Button
                onPress={() => router.push('/patients' as any)}
                variant="outline"
                fullWidth
              >
                My Patients
              </Button>
              <Button
                onPress={() => router.push('/shifts/handover' as any)}
                variant="outline"
                fullWidth
              >
                Shift Handover
              </Button>
              <Button
                onPress={() => router.push('/alerts/history' as any)}
                variant="outline"
                fullWidth
              >
                Alert History
              </Button>
            </Grid>
          </VStack>
        </Box>
      </Card>
      
      {/* Active Patients for doctors */}
      {(role === 'doctor' || role === 'head_doctor') && (
        <Suspense fallback={<Skeleton height={400} />}>
          <ActivePatients scrollEnabled={Platform.OS === 'web'} />
        </Suspense>
      )}
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