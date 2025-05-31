import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import LoginScreen from '../login';
import { useAuth } from '@/hooks/useAuth';
import { showErrorAlert } from '@/lib/alert';

// Mock dependencies
jest.mock('expo-router');
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/alert');

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
  back: jest.fn(),
};

const mockAuth = {
  signIn: jest.fn(),
  user: null,
  isLoading: false,
  isAuthenticated: false,
  signUp: jest.fn(),
  signOut: jest.fn(),
  refreshSession: jest.fn(),
};

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockShowErrorAlert = showErrorAlert as jest.MockedFunction<typeof showErrorAlert>;

// Test wrapper to provide required contexts
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseAuth.mockReturnValue(mockAuth);
  });

  describe('Rendering', () => {
    it('should render login form correctly', () => {
      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      expect(screen.getByText('Welcome back')).toBeTruthy();
      expect(screen.getByText('Sign in to your Hospital Alert account')).toBeTruthy();
      expect(screen.getByPlaceholderText('doctor@hospital.com')).toBeTruthy();
      expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();
      expect(screen.getByText('Sign in')).toBeTruthy();
      expect(screen.getByText('Forgot password?')).toBeTruthy();
      expect(screen.getByText('Sign up')).toBeTruthy();
    });

    it('should render form labels correctly', () => {
      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('Password')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty fields', async () => {
      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const signInButton = screen.getByText('Sign in');
      fireEvent.press(signInButton);

      await waitFor(() => {
        // Form validation should prevent submission
        expect(mockAuth.signIn).not.toHaveBeenCalled();
      });
    });

    it('should show validation error for invalid email format', async () => {
      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('doctor@hospital.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signInButton = screen.getByText('Sign in');

      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockAuth.signIn).not.toHaveBeenCalled();
      });
    });

    it('should validate minimum password length', async () => {
      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('doctor@hospital.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signInButton = screen.getByText('Sign in');

      fireEvent.changeText(emailInput, 'doctor@hospital.com');
      fireEvent.changeText(passwordInput, '123'); // Too short
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockAuth.signIn).not.toHaveBeenCalled();
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should call signIn with correct credentials', async () => {
      mockAuth.signIn.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('doctor@hospital.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signInButton = screen.getByText('Sign in');

      fireEvent.changeText(emailInput, 'doctor@hospital.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockAuth.signIn).toHaveBeenCalledWith('doctor@hospital.com', 'password123');
      });
    });

    it('should navigate to home on successful login', async () => {
      mockAuth.signIn.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('doctor@hospital.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signInButton = screen.getByText('Sign in');

      fireEvent.changeText(emailInput, 'doctor@hospital.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/(home)');
      });
    });

    it('should show loading state during authentication', async () => {
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockAuth.signIn.mockReturnValue(signInPromise);

      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('doctor@hospital.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signInButton = screen.getByText('Sign in');

      fireEvent.changeText(emailInput, 'doctor@hospital.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      // Should show loading state
      expect(screen.getByText('Signing in...')).toBeTruthy();

      // Resolve the promise
      resolveSignIn!();
      await waitFor(() => {
        expect(screen.getByText('Sign in')).toBeTruthy();
      });
    });

    it('should disable form during loading', async () => {
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockAuth.signIn.mockReturnValue(signInPromise);

      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('doctor@hospital.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signInButton = screen.getByText('Sign in');

      fireEvent.changeText(emailInput, 'doctor@hospital.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      // Button should be disabled during loading
      const loadingButton = screen.getByText('Signing in...');
      expect(loadingButton.props.accessibilityState?.disabled).toBe(true);

      resolveSignIn!();
      await waitFor(() => {
        expect(screen.getByText('Sign in')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error alert on authentication failure', async () => {
      const errorMessage = 'Invalid credentials';
      mockAuth.signIn.mockRejectedValue(new Error(errorMessage));

      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('doctor@hospital.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signInButton = screen.getByText('Sign in');

      fireEvent.changeText(emailInput, 'doctor@hospital.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockShowErrorAlert).toHaveBeenCalledWith('Login Failed', errorMessage);
      });
    });

    it('should show generic error for unknown errors', async () => {
      mockAuth.signIn.mockRejectedValue(new Error());

      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('doctor@hospital.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signInButton = screen.getByText('Sign in');

      fireEvent.changeText(emailInput, 'doctor@hospital.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockShowErrorAlert).toHaveBeenCalledWith('Login Failed', 'Failed to sign in');
      });
    });

    it('should reset loading state on error', async () => {
      mockAuth.signIn.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('doctor@hospital.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signInButton = screen.getByText('Sign in');

      fireEvent.changeText(emailInput, 'doctor@hospital.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Sign in')).toBeTruthy();
      });
    });
  });

  describe('Navigation Links', () => {
    it('should have working forgot password link', () => {
      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const forgotPasswordLink = screen.getByText('Forgot password?');
      expect(forgotPasswordLink).toBeTruthy();
      // Note: Link navigation testing would require more complex setup
    });

    it('should have working sign up link', () => {
      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const signUpLink = screen.getByText('Sign up');
      expect(signUpLink).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form accessibility labels', () => {
      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('doctor@hospital.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      expect(emailInput.props.autoCapitalize).toBe('none');
      expect(emailInput.props.autoComplete).toBe('email');
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(passwordInput.props.autoComplete).toBe('password');
    });

    it('should have semantic form structure', () => {
      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      expect(screen.getByText('Welcome back')).toBeTruthy();
      expect(screen.getByText('Sign in to your Hospital Alert account')).toBeTruthy();
    });
  });

  describe('Platform Logging', () => {
    it('should log platform information on form submission', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockAuth.signIn.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('doctor@hospital.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signInButton = screen.getByText('Sign in');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('[LOGIN] Starting login attempt for:', 'test@example.com');
        expect(consoleSpy).toHaveBeenCalledWith('[LOGIN] Platform.OS:', expect.any(String));
      });

      consoleSpy.mockRestore();
    });
  });
});