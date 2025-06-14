import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Text, 
  Input, 
  Button, 
  Badge, 
  Avatar, 
  DropdownMenu, 
  Stack
} from '@/components/universal';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { SearchSymbol, UserPlus, MoreVertical } from '@/components/universal/display/Symbols';
import { api } from '@/lib/api/trpc';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'guest';
  avatar?: string;
  joinedAt: Date;
  lastActive?: Date;
}

export interface MemberManagementBlockProps {
  organizationId: string;
  canManageMembers?: boolean;
  onInviteMember?: () => void;
  fullPage?: boolean;
}

export function MemberManagementBlock({
  organizationId,
  canManageMembers = false,
  onInviteMember,
}: MemberManagementBlockProps) {
  const { spacing } = useSpacing();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Golden ratio dimensions: 610x377px
  const goldenWidth = 610;
  const goldenHeight = 377;
  
  // Fetch members with proper typing
  const { data: response = { members: [], total: 0 }, isLoading } = api.organization.getMembers.useQuery({
    organizationId,
  });
  
  // Extract members array from response
  const members = Array.isArray(response) ? response : response.members || [];
  
  // const updateMemberRole = api.organization.updateMemberRole.useMutation();
  // const removeMember = api.organization.removeMember.useMutation();
  
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
  
  // TODO: Implement role change and member removal when dropdown menu is fully implemented
  // const handleRoleChange = async (memberId: string, newRole: string) => {
  //   await updateMemberRole.mutateAsync({
  //     organizationId,
  //     memberId,
  //     role: newRole as Member['role'],
  //   });
  // };
  
  // const handleRemoveMember = async (memberId: string) => {
  //   await removeMember.mutateAsync({
  //     organizationId,
  //     memberId,
  //   });
  // };
  
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
          {canManageMembers && (
            <Button
              variant="default"
              size="sm"
              onPress={onInviteMember}
              leftIcon={<UserPlus size={16} />}
            >
              Invite Member
            </Button>
          )}
        </View>
      </CardHeader>
      
      <CardContent>
        <View style={{ flex: 1 }}>
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={16} />}
            style={{ marginBottom: spacing[4] }}
          />
          
          {isLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text colorTheme="mutedForeground">Loading members...</Text>
            </View>
          ) : filteredMembers.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text colorTheme="mutedForeground">
                {searchQuery ? 'No members found' : 'No members yet'}
              </Text>
            </View>
          ) : (
            <ScrollView 
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              <Stack gap={spacing[2] as any}>
                {filteredMembers.map((member: Member) => (
                  <View
                    key={member.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: spacing[3],
                      borderRadius: 8,
                      backgroundColor: 'rgba(0,0,0,0.02)',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                      <Avatar
                        source={member.avatar ? { uri: member.avatar } : undefined}
                        name={member.name}
                        size="sm"
                      />
                      <View>
                        <Text weight="medium">{member.name}</Text>
                        <Text size="sm" colorTheme="mutedForeground">{member.email}</Text>
                      </View>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                      <Badge variant={roleVariants[member.role]} size="sm">
                        {member.role}
                      </Badge>
                      
                      {canManageMembers && member.role !== 'owner' && (
                        <DropdownMenu>
                          <Button
                            variant="ghost"
                            size="sm"
                            style={{ padding: spacing[1] }}
                          >
                            <MoreVertical size={16} />
                          </Button>
                          {/* Dropdown content would go here - simplified for now */}
                        </DropdownMenu>
                      )}
                    </View>
                  </View>
                ))}
              </Stack>
            </ScrollView>
          )}
        </View>
      </CardContent>
    </Card>
  );
}