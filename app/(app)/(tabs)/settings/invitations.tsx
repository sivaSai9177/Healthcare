import React, { useState } from 'react';
import { ScrollView, RefreshControl, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Badge,
  Avatar,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAuth } from '@/hooks/useAuth';
import { useActiveOrganization } from '@/lib/stores/organization-store';
import { api } from '@/lib/api/trpc';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';
import { haptic } from '@/lib/ui/haptics';
import { log } from '@/lib/core/debug/logger';
import { format } from 'date-fns';

export default function InvitationsScreen() {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { user } = useAuth();
  const { organization } = useActiveOrganization();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  
  const organizationId = organization?.id || user?.organizationId;
  
  // Fetch invitations
  // TODO: Implement getPendingInvitations endpoint
  const invitations = { invitations: [] };
  const refetchInvitations = () => {};
  
  // Fetch join requests
  const { data: joinRequests, refetch: refetchJoinRequests } = api.organization.listJoinRequests.useQuery(
    { organizationId: organizationId || '' },
    { enabled: !!organizationId }
  );
  
  // Cancel invitation mutation
  // TODO: Implement cancelInvitation endpoint
  const cancelInvitationMutation = { 
    mutateAsync: async () => { 
      showErrorAlert('This feature is not yet implemented');
    }, 
    isPending: false 
  };
  
  // Review join request mutation
  // TODO: Implement reviewJoinRequest endpoint
  const reviewJoinRequestMutation = { 
    mutateAsync: async () => { 
      showErrorAlert('This feature is not yet implemented');
    }, 
    isPending: false 
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchInvitations(), refetchJoinRequests()]);
    } catch (error) {
      log.error('Failed to refresh invitations', 'INVITATIONS', error);
      showErrorAlert('Failed to refresh', 'Please try again');
    }
    setRefreshing(false);
  };
  
  const handleCancelInvitation = (invitationId: string) => {
    haptic('medium');
    cancelInvitationMutation.mutateAsync({ invitationId });
  };
  
  const handleReviewJoinRequest = (requestId: string, approved: boolean) => {
    haptic('medium');
    reviewJoinRequestMutation.mutateAsync({ 
      requestId, 
      approved,
      message: approved ? 'Welcome to the team!' : 'Your request has been reviewed.',
    });
  };
  
  const renderInvitation = (invitation: any) => (
    <Card key={invitation.id}>
      <HStack gap={3 as any} alignItems="center">
        <Avatar
          name={invitation.email}
          size="default"
        />
        <VStack gap={1 as any} style={{ flex: 1 }}>
          <Text weight="medium">{invitation.email}</Text>
          <HStack gap={2 as any} alignItems="center">
            <Badge variant="outline" size="sm">
              {invitation.role}
            </Badge>
            <Text size="xs" colorTheme="mutedForeground">
              • Invited {format(new Date(invitation.createdAt), 'MMM d')}
            </Text>
          </HStack>
          {invitation.metadata?.healthcareRole && (
            <Text size="xs" colorTheme="mutedForeground">
              Healthcare role: {invitation.metadata.healthcareRole}
            </Text>
          )}
        </VStack>
        <Button
          size="sm"
          variant="destructive"
          onPress={() => handleCancelInvitation(invitation.id)}
          isLoading={cancelInvitationMutation.isPending}
        >
          Cancel
        </Button>
      </HStack>
    </Card>
  );
  
  const renderJoinRequest = (request: any) => (
    <Card key={request.id}>
      <VStack gap={3 as any}>
        <HStack gap={3 as any} alignItems="flex-start">
          <Avatar
            name={request.userName || request.userEmail}
            size="default"
          />
          <VStack gap={1 as any} style={{ flex: 1 }}>
            <Text weight="medium">{request.userName || 'Unknown'}</Text>
            <Text size="sm" colorTheme="mutedForeground">{request.userEmail}</Text>
            <Text size="xs" colorTheme="mutedForeground">
              Requested {format(new Date(request.createdAt), 'MMM d, h:mm a')}
            </Text>
          </VStack>
        </HStack>
        {request.message && (
          <Card variant="outline">
            <Text size="sm">{request.message}</Text>
          </Card>
        )}
        <HStack gap={2 as any}>
          <Button
            size="sm"
            variant="destructive"
            onPress={() => handleReviewJoinRequest(request.id, false)}
            isLoading={reviewJoinRequestMutation.isPending}
            style={{ flex: 1 }}
          >
            Reject
          </Button>
          <Button
            size="sm"
            onPress={() => handleReviewJoinRequest(request.id, true)}
            isLoading={reviewJoinRequestMutation.isPending}
            style={{ flex: 1 }}
          >
            Approve
          </Button>
        </HStack>
      </VStack>
    </Card>
  );
  
  const content = (
    <VStack gap={4 as any}>
      {/* Header */}
      <VStack gap={2 as any}>
        <Text size="2xl" weight="bold">Invitations & Requests</Text>
        <Text size="sm" colorTheme="mutedForeground">
          Manage pending invitations and join requests
        </Text>
      </VStack>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending Invitations ({invitations?.invitations.length || 0})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Join Requests ({joinRequests?.requests.length || 0})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <VStack gap={3 as any}>
            {invitations?.invitations.length === 0 ? (
              <Card>
                <VStack gap={2 as any} alignItems="center" py={6}>
                  <Text size="base" weight="medium">No pending invitations</Text>
                  <Text size="sm" colorTheme="mutedForeground">
                    All invitations have been accepted or expired
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => router.push('/invite-member')}
                    style={{ marginTop: spacing[2] as any }}
                  >
                    Send New Invitation
                  </Button>
                </VStack>
              </Card>
            ) : (
              invitations?.invitations.map(renderInvitation)
            )}
          </VStack>
        </TabsContent>
        
        <TabsContent value="requests">
          <VStack gap={3 as any}>
            {joinRequests?.requests.length === 0 ? (
              <Card>
                <VStack gap={2 as any} alignItems="center" py={6}>
                  <Text size="base" weight="medium">No join requests</Text>
                  <Text size="sm" colorTheme="mutedForeground">
                    No pending requests to join your organization
                  </Text>
                </VStack>
              </Card>
            ) : (
              joinRequests?.requests.map(renderJoinRequest)
            )}
          </VStack>
        </TabsContent>
      </Tabs>
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