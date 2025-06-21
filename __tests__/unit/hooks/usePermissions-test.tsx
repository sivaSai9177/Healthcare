import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { usePermission, usePermissions, useRole, useHealthcareAccess } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/auth/permissions';

// Mock the auth store
jest.mock('@/lib/stores/auth-store');

describe('usePermissions hooks', () => {
  const mockAuthStore = require('@/lib/stores/auth-store');
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStore.__resetMockAuthState();
  });

  describe('usePermission', () => {
    it('should return false when user is not loaded', () => {
      mockAuthStore.__setMockAuthState({
        user: null,
        isAuthenticated: false,
        hasHydrated: false,
      });

      const { result } = renderHook(() => usePermission(PERMISSIONS.VIEW_ALERTS));

      expect(result.current.hasPermission).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should return false when user has no role', () => {
      mockAuthStore.__setMockAuthState({
        user: { id: '1', name: 'Test User' },
        isAuthenticated: true,
        hasHydrated: true,
      });

      const { result } = renderHook(() => usePermission(PERMISSIONS.VIEW_ALERTS));

      expect(result.current.hasPermission).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should return true when user has permission', () => {
      mockAuthStore.__setMockAuthState({
        user: { id: '1', name: 'Test User', role: 'doctor' },
        isAuthenticated: true,
        hasHydrated: true,
      });

      const { result } = renderHook(() => usePermission(PERMISSIONS.VIEW_ALERTS));

      expect(result.current.hasPermission).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('useHealthcareAccess', () => {
    it('should return all false when user is not loaded', () => {
      mockAuthStore.__setMockAuthState({
        user: null,
        isAuthenticated: false,
        hasHydrated: false,
      });

      const { result } = renderHook(() => useHealthcareAccess());

      expect(result.current.isHealthcareRole).toBe(false);
      expect(result.current.canCreateAlerts).toBe(false);
      expect(result.current.canViewAlerts).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });

    it('should return correct permissions for doctor role', () => {
      mockAuthStore.__setMockAuthState({
        user: { id: '1', name: 'Dr. Test', role: 'doctor' },
        isAuthenticated: true,
        hasHydrated: true,
      });

      const { result } = renderHook(() => useHealthcareAccess());

      expect(result.current.isHealthcareRole).toBe(true);
      expect(result.current.isMedicalStaff).toBe(true);
      expect(result.current.canViewAlerts).toBe(true);
      expect(result.current.canViewPatients).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should return correct permissions for operator role', () => {
      mockAuthStore.__setMockAuthState({
        user: { id: '1', name: 'Operator Test', role: 'operator' },
        isAuthenticated: true,
        hasHydrated: true,
      });

      const { result } = renderHook(() => useHealthcareAccess());

      expect(result.current.isHealthcareRole).toBe(true);
      expect(result.current.canCreateAlerts).toBe(true);
      expect(result.current.canViewAlerts).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useRole', () => {
    it('should return false when user role is not in allowed roles', () => {
      mockAuthStore.__setMockAuthState({
        user: { id: '1', name: 'Test User', role: 'user' },
        isAuthenticated: true,
        hasHydrated: true,
      });

      const { result } = renderHook(() => useRole(['doctor', 'nurse']));

      expect(result.current.hasRole).toBe(false);
      expect(result.current.currentRole).toBe('user');
    });

    it('should return true when user role is in allowed roles', () => {
      mockAuthStore.__setMockAuthState({
        user: { id: '1', name: 'Test Doctor', role: 'doctor' },
        isAuthenticated: true,
        hasHydrated: true,
      });

      const { result } = renderHook(() => useRole(['doctor', 'nurse']));

      expect(result.current.hasRole).toBe(true);
      expect(result.current.currentRole).toBe('doctor');
    });
  });
});