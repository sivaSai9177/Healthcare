import React, { Suspense } from 'react';
import { Platform, ScrollView } from 'react-native';
import { 
  Container, 
  VStack, 
  HStack,
  Box,
  Skeleton,
  SimpleBreadcrumb,
  SidebarTrigger,
  Separator,
  Grid,
} from '@/components/universal';
import { 
  OrganizationOverviewBlock,
  MemberManagementBlock,
  OrganizationMetricsBlock,
  OrganizationQuickActionsBlock,
} from '@/components/blocks/organization';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter , Redirect } from 'expo-router';
import { useTheme } from '@/lib/theme/provider';
import { useResponsive } from '@/hooks/responsive';
import { useSpacing } from '@/lib/stores/spacing-store';
import { log } from '@/lib/core/debug/logger';
import { Users, Settings, FileText, CreditCard } from '@/components/universal/Symbols';

// Loading skeleton for suspense
const DashboardSkeleton = () => {
  const { spacing } = useSpacing();
  return (
    <Grid columns={{ xs: 1, md: 2, lg: 3, xl: 4 }} gap={6}>
      <Skeleton className="h-[233px]" />
      <Skeleton className="h-[377px] md:col-span-2" />
      <Skeleton className="h-[144px]" />
      <Skeleton className="h-[144px]" />
      <Skeleton className="h-[89px]" />
    </Grid>
  );
};

export default function OrganizationDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { colors } = useTheme();
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { spacing } = useSpacing();
  
  // Check if user has organization access
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    log.warn('Non-admin/manager tried to access organization dashboard', 'ORG_DASHBOARD', { 
      userId: user?.id, 
      role: user?.role 
    });
    return <Redirect href="/(home)/" />;
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
      icon: <Users size={20} color={colors.primaryForeground} />,
      onPress: () => router.push('/(home)/organization-settings'),
      color: colors.primary,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={20} color={colors.primaryForeground} />,
      onPress: () => router.push('/(home)/organization-settings'),
      color: colors.primary,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText size={20} color={colors.primaryForeground} />,
      onPress: () => {},
      color: colors.primary,
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: <CreditCard size={20} color={colors.primaryForeground} />,
      onPress: () => {},
      color: colors.primary,
    },
  ];
  
  const content = (
    <VStack gap={spacing.xl}>
      <Suspense fallback={<DashboardSkeleton />}>
        {/* Desktop Layout - 4 column grid */}
        {isDesktop && (
          <Grid columns={4} gap={spacing.xl}>
            {/* Overview - spans 1 column */}
            <Box style={{ gridColumn: 'span 1' }}>
              <OrganizationOverviewBlock 
                organization={organization}
                onManageTeam={() => {}}
                onUpgradePlan={() => {}}
                onSettings={() => router.push('/(home)/organization-settings')}
              />
            </Box>
            
            {/* Member Management - spans 2 columns */}
            <Box style={{ gridColumn: 'span 2', gridRow: 'span 2' }}>
              <MemberManagementBlock 
                organizationId={organizationId}
                canManageMembers={user.role === 'admin' || user.role === 'manager'}
                onInviteMember={() => {}}
              />
            </Box>
            
            {/* Quick Actions */}
            <Box>
              <QuickActionsBlock actions={quickActions} columns={2} />
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
          <Grid columns={2} gap={spacing.xl}>
            <OrganizationOverviewBlock 
              organization={organization}
              onManageTeam={() => {}}
              onUpgradePlan={() => {}}
              onSettings={() => router.push('/(home)/organization-settings')}
            />
            <QuickActionsBlock actions={quickActions} columns={2} />
            <Box style={{ gridColumn: 'span 2' }}>
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
          <VStack gap={spacing.xl}>
            <OrganizationOverviewBlock 
              organization={organization}
              onManageTeam={() => {}}
              onUpgradePlan={() => {}}
              onSettings={() => router.push('/(home)/organization-settings')}
            />
            <QuickActionsBlock actions={quickActions} columns={2} />
            <HStack gap={spacing.md} style={{ overflowX: 'scroll' }}>
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
    const SafeAreaView = require('react-native-safe-area-context').SafeAreaView;
    
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <VStack p={spacing.lg} gap={spacing.lg}>
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
          px={spacing.lg}
          py={spacing.md}
          borderBottomWidth={1}
          borderTheme="border"
        >
          <HStack alignItems="center" spacing={spacing.sm} mb={spacing.sm}>
            <SidebarTrigger />
            <Separator orientation="vertical" style={{ height: 24 }} />
            <SimpleBreadcrumb
              items={[
                { label: "Home", href: "/(home)/" },
                { label: "Organization Dashboard", current: true }
              ]}
              showHome={false}
            />
          </HStack>
        </Box>
        
        <ScrollView>
          <VStack p={spacing.xl} gap={spacing.xl}>
            {content}
          </VStack>
        </ScrollView>
      </VStack>
    </Container>
  );
}