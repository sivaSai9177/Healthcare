import * as React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AlertSoundSettings } from './AlertSoundSettings';

// Mock dependencies
jest.mock('@/lib/api/trpc', () => ({
  api: {
    user: {
      getPreferences: {
        useQuery: () => ({
          data: null,
          refetch: jest.fn(),
        }),
      },
      updatePreferences: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
        }),
      },
    },
  },
}));

jest.mock('@/lib/theme/provider', () => ({
  useTheme: () => ({
    primary: '#000',
    border: '#ccc',
    destructive: '#f00',
  }),
}));

jest.mock('@/lib/stores/spacing-store', () => ({
  useSpacing: () => ({
    spacing: {
      1: 4,
      2: 8,
      3: 12,
      4: 16,
    },
  }),
}));

jest.mock('@/lib/ui/haptics', () => ({
  haptic: jest.fn(),
}));

jest.mock('@/lib/core/alert', () => ({
  showSuccessAlert: jest.fn(),
  showErrorAlert: jest.fn(),
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({
        sound: {
          playAsync: jest.fn(),
          unloadAsync: jest.fn(),
        },
      })),
    },
  },
}));

describe('AlertSoundSettings', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<AlertSoundSettings />);
    expect(getByText('Alert Sounds')).toBeTruthy();
  });

  it('toggles sound enabled state', () => {
    const { getByText, getAllByRole } = render(<AlertSoundSettings />);
    const switches = getAllByRole('switch');
    
    // First switch should be the master toggle
    fireEvent(switches[0], 'valueChange', false);
    
    // Volume control should not be visible when disabled
    expect(() => getByText('Volume')).toThrow();
  });

  it('shows quiet hours options when enabled', () => {
    const { getByText, getAllByRole } = render(<AlertSoundSettings />);
    const switches = getAllByRole('switch');
    
    // Find and toggle quiet hours switch
    const quietHoursSwitch = switches.find((_, index) => index === 1);
    if (quietHoursSwitch) {
      fireEvent(quietHoursSwitch, 'valueChange', true);
      
      expect(getByText('Start Time')).toBeTruthy();
      expect(getByText('End Time')).toBeTruthy();
    }
  });

  it('displays all alert types', () => {
    const { getByText } = render(<AlertSoundSettings />);
    
    expect(getByText('cardiac arrest')).toBeTruthy();
    expect(getByText('code blue')).toBeTruthy();
    expect(getByText('fire')).toBeTruthy();
    expect(getByText('security')).toBeTruthy();
    expect(getByText('medical emergency')).toBeTruthy();
  });
});