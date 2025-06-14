import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useQueryClient, useIsFetching, useIsMutating } from '@tanstack/react-query';
import { showSuccessAlert } from '@/lib/core/alert';
import * as Clipboard from 'expo-clipboard';
import { Text, VStack, HStack, Badge, Card } from '@/components/universal';
import { ChevronRight, RefreshCw, Trash2, Database } from '@/components/universal/display/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
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
  const [expandedQueries, setExpandedQueries] = useState<Set<string>>(new Set());

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
            <Text size="lg" weight="semibold">TanStack Query</Text>
            <HStack gap={spacing[2] as any}>
              <HStack align="center" gap={spacing[1] as any}>
                <Database size={14} className="text-muted-foreground" />
                <Text size="xs" colorTheme="mutedForeground">
                  {queries.length} queries
                </Text>
              </HStack>
              {isFetching > 0 && (
                <Badge size="xs" variant="secondary">
                  {isFetching} fetching
                </Badge>
              )}
              {isMutating > 0 && (
                <Badge size="xs" variant="secondary">
                  {isMutating} mutating
                </Badge>
              )}
            </HStack>
          </VStack>
          
          <HStack gap={spacing[1] as any}>
            <TouchableOpacity onPress={copyAllQueries} className="p-2">
              <Text>📋</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={refetchAll} className="p-2">
              <RefreshCw size={16} className="text-muted-foreground" />
            </TouchableOpacity>
            <TouchableOpacity onPress={clearCache} className="p-2">
              <Trash2 size={16} className="text-muted-foreground" />
            </TouchableOpacity>
          </HStack>
        </HStack>
        
        {Object.entries(groupedQueries).length === 0 ? (
          <View className="py-8 items-center">
            <Database size={32} className="text-muted-foreground mb-2" />
            <Text size="sm" colorTheme="mutedForeground">No queries in cache</Text>
          </View>
        ) : (
          <ScrollView className="max-h-96">
            <VStack gap={spacing[2] as any}>
              {Object.entries(groupedQueries).map(([groupKey, groupQueries]) => {
                const isExpanded = expandedQueries.has(groupKey);
                
                return (
                  <AnimatedView key={groupKey} entering={FadeIn}>
                    <Card className="p-3 bg-muted/50">
                      <TouchableOpacity onPress={() => toggleExpanded(groupKey)}>
                        <HStack align="center" gap={spacing[2] as any}>
                          <View style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}>
                            <ChevronRight size={16} className="text-muted-foreground" />
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
                                      {query.state.status}
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
            </VStack>
          </ScrollView>
        )}
        
        {mutations.length > 0 && (
          <>
            <View className="border-t border-border pt-3 mt-2" />
            <VStack gap={spacing[2] as any}>
              <Text size="sm" weight="semibold">Active Mutations ({mutations.length})</Text>
              {mutations.map((mutation, idx) => (
                <View key={idx} className="pl-4">
                  <HStack gap={spacing[2] as any}>
                    <Badge size="xs" variant={getStatusBadgeVariant(mutation.state.status)}>
                      {mutation.state.status}
                    </Badge>
                    <Text size="xs" colorTheme="mutedForeground" numberOfLines={1}>
                      {mutation.options.mutationKey ? JSON.stringify(mutation.options.mutationKey) : 'Anonymous'}
                    </Text>
                  </HStack>
                </View>
              ))}
            </VStack>
          </>
        )}
      </VStack>
    </Card>
  );
}