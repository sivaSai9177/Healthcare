import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import type { AnimationTestProps } from "@/types/components";
import { ResponseAnalyticsDashboard } from '@/components/blocks/healthcare/ResponseAnalyticsDashboard';
import { api } from '@/lib/api/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Text } from 'react-native';

// Mock the TRPC API
jest.mock('@/lib/api/trpc', () => ({
  api: {
    healthcare: {
      getResponseAnalytics: {
        useQuery: jest.fn<any>(),
      },
      getDepartments: {
        useQuery: jest.fn<any>(),
      },
    },
  },
}));

// Mock Recharts components (they don't work in React Native test environment)
jest.mock('recharts', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ResponsiveContainer: ({ children }: any) => React.createElement(React.Fragment, {}, children),
    LineChart: () => React.createElement(Text, {}, 'LineChart'),
    Line: () => React.createElement(Text, {}, 'Line'),
    BarChart: () => React.createElement(Text, {}, 'BarChart'),
    Bar: () => React.createElement(Text, {}, 'Bar'),
    PieChart: () => React.createElement(Text, {}, 'PieChart'),
    Pie: () => React.createElement(Text, {}, 'Pie'),
    Cell: () => React.createElement(Text, {}, 'Cell'),
    XAxis: () => React.createElement(Text, {}, 'XAxis'),
    YAxis: () => React.createElement(Text, {}, 'YAxis'),
    CartesianGrid: () => React.createElement(Text, {}, 'CartesianGrid'),
    Tooltip: () => React.createElement(Text, {}, 'Tooltip'),
    Legend: () => React.createElement(Text, {}, 'Legend'),
    Area: () => React.createElement(Text, {}, 'Area'),
    AreaChart: () => React.createElement(Text, {}, 'AreaChart'),
  };
});

// Reanimated is mocked globally in jest config

describe('ResponseAnalyticsDashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const mockAnalyticsData = {
    overview: {
      totalAlerts: 342,
      averageResponseTime: 4.2,
      responseRate: 96.5,
      escalationRate: 12.3,
      acknowledgedAlerts: 330,
      resolvedAlerts: 298,
      activeAlerts: 12,
    },
    responseTimeTrend: [
      { date: '2024-01-01', avgTime: 3.5, count: 45 },
      { date: '2024-01-02', avgTime: 4.1, count: 52 },
    ],
    departmentBreakdown: [
      { name: 'Emergency', alerts: 120, avgResponseTime: 2.8 },
      { name: 'ICU', alerts: 89, avgResponseTime: 3.2 },
    ],
  };

  const mockDepartments = [
    { id: '1', name: 'Emergency', hospitalId: 'h1' },
    { id: '2', name: 'ICU', hospitalId: 'h1' },
    { id: '3', name: 'Cardiology', hospitalId: 'h1' },
  ];

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      (api.healthcare.getResponseAnalytics.useQuery as jest.Mock<any>).mockReturnValue({
        data: undefined,
        loading: true,
        refetch: jest.fn<any>(),
      });

      (api.healthcare.getDepartments.useQuery as jest.Mock<any>).mockReturnValue({
        data: undefined,
        loading: true,
      });

      renderWithProviders(<ResponseAnalyticsDashboard />);
      
      // Should show skeleton loaders
      expect(screen.queryByText('Response Analytics')).toBeTruthy();
    });

    it('should render analytics data when loaded', async () => {
      (api.healthcare.getResponseAnalytics.useQuery as jest.Mock<any>).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        refetch: jest.fn<any>(),
      });

      (api.healthcare.getDepartments.useQuery as jest.Mock<any>).mockReturnValue({
        data: mockDepartments,
        isLoading: false,
      });

      renderWithProviders(<ResponseAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Response Analytics')).toBeTruthy();
        expect(screen.getByText('Total Alerts')).toBeTruthy();
        expect(screen.getByText('342')).toBeTruthy();
        expect(screen.getByText('Avg Response Time')).toBeTruthy();
        expect(screen.getByText('4.2m')).toBeTruthy();
      });
    });

    it('should render error state when data fetch fails', () => {
      (api.healthcare.getResponseAnalytics.useQuery as jest.Mock<any>).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch'),
        refetch: jest.fn<any>(),
      });

      (api.healthcare.getDepartments.useQuery as jest.Mock<any>).mockReturnValue({
        data: [],
        isLoading: false,
      });

      renderWithProviders(<ResponseAnalyticsDashboard />);

      expect(screen.getByText('Failed to Load Analytics')).toBeTruthy();
      expect(screen.getByText(/couldn't fetch the analytics data/i)).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    beforeEach(() => {
      (api.healthcare.getResponseAnalytics.useQuery as jest.Mock<any>).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        refetch: jest.fn<any>(),
      });

      (api.healthcare.getDepartments.useQuery as jest.Mock<any>).mockReturnValue({
        data: mockDepartments,
        isLoading: false,
      });
    });

    it('should handle time range selection', async () => {
      const mockRefetch = jest.fn<any>();
      (api.healthcare.getResponseAnalytics.useQuery as jest.Mock<any>).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders(<ResponseAnalyticsDashboard />);

      // Find and click 30d button
      const button30d = screen.getByText('30d');
      fireEvent.press(button30d);

      // Verify the query was called with new time range
      await waitFor(() => {
        expect(api.healthcare.getResponseAnalytics.useQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            timeRange: '30d',
          })
        );
      });
    });

    it('should handle refresh button', async () => {
      const mockRefetch = jest.fn<any>().mockResolvedValue({ data: mockAnalyticsData });
      (api.healthcare.getResponseAnalytics.useQuery as jest.Mock<any>).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders(<ResponseAnalyticsDashboard />);

      const refreshButton = screen.getByText('Refresh');
      fireEvent.press(refreshButton);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should filter by hospital ID when provided', () => {
      const hospitalId = 'hospital-123';
      renderWithProviders(<ResponseAnalyticsDashboard hospitalId={hospitalId} />);

      expect(api.healthcare.getResponseAnalytics.useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          hospitalId,
        })
      );
    });

    it('should filter by department ID when provided', () => {
      const departmentId = 'dept-456';
      renderWithProviders(<ResponseAnalyticsDashboard departmentId={departmentId} />);

      expect(api.healthcare.getResponseAnalytics.useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          departmentId,
        })
      );
    });
  });

  describe('Metric Cards', () => {
    beforeEach(() => {
      (api.healthcare.getResponseAnalytics.useQuery as jest.Mock<any>).mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        refetch: jest.fn<any>(),
      });

      (api.healthcare.getDepartments.useQuery as jest.Mock<any>).mockReturnValue({
        data: mockDepartments,
        isLoading: false,
      });
    });

    it('should display all key metrics', () => {
      renderWithProviders(<ResponseAnalyticsDashboard />);

      // Check metric cards
      expect(screen.getByText('Total Alerts')).toBeTruthy();
      expect(screen.getByText('342')).toBeTruthy();
      
      expect(screen.getByText('Avg Response Time')).toBeTruthy();
      expect(screen.getByText('4.2m')).toBeTruthy();
      
      expect(screen.getByText('Response Rate')).toBeTruthy();
      expect(screen.getByText('96.5%')).toBeTruthy();
      
      expect(screen.getByText('Escalation Rate')).toBeTruthy();
      expect(screen.getByText('12.3%')).toBeTruthy();
    });

    it('should show trend indicators', () => {
      renderWithProviders(<ResponseAnalyticsDashboard />);

      // Look for trend percentages (from mock data)
      expect(screen.getByText('12%')).toBeTruthy(); // Positive trend
      expect(screen.getByText('8%')).toBeTruthy(); // Negative trend
    });
  });
});