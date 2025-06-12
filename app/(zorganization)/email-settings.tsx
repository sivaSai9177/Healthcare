import React, { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';

import { api } from '@/lib/api/trpc';
import {
  Box,
  Text,
  Card,
  VStack,
  HStack,
  Badge,
  Button,
  Input,
  Textarea,
  Switch,
  Separator,
  IconSymbol,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/universal';
import { Mail, Send, Users, Settings, Clock, AlertCircle } from '@/components/universal/Symbols';
import { useAuthStore } from '@/lib/stores/auth-store';
import { LoadingView } from '@/components/LoadingView';
import { useTheme } from '@/lib/theme/provider';
import { showErrorAlert, showSuccessAlert } from '@/lib/core/alert';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const inviteSchema = z.object({
  emails: z.string().min(1, 'At least one email is required'),
  role: z.enum(['member', 'admin', 'manager']),
  message: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function EmailSettingsScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [isInviting, setIsInviting] = useState(false);

  // Fetch organization settings
  const { data: orgData, isLoading, refetch } = api.organization.get.useQuery({
    organizationId: user?.organizationId || '',
  }, {
    enabled: !!user?.organizationId,
  });

  // Invite members mutation
  const inviteMutation = api.organization.inviteMember.useMutation({
    onSuccess: () => {
      showSuccessAlert('Invitations sent successfully');
      form.reset();
      refetch();
    },
    onError: (error) => {
      showErrorAlert('Failed to send invitations', error.message);
    },
  });

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      emails: '',
      role: 'member',
      message: '',
    },
  });

  const handleSendInvites = async (data: InviteFormData) => {
    setIsInviting(true);
    try {
      // Parse emails (comma or newline separated)
      const emailList = data.emails
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email.length > 0);

      // Validate all emails
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emailList.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        showErrorAlert('Invalid emails', `Please check: ${invalidEmails.join(', ')}`);
        return;
      }

      // Send invitations one by one (could be batched in future)
      for (const email of emailList) {
        await inviteMutation.mutateAsync({
          email,
          role: data.role,
          organizationId: user?.organizationId || '',
        });
      }
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) {
    return <LoadingView message="Loading email settings..." />;
  }

  if (!orgData) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" p={6}>
        <Text>Organization not found</Text>
      </Box>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => refetch()}
          tintColor={theme.primary}
        />
      }
    >
      <Box p={4}>
        <VStack spacing={6}>
          {/* Header */}
          <VStack spacing={2}>
            <Text variant="largeTitle" weight="bold">
              Email & Invitations
            </Text>
            <Text variant="body" color="secondary">
              Manage organization invitations and email settings
            </Text>
          </VStack>

          {/* Invitation Form */}
          <Card p={6}>
            <VStack spacing={4}>
              <HStack spacing={2} align="center">
                <Mail size={20} color={theme.primary} />
                <Text variant="headline" weight="semibold">
                  Invite New Members
                </Text>
              </HStack>

              <VStack spacing={4}>
                <VStack spacing={2}>
                  <Text variant="subheadline" weight="medium">
                    Email Addresses
                  </Text>
                  <Textarea
                    placeholder="Enter email addresses (comma or newline separated)&#10;e.g., john@example.com, jane@example.com"
                    value={form.watch('emails')}
                    onChangeText={(value) => form.setValue('emails', value)}
                    error={form.formState.errors.emails?.message}
                    numberOfLines={4}
                    style={{
                      minHeight: 100,
                      textAlignVertical: 'top',
                    }}
                  />
                  <Text variant="caption" color="tertiary">
                    You can invite multiple members at once
                  </Text>
                </VStack>

                <VStack spacing={2}>
                  <Text variant="subheadline" weight="medium">
                    Role
                  </Text>
                  <Select 
                    value={form.watch('role')} 
                    onValueChange={(value) => form.setValue('role', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </VStack>

                <VStack spacing={2}>
                  <Text variant="subheadline" weight="medium">
                    Personal Message (Optional)
                  </Text>
                  <Textarea
                    placeholder="Add a personal message to the invitation..."
                    value={form.watch('message')}
                    onChangeText={(value) => form.setValue('message', value)}
                    numberOfLines={3}
                    style={{
                      minHeight: 80,
                      textAlignVertical: 'top',
                    }}
                  />
                </VStack>

                <Button
                  size="large"
                  onPress={form.handleSubmit(handleSendInvites)}
                  isLoading={isInviting}
                  disabled={isInviting || !form.watch('emails')}
                  icon={<Send size={16} />}
                >
                  Send Invitations
                </Button>
              </VStack>
            </VStack>
          </Card>

          {/* Email Settings */}
          <Card p={6}>
            <VStack spacing={4}>
              <HStack spacing={2} align="center">
                <Settings size={20} color={theme.primary} />
                <Text variant="headline" weight="semibold">
                  Email Preferences
                </Text>
              </HStack>

              <VStack spacing={2}>
                <HStack justify="between" align="center">
                  <VStack spacing={1} flex={1}>
                    <Text variant="subheadline" weight="medium">
                      Invitation Reminders
                    </Text>
                    <Text variant="caption" color="secondary">
                      Automatically remind pending invitations after 3 days
                    </Text>
                  </VStack>
                  <Switch
                    value={true}
                    onValueChange={() => {
                      showErrorAlert('Coming soon', 'This feature will be available soon');
                    }}
                  />
                </HStack>

                <Separator />

                <HStack justify="between" align="center">
                  <VStack spacing={1} flex={1}>
                    <Text variant="subheadline" weight="medium">
                      Welcome Email
                    </Text>
                    <Text variant="caption" color="secondary">
                      Send a welcome email when members join
                    </Text>
                  </VStack>
                  <Switch
                    value={true}
                    onValueChange={() => {
                      showErrorAlert('Coming soon', 'This feature will be available soon');
                    }}
                  />
                </HStack>

                <Separator />

                <HStack justify="between" align="center">
                  <VStack spacing={1} flex={1}>
                    <Text variant="subheadline" weight="medium">
                      Activity Digest
                    </Text>
                    <Text variant="caption" color="secondary">
                      Weekly summary of organization activity
                    </Text>
                  </VStack>
                  <Switch
                    value={false}
                    onValueChange={() => {
                      showErrorAlert('Coming soon', 'This feature will be available soon');
                    }}
                  />
                </HStack>
              </VStack>
            </VStack>
          </Card>

          {/* Pending Invitations */}
          <Card p={6}>
            <VStack spacing={4}>
              <HStack spacing={2} align="center">
                <Clock size={20} color={theme.primary} />
                <Text variant="headline" weight="semibold">
                  Pending Invitations
                </Text>
              </HStack>

              {/* TODO: Fetch and display pending invitations */}
              <Card variant="secondary" p={4}>
                <VStack spacing={2} align="center">
                  <Users size={32} color={theme.mutedForeground} />
                  <Text variant="body" color="secondary" align="center">
                    No pending invitations
                  </Text>
                  <Text variant="caption" color="tertiary" align="center">
                    Invitations you send will appear here
                  </Text>
                </VStack>
              </Card>
            </VStack>
          </Card>

          {/* Info Card */}
          <Card variant="info" p={4}>
            <HStack spacing={2} align="start">
              <AlertCircle size={16} color={theme.primary} />
              <VStack spacing={1} flex={1}>
                <Text variant="caption" weight="medium">
                  About Invitations
                </Text>
                <Text variant="caption" color="secondary">
                  • Invitations expire after 7 days
                </Text>
                <Text variant="caption" color="secondary">
                  • Members will receive an email with a join link
                </Text>
                <Text variant="caption" color="secondary">
                  • You can resend or cancel pending invitations
                </Text>
              </VStack>
            </HStack>
          </Card>
        </VStack>
      </Box>
    </ScrollView>
  );
}