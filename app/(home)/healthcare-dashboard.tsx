import React from 'react';
import { Platform, ScrollView, RefreshControl } from 'react-native';
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
  Sidebar07Trigger,
} from '@/components/universal';
import { AlertDashboard } from '@/components/healthcare/AlertDashboard';
import { AlertCreationForm } from '@/components/healthcare/AlertCreationForm';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useTheme } from '@/lib/theme/theme-provider';
import { HealthcareUserRole } from '@/types/healthcare';
import { log } from '@/lib/core/logger';
import { api } from '@/lib/trpc';

export default function HealthcareDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const theme = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showCreateAlert, setShowCreateAlert] = React.useState(false);
  
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
    // Refresh data here
    setTimeout(() => setRefreshing(false), 1500);
  }, []);
  
  // Get role-specific content
  const getRoleContent = () => {
    const role = user?.role as HealthcareUserRole;
    
    switch (role) {
      case 'operator':
        return (
          <>
            {!showCreateAlert ? (
              <VStack spacing={4}>
                <Card>
                  <VStack spacing={3} align="center" p={4}>
                    <Text size="4xl">🚨</Text>
                    <Text size="lg" weight="bold">Alert Center</Text>
                    <Text colorTheme="mutedForeground" align="center">
                      Create emergency alerts to notify medical staff
                    </Text>
                    <Button
                      onPress={() => setShowCreateAlert(true)}
                      variant="destructive"
                      size="lg"
                      fullWidth
                    >
                      Create New Alert
                    </Button>
                  </VStack>
                </Card>
                
                <Separator />
                
                <Text size="lg" weight="bold">Recent Alerts</Text>
                <AlertDashboard role={role} hospitalId={hospitalId} />
              </VStack>
            ) : (
              <VStack spacing={4}>
                <HStack align="center" spacing={2}>
                  <Button
                    onPress={() => setShowCreateAlert(false)}
                    variant="ghost"
                    size="sm"
                  >
                    ← Back
                  </Button>
                  <Text size="lg" weight="bold">Create Alert</Text>
                </HStack>
                <AlertCreationForm hospitalId={hospitalId} />
              </VStack>
            )}
          </>
        );
        
      case 'doctor':
      case 'nurse':
      case 'head_doctor':
        return (
          <VStack spacing={4}>
            {/* On-Duty Status Card */}
            <Card>
              <HStack p={4} align="center" justify="space-between">
                <VStack>
                  <Text weight="semibold">Duty Status</Text>
                  <Text size="sm" colorTheme="mutedForeground">
                    {onDutyStatus?.isOnDuty ? 'Currently on duty' : 'Off duty'}
                  </Text>
                </VStack>
                <Button
                  onPress={() => toggleOnDutyMutation.mutate({
                    isOnDuty: !onDutyStatus?.isOnDuty
                  })}
                  variant={onDutyStatus?.isOnDuty ? 'destructive' : 'secondary'}
                  size="sm"
                >
                  {onDutyStatus?.isOnDuty ? 'End Shift' : 'Start Shift'}
                </Button>
              </HStack>
            </Card>
            
            <AlertDashboard role={role} hospitalId={hospitalId} />
          </VStack>
        );
        
      case 'admin':
        return (
          <VStack spacing={4}>
            {/* Admin Overview */}
            <HStack spacing={3}>
              <Card style={{ flex: 1 }}>
                <VStack align="center" p={4}>
                  <Text size="3xl" weight="bold">12</Text>
                  <Text size="sm" colorTheme="mutedForeground">Total Alerts Today</Text>
                </VStack>
              </Card>
              <Card style={{ flex: 1 }}>
                <VStack align="center" p={4}>
                  <Text size="3xl" weight="bold">2.5m</Text>
                  <Text size="sm" colorTheme="mutedForeground">Avg Response Time</Text>
                </VStack>
              </Card>
            </HStack>
            
            <Card>
              <VStack spacing={3} p={4}>
                <Text weight="bold">System Actions</Text>
                <Button
                  onPress={() => router.push('/(home)/admin')}
                  variant="outline"
                  fullWidth
                >
                  User Management
                </Button>
                <Button
                  onPress={() => {
                    log.info('View analytics clicked', 'HEALTHCARE_UI');
                  }}
                  variant="outline"
                  fullWidth
                >
                  View Analytics
                </Button>
              </VStack>
            </Card>
            
            <AlertDashboard role={role} hospitalId={hospitalId} />
          </VStack>
        );
        
      default:
        return (
          <Card>
            <VStack spacing={3} align="center" p={4}>
              <Text size="4xl">👋</Text>
              <Text size="lg" weight="bold">Welcome to Hospital Alert System</Text>
              <Text colorTheme="mutedForeground" align="center">
                Please complete your profile to access the system
              </Text>
              <Button
                onPress={() => router.push('/(home)/settings')}
                variant="default"
              >
                Complete Profile
              </Button>
            </VStack>
          </Card>
        );
    }
  };
  
  const content = (
    <VStack spacing={4}>
      {/* Header */}
      <HStack align="center" justify="space-between">
        <Box flex={1}>
          <Heading1>Hospital Alert System</Heading1>
          <Text colorTheme="mutedForeground">
            {user?.name || 'Healthcare Professional'}
          </Text>
        </Box>
        <Avatar
          source={user?.image ? { uri: user.image } : undefined}
          name={user?.name || 'User'}
          size="lg"
        />
      </HStack>
      
      {/* Role Badge */}
      <Card>
        <HStack p={4} align="center" justify="space-between">
          <Box>
            <Text weight="semibold">{user?.email}</Text>
            <Text size="sm" colorTheme="mutedForeground">
              {user?.organizationName || 'Hospital System'}
            </Text>
          </Box>
          <Badge
            variant={
              user?.role === 'admin' ? 'destructive' :
              user?.role === 'head_doctor' ? 'default' :
              user?.role === 'doctor' ? 'secondary' :
              user?.role === 'nurse' ? 'outline' :
              'outline'
            }
          >
            <Text size="xs" weight="semibold">
              {(user?.role || 'user').replace('_', ' ').toUpperCase()}
            </Text>
          </Badge>
        </HStack>
      </Card>
      
      <Separator />
      
      {/* Role-specific content */}
      {getRoleContent()}
    </VStack>
  );
  
  // Mobile view
  if (Platform.OS !== 'web') {
    const SafeAreaView = require('react-native-safe-area-context').SafeAreaView;
    
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
          <VStack p={4} spacing={4}>
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
          px={4}
          py={3}
          borderBottomWidth={1}
          borderTheme="border"
        >
          <HStack alignItems="center" spacing={2} mb={2}>
            <Sidebar07Trigger />
            <Separator orientation="vertical" style={{ height: 24 }} />
            <SimpleBreadcrumb
              items={[{ label: "Healthcare Dashboard", current: true }]}
              showHome={false}
            />
          </HStack>
        </Box>
        
        <ScrollView>
          <VStack p={4} spacing={4}>
            {content}
          </VStack>
        </ScrollView>
      </VStack>
    </Container>
  );
}