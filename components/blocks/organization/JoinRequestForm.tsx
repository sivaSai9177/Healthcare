import React, { useState } from 'react';
import { View, Modal, ScrollView } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { api } from '@/lib/api/trpc';
import { Text } from '@/components/universal/typography/Text';
import { Input } from '@/components/universal/form/Input';
import { Button } from '@/components/universal/interaction/Button';
import { Card } from '@/components/universal/display/Card';
import { Box } from '@/components/universal/layout/Box';
import { Alert } from '@/components/universal/feedback/Alert';
import { X } from '@/components/universal/display/Symbols';
// Define OrganizationRole type locally to match API
type OrganizationRole = 'member' | 'manager' | 'admin' | 'owner' | 'guest';

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
  const theme = useTheme();
  const { spacing } = useSpacing();
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
      padding: spacing[4],
    },
    container: {
      width: 400,
      maxWidth: 500,
      maxHeight: 600,
    } as const,
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing[4],
    },
    title: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: theme.foreground,
    },
    closeButton: {
      padding: spacing[2],
    },
    content: {
      gap: spacing[4],
    },
    label: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: theme.foreground,
      marginBottom: spacing[2],
    },
    orgName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: theme.primary,
    },
    roleOptions: {
      gap: spacing[3],
    },
    roleOption: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: spacing[4],
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    roleOptionActive: {
      backgroundColor: theme.primary + '10',
      borderColor: theme.primary,
    },
    roleTitle: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: theme.foreground,
    },
    roleDescription: {
      fontSize: 14,
      color: theme.mutedForeground,
      marginTop: spacing[2],
    },
    messageInput: {
      height: 120,
      textAlignVertical: 'top' as const,
    },
    actions: {
      flexDirection: 'row' as const,
      gap: spacing[3],
      marginTop: spacing[4],
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
      value: 'guest' as OrganizationRole,
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
              <X size={24} color={theme.foreground} />
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
                  variant="error"
                  title="Error"
                  description={sendJoinRequest.error.message}
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
                      style={{
                        ...styles.roleOption,
                        ...(requestedRole === role.value ? styles.roleOptionActive : {}),
                      }}
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
                    color: theme.mutedForeground,
                    marginTop: spacing[2],
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
                  disabled={sendJoinRequest.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onPress={handleSubmit}
                  style={styles.actionButton}
                  isLoading={sendJoinRequest.isPending}
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