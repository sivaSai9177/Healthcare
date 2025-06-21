import React, { useState } from 'react';
import { ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme/provider';
import {
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Box,
  Input,
  Badge,
  Avatar,
  Select,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Symbol } from '@/components/universal/display/Symbols';
import { AdminOnly } from '@/components/blocks/auth/PermissionGuard';
import { useAdminAccess } from '@/hooks/usePermissions';

export default function UsersManagementScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock users data - replace with tRPC query
  const users = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'doctor',
      status: 'active',
      lastActive: '2 hours ago',
      organizationRole: 'member',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'nurse',
      status: 'active',
      lastActive: '5 minutes ago',
      organizationRole: 'member',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      role: 'operator',
      status: 'inactive',
      lastActive: '3 days ago',
      organizationRole: 'member',
    },
    {
      id: '4',
      name: 'Sarah Williams',
      email: 'sarah.williams@example.com',
      role: 'manager',
      status: 'active',
      lastActive: '1 hour ago',
      organizationRole: 'admin',
    },
  ];

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeVariant = (role: string): any => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'secondary';
      case 'doctor':
      case 'nurse':
      case 'head_doctor':
        return 'default';
      case 'operator':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const content = (
    <VStack gap={4 as any}>
      {/* Header */}
      <HStack justifyContent="space-between" alignItems="center">
        <HStack alignItems="center" gap={2 as any}>
          <Button
            onPress={() => router.back()}
            variant="ghost"
            size="icon"
          >
            <Symbol name="chevron.left" size={24} />
          </Button>
          <VStack gap={1 as any}>
            <Text size="2xl" weight="bold">User Management</Text>
            <Text size="sm" colorTheme="mutedForeground">
              Manage system users and permissions
            </Text>
          </VStack>
        </HStack>
        <Button
          variant="default"
          size="sm"
          onPress={() => {
            // Add new user
          }}
        >
          <Symbol name="person.badge.plus" size={16} />
          <Text>Add User</Text>
        </Button>
      </HStack>

      {/* Stats */}
      <HStack gap={3 as any}>
        <Card style={{ flex: 1 }}>
          <Box p={3 as any}>
            <VStack gap={1 as any} alignItems="center">
              <Text size="2xl" weight="bold">{users.length}</Text>
              <Text size="sm" colorTheme="mutedForeground">Total Users</Text>
            </VStack>
          </Box>
        </Card>
        <Card style={{ flex: 1 }}>
          <Box p={3 as any}>
            <VStack gap={1 as any} alignItems="center">
              <Text size="2xl" weight="bold">
                {users.filter(u => u.status === 'active').length}
              </Text>
              <Text size="sm" colorTheme="mutedForeground">Active</Text>
            </VStack>
          </Box>
        </Card>
        <Card style={{ flex: 1 }}>
          <Box p={3 as any}>
            <VStack gap={1 as any} alignItems="center">
              <Text size="2xl" weight="bold">
                {users.filter(u => u.organizationRole === 'admin').length}
              </Text>
              <Text size="sm" colorTheme="mutedForeground">Admins</Text>
            </VStack>
          </Box>
        </Card>
      </HStack>

      {/* Filters */}
      <VStack gap={3 as any}>
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Symbol name="magnifyingglass" size={16} className="text-muted-foreground" />}
        />
        
        <HStack gap={2 as any}>
          <Box style={{ flex: 1 }}>
            <Select 
              value={roleFilter} 
              onValueChange={(value) => setRoleFilter(value as string)}
              options={[
                { label: "All roles", value: "all" },
                { label: "Admin", value: "admin" },
                { label: "Manager", value: "manager" },
                { label: "Doctor", value: "doctor" },
                { label: "Nurse", value: "nurse" },
                { label: "Operator", value: "operator" }
              ]}
            />
          </Box>
          
          <Box style={{ flex: 1 }}>
            <Select 
              value={statusFilter} 
              onValueChange={(value) => setStatusFilter(value as string)}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" }
              ]}
            />
          </Box>
        </HStack>
      </VStack>

      {/* User List */}
      <VStack gap={3 as any}>
        {filteredUsers.map((u) => (
          <Card key={u.id}>
            <Box p={4 as any}>
              <HStack justifyContent="space-between" alignItems="center">
                <HStack gap={3 as any} alignItems="center">
                  <Avatar
                    name={u.name}
                    size="default"
                  />
                  <VStack gap={1 as any}>
                    <Text weight="semibold">{u.name}</Text>
                    <Text size="sm" colorTheme="mutedForeground">{u.email}</Text>
                    <HStack gap={2 as any}>
                      <Badge variant={getRoleBadgeVariant(u.role)} size="sm">
                        {u.role}
                      </Badge>
                      <Badge variant={u.status === 'active' ? 'success' : 'secondary'} size="sm">
                        {u.status}
                      </Badge>
                    </HStack>
                  </VStack>
                </HStack>
                <VStack gap={2 as any} alignItems="flex-end">
                  <Text size="xs" colorTheme="mutedForeground">
                    {u.lastActive}
                  </Text>
                  <HStack gap={1 as any}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onPress={() => {
                        // Edit user
                      }}
                    >
                      <Symbol name="pencil" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onPress={() => {
                        // More options
                      }}
                    >
                      <Symbol name="ellipsis" size={16} />
                    </Button>
                  </HStack>
                </VStack>
              </HStack>
            </Box>
          </Card>
        ))}
      </VStack>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <Card>
          <Box p={6} alignItems="center">
            <VStack gap={3 as any} alignItems="center">
              <Symbol name="person.2" size={48} className="text-muted-foreground" />
              <Text colorTheme="mutedForeground">
                No users found
              </Text>
              <Text size="sm" colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
                Try adjusting your search or filters
              </Text>
            </VStack>
          </Box>
        </Card>
      )}
    </VStack>
  );

  if (Platform.OS !== 'web') {
    return (
      <AdminOnly>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <ScrollView
            contentContainerStyle={{ padding: spacing[4] as any, paddingBottom: spacing[6] as any }}
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        </SafeAreaView>
      </AdminOnly>
    );
  }

  return (
    <AdminOnly>
      <Container>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <VStack p={4} gap={4 as any}>
            {content}
          </VStack>
        </ScrollView>
      </Container>
    </AdminOnly>
  );
}