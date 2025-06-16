import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useTheme } from '@/lib/theme/provider';
import { api } from '@/lib/api/trpc';
import { Text } from '@/components/universal/typography/Text';
import { Input } from '@/components/universal/form/Input';
import { Button } from '@/components/universal/interaction/Button';
import { Card } from '@/components/universal/display/Card';
import { Badge } from '@/components/universal/display/Badge';
import { Box } from '@/components/universal/layout/Box';
import { Alert } from '@/components/universal/feedback/Alert';
import { SearchIcon, Building2, Users, Send } from '@/components/universal/display/Symbols';
import { JoinRequestForm } from '@/components/blocks/organization/JoinRequestForm';
// Define types locally
type OrganizationType = 'business' | 'nonprofit' | 'education' | 'personal';
type OrganizationSize = 'solo' | 'small' | 'medium' | 'large' | 'enterprise';

export default function BrowseOrganizationsScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<OrganizationType | undefined>();
  const [selectedSize, setSelectedSize] = useState<OrganizationSize | undefined>();
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string } | null>(null);
  
  const { data, isLoading, refetch } = api.organization.searchOrganizations.useQuery({
    query: searchQuery || undefined,
    type: selectedType,
    size: selectedSize,
    limit: 20,
  });

  const handleSearch = () => {
    refetch();
  };

  const handleJoinRequest = (org: { id: string; name: string }) => {
    setSelectedOrg(org);
  };

  const getStatusBadge = (org: any) => {
    if (org.isMember) {
      return <Badge variant="success">Member</Badge>;
    }
    if (org.joinRequestStatus === 'pending') {
      return <Badge variant="warning">Pending</Badge>;
    }
    if (org.joinRequestStatus === 'rejected') {
      return <Badge variant="danger">Rejected</Badge>;
    }
    return null;
  };

  const styles = {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    searchSection: {
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
    filtersRow: {
      flexDirection: 'row' as const,
      gap: theme.spacing.s,
      marginTop: theme.spacing.m,
      flexWrap: 'wrap' as const,
    },
    filterChip: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    filterChipTextActive: {
      color: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.m,
    },
    orgCard: {
      marginBottom: theme.spacing.m,
    },
    orgHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: theme.spacing.s,
    },
    orgInfo: {
      flex: 1,
      marginRight: theme.spacing.m,
    },
    orgName: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    orgMeta: {
      flexDirection: 'row' as const,
      gap: theme.spacing.s,
      marginTop: theme.spacing.xs,
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
    orgDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.s,
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

  const organizationTypes: { value: OrganizationType; label: string }[] = [
    { value: 'business', label: 'Business' },
    { value: 'nonprofit', label: 'Non-profit' },
    { value: 'education', label: 'Education' },
    { value: 'personal', label: 'Personal' },
  ];

  const organizationSizes: { value: OrganizationSize; label: string }[] = [
    { value: 'solo', label: 'Solo' },
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'enterprise', label: 'Enterprise' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Browse Organizations',
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
        }}
      />

      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <Input
            style={styles.searchInput}
            placeholder="Search organizations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            leftIcon={<SearchIcon size={20} color={theme.colors.textSecondary} />}
          />
          <Button onPress={handleSearch} variant="primary">
            Search
          </Button>
        </View>

        <View style={styles.filtersRow}>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
            Type:
          </Text>
          {organizationTypes.map((type) => (
            <Button
              key={type.value}
              onPress={() => setSelectedType(
                selectedType === type.value ? undefined : type.value
              )}
              style={[
                styles.filterChip,
                selectedType === type.value && styles.filterChipActive,
              ]}
            >
              <Text style={[
                styles.filterChipText,
                selectedType === type.value && styles.filterChipTextActive,
              ]}>
                {type.label}
              </Text>
            </Button>
          ))}
        </View>

        <View style={styles.filtersRow}>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
            Size:
          </Text>
          {organizationSizes.map((size) => (
            <Button
              key={size.value}
              onPress={() => setSelectedSize(
                selectedSize === size.value ? undefined : size.value
              )}
              style={[
                styles.filterChip,
                selectedSize === size.value && styles.filterChipActive,
              ]}
            >
              <Text style={[
                styles.filterChipText,
                selectedSize === size.value && styles.filterChipTextActive,
              ]}>
                {size.label}
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
          {data?.organizations.length === 0 ? (
            <View style={styles.emptyState}>
              <Building2 size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>
                No organizations found.{'\n'}
                Try adjusting your search criteria.
              </Text>
            </View>
          ) : (
            <>
              {data?.organizations.map((org) => (
                <Card key={org.id} style={styles.orgCard}>
                  <View style={styles.orgHeader}>
                    <View style={styles.orgInfo}>
                      <Text style={styles.orgName}>{org.name}</Text>
                      <View style={styles.orgMeta}>
                        <Badge variant="secondary">{org.type}</Badge>
                        <View style={styles.metaItem}>
                          <Users size={14} color={theme.colors.textSecondary} />
                          <Text style={styles.metaText}>
                            {org.memberCount} members
                          </Text>
                        </View>
                      </View>
                    </View>
                    {getStatusBadge(org)}
                  </View>

                  {org.description && (
                    <Text style={styles.orgDescription}>
                      {org.description}
                    </Text>
                  )}

                  {!org.isMember && !org.joinRequestStatus && (
                    <Box marginTop="m">
                      <Button
                        variant="primary"
                        onPress={() => handleJoinRequest({ id: org.id, name: org.name })}
                        leftIcon={<Send size={16} color={theme.colors.background} />}
                      >
                        Send Join Request
                      </Button>
                    </Box>
                  )}
                </Card>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {selectedOrg && (
        <JoinRequestForm
          organizationId={selectedOrg.id}
          organizationName={selectedOrg.name}
          visible={!!selectedOrg}
          onClose={() => setSelectedOrg(null)}
          onSuccess={() => {
            refetch();
            setSelectedOrg(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}