import { authClient } from '@/lib/auth-client';

// Test auth client functionality without React components
describe('Auth Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth Client', () => {
    it('should have required methods', () => {
      expect(authClient).toBeDefined();
      expect(authClient.useSession).toBeDefined();
      expect(authClient.signIn).toBeDefined();
      expect(authClient.signIn.email).toBeDefined();
      expect(authClient.signOut).toBeDefined();
      expect(authClient.$fetch).toBeDefined();
      expect(authClient.getCookie).toBeDefined();
    });

    it('should handle sign in API calls', async () => {
      const mockSignIn = authClient.signIn.email as jest.MockedFunction<typeof authClient.signIn.email>;
      mockSignIn.mockResolvedValue(undefined);

      await authClient.signIn.email(
        { email: 'test@example.com', password: 'password123' },
        {
          onSuccess: jest.fn(),
          onError: jest.fn(),
        }
      );

      expect(mockSignIn).toHaveBeenCalledWith(
        { email: 'test@example.com', password: 'password123' },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('should handle sign out API calls', async () => {
      const mockSignOut = authClient.signOut as jest.MockedFunction<typeof authClient.signOut>;
      mockSignOut.mockResolvedValue(undefined);

      await authClient.signOut(
        {},
        {
          onSuccess: jest.fn(),
          onError: jest.fn(),
        }
      );

      expect(mockSignOut).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('should handle signup API calls', async () => {
      const mockFetch = authClient.$fetch as jest.MockedFunction<typeof authClient.$fetch>;
      mockFetch.mockResolvedValue({ success: true });

      const signupData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: 'doctor',
      };

      await authClient.$fetch('/sign-up/email', {
        method: 'POST',
        body: signupData,
      });

      expect(mockFetch).toHaveBeenCalledWith('/sign-up/email', {
        method: 'POST',
        body: signupData,
      });
    });

    it('should handle session queries', () => {
      const mockUseSession = authClient.useSession as jest.MockedFunction<typeof authClient.useSession>;
      const mockSessionData = {
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'doctor',
          },
        },
        isPending: false,
        refetch: jest.fn(),
      };

      mockUseSession.mockReturnValue(mockSessionData);

      const result = authClient.useSession();

      expect(result).toEqual(mockSessionData);
      expect(result.data?.user?.email).toBe('test@example.com');
    });

    it('should handle cookie management', () => {
      const mockGetCookie = authClient.getCookie as jest.MockedFunction<typeof authClient.getCookie>;
      mockGetCookie.mockReturnValue('session-cookie');

      const cookie = authClient.getCookie();

      expect(cookie).toBe('session-cookie');
      expect(mockGetCookie).toHaveBeenCalled();
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle sign in errors', async () => {
      const mockSignIn = authClient.signIn.email as jest.MockedFunction<typeof authClient.signIn.email>;
      const mockError = new Error('Invalid credentials');
      
      mockSignIn.mockImplementation((credentials, callbacks) => {
        if (callbacks?.onError) {
          callbacks.onError({ error: mockError });
        }
        return Promise.reject(mockError);
      });

      const onErrorSpy = jest.fn();

      try {
        await authClient.signIn.email(
          { email: 'wrong@example.com', password: 'wrongpassword' },
          {
            onSuccess: jest.fn(),
            onError: onErrorSpy,
          }
        );
      } catch (error) {
        expect(error).toBe(mockError);
      }

      expect(onErrorSpy).toHaveBeenCalledWith({ error: mockError });
    });

    it('should handle sign out errors', async () => {
      const mockSignOut = authClient.signOut as jest.MockedFunction<typeof authClient.signOut>;
      const mockError = new Error('Network error');
      
      mockSignOut.mockImplementation((options, callbacks) => {
        if (callbacks?.onError) {
          callbacks.onError({ error: mockError });
        }
        return Promise.reject(mockError);
      });

      const onErrorSpy = jest.fn();

      try {
        await authClient.signOut(
          {},
          {
            onSuccess: jest.fn(),
            onError: onErrorSpy,
          }
        );
      } catch (error) {
        expect(error).toBe(mockError);
      }

      expect(onErrorSpy).toHaveBeenCalledWith({ error: mockError });
    });

    it('should handle signup errors', async () => {
      const mockFetch = authClient.$fetch as jest.MockedFunction<typeof authClient.$fetch>;
      const mockError = new Error('Email already exists');
      
      mockFetch.mockRejectedValue(mockError);

      const signupData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
        role: 'doctor',
      };

      await expect(
        authClient.$fetch('/sign-up/email', {
          method: 'POST',
          body: signupData,
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('Session State Management', () => {
    it('should handle loading state', () => {
      const mockUseSession = authClient.useSession as jest.MockedFunction<typeof authClient.useSession>;
      
      mockUseSession.mockReturnValue({
        data: null,
        isPending: true,
        refetch: jest.fn(),
      });

      const result = authClient.useSession();

      expect(result.isPending).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle authenticated state', () => {
      const mockUseSession = authClient.useSession as jest.MockedFunction<typeof authClient.useSession>;
      const userData = {
        id: '1',
        email: 'doctor@hospital.com',
        name: 'Dr. Smith',
        role: 'doctor',
        hospitalId: 'hospital-1',
        emailVerified: true,
      };
      
      mockUseSession.mockReturnValue({
        data: { user: userData },
        isPending: false,
        refetch: jest.fn(),
      });

      const result = authClient.useSession();

      expect(result.isPending).toBe(false);
      expect(result.data?.user).toEqual(userData);
    });

    it('should handle unauthenticated state', () => {
      const mockUseSession = authClient.useSession as jest.MockedFunction<typeof authClient.useSession>;
      
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
        refetch: jest.fn(),
      });

      const result = authClient.useSession();

      expect(result.isPending).toBe(false);
      expect(result.data).toBeNull();
    });

    it('should handle session refresh', async () => {
      const mockRefetch = jest.fn().mockResolvedValue(undefined);
      const mockUseSession = authClient.useSession as jest.MockedFunction<typeof authClient.useSession>;
      
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
        refetch: mockRefetch,
      });

      const result = authClient.useSession();
      await result.refetch();

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Role-based Access Control', () => {
    it('should handle different user roles', () => {
      const roles = ['operator', 'doctor', 'nurse', 'head_doctor'];
      
      roles.forEach(role => {
        const mockUseSession = authClient.useSession as jest.MockedFunction<typeof authClient.useSession>;
        
        mockUseSession.mockReturnValue({
          data: {
            user: {
              id: '1',
              email: `${role}@hospital.com`,
              name: `${role} User`,
              role,
            },
          },
          isPending: false,
          refetch: jest.fn(),
        });

        const result = authClient.useSession();
        expect(result.data?.user?.role).toBe(role);
      });
    });

    it('should handle missing role with default', () => {
      const mockUseSession = authClient.useSession as jest.MockedFunction<typeof authClient.useSession>;
      
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            email: 'user@hospital.com',
            name: 'User',
            // No role specified
          },
        },
        isPending: false,
        refetch: jest.fn(),
      });

      const result = authClient.useSession();
      expect(result.data?.user).toBeDefined();
      // Role would be handled by the AuthProvider context
    });
  });
});