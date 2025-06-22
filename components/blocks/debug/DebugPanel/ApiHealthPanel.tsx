import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useQueryClient, useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Text } from '@/components/universal/typography';
import { VStack, HStack, Box } from '@/components/universal/layout';
import { Badge, Card, Symbol } from '@/components/universal/display';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Progress } from '@/components/universal/feedback';
import { useTheme } from '@/lib/theme/provider';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface ApiEndpointHealth {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'idle';
  successRate: number;
  avgResponseTime: number;
  lastError?: string;
  lastSuccess?: Date;
  totalCalls: number;
  failedCalls: number;
}

export function ApiHealthPanel() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const { spacing } = useSpacing();
  const theme = useTheme();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  // Get all queries and mutations from cache
  const queries = queryClient.getQueryCache().getAll();
  const mutations = queryClient.getMutationCache().getAll();

  // Calculate API health metrics
  const apiHealthMetrics = useMemo(() => {
    const endpointMap = new Map<string, ApiEndpointHealth>();

    // Process queries
    queries.forEach(query => {
      const key = Array.isArray(query.queryKey) ? query.queryKey[0] : 'unknown';
      const keyStr = typeof key === 'object' ? JSON.stringify(key) : String(key);
      
      if (!endpointMap.has(keyStr)) {
        endpointMap.set(keyStr, {
          name: keyStr,
          status: 'idle',
          successRate: 0,
          avgResponseTime: 0,
          totalCalls: 0,
          failedCalls: 0,
        });
      }

      const endpoint = endpointMap.get(keyStr)!;
      endpoint.totalCalls = query.state.dataUpdateCount + query.state.errorUpdateCount;
      endpoint.failedCalls = query.state.errorUpdateCount;
      
      if (query.state.error) {
        endpoint.status = 'error';
        endpoint.lastError = String(query.state.error);
      } else if (query.state.status === 'success') {
        endpoint.status = 'healthy';
        endpoint.lastSuccess = query.state.dataUpdatedAt ? new Date(query.state.dataUpdatedAt) : undefined;
      } else if (query.state.status === 'pending') {
        endpoint.status = 'warning';
      }

      // Calculate success rate
      if (endpoint.totalCalls > 0) {
        endpoint.successRate = ((endpoint.totalCalls - endpoint.failedCalls) / endpoint.totalCalls) * 100;
      }
    });

    // Process mutations
    mutations.forEach(mutation => {
      const key = mutation.options.mutationKey ? 
        (Array.isArray(mutation.options.mutationKey) ? mutation.options.mutationKey[0] : String(mutation.options.mutationKey)) : 
        'mutation';
      
      if (!endpointMap.has(key)) {
        endpointMap.set(key, {
          name: key,
          status: 'idle',
          successRate: 0,
          avgResponseTime: 0,
          totalCalls: 0,
          failedCalls: 0,
        });
      }

      const endpoint = endpointMap.get(key)!;
      
      if (mutation.state.status === 'error') {
        endpoint.status = 'error';
        endpoint.failedCalls++;
        endpoint.lastError = mutation.state.error ? String(mutation.state.error) : 'Unknown error';
      } else if (mutation.state.status === 'success') {
        endpoint.lastSuccess = new Date();
      } else if (mutation.state.status === 'pending') {
        endpoint.status = 'warning';
      }
    });

    return endpointMap;
  }, [queries, mutations]);

  // Group endpoints by category
  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, ApiEndpointHealth[]> = {
      healthcare: [],
      auth: [],
      organization: [],
      other: [],
    };

    apiHealthMetrics.forEach(endpoint => {
      const name = endpoint.name.toLowerCase();
      if (name.includes('healthcare') || name.includes('alert') || name.includes('patient') || name.includes('hospital')) {
        groups.healthcare.push(endpoint);
      } else if (name.includes('auth') || name.includes('session') || name.includes('user')) {
        groups.auth.push(endpoint);
      } else if (name.includes('organization')) {
        groups.organization.push(endpoint);
      } else {
        groups.other.push(endpoint);
      }
    });

    return groups;
  }, [apiHealthMetrics]);

  // Calculate overall health
  const overallHealth = useMemo(() => {
    const endpoints = Array.from(apiHealthMetrics.values());
    const totalEndpoints = endpoints.length;
    const healthyEndpoints = endpoints.filter(e => e.status === 'healthy').length;
    const errorEndpoints = endpoints.filter(e => e.status === 'error').length;
    const warningEndpoints = endpoints.filter(e => e.status === 'warning').length;
    
    const totalCalls = endpoints.reduce((sum, e) => sum + e.totalCalls, 0);
    const failedCalls = endpoints.reduce((sum, e) => sum + e.failedCalls, 0);
    const successRate = totalCalls > 0 ? ((totalCalls - failedCalls) / totalCalls) * 100 : 100;

    return {
      totalEndpoints,
      healthyEndpoints,
      errorEndpoints,
      warningEndpoints,
      successRate,
      activeFetches: isFetching,
      activeMutations: isMutating,
    };
  }, [apiHealthMetrics, isFetching, isMutating]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Symbol name="checkmark.circle" size={16} color="#10b981" />;
      case 'error':
        return <Symbol name="exclamationmark.circle" size={16} color="#ef4444" />;
      case 'warning':
        return <Symbol name="clock" size={16} color="#f59e0b" />;
      default:
        return <Symbol name="waveform.path.ecg" size={16} color={theme.mutedForeground} />;
    }
  };

  const getHealthColor = (rate: number) => {
    if (rate >= 95) return 'success';
    if (rate >= 80) return 'warning';
    return 'error';
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <VStack gap={spacing[3] as any}>
        {/* Overview Section */}
        <Card className="p-4">
          <TouchableOpacity onPress={() => toggleSection('overview')}>
            <HStack justify="between" align="center">
              <HStack gap={spacing[2] as any} align="center">
                <Symbol name="waveform.path.ecg" size={20} color={theme.primary} />
                <Text size="lg" weight="semibold">API Health Overview</Text>
              </HStack>
              <View style={{ transform: [{ rotate: expandedSections.has('overview') ? '0deg' : '-90deg' }] }}>
                <Symbol name="chevron.down" size={20} color={theme.mutedForeground} />
              </View>
            </HStack>
          </TouchableOpacity>

          {expandedSections.has('overview') && (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <VStack gap={spacing[3] as any} className="mt-4">
                {/* Health Score */}
                <VStack gap={spacing[2] as any}>
                  <HStack justify="between">
                    <Text size="sm" colorTheme="mutedForeground">Overall Health</Text>
                    <Text size="sm" weight="semibold">{overallHealth.successRate.toFixed(1)}%</Text>
                  </HStack>
                  <Progress 
                    value={overallHealth.successRate} 
                    size="sm" 
                    variant={getHealthColor(overallHealth.successRate)} 
                  />
                </VStack>

                {/* Stats Grid */}
                <HStack gap={spacing[2] as any} className="flex-wrap">
                  <Box className="flex-1 min-w-[80px]">
                    <Card className="p-3 bg-muted/50">
                      <VStack gap={spacing[1] as any} align="center">
                        <Symbol name="checkmark.circle" size={20} color="#10b981" />
                        <Text size="xl" weight="bold">{overallHealth.healthyEndpoints}</Text>
                        <Text size="xs" colorTheme="mutedForeground">Healthy</Text>
                      </VStack>
                    </Card>
                  </Box>

                  <Box className="flex-1 min-w-[80px]">
                    <Card className="p-3 bg-muted/50">
                      <VStack gap={spacing[1] as any} align="center">
                        <Symbol name="exclamationmark.circle" size={20} color="#ef4444" />
                        <Text size="xl" weight="bold">{overallHealth.errorEndpoints}</Text>
                        <Text size="xs" colorTheme="mutedForeground">Errors</Text>
                      </VStack>
                    </Card>
                  </Box>

                  <Box className="flex-1 min-w-[80px]">
                    <Card className="p-3 bg-muted/50">
                      <VStack gap={spacing[1] as any} align="center">
                        <Symbol name="arrow.clockwise" size={20} color={theme.primary} />
                        <Text size="xl" weight="bold">{overallHealth.activeFetches}</Text>
                        <Text size="xs" colorTheme="mutedForeground">Active</Text>
                      </VStack>
                    </Card>
                  </Box>
                </HStack>
              </VStack>
            </Animated.View>
          )}
        </Card>

        {/* Healthcare APIs */}
        {groupedEndpoints.healthcare.length > 0 && (
          <Card className="p-4">
            <TouchableOpacity onPress={() => toggleSection('healthcare')}>
              <HStack justify="between" align="center">
                <HStack gap={spacing[2] as any} align="center">
                  <Symbol name="externaldrive" size={20} color="#ef4444" />
                  <Text size="lg" weight="semibold">Healthcare APIs</Text>
                  <Badge size="sm" variant="destructive"><Text>{groupedEndpoints.healthcare.length}</Text></Badge>
                </HStack>
                <View style={{ transform: [{ rotate: expandedSections.has('healthcare') ? '0deg' : '-90deg' }] }}>
                  <Symbol name="chevron.down" size={20} color={theme.mutedForeground} />
                </View>
              </HStack>
            </TouchableOpacity>

            {expandedSections.has('healthcare') && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <VStack gap={spacing[2] as any} className="mt-3">
                  {groupedEndpoints.healthcare.map((endpoint, idx) => (
                    <Card key={idx} className="p-3 bg-muted/30">
                      <VStack gap={spacing[2] as any}>
                        <HStack justify="between" align="center">
                          <HStack gap={spacing[2] as any} align="center">
                            {getStatusIcon(endpoint.status)}
                            <Text size="sm" weight="medium" numberOfLines={1} className="flex-1">
                              {endpoint.name.replace(/[\[\]"{}]/g, '')}
                            </Text>
                          </HStack>
                          <Badge 
                            size="xs" 
                            variant={endpoint.status === 'healthy' ? 'success' : endpoint.status === 'error' ? 'error' : 'warning'}
                          >
                            {endpoint.successRate.toFixed(0)}%
                          </Badge>
                        </HStack>

                        {endpoint.lastError && (
                          <Text size="xs" className="text-destructive" numberOfLines={2}>
                            {endpoint.lastError}
                          </Text>
                        )}

                        <HStack gap={spacing[3] as any}>
                          <Text size="xs" colorTheme="mutedForeground">
                            Calls: {endpoint.totalCalls}
                          </Text>
                          {endpoint.failedCalls > 0 && (
                            <Text size="xs" className="text-destructive">
                              Failed: {endpoint.failedCalls}
                            </Text>
                          )}
                          {endpoint.lastSuccess && (
                            <Text size="xs" colorTheme="mutedForeground">
                              Last: {new Date(endpoint.lastSuccess).toLocaleTimeString()}
                            </Text>
                          )}
                        </HStack>
                      </VStack>
                    </Card>
                  ))}
                </VStack>
              </Animated.View>
            )}
          </Card>
        )}

        {/* Other API Groups */}
        {Object.entries(groupedEndpoints).map(([group, endpoints]) => {
          if (group === 'healthcare' || endpoints.length === 0) return null;
          
          return (
            <Card key={group} className="p-4">
              <TouchableOpacity onPress={() => toggleSection(group)}>
                <HStack justify="between" align="center">
                  <HStack gap={spacing[2] as any} align="center">
                    <Symbol name="externaldrive" size={20} color={theme.primary} />
                    <Text size="lg" weight="semibold" className="capitalize">{group} APIs</Text>
                    <Badge size="sm" variant="outline"><Text>{endpoints.length}</Text></Badge>
                  </HStack>
                  <View style={{ transform: [{ rotate: expandedSections.has(group) ? '0deg' : '-90deg' }] }}>
                    <Symbol name="chevron.down" size={20} color={theme.mutedForeground} />
                  </View>
                </HStack>
              </TouchableOpacity>

              {expandedSections.has(group) && (
                <Animated.View entering={FadeIn} exiting={FadeOut}>
                  <VStack gap={spacing[2] as any} className="mt-3">
                    {endpoints.map((endpoint, idx) => (
                      <Card key={idx} className="p-3 bg-muted/30">
                        <HStack justify="between" align="center">
                          <HStack gap={spacing[2] as any} align="center" className="flex-1">
                            {getStatusIcon(endpoint.status)}
                            <Text size="sm" numberOfLines={1} className="flex-1">
                              {endpoint.name.replace(/[\[\]"{}]/g, '')}
                            </Text>
                          </HStack>
                          <Badge 
                            size="xs" 
                            variant={endpoint.status === 'healthy' ? 'outline' : endpoint.status === 'error' ? 'error' : 'warning'}
                          >
                            <Text>{endpoint.totalCalls} calls</Text>
                          </Badge>
                        </HStack>
                      </Card>
                    ))}
                  </VStack>
                </Animated.View>
              )}
            </Card>
          );
        })}
      </VStack>
    </ScrollView>
  );
}