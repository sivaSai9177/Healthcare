import React, { Suspense } from 'react';
import { Platform, ScrollView, RefreshControl, View } from 'react-native';
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
  Card,
} from '@/components/universal';
import { 
  ShiftStatus,
  MetricsOverview,
  AlertSummaryEnhanced,
  ActivePatients,
  GlassLoadingScreen,
} from '@/components/blocks/healthcare';
import { HospitalSwitcher } from '@/components/blocks/organization';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAlertWebSocket } from '@/hooks/healthcare';
import { useResponsive } from '@/hooks/responsive';

export default function HealthcareDashboard() {
  const { user, hasHydrated, isRefreshing } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const [refreshing, setRefreshing] = React.useState(false);
  const { currentHospital } = useHospitalStore();
  const hospitalPermissions = useHospitalPermissions();
  const { isDesktop, isMobile } = useResponsive();
  
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
    console.log('[HealthcareDashboard] Component state', {
      hasHydrated,
      isAuthenticated: !!user,
      userId: user?.id,
      userRole: user?.role,
      userOrgId: user?.organizationId,
      userOrgName: user?.organizationName,
      defaultHospitalId: user?.defaultHospitalId,
      currentHospitalId: currentHospital?.id,
      currentHospitalName: currentHospital?.name,
      hospitalPermissions: {
        hasHospitalAssigned: hospitalPermissions.hasHospitalAssigned,
        canAccessHealthcare: hospitalPermissions.canAccessHealthcare,
        canCreateAlerts: hospitalPermissions.canCreateAlerts,
        canAcknowledgeAlerts: hospitalPermissions.canAcknowledgeAlerts,
      },
      hospitalId: hospitalId,
      role: role,
      timestamp: new Date().toISOString(),
    });
  }, [user, hasHydrated, currentHospital, hospitalPermissions, hospitalId, role]);
  
  // Show loading state while auth is hydrating or hospitals are loading
  const { isLoading: hospitalsLoading } = useHospitalStore();
  
  if (!hasHydrated || isRefreshing || hospitalsLoading) {
    return <GlassLoadingScreen message="Loading healthcare data..." showProgress={true} />;
  }
  
  // Check if user has hospital assignment after loading is complete
  if (!hospitalPermissions.hasHospitalAssigned && hasHydrated && !hospitalsLoading) {
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
    <VStack gap={spacing[4]}>
      {/* Header */}
      <Card>
        <Box p={4}>
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
        </Box>
      </Card>
      
      {/* Main Content Area */}
      <View style={{
        flexDirection: isDesktop ? 'row' : 'column',
        flexWrap: 'wrap',
        gap: spacing[4],
        marginHorizontal: isDesktop ? -spacing[2] : 0,
      }}>
        {/* Shift Status */}
        <View style={{ 
          flex: isDesktop ? 0 : 1,
          minWidth: isDesktop ? 350 : undefined,
          width: isDesktop ? '40%' : '100%',
          paddingHorizontal: isDesktop ? spacing[2] : 0,
        }}>
          {isRefreshing ? (
            <Skeleton height={180} />
          ) : (
            <Suspense fallback={<Skeleton height={180} />}>
              <HealthcareErrorBoundary>
                <Card>
                  <ShiftStatus />
                </Card>
              </HealthcareErrorBoundary>
            </Suspense>
          )}
        </View>
        
        {/* Metrics Overview */}
        <View style={{ 
          flex: isDesktop ? 1 : 1,
          minWidth: isDesktop ? 400 : undefined,
          paddingHorizontal: isDesktop ? spacing[2] : 0,
        }}>
          {isRefreshing ? (
            <Skeleton height={400} />
          ) : (
            <Suspense fallback={<Skeleton height={400} />}>
              <HealthcareErrorBoundary>
                <Card>
                  <Box p={4}>
                    <MetricsOverview hospitalId={hospitalId} />
                  </Box>
                </Card>
              </HealthcareErrorBoundary>
            </Suspense>
          )}
        </View>
      </View>
      
      {/* Alert Summary */}
      <Card>
        <Box p={4}>
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
        </Box>
      </Card>
      
      {/* Bottom Section */}
      <View style={{
        flexDirection: isDesktop ? 'row' : 'column',
        flexWrap: 'wrap',
        gap: spacing[4],
        marginHorizontal: isDesktop ? -spacing[2] : 0,
      }}>
        {/* Quick Navigation */}
        <View style={{ 
          flex: isDesktop ? 0 : 1,
          minWidth: isDesktop ? 350 : undefined,
          width: isDesktop ? '40%' : '100%',
          paddingHorizontal: isDesktop ? spacing[2] : 0,
        }}>
          <StatusGlassCard className="shadow-lg h-full">
            <Box p={4}>
              <VStack gap={3}>
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
        </View>
        
        {/* Active Patients for doctors - Large widget */}
        {(role === 'doctor' || role === 'head_doctor') && (
          <View style={{ 
            flex: 1,
            minWidth: isDesktop ? 400 : undefined,
            paddingHorizontal: isDesktop ? spacing[2] : 0,
          }}>
            {isRefreshing ? (
              <Skeleton height={400} />
            ) : (
              <Suspense fallback={<Skeleton height={400} />}>
                <HealthcareErrorBoundary>
                  <ActivePatients scrollEnabled={Platform.OS === 'web'} />
                </HealthcareErrorBoundary>
              </Suspense>
            )}
          </View>
        )}
      </View>
    </VStack>
  );
  
  // For mobile, wrap in ScrollView with proper padding
  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          contentContainerStyle={{ 
            flexGrow: 1,
            padding: spacing[4],
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
  
  // For web, render with proper container and max width
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          flexGrow: 1,
          padding: spacing[6],
          width: '100%',
          alignItems: 'center'
        }}
      >
        <View style={{ width: '100%', maxWidth: 1440 }}>
          {content}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}