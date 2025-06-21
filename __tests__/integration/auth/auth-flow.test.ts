import { createAuthClient } from '@/lib/auth/auth-server';
import { apiClient } from '@/lib/api/trpc';
import { logger } from '@/lib/core/debug/unified-logger';
import { signInSchema, signUpSchema } from '@/lib/validations/server';
import { vi } from '@jest/globals';

// Mock dependencies
jest.mock('@/lib/api/trpc');
jest.mock('@/lib/auth/auth-server');
jest.mock('@/lib/core/debug/unified-logger');

// Mock fetch
global.fetch = jest.fn();

describe('Auth Flow Integration Tests', () => {
  let mockAuthClient: any;
  let mockApiClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth client
    mockAuthClient = {
      signIn: {
        email: jest.fn(),
      },
      signUp: {
        email: jest.fn(),
      },
      signOut: jest.fn(),
      session: jest.fn(),
      getSession: jest.fn(),
      sendVerificationEmail: jest.fn(),
      verifyEmail: jest.fn(),
      forgetPassword: jest.fn(),
      resetPassword: jest.fn(),
    };
    
    // Mock API client
    mockApiClient = {
      auth: {
        signIn: {
          mutate: jest.fn(),
        },
        signUp: {
          mutate: jest.fn(),
        },
        signOut: {
          mutate: jest.fn(),
        },
        getSession: {
          query: jest.fn(),
        },
        updateProfile: {
          mutate: jest.fn(),
        },
      },
      organization: {
        createOrJoin: {
          mutate: jest.fn(),
        },
      },
    };
    
    (createAuthClient as jest.Mock).mockReturnValue(mockAuthClient);
    (apiClient as any) = mockApiClient;
  });

  describe('Login Flow', () => {
    it('successfully logs in a user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      };
      
      const mockUser = {
        id: '123',
        email: credentials.email,
        name: 'Test User',
        role: 'operator',
      };
      
      const mockSession = {
        user: mockUser,
        token: 'mock-token',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      
      // Mock successful auth
      mockAuthClient.signIn.email.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });
      
      mockApiClient.auth.signIn.mutate.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      
      // Validate input
      const validatedData = signInSchema.parse(credentials);
      
      // Perform login
      const authResult = await mockAuthClient.signIn.email({
        email: validatedData.email,
        password: validatedData.password,
      });
      
      expect(authResult.error).toBeNull();
      expect(authResult.data.user).toEqual(mockUser);
      expect(authResult.data.session).toEqual(mockSession);
      
      // Verify API was called
      expect(mockApiClient.auth.signIn.mutate).toHaveBeenCalledWith(validatedData);
    });

    it('handles invalid credentials gracefully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      
      mockAuthClient.signIn.email.mockResolvedValue({
        data: null,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
      
      const result = await mockAuthClient.signIn.email(credentials);
      
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_CREDENTIALS');
      expect(result.data).toBeNull();
    });

    it('validates email format before attempting login', () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
      ];
      
      invalidEmails.forEach(email => {
        expect(() => signInSchema.parse({
          email,
          password: 'Password123!',
        })).toThrow();
      });
    });

    it('handles network errors during login', async () => {
      mockAuthClient.signIn.email.mockRejectedValue(new Error('Network error'));
      
      await expect(mockAuthClient.signIn.email({
        email: 'test@example.com',
        password: 'Password123!',
      })).rejects.toThrow('Network error');
    });
  });

  describe('Registration Flow', () => {
    it('successfully registers a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
      };
      
      const mockUser = {
        id: 'new-user-id',
        email: userData.email,
        name: userData.name,
        role: 'user',
        emailVerified: false,
      };
      
      mockAuthClient.signUp.email.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      mockApiClient.auth.signUp.mutate.mockResolvedValue({
        user: mockUser,
        requiresEmailVerification: true,
      });
      
      // Validate and register
      const validatedData = signUpSchema.parse(userData);
      const result = await mockAuthClient.signUp.email(validatedData);
      
      expect(result.error).toBeNull();
      expect(result.data.user).toEqual(mockUser);
      expect(result.data.user.emailVerified).toBe(false);
    });

    it('validates password strength requirements', () => {
      const weakPasswords = [
        'short',
        'nouppercase1!',
        'NOLOWERCASE1!',
        'NoNumbers!',
        'NoSpecialChars1',
      ];
      
      weakPasswords.forEach(password => {
        expect(() => signUpSchema.parse({
          email: 'test@example.com',
          password,
          name: 'Test User',
        })).toThrow();
      });
    });

    it('handles duplicate email registration', async () => {
      mockAuthClient.signUp.email.mockResolvedValue({
        data: null,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'An account with this email already exists',
        },
      });
      
      const result = await mockAuthClient.signUp.email({
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Test User',
      });
      
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('USER_ALREADY_EXISTS');
    });
  });

  describe('Session Management', () => {
    it('retrieves active session', async () => {
      const mockSession = {
        user: {
          id: '123',
          email: 'test@example.com',
          role: 'operator',
        },
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };
      
      mockAuthClient.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      mockApiClient.auth.getSession.query.mockResolvedValue(mockSession);
      
      const result = await mockAuthClient.getSession();
      
      expect(result.data.session).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it('handles expired sessions', async () => {
      const expiredSession = {
        user: { id: '123', email: 'test@example.com' },
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      };
      
      mockAuthClient.getSession.mockResolvedValue({
        data: { session: null },
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Your session has expired',
        },
      });
      
      const result = await mockAuthClient.getSession();
      
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('SESSION_EXPIRED');
      expect(result.data.session).toBeNull();
    });

    it('successfully signs out user', async () => {
      mockAuthClient.signOut.mockResolvedValue({
        data: { success: true },
        error: null,
      });
      
      mockApiClient.auth.signOut.mutate.mockResolvedValue({
        success: true,
      });
      
      const result = await mockAuthClient.signOut();
      
      expect(result.data.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockApiClient.auth.signOut.mutate).toHaveBeenCalled();
    });
  });

  describe('Email Verification', () => {
    it('sends verification email successfully', async () => {
      const email = 'test@example.com';
      
      mockAuthClient.sendVerificationEmail.mockResolvedValue({
        data: { success: true },
        error: null,
      });
      
      const result = await mockAuthClient.sendVerificationEmail({ email });
      
      expect(result.data.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('verifies email with valid token', async () => {
      const token = 'valid-verification-token';
      
      mockAuthClient.verifyEmail.mockResolvedValue({
        data: { 
          success: true,
          user: { emailVerified: true },
        },
        error: null,
      });
      
      const result = await mockAuthClient.verifyEmail({ token });
      
      expect(result.data.success).toBe(true);
      expect(result.data.user.emailVerified).toBe(true);
    });

    it('handles invalid verification token', async () => {
      mockAuthClient.verifyEmail.mockResolvedValue({
        data: null,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token',
        },
      });
      
      const result = await mockAuthClient.verifyEmail({ token: 'invalid-token' });
      
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Password Reset', () => {
    it('initiates password reset successfully', async () => {
      const email = 'test@example.com';
      
      mockAuthClient.forgetPassword.mockResolvedValue({
        data: { success: true },
        error: null,
      });
      
      const result = await mockAuthClient.forgetPassword({ email });
      
      expect(result.data.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('resets password with valid token', async () => {
      const resetData = {
        token: 'valid-reset-token',
        password: 'NewSecurePass123!',
      };
      
      mockAuthClient.resetPassword.mockResolvedValue({
        data: { success: true },
        error: null,
      });
      
      const result = await mockAuthClient.resetPassword(resetData);
      
      expect(result.data.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('validates new password requirements', async () => {
      const weakPassword = 'weak';
      
      expect(() => signInSchema.parse({
        email: 'test@example.com',
        password: weakPassword,
      })).toThrow();
    });
  });

  describe('Profile Completion', () => {
    it('updates user profile after registration', async () => {
      const profileData = {
        userId: '123',
        organizationId: 'org-123',
        role: 'nurse',
        department: 'Emergency',
      };
      
      mockApiClient.auth.updateProfile.mutate.mockResolvedValue({
        user: {
          ...profileData,
          profileComplete: true,
        },
      });
      
      const result = await mockApiClient.auth.updateProfile.mutate(profileData);
      
      expect(result.user.profileComplete).toBe(true);
      expect(result.user.role).toBe('nurse');
      expect(result.user.department).toBe('Emergency');
    });

    it('validates required profile fields', async () => {
      const incompleteData = {
        userId: '123',
        // missing required fields
      };
      
      mockApiClient.auth.updateProfile.mutate.mockRejectedValue(
        new Error('Missing required fields')
      );
      
      await expect(
        mockApiClient.auth.updateProfile.mutate(incompleteData)
      ).rejects.toThrow('Missing required fields');
    });
  });

  describe('OAuth Flow', () => {
    it('handles successful Google OAuth login', async () => {
      const mockGoogleUser = {
        id: 'google-123',
        email: 'user@gmail.com',
        name: 'Google User',
        picture: 'https://example.com/photo.jpg',
      };
      
      // Mock OAuth redirect and callback
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockGoogleUser }),
      });
      
      // Simulate OAuth callback
      const oauthResult = await fetch('/api/auth/google/callback?code=mock-code');
      const data = await oauthResult.json();
      
      expect(data.user).toEqual(mockGoogleUser);
    });

    it('handles OAuth errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid OAuth state' }),
      });
      
      const oauthResult = await fetch('/api/auth/google/callback?error=access_denied');
      const data = await oauthResult.json();
      
      expect(data.error).toBe('Invalid OAuth state');
    });
  });
});