import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a stable query client for tests
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
  logger: {
    log: () => {},
    warn: () => {},
    error: () => {},
  },
});

// Test wrapper component
export const createQueryWrapper = () => {
  const testQueryClient = createTestQueryClient();
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};