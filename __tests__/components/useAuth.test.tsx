import React from 'react';
import { render, renderHook, waitFor, act } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { AuthProvider, useAuth, useRequireAuth, useRequireRole } from '../../hooks/useAuth';
import { authClient } from '@/lib/auth/auth-client';
import { showErrorAlert } from '@/lib/core/alert';

// Mock dependencies
jest.mock('expo-router');
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));
jest.mock('@/lib/auth/auth-client');
jest.mock('@/lib/alert');

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
  back: jest.fn(),
};

const mockAuthClient = authClient as jest.Mocked<typeof authClient>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;
const mockShowErrorAlert = showErrorAlert as jest.MockedFunction<typeof showErrorAlert>;

// Test wrapper component
const createWrapper = (initialSession: any = null) => {
  // Setup the session hook mock
  mockAuthClient.useSession.mockReturnValue({
    data: initialSession,
    isPending: false,
    refetch: jest.fn(),
  });

  return ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
  });

  describe('Context Provider', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleError.mockRestore();
    });

    it('should provide auth context when used within AuthProvider', () => {
      const wrapper = createWrapper();
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(typeof result.current.signIn).toBe('function');
      expect(typeof result.current.signUp).toBe('function');
      expect(typeof result.current.signOut).toBe('function');
      expect(typeof result.current.refreshSession).toBe('function');
    });
  });

  describe('Session Management', () => {
    it('should set user when session data is available', () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'doctor',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
      };

      const wrapper = createWrapper(mockSession);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'doctor',
        hospitalId: 'hospital-1',
        emailVerified: true,
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle session loading state', () => {
      mockAuthClient.useSession.mockReturnValue({
        data: null,
        isPending: true,
        refetch: jest.fn(),
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set default role when role is missing from session', () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: false,
        },
      };

      const wrapper = createWrapper(mockSession);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user?.role).toBe('doctor');
    });
  });

  describe('Sign In', () => {
    it('should sign in successfully', async () => {
      const mockRefetch = jest.fn();
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

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockAuthClient.signIn.email).toHaveBeenCalledWith(
        { email: 'test@example.com', password: 'password123' },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
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

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.signIn('test@example.com', 'wrongpassword');
        })
      ).rejects.toThrow('Invalid credentials');

      expect(mockAlert).toHaveBeenCalledWith(
        'Sign In Failed',
        'Invalid credentials'
      );
    });
  });

  describe('Sign Up', () => {
    it('should sign up successfully and auto-login', async () => {
      const mockResponse = { success: true };
      mockAuthClient.$fetch.mockResolvedValue(mockResponse);
      
      // Mock successful sign in after signup
      mockAuthClient.signIn.email.mockImplementation((credentials, callbacks) => {
        if (callbacks?.onSuccess) {
          callbacks.onSuccess();
        }
        return Promise.resolve();
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      const signupData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: 'nurse' as const,
        hospitalId: 'hospital-1',
      };

      await act(async () => {
        await result.current.signUp(signupData);
      });

      expect(mockAuthClient.$fetch).toHaveBeenCalledWith('/sign-up/email', {
        method: 'POST',
        body: signupData,
      });

      expect(mockAuthClient.signIn.email).toHaveBeenCalledWith(
        { email: signupData.email, password: signupData.password },
        expect.any(Object)
      );
    });

    it('should handle sign up error', async () => {
      const mockError = new Error('Email already exists');
      mockAuthClient.$fetch.mockRejectedValue(mockError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      const signupData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
        role: 'doctor' as const,
      };

      await expect(
        act(async () => {
          await result.current.signUp(signupData);
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      const mockRefetch = jest.fn();
      mockAuthClient.useSession.mockReturnValue({
        data: { user: { id: '1', email: 'test@example.com' } },
        isPending: false,
        refetch: mockRefetch,
      });

      mockAuthClient.signOut.mockImplementation((options, callbacks) => {
        if (callbacks?.onSuccess) {
          callbacks.onSuccess();
        }
        return Promise.resolve();
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockAuthClient.signOut).toHaveBeenCalled();
      expect(mockRefetch).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
    });

    it('should handle sign out error gracefully', async () => {
      const mockError = new Error('Network error');
      mockAuthClient.signOut.mockImplementation((options, callbacks) => {
        if (callbacks?.onError) {
          callbacks.onError({ error: mockError });
        }
        return Promise.reject(mockError);
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
      expect(mockAlert).toHaveBeenCalledWith(
        'Sign Out Warning',
        expect.stringContaining('logged out locally')
      );
    });

    it('should clear user state immediately on logout', async () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'doctor',
        },
      };

      const wrapper = createWrapper(mockSession);
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially authenticated
      expect(result.current.isAuthenticated).toBe(true);

      mockAuthClient.signOut.mockImplementation((options, callbacks) => {
        if (callbacks?.onSuccess) {
          callbacks.onSuccess();
        }
        return Promise.resolve();
      });

      await act(async () => {
        await result.current.signOut();
      });

      // Should be immediately cleared for better UX
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Session Refresh', () => {
    it('should refresh session', async () => {
      const mockRefetch = jest.fn();
      mockAuthClient.useSession.mockReturnValue({
        data: null,
        isPending: false,
        refetch: mockRefetch,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});

describe('useRequireAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
  });

  it('should redirect to login when user is not authenticated', async () => {
    const wrapper = createWrapper(); // No session
    const { result } = renderHook(() => useRequireAuth(), { wrapper });

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should not redirect when user is authenticated', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'doctor',
      },
    };

    const wrapper = createWrapper(mockSession);
    const { result } = renderHook(() => useRequireAuth(), { wrapper });

    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(result.current.user).toBeDefined();
  });

  it('should not redirect during loading', () => {
    mockAuthClient.useSession.mockReturnValue({
      data: null,
      isPending: true,
      refetch: jest.fn(),
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useRequireAuth(), { wrapper });

    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(true);
  });

  it('should use custom redirect path', async () => {
    const wrapper = createWrapper(); // No session
    const { result } = renderHook(() => useRequireAuth('/custom-login'), { wrapper });

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/custom-login');
    });
  });
});

describe('useRequireRole Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
  });

  it('should allow access for authorized role', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'doctor@example.com',
        name: 'Dr. Smith',
        role: 'doctor',
      },
    };

    const wrapper = createWrapper(mockSession);
    const { result } = renderHook(
      () => useRequireRole(['doctor', 'head_doctor']),
      { wrapper }
    );

    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockAlert).not.toHaveBeenCalled();
    expect(result.current.hasAccess).toBe(true);
    expect(result.current.user).toBeDefined();
  });

  it('should deny access and redirect for unauthorized role', async () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'nurse@example.com',
        name: 'Nurse Jane',
        role: 'nurse',
      },
    };

    const wrapper = createWrapper(mockSession);
    const { result } = renderHook(
      () => useRequireRole(['operator', 'head_doctor']),
      { wrapper }
    );

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Access Denied',
        "You don't have permission to access this page"
      );
      expect(mockRouter.replace).toHaveBeenCalledWith('/(home)');
    });

    expect(result.current.hasAccess).toBe(false);
  });

  it('should not check roles during loading', () => {
    mockAuthClient.useSession.mockReturnValue({
      data: null,
      isPending: true,
      refetch: jest.fn(),
    });

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useRequireRole(['doctor']),
      { wrapper }
    );

    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockAlert).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(true);
  });

  it('should use custom redirect path', async () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'nurse@example.com',
        name: 'Nurse Jane',
        role: 'nurse',
      },
    };

    const wrapper = createWrapper(mockSession);
    const { result } = renderHook(
      () => useRequireRole(['operator'], '/unauthorized'),
      { wrapper }
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/unauthorized');
    });
  });

  it('should handle user with no role gracefully', async () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        // No role property
      },
    };

    const wrapper = createWrapper(mockSession);
    const { result } = renderHook(
      () => useRequireRole(['doctor']),
      { wrapper }
    );

    // Should get default role 'doctor' and have access
    expect(result.current.hasAccess).toBe(true);
  });
});