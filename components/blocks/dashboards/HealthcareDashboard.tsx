import React, { Suspense } from 'react';
import { Platform, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme/provider';
import { useHospitalStore } from '@/lib/stores/hospital-store';
import { useHospitalPermissions } from '@/hooks/useHospitalPermissions';
import { HealthcareErrorBoundary } from '@/components/providers/HealthcareErrorBoundary';
import { 
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Heading1,
  Avatar,
  Skeleton,
  Grid,
  StatusGlassCard,
} from '@/components/universal';
import { 
  ShiftStatus,
  MetricsOverview,
  AlertSummaryEnhanced,
  ActivePatients,
} from '@/components/blocks/healthcare';
import { HospitalSwitcher } from '@/components/blocks/organization';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAlertWebSocket } from '@/hooks/healthcare';
import { 
  DashboardGrid,
  Widget,
} from '@/components/universal/layout/WidgetGrid';
import { useResponsive } from '@/hooks/responsive';

export default function HealthcareDashboard() {
  const { user, hasHydrated, isRefreshing } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const [refreshing, setRefreshing] = React.useState(false);
  const { currentHospital } = useHospitalStore();
  const hospitalPermissions = useHospitalPermissions();
  const { isDesktop } = useResponsive();
  
  // Healthcare context
  const role = user?.role as 'doctor' | 'nurse' | 'head_doctor' | 'operator';
  const hospitalId = currentHospital?.id || user?.defaultHospitalId || '';
  
  // Hooks must be called before conditional returns
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);
  
  // Enable real-time updates (only if we have a hospitalId)
  useAlertWebSocket({
    hospitalId: hospitalId,
    showNotifications: true,
    enabled: !!hospitalId && hospitalId !== '',
  });
  
  // Debug log to check user state
  React.useEffect(() => {

  }, [user, hasHydrated]);
  
  // Show loading state while auth is hydrating
  if (!hasHydrated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Container className="flex-1 items-center justify-center">
          <VStack gap={4} alignItems="center">
            <Text size="lg" colorTheme="mutedForeground">Loading...</Text>
          </VStack>
        </Container>
      </SafeAreaView>
    );
  }
  
  // Check if user has hospital assignment
  if (!hospitalPermissions.hasHospitalAssigned) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Container className="flex-1 items-center justify-center">
          <VStack gap={4} alignItems="center">
            <Text size="lg" weight="semibold">Hospital Assignment Required</Text>
            <Text colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
              Healthcare features require hospital assignment.
            </Text>
            <Button 
              onPress={() => router.push('/settings')}
              variant="outline"
            >
              Complete Your Profile
            </Button>
          </VStack>
        </Container>
      </SafeAreaView>
    );
  }
  
  const content = (
    <DashboardGrid>
      {/* Header */}
      <Widget size="full">
        <VStack gap={3}>
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
          
          {/* Hospital Switcher */}
          <HospitalSwitcher compact={false} />
        </VStack>
      </Widget>
      
      {/* Shift Status */}
      <Widget size={isDesktop ? "medium" : "full"}>
        {isRefreshing ? (
          <Skeleton height={120} />
        ) : (
          <Suspense fallback={<Skeleton height={120} />}>
            <HealthcareErrorBoundary>
              <ShiftStatus />
            </HealthcareErrorBoundary>
          </Suspense>
        )}
      </Widget>
      
      {/* Metrics Overview */}
      <Widget size={isDesktop ? "large" : "full"}>
        {isRefreshing ? (
          <Skeleton height={400} />
        ) : (
          <Suspense fallback={<Skeleton height={400} />}>
            <HealthcareErrorBoundary>
              <MetricsOverview hospitalId={hospitalId} />
            </HealthcareErrorBoundary>
          </Suspense>
        )}
      </Widget>
      
      {/* Alert Summary */}
      <Widget size="full">
        {isRefreshing ? (
          <Skeleton height={200} />
        ) : (
          <Suspense fallback={<Skeleton height={200} />}>
            <HealthcareErrorBoundary>
              <AlertSummaryEnhanced 
                showOrganizationStats={true} 
                showDetails={true} 
                maxItems={5} 
              />
            </HealthcareErrorBoundary>
          </Suspense>
        )}
      </Widget>
      
      {/* Quick Navigation */}
      <Widget size={isDesktop ? "medium" : "full"}>
        <StatusGlassCard className="shadow-lg">
          <Box p={3}>
            <VStack gap={2}>
              <Text size="lg" weight="bold">Quick Actions</Text>
              {/* Alert Creation Button for operators and head doctors */}
              {(role === 'operator' || role === 'head_doctor') && (
                <Button
                  onPress={() => router.push('/(modals)/create-alert')}
                  variant="glass-destructive"
                  fullWidth
                  style={{ marginBottom: spacing[2] }}
                  className="shadow-md"
                >
                  🚨 Create Emergency Alert
                </Button>
              )}
              <Grid columns={2} gap={2}>
                <Button
                  onPress={() => router.push('/alerts' as any)}
                  variant="glass"
                  fullWidth
                  className="shadow-sm"
                >
                  View Alerts
                </Button>
                <Button
                  onPress={() => router.push('/patients' as any)}
                  variant="glass"
                  fullWidth
                  className="shadow-sm"
                >
                  My Patients
                </Button>
                <Button
                  onPress={() => router.push('/shifts/handover' as any)}
                  variant="glass"
                  fullWidth
                  className="shadow-sm"
                >
                  Shift Handover
                </Button>
                <Button
                  onPress={() => router.push('/alerts/history' as any)}
                  variant="glass"
                  fullWidth
                  className="shadow-sm"
                >
                  Alert History
                </Button>
              </Grid>
            </VStack>
          </Box>
        </StatusGlassCard>
      </Widget>
      
      {/* Active Patients for doctors - Large widget */}
      {(role === 'doctor' || role === 'head_doctor') && (
        <Widget size={isDesktop ? "large" : "full"} minHeight={400}>
          {isRefreshing ? (
            <Skeleton height={400} />
          ) : (
            <Suspense fallback={<Skeleton height={400} />}>
              <HealthcareErrorBoundary>
                <ActivePatients scrollEnabled={Platform.OS === 'web'} />
              </HealthcareErrorBoundary>
            </Suspense>
          )}
        </Widget>
      )}
    </DashboardGrid>
  );
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingBottom: spacing[6],
        }}
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