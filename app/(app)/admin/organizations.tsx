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
  Select,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Symbol } from '@/components/universal/display/Symbols';

export default function OrganizationsManagementScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Check admin access
  if (!user || user.role !== 'admin') {
    return (
      <Container>
        <VStack p={4} gap={4 as any} alignItems="center" justifyContent="center" style={{ flex: 1 }}>
          <Text size="base">Access Restricted</Text>
          <Text colorTheme="mutedForeground">
            This section is only available to administrators
          </Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </VStack>
      </Container>
    );
  }

  // Mock organizations data - replace with tRPC query
  const organizations = [
    {
      id: '1',
      name: 'City General Hospital',
      plan: 'enterprise',
      status: 'active',
      memberCount: 45,
      industry: 'Healthcare',
      createdAt: '2024-01-15',
      revenue: '$125,000',
    },
    {
      id: '2',
      name: 'Tech Startup Inc',
      plan: 'pro',
      status: 'active',
      memberCount: 12,
      industry: 'Technology',
      createdAt: '2024-06-20',
      revenue: '$12,500',
    },
    {
      id: '3',
      name: 'Marketing Agency',
      plan: 'basic',
      status: 'trial',
      memberCount: 8,
      industry: 'Marketing',
      createdAt: '2025-01-01',
      revenue: '$0',
    },
    {
      id: '4',
      name: 'Regional Clinic',
      plan: 'pro',
      status: 'suspended',
      memberCount: 23,
      industry: 'Healthcare',
      createdAt: '2023-11-10',
      revenue: '$45,000',
    },
  ];

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = 
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'all' || org.plan === planFilter;
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const getPlanBadgeVariant = (plan: string): any => {
    switch (plan) {
      case 'enterprise':
        return 'destructive';
      case 'pro':
        return 'default';
      case 'basic':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string): any => {
    switch (status) {
      case 'active':
        return 'success';
      case 'trial':
        return 'warning';
      case 'suspended':
        return 'destructive';
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
            <Text size="2xl" weight="bold">Organizations</Text>
            <Text size="sm" colorTheme="mutedForeground">
              Manage all organizations on the platform
            </Text>
          </VStack>
        </HStack>
        <Button
          variant="default"
          size="sm"
          onPress={() => {
            // Add new organization
          }}
        >
          <Symbol name="plus" size={16} />
          <Text>Add Organization</Text>
        </Button>
      </HStack>

      {/* Stats */}
      <HStack gap={3 as any}>
        <Card style={{ flex: 1 }}>
          <Box p={3 as any}>
            <VStack gap={1 as any} alignItems="center">
              <Text size="2xl" weight="bold">{organizations.length}</Text>
              <Text size="sm" colorTheme="mutedForeground">Total Orgs</Text>
            </VStack>
          </Box>
        </Card>
        <Card style={{ flex: 1 }}>
          <Box p={3 as any}>
            <VStack gap={1 as any} alignItems="center">
              <Text size="2xl" weight="bold">
                {organizations.filter(o => o.status === 'active').length}
              </Text>
              <Text size="sm" colorTheme="mutedForeground">Active</Text>
            </VStack>
          </Box>
        </Card>
        <Card style={{ flex: 1 }}>
          <Box p={3 as any}>
            <VStack gap={1 as any} alignItems="center">
              <Text size="2xl" weight="bold">
                {organizations.reduce((sum, o) => sum + o.memberCount, 0)}
              </Text>
              <Text size="sm" colorTheme="mutedForeground">Total Users</Text>
            </VStack>
          </Box>
        </Card>
      </HStack>

      {/* Filters */}
      <VStack gap={3 as any}>
        <Input
          placeholder="Search organizations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Symbol name="magnifyingglass" size={16} className="text-muted-foreground" />}
        />
        
        <HStack gap={2 as any}>
          <Box style={{ flex: 1 }}>
            <Select 
              value={planFilter} 
              onValueChange={(value) => setPlanFilter(value as string)}
              options={[
                { label: "All plans", value: "all" },
                { label: "Enterprise", value: "enterprise" },
                { label: "Pro", value: "pro" },
                { label: "Basic", value: "basic" }
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
                { label: "Trial", value: "trial" },
                { label: "Suspended", value: "suspended" }
              ]}
            />
          </Box>
        </HStack>
      </VStack>

      {/* Organization List */}
      <VStack gap={3 as any}>
        {filteredOrganizations.map((org) => (
          <Card key={org.id}>
            <Box p={4 as any}>
              <VStack gap={3 as any}>
                <HStack justifyContent="space-between" alignItems="flex-start">
                  <VStack gap={1 as any}>
                    <Text weight="semibold" size="base">{org.name}</Text>
                    <HStack gap={2 as any}>
                      <Badge variant={getPlanBadgeVariant(org.plan)} size="sm">
                        {org.plan}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(org.status)} size="sm">
                        {org.status}
                      </Badge>
                    </HStack>
                  </VStack>
                  <HStack gap={1 as any}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onPress={() => {
                        // View details
                      }}
                    >
                      <Symbol name="eye" size={16} />
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
                </HStack>
                
                <HStack gap={4 as any}>
                  <VStack gap={1 as any}>
                    <Text size="xs" colorTheme="mutedForeground">Industry</Text>
                    <Text size="sm">{org.industry}</Text>
                  </VStack>
                  <VStack gap={1 as any}>
                    <Text size="xs" colorTheme="mutedForeground">Members</Text>
                    <Text size="sm">{org.memberCount}</Text>
                  </VStack>
                  <VStack gap={1 as any}>
                    <Text size="xs" colorTheme="mutedForeground">Revenue</Text>
                    <Text size="sm">{org.revenue}</Text>
                  </VStack>
                  <VStack gap={1 as any}>
                    <Text size="xs" colorTheme="mutedForeground">Created</Text>
                    <Text size="sm">{new Date(org.createdAt).toLocaleDateString()}</Text>
                  </VStack>
                </HStack>
              </VStack>
            </Box>
          </Card>
        ))}
      </VStack>

      {/* Empty State */}
      {filteredOrganizations.length === 0 && (
        <Card>
          <Box p={6} alignItems="center">
            <VStack gap={3 as any} alignItems="center">
              <Symbol name="building.2" size={48} className="text-muted-foreground" />
              <Text colorTheme="mutedForeground">
                No organizations found
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
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing[4] as any, paddingBottom: spacing[6] as any }}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
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
  );
}