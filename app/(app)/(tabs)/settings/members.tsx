import React, { useState } from 'react';
import { ScrollView, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Box,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAuth } from '@/hooks/useAuth';
import { useActiveOrganization } from '@/lib/stores/organization-store';
import { MemberManagementHealthcare } from '@/components/blocks/organization';
import { api } from '@/lib/api/trpc';
import { showErrorAlert } from '@/lib/core/alert';
import { haptic } from '@/lib/ui/haptics';
import { log } from '@/lib/core/debug/logger';

export default function MembersScreen() {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { user } = useAuth();
  const { organization } = useActiveOrganization();
  const [refreshing, setRefreshing] = useState(false);
  
  const organizationId = organization?.id || user?.organizationId;
  
  // Check if user can manage members
  const { data: memberData } = api.organization.getMembersWithHealthcare.useQuery(
    { 
      organizationId: organizationId || '', 
      limit: 1 
    },
    { enabled: !!organizationId }
  );
  
  const currentUserMembership = memberData?.members.find(m => m.id === user?.id);
  const canManageMembers = ['owner', 'admin', 'manager'].includes(currentUserMembership?.role || '');
  
  const handleInviteMember = () => {
    haptic('medium');
    router.push({
      pathname: '/(modals)/invite-member',
      params: { organizationId }
    });
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh will be handled by the MemberManagementHealthcare component
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      log.error('Failed to refresh members', 'MEMBERS', error);
      showErrorAlert('Failed to refresh', 'Please try again');
    }
    setRefreshing(false);
  };
  
  if (!organizationId) {
    return (
      <Container className="flex-1 items-center justify-center">
        <VStack gap={4 as any} alignItems="center">
          <Text size="base" weight="semibold">No Organization Selected</Text>
          <Text colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
            Please select or create an organization first
          </Text>
          <Button 
            onPress={() => router.push('/(app)/(tabs)/settings')}
            variant="outline"
          >
            Go to Settings
          </Button>
        </VStack>
      </Container>
    );
  }
  
  const content = (
    <VStack gap={4 as any}>
      {/* Header */}
      <VStack gap={2 as any}>
        <Text size="2xl" weight="bold">Team Members</Text>
        <Text size="sm" colorTheme="mutedForeground">
          Manage your organization&apos;s team members and roles
        </Text>
      </VStack>
      
      {/* Organization Info */}
      {organization && (
        <Card>
          <HStack justifyContent="space-between" alignItems="center">
            <VStack gap={1 as any}>
              <Text weight="semibold">{organization.name}</Text>
              <Text size="sm" colorTheme="mutedForeground">
                Organization ID: {organization.id}
              </Text>
            </VStack>
            <Box>
              <Text size="sm" colorTheme="mutedForeground">
                Your Role: {currentUserMembership?.role || 'Member'}
              </Text>
            </Box>
          </HStack>
        </Card>
      )}
      
      {/* Members Management */}
      <MemberManagementHealthcare
        organizationId={organizationId}
        canManageMembers={canManageMembers}
        onInviteMember={handleInviteMember}
        showHealthcareInfo={true}
      />
      
      {/* Pending Invitations */}
      {canManageMembers && (
        <Card>
          <VStack gap={3 as any}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text weight="semibold">Pending Invitations</Text>
              <Button
                size="sm"
                variant="outline"
                onPress={() => router.push('/(app)/(tabs)/settings/invitations')}
              >
                View All
              </Button>
            </HStack>
            <Text size="sm" colorTheme="mutedForeground">
              Manage pending invitations and join requests
            </Text>
          </VStack>
        </Card>
      )}
    </VStack>
  );
  
  const scrollContent = (
    <ScrollView
      contentContainerStyle={{ 
        padding: spacing[4] as any, 
        paddingBottom: spacing[8] as any 
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
        />
      }
    >
      {content}
    </ScrollView>
  );
  
  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        {scrollContent}
      </SafeAreaView>
    );
  }
  
  return (
    <Container>
      {scrollContent}
    </Container>
  );
}