import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useTheme } from '@/lib/theme/provider';
import { api } from '@/lib/api/trpc';
import { Text } from '@/components/universal/typography/Text';
import { Button } from '@/components/universal/interaction/Button';
import { Card } from '@/components/universal/display/Card';
import { Badge } from '@/components/universal/display/Badge';
import { Box } from '@/components/universal/layout/Box';
import { Alert } from '@/components/universal/feedback/Alert';
import { Building2, Clock, Check, X, FileText } from '@/components/universal/display/Symbols';
import { formatDistanceToNow } from 'date-fns';
// Define JoinRequestStatus type locally
type JoinRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export default function MyJoinRequestsScreen() {
  const { theme } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState<JoinRequestStatus | undefined>('pending');
  
  const { data, isLoading, refetch } = api.organization.listUserJoinRequests.useQuery({
    status: selectedStatus,
    limit: 20,
  });

  const cancelRequest = api.organization.cancelJoinRequest.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleCancel = (requestId: string) => {
    cancelRequest.mutate({ requestId });
  };

  const getStatusBadge = (status: JoinRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" icon={<Clock size={14} />}>Pending</Badge>;
      case 'approved':
        return <Badge variant="success" icon={<Check size={14} />}>Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger" icon={<X size={14} />}>Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const styles = {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    statusTabs: {
      flexDirection: 'row' as const,
      gap: theme.spacing.s,
    },
    statusTab: {
      flex: 1,
      paddingVertical: theme.spacing.s,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center' as const,
    },
    statusTabActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    statusTabText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    statusTabTextActive: {
      color: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.m,
    },
    requestCard: {
      marginBottom: theme.spacing.m,
    },
    orgHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.m,
      marginBottom: theme.spacing.m,
    },
    orgIcon: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.m,
      backgroundColor: theme.colors.background,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    orgInfo: {
      flex: 1,
    },
    orgName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: theme.colors.text,
    },
    requestDate: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    requestDetails: {
      gap: theme.spacing.m,
    },
    detailRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.s,
    },
    detailLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    message: {
      padding: theme.spacing.m,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.m,
      marginBottom: theme.spacing.m,
    },
    messageLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    messageText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    reviewInfo: {
      padding: theme.spacing.m,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    reviewText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    reviewNote: {
      fontSize: 14,
      color: theme.colors.text,
      marginTop: theme.spacing.xs,
      fontStyle: 'italic' as const,
    },
    cancelButton: {
      marginTop: theme.spacing.m,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center' as const,
      marginTop: theme.spacing.m,
    },
    loader: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
  };

  const statusOptions: { value: JoinRequestStatus | undefined; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: undefined, label: 'All' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'My Join Requests',
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
        }}
      />

      <View style={styles.header}>
        <View style={styles.statusTabs}>
          {statusOptions.map((option) => (
            <Button
              key={option.value || 'all'}
              onPress={() => setSelectedStatus(option.value)}
              style={[
                styles.statusTab,
                selectedStatus === option.value && styles.statusTabActive,
              ]}
            >
              <Text style={[
                styles.statusTabText,
                selectedStatus === option.value && styles.statusTabTextActive,
              ]}>
                {option.label}
              </Text>
            </Button>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => refetch()}
              tintColor={theme.colors.primary}
            />
          }
        >
          {cancelRequest.error && (
            <Alert
              variant="danger"
              title="Error"
              message={cancelRequest.error.message}
              style={{ marginBottom: theme.spacing.m }}
            />
          )}

          {data?.requests.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>
                No join requests found.
              </Text>
            </View>
          ) : (
            data?.requests.map((request) => (
              <Card key={request.id} style={styles.requestCard}>
                <View style={styles.orgHeader}>
                  <View style={styles.orgIcon}>
                    <Building2 size={24} color={theme.colors.textSecondary} />
                  </View>
                  <View style={styles.orgInfo}>
                    <Text style={styles.orgName}>
                      {request.organization.name}
                    </Text>
                    <Text style={styles.requestDate}>
                      Requested {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </Text>
                  </View>
                  {getStatusBadge(request.status)}
                </View>

                <View style={styles.requestDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Requested Role:</Text>
                    <Badge variant="secondary">{request.requestedRole}</Badge>
                  </View>

                  {request.autoApproved && (
                    <View style={styles.detailRow}>
                      <Badge variant="info">Auto-approved</Badge>
                    </View>
                  )}
                </View>

                {request.message && (
                  <View style={styles.message}>
                    <Text style={styles.messageLabel}>Your message:</Text>
                    <Text style={styles.messageText}>{request.message}</Text>
                  </View>
                )}

                {request.reviewedBy && (
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewText}>
                      {request.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                      {request.reviewedBy.name} {request.reviewedAt && 
                        formatDistanceToNow(new Date(request.reviewedAt), { addSuffix: true })
                      }
                    </Text>
                    {request.reviewNote && (
                      <Text style={styles.reviewNote}>
                        "{request.reviewNote}"
                      </Text>
                    )}
                  </View>
                )}

                {request.status === 'pending' && (
                  <Button
                    variant="secondary"
                    onPress={() => handleCancel(request.id)}
                    style={styles.cancelButton}
                    loading={cancelRequest.isLoading}
                    leftIcon={<X size={16} />}
                  >
                    Cancel Request
                  </Button>
                )}
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}