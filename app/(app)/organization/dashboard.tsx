import React, { Suspense } from 'react';
import { Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme/provider';
import { 
  Container, 
  VStack, 
  HStack,
  Box,
  Text,
  Skeleton,
  Grid,
  Button,
} from '@/components/universal';
import { 
  OrganizationOverviewBlock,
  MemberManagementBlock,
  OrganizationMetricsBlock,
  OrganizationQuickActionsBlock,
} from '@/components/blocks/organization';
import { useResponsive } from '@/hooks/responsive';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Symbol } from '@/components/universal/display/Symbols';

// Loading skeleton for suspense
const DashboardSkeleton = () => {
  return (
    <Grid columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap={6 as any}>
      <Skeleton height={233} />
      <Skeleton height={377} className="md:col-span-2" />
      <Skeleton height={144} />
      <Skeleton height={144} />
      <Skeleton height={89} />
    </Grid>
  );
};

export default function OrganizationDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { spacing } = useSpacing();
  
  // Check if user has organization access
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return (
      <Container>
        <VStack p={4} gap={4 as any} alignItems="center" justifyContent="center" style={{ flex: 1 }}>
          <Text size="base">Access Restricted</Text>
          <Text colorTheme="mutedForeground">
            This section is only available to administrators and managers
          </Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </VStack>
      </Container>
    );
  }
  
  // For demo, use a placeholder organization ID
  const organizationId = user.organizationId || 'org-123';
  
  // Mock organization data for demo
  const organization = {
    id: organizationId,
    name: 'Demo Organization',
    plan: 'pro' as const,
    memberCount: 12,
    industry: 'Technology',
  };
  
  // Mock metrics data
  const activityMetrics = [
    { label: 'Active Users', value: '89%', change: 12 },
    { label: 'Tasks Completed', value: '234', change: 8 },
  ];
  
  const growthMetrics = [
    { label: 'New Members', value: '+5', change: 25 },
    { label: 'Revenue', value: '$12.5K', change: 15 },
  ];
  
  const performanceMetrics = [
    { label: 'Uptime', value: '99.9%', change: 0 },
    { label: 'Response Time', value: '1.2s', change: -5 },
  ];
  
  const engagementMetrics = [
    { label: 'User Satisfaction', value: '4.8/5', change: 3 },
    { label: 'Feature Usage', value: '78%', change: 10 },
  ];
  
  // Quick actions
  const quickActions = [
    {
      id: 'invite',
      label: 'Invite',
      icon: <Symbol name="person.2" size={20} className="text-primary-foreground" />,
      onPress: () => router.push('/(app)/organization/settings'),
      color: 'primary',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Symbol name="gearshape" size={20} className="text-primary-foreground" />,
      onPress: () => router.push('/(app)/organization/settings'),
      color: 'primary',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <Symbol name="doc.text" size={20} className="text-primary-foreground" />,
      onPress: () => {},
      color: 'primary',
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: <Symbol name="creditcard" size={20} className="text-primary-foreground" />,
      onPress: () => {},
      color: 'primary',
    },
  ];
  
  const content = (
    <VStack gap={spacing[6] as any}>
      {/* Header */}
      <HStack alignItems="center" gap={2 as any}>
        <Button
          onPress={() => router.back()}
          variant="ghost"
          size="icon"
        >
          <Symbol name="chevron.left" size={24} />
        </Button>
        <Text size="xl" weight="bold">Organization Dashboard</Text>
      </HStack>
      
      <Suspense fallback={<DashboardSkeleton />}>
        {/* Desktop Layout - 4 column grid */}
        {isDesktop && (
          <Grid columns={4} gap={spacing[6] as any}>
            {/* Overview - spans 1 column */}
            <Box>
              <OrganizationOverviewBlock 
                organization={organization}
                onManageTeam={() => {}}
                onUpgradePlan={() => {}}
                onSettings={() => router.push('/(app)/organization/settings')}
              />
            </Box>
            
            {/* Member Management - spans 2 columns */}
            <Box className="col-span-2 row-span-2">
              <MemberManagementBlock 
                organizationId={organizationId}
                canManageMembers={user.role === 'admin' || user.role === 'manager'}
                onInviteMember={() => {}}
              />
            </Box>
            
            {/* Quick Actions */}
            <Box>
              <OrganizationQuickActionsBlock actions={quickActions} columns={2} />
            </Box>
            
            {/* Metrics Row */}
            <OrganizationMetricsBlock metrics={activityMetrics} title="Activity" />
            <OrganizationMetricsBlock metrics={growthMetrics} title="Growth" />
            <OrganizationMetricsBlock metrics={performanceMetrics} title="Performance" />
            <OrganizationMetricsBlock metrics={engagementMetrics} title="Engagement" />
          </Grid>
        )}
        
        {/* Tablet Layout - 2 column grid */}
        {isTablet && (
          <Grid columns={2} gap={spacing[6] as any}>
            <OrganizationOverviewBlock 
              organization={organization}
              onManageTeam={() => {}}
              onUpgradePlan={() => {}}
              onSettings={() => router.push('/(app)/organization/settings')}
            />
            <OrganizationQuickActionsBlock actions={quickActions} columns={2} />
            <Box className="col-span-2">
              <MemberManagementBlock 
                organizationId={organizationId}
                canManageMembers={user.role === 'admin' || user.role === 'manager'}
                onInviteMember={() => {}}
              />
            </Box>
            <OrganizationMetricsBlock metrics={activityMetrics} title="Activity" />
            <OrganizationMetricsBlock metrics={growthMetrics} title="Growth" />
          </Grid>
        )}
        
        {/* Mobile Layout - single column */}
        {isMobile && (
          <VStack gap={spacing[6] as any}>
            <OrganizationOverviewBlock 
              organization={organization}
              onManageTeam={() => {}}
              onUpgradePlan={() => {}}
              onSettings={() => router.push('/(app)/organization/settings')}
            />
            <OrganizationQuickActionsBlock actions={quickActions} columns={2} />
            <HStack gap={spacing[4] as any} style={{ overflowX: 'scroll' }}>
              <OrganizationMetricsBlock metrics={activityMetrics} title="Activity" />
              <OrganizationMetricsBlock metrics={growthMetrics} title="Growth" />
            </HStack>
            <MemberManagementBlock 
              organizationId={organizationId}
              canManageMembers={user.role === 'admin' || user.role === 'manager'}
              onInviteMember={() => {}}
            />
          </VStack>
        )}
      </Suspense>
    </VStack>
  );
  
  // Mobile view
  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 , paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <VStack p={spacing[5] as any} gap={spacing[5] as any}>
            {content}
          </VStack>
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  // Web view
  return (
    <Container>
      <ScrollView>
        <VStack p={spacing[6] as any} gap={spacing[6] as any}>
          {content}
        </VStack>
      </ScrollView>
    </Container>
  );
}