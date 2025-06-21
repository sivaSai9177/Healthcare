/**
 * Tests for useAuth hook
 * Critical for preventing unauthorized access and session errors
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { useAuth } from '@/hooks/useAuth';
import { authClient } from '@/lib/auth/auth-client';
import { createMockUser, createMockSession } from '../mocks/factories';
import { AllTheProviders } from '../utils/test-utils';

// Mock auth client
jest.mock('@/lib/auth/auth-client', () => ({
  authClient: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    refreshToken: jest.fn(),
    verifyEmail: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

// Mock secure storage
jest.mock('@/lib/core/secure-storage', () => ({
  secureStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth state
    (authClient.getSession as jest.Mock).mockResolvedValue(null);
  });

  describe('Authentication State', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should load existing session on mount', async () => {
      const mockSession = createMockSession();
      (authClient.getSession as jest.Mock).mockResolvedValue(mockSession);

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      await waitForNextUpdate();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockSession.user);
    });

    it('should handle session loading error gracefully', async () => {
      (authClient.getSession as jest.Mock).mockRejectedValue(new Error('Session load failed'));

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      await waitForNextUpdate();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Sign In', () => {
    it('should sign in successfully', async () => {
      const mockSession = createMockSession();
      (authClient.signIn as jest.Mock).mockResolvedValue({ 
        success: true, 
        data: mockSession 
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      await act(async () => {
        const response = await result.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(response.success).toBe(true);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockSession.user);
      expect(result.current.error).toBeNull();
    });

    it('should handle sign in failure', async () => {
      (authClient.signIn as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      await act(async () => {
        const response = await result.current.signIn({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
        expect(response.success).toBe(false);
        expect(response.error).toBe('Invalid credentials');
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should handle network errors during sign in', async () => {
      (authClient.signIn as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      await act(async () => {
        const response = await result.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(response.success).toBe(false);
        expect(response.error).toContain('Network error');
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      // Start with authenticated state
      const mockSession = createMockSession();
      (authClient.getSession as jest.Mock).mockResolvedValue(mockSession);
      (authClient.signOut as jest.Mock).mockResolvedValue({ success: true });

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      await waitForNextUpdate();
      expect(result.current.isAuthenticated).toBe(true);

      // Sign out
      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(authClient.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors gracefully', async () => {
      const mockSession = createMockSession();
      (authClient.getSession as jest.Mock).mockResolvedValue(mockSession);
      (authClient.signOut as jest.Mock).mockRejectedValue(new Error('Signout failed'));

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      await waitForNextUpdate();

      await act(async () => {
        await result.current.signOut();
      });

      // Should still clear local state even if server signout fails
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token automatically when expired', async () => {
      const expiredSession = createMockSession({
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
      });
      
      const newSession = createMockSession({
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // Valid for 1 hour
      });

      (authClient.getSession as jest.Mock).mockResolvedValue(expiredSession);
      (authClient.refreshToken as jest.Mock).mockResolvedValue({
        success: true,
        data: newSession,
      });

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      await waitForNextUpdate();

      // Should automatically refresh
      await waitFor(() => {
        expect(authClient.refreshToken).toHaveBeenCalled();
        expect(result.current.user).toEqual(newSession.user);
      });
    });

    it('should handle refresh token failure', async () => {
      const expiredSession = createMockSession({
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      });

      (authClient.getSession as jest.Mock).mockResolvedValue(expiredSession);
      (authClient.refreshToken as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Refresh token expired',
      });

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      await waitForNextUpdate();

      await waitFor(() => {
        expect(authClient.refreshToken).toHaveBeenCalled();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
      });
    });
  });

  describe('Session Persistence', () => {
    it('should persist session across app restarts', async () => {
      const mockSession = createMockSession();
      
      // First render - sign in
      const { result: result1, unmount: unmount1 } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      (authClient.signIn as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSession,
      });

      await act(async () => {
        await result1.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      unmount1();

      // Second render - should restore session
      (authClient.getSession as jest.Mock).mockResolvedValue(mockSession);

      const { result: result2, waitForNextUpdate } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      await waitForNextUpdate();

      expect(result2.current.isAuthenticated).toBe(true);
      expect(result2.current.user).toEqual(mockSession.user);
    });
  });

  describe('Error Handling', () => {
    it('should handle concurrent auth operations', async () => {
      const mockSession = createMockSession();
      (authClient.signIn as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: mockSession,
        }), 100))
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      // Start multiple sign in attempts
      const promise1 = act(async () => {
        return result.current.signIn({ email: 'test1@example.com', password: 'pass1' });
      });

      const promise2 = act(async () => {
        return result.current.signIn({ email: 'test2@example.com', password: 'pass2' });
      });

      await Promise.all([promise1, promise2]);

      // Should handle gracefully without errors
      expect(result.current.isAuthenticated).toBe(true);
      expect(authClient.signIn).toHaveBeenCalledTimes(2);
    });

    it('should clear sensitive data on error', async () => {
      const mockSession = createMockSession();
      (authClient.getSession as jest.Mock).mockResolvedValue(mockSession);

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      await waitForNextUpdate();
      expect(result.current.isAuthenticated).toBe(true);

      // Simulate security error
      act(() => {
        result.current.handleSecurityError(new Error('Security breach detected'));
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toContain('Security breach');
    });
  });

  describe('Profile Updates', () => {
    it('should update user profile', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession({ user: mockUser });
      
      (authClient.getSession as jest.Mock).mockResolvedValue(mockSession);
      
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      (authClient.updateProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockSession, user: updatedUser },
      });

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
        wrapper: AllTheProviders,
      });

      await waitForNextUpdate();

      await act(async () => {
        const response = await result.current.updateProfile({ name: 'Updated Name' });
        expect(response.success).toBe(true);
      });

      expect(result.current.user?.name).toBe('Updated Name');
    });
  });
});