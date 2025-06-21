import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCProvider } from '@/lib/api/trpc';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { HospitalProvider } from '@/components/providers/HospitalProvider';
import { ThemeProvider } from '@/lib/theme/provider';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export const AllProviders: React.FC<AllProvidersProps> = ({ 
  children, 
  queryClient = createTestQueryClient() 
}) => {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <TRPCProvider>
            <SessionProvider>
              <HospitalProvider>
                <ThemeProvider>
                  {children}
                </ThemeProvider>
              </HospitalProvider>
            </SessionProvider>
          </TRPCProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  const { queryClient, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
};

// Re-export everything
export * from '@testing-library/react-native';
export { createTestQueryClient };