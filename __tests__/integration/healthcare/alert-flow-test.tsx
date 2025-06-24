import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import type { AnimationTestProps } from "@/types/components";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api/trpc';
import { AlertList } from '@/components/blocks/healthcare/AlertList';
import { AlertCreationFormEnhanced } from '@/components/blocks/healthcare/AlertCreationFormEnhanced';
import { useRouter } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn<any>(),
  useLocalSearchParams: jest.fn(() => ({})),
}));

// Mock TRPC API
jest.mock('@/lib/api/trpc', () => ({
  api: {
    healthcare: {
      getAlerts: {
        useQuery: jest.fn<any>(),
      },
      createAlert: {
        useMutation: jest.fn<any>(),
      },
      acknowledgeAlert: {
        useMutation: jest.fn<any>(),
      },
      resolveAlert: {
        useMutation: jest.fn<any>(),
      },
      getPatients: {
        useQuery: jest.fn<any>(),
      },
    },
  },
}));

// Mock Reanimated
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated'),
  useAnimatedStyle: jest.fn((fn) => ({ value: fn() })),
  useSharedValue: jest.fn((val) => ({ value: val })),
  withSpring: jest.fn((val) => val),
  withTiming: jest.fn((val) => val),
  withSequence: jest.fn((...args) => args[0]),
  withDelay: jest.fn((_, val) => val),
  FadeIn: { duration: jest.fn() },
  FadeOut: { duration: jest.fn() },
  SlideInRight: { duration: jest.fn() },
  SlideOutLeft: { duration: jest.fn() },
}), () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('Healthcare Alert Flow Integration', () => {
  let queryClient: QueryClient;
  const mockRouter = { push: jest.fn<any>(), back: jest.fn<any>() };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    (useRouter as jest.Mock<any>).mockReturnValue(mockRouter);
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Alert Creation Flow', () => {
    const mockPatients = [
      { id: 'p1', name: 'John Doe', mrn: 'MRN001', roomNumber: 'A301' },
      { id: 'p2', name: 'Jane Smith', mrn: 'MRN002', roomNumber: 'B205' },
    ];

    beforeEach(() => {
      (api.healthcare.getPatients.useQuery as jest.Mock<any>).mockReturnValue({
        data: mockPatients,
        isLoading: false,
      });
    });

    it('should complete alert creation flow', async () => {
      const mockCreateAlert = jest.fn<any>().mockResolvedValue({
        id: 'new-alert-123',
        roomNumber: 'A301',
        alertType: 'code_blue',
        urgencyLevel: 5,
        status: 'active',
      });

      (api.healthcare.createAlert.useMutation as jest.Mock<any>).mockReturnValue({
        mutate: mockCreateAlert,
        isLoading: false,
        error: null,
      });

      const onSuccess = jest.fn<any>();
      renderWithProviders(
        <AlertCreationFormEnhanced onSuccess={onSuccess} />
      );

      // Fill in the form
      const roomInput = screen.getByPlaceholderText('e.g., A301');
      fireEvent.changeText(roomInput, 'A301');

      // Select alert type
      const alertTypeButton = screen.getByText('Select alert type');
      fireEvent.press(alertTypeButton);
      
      // Select Code Blue
      await waitFor(() => {
        const codeBlueOption = screen.getByText('Code Blue');
        fireEvent.press(codeBlueOption);
      });

      // Select urgency level (5 - Critical)
      const urgencyButtons = screen.getAllByRole('button');
      const criticalButton = urgencyButtons.find(btn => 
        btn.props.children?.toString().includes('5')
      );
      if (criticalButton) {
        fireEvent.press(criticalButton);
      }

      // Add description
      const descriptionInput = screen.getByPlaceholderText('Provide additional details...');
      fireEvent.changeText(descriptionInput, 'Patient unresponsive, CPR in progress');

      // Submit the form
      const submitButton = screen.getByText('Create Alert');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockCreateAlert).toHaveBeenCalledWith({
          roomNumber: 'A301',
          alertType: 'code_blue',
          urgencyLevel: 5,
          description: 'Patient unresponsive, CPR in progress',
          patientId: undefined,
        });
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should validate required fields', async () => {
      (api.healthcare.createAlert.useMutation as jest.Mock<any>).mockReturnValue({
        mutate: jest.fn<any>(),
        isLoading: false,
        error: null,
      });

      renderWithProviders(<AlertCreationFormEnhanced />);

      // Try to submit without filling required fields
      const submitButton = screen.getByText('Create Alert');
      fireEvent.press(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/room number is required/i)).toBeTruthy();
      });
    });
  });

  describe('Alert Acknowledgment Flow', () => {
    const mockAlerts = [
      {
        id: 'alert-1',
        roomNumber: 'A301',
        alertType: 'code_blue',
        urgencyLevel: 5,
        status: 'active',
        description: 'Cardiac arrest',
        createdAt: new Date('2025-06-17T10:00:00Z'),
        createdBy: 'nurse-1',
        patient: { name: 'John Doe', mrn: 'MRN001' },
      },
    ];

    it('should acknowledge an alert', async () => {
      const mockAcknowledge = jest.fn<any>().mockResolvedValue({
        id: 'alert-1',
        status: 'acknowledged',
        acknowledgedBy: 'doctor-1',
        acknowledgedAt: new Date(),
      });

      (api.healthcare.getAlerts.useQuery as jest.Mock<any>).mockReturnValue({
        data: { alerts: mockAlerts, hasMore: false },
        isLoading: false,
        refetch: jest.fn<any>(),
      });

      (api.healthcare.acknowledgeAlert.useMutation as jest.Mock<any>).mockReturnValue({
        mutate: mockAcknowledge,
        isLoading: false,
      });

      renderWithProviders(<AlertList />);

      // Find the alert card
      const alertCard = screen.getByText('Cardiac arrest');
      expect(alertCard).toBeTruthy();

      // Find and press acknowledge button
      const acknowledgeButton = screen.getByText('Acknowledge');
      fireEvent.press(acknowledgeButton);

      // Should navigate to acknowledgment modal
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith({
          pathname: '/acknowledge-alert',
          params: { alertId: 'alert-1' },
        });
      });
    });
  });

  describe('Alert Resolution Flow', () => {
    const mockAcknowledgedAlert = {
      id: 'alert-1',
      roomNumber: 'A301',
      alertType: 'medical_emergency',
      urgencyLevel: 4,
      status: 'acknowledged',
      description: 'Patient in distress',
      createdAt: new Date('2025-06-17T10:00:00Z'),
      acknowledgedAt: new Date('2025-06-17T10:05:00Z'),
      createdBy: 'nurse-1',
      acknowledgedBy: 'doctor-1',
      patient: { name: 'Jane Smith', mrn: 'MRN002' },
    };

    it('should resolve an acknowledged alert', async () => {
      const mockResolve = jest.fn<any>().mockResolvedValue({
        id: 'alert-1',
        status: 'resolved',
        resolvedAt: new Date(),
      });

      (api.healthcare.getAlerts.useQuery as jest.Mock<any>).mockReturnValue({
        data: { alerts: [mockAcknowledgedAlert], hasMore: false },
        isLoading: false,
        refetch: jest.fn<any>(),
      });

      (api.healthcare.resolveAlert.useMutation as jest.Mock<any>).mockReturnValue({
        mutate: mockResolve,
        isLoading: false,
      });

      renderWithProviders(<AlertList />);

      // Find the resolve button
      const resolveButton = screen.getByText('Resolve');
      fireEvent.press(resolveButton);

      // Confirm resolution (if there's a confirmation dialog)
      await waitFor(() => {
        expect(mockResolve).toHaveBeenCalledWith({
          alertId: 'alert-1',
          notes: expect.any(String),
        });
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update alert list when new alert is created', async () => {
      const initialAlerts = [
        {
          id: 'alert-1',
          roomNumber: 'A301',
          alertType: 'medical_emergency',
          urgencyLevel: 3,
          status: 'active',
          createdAt: new Date(),
        },
      ];

      const updatedAlerts = [
        ...initialAlerts,
        {
          id: 'alert-2',
          roomNumber: 'B205',
          alertType: 'code_blue',
          urgencyLevel: 5,
          status: 'active',
          createdAt: new Date(),
        },
      ];

      // Start with initial alerts
      (api.healthcare.getAlerts.useQuery as jest.Mock<any>).mockReturnValue({
        data: { alerts: initialAlerts, hasMore: false },
        isLoading: false,
        refetch: jest.fn<any>(),
      });

      const { rerender } = renderWithProviders(<AlertList />);

      // Verify initial state
      expect(screen.getByText('A301')).toBeTruthy();
      expect(screen.queryByText('B205')).toBeNull();

      // Simulate real-time update
      act(() => {
        (api.healthcare.getAlerts.useQuery as jest.Mock<any>).mockReturnValue({
          data: { alerts: updatedAlerts, hasMore: false },
          isLoading: false,
          refetch: jest.fn<any>(),
        });
      });

      rerender(<QueryClientProvider client={queryClient}><AlertList /></QueryClientProvider>);

      // Verify updated state
      await waitFor(() => {
        expect(screen.getByText('A301')).toBeTruthy();
        expect(screen.getByText('B205')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error when alert creation fails', async () => {
      const mockError = new Error('Network error');
      const mockCreateAlert = jest.fn<any>().mockRejectedValue(mockError);

      (api.healthcare.createAlert.useMutation as jest.Mock<any>).mockReturnValue({
        mutate: mockCreateAlert,
        isLoading: false,
        error: mockError,
      });

      (api.healthcare.getPatients.useQuery as jest.Mock<any>).mockReturnValue({
        data: [],
        isLoading: false,
      });

      renderWithProviders(<AlertCreationFormEnhanced />);

      // Fill minimal required fields
      const roomInput = screen.getByPlaceholderText('e.g., A301');
      fireEvent.changeText(roomInput, 'A301');

      // Submit
      const submitButton = screen.getByText('Create Alert');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create alert/i)).toBeTruthy();
      });
    });
  });
});