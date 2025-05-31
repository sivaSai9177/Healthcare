import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useRequireAuth, useRequireRole } from '@/hooks/useAuth';
import { ProtectedRoute } from '../ProtectedRoute';

// Mock the auth hooks
jest.mock('@/hooks/useAuth');

const mockUseRequireAuth = useRequireAuth as jest.MockedFunction<typeof useRequireAuth>;
const mockUseRequireRole = useRequireRole as jest.MockedFunction<typeof useRequireRole>;

// Test components
const TestComponent = () => <Text>Protected Content</Text>;
const LoadingComponent = () => <Text>Loading...</Text>;
const UnauthorizedComponent = () => <Text>Unauthorized</Text>;

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Protection', () => {
    it('should render children when user is authenticated', () => {
      mockUseRequireAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'doctor@hospital.com',
          name: 'Dr. Smith',
          role: 'doctor',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeTruthy();
    });

    it('should show loading state when authentication is pending', () => {
      mockUseRequireAuth.mockReturnValue({
        user: null,
        isLoading: true,
      });

      render(
        <ProtectedRoute fallback={<LoadingComponent />}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Loading...')).toBeTruthy();
      expect(screen.queryByText('Protected Content')).toBeFalsy();
    });

    it('should not render children when user is not authenticated', () => {
      mockUseRequireAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).toBeFalsy();
    });

    it('should render custom fallback during loading', () => {
      mockUseRequireAuth.mockReturnValue({
        user: null,
        isLoading: true,
      });

      const CustomLoading = () => <Text>Custom Loading...</Text>;

      render(
        <ProtectedRoute fallback={<CustomLoading />}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Custom Loading...')).toBeTruthy();
    });
  });

  describe('Role-Based Access Control', () => {
    beforeEach(() => {
      // Mock useRequireAuth to return authenticated user
      mockUseRequireAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'doctor@hospital.com',
          name: 'Dr. Smith',
          role: 'doctor',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
      });
    });

    it('should render children when user has required role', () => {
      mockUseRequireRole.mockReturnValue({
        user: {
          id: '1',
          email: 'doctor@hospital.com',
          name: 'Dr. Smith',
          role: 'doctor',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
        hasAccess: true,
      });

      render(
        <ProtectedRoute requiredRoles={['doctor', 'head_doctor']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeTruthy();
    });

    it('should not render children when user lacks required role', () => {
      mockUseRequireRole.mockReturnValue({
        user: {
          id: '1',
          email: 'nurse@hospital.com',
          name: 'Nurse Jane',
          role: 'nurse',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
        hasAccess: false,
      });

      render(
        <ProtectedRoute requiredRoles={['operator']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).toBeFalsy();
    });

    it('should show loading state during role check', () => {
      mockUseRequireRole.mockReturnValue({
        user: null,
        isLoading: true,
        hasAccess: false,
      });

      render(
        <ProtectedRoute 
          requiredRoles={['doctor']} 
          fallback={<LoadingComponent />}
        >
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Loading...')).toBeTruthy();
      expect(screen.queryByText('Protected Content')).toBeFalsy();
    });

    it('should render unauthorized fallback when access is denied', () => {
      mockUseRequireRole.mockReturnValue({
        user: {
          id: '1',
          email: 'nurse@hospital.com',
          name: 'Nurse Jane',
          role: 'nurse',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
        hasAccess: false,
      });

      render(
        <ProtectedRoute 
          requiredRoles={['operator']}
          unauthorizedFallback={<UnauthorizedComponent />}
        >
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Unauthorized')).toBeTruthy();
      expect(screen.queryByText('Protected Content')).toBeFalsy();
    });
  });

  describe('Multiple Role Support', () => {
    beforeEach(() => {
      mockUseRequireAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'doctor@hospital.com',
          name: 'Dr. Smith',
          role: 'doctor',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
      });
    });

    it('should allow access when user has one of multiple required roles', () => {
      mockUseRequireRole.mockReturnValue({
        user: {
          id: '1',
          email: 'doctor@hospital.com',
          name: 'Dr. Smith',
          role: 'doctor',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
        hasAccess: true,
      });

      render(
        <ProtectedRoute requiredRoles={['doctor', 'head_doctor', 'nurse']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeTruthy();
    });

    it('should deny access when user has none of the required roles', () => {
      mockUseRequireRole.mockReturnValue({
        user: {
          id: '1',
          email: 'operator@hospital.com',
          name: 'Operator John',
          role: 'operator',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
        hasAccess: false,
      });

      render(
        <ProtectedRoute requiredRoles={['doctor', 'head_doctor', 'nurse']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).toBeFalsy();
    });
  });

  describe('Hook Integration', () => {
    it('should call useRequireAuth when no roles specified', () => {
      mockUseRequireAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'doctor',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(mockUseRequireAuth).toHaveBeenCalled();
      expect(mockUseRequireRole).not.toHaveBeenCalled();
    });

    it('should call useRequireRole when roles are specified', () => {
      mockUseRequireAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'doctor',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
      });

      mockUseRequireRole.mockReturnValue({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'doctor',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
        hasAccess: true,
      });

      render(
        <ProtectedRoute requiredRoles={['doctor']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(mockUseRequireAuth).toHaveBeenCalled();
      expect(mockUseRequireRole).toHaveBeenCalledWith(['doctor'], undefined);
    });

    it('should pass custom redirect path to useRequireRole', () => {
      mockUseRequireAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'doctor',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
      });

      mockUseRequireRole.mockReturnValue({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'doctor',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
        hasAccess: true,
      });

      render(
        <ProtectedRoute 
          requiredRoles={['operator']} 
          redirectTo="/custom-redirect"
        >
          <TestComponent />
        </ProtectedRoute>
      );

      expect(mockUseRequireRole).toHaveBeenCalledWith(['operator'], '/custom-redirect');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty required roles array', () => {
      mockUseRequireAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'doctor',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
      });

      render(
        <ProtectedRoute requiredRoles={[]}>
          <TestComponent />
        </ProtectedRoute>
      );

      // Should still require authentication but no specific role
      expect(mockUseRequireAuth).toHaveBeenCalled();
      expect(screen.getByText('Protected Content')).toBeTruthy();
    });

    it('should handle null children gracefully', () => {
      mockUseRequireAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'doctor',
          hospitalId: 'hospital-1',
          emailVerified: true,
        },
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          {null}
        </ProtectedRoute>
      );

      // Should not crash
      expect(screen.queryByText('Protected Content')).toBeFalsy();
    });

    it('should handle undefined fallback gracefully', () => {
      mockUseRequireAuth.mockReturnValue({
        user: null,
        isLoading: true,
      });

      render(
        <ProtectedRoute fallback={undefined}>
          <TestComponent />
        </ProtectedRoute>
      );

      // Should render nothing when loading and no fallback provided
      expect(screen.queryByText('Protected Content')).toBeFalsy();
      expect(screen.queryByText('Loading...')).toBeFalsy();
    });
  });
});