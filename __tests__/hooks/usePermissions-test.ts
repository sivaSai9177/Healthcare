// @ts-nocheck
import React from 'react';
import { create, act } from 'react-test-renderer';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  usePermission,
  usePermissions,
  useRole,
  useFeatureAccess,
  useHealthcareAccess,
  useAdminAccess,
  useUserAccess,
  PERMISSIONS,
} from '@/hooks/usePermissions';

// Mock the auth store
jest.mock('@/lib/stores/auth-store');

// Helper to test hooks
function renderHook<T>(hook: () => T) {
  let result: { current: T } = {} as any;
  
  function TestComponent() {
    const hookResult = hook();
    result.current = hookResult;
    return null;
  }
  
  let root;
  act(() => {
    root = create(React.createElement(TestComponent));
  });
  
  return { result };
}

describe('usePermissions hooks', () => {
  const mockUseAuthStore = useAuthStore as unknown as jest.MockedFunction<typeof useAuthStore>;
  
  // Helper to mock auth store state
  const mockAuthState = (overrides: Partial<{
    user: any;
    isAuthenticated: boolean;
    hasHydrated: boolean;
  }>) => {
    const state = {
      user: null,
      isAuthenticated: false,
      hasHydrated: true,
      ...overrides,
    };
    
    mockUseAuthStore.mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    mockAuthState({});
  });

  describe('usePermission', () => {
    it('returns false when not hydrated', () => {
      mockAuthState({ hasHydrated: false });

      const { result } = renderHook(() => usePermission(PERMISSIONS.MANAGE_USERS));
      
      expect(result.current).toEqual({
        hasPermission: false,
        isLoading: true,
        isAuthenticated: false,
        user: null,
      });
    });

    it('returns false when no user', () => {
      mockAuthState({ user: null, isAuthenticated: false });

      const { result } = renderHook(() => usePermission(PERMISSIONS.MANAGE_USERS));
      
      expect(result.current).toEqual({
        hasPermission: false,
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
    });

    it('checks permission for admin user', () => {
      mockAuthState({
        user: { id: '1', role: 'admin', email: 'admin@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => usePermission(PERMISSIONS.MANAGE_USERS));
      
      expect(result.current).toEqual({
        hasPermission: true,
        isLoading: false,
        isAuthenticated: true,
        user: { id: '1', role: 'admin', email: 'admin@test.com' },
      });
    });

    it('checks permission for regular user', () => {
      mockAuthState({
        user: { id: '1', role: 'user', email: 'user@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => usePermission(PERMISSIONS.MANAGE_USERS));
      
      expect(result.current.hasPermission).toBe(false);
    });

    it('updates when user changes', () => {
      // Initially no user
      mockAuthState({
        user: null,
        isAuthenticated: false,
      });
      
      const { result } = renderHook(() => usePermission(PERMISSIONS.VIEW_CONTENT));
      
      expect(result.current.hasPermission).toBe(false);
      
      // User logs in
      mockAuthState({
        user: { id: '1', role: 'user', email: 'user@test.com' },
        isAuthenticated: true,
      });
      
      // Re-render by creating a new hook instance
      const { result: newResult } = renderHook(() => usePermission(PERMISSIONS.VIEW_CONTENT));
      
      expect(newResult.current.hasPermission).toBe(true);
    });
  });

  describe('usePermissions', () => {
    it('checks multiple permissions', () => {
      mockAuthState({
        user: { id: '1', role: 'manager', email: 'manager@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => 
        usePermissions([PERMISSIONS.MANAGE_USERS, PERMISSIONS.VIEW_ANALYTICS])
      );
      
      expect(result.current.hasAnyPermission).toBe(true);
      expect(result.current.hasAllPermissions).toBe(true);
    });

    it('correctly evaluates hasAllPermissions', () => {
      mockAuthState({
        user: { id: '1', role: 'user', email: 'user@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => 
        usePermissions([PERMISSIONS.VIEW_CONTENT, PERMISSIONS.MANAGE_USERS])
      );
      
      expect(result.current.hasAnyPermission).toBe(true); // Has VIEW_CONTENT
      expect(result.current.hasAllPermissions).toBe(false); // Doesn't have MANAGE_USERS
    });
  });

  describe('useRole', () => {
    it('checks if user has one of the allowed roles', () => {
      mockAuthState({
        user: { id: '1', role: 'nurse', email: 'nurse@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useRole(['nurse', 'doctor', 'head_doctor']));
      
      expect(result.current).toMatchObject({
        hasRole: true,
        isLoading: false,
        currentRole: 'nurse',
      });
    });

    it('returns false for unauthorized roles', () => {
      mockAuthState({
        user: { id: '1', role: 'user', email: 'user@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useRole(['admin', 'manager']));
      
      expect(result.current.hasRole).toBe(false);
    });
  });

  describe('useFeatureAccess', () => {
    it('checks feature access for user role', () => {
      mockAuthState({
        user: { id: '1', role: 'doctor', email: 'doctor@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useFeatureAccess('alerts_dashboard'));
      
      expect(result.current.hasAccess).toBe(true);
    });

    it('denies feature access for unauthorized role', () => {
      mockAuthState({
        user: { id: '1', role: 'guest', email: 'guest@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useFeatureAccess('admin'));
      
      expect(result.current.hasAccess).toBe(false);
    });
  });

  describe('useHealthcareAccess', () => {
    it('provides comprehensive healthcare permissions for doctor', () => {
      mockAuthState({
        user: { id: '1', role: 'doctor', email: 'doctor@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useHealthcareAccess());
      
      expect(result.current).toMatchObject({
        isHealthcareRole: true,
        isMedicalStaff: true,
        canCreateAlerts: true,
        canViewAlerts: true,
        canAcknowledgeAlerts: true,
        canResolveAlerts: true,
        canViewPatients: true,
        canManagePatients: false, // Doctors can't manage patients
        canViewAnalytics: false, // Doctors don't have analytics permission
        canManageShifts: false,
        isLoading: false,
      });
    });

    it('provides limited permissions for nurse', () => {
      mockAuthState({
        user: { id: '1', role: 'nurse', email: 'nurse@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useHealthcareAccess());
      
      expect(result.current).toMatchObject({
        isHealthcareRole: true,
        isMedicalStaff: true,
        canCreateAlerts: true,
        canViewAlerts: true,
        canAcknowledgeAlerts: true, // Nurses can acknowledge alerts
        canResolveAlerts: false, // Nurses can't resolve
        canViewPatients: true,
        canManagePatients: false,
      });
    });

    it('provides full permissions for head doctor', () => {
      mockAuthState({
        user: { id: '1', role: 'head_doctor', email: 'head@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useHealthcareAccess());
      
      expect(result.current).toMatchObject({
        isHealthcareRole: true,
        isMedicalStaff: true,
        canCreateAlerts: true,
        canViewAlerts: true,
        canAcknowledgeAlerts: true,
        canResolveAlerts: true,
        canViewPatients: true,
        canManagePatients: true,
        canViewAnalytics: true,
        canManageShifts: true,
      });
    });

    it('returns all false for non-healthcare role', () => {
      mockAuthState({
        user: { id: '1', role: 'user', email: 'user@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useHealthcareAccess());
      
      expect(result.current).toMatchObject({
        isHealthcareRole: false,
        isMedicalStaff: false,
        canCreateAlerts: false,
        canViewAlerts: false,
        canAcknowledgeAlerts: false,
        canResolveAlerts: false,
        canViewPatients: false,
        canManagePatients: false,
      });
    });
  });

  describe('useAdminAccess', () => {
    it('provides admin permissions', () => {
      mockAuthState({
        user: { id: '1', role: 'admin', email: 'admin@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAdminAccess());
      
      expect(result.current).toMatchObject({
        isAdmin: true,
        isManagement: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canManageOrganization: true,
        isLoading: false,
      });
    });

    it('provides management permissions for manager', () => {
      mockAuthState({
        user: { id: '1', role: 'manager', email: 'manager@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAdminAccess());
      
      expect(result.current).toMatchObject({
        isAdmin: false,
        isManagement: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canManageOrganization: true,
      });
    });

    it('denies admin permissions for regular user', () => {
      mockAuthState({
        user: { id: '1', role: 'user', email: 'user@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAdminAccess());
      
      expect(result.current).toMatchObject({
        isAdmin: false,
        isManagement: false,
        canManageUsers: false,
        canViewAnalytics: false,
        canManageOrganization: false,
      });
    });
  });

  describe('useUserAccess', () => {
    it('provides comprehensive user access info', () => {
      mockAuthState({
        user: { id: '1', role: 'doctor', email: 'doctor@test.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useUserAccess());
      
      expect(result.current).toMatchObject({
        user: { id: '1', role: 'doctor', email: 'doctor@test.com' },
        role: 'doctor',
        isAuthenticated: true,
        isLoading: false,
        isHealthcareRole: true,
        isAdminRole: false,
        isManagementRole: false,
        isMedicalStaff: true,
      });

      // Test permission functions
      expect(result.current.hasPermission(PERMISSIONS.CREATE_ALERTS)).toBe(true);
      expect(result.current.hasPermission(PERMISSIONS.MANAGE_USERS)).toBe(false);
      expect(result.current.hasRole(['doctor', 'nurse'])).toBe(true);
      expect(result.current.hasRole(['admin'])).toBe(false);
      expect(result.current.hasFeatureAccess('alerts_dashboard')).toBe(true);
      expect(result.current.hasFeatureAccess('system_admin')).toBe(false);
    });

    it('returns safe defaults when not authenticated', () => {
      mockAuthState({
        user: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useUserAccess());
      
      expect(result.current).toMatchObject({
        user: null,
        role: undefined,
        isAuthenticated: false,
        isLoading: false,
        isHealthcareRole: false,
        isAdminRole: false,
        isManagementRole: false,
        isMedicalStaff: false,
      });

      // All permission functions should return false
      expect(result.current.hasPermission(PERMISSIONS.VIEW_CONTENT)).toBe(false);
      expect(result.current.hasAnyPermission([PERMISSIONS.VIEW_CONTENT])).toBe(false);
      expect(result.current.hasAllPermissions([PERMISSIONS.VIEW_CONTENT])).toBe(false);
      expect(result.current.hasRole(['user'])).toBe(false);
      expect(result.current.hasFeatureAccess('basic')).toBe(false);
    });
  });
});