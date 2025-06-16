import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { api } from '@/lib/api/trpc';
import { Text } from '@/components/universal/typography/Text';
import { Input } from '@/components/universal/form/Input';
import { Button } from '@/components/universal/interaction/Button';
import { Card } from '@/components/universal/display/Card';
import { Badge } from '@/components/universal/display/Badge';
import { Avatar } from '@/components/universal/display/Avatar';
import { Box } from '@/components/universal/layout/Box';
import { Alert } from '@/components/universal/feedback/Alert';
import { SearchIcon, Check, X, Clock, User } from '@/components/universal/display/Symbols';
import { formatDistanceToNow } from 'date-fns';
// Define JoinRequestStatus type locally
type JoinRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface JoinRequestsManagerProps {
  organizationId: string;
}

export function JoinRequestsManager({ organizationId }: JoinRequestsManagerProps) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<JoinRequestStatus | undefined>('pending');
  const [reviewNote, setReviewNote] = useState<{ [key: string]: string }>({});
  
  const { data, isLoading, refetch } = api.organization.listJoinRequests.useQuery({
    organizationId,
    status: selectedStatus,
    search: searchQuery || undefined,
    limit: 20,
  });

  const reviewRequest = api.organization.reviewJoinRequest.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleReview = (requestId: string, action: 'approve' | 'reject') => {
    reviewRequest.mutate({
      requestId,
      action,
      reviewNote: reviewNote[requestId] || undefined,
    });
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
    },
    header: {
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchRow: {
      flexDirection: 'row' as const,
      gap: theme.spacing.s,
    },
    searchInput: {
      flex: 1,
    },
    statusTabs: {
      flexDirection: 'row' as const,
      gap: theme.spacing.s,
      marginTop: theme.spacing.m,
    },
    statusTab: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
    requestHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.m,
      marginBottom: theme.spacing.m,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: theme.colors.text,
    },
    userEmail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    requestMeta: {
      flexDirection: 'row' as const,
      gap: theme.spacing.m,
      marginBottom: theme.spacing.m,
    },
    metaItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.xs,
    },
    metaText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    message: {
      padding: theme.spacing.m,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.m,
      marginBottom: theme.spacing.m,
    },
    messageText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    reviewSection: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.m,
    },
    reviewNote: {
      marginBottom: theme.spacing.s,
    },
    reviewActions: {
      flexDirection: 'row' as const,
      gap: theme.spacing.s,
    },
    reviewedInfo: {
      padding: theme.spacing.m,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.m,
    },
    reviewedText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <Input
            style={styles.searchInput}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<SearchIcon size={20} color={theme.colors.textSecondary} />}
          />
        </View>

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
          {reviewRequest.error && (
            <Alert
              variant="danger"
              title="Error"
              message={reviewRequest.error.message}
              style={{ marginBottom: theme.spacing.m }}
            />
          )}

          {data?.requests.length === 0 ? (
            <View style={styles.emptyState}>
              <User size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>
                No join requests found.
              </Text>
            </View>
          ) : (
            data?.requests.map((request) => (
              <Card key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Avatar
                    src={request.user.image}
                    name={request.user.name}
                    size="medium"
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{request.user.name}</Text>
                    <Text style={styles.userEmail}>{request.user.email}</Text>
                  </View>
                  {getStatusBadge(request.status)}
                </View>

                <View style={styles.requestMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaText}>
                      Requested: {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Badge variant="secondary">{request.requestedRole}</Badge>
                  </View>
                  {request.autoApproved && (
                    <Badge variant="info">Auto-approved</Badge>
                  )}
                </View>

                {request.message && (
                  <View style={styles.message}>
                    <Text style={styles.messageText}>{request.message}</Text>
                  </View>
                )}

                {request.status === 'pending' ? (
                  <View style={styles.reviewSection}>
                    <Input
                      style={styles.reviewNote}
                      placeholder="Add a note (optional)..."
                      value={reviewNote[request.id] || ''}
                      onChangeText={(text) => setReviewNote({
                        ...reviewNote,
                        [request.id]: text,
                      })}
                    />
                    <View style={styles.reviewActions}>
                      <Button
                        variant="danger"
                        onPress={() => handleReview(request.id, 'reject')}
                        style={{ flex: 1 }}
                        loading={reviewRequest.isLoading}
                        leftIcon={<X size={16} />}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="success"
                        onPress={() => handleReview(request.id, 'approve')}
                        style={{ flex: 1 }}
                        loading={reviewRequest.isLoading}
                        leftIcon={<Check size={16} />}
                      >
                        Approve
                      </Button>
                    </View>
                  </View>
                ) : (
                  <>
                    {request.reviewedBy && (
                      <View style={styles.reviewedInfo}>
                        <Text style={styles.reviewedText}>
                          {request.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                          {request.reviewedBy.name} {request.reviewedAt && 
                            formatDistanceToNow(new Date(request.reviewedAt), { addSuffix: true })
                          }
                        </Text>
                        {request.reviewNote && (
                          <Text style={[styles.reviewedText, { marginTop: theme.spacing.xs }]}>
                            Note: {request.reviewNote}
                          </Text>
                        )}
                      </View>
                    )}
                  </>
                )}
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}