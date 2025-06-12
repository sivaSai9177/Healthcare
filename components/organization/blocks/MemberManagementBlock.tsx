import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Card } from '@/components/universal/Card';
import { Text } from '@/components/universal/Text';
import { Input } from '@/components/universal/Input';
import { Button } from '@/components/universal/Button';
import { Badge } from '@/components/universal/Badge';
import { Avatar } from '@/components/universal/Avatar';
import { DropdownMenu } from '@/components/universal/DropdownMenu';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Search, UserPlus, MoreVertical, Mail, Shield, Trash2 } from '@/components/universal/Symbols';
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

interface MemberManagementBlockProps {
  organizationId: string;
  canManageMembers?: boolean;
  onInviteMember?: () => void;
}

export function MemberManagementBlock({
  organizationId,
  canManageMembers = false,
  onInviteMember,
}: MemberManagementBlockProps) {
  const { colors } = useTheme();
  const spacing = useSpacing();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Golden ratio dimensions: 610x377px
  const goldenWidth = 610;
  const goldenHeight = 377;
  
  // Fetch members
  const { data: members = [], isLoading } = api.organization.getMembers.useQuery({
    organizationId,
  });
  
  const updateMemberRole = api.organization.updateMemberRole.useMutation();
  const removeMember = api.organization.removeMember.useMutation();
  
  const roleColors = {
    owner: { bg: colors.destructive, text: colors.destructiveForeground },
    admin: { bg: colors.primary, text: colors.primaryForeground },
    manager: { bg: colors.accent, text: colors.accentForeground },
    member: { bg: colors.secondary, text: colors.secondaryForeground },
    guest: { bg: colors.muted, text: colors.mutedForeground },
  };
  
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Card
      animated
      animationType="lift"
      style={{
        width: '100%',
        maxWidth: goldenWidth,
        height: goldenHeight,
      }}
    >
      <Card.Header>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Card.Title>Team Members ({members.length})</Card.Title>
          {canManageMembers && (
            <Button
              size="sm"
              leftIcon={<UserPlus size={16} />}
              onPress={onInviteMember}
            >
              Invite
            </Button>
          )}
        </View>
      </Card.Header>
      
      <Card.Content style={{ flex: 1, paddingBottom: 0 }}>
        <View style={{ marginBottom: spacing.md }}>
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={16} />}
          />
        </View>
        
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <Text variant="muted" style={{ textAlign: 'center', padding: spacing.xl }}>
              Loading members...
            </Text>
          ) : filteredMembers.length === 0 ? (
            <Text variant="muted" style={{ textAlign: 'center', padding: spacing.xl }}>
              No members found
            </Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {filteredMembers.map((member) => (
                <View
                  key={member.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: spacing.md,
                    borderRadius: spacing.sm,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Avatar
                    src={member.avatar}
                    alt={member.name}
                    fallback={member.name.substring(0, 2).toUpperCase()}
                    size="md"
                  />
                  
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <Text weight="medium">{member.name}</Text>
                      <Badge
                        size="xs"
                        style={{
                          backgroundColor: roleColors[member.role].bg,
                        }}
                      >
                        <Text size="xs" style={{ color: roleColors[member.role].text }}>
                          {member.role}
                        </Text>
                      </Badge>
                    </View>
                    <Text variant="muted" size="sm">{member.email}</Text>
                  </View>
                  
                  {canManageMembers && member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenu.Trigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content>
                        <DropdownMenu.Item
                          onPress={() => {
                            // Send email
                          }}
                        >
                          <Mail size={16} />
                          <Text>Send Email</Text>
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Separator />
                        
                        <DropdownMenu.Sub>
                          <DropdownMenu.SubTrigger>
                            <Shield size={16} />
                            <Text>Change Role</Text>
                          </DropdownMenu.SubTrigger>
                          <DropdownMenu.SubContent>
                            {(['admin', 'manager', 'member', 'guest'] as const).map((role) => (
                              <DropdownMenu.Item
                                key={role}
                                onPress={() => {
                                  updateMemberRole.mutate({
                                    organizationId,
                                    userId: member.id,
                                    role,
                                  });
                                }}
                              >
                                <Text>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
                              </DropdownMenu.Item>
                            ))}
                          </DropdownMenu.SubContent>
                        </DropdownMenu.Sub>
                        
                        <DropdownMenu.Separator />
                        
                        <DropdownMenu.Item
                          onPress={() => {
                            removeMember.mutate({
                              organizationId,
                              userId: member.id,
                            });
                          }}
                          destructive
                        >
                          <Trash2 size={16} />
                          <Text>Remove Member</Text>
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </Card.Content>
    </Card>
  );
}