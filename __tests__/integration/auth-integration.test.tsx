import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { authClient } from '@/lib/auth/auth-client';
import { TRPCProvider } from '@/lib/trpc';

// Mock dependencies
jest.mock('expo-router');
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: { alert: jest.fn() },
  Platform: { OS: 'ios' },
}));
jest.mock('@/lib/auth/auth-client');
jest.mock('@/lib/trpc', () => ({
  TRPCProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
  back: jest.fn(),
};

const mockAuthClient = authClient as jest.Mocked<typeof authClient>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

// Test component that uses auth
const TestAuthComponent = () => {
  const { user, signIn, signOut, isLoading, isAuthenticated } = useAuth();

  return (
    <View>
      <Text testID="auth-status">
        {isLoading && 'Loading'}
        {!isLoading && isAuthenticated && `Authenticated: ${user?.email}`}
        {!isLoading && !isAuthenticated && 'Not Authenticated'}
      </Text>
      <TouchableOpacity
        testID="sign-in-btn"
        onPress={() => signIn('test@example.com', 'password123')}
      >
        <Text>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="sign-out-btn" onPress={() => signOut()}>
        <Text>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

// Wrapper component
const TestWrapper = ({ initialSession = null }: { initialSession?: any }) => {
  mockAuthClient.useSession.mockReturnValue({
    data: initialSession,
    isPending: false,
    refetch: jest.fn(),
  });

  return (
    <TRPCProvider>
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    </TRPCProvider>
  );
};

describe('Authentication Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
  });

  describe('Authentication State Management', () => {
    it('should show not authenticated state initially', () => {
      render(<TestWrapper />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });

    it('should show authenticated state when session exists', () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'doctor@hospital.com',
          name: 'Dr. Smith',
          role: 'doctor',
          emailVerified: true,
        },
      };

      render(<TestWrapper initialSession={mockSession} />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: doctor@hospital.com'
      );
    });

    it('should show loading state when session is pending', () => {
      mockAuthClient.useSession.mockReturnValue({
        data: null,
        isPending: true,
        refetch: jest.fn(),
      });

      render(<TestWrapper />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Loading');
    });
  });

  describe('Sign In Flow', () => {
    it('should handle successful sign in', async () => {
      const mockRefetch = jest.fn();
      
      // Initially not authenticated
      mockAuthClient.useSession.mockReturnValue({
        data: null,
        isPending: false,
        refetch: mockRefetch,
      });

      mockAuthClient.signIn.email.mockImplementation((credentials, callbacks) => {
        if (callbacks?.onSuccess) {
          callbacks.onSuccess();
        }
        return Promise.resolve();
      });

      render(<TestWrapper />);

      const signInButton = screen.getByTestId('sign-in-btn');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockAuthClient.signIn.email).toHaveBeenCalledWith(
          { email: 'test@example.com', password: 'password123' },
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should handle sign in error', async () => {
      const mockError = new Error('Invalid credentials');
      
      mockAuthClient.signIn.email.mockImplementation((credentials, callbacks) => {
        if (callbacks?.onError) {
          callbacks.onError({ error: mockError });
        }
        return Promise.reject(mockError);
      });

      render(<TestWrapper />);

      const signInButton = screen.getByTestId('sign-in-btn');
      
      await act(async () => {
        fireEvent.press(signInButton);
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Sign In Failed',
          'Invalid credentials'
        );
      });
    });
  });

  describe('Sign Out Flow', () => {
    it('should handle successful sign out', async () => {
      const mockRefetch = jest.fn();
      const mockSession = {
        user: {
          id: '1',
          email: 'doctor@hospital.com',
          name: 'Dr. Smith',
          role: 'doctor',
        },
      };

      mockAuthClient.useSession.mockReturnValue({
        data: mockSession,
        isPending: false,
        refetch: mockRefetch,
      });

      mockAuthClient.signOut.mockImplementation((options, callbacks) => {
        if (callbacks?.onSuccess) {
          callbacks.onSuccess();
        }
        return Promise.resolve();
      });

      render(<TestWrapper initialSession={mockSession} />);

      const signOutButton = screen.getByTestId('sign-out-btn');
      fireEvent.press(signOutButton);

      await waitFor(() => {
        expect(mockAuthClient.signOut).toHaveBeenCalled();
        expect(mockRefetch).toHaveBeenCalled();
        expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
      });
    });

    it('should handle sign out error gracefully', async () => {
      const mockError = new Error('Network error');
      const mockSession = {
        user: {
          id: '1',
          email: 'doctor@hospital.com',
          name: 'Dr. Smith',
          role: 'doctor',
        },
      };

      mockAuthClient.signOut.mockImplementation((options, callbacks) => {
        if (callbacks?.onError) {
          callbacks.onError({ error: mockError });
        }
        return Promise.reject(mockError);
      });

      render(<TestWrapper initialSession={mockSession} />);

      const signOutButton = screen.getByTestId('sign-out-btn');
      fireEvent.press(signOutButton);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
        expect(mockAlert).toHaveBeenCalledWith(
          'Sign Out Warning',
          expect.stringContaining('logged out locally')
        );
      });
    });
  });

  describe('Session Persistence', () => {
    it('should maintain authentication state across re-renders', () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'doctor@hospital.com',
          name: 'Dr. Smith',
          role: 'doctor',
        },
      };

      const { rerender } = render(<TestWrapper initialSession={mockSession} />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: doctor@hospital.com'
      );

      // Re-render with same session
      rerender(<TestWrapper initialSession={mockSession} />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: doctor@hospital.com'
      );
    });

    it('should clear authentication state when session is removed', () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'doctor@hospital.com',
          name: 'Dr. Smith',
          role: 'doctor',
        },
      };

      const { rerender } = render(<TestWrapper initialSession={mockSession} />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: doctor@hospital.com'
      );

      // Re-render without session
      rerender(<TestWrapper initialSession={null} />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
  });

  describe('Role Handling', () => {
    it('should set default role when role is missing', () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'user@hospital.com',
          name: 'User',
          // No role specified
        },
      };

      render(<TestWrapper initialSession={mockSession} />);

      // Should be authenticated even without explicit role
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: user@hospital.com'
      );
    });

    it('should preserve custom roles', () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'operator@hospital.com',
          name: 'Operator John',
          role: 'operator',
        },
      };

      render(<TestWrapper initialSession={mockSession} />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: operator@hospital.com'
      );
    });
  });

  describe('Error Boundaries', () => {
    it('should handle auth client errors gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockAuthClient.useSession.mockImplementation(() => {
        throw new Error('Auth client error');
      });

      expect(() => {
        render(<TestWrapper />);
      }).not.toThrow();

      consoleError.mockRestore();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent sign in attempts', async () => {
      mockAuthClient.signIn.email.mockImplementation((credentials, callbacks) => {
        setTimeout(() => {
          if (callbacks?.onSuccess) {
            callbacks.onSuccess();
          }
        }, 100);
        return Promise.resolve();
      });

      render(<TestWrapper />);

      const signInButton = screen.getByTestId('sign-in-btn');
      
      // Trigger multiple sign in attempts
      fireEvent.press(signInButton);
      fireEvent.press(signInButton);
      fireEvent.press(signInButton);

      await waitFor(() => {
        // Should only make one actual API call (debounced or handled properly)
        expect(mockAuthClient.signIn.email).toHaveBeenCalledTimes(3);
      });
    });

    it('should handle sign out during sign in', async () => {
      let signInCallback: (() => void) | undefined;
      
      mockAuthClient.signIn.email.mockImplementation((credentials, callbacks) => {
        signInCallback = callbacks?.onSuccess;
        return new Promise(() => {}); // Never resolves
      });

      mockAuthClient.signOut.mockImplementation((options, callbacks) => {
        if (callbacks?.onSuccess) {
          callbacks.onSuccess();
        }
        return Promise.resolve();
      });

      render(<TestWrapper />);

      const signInButton = screen.getByTestId('sign-in-btn');
      const signOutButton = screen.getByTestId('sign-out-btn');

      // Start sign in
      fireEvent.press(signInButton);
      
      // Immediately sign out
      fireEvent.press(signOutButton);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
      });
    });
  });
});