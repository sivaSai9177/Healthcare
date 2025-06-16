import React, { useState } from 'react';
import { View, Modal, ScrollView } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { api } from '@/lib/api/trpc';
import { Text } from '@/components/universal/typography/Text';
import { Input } from '@/components/universal/form/Input';
import { Button } from '@/components/universal/interaction/Button';
import { Card } from '@/components/universal/display/Card';
import { Box } from '@/components/universal/layout/Box';
import { Alert } from '@/components/universal/feedback/Alert';
import { X } from '@/components/universal/display/Symbols';
// Define OrganizationRole type locally
type OrganizationRole = 'member' | 'moderator' | 'manager' | 'admin' | 'owner';

interface JoinRequestFormProps {
  organizationId: string;
  organizationName: string;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function JoinRequestForm({
  organizationId,
  organizationName,
  visible,
  onClose,
  onSuccess,
}: JoinRequestFormProps) {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [requestedRole, setRequestedRole] = useState<OrganizationRole>('member');
  
  const sendJoinRequest = api.organization.sendJoinRequest.useMutation({
    onSuccess: () => {
      onSuccess?.();
      onClose();
      setMessage('');
      setRequestedRole('member');
    },
  });

  const handleSubmit = () => {
    sendJoinRequest.mutate({
      organizationId,
      requestedRole,
      message: message.trim() || undefined,
    });
  };

  const styles = {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: theme.spacing.m,
    },
    container: {
      width: '100%',
      maxWidth: 500,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: theme.spacing.m,
    },
    title: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: theme.colors.text,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    content: {
      gap: theme.spacing.m,
    },
    label: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    orgName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: theme.colors.primary,
    },
    roleOptions: {
      gap: theme.spacing.s,
    },
    roleOption: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    roleOptionActive: {
      backgroundColor: theme.colors.primary + '10',
      borderColor: theme.colors.primary,
    },
    roleTitle: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: theme.colors.text,
    },
    roleDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    messageInput: {
      height: 120,
      textAlignVertical: 'top' as const,
    },
    actions: {
      flexDirection: 'row' as const,
      gap: theme.spacing.s,
      marginTop: theme.spacing.m,
    },
    actionButton: {
      flex: 1,
    },
  };

  const roleOptions: { value: OrganizationRole; title: string; description: string }[] = [
    {
      value: 'member',
      title: 'Member',
      description: 'Regular member with standard access',
    },
    {
      value: 'guest',
      title: 'Guest',
      description: 'Limited access for collaboration',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Card style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Join Organization</Text>
            <Button
              variant="ghost"
              onPress={onClose}
              style={styles.closeButton}
            >
              <X size={24} color={theme.colors.text} />
            </Button>
          </View>

          <ScrollView>
            <View style={styles.content}>
              <Box>
                <Text style={styles.label}>Organization</Text>
                <Text style={styles.orgName}>{organizationName}</Text>
              </Box>

              {sendJoinRequest.error && (
                <Alert
                  variant="danger"
                  title="Error"
                  message={sendJoinRequest.error.message}
                />
              )}

              <Box>
                <Text style={styles.label}>Requested Role</Text>
                <View style={styles.roleOptions}>
                  {roleOptions.map((role) => (
                    <Button
                      key={role.value}
                      variant="ghost"
                      onPress={() => setRequestedRole(role.value)}
                      style={[
                        styles.roleOption,
                        requestedRole === role.value && styles.roleOptionActive,
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.roleTitle}>{role.title}</Text>
                        <Text style={styles.roleDescription}>
                          {role.description}
                        </Text>
                      </View>
                    </Button>
                  ))}
                </View>
              </Box>

              <Box>
                <Text style={styles.label}>
                  Message (Optional)
                </Text>
                <Input
                  placeholder="Tell us why you'd like to join this organization..."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  style={styles.messageInput}
                  maxLength={1000}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.colors.textSecondary,
                    marginTop: theme.spacing.xs,
                    textAlign: 'right' as const,
                  }}
                >
                  {message.length}/1000
                </Text>
              </Box>

              <View style={styles.actions}>
                <Button
                  variant="secondary"
                  onPress={onClose}
                  style={styles.actionButton}
                  disabled={sendJoinRequest.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onPress={handleSubmit}
                  style={styles.actionButton}
                  loading={sendJoinRequest.isLoading}
                  disabled={message.trim().length > 0 && message.trim().length < 10}
                >
                  Send Request
                </Button>
              </View>
            </View>
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
}