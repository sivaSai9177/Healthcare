import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { AuthProvider } from '@/hooks/useAuth';
import { authClient } from '@/lib/auth/auth-client';
import { showErrorAlert, showSuccessAlert } from '@/lib/core/alert';

// Mock dependencies
jest.mock('expo-auth-session');
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));
jest.mock('@/lib/auth/auth-client');
jest.mock('@/lib/alert');
jest.mock('@/hooks/useAuth', () => ({
  ...jest.requireActual('@/hooks/useAuth'),
  useAuth: () => ({
    refreshUser: jest.fn(),
  }),
}));

const mockAuthSession = AuthSession as jest.Mocked<typeof AuthSession>;
const mockAuthClient = authClient as jest.Mocked<typeof authClient>;
const mockShowErrorAlert = showErrorAlert as jest.MockedFunction<typeof showErrorAlert>;
const mockShowSuccessAlert = showSuccessAlert as jest.MockedFunction<typeof showSuccessAlert>;

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Google OAuth Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AuthSession
    mockAuthSession.useAutoDiscovery.mockReturnValue({
      authorizationEndpoint: 'https://accounts.google.com/oauth/authorize',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
    } as any);

    mockAuthSession.makeRedirectUri.mockReturnValue('https://auth.expo.io/@test/test');
    
    // Mock auth client session
    mockAuthClient.useSession.mockReturnValue({
      data: null,
      isPending: false,
      refetch: jest.fn(),
    });
  });

  describe('Mobile OAuth Flow', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', {
        writable: true,
        value: 'ios',
      });
    });

    it('should handle successful mobile OAuth', async () => {
      const mockPromptAsync = jest.fn();
      const mockRequest = { 
        url: 'https://example.com/auth',
        codeChallenge: 'test-challenge',
      };

      mockAuthSession.useAuthRequest.mockReturnValue([
        mockRequest,
        null,
        mockPromptAsync,
      ]);

      // Mock successful OAuth response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(
        <AuthProvider>
          <GoogleSignInButton />
        </AuthProvider>
      );

      // Trigger sign in
      const button = screen.getByText('Continue with Google');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockPromptAsync).toHaveBeenCalled();
      });

      // Simulate successful OAuth response
      const successResponse = {
        type: 'success',
        params: {
          code: 'test-auth-code',
          state: 'test-state',
        },
      };

      // Mock the useAuthRequest hook to return the response
      mockAuthSession.useAuthRequest.mockReturnValue([
        mockRequest,
        successResponse as any,
        mockPromptAsync,
      ]);

      // Re-render to trigger the useEffect
      render(
        <AuthProvider>
          <GoogleSignInButton />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/google-mobile-callback'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: 'test-auth-code',
              redirectUri: 'https://auth.expo.io/@test/test',
              state: 'test-state',
              type: 'authorization_code',
            }),
          })
        );
      });

      expect(mockShowSuccessAlert).toHaveBeenCalledWith(
        'Welcome!',
        'Successfully signed in with Google'
      );
    });

    it('should handle mobile OAuth error', async () => {
      const mockPromptAsync = jest.fn();
      const mockRequest = { url: 'https://example.com/auth' };
      
      // Mock error response
      const errorResponse = {
        type: 'error',
        error: {
          message: 'OAuth error occurred',
        },
      };

      mockAuthSession.useAuthRequest.mockReturnValue([
        mockRequest,
        errorResponse as any,
        mockPromptAsync,
      ]);

      render(
        <AuthProvider>
          <GoogleSignInButton />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockShowErrorAlert).toHaveBeenCalledWith(
          'Sign In Failed',
          'OAuth error: OAuth error occurred'
        );
      });
    });

    it('should handle mobile OAuth cancellation', async () => {
      const mockPromptAsync = jest.fn();
      const mockRequest = { url: 'https://example.com/auth' };
      
      // Mock cancel response
      const cancelResponse = {
        type: 'cancel',
      };

      mockAuthSession.useAuthRequest.mockReturnValue([
        mockRequest,
        cancelResponse as any,
        mockPromptAsync,
      ]);

      render(
        <AuthProvider>
          <GoogleSignInButton />
        </AuthProvider>
      );

      // Should not show any error for cancellation
      expect(mockShowErrorAlert).not.toHaveBeenCalled();
      expect(mockShowSuccessAlert).not.toHaveBeenCalled();
    });

    it('should handle mobile OAuth callback API error', async () => {
      const mockPromptAsync = jest.fn();
      const mockRequest = { url: 'https://example.com/auth' };

      // Mock API error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid authorization code' }),
      } as Response);

      const successResponse = {
        type: 'success',
        params: {
          code: 'invalid-code',
          state: 'test-state',
        },
      };

      mockAuthSession.useAuthRequest.mockReturnValue([
        mockRequest,
        successResponse as any,
        mockPromptAsync,
      ]);

      render(
        <AuthProvider>
          <GoogleSignInButton />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockShowErrorAlert).toHaveBeenCalledWith(
          'Sign In Failed',
          'Invalid authorization code'
        );
      });
    });
  });

  describe('Web OAuth Flow', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', {
        writable: true,
        value: 'web',
      });

      // Mock window object
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          href: '',
          origin: 'http://localhost:8081',
          pathname: '/login',
        },
      });

      Object.defineProperty(window, 'sessionStorage', {
        writable: true,
        value: {
          setItem: jest.fn(),
          getItem: jest.fn(),
        },
      });
    });

    it('should handle successful web OAuth initialization', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          url: 'https://accounts.google.com/oauth/authorize?client_id=test&redirect_uri=test' 
        }),
      } as Response);

      mockAuthSession.useAuthRequest.mockReturnValue([
        null, // no request for web
        null, // no response
        jest.fn(),
      ]);

      render(
        <AuthProvider>
          <GoogleSignInButton />
        </AuthProvider>
      );

      const button = screen.getByText('Continue with Google');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/auth/sign-in/social',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              provider: 'google',
              callbackURL: 'http://localhost:8081/',
            }),
            credentials: 'include',
          })
        );
      });

      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'auth_redirect_path',
        '/login'
      );
    });

    it('should handle web OAuth initialization error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      } as Response);

      mockAuthSession.useAuthRequest.mockReturnValue([
        null,
        null,
        jest.fn(),
      ]);

      render(
        <AuthProvider>
          <GoogleSignInButton />
        </AuthProvider>
      );

      const button = screen.getByText('Continue with Google');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockShowErrorAlert).toHaveBeenCalledWith(
          'Sign In Failed',
          'Server error'
        );
      });
    });

    it('should handle missing OAuth URL in web response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }), // No URL field
      } as Response);

      mockAuthSession.useAuthRequest.mockReturnValue([
        null,
        null,
        jest.fn(),
      ]);

      render(
        <AuthProvider>
          <GoogleSignInButton />
        </AuthProvider>
      );

      const button = screen.getByText('Continue with Google');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockShowErrorAlert).toHaveBeenCalledWith(
          'Sign In Failed',
          'No OAuth URL received from server'
        );
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during OAuth process', async () => {
      Object.defineProperty(Platform, 'OS', {
        writable: true,
        value: 'ios',
      });

      const mockPromptAsync = jest.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      mockAuthSession.useAuthRequest.mockReturnValue([
        { url: 'https://example.com/auth' },
        null,
        mockPromptAsync,
      ]);

      render(
        <AuthProvider>
          <GoogleSignInButton />
        </AuthProvider>
      );

      const button = screen.getByText('Continue with Google');
      fireEvent.press(button);

      // Should show loading after pressing
      await waitFor(() => {
        expect(screen.queryByText('Continue with Google')).toBeNull();
      });
    });

    it('should disable button when auth request is not ready', () => {
      Object.defineProperty(Platform, 'OS', {
        writable: true,
        value: 'ios',
      });

      // Mock null request (not ready)
      mockAuthSession.useAuthRequest.mockReturnValue([
        null,
        null,
        jest.fn(),
      ]);

      render(
        <AuthProvider>
          <GoogleSignInButton />
        </AuthProvider>
      );

      const button = screen.getByText('Continue with Google');
      expect(button.parent?.props.disabled).toBe(true);
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      Object.defineProperty(Platform, 'OS', {
        writable: true,
        value: 'ios',
      });

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const successResponse = {
        type: 'success',
        params: {
          code: 'test-code',
          state: 'test-state',
        },
      };

      mockAuthSession.useAuthRequest.mockReturnValue([
        { url: 'https://example.com/auth' },
        successResponse as any,
        jest.fn(),
      ]);

      render(
        <AuthProvider>
          <GoogleSignInButton />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockShowErrorAlert).toHaveBeenCalledWith(
          'Sign In Failed',
          'Network error'
        );
      });
    });

    it('should handle missing authorization code', async () => {
      Object.defineProperty(Platform, 'OS', {
        writable: true,
        value: 'ios',
      });

      const successResponse = {
        type: 'success',
        params: {
          // Missing code
          state: 'test-state',
        },
      };

      mockAuthSession.useAuthRequest.mockReturnValue([
        { url: 'https://example.com/auth' },
        successResponse as any,
        jest.fn(),
      ]);

      render(
        <AuthProvider>
          <GoogleSignInButton />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockShowErrorAlert).toHaveBeenCalledWith(
          'Sign In Failed',
          'No authorization code received from OAuth'
        );
      });
    });
  });
});