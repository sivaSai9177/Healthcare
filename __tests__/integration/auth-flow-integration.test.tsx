import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { authClient } from '@/lib/auth/auth-client';
import { TRPCProvider } from '@/lib/trpc';

// Mock dependencies
jest.mock('expo-router');
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

// Complete auth flow test component
const AuthFlowTestComponent = () => {
  const { user, signUp, signIn, isAuthenticated, isLoading } = useAuth();
  const [step, setStep] = React.useState<'signup' | 'login' | 'home'>('signup');

  const handleSignUp = async () => {
    try {
      await signUp({
        email: 'test@hospital.com',
        password: 'TestPass123',
        name: 'Test User',
        role: 'doctor',
      });
      setStep('home');
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn('test@hospital.com', 'TestPass123');
      setStep('home');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isLoading) {
    return <div testID="loading">Loading...</div>;
  }

  return (
    <div testID="auth-flow-test">
      <div testID="auth-status">
        Status: {isAuthenticated ? 'authenticated' : 'not authenticated'}
      </div>
      
      {user && (
        <div testID="user-info">
          User: {user.email} ({user.role})
        </div>
      )}

      {step === 'signup' && (
        <div testID="signup-form">
          <button testID="signup-btn" onPress={handleSignUp}>
            Sign Up
          </button>
          <button testID="go-to-login" onPress={() => setStep('login')}>
            Go to Login
          </button>
        </div>
      )}

      {step === 'login' && (
        <div testID="login-form">
          <button testID="login-btn" onPress={handleSignIn}>
            Sign In
          </button>
          <button testID="go-to-signup" onPress={() => setStep('signup')}>
            Go to Signup
          </button>
        </div>
      )}

      {step === 'home' && isAuthenticated && (
        <div testID="home-screen">
          Welcome to Home! User: {user?.email}
        </div>
      )}
    </div>
  );
};

// Test wrapper
const TestWrapper = ({ 
  initialSession = null,
  signupSuccess = true,
  loginSuccess = true 
}: { 
  initialSession?: any;
  signupSuccess?: boolean;
  loginSuccess?: boolean;
}) => {
  // Setup auth client mocks
  const mockRefetch = jest.fn();
  
  mockAuthClient.useSession.mockReturnValue({
    data: initialSession,
    isPending: false,
    refetch: mockRefetch,
  });

  if (signupSuccess) {
    mockAuthClient.$fetch.mockResolvedValue({ success: true });
    mockAuthClient.signIn.email.mockImplementation((credentials, callbacks) => {
      if (callbacks?.onSuccess) {
        callbacks.onSuccess();
      }
      return Promise.resolve();
    });
  } else {
    mockAuthClient.$fetch.mockRejectedValue(new Error('Signup failed'));
    mockAuthClient.signIn.email.mockImplementation((credentials, callbacks) => {
      if (callbacks?.onError) {
        callbacks.onError({ error: new Error('Login failed') });
      }
      return Promise.reject(new Error('Login failed'));
    });
  }

  return (
    <TRPCProvider>
      <AuthProvider>
        <AuthFlowTestComponent />
      </AuthProvider>
    </TRPCProvider>
  );
};

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
  });

  describe('Complete Signup → Auto Login → Home Flow', () => {
    it('should signup, auto-login, and show authenticated state', async () => {
      render(<TestWrapper signupSuccess={true} />);

      // Initial state should be not authenticated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not authenticated');
      expect(screen.getByTestId('signup-form')).toBeTruthy();

      // Click signup
      const signupBtn = screen.getByTestId('signup-btn');
      fireEvent.press(signupBtn);

      // Wait for signup and auto-login to complete
      await waitFor(() => {
        expect(mockAuthClient.$fetch).toHaveBeenCalledWith('/sign-up/email', {
          method: 'POST',
          body: {
            email: 'test@hospital.com',
            password: 'TestPass123',
            name: 'Test User',
            role: 'doctor',
          },
        });
      });

      await waitFor(() => {
        expect(mockAuthClient.signIn.email).toHaveBeenCalledWith(
          { email: 'test@hospital.com', password: 'TestPass123' },
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });

      // Should show home screen after successful auth
      await waitFor(() => {
        expect(screen.getByTestId('home-screen')).toBeTruthy();
      });
    });

    it('should handle signup failure gracefully', async () => {
      render(<TestWrapper signupSuccess={false} />);

      const signupBtn = screen.getByTestId('signup-btn');
      fireEvent.press(signupBtn);

      await waitFor(() => {
        expect(mockAuthClient.$fetch).toHaveBeenCalled();
      });

      // Should remain on signup form
      expect(screen.getByTestId('signup-form')).toBeTruthy();
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not authenticated');
    });
  });

  describe('Manual Login Flow', () => {
    it('should login manually and show authenticated state', async () => {
      render(<TestWrapper signupSuccess={true} />);

      // Go to login form
      const goToLoginBtn = screen.getByTestId('go-to-login');
      fireEvent.press(goToLoginBtn);

      expect(screen.getByTestId('login-form')).toBeTruthy();

      // Click login
      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.press(loginBtn);

      await waitFor(() => {
        expect(mockAuthClient.signIn.email).toHaveBeenCalledWith(
          { email: 'test@hospital.com', password: 'TestPass123' },
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });

      // Should show home screen
      await waitFor(() => {
        expect(screen.getByTestId('home-screen')).toBeTruthy();
      });
    });

    it('should handle login failure gracefully', async () => {
      render(<TestWrapper signupSuccess={false} />);

      // Go to login form
      const goToLoginBtn = screen.getByTestId('go-to-login');
      fireEvent.press(goToLoginBtn);

      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.press(loginBtn);

      await waitFor(() => {
        expect(mockAuthClient.signIn.email).toHaveBeenCalled();
      });

      // Should remain on login form
      expect(screen.getByTestId('login-form')).toBeTruthy();
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not authenticated');
    });
  });

  describe('Session Persistence', () => {
    it('should maintain authentication state with existing session', () => {
      const existingSession = {
        user: {
          id: '1',
          email: 'test@hospital.com',
          name: 'Test User',
          role: 'doctor',
          emailVerified: true,
        },
      };

      render(<TestWrapper initialSession={existingSession} />);

      // Should immediately show authenticated state
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('test@hospital.com (doctor)');
    });

    it('should show signup form when no session exists', () => {
      render(<TestWrapper initialSession={null} />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not authenticated');
      expect(screen.getByTestId('signup-form')).toBeTruthy();
    });
  });

  describe('Navigation Integration', () => {
    it('should not trigger manual navigation during auth flow', async () => {
      render(<TestWrapper signupSuccess={true} />);

      const signupBtn = screen.getByTestId('signup-btn');
      fireEvent.press(signupBtn);

      await waitFor(() => {
        expect(mockAuthClient.$fetch).toHaveBeenCalled();
        expect(mockAuthClient.signIn.email).toHaveBeenCalled();
      });

      // Manual router.replace should NOT be called from login/signup components
      expect(mockRouter.replace).not.toHaveBeenCalledWith('/(home)');
    });
  });

  describe('Error Recovery', () => {
    it('should recover from network errors during signup', async () => {
      const mockFetch = mockAuthClient.$fetch;
      
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true });

      render(<TestWrapper signupSuccess={true} />);

      const signupBtn = screen.getByTestId('signup-btn');
      
      // First attempt fails
      fireEvent.press(signupBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('signup-form')).toBeTruthy();
      });

      // Second attempt succeeds
      fireEvent.press(signupBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('home-screen')).toBeTruthy();
      });
    });
  });
});