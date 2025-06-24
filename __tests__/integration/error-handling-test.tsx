import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCProvider } from '@/lib/api/trpc';
import { ApiErrorBoundary } from '@/components/blocks/errors/ApiErrorBoundary';
import { AlertList } from '@/components/blocks/healthcare/AlertList';
import { AlertSummaryEnhanced } from '@/components/blocks/healthcare/AlertSummaryEnhanced';
import PatientsScreen from '@/app/patients';
import AlertsScreen from '@/app/alerts/index';

// Mock dependencies
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      role: 'doctor',
      hospitalId: 'test-hospital',
    },
  }),
}));

jest.mock('@/hooks/healthcare', () => ({
  ...jest.requireActual('@/hooks/healthcare'),
  useHospitalContext: () => ({
    hospitalId: 'test-hospital',
    canAccessHealthcare: true,
    shouldShowProfilePrompt: false,
  }),
  useActiveAlerts: () => ({
    data: null,
    error: new Error('Network error'),
    isLoading: false,
    refetch: jest.fn(),
  }),
  usePatients: () => ({
    data: null,
    error: new Error('Failed to load patients'),
    isLoading: false,
    refetch: jest.fn(),
  }),
}));

describe('Error Handling', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );

  describe('ApiErrorBoundary', () => {
    it('should catch and display API errors', async () => {
      const ThrowError = () => {
        throw new Error('TRPC error');
      };

      const { getByText } = render(
        <ApiErrorBoundary>
          <ThrowError />
        </ApiErrorBoundary>,
        { wrapper }
      );

      await waitFor(() => {
        expect(getByText('API Error')).toBeTruthy();
        expect(getByText(/TRPC error/)).toBeTruthy();
      });
    });

    it('should provide retry functionality', async () => {
      const onRetry = jest.fn();
      let shouldThrow = true;
      
      const ThrowError = () => {
        if (shouldThrow) {
          throw new Error('Network error');
        }
        return <Text>Success</Text>;
      };

      const { getByText, rerender } = render(
        <ApiErrorBoundary>
          <ThrowError />
        </ApiErrorBoundary>,
        { wrapper }
      );

      await waitFor(() => {
        expect(getByText('Try Again')).toBeTruthy();
      });

      // Click retry
      shouldThrow = false;
      fireEvent.press(getByText('Try Again'));

      // Should recover
      await waitFor(() => {
        expect(getByText('Success')).toBeTruthy();
      });
    });

    it('should show offline indicator when offline', async () => {
      // Mock offline state
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network request failed'));

      const { getByText } = render(
        <ApiErrorBoundary>
          <AlertList hospitalId="test-hospital" role="doctor" />
        </ApiErrorBoundary>,
        { wrapper }
      );

      await waitFor(() => {
        expect(getByText(/Network Error/)).toBeTruthy();
      });
    });
  });

  describe('Component Error Handling', () => {
    it('PatientsScreen should handle errors with ApiErrorBoundary', async () => {
      const { getByText } = render(<PatientsScreen />, { wrapper });

      // The error should be caught by ApiErrorBoundary
      await waitFor(() => {
        expect(getByText(/Failed to load patients/)).toBeTruthy();
        expect(getByText('Try Again')).toBeTruthy();
      });
    });

    it('AlertsScreen should handle errors with ApiErrorBoundary', async () => {
      const { getByText } = render(<AlertsScreen />, { wrapper });

      // The error should be caught by ApiErrorBoundary
      await waitFor(() => {
        expect(getByText(/Network error/)).toBeTruthy();
        expect(getByText('Try Again')).toBeTruthy();
      });
    });

    it('should show profile incomplete prompt when hospital is missing', async () => {
      // Mock missing hospital
      jest.spyOn(require('@/hooks/healthcare'), 'useHospitalContext').mockReturnValue({
        hospitalId: null,
        canAccessHealthcare: false,
        shouldShowProfilePrompt: true,
      });

      const { getByText } = render(<AlertList hospitalId="" role="doctor" />, { wrapper });

      await waitFor(() => {
        expect(getByText(/Complete your profile/)).toBeTruthy();
      });
    });
  });

  describe('Offline Mode', () => {
    it('should show cached data when offline', async () => {
      // Mock offline with cached data
      jest.spyOn(require('@/hooks/healthcare'), 'useActiveAlerts').mockReturnValue({
        data: null,
        error: new Error('Network error'),
        isLoading: false,
        isOffline: true,
        cachedData: {
          alerts: [
            {
              id: '1',
              roomNumber: '101',
              alertType: 'emergency',
              urgency: 5,
              status: 'active',
            },
          ],
        },
        refetch: jest.fn(),
      });

      const { getByText } = render(
        <AlertSummaryEnhanced hospitalId="test-hospital" />,
        { wrapper }
      );

      await waitFor(() => {
        expect(getByText('Offline')).toBeTruthy();
        expect(getByText('Room 101')).toBeTruthy();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover from errors when connection is restored', async () => {
      const mockRefetch = jest.fn().mockResolvedValue({ data: { alerts: [] } });
      
      jest.spyOn(require('@/hooks/healthcare'), 'useActiveAlerts').mockReturnValue({
        data: null,
        error: new Error('Network error'),
        isLoading: false,
        refetch: mockRefetch,
      });

      const { getByText } = render(
        <ApiErrorBoundary>
          <AlertList hospitalId="test-hospital" role="doctor" />
        </ApiErrorBoundary>,
        { wrapper }
      );

      await waitFor(() => {
        expect(getByText('Try Again')).toBeTruthy();
      });

      fireEvent.press(getByText('Try Again'));

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});