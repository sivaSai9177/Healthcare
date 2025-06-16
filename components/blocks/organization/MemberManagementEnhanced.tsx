import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar } from '@/components/universal/display';
import { Text } from '@/components/universal/typography';
import { Input } from '@/components/universal/form';
import { Button } from '@/components/universal/interaction';
import { DropdownMenu } from '@/components/universal/overlay';
import { Stack } from '@/components/universal/layout';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';
import { SearchSymbol, UserPlus, MoreVertical, Users, FileText } from '@/components/universal/display/Symbols';
import { api } from '@/lib/api/trpc';
import { JoinRequestsManager } from './JoinRequestsManager';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'guest';
  avatar?: string;
  joinedAt: Date;
  lastActive?: Date;
}

export interface MemberManagementEnhancedProps {
  organizationId: string;
  canManageMembers?: boolean;
  onInviteMember?: () => void;
  fullPage?: boolean;
}

export function MemberManagementEnhanced({
  organizationId,
  canManageMembers = false,
  onInviteMember,
  fullPage = false,
}: MemberManagementEnhancedProps) {
  const { spacing } = useSpacing();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');
  
  // Fetch members with proper typing
  const { data: response = { members: [], total: 0 }, isLoading } = api.organization.getMembers.useQuery({
    organizationId,
  });
  
  // Fetch join requests count
  const { data: requestsData } = api.organization.listJoinRequests.useQuery({
    organizationId,
    status: 'pending',
    limit: 1,
  });
  
  // Extract members array from response
  const members = Array.isArray(response) ? response : response.members || [];
  const pendingRequestsCount = requestsData?.total || 0;
  
  const roleVariants = {
    owner: 'error',
    admin: 'default',
    manager: 'secondary',
    member: 'outline',
    guest: 'outline',
  } as const;
  
  const filteredMembers = members.filter((member: Member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const styles = {
    tabContainer: {
      flexDirection: 'row' as const,
      gap: theme.spacing.s,
      marginBottom: theme.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tab: {
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.l,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    tabTextActive: {
      color: theme.colors.primary,
      fontWeight: '600' as const,
    },
    badge: {
      marginLeft: theme.spacing.s,
    },
  };
  
  if (fullPage) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.tabContainer}>
          <Button
            variant="ghost"
            onPress={() => setActiveTab('members')}
            style={[styles.tab, activeTab === 'members' && styles.tabActive]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Users size={20} color={activeTab === 'members' ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
                Members ({members.length})
              </Text>
            </View>
          </Button>
          
          <Button
            variant="ghost"
            onPress={() => setActiveTab('requests')}
            style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FileText size={20} color={activeTab === 'requests' ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
                Join Requests
              </Text>
              {pendingRequestsCount > 0 && (
                <Badge variant="danger" style={styles.badge}>
                  {pendingRequestsCount}
                </Badge>
              )}
            </View>
          </Button>
        </View>

        {activeTab === 'members' ? (
          <MembersTab
            organizationId={organizationId}
            members={filteredMembers}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            canManageMembers={canManageMembers}
            onInviteMember={onInviteMember}
            roleVariants={roleVariants}
          />
        ) : (
          <JoinRequestsManager organizationId={organizationId} />
        )}
      </View>
    );
  }
  
  // Original card-based layout for dashboard
  const goldenWidth = 610;
  const goldenHeight = 377;
  
  return (
    <Card
      shadow="md"
      className={cn(
        "animate-fade-in",
        "transition-all duration-200",
        "w-full"
      )}
      style={{
        maxWidth: goldenWidth,
        height: goldenHeight,
      }}
    >
      <CardHeader>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <CardTitle>Team Members ({members.length})</CardTitle>
          <View style={{ flexDirection: 'row', gap: spacing.s }}>
            {pendingRequestsCount > 0 && (
              <Badge variant="danger">
                {pendingRequestsCount} pending
              </Badge>
            )}
            {canManageMembers && (
              <Button
                variant="primary"
                size="small"
                onPress={onInviteMember}
                className="flex-row items-center gap-2"
              >
                <UserPlus size={16} className="text-primary-foreground" />
                <Text className="text-primary-foreground">Invite</Text>
              </Button>
            )}
          </View>
        </View>
      </CardHeader>
      
      <CardContent className="flex-1">
        <Stack spacing={spacing.m}>
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<SearchSymbol size={20} className="text-muted-foreground" />}
          />
          
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: spacing.s }}
          >
            {isLoading ? (
              <Text className="text-muted-foreground text-center py-4">Loading members...</Text>
            ) : filteredMembers.length === 0 ? (
              <Text className="text-muted-foreground text-center py-4">No members found</Text>
            ) : (
              filteredMembers.slice(0, 5).map((member: Member) => (
                <MemberRow 
                  key={member.id} 
                  member={member} 
                  canManage={canManageMembers}
                  roleVariant={roleVariants[member.role] as any}
                />
              ))
            )}
          </ScrollView>
        </Stack>
      </CardContent>
    </Card>
  );
}

// Separate component for members tab
function MembersTab({
  organizationId,
  members,
  searchQuery,
  setSearchQuery,
  canManageMembers,
  onInviteMember,
  roleVariants,
}: any) {
  const { spacing } = useSpacing();
  
  return (
    <View style={{ flex: 1, padding: spacing.m }}>
      <Stack spacing={spacing.m}>
        <View style={{ flexDirection: 'row', gap: spacing.s }}>
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<SearchSymbol size={20} className="text-muted-foreground" />}
            style={{ flex: 1 }}
          />
          {canManageMembers && (
            <Button
              variant="primary"
              onPress={onInviteMember}
              className="flex-row items-center gap-2"
            >
              <UserPlus size={16} className="text-primary-foreground" />
              <Text className="text-primary-foreground">Invite</Text>
            </Button>
          )}
        </View>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: spacing.s }}
        >
          {members.length === 0 ? (
            <Text className="text-muted-foreground text-center py-4">No members found</Text>
          ) : (
            members.map((member: Member) => (
              <MemberRow 
                key={member.id} 
                member={member} 
                canManage={canManageMembers}
                roleVariant={roleVariants[member.role] as any}
              />
            ))
          )}
        </ScrollView>
      </Stack>
    </View>
  );
}

// Member row component
function MemberRow({ member, canManage, roleVariant }: { member: Member; canManage: boolean; roleVariant: any }) {
  const { spacing } = useSpacing();
  
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 8,
      }}
    >
      <Avatar
        src={member.avatar}
        name={member.name}
        size="small"
      />
      
      <View style={{ flex: 1, marginLeft: spacing.m }}>
        <Text className="font-medium">{member.name}</Text>
        <Text className="text-sm text-muted-foreground">{member.email}</Text>
      </View>
      
      <Badge variant={roleVariant} size="small">
        {member.role}
      </Badge>
      
      {canManage && member.role !== 'owner' && (
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="small" className="ml-2">
              <MoreVertical size={16} className="text-muted-foreground" />
            </Button>
          }
        >
          {/* TODO: Implement dropdown items when DropdownMenu is ready */}
        </DropdownMenu>
      )}
    </View>
  );
}