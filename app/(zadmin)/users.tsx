import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Text,
  Card,
  Badge,
  Button,
  Input,
  VStack,
  HStack,
  Container,
  Avatar,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/universal';
import { Search, UserPlus, MoreVertical } from '@/components/universal/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';

export default function UsersScreen() {
  const router = useRouter();
  const { spacing } = useSpacing();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - replace with tRPC query
  const users = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      status: 'active',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      lastActive: '2 hours ago',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'manager',
      status: 'active',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
      lastActive: '5 minutes ago',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'user',
      status: 'inactive',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
      lastActive: '3 days ago',
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh user data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'secondary';
      case 'user':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      contentContainerStyle={{ paddingBottom: spacing.xl }}
    >
      <Container size="full" padding="lg">
        <VStack spacing="lg">
          {/* Header */}
          <HStack justify="between" align="center">
            <VStack spacing="xs">
              <Text variant="h3">User Management</Text>
              <Text variant="body2" className="text-muted-foreground">
                Manage user accounts and permissions
              </Text>
            </VStack>
            <Button
              size="sm"
              onPress={() => router.push('/(zmodals)/create-user')}
            >
              <UserPlus size={16} />
              <Text>Add User</Text>
            </Button>
          </HStack>

          {/* Search and Filters */}
          <VStack spacing="md">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="w-full"
              icon={<Search size={16} className="text-muted-foreground" />}
            />
            
            <HStack spacing="md">
              <View className="flex-1">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </View>
              
              <View className="flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </View>
            </HStack>
          </VStack>

          {/* User List */}
          <VStack spacing="md">
            {filteredUsers.map((user) => (
              <Card key={user.id} padding="md">
                <HStack spacing="md" align="center">
                  <Avatar
                    src={user.avatar}
                    alt={user.name}
                    size="md"
                  />
                  
                  <VStack spacing="xs" className="flex-1">
                    <HStack spacing="sm" align="center">
                      <Text variant="body1" weight="semibold">
                        {user.name}
                      </Text>
                      <Badge size="sm" variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                      <Badge size="sm" variant={getStatusBadgeVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </HStack>
                    <Text variant="body2" className="text-muted-foreground">
                      {user.email}
                    </Text>
                    <Text variant="caption" className="text-muted-foreground">
                      Last active: {user.lastActive}
                    </Text>
                  </VStack>
                  
                  <Pressable
                    onPress={() => router.push(`/(zmodals)/user-details?id=${user.id}`)}
                    className="p-2"
                  >
                    <MoreVertical size={20} className="text-muted-foreground" />
                  </Pressable>
                </HStack>
              </Card>
            ))}
          </VStack>

          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <Card padding="xl" className="items-center">
              <VStack spacing="md" align="center">
                <Text variant="body1" className="text-muted-foreground">
                  No users found
                </Text>
                <Text variant="body2" className="text-muted-foreground text-center">
                  Try adjusting your search or filters
                </Text>
              </VStack>
            </Card>
          )}
        </VStack>
      </Container>
    </ScrollView>
  );
}