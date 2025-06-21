import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Table, TableHeader, TableBody, TableRow, TableCell, Badge } from '@/components/universal/display';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { Input, Form, FormItem, Select, Switch } from '@/components/universal/form';
import { VStack, HStack } from '@/components/universal/layout';
import { Alert, AlertTitle, AlertDescription } from '@/components/universal/feedback';
import { useResponsive } from '@/hooks/responsive';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api/trpc';
import { haptic } from '@/lib/ui/haptics';
import { 
  Mail, 
  Forward, 
  AlertCircle,
  Clock,
  XCircle,
  UserPlus,
} from '@/components/universal/display/Symbols';
import { format } from 'date-fns';

interface EmailSettingsBlockProps {
  organizationId: string;
  onInviteSent?: () => void;
}

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'member', 'viewer']),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const mockPendingInvites = [
  {
    id: '1',
    email: 'jane.doe@hospital.com',
    role: 'member',
    invitedBy: 'John Smith',
    invitedAt: new Date('2024-12-28'),
    status: 'pending',
  },
  {
    id: '2',
    email: 'bob.jones@hospital.com',
    role: 'viewer',
    invitedBy: 'Sarah Johnson',
    invitedAt: new Date('2024-12-25'),
    status: 'pending',
  },
];

export function EmailSettingsBlock({
  organizationId,
  onInviteSent,
}: EmailSettingsBlockProps) {
  const { spacing } = useSpacing();
  const { isMobile } = useResponsive();
  const [pendingInvites, setPendingInvites] = useState(mockPendingInvites);
  const [emailPreferences, setEmailPreferences] = useState({
    inviteNotifications: true,
    memberUpdates: true,
    billingAlerts: true,
    systemNotifications: false,
    weeklyReports: true,
  });
  
  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'member',
      message: '',
    },
  });
  
  // TODO: Replace with actual API call when inviteMembers endpoint is implemented
  const sendInviteMutation = api.organization.update.useMutation({
    onSuccess: () => {
      haptic('success');
      form.reset();
      onInviteSent?.();
      // Add to pending invites for demo
      const newInvite = {
        id: Date.now().toString(),
        email: form.getValues('email'),
        role: form.getValues('role'),
        invitedBy: 'Current User',
        invitedAt: new Date(),
        status: 'pending' as const,
      };
      setPendingInvites([newInvite, ...pendingInvites]);
    },
    onError: (error) => {
      haptic('error');
      form.setError('root', {
        message: error.message || 'Failed to send invitation',
      });
    },
  });
  
  const handleInvite = (data: InviteFormData) => {
    sendInviteMutation.mutate({
      organizationId,
      ...data,
    });
  };
  
  const handleCancelInvite = (inviteId: string) => {
    haptic('light');
    setPendingInvites(pendingInvites.filter(invite => invite.id !== inviteId));
  };
  
  const handleResendInvite = (_inviteId: string) => {
    haptic('light');
    // In a real app, this would resend the invitation
  };
  
  const handlePreferenceChange = (key: keyof typeof emailPreferences) => {
    haptic('light');
    setEmailPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  
  return (
    <View className="animate-fade-in">
      {/* Send Invitations */}
      <Card shadow="md" className="mb-6">
        <CardHeader>
          <CardTitle>Invite Team Members</CardTitle>
          <CardDescription>
            Send email invitations to add new members to your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form form={form} onSubmit={handleInvite}>
            <VStack gap={spacing[4] as any}>
              {isMobile ? (
                <VStack gap={spacing[3] as any}>
                  <FormItem 
                    name="email" 
                    label="Email Address*"
                    rules={{ required: 'Email is required' }}
                    style={{ flex: 1 }}
                  >
                    {(field) => (
                      <Input
                        placeholder="colleague@example.com"
                        leftIcon={<Mail size={16} />}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        {...field}
                        onChangeText={field.onChange}
                      />
                    )}
                  </FormItem>
                  
                  <FormItem 
                    name="role" 
                    label="Role*"
                    rules={{ required: 'Role is required' }}
                    style={{ minWidth: 150 }}
                  >
                    {(field) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select role"
                        options={[
                          { label: 'Admin', value: 'admin' },
                          { label: 'Member', value: 'member' },
                          { label: 'Viewer', value: 'viewer' },
                        ]}
                      />
                    )}
                  </FormItem>
                </VStack>
              ) : (
                <HStack gap={spacing[3] as any}>
                  <FormItem 
                    name="email" 
                    label="Email Address*"
                    rules={{ required: 'Email is required' }}
                    style={{ flex: 1 }}
                  >
                    {(field) => (
                      <Input
                        placeholder="colleague@example.com"
                        leftIcon={<Mail size={16} />}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        {...field}
                        onChangeText={field.onChange}
                      />
                    )}
                  </FormItem>
                  
                  <FormItem 
                    name="role" 
                    label="Role*"
                    rules={{ required: 'Role is required' }}
                    style={{ minWidth: 150 }}
                  >
                    {(field) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select role"
                        options={[
                          { label: 'Admin', value: 'admin' },
                          { label: 'Member', value: 'member' },
                          { label: 'Viewer', value: 'viewer' },
                        ]}
                      />
                    )}
                  </FormItem>
                </HStack>
              )}
              
              <FormItem 
                name="message" 
                label="Personal Message (Optional)"
                hint="This message will be included in the invitation email"
              >
                {(field) => (
                  <Input
                    placeholder="Add a personal message to the invitation..."
                    multiline
                    numberOfLines={3}
                    {...field}
                    onChangeText={field.onChange}
                  />
                )}
              </FormItem>
                
                {form.formState.errors.root && (
                  <Alert variant="error">
                    <AlertCircle size={16} />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {form.formState.errors.root.message}
                    </AlertDescription>
                  </Alert>
                )}
                
              <Button
                variant="default"
                leftIcon={<Forward size={16} />}
                isLoading={sendInviteMutation.isPending}
                style={{ alignSelf: 'flex-start' }}
                onPress={form.handleSubmit(handleInvite)}
              >
                Send Invitation
              </Button>
            </VStack>
          </Form>
        </CardContent>
      </Card>
      
      {/* Email Preferences */}
      <Card shadow="md" className="mb-6">
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>
            Configure which emails your organization receives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VStack gap={spacing[4] as any}>
            {Object.entries({
              inviteNotifications: {
                label: 'Invitation Notifications',
                description: 'Receive emails when invitations are accepted or declined',
              },
              memberUpdates: {
                label: 'Member Updates',
                description: 'Get notified when members join, leave, or change roles',
              },
              billingAlerts: {
                label: 'Billing Alerts',
                description: 'Important billing and payment notifications',
              },
              systemNotifications: {
                label: 'System Notifications',
                description: 'Updates about maintenance and system status',
              },
              weeklyReports: {
                label: 'Weekly Reports',
                description: 'Summary of organization activity and metrics',
              },
            }).map(([key, config]) => (
              <HStack 
                key={key}
                justifyContent="space-between"
                alignItems="center"
                gap={spacing[3] as any}
              >
                <View style={{ flex: 1 }}>
                  <Text weight="medium">{config.label}</Text>
                  <Text colorTheme="mutedForeground" size="sm">
                    {config.description}
                  </Text>
                </View>
                <Switch
                  checked={emailPreferences[key as keyof typeof emailPreferences]}
                  onCheckedChange={() => handlePreferenceChange(key as keyof typeof emailPreferences)}
                />
              </HStack>
            ))}
          </VStack>
        </CardContent>
      </Card>
      
      {/* Pending Invitations */}
      <Card shadow="md">
        <CardHeader>
          <HStack justifyContent="space-between" alignItems="center">
            <View>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Manage invitations that haven&apos;t been accepted yet
              </CardDescription>
            </View>
            <Badge variant="secondary">
              {pendingInvites.length} Pending
            </Badge>
          </HStack>
        </CardHeader>
        <CardContent>
          {pendingInvites.length === 0 ? (
            <View 
              className="p-8 items-center justify-center"
              style={{ paddingVertical: spacing[8], paddingHorizontal: spacing[4] }}
            >
              <UserPlus size={48} className="text-muted-foreground mb-2" />
              <Text colorTheme="mutedForeground">
                No pending invitations
              </Text>
            </View>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Email</TableCell>
                  <TableCell header>Role</TableCell>
                  <TableCell header>Invited By</TableCell>
                  <TableCell header>Sent</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" size="sm">
                        {invite.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{invite.invitedBy}</TableCell>
                    <TableCell>
                      <HStack alignItems="center" gap={spacing[1] as any}>
                        <Clock size={14} className="text-muted-foreground" />
                        <Text size="sm" colorTheme="mutedForeground">
                          {format(invite.invitedAt, 'MMM d')}
                        </Text>
                      </HStack>
                    </TableCell>
                    <TableCell>
                      <HStack gap={spacing[1] as any}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => handleResendInvite(invite.id)}
                        >
                          Resend
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => handleCancelInvite(invite.id)}
                        >
                          <XCircle size={16} className="text-destructive" />
                        </Button>
                      </HStack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </View>
  );
}

export type { EmailSettingsBlockProps };