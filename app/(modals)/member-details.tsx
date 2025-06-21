import type { SpacingValue, ButtonVariant, BadgeVariant } from '@/types/components';
import React from 'react';
import { View, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Text,
  Button,
  Card,
  Stack,
  Container,
  Badge,
  Avatar,
  Separator,
} from '@/components/universal';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/hooks/core/useSpacing';

interface MemberInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'pending';
  phone?: string;
  permissions: string[];
  recentActivity: {
    action: string;
    timestamp: string;
  }[];
}

// Mock member data - replace with actual data fetching
const mockMember: MemberInfo = {
  id: '1',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@hospital.com',
  role: 'Senior Nurse',
  department: 'Emergency Department',
  joinDate: '2023-06-15',
  status: 'active',
  phone: '+1 (555) 123-4567',
  permissions: ['View Patients', 'Create Alerts', 'Update Records', 'View Reports'],
  recentActivity: [
    { action: 'Updated patient record #12345', timestamp: '2025-01-06T14:30:00' },
    { action: 'Created high priority alert', timestamp: '2025-01-06T12:15:00' },
    { action: 'Logged in', timestamp: '2025-01-06T08:00:00' },
  ],
};

export default function MemberDetailsModal() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const spacing = useSpacing();

  // TODO: Fetch actual member data based on memberId
  const member = mockMember;

  const handleClose = () => {
    router.back();
  };

  const getStatusColor = (status: MemberInfo['status']) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Container className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xl,
        }}
      >
        <Stack spacing="lg">
          {/* Header */}
          <Stack spacing="md" align="center">
            <Avatar
              size="xl"
              fallback={member.name.split(' ').map(n => n[0]).join('')}
            />
            <Stack spacing="xs" align="center">
              <Text variant="h2">{member.name}</Text>
              <Text variant="body" style={{ opacity: 0.7 }}>
                {member.role}
              </Text>
              <Badge variant={getStatusColor(member.status)}>
                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
              </Badge>
            </Stack>
          </Stack>

          {/* Contact Information */}
          <Card>
            <Stack spacing="md">
              <Text variant="h4">Contact Information</Text>
              <Stack spacing="sm">
                <Stack spacing="xs">
                  <Text variant="caption" style={{ opacity: 0.7 }}>
                    Email
                  </Text>
                  <Text variant="body">{member.email}</Text>
                </Stack>
                {member.phone && (
                  <Stack spacing="xs">
                    <Text variant="caption" style={{ opacity: 0.7 }}>
                      Phone
                    </Text>
                    <Text variant="body">{member.phone}</Text>
                  </Stack>
                )}
                <Stack spacing="xs">
                  <Text variant="caption" style={{ opacity: 0.7 }}>
                    Department
                  </Text>
                  <Text variant="body">{member.department}</Text>
                </Stack>
                <Stack spacing="xs">
                  <Text variant="caption" style={{ opacity: 0.7 }}>
                    Member Since
                  </Text>
                  <Text variant="body">
                    {new Date(member.joinDate).toLocaleDateString()}
                  </Text>
                </Stack>
              </Stack>
            </Stack>
          </Card>

          {/* Permissions */}
          <Card>
            <Stack spacing="md">
              <Text variant="h4">Permissions</Text>
              <Stack direction="row" spacing="sm" style={{ flexWrap: 'wrap' }}>
                {member.permissions.map((permission, index) => (
                  <Badge key={index} variant="secondary">
                    {permission}
                  </Badge>
                ))}
              </Stack>
            </Stack>
          </Card>

          {/* Recent Activity */}
          <Card>
            <Stack spacing="md">
              <Text variant="h4">Recent Activity</Text>
              <Stack spacing="md">
                {member.recentActivity.map((activity, index) => (
                  <View key={index}>
                    <Stack spacing="xs">
                      <Text variant="body">{activity.action}</Text>
                      <Text variant="caption" style={{ opacity: 0.7 }}>
                        {new Date(activity.timestamp).toLocaleString()}
                      </Text>
                    </Stack>
                    {index < member.recentActivity.length - 1 && (
                      <Separator style={{ marginTop: spacing.sm }} />
                    )}
                  </View>
                ))}
              </Stack>
            </Stack>
          </Card>

          {/* Actions */}
          <Stack spacing="sm">
            <Button
              variant="default"
              onPress={() => {
                // TODO: Navigate to edit member screen
                // Edit member logic
              }}
            >
              Edit Member
            </Button>
            <Button
              variant="error"
              onPress={() => {
                // TODO: Implement remove member logic
                // Remove member logic
              }}
            >
              Remove from Organization
            </Button>
            <Button variant="outline" onPress={handleClose}>
              Close
            </Button>
          </Stack>
        </Stack>
      </ScrollView>
    </Container>
  );
}