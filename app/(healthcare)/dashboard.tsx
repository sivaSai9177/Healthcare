import React, { Suspense, useTransition } from 'react';
import { Platform, ScrollView, RefreshControl, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
  Separator,
  SimpleBreadcrumb,
  SidebarTrigger,
  Skeleton,
  Grid,
} from '@/components/universal';
import { 
  AlertCreationForm,
  AlertList,
  AlertSummary,
  MetricsOverview,
  PatientCard,
  ActivePatients,
} from '@/components/blocks/healthcare';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { useResponsive } from '@/hooks/responsive';
import { haptic } from '@/lib/ui/haptics';

import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { HealthcareUserRole } from '@/types/healthcare';
import { log } from '@/lib/core/debug/logger';
import { api } from '@/lib/trpc';

export default function HealthcareDashboard() {
// TODO: Replace with structured logging - console.log('[HealthcareDashboard] Rendering');
  const { user } = useAuthStore();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { spacing } = useSpacing();
  const { isMobile, isTablet } = useResponsive();
  const shadowMd = useShadow({ size: 'md' });
  const shadowLg = useShadow({ size: 'lg' });
  const [refreshing, setRefreshing] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  
// TODO: Replace with structured logging - console.log('[HealthcareDashboard] User:', user?.email, 'Role:', user?.role);
// TODO: Replace with structured logging - console.log('[HealthcareDashboard] Theme background:', theme.background);
  
  // Early return if no user (this should be handled by layout, but adding as safety)
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  // For demo, use a placeholder hospital ID
  const hospitalId = 'f155b026-01bd-4212-94f3-e7aedef2801d';
  
  // Get on-duty status - only query if user exists
  const { data: onDutyStatus } = api.healthcare.getOnDutyStatus.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Toggle on-duty status
  const toggleOnDutyMutation = api.healthcare.toggleOnDuty.useMutation({
    onSuccess: () => {
      log.info('On-duty status toggled', 'HEALTHCARE_UI');
    },
  });
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    startTransition(() => {
      // Refresh data here
      setTimeout(() => setRefreshing(false), 1500);
    });
  }, []);
  
  // Get role-specific content
  const getRoleContent = () => {
    const role = user?.role as HealthcareUserRole;
    
    // Ensure role is defined
    if (!role) {
      return (
        <Card>
          <Box p={spacing[5]}>
            <VStack gap={spacing[3]} alignItems="center">
              <Text size="lg" colorTheme="mutedForeground">
              Loading user role...
            </Text>
          </VStack>
          </Box>
        </Card>
      );
    }
    
    switch (role) {
      case 'operator':
        return (
          <VStack gap={spacing[5]}>
            {/* Alert Summary */}
            <Suspense fallback={<Skeleton height={200} />}>
              <AlertSummary 
                showDetails={false}
                maxItems={3}
              />
            </Suspense>
            
            {/* Quick Actions */}
            <Card style={shadowMd}>
              <Box p={spacing[4]}>
                <VStack gap={spacing[3]}>
                  <Text size="lg" weight="bold">Quick Actions</Text>
                  <HStack gap={spacing[2]}>
                    <Button
                      onPress={() => router.push('/(modals)/create-alert')}
                      variant="destructive"
                      fullWidth
                    >
                      Create New Alert
                    </Button>
                    <Button
                      onPress={() => router.push('/(healthcare)/alerts')}
                      variant="outline"
                      fullWidth
                    >
                      View All Alerts
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </Card>
            
            {/* Recent Activity */}
            <VStack gap={spacing[3]}>
              <HStack align="center" justify="between">
                <Text size="lg" weight="bold">Recent Alerts</Text>
                <Button
                  onPress={() => router.push('/(healthcare)/alert-history')}
                  variant="ghost"
                  size="sm"
                >
                  View History
                </Button>
              </HStack>
              <Suspense fallback={<Skeleton height={300} />}>
                <AlertList 
                  hospitalId={hospitalId} 
                  role={role}
                  showResolved={false}
                  maxItems={5}
                />
              </Suspense>
            </VStack>
          </VStack>
        );
        
      case 'doctor':
      case 'nurse':
      case 'head_doctor':
        return (
          <VStack gap={spacing[5]}>
            {/* On-Duty Status Card */}
            <Card style={shadowMd}>
              <Box p={spacing[4]}>
                <HStack justifyContent="space-between" alignItems="center">
                <VStack gap={spacing[1]}>
                  <Text weight="semibold">Duty Status</Text>
                  <Text size="sm" colorTheme="mutedForeground">
                    {onDutyStatus?.isOnDuty ? 'Currently on duty' : 'Off duty'}
                  </Text>
                </VStack>
                <Button
                  onPress={() => {
                    startTransition(() => {
                      toggleOnDutyMutation.mutate({
                        isOnDuty: !onDutyStatus?.isOnDuty
                      });
                    });
                  }}
                  variant={onDutyStatus?.isOnDuty ? 'destructive' : 'secondary'}
                  size="sm"
                  isLoading={isPending}
                >
                  {onDutyStatus?.isOnDuty ? 'End Shift' : 'Start Shift'}
                </Button>
              </HStack>
              </Box>
            </Card>
            
            {/* Metrics Overview */}
            <Suspense fallback={<Skeleton height={400} />}>
              <MetricsOverview hospitalId={hospitalId} />
            </Suspense>
            
            {/* Alert Summary */}
            <Suspense fallback={<Skeleton height={200} />}>
              <AlertSummary 
                showDetails={true}
                maxItems={5}
              />
            </Suspense>
            
            {/* Quick Navigation */}
            <Card style={shadowMd}>
              <Box p={spacing[3]}>
                <HStack gap={spacing[2]}>
                  <Button
                    onPress={() => router.push('/(healthcare)/alerts')}
                    variant="outline"
                    fullWidth
                  >
                    View All Alerts
                  </Button>
                  <Button
                    onPress={() => router.push('/(healthcare)/patients')}
                    variant="outline"
                    fullWidth
                  >
                    My Patients
                  </Button>
                </HStack>
              </Box>
            </Card>
            
            {/* Active Patients for doctors */}
            {(role === 'doctor' || role === 'head_doctor') && (
              <Suspense fallback={<Skeleton height={400} />}>
                <ActivePatients />
              </Suspense>
            )}
          </VStack>
        );
        
      case 'admin':
        return (
          <VStack gap={spacing[5]}>
            {/* System Metrics Overview */}
            <Suspense fallback={<Skeleton height={400} />}>
              <MetricsOverview hospitalId={hospitalId} />
            </Suspense>
            
            {/* Admin Actions */}
            <Card style={shadowMd}>
              <Box p={spacing[5]}>
                <VStack gap={spacing[3]}>
                <Text weight="bold" size="lg">System Actions</Text>
                <Grid columns={Platform.OS === 'web' ? 2 : 1} gap={spacing[3]}>
                  <Button
                    onPress={() => router.push('/(home)/admin')}
                    variant="outline"
                    fullWidth
                  >
                    User Management
                  </Button>
                  <Button
                    onPress={() => {
                      startTransition(() => {
                        log.info('View analytics clicked', 'HEALTHCARE_UI');
                      });
                    }}
                    variant="outline"
                    fullWidth
                  >
                    View Analytics
                  </Button>
                  <Button
                    onPress={() => {
                      startTransition(() => {
                        log.info('System settings clicked', 'HEALTHCARE_UI');
                      });
                    }}
                    variant="outline"
                    fullWidth
                  >
                    System Settings
                  </Button>
                  <Button
                    onPress={() => {
                      startTransition(() => {
                        log.info('Export reports clicked', 'HEALTHCARE_UI');
                      });
                    }}
                    variant="outline"
                    fullWidth
                  >
                    Export Reports
                  </Button>
                </Grid>
              </VStack>
              </Box>
            </Card>
            
            {/* System Overview */}
            <VStack gap={spacing[3]}>
              <HStack align="center" justify="between">
                <Text size="lg" weight="bold">System Overview</Text>
                <Button
                  onPress={() => router.push('/(healthcare)/activity-logs')}
                  variant="ghost"
                  size="sm"
                >
                  View Activity Logs
                </Button>
              </HStack>
              <Suspense fallback={<Skeleton height={200} />}>
                <AlertSummary 
                  showDetails={false}
                  maxItems={3}
                />
              </Suspense>
            </VStack>
          </VStack>
        );
        
      default:
        return (
          <Card>
            <VStack gap={spacing[3]} alignItems="center" p={spacing[4]}>
              <Text size="4xl">👋</Text>
              <Text size="lg" weight="bold">Welcome to Hospital Alert System</Text>
              <Text colorTheme="mutedForeground" align="center">
                Please complete your profile to access the system
              </Text>
              <Button
                onPress={() => router.push('/(home)/settings')}
                variant="outline"
              >
                Complete Profile
              </Button>
            </VStack>
          </Card>
        );
    }
  };
  
  const content = (
    <VStack gap={spacing[5]}>
        {/* Header */}
        <HStack justifyContent="space-between" alignItems="center">
        <Box flex={1}>
          <Heading1>Hospital Alert System</Heading1>
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
      
      {/* Role Badge */}
      <Card style={shadowMd}>
        <Box p={spacing[4]}>
          <HStack justifyContent="space-between" alignItems="center">
          <Box>
            <Text weight="semibold">{user?.email}</Text>
            <Text size="sm" colorTheme="mutedForeground">
              {user?.organizationName || 'Hospital System'}
            </Text>
          </Box>
          <Badge
            variant={
              user?.role === 'admin' ? 'error' :
              user?.role === 'head_doctor' ? 'default' :
              user?.role === 'doctor' ? 'secondary' :
              user?.role === 'nurse' ? 'outline' :
              'outline'
            }
            size="lg"
          >
            <Text size="sm" weight="semibold">
              {(user?.role || 'user').replace('_', ' ').toUpperCase()}
            </Text>
          </Badge>
        </HStack>
        </Box>
      </Card>
      
      <Separator />
      
      {/* Role-specific content */}
      {getRoleContent()}
    </VStack>
  );
  
  // Mobile view
  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        >
          <VStack p={spacing[4]} gap={spacing[4]} className="animate-fade-in">
            {content}
          </VStack>
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  // Web view
  return (
    <Container>
      <VStack p={0} gap={0}>
        {/* Header with Toggle and Breadcrumbs */}
        <Box
          px={spacing[4]}
          py={spacing[3]}
          borderBottomWidth={1}
          borderTheme="border"
        >
          <HStack alignItems="center" gap={spacing[2]} mb={spacing[2]}>
            <SidebarTrigger />
            <Separator orientation="vertical" style={{ height: 24 }} />
            <SimpleBreadcrumb
              items={[{ label: "Healthcare Dashboard", current: true }]}
              showHome={false}
            />
          </HStack>
        </Box>
        
        <ScrollView>
          <VStack p={spacing[4]} gap={spacing[4]} className="animate-fade-in">
            {content}
          </VStack>
        </ScrollView>
      </VStack>
    </Container>
  );
}