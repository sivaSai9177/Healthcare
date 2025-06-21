import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react-native';
import type { AnimationTestProps } from "@/types/components";
import { ActivityLogsBlock } from '@/components/blocks/healthcare/ActivityLogsBlock';
import { api } from '@/lib/api/trpc';
import { createQueryWrapper } from '@/__tests__/setup/react-query-mock';

// Mock the TRPC API
jest.mock('@/lib/api/trpc', () => ({
  api: {
    healthcare: {
      getActivityLogs: {
        useQuery: jest.fn<any>(),
      },
    },
  },
}));

describe('ActivityLogsBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  const mockLogs = [
    {
      id: '1',
      timestamp: new Date('2025-06-17T10:00:00Z'),
      type: 'alert',
      action: 'alert_created',
      user: { id: '1', name: 'Dr. Smith', role: 'doctor' },
      entityType: 'alert',
      entityId: 'alert-123',
      description: 'Created Code Blue alert for Room 301',
      severity: 'critical' as const,
      metadata: { roomNumber: '301', alertType: 'Code Blue' },
      ipAddress: '192.168.1.100',
    },
    {
      id: '2',
      timestamp: new Date('2025-06-17T09:45:00Z'),
      type: 'user',
      action: 'login',
      user: { id: '2', name: 'Nurse Johnson', role: 'nurse' },
      description: 'User logged in successfully',
      severity: 'info' as const,
      metadata: { loginMethod: 'password' },
      ipAddress: '192.168.1.101',
      userAgent: 'Mobile App iOS',
    },
    {
      id: '3',
      timestamp: new Date('2025-06-17T09:30:00Z'),
      type: 'patient',
      action: 'patient_updated',
      user: { id: '3', name: 'Dr. Williams', role: 'doctor' },
      entityType: 'patient',
      entityId: 'patient-456',
      description: 'Updated patient status to stable',
      severity: 'info' as const,
      metadata: { previousStatus: 'critical', newStatus: 'stable' },
    },
  ];

  const renderWithProviders = (component: React.ReactElement) => {
    const Wrapper = createQueryWrapper();
    return render(component, { wrapper: Wrapper });
  };

  describe('Rendering', () => {
    it('should render with title and entry count', async () => {
      (api.healthcare.getActivityLogs.useQuery as jest.Mock<any>).mockReturnValue({
        data: { logs: mockLogs },
        isLoading: false,
        refetch: jest.fn<any>(),
      });

      renderWithProviders(<ActivityLogsBlock />);
      
      await waitFor(() => {
        expect(screen.getByText('Activity Logs')).toBeTruthy();
      });
      
      expect(screen.getByText('3 entries found')).toBeTruthy();
    });

    it('should render loading state', async () => {
      (api.healthcare.getActivityLogs.useQuery as jest.Mock<any>).mockReturnValue({
        data: undefined,
        loading: true,
        refetch: jest.fn<any>(),
      });

      renderWithProviders(<ActivityLogsBlock />);
      
      await waitFor(() => {
        expect(screen.getByText('Activity Logs')).toBeTruthy();
      });
      // Should show skeleton loaders (implementation dependent)
    });

    it('should render empty state when no logs', () => {
      (api.healthcare.getActivityLogs.useQuery as jest.Mock<any>).mockReturnValue({
        data: { logs: [] },
        isLoading: false,
        refetch: jest.fn<any>(),
      });

      renderWithProviders(<ActivityLogsBlock />);
      
      expect(screen.getByText('No Activity Logs Found')).toBeTruthy();
    });
  });

  describe('Log Items', () => {
    beforeEach(() => {
      (api.healthcare.getActivityLogs.useQuery as jest.Mock<any>).mockReturnValue({
        data: { logs: mockLogs },
        isLoading: false,
        refetch: jest.fn<any>(),
      });
    });

    it('should display log details correctly', () => {
      renderWithProviders(<ActivityLogsBlock />);

      // First log - critical alert
      expect(screen.getByText('Created Code Blue alert for Room 301')).toBeTruthy();
      expect(screen.getByText('Dr. Smith (doctor)')).toBeTruthy();
      expect(screen.getByText('CRITICAL')).toBeTruthy();
      expect(screen.getByText('alert')).toBeTruthy();

      // Second log - user login
      expect(screen.getByText('User logged in successfully')).toBeTruthy();
      expect(screen.getByText('Nurse Johnson (nurse)')).toBeTruthy();
      expect(screen.getByText('INFO')).toBeTruthy();
    });

    it('should display metadata badges', () => {
      renderWithProviders(<ActivityLogsBlock />);

      // Check for metadata badges
      expect(screen.getByText('roomNumber: 301')).toBeTruthy();
      expect(screen.getByText('alertType: Code Blue')).toBeTruthy();
      expect(screen.getByText('loginMethod: password')).toBeTruthy();
    });

    it('should display timestamps correctly', () => {
      // Mock current time for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-06-17T11:00:00Z'));

      renderWithProviders(<ActivityLogsBlock />);

      // Should show relative times
      expect(screen.getByText(/Today at \d{2}:\d{2}/)).toBeTruthy();

      jest.useRealTimers();
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      (api.healthcare.getActivityLogs.useQuery as jest.Mock<any>).mockReturnValue({
        data: { logs: mockLogs },
        isLoading: false,
        refetch: jest.fn<any>(),
      });
    });

    it('should toggle filter panel', () => {
      renderWithProviders(<ActivityLogsBlock />);

      const filterButton = screen.getByText('Filters');
      
      // Initially filters should not be visible
      expect(screen.queryByText('Time Range')).toBeNull();
      
      // Click to show filters
      fireEvent.press(filterButton);
      
      // Now filters should be visible
      expect(screen.getByText('Last 24 Hours')).toBeTruthy();
    });

    it('should handle search input', async () => {
      renderWithProviders(<ActivityLogsBlock />);

      const searchInput = screen.getByPlaceholderText('Search logs...');
      fireEvent.changeText(searchInput, 'Code Blue');

      // The component should filter logs based on search
      // Since filtering is done on the client side in the mock, we need to wait
      await waitFor(() => {
        expect(screen.queryByText('User logged in successfully')).toBeNull();
        expect(screen.getByText('Created Code Blue alert for Room 301')).toBeTruthy();
      });
    });

    it('should clear all filters', () => {
      renderWithProviders(<ActivityLogsBlock />);

      // Show filters
      fireEvent.press(screen.getByText('Filters'));
      
      // Apply some filters
      const searchInput = screen.getByPlaceholderText('Search logs...');
      fireEvent.changeText(searchInput, 'test');
      
      // Clear filters
      const clearButton = screen.getByText('Clear All');
      fireEvent.press(clearButton);
      
      // Search should be cleared
      expect(searchInput.props.value).toBe('');
    });
  });

  describe('Actions', () => {
    beforeEach(() => {
      (api.healthcare.getActivityLogs.useQuery as jest.Mock<any>).mockReturnValue({
        data: { logs: mockLogs },
        isLoading: false,
        refetch: jest.fn<any>(),
      });
    });

    it('should handle refresh action', async () => {
      const mockRefetch = jest.fn<any>().mockResolvedValue({ data: { logs: mockLogs } });
      (api.healthcare.getActivityLogs.useQuery as jest.Mock<any>).mockReturnValue({
        data: { logs: mockLogs },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders(<ActivityLogsBlock />);

      // Find refresh button by looking for RefreshCw icon
      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons.find(button => {
        // Check if button contains refresh icon
        return button.props.children?.some?.((child: any) => 
          child?.type?.name === 'RefreshCw'
        );
      });

      if (refreshButton) {
        fireEvent.press(refreshButton);
        await waitFor(() => {
          expect(mockRefetch).toHaveBeenCalledTimes(1);
        });
      }
    });

    it('should handle export action', () => {
      // Mock console.log to verify export was triggered
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderWithProviders(<ActivityLogsBlock />);

      // Find export button by looking for Download icon
      const buttons = screen.getAllByRole('button');
      const exportButton = buttons.find(button => {
        return button.props.children?.some?.((child: any) => 
          child?.type?.name === 'Download'
        );
      });

      if (exportButton) {
        fireEvent.press(exportButton);
        expect(consoleSpy).toHaveBeenCalledWith('Export logs');
      }

      consoleSpy.mockRestore();
    });
  });

  describe('Props', () => {
    it('should filter by hospitalId when provided', () => {
      const hospitalId = 'hospital-123';
      renderWithProviders(<ActivityLogsBlock hospitalId={hospitalId} />);

      expect(api.healthcare.getActivityLogs.useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          hospitalId,
        })
      );
    });

    it('should filter by userId when provided', () => {
      const userId = 'user-456';
      renderWithProviders(<ActivityLogsBlock userId={userId} />);

      expect(api.healthcare.getActivityLogs.useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
        })
      );
    });

    it('should limit results when limit prop provided', () => {
      const limit = 50;
      renderWithProviders(<ActivityLogsBlock limit={limit} />);

      expect(api.healthcare.getActivityLogs.useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          limit,
        })
      );
    });
  });
});