/**
 * Tests for ProtectedRoute component
 * Ensures unauthorized users cannot access protected screens
 */

import React from 'react';
import { Text } from 'react-native';
import { renderWithProviders, waitFor } from '../../utils/test-utils';
import { ProtectedRoute } from '@/components/blocks/auth/ProtectedRoute';
import { createMockUser, createMockSession } from '../../mocks/factories';
import { useRouter } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useSegments: jest.fn(() => []),
  usePathname: jest.fn(() => '/'),
}));

// Protected component
const ProtectedContent = () => <Text>Protected Content</Text>;

describe('ProtectedRoute', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  describe('Authentication Check', () => {
    it('should render protected content when authenticated', async () => {
      const mockSession = createMockSession();

      const { getByText } = renderWithProviders(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>,
        { session: mockSession }
      );

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeTruthy();
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should redirect to login when not authenticated', async () => {
      const { queryByText } = renderWithProviders(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>,
        { session: null }
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login');
      });

      expect(queryByText('Protected Content')).toBeNull();
    });

    it('should show loading state while checking authentication', () => {
      const { getByTestId, queryByText } = renderWithProviders(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      // Should show loading indicator
      expect(getByTestId('loading-indicator')).toBeTruthy();
      expect(queryByText('Protected Content')).toBeNull();
    });
  });

  describe('Role-Based Access', () => {
    it('should allow access when user has required role', async () => {
      const mockSession = createMockSession({
        user: createMockUser({ role: 'ADMIN' }),
      });

      const { getByText } = renderWithProviders(
        <ProtectedRoute requiredRoles={['ADMIN', 'DOCTOR']}>
          <ProtectedContent />
        </ProtectedRoute>,
        { session: mockSession }
      );

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeTruthy();
      });
    });

    it('should deny access when user lacks required role', async () => {
      const mockSession = createMockSession({
        user: createMockUser({ role: 'NURSE' }),
      });

      const { queryByText, getByText } = renderWithProviders(
        <ProtectedRoute requiredRoles={['ADMIN', 'DOCTOR']}>
          <ProtectedContent />
        </ProtectedRoute>,
        { session: mockSession }
      );

      await waitFor(() => {
        expect(getByText(/Access Denied/i)).toBeTruthy();
        expect(getByText(/don't have permission/i)).toBeTruthy();
      });

      expect(queryByText('Protected Content')).toBeNull();
    });

    it('should handle multiple role requirements', async () => {
      const mockSession = createMockSession({
        user: createMockUser({ role: 'DOCTOR' }),
      });

      const { getByText } = renderWithProviders(
        <ProtectedRoute requiredRoles={['DOCTOR']}>
          <ProtectedContent />
        </ProtectedRoute>,
        { session: mockSession }
      );

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeTruthy();
      });
    });
  });

  describe('Hospital Context Requirements', () => {
    it('should require hospital selection when specified', async () => {
      const mockSession = createMockSession();

      const { queryByText, getByText } = renderWithProviders(
        <ProtectedRoute requiresHospital>
          <ProtectedContent />
        </ProtectedRoute>,
        { session: mockSession, hospital: null }
      );

      await waitFor(() => {
        expect(getByText(/Select Hospital/i)).toBeTruthy();
        expect(getByText(/Please select a hospital/i)).toBeTruthy();
      });

      expect(queryByText('Protected Content')).toBeNull();
    });

    it('should allow access when hospital is selected', async () => {
      const mockSession = createMockSession();
      const mockHospital = { id: '123', name: 'Test Hospital' };

      const { getByText } = renderWithProviders(
        <ProtectedRoute requiresHospital>
          <ProtectedContent />
        </ProtectedRoute>,
        { session: mockSession, hospital: mockHospital }
      );

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeTruthy();
      });
    });
  });

  describe('Permission Checks', () => {
    it('should check specific permissions', async () => {
      const mockSession = createMockSession({
        user: createMockUser({ 
          role: 'NURSE',
          permissions: ['alerts.view', 'alerts.acknowledge'] 
        }),
      });

      const { getByText } = renderWithProviders(
        <ProtectedRoute requiredPermissions={['alerts.view']}>
          <ProtectedContent />
        </ProtectedRoute>,
        { session: mockSession }
      );

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeTruthy();
      });
    });

    it('should deny access for missing permissions', async () => {
      const mockSession = createMockSession({
        user: createMockUser({ 
          role: 'NURSE',
          permissions: ['alerts.view'] 
        }),
      });

      const { queryByText, getByText } = renderWithProviders(
        <ProtectedRoute requiredPermissions={['alerts.create', 'alerts.delete']}>
          <ProtectedContent />
        </ProtectedRoute>,
        { session: mockSession }
      );

      await waitFor(() => {
        expect(getByText(/Access Denied/i)).toBeTruthy();
      });

      expect(queryByText('Protected Content')).toBeNull();
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect to custom path when specified', async () => {
      const { queryByText } = renderWithProviders(
        <ProtectedRoute redirectTo="/custom-login">
          <ProtectedContent />
        </ProtectedRoute>,
        { session: null }
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/custom-login');
      });

      expect(queryByText('Protected Content')).toBeNull();
    });

    it('should preserve return URL for post-login redirect', async () => {
      (usePathname as jest.Mock).mockReturnValue('/alerts/123');

      const { queryByText } = renderWithProviders(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>,
        { session: null }
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('returnUrl=%2Falerts%2F123')
        );
      });
    });
  });

  describe('Loading States', () => {
    it('should show custom loading component', () => {
      const CustomLoader = () => <Text>Custom Loading...</Text>;

      const { getByText } = renderWithProviders(
        <ProtectedRoute loadingComponent={<CustomLoader />}>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(getByText('Custom Loading...')).toBeTruthy();
    });

    it('should handle async permission checks', async () => {
      const mockSession = createMockSession();
      
      // Simulate async permission check
      const asyncPermissionCheck = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 100))
      );

      const { getByTestId, getByText } = renderWithProviders(
        <ProtectedRoute 
          customCheck={asyncPermissionCheck}
        >
          <ProtectedContent />
        </ProtectedRoute>,
        { session: mockSession }
      );

      // Should show loading initially
      expect(getByTestId('loading-indicator')).toBeTruthy();

      // Should show content after check completes
      await waitFor(() => {
        expect(getByText('Protected Content')).toBeTruthy();
      });

      expect(asyncPermissionCheck).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication check errors', async () => {
      // Simulate error in auth check
      const errorSession = {
        user: null,
        error: new Error('Auth service unavailable'),
      };

      const { getByText } = renderWithProviders(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>,
        { session: errorSession }
      );

      await waitFor(() => {
        expect(getByText(/Authentication Error/i)).toBeTruthy();
        expect(getByText(/Auth service unavailable/i)).toBeTruthy();
      });
    });

    it('should handle permission check errors gracefully', async () => {
      const mockSession = createMockSession();
      
      const failingPermissionCheck = jest.fn().mockRejectedValue(
        new Error('Permission service error')
      );

      const { getByText } = renderWithProviders(
        <ProtectedRoute customCheck={failingPermissionCheck}>
          <ProtectedContent />
        </ProtectedRoute>,
        { session: mockSession }
      );

      await waitFor(() => {
        expect(getByText(/Error checking permissions/i)).toBeTruthy();
      });
    });
  });

  describe('Session Expiry', () => {
    it('should redirect when session expires', async () => {
      const expiredSession = createMockSession({
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
      });

      const { queryByText } = renderWithProviders(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>,
        { session: expiredSession }
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });

      expect(queryByText('Protected Content')).toBeNull();
    });

    it('should show session expiry warning', async () => {
      // Session expiring in 5 minutes
      const expiringSession = createMockSession({
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

      const { getByText } = renderWithProviders(
        <ProtectedRoute showExpiryWarning>
          <ProtectedContent />
        </ProtectedRoute>,
        { session: expiringSession }
      );

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeTruthy();
        expect(getByText(/Session expiring soon/i)).toBeTruthy();
      });
    });
  });
});