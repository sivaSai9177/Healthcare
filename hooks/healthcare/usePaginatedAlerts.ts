import { useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/api/trpc';
import { log } from '@/lib/core/debug/logger';

interface UsePaginatedAlertsOptions {
  hospitalId: string;
  pageSize?: number;
  status?: 'active' | 'acknowledged' | 'resolved' | 'all';
  urgencyLevel?: number;
  alertType?: string;
  sortBy?: 'createdAt' | 'urgencyLevel' | 'acknowledgedAt';
  sortOrder?: 'asc' | 'desc';
  enabled?: boolean;
}

export function usePaginatedAlerts({
  hospitalId,
  pageSize = 20,
  status = 'active',
  urgencyLevel,
  alertType,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  enabled = true,
}: UsePaginatedAlertsOptions) {
  const [page, setPage] = useState(0);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  // Calculate offset
  const offset = page * pageSize;

  // Query for paginated alerts
  const { data, isLoading, error, refetch, isFetching } = api.healthcare.getActiveAlerts.useQuery(
    {
      hospitalId,
      limit: pageSize,
      offset,
      cursor,
      status,
      urgencyLevel,
      alertType,
      sortBy,
      sortOrder,
    },
    {
      enabled: enabled && !!hospitalId,
      keepPreviousData: true, // Keep previous data while fetching new page
      staleTime: 30000, // Consider data stale after 30 seconds
    }
  );

  // Pagination helpers
  const totalPages = useMemo(() => {
    if (!data?.pagination?.total) return 0;
    return Math.ceil(data.pagination.total / pageSize);
  }, [data?.pagination?.total, pageSize]);

  const hasNextPage = data?.pagination?.hasMore || false;
  const hasPreviousPage = page > 0;

  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(prev => prev + 1);
      if (data?.pagination?.nextCursor) {
        setCursor(data.pagination.nextCursor);
      }
      log.debug('Going to next page', 'PAGINATED_ALERTS', { 
        newPage: page + 1,
        cursor: data?.pagination?.nextCursor 
      });
    }
  }, [hasNextPage, page, data?.pagination?.nextCursor]);

  const goToPreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage(prev => prev - 1);
      setCursor(undefined); // Reset cursor for offset-based pagination
      log.debug('Going to previous page', 'PAGINATED_ALERTS', { 
        newPage: page - 1 
      });
    }
  }, [hasPreviousPage, page]);

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 0 && pageNumber < totalPages) {
      setPage(pageNumber);
      setCursor(undefined); // Reset cursor for offset-based pagination
      log.debug('Going to specific page', 'PAGINATED_ALERTS', { 
        pageNumber 
      });
    }
  }, [totalPages]);

  const resetPagination = useCallback(() => {
    setPage(0);
    setCursor(undefined);
    log.debug('Resetting pagination', 'PAGINATED_ALERTS');
  }, []);

  // Reset pagination when filters change
  const resetAndRefetch = useCallback(() => {
    resetPagination();
    refetch();
  }, [resetPagination, refetch]);

  return {
    // Data
    alerts: data?.alerts || [],
    totalAlerts: data?.pagination?.total || 0,
    
    // Loading states
    isLoading,
    isFetching,
    error,
    
    // Pagination state
    currentPage: page,
    totalPages,
    pageSize,
    hasNextPage,
    hasPreviousPage,
    
    // Pagination actions
    goToNextPage,
    goToPreviousPage,
    goToPage,
    resetPagination,
    refetch: resetAndRefetch,
    
    // Pagination info
    paginationInfo: {
      from: offset + 1,
      to: Math.min(offset + pageSize, data?.pagination?.total || 0),
      total: data?.pagination?.total || 0,
    },
  };
}

// Hook for infinite scroll implementation
export function useInfiniteAlerts({
  hospitalId,
  pageSize = 20,
  status = 'active',
  urgencyLevel,
  alertType,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  enabled = true,
}: UsePaginatedAlertsOptions) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = api.healthcare.getActiveAlerts.useInfiniteQuery(
    {
      hospitalId,
      limit: pageSize,
      status,
      urgencyLevel,
      alertType,
      sortBy,
      sortOrder,
    },
    {
      enabled: enabled && !!hospitalId,
      getNextPageParam: (lastPage) => {
        return lastPage.pagination.nextCursor || undefined;
      },
      staleTime: 30000,
    }
  );

  // Flatten all pages of alerts
  const allAlerts = useMemo(() => {
    return data?.pages.flatMap(page => page.alerts) || [];
  }, [data?.pages]);

  const totalAlerts = data?.pages[0]?.pagination?.total || 0;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      log.debug('Loading more alerts', 'INFINITE_ALERTS', { 
        currentCount: allAlerts.length 
      });
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, allAlerts.length]);

  return {
    alerts: allAlerts,
    totalAlerts,
    isLoading,
    error,
    hasMore: hasNextPage || false,
    isLoadingMore: isFetchingNextPage,
    loadMore,
    refetch,
  };
}