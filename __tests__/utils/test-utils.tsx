/**
 * Test utilities for rendering components with all required providers
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCProvider } from '@/lib/api/trpc';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { HospitalProvider } from '@/components/providers/HospitalProvider';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';
import { ThemeProvider } from '@/lib/theme/provider';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Create a test query client with immediate retry disabled
const createTestQueryClient = () =>
  new QueryClient({
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

interface TestProviderProps {
  children: React.ReactNode;
  session?: any;
  hospital?: any;
}

// All the providers needed for testing
export const AllTheProviders: React.FC<TestProviderProps> = ({ 
  children, 
  session = null,
  hospital = null 
}) => {
  const queryClient = createTestQueryClient();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider initialSession={session}>
          <HospitalProvider initialHospital={hospital}>
            <ThemeProvider>
              <NavigationContainer>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </NavigationContainer>
            </ThemeProvider>
          </HospitalProvider>
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

// Custom render function that includes all providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: RenderOptions & { session?: any; hospital?: any }
) => {
  const { session, hospital, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders session={session} hospital={hospital}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Re-export everything from testing library
export * from '@testing-library/react-native';

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock navigation
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  getParent: jest.fn(),
  getState: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
};

// Mock route
export const createMockRoute = (params = {}) => ({
  key: 'test-route',
  name: 'TestScreen',
  params,
});

// Helper to trigger error in component
export const ThrowError: React.FC<{ error?: Error }> = ({ error }) => {
  throw error || new Error('Test error');
};