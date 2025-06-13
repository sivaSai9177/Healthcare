import React, { useState } from 'react';
import { ScrollView, View, Platform, RefreshControl } from 'react-native';
import { useSpacing } from '@/hooks/core/useSpacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useBreakpoint } from '@/hooks/responsive/useBreakpoint';
import {
  Card,
  Text,
  Button,
  Badge,
  Avatar,
  Input,
  Select,
  Dialog,
  Stack,
  Grid,
  Separator,
} from '@/components/universal';
import { Ionicons } from '@expo/vector-icons';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  avatar?: string;
  joinedAt: string;
}

const mockMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@hospital.com',
    role: 'owner',
    status: 'active',
    joinedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@hospital.com',
    role: 'admin',
    status: 'active',
    joinedAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@hospital.com',
    role: 'member',
    status: 'active',
    joinedAt: '2024-03-10',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.d@hospital.com',
    role: 'member',
    status: 'pending',
    joinedAt: '2024-04-05',
  },
  {
    id: '5',
    name: 'Robert Wilson',
    email: 'robert.w@hospital.com',
    role: 'viewer',
    status: 'inactive',
    joinedAt: '2024-01-20',
  },
];

const roleColors = {
  owner: 'destructive',
  admin: 'primary',
  member: 'secondary',
  viewer: 'outline',
} as const;

const statusColors = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary',
} as const;

export default function MembersScreen() {
  const spacing = useSpacing();
  const breakpoint = useBreakpoint();
  const [members, setMembers] = useState(mockMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');

  const isDesktop = breakpoint === 'lg' || breakpoint === 'xl';
  const backgroundColor = useThemeColor({}, 'background');
  const mutedColor = useThemeColor({}, 'muted');

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleInviteMember = () => {
    if (inviteEmail) {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole as TeamMember['role'],
        status: 'pending',
        joinedAt: new Date().toISOString().split('T')[0],
      };
      setMembers([...members, newMember]);
      setInviteEmail('');
      setInviteRole('member');
      setIsInviteDialogOpen(false);
    }
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleUpdateRole = (id: string, newRole: TeamMember['role']) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, role: newRole } : m))
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing.xl * 2,
        }}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {/* Header */}
        <Stack space="lg" style={{ marginBottom: spacing.xl }}>
          <Stack space="sm">
            <Text variant="heading" size="2xl">
              Team Members
            </Text>
            <Text variant="muted">
              Manage your organization&apos;s team members and permissions
            </Text>
          </Stack>

          {/* Actions Bar */}
          <Grid
            columns={isDesktop ? 3 : 1}
            gap={spacing.md}
            style={{ alignItems: 'flex-end' }}
          >
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={<Ionicons name="search" size={20} color={mutedColor} />}
            />
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
              placeholder="Filter by role"
              options={[
                { label: 'All Roles', value: 'all' },
                { label: 'Owner', value: 'owner' },
                { label: 'Admin', value: 'admin' },
                { label: 'Member', value: 'member' },
                { label: 'Viewer', value: 'viewer' },
              ]}
            />
            <Button
              variant="default"
              onPress={() => setIsInviteDialogOpen(true)}
              leftIcon={<Ionicons name="add" size={20} color="white" />}
            >
              Invite Member
            </Button>
          </Grid>
        </Stack>

        {/* Members List */}
        <Stack space="md">
          {filteredMembers.map((member) => (
            <Card key={member.id} style={{ padding: spacing.lg }}>
              <Stack
                direction={isDesktop ? 'horizontal' : 'vertical'}
                space="md"
                style={{ alignItems: isDesktop ? 'center' : 'flex-start' }}
              >
                <Stack
                  direction="horizontal"
                  space="md"
                  style={{ flex: 1, alignItems: 'center' }}
                >
                  <Avatar
                    source={member.avatar}
                    fallback={member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                    size="md"
                  />
                  <Stack space="xs" style={{ flex: 1 }}>
                    <Text variant="heading" size="md">
                      {member.name}
                    </Text>
                    <Text variant="muted" size="sm">
                      {member.email}
                    </Text>
                    <Text variant="muted" size="xs">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </Text>
                  </Stack>
                </Stack>

                <Stack
                  direction="horizontal"
                  space="sm"
                  style={{ alignItems: 'center' }}
                >
                  <Badge variant={roleColors[member.role]}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Badge>
                  <Badge variant={statusColors[member.status]}>
                    {member.status.charAt(0).toUpperCase() +
                      member.status.slice(1)}
                  </Badge>

                  {member.role !== 'owner' && (
                    <>
                      <Separator orientation="vertical" />
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleUpdateRole(member.id, value as TeamMember['role'])
                        }
                        placeholder="Change role"
                        options={[
                          { label: 'Admin', value: 'admin' },
                          { label: 'Member', value: 'member' },
                          { label: 'Viewer', value: 'viewer' },
                        ]}
                        style={{ minWidth: 120 }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onPress={() => handleRemoveMember(member.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="red" />
                      </Button>
                    </>
                  )}
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>

        {/* Empty State */}
        {filteredMembers.length === 0 && (
          <Card
            style={{
              padding: spacing.xl * 2,
              alignItems: 'center',
              marginTop: spacing.xl,
            }}
          >
            <Stack space="md" style={{ alignItems: 'center' }}>
              <Ionicons name="people-outline" size={48} color={mutedColor} />
              <Text variant="muted">No members found</Text>
              {searchQuery || selectedRole !== 'all' ? (
                <Button
                  variant="outline"
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedRole('all');
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  variant="default"
                  onPress={() => setIsInviteDialogOpen(true)}
                >
                  Invite First Member
                </Button>
              )}
            </Stack>
          </Card>
        )}
      </ScrollView>

      {/* Invite Dialog */}
      <Dialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        title="Invite Team Member"
        description="Send an invitation to join your organization"
      >
        <Stack space="md" style={{ padding: spacing.lg }}>
          <Input
            placeholder="Email address"
            value={inviteEmail}
            onChangeText={setInviteEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Select
            value={inviteRole}
            onValueChange={setInviteRole}
            placeholder="Select role"
            options={[
              { label: 'Admin', value: 'admin' },
              { label: 'Member', value: 'member' },
              { label: 'Viewer', value: 'viewer' },
            ]}
          />
          <Stack direction="horizontal" space="sm" style={{ marginTop: spacing.md }}>
            <Button
              variant="outline"
              onPress={() => setIsInviteDialogOpen(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onPress={handleInviteMember}
              style={{ flex: 1 }}
              disabled={!inviteEmail}
            >
              Send Invitation
            </Button>
          </Stack>
        </Stack>
      </Dialog>
    </View>
  );
}