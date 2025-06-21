import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { logger } from '@/lib/core/debug/unified-logger';
import { showErrorAlert } from '@/lib/core/alert';
import { useErrorDetection } from '@/hooks/useErrorDetection';
import { mobileStorage } from '@/lib/core/secure-storage';

interface ApiQueryOptions<TData> extends Omit<UseQueryOptions<TData, TRPCClientError<any>>, 'queryKey' | 'queryFn'> {
  // Custom options
  showErrorAlert?: boolean;
  cacheKey?: string;
  cacheDuration?: number; // in milliseconds
  offlineMode?: boolean;
  errorTitle?: string;
  errorMessage?: string;
  onError?: (error: TRPCClientError<any>) => void;
  onSuccess?: (data: TData) => void;
}

export type ApiQueryResult<TData> = UseQueryResult<TData, TRPCClientError<any>> & {
  isOffline: boolean;
  cachedData?: TData;
  refreshCache: () => Promise<void>;
};

/**
 * Enhanced TRPC query hook with error handling, caching, and offline support
 */
export function useApiQuery<TData>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: ApiQueryOptions<TData>
): ApiQueryResult<TData> {
  const { handleTRPCError, isOnline } = useErrorDetection();
  const {
    showErrorAlert: shouldShowAlert = true,
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    offlineMode = true,
    errorTitle = 'Error',
    errorMessage,
    onError,
    onSuccess,
    ...queryOptions
  } = options || {};

  // Generate cache key
  const fullCacheKey = cacheKey || `api_cache_${queryKey.join('_')}`;

  // Load cached data for mobile
  const loadCachedData = useCallback(async (): Promise<TData | null> => {
    if (Platform.OS === 'web' || !offlineMode) return null;

    try {
      const cached = mobileStorage.getItem(fullCacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < cacheDuration) {
          logger.debug('Using cached data', 'API', { 
            key: fullCacheKey, 
            age: Math.round(age / 1000) + 's' 
          });
          return data;
        }
      }
    } catch (error) {
      logger.error('Failed to load cached data', 'API', error);
    }
    return null;
  }, [fullCacheKey, cacheDuration, offlineMode]);

  // Save data to cache
  const saveCachedData = useCallback(async (data: TData) => {
    if (Platform.OS === 'web' || !offlineMode) return;

    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      mobileStorage.setItem(fullCacheKey, JSON.stringify(cacheData));
      logger.debug('Saved data to cache', 'API', { key: fullCacheKey });
    } catch (error) {
      logger.error('Failed to save cached data', 'API', error);
    }
  }, [fullCacheKey, offlineMode]);

  // Enhanced query function with caching
  const enhancedQueryFn = useCallback(async () => {
    try {
      const data = await queryFn();
      
      // Save to cache on success
      await saveCachedData(data);
      
      // Call success callback
      onSuccess?.(data);
      
      return data;
    } catch (error) {
      // Try to load from cache on error
      if (offlineMode && Platform.OS !== 'web') {
        const cachedData = await loadCachedData();
        if (cachedData) {
          logger.warn('Using cached data due to API error', 'API', { 
            error: (error as Error).message 
          });
          return cachedData;
        }
      }
      throw error;
    }
  }, [queryFn, saveCachedData, loadCachedData, offlineMode, onSuccess]);

  // Use the query with enhanced error handling
  const query = useQuery<TData, TRPCClientError<any>>({
    queryKey,
    queryFn: enhancedQueryFn,
    ...queryOptions,
  });

  // Error handling
  useEffect(() => {
    if (query.error) {
      // Track error
      handleTRPCError(query.error);

      // Log error
      logger.error('API query error', 'API', {
        queryKey,
        error: query.error.message,
        code: query.error.data?.code,
      });

      // Show alert if enabled
      if (shouldShowAlert) {
        const message = errorMessage || query.error.message || 'An error occurred while fetching data';
        showErrorAlert(errorTitle, message);
      }

      // Call error callback
      onError?.(query.error);
    }
  }, [query.error, queryKey, shouldShowAlert, errorTitle, errorMessage, onError, handleTRPCError]);

  // Check if we're offline
  const isOffline = !isOnline || 
                    query.error?.message?.includes('fetch') || 
                    query.error?.message?.includes('network') ||
                    false;

  // Manual cache refresh
  const refreshCache = useCallback(async () => {
    if (Platform.OS === 'web' || !offlineMode) return;
    
    try {
      await query.refetch();
    } catch (error) {
      logger.error('Failed to refresh cache', 'API', error);
    }
  }, [query, offlineMode]);

  return {
    ...query,
    isOffline,
    cachedData: query.data,
    refreshCache,
  };
}

/**
 * Healthcare-specific query hook with built-in error handling
 */
export function useHealthcareQuery<TData>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: ApiQueryOptions<TData>
): ApiQueryResult<TData> {
  return useApiQuery(queryKey, queryFn, {
    errorTitle: 'Healthcare Error',
    showErrorAlert: true,
    offlineMode: true,
    cacheDuration: 2 * 60 * 1000, // 2 minutes for healthcare data
    ...options,
  });
}

/**
 * Organization-specific query hook
 */
export function useOrganizationQuery<TData>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: ApiQueryOptions<TData>
): ApiQueryResult<TData> {
  return useApiQuery(queryKey, queryFn, {
    errorTitle: 'Organization Error',
    cacheDuration: 10 * 60 * 1000, // 10 minutes for org data
    ...options,
  });
}

/**
 * Auth-specific query hook (no caching for security)
 */
export function useAuthQuery<TData>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: ApiQueryOptions<TData>
): ApiQueryResult<TData> {
  return useApiQuery(queryKey, queryFn, {
    errorTitle: 'Authentication Error',
    offlineMode: false, // No offline mode for auth
    gcTime: 0, // No caching for auth data
    ...options,
  });
}