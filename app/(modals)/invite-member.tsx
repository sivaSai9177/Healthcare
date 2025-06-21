import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Text,
  Container,
  VStack,
  HStack,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  Alert,
} from '@/components/universal';
import { useAuth } from '@/hooks/useAuth';
import { useSpacing } from '@/lib/stores/spacing-store';
import { api } from '@/lib/api/trpc';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';
import { haptic } from '@/lib/ui/haptics';
import { log } from '@/lib/core/debug/logger';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOrganizationAccess } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/blocks/auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/auth/permissions';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'admin', 'manager', 'member', 'guest']),
  healthcareRole: z.enum(['head_doctor', 'doctor', 'nurse', 'operator', 'none']).optional(),
  department: z.string().optional(),
  message: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function InviteMemberModal() {
  const { spacing } = useSpacing();
  const { user } = useAuth();
  const { organizationId } = useLocalSearchParams<{ organizationId?: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { canInviteMembers } = useOrganizationAccess();
  
  const orgId = organizationId || user?.organizationId;
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'member',
      healthcareRole: 'none',
      department: 'General',
      message: '',
    },
  });
  
  const selectedRole = watch('role');
  const selectedHealthcareRole = watch('healthcareRole');
  
  // Invite member mutation
  const inviteMutation = api.organization.inviteMembers.useMutation({
    onSuccess: () => {
      showSuccessAlert('Invitation sent successfully');
      haptic('success');
      reset();
      setTimeout(() => router.back(), 1000);
    },
    onError: (error) => {
      showErrorAlert('Failed to send invitation', error.message);
      haptic('error');
    },
  });
  
  const onSubmit = async (data: InviteFormData) => {
    if (!orgId) {
      showErrorAlert('No organization selected');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await inviteMutation.mutateAsync({
        organizationId: orgId,
        emails: [data.email],
        role: data.role,
        message: data.message,
        metadata: {
          healthcareRole: data.healthcareRole !== 'none' ? data.healthcareRole : undefined,
          department: data.department,
        },
      });
    } catch (error) {
      log.error('Failed to invite member', 'INVITE_MEMBER', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    router.back();
  };
  
  return (
    <PermissionGuard permission={PERMISSIONS.INVITE_MEMBERS}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Container className="flex-1 bg-background">
        <ScrollView
          contentContainerStyle={{
            padding: spacing[6] as any,
            paddingBottom: spacing[8] as any,
          }}
          showsVerticalScrollIndicator={false}
        >
          <VStack gap={spacing[6] as any}>
            {/* Header */}
            <VStack gap={spacing[3] as any} alignItems="center">
              <Text size="2xl" weight="bold">
                Invite Team Member
              </Text>
              <Text size="sm" colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
                Send an invitation to join your organization
              </Text>
            </VStack>
            
            {/* Form */}
            <Card>
              <VStack gap={spacing[4] as any}>
                {/* Email */}
                <VStack gap={spacing[2] as any}>
                  <Text weight="medium">Email Address *</Text>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        placeholder="doctor@hospital.com"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={!!errors.email}
                      />
                    )}
                  />
                  {errors.email && (
                    <Text size="sm" colorTheme="error">
                      {errors.email.message}
                    </Text>
                  )}
                </VStack>
                
                {/* Organization Role */}
                <VStack gap={spacing[2] as any}>
                  <Text weight="medium">Organization Role *</Text>
                  <Controller
                    control={control}
                    name="role"
                    render={({ field: { onChange, value } }) => (
                      <Select value={value} onValueChange={onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </VStack>
                
                {/* Healthcare Role */}
                <VStack gap={spacing[2] as any}>
                  <Text weight="medium">Healthcare Role</Text>
                  <Controller
                    control={control}
                    name="healthcareRole"
                    render={({ field: { onChange, value } }) => (
                      <Select value={value} onValueChange={onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select healthcare role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (Non-medical staff)</SelectItem>
                          <SelectItem value="operator">Operator</SelectItem>
                          <SelectItem value="nurse">Nurse</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="head_doctor">Head Doctor</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </VStack>
                
                {/* Department (if healthcare role selected) */}
                {selectedHealthcareRole && selectedHealthcareRole !== 'none' && (
                  <VStack gap={spacing[2] as any}>
                    <Text weight="medium">Department</Text>
                    <Controller
                      control={control}
                      name="department"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          placeholder="e.g., Emergency, Cardiology"
                          value={value}
                          onChangeText={onChange}
                        />
                      )}
                    />
                  </VStack>
                )}
                
                {/* Personal Message */}
                <VStack gap={spacing[2] as any}>
                  <Text weight="medium">Personal Message (Optional)</Text>
                  <Controller
                    control={control}
                    name="message"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        placeholder="Welcome to our team..."
                        value={value}
                        onChangeText={onChange}
                        multiline
                        numberOfLines={3}
                        style={{ minHeight: 80 }}
                      />
                    )}
                  />
                </VStack>
                
                {/* Info Alert */}
                <Alert variant="info">
                  <Text size="sm">
                    The user will receive an email invitation to join your organization. 
                    They can accept or decline the invitation.
                  </Text>
                </Alert>
              </VStack>
            </Card>
            
            {/* Actions */}
            <HStack gap={spacing[3] as any}>
              <Button
                variant="outline"
                onPress={handleClose}
                style={{ flex: 1 }}
                size="default"
              >
                Cancel
              </Button>
              <Button
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                style={{ flex: 1 }}
                size="default"
              >
                Send Invitation
              </Button>
            </HStack>
          </VStack>
        </ScrollView>
      </Container>
    </KeyboardAvoidingView>
    </PermissionGuard>
  );
}