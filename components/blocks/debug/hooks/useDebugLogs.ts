import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { debugLog, type DebugLog, type LogLevel } from '../utils/logger';
import { webSocketLogger, type WebSocketLog } from '../utils/websocket-logger';

interface DebugLogsData {
  logs: DebugLog[];
  errorCount: number;
  logCounts: {
    error: number;
    warn: number;
    info: number;
    debug: number;
  };
}

export function useDebugLogs() {
  const queryClient = useQueryClient();

  // Main query for debug logs
  const { data, refetch } = useQuery<DebugLogsData>({
    queryKey: ['debug-logs'],
    queryFn: () => {
      const logs = debugLog.getLogs();
      const errorCount = debugLog.getErrorCount();
      const logCounts = {
        error: logs.filter(l => l.level === 'error').length,
        warn: logs.filter(l => l.level === 'warn').length,
        info: logs.filter(l => l.level === 'info').length,
        debug: logs.filter(l => l.level === 'debug').length,
      };
      
      return { logs, errorCount, logCounts };
    },
    staleTime: 0, // Always fresh
    refetchInterval: false, // We'll use manual updates
  });

  // Subscribe to log updates
  useEffect(() => {
    const unsubscribe = debugLog.subscribe(() => {
      // Invalidate the query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['debug-logs'] });
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [queryClient]);

  const clearLogs = useCallback(() => {
    debugLog.clear();
    queryClient.invalidateQueries({ queryKey: ['debug-logs'] });
  }, [queryClient]);

  return {
    logs: data?.logs || [],
    errorCount: data?.errorCount || 0,
    logCounts: data?.logCounts || { error: 0, warn: 0, info: 0, debug: 0 },
    clearLogs,
    refetch,
  };
}

export function useWebSocketLogs(enabled: boolean) {
  const queryClient = useQueryClient();

  const { data: wsLogs = [] } = useQuery<WebSocketLog[]>({
    queryKey: ['websocket-logs'],
    queryFn: () => webSocketLogger.getLogs(),
    enabled,
    refetchInterval: enabled ? 1000 : false, // Update every second when enabled
    staleTime: 0,
  });

  const clearWebSocketLogs = useCallback(() => {
    webSocketLogger.clear();
    queryClient.invalidateQueries({ queryKey: ['websocket-logs'] });
  }, [queryClient]);

  return {
    wsLogs,
    clearWebSocketLogs,
  };
}

export function useFilteredLogs(logs: DebugLog[], logFilter: LogLevel, searchQuery: string) {
  return useQuery({
    queryKey: ['filtered-logs', logs.length, logFilter, searchQuery],
    queryFn: () => {
      const searchLower = searchQuery.toLowerCase();
      const levelPriority = { error: 0, warn: 1, info: 2, debug: 3 };
      const filterPriority = levelPriority[logFilter];
      
      return logs.filter(log => {
        const logPriority = levelPriority[log.level];
        const matchesFilter = logPriority <= filterPriority;
        if (!matchesFilter) return false;
        
        if (!searchLower) return true;
        
        const matchesSearch = 
          log.message.toLowerCase().includes(searchLower) ||
          (log.source && log.source.toLowerCase().includes(searchLower)) ||
          (log.data && JSON.stringify(log.data).toLowerCase().includes(searchLower));
        return matchesSearch;
      });
    },
    staleTime: 0,
    gcTime: 0, // Don't cache filtered results
  });
}