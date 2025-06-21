import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import HealthcareDashboard from '@/components/blocks/dashboards/HealthcareDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useHospitalStore } from '@/lib/stores/hospital-store';
import { useHospitalPermissions } from '@/hooks/useHospitalPermissions';
import { useRouter } from 'expo-router';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/stores/hospital-store');
jest.mock('@/hooks/useHospitalPermissions');
jest.mock('@/hooks/healthcare', () => ({
  useAlertWebSocket: jest.fn(),
}));
jest.mock('@/components/blocks/healthcare', () => ({
  ShiftStatus: () => <MockComponent name="ShiftStatus" />,
  MetricsOverview: () => <MockComponent name="MetricsOverview" />,
  AlertSummaryEnhanced: () => <MockComponent name="AlertSummaryEnhanced" />,
  ActivePatients: () => <MockComponent name="ActivePatients" />,
}));
jest.mock('@/components/blocks/organization', () => ({
  HospitalSwitcher: () => <MockComponent name="HospitalSwitcher" />,
}));

// Mock component for testing
function MockComponent({ name }: { name: string }) {
  return <div testID={`mock-${name}`}>{name}</div>;
}

describe('HealthcareDashboard', () => {
  const mockUser = {
    id: '1',
    name: 'Dr. Test User',
    role: 'doctor',
    defaultHospitalId: 'hospital-1',
  };

  const mockHospital = {
    id: 'hospital-1',
    name: 'Test Hospital',
    organizationId: 'org-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      hasHydrated: true,
      isRefreshing: false,
    });

    (useHospitalStore as jest.Mock).mockReturnValue({
      currentHospital: mockHospital,
    });

    (useHospitalPermissions as jest.Mock).mockReturnValue({
      hasHospitalAssigned: true,
      isLoading: false,
    });
  });

  it('should render loading state when auth is not hydrated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      hasHydrated: false,
      isRefreshing: false,
    });

    const { getByText } = render(<HealthcareDashboard />);
    
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('should show hospital assignment required when user has no hospital', () => {
    (useHospitalPermissions as jest.Mock).mockReturnValue({
      hasHospitalAssigned: false,
      isLoading: false,
    });

    const { getByText } = render(<HealthcareDashboard />);
    
    expect(getByText('Hospital Assignment Required')).toBeTruthy();
    expect(getByText('Healthcare features require hospital assignment.')).toBeTruthy();
  });

  it('should render dashboard components for authenticated doctor', async () => {
    const { getByTestId, getByText } = render(<HealthcareDashboard />);
    
    await waitFor(() => {
      // Check header
      expect(getByText('Healthcare Dashboard')).toBeTruthy();
      expect(getByText('Dr. Test User')).toBeTruthy();
      
      // Check components are rendered
      expect(getByTestId('mock-HospitalSwitcher')).toBeTruthy();
      expect(getByTestId('mock-ShiftStatus')).toBeTruthy();
      expect(getByTestId('mock-MetricsOverview')).toBeTruthy();
      expect(getByTestId('mock-AlertSummaryEnhanced')).toBeTruthy();
      expect(getByTestId('mock-ActivePatients')).toBeTruthy();
    });
  });

  it('should show create alert button for operators', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, role: 'operator' },
      hasHydrated: true,
      isRefreshing: false,
    });

    const { getByText } = render(<HealthcareDashboard />);
    
    await waitFor(() => {
      expect(getByText('🚨 Create Emergency Alert')).toBeTruthy();
    });
  });

  it('should not show active patients for non-doctors', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, role: 'nurse' },
      hasHydrated: true,
      isRefreshing: false,
    });

    const { queryByTestId } = render(<HealthcareDashboard />);
    
    await waitFor(() => {
      expect(queryByTestId('mock-ActivePatients')).toBeNull();
    });
  });

  it('should navigate to settings when complete profile is pressed', () => {
    const router = require('expo-router').router;
    
    (useHospitalPermissions as jest.Mock).mockReturnValue({
      hasHospitalAssigned: false,
      isLoading: false,
    });

    const { getByText } = render(<HealthcareDashboard />);
    
    const button = getByText('Complete Your Profile');
    fireEvent.press(button);
    
    expect(router.push).toHaveBeenCalledWith('/settings');
  });
});