import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useQueryClient, useIsFetching, useIsMutating } from '@tanstack/react-query';
import { showSuccessAlert } from '@/lib/core/alert';
import * as Clipboard from 'expo-clipboard';
import { Text } from '@/components/universal/typography';
import { VStack, HStack } from '@/components/universal/layout';
import { Badge, Card, Symbol } from '@/components/universal/display';
import { Button } from '@/components/universal/interaction';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { ApiHealthPanel } from './ApiHealthPanel';
import Animated, { FadeIn } from 'react-native-reanimated';

interface QueryInfo {
  queryKey: any[];
  state: {
    status: string;
    fetchStatus: string;
    dataUpdateCount: number;
    errorUpdateCount: number;
    data?: any;
    error?: any;
  };
}

const AnimatedView = Animated.View;

export function TanStackDebugInfo() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const { spacing } = useSpacing();
  const theme = useTheme();
  const [expandedQueries, setExpandedQueries] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'health' | 'queries' | 'mutations' | 'cache'>('health');

  // Get all queries from the cache
  const queries = queryClient.getQueryCache().getAll();
  const mutations = queryClient.getMutationCache().getAll();

  // Group queries by their first key (usually the tRPC route)
  const groupedQueries = queries.reduce((acc, query) => {
    const key = Array.isArray(query.queryKey) ? query.queryKey[0] : 'unknown';
    const keyStr = typeof key === 'object' ? JSON.stringify(key) : String(key);
    
    if (!acc[keyStr]) {
      acc[keyStr] = [];
    }
    
    acc[keyStr].push({
      queryKey: [...query.queryKey],
      state: {
        status: query.state.status,
        fetchStatus: query.state.fetchStatus,
        dataUpdateCount: query.state.dataUpdateCount,
        errorUpdateCount: query.state.errorUpdateCount,
        data: query.state.data,
        error: query.state.error,
      }
    });
    
    return acc;
  }, {} as Record<string, QueryInfo[]>);
  
  // Separate healthcare queries for highlighting
  const healthcareQueries = Object.entries(groupedQueries).filter(([key]) => 
    key.includes('healthcare') || key.includes('alert') || key.includes('patient')
  );
  const otherQueries = Object.entries(groupedQueries).filter(([key]) => 
    !key.includes('healthcare') && !key.includes('alert') && !key.includes('patient')
  );


  const clearCache = () => {
    queryClient.clear();
  };

  const refetchAll = () => {
    queryClient.refetchQueries();
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        await Clipboard.setStringAsync(text);
      }
      showSuccessAlert('Copied!', `${label} copied to clipboard`);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAllQueries = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      summary: {
        activeFetches: isFetching,
        activeMutations: isMutating,
        totalQueries: queries.length,
        totalMutations: mutations.length,
      },
      queries: groupedQueries,
      mutations: mutations.map(m => ({
        key: m.options.mutationKey,
        status: m.state.status,
        error: m.state.error,
      })),
    };
    copyToClipboard(JSON.stringify(debugInfo, null, 2), 'Query Debug Info');
  };

  const copyQueryData = (query: QueryInfo) => {
    const data = {
      queryKey: query.queryKey,
      state: query.state,
    };
    copyToClipboard(JSON.stringify(data, null, 2), 'Query Data');
  };

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedQueries);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedQueries(newExpanded);
  };


  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success': return 'success' as const;
      case 'error': return 'error' as const;
      case 'pending': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <Card className="p-4 animate-fade-in">
      <VStack gap={spacing[3] as any}>
        <HStack justify="between" align="center">
          <VStack gap={spacing[1] as any}>
            <Text size="lg" weight="semibold">API Debug (TanStack Query)</Text>
            <HStack gap={spacing[2] as any}>
              <HStack align="center" gap={spacing[1] as any}>
                <Symbol name="externaldrive" size={14} color={theme.mutedForeground} />
                <Text size="xs" colorTheme="mutedForeground">
                  {queries.length} queries • {mutations.length} mutations
                </Text>
              </HStack>
              {isFetching > 0 && (
                <Badge size="xs" variant="secondary" animateOnChange={false}>
                  <Text>{isFetching} fetching</Text>
                </Badge>
              )}
              {isMutating > 0 && (
                <Badge size="xs" variant="secondary" animateOnChange={false}>
                  <Text>{isMutating} mutating</Text>
                </Badge>
              )}
            </HStack>
          </VStack>
          
          <HStack gap={spacing[1] as any}>
            <TouchableOpacity onPress={copyAllQueries} className="p-2">
              <Text>📋</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={refetchAll} className="p-2">
              <Symbol name="arrow.clockwise" size={16} color={theme.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={clearCache} className="p-2">
              <Symbol name="trash" size={16} color={theme.mutedForeground} />
            </TouchableOpacity>
          </HStack>
        </HStack>
        
        {/* Tab Navigation */}
        <HStack gap={spacing[1] as any} className="border-b border-border pb-2">
          <TouchableOpacity
            onPress={() => setActiveTab('health')}
            className={`px-3 py-1 rounded-t ${activeTab === 'health' ? 'bg-primary/10 border-b-2 border-primary' : ''}`}
          >
            <Text size="sm" weight={activeTab === 'health' ? 'semibold' : 'normal'}>
              Health
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('queries')}
            className={`px-3 py-1 rounded-t ${activeTab === 'queries' ? 'bg-primary/10 border-b-2 border-primary' : ''}`}
          >
            <Text size="sm" weight={activeTab === 'queries' ? 'semibold' : 'normal'}>
              Queries ({queries.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('mutations')}
            className={`px-3 py-1 rounded-t ${activeTab === 'mutations' ? 'bg-primary/10 border-b-2 border-primary' : ''}`}
          >
            <Text size="sm" weight={activeTab === 'mutations' ? 'semibold' : 'normal'}>
              Mutations ({mutations.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('cache')}
            className={`px-3 py-1 rounded-t ${activeTab === 'cache' ? 'bg-primary/10 border-b-2 border-primary' : ''}`}
          >
            <Text size="sm" weight={activeTab === 'cache' ? 'semibold' : 'normal'}>
              Cache
            </Text>
          </TouchableOpacity>
        </HStack>
        
        {/* Health Tab */}
        {activeTab === 'health' && (
          <ApiHealthPanel />
        )}
        
        {/* Queries Tab */}
        {activeTab === 'queries' && (Object.entries(groupedQueries).length === 0 ? (
          <View className="py-8 items-center">
            <Symbol name="externaldrive" size={32} color={theme.mutedForeground} style={{ marginBottom: 8 }} />
            <Text size="sm" colorTheme="mutedForeground">No queries in cache</Text>
          </View>
        ) : (
          <ScrollView className="max-h-96">
            <VStack gap={spacing[2] as any}>
              {/* Healthcare Queries Section */}
              {healthcareQueries.length > 0 && (
                <>
                  <Text size="sm" weight="semibold" colorTheme="primary" className="mb-2">🏽 Healthcare API</Text>
                  {healthcareQueries.map(([groupKey, groupQueries]) => {
                const isExpanded = expandedQueries.has(groupKey);
                
                return (
                  <AnimatedView key={groupKey} entering={FadeIn}>
                    <Card className="p-3 bg-muted/50">
                      <TouchableOpacity onPress={() => toggleExpanded(groupKey)}>
                        <HStack align="center" gap={spacing[2] as any}>
                          <View style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}>
                            <Symbol name="chevron.right" size={16} color={theme.mutedForeground} />
                          </View>
                          <View className="flex-1">
                            <Text size="sm" weight="semibold" numberOfLines={1}>
                              {groupKey}
                            </Text>
                            <Text size="xs" colorTheme="mutedForeground">
                              {groupQueries.length} {groupQueries.length === 1 ? 'query' : 'queries'}
                            </Text>
                          </View>
                        </HStack>
                      </TouchableOpacity>
                      
                      {isExpanded && (
                        <VStack gap={spacing[2] as any} className="mt-3 pt-3 border-t border-border">
                          {groupQueries.map((query, idx) => (
                            <View key={idx} className="pl-4">
                              <HStack justify="between" align="start">
                                <VStack gap={spacing[1] as any} className="flex-1">
                                  <HStack gap={spacing[1] as any}>
                                    <Badge size="xs" variant={getStatusBadgeVariant(query.state.status)}>
                                      <Text>{query.state.status}</Text>
                                    </Badge>
                                    <Text size="xs" colorTheme="mutedForeground">
                                      Updates: {query.state.dataUpdateCount}
                                    </Text>
                                  </HStack>
                                  
                                  <Text 
                                    size="xs" 
                                    colorTheme="mutedForeground"
                                    numberOfLines={2}
                                    style={{ fontFamily: 'monospace' }}
                                  >
                                    {JSON.stringify(query.queryKey.slice(1), null, 2)}
                                  </Text>
                                  
                                  {query.state.error && (
                                    <Text size="xs" className="text-destructive">
                                      Error: {String(query.state.error)}
                                    </Text>
                                  )}
                                </VStack>
                                
                                <TouchableOpacity
                                  onPress={() => copyQueryData(query)}
                                  className="p-1"
                                >
                                  <Text size="xs">📋</Text>
                                </TouchableOpacity>
                              </HStack>
                            </View>
                          ))}
                        </VStack>
                      )}
                    </Card>
                  </AnimatedView>
                );
              })}
                </>
              )}
              
              {/* Other Queries Section */}
              {otherQueries.length > 0 && (
                <>
                  {healthcareQueries.length > 0 && <View className="my-2 border-b border-border" />}
                  <Text size="sm" weight="semibold" colorTheme="mutedForeground" className="mb-2">🌐 Other API</Text>
                  {otherQueries.map(([groupKey, groupQueries]) => {
                    const isExpanded = expandedQueries.has(groupKey);
                    
                    return (
                      <AnimatedView key={groupKey} entering={FadeIn}>
                        <Card className="p-3 bg-muted/50">
                          <TouchableOpacity onPress={() => toggleExpanded(groupKey)}>
                            <HStack align="center" gap={spacing[2] as any}>
                              <View style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}>
                                <Symbol name="chevron.right" size={16} color={theme.mutedForeground} />
                              </View>
                              <View className="flex-1">
                                <Text size="sm" weight="semibold" numberOfLines={1}>
                                  {groupKey}
                                </Text>
                                <Text size="xs" colorTheme="mutedForeground">
                                  {groupQueries.length} {groupQueries.length === 1 ? 'query' : 'queries'}
                                </Text>
                              </View>
                            </HStack>
                          </TouchableOpacity>
                          
                          {isExpanded && (
                            <VStack gap={spacing[2] as any} className="mt-3 pt-3 border-t border-border">
                              {groupQueries.map((query, idx) => (
                                <View key={idx} className="pl-4">
                                  <HStack justify="between" align="start">
                                    <VStack gap={spacing[1] as any} className="flex-1">
                                      <HStack gap={spacing[1] as any}>
                                        <Badge size="xs" variant={getStatusBadgeVariant(query.state.status)}>
                                          <Text>{query.state.status}</Text>
                                        </Badge>
                                        <Text size="xs" colorTheme="mutedForeground">
                                          Updates: {query.state.dataUpdateCount}
                                        </Text>
                                      </HStack>
                                      
                                      <Text 
                                        size="xs" 
                                        colorTheme="mutedForeground"
                                        numberOfLines={2}
                                        style={{ fontFamily: 'monospace' }}
                                      >
                                        {JSON.stringify(query.queryKey.slice(1), null, 2)}
                                      </Text>
                                      
                                      {query.state.error && (
                                        <Text size="xs" className="text-destructive">
                                          Error: {String(query.state.error)}
                                        </Text>
                                      )}
                                    </VStack>
                                    
                                    <TouchableOpacity
                                      onPress={() => copyQueryData(query)}
                                      className="p-1"
                                    >
                                      <Text size="xs">📋</Text>
                                    </TouchableOpacity>
                                  </HStack>
                                </View>
                              ))}
                            </VStack>
                          )}
                        </Card>
                      </AnimatedView>
                    );
                  })}
                </>
              )}
            </VStack>
          </ScrollView>
        ))}
        
        {/* Mutations Tab */}
        {activeTab === 'mutations' && (
          mutations.length === 0 ? (
            <View className="py-8 items-center">
              <Symbol name="externaldrive" size={32} color={theme.mutedForeground} style={{ marginBottom: 8 }} />
              <Text size="sm" colorTheme="mutedForeground">No mutations in progress</Text>
            </View>
          ) : (
            <ScrollView className="max-h-96">
              <VStack gap={spacing[2] as any}>
                {mutations.map((mutation, idx) => {
                  const mutationKey = mutation.options.mutationKey ? 
                    (Array.isArray(mutation.options.mutationKey) ? mutation.options.mutationKey[0] : String(mutation.options.mutationKey)) : 
                    'Anonymous';
                  
                  return (
                    <Card key={idx} className="p-3 bg-muted/50">
                      <VStack gap={spacing[2] as any}>
                        <HStack justify="between" align="start">
                          <VStack gap={spacing[1] as any} className="flex-1">
                            <HStack gap={spacing[2] as any}>
                              <Badge size="xs" variant={getStatusBadgeVariant(mutation.state.status)}>
                                <Text>{mutation.state.status}</Text>
                              </Badge>
                              <Text size="sm" weight="medium" numberOfLines={1}>
                                {mutationKey}
                              </Text>
                            </HStack>
                            
                            {mutation.state.error && (
                              <Text size="xs" className="text-destructive" numberOfLines={2}>
                                Error: {String(mutation.state.error)}
                              </Text>
                            )}
                            
                            {mutation.state.data && (
                              <Text size="xs" colorTheme="mutedForeground" numberOfLines={1}>
                                Response: {JSON.stringify(mutation.state.data).substring(0, 50)}...
                              </Text>
                            )}
                          </VStack>
                          
                          <TouchableOpacity
                            onPress={() => copyToClipboard(
                              JSON.stringify({
                                key: mutation.options.mutationKey,
                                status: mutation.state.status,
                                error: mutation.state.error,
                                data: mutation.state.data
                              }, null, 2),
                              'Mutation Data'
                            )}
                            className="p-1"
                          >
                            <Text size="xs">📋</Text>
                          </TouchableOpacity>
                        </HStack>
                      </VStack>
                    </Card>
                  );
                })}
              </VStack>
            </ScrollView>
          )
        )}
        
        {/* Cache Tab */}
        {activeTab === 'cache' && (
          <VStack gap={spacing[2] as any}>
            <HStack justify="between" align="center">
              <Text size="sm" colorTheme="mutedForeground">
                Total cache size: {queries.length} entries
              </Text>
              <Button
                size="xs"
                variant="outline"
                onPress={clearCache}
              >
                Clear All
              </Button>
            </HStack>
            
            <Card className="p-3 bg-muted/50">
              <VStack gap={spacing[2] as any}>
                <Text size="sm" weight="medium">Cache Statistics</Text>
                <HStack gap={spacing[4] as any}>
                  <VStack gap={spacing[1] as any}>
                    <Text size="xs" colorTheme="mutedForeground">Stale</Text>
                    <Text size="sm" weight="semibold">
                      {queries.filter(q => q.state.isInvalidated).length}
                    </Text>
                  </VStack>
                  <VStack gap={spacing[1] as any}>
                    <Text size="xs" colorTheme="mutedForeground">Fresh</Text>
                    <Text size="sm" weight="semibold">
                      {queries.filter(q => !q.state.isInvalidated && q.state.data).length}
                    </Text>
                  </VStack>
                  <VStack gap={spacing[1] as any}>
                    <Text size="xs" colorTheme="mutedForeground">Errors</Text>
                    <Text size="sm" weight="semibold">
                      {queries.filter(q => q.state.status === 'error').length}
                    </Text>
                  </VStack>
                </HStack>
              </VStack>
            </Card>
          </VStack>
        )}
      </VStack>
    </Card>
  );
}