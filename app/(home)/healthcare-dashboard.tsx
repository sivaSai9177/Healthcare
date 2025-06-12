import React, { Suspense, useTransition } from 'react';
import { Platform, ScrollView, RefreshControl } from 'react-native';
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
  AlertCreationBlock,
  AlertListBlock,
  HealthcareMetricsOverviewBlock,
  PatientCardBlock,
} from '@/components/healthcare/blocks';


import { useAuthStore } from '@/lib/stores/auth-store';
import { useTheme } from '@/lib/theme/provider';
import { HealthcareUserRole } from '@/types/healthcare';
import { log } from '@/lib/core/debug/logger';
import { api } from '@/lib/api/trpc';
import { SpacingScale } from '@/lib/design';

export default function HealthcareDashboard() {
// TODO: Replace with structured logging - console.log('[HealthcareDashboard] Rendering');
  const { user } = useAuthStore();
  const router = useRouter();
  const theme = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showCreateAlert, setShowCreateAlert] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  
// TODO: Replace with structured logging - console.log('[HealthcareDashboard] User:', user?.email, 'Role:', user?.role);
// TODO: Replace with structured logging - console.log('[HealthcareDashboard] Theme background:', theme.background);
  
  // For demo, use a placeholder hospital ID
  const hospitalId = 'f155b026-01bd-4212-94f3-e7aedef2801d';
  
  // Get on-duty status
  const { data: onDutyStatus } = api.healthcare.getOnDutyStatus.useQuery();
  
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
          <Box p={5 as SpacingScale}>
            <VStack gap={3 as SpacingScale} alignItems="center">
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
          <>
            {!showCreateAlert ? (
              <VStack gap={5 as SpacingScale}>
                <Card shadow="lg">
                  <Box p={5 as SpacingScale}>
                    <VStack gap={3 as SpacingScale} alignItems="center">
                    <Text size="4xl">🚨</Text>
                    <Text size="xl" weight="bold">Alert Center</Text>
                    <Text colorTheme="mutedForeground" align="center">
                      Create emergency alerts to notify medical staff
                    </Text>
                    <Button
                      onPress={() => setShowCreateAlert(true)}
                      colorScheme="destructive"
                      size="lg"
                      fullWidth
                    >
                      Create New Alert
                    </Button>
                  </VStack>
                  </Box>
                </Card>
                
                <Separator />
                
                <VStack gap={4 as SpacingScale}>
                  <Text size="xl" weight="bold">Recent Alerts</Text>
                  <Suspense fallback={<Skeleton height={400} />}>
                    <AlertListBlock 
                      hospitalId={hospitalId} 
                      role={role}
                      showResolved={false}
                      maxHeight={600}
                    />
                  </Suspense>
                </VStack>
              </VStack>
            ) : (
              <VStack gap={5 as SpacingScale}>
                <HStack alignItems="center" gap={2 as SpacingScale}>
                  <Button
                    onPress={() => setShowCreateAlert(false)}
                    variant="ghost"
                    size="sm"
                  >
                    ← Back
                  </Button>
                  <Text size="xl" weight="bold">Create Alert</Text>
                </HStack>
                <Suspense fallback={<Skeleton height={500} />}>
                  <AlertCreationBlock hospitalId={hospitalId} />
                </Suspense>
              </VStack>
            )}
          </>
        );
        
      case 'doctor':
      case 'nurse':
      case 'head_doctor':
        return (
          <VStack gap={5 as SpacingScale}>
            {/* On-Duty Status Card */}
            <Card shadow="md">
              <Box p={4 as SpacingScale}>
                <HStack justifyContent="space-between" alignItems="center">
                <VStack gap={1 as SpacingScale}>
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
                  colorScheme={onDutyStatus?.isOnDuty ? 'destructive' : 'secondary'}
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
              <HealthcareMetricsOverviewBlock hospitalId={hospitalId} />
            </Suspense>
            
            {/* Active Alerts */}
            <VStack gap={4 as SpacingScale}>
              <Text size="xl" weight="bold">Active Alerts</Text>
              <Suspense fallback={<Skeleton height={400} />}>
                <AlertListBlock 
                  hospitalId={hospitalId} 
                  role={role}
                  showResolved={false}
                />
              </Suspense>
            </VStack>
            
            {/* Patient Cards for doctors */}
            {(role === 'doctor' || role === 'head_doctor') && (
              <VStack gap={4 as SpacingScale}>
                <Text size="xl" weight="bold">My Patients</Text>
                <Grid columns={Platform.OS === 'web' ? 2 : 1} gap={4 as SpacingScale}>
                  <Suspense fallback={<Skeleton height={300} />}>
                    <PatientCardBlock patientId="patient-1" />
                  </Suspense>
                  <Suspense fallback={<Skeleton height={300} />}>
                    <PatientCardBlock patientId="patient-2" />
                  </Suspense>
                </Grid>
              </VStack>
            )}
          </VStack>
        );
        
      case 'admin':
        return (
          <VStack gap={5 as SpacingScale}>
            {/* System Metrics Overview */}
            <Suspense fallback={<Skeleton height={400} />}>
              <HealthcareMetricsOverviewBlock hospitalId={hospitalId} />
            </Suspense>
            
            {/* Admin Actions */}
            <Card shadow="md">
              <Box p={5 as SpacingScale}>
                <VStack gap={3 as SpacingScale}>
                <Text weight="bold" size="lg">System Actions</Text>
                <Grid columns={Platform.OS === 'web' ? 2 : 1} gap={3 as SpacingScale}>
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
            
            {/* All Alerts with resolved */}
            <VStack gap={4 as SpacingScale}>
              <Text size="xl" weight="bold">All System Alerts</Text>
              <Suspense fallback={<Skeleton height={400} />}>
                <AlertListBlock 
                  hospitalId={hospitalId} 
                  role={role}
                  showResolved={true}
                />
              </Suspense>
            </VStack>
          </VStack>
        );
        
      default:
        return (
          <Card>
            <VStack gap={3 as SpacingScale} alignItems="center" p={4 as SpacingScale}>
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
    <VStack gap={5 as SpacingScale}>
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
      <Card shadow="sm">
        <Box p={4 as SpacingScale}>
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
          <VStack p={4 as SpacingScale} gap={4 as SpacingScale}>
            {content}
          </VStack>
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  // Web view
  return (
    <Container>
      <VStack p={0} spacing={0}>
        {/* Header with Toggle and Breadcrumbs */}
        <Box
          px={4 as SpacingScale}
          py={3 as SpacingScale}
          borderBottomWidth={1}
          borderTheme="border"
        >
          <HStack alignItems="center" gap={2 as SpacingScale} mb={2}>
            <SidebarTrigger />
            <Separator orientation="vertical" style={{ height: 24 }} />
            <SimpleBreadcrumb
              items={[{ label: "Healthcare Dashboard", current: true }]}
              showHome={false}
            />
          </HStack>
        </Box>
        
        <ScrollView>
          <VStack p={4 as SpacingScale} gap={4 as SpacingScale}>
            {content}
          </VStack>
        </ScrollView>
      </VStack>
    </Container>
  );
}