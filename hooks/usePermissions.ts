import { useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasFeatureAccess,
  isHealthcareRole,
  isAdminRole,
  isManagementRole,
  isMedicalStaff,
  type Permission,
  type UserRole,
  type Feature,
  PERMISSIONS,
} from '@/lib/auth/permissions';

/**
 * Hook to check if user has a specific permission
 */
export function usePermission(permission: Permission) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  
  return useMemo(() => {
    // Return safe defaults when loading or no user
    if (!hasHydrated || !user?.role) {
      return {
        hasPermission: false,
        isLoading: !hasHydrated,
        isAuthenticated,
        user,
      };
    }
    
    const hasAccess = hasPermission(user.role as UserRole, permission);
    
    return {
      hasPermission: hasAccess,
      isLoading: false,
      isAuthenticated,
      user,
    };
  }, [permission, hasHydrated, isAuthenticated, user]);
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function usePermissions(permissions: Permission[]) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  
  return useMemo(() => {
    // Return safe defaults when loading or no user role
    if (!hasHydrated || !user?.role) {
      return {
        hasAnyPermission: false,
        hasAllPermissions: false,
        isLoading: !hasHydrated,
        isAuthenticated,
        user,
      };
    }
    
    const hasAny = hasAnyPermission(user.role as UserRole, permissions);
    const hasAll = hasAllPermissions(user.role as UserRole, permissions);
    
    return {
      hasAnyPermission: hasAny,
      hasAllPermissions: hasAll,
      isLoading: false,
      isAuthenticated,
      user,
    };
  }, [permissions, hasHydrated, isAuthenticated, user]);
}

/**
 * Hook to check if user has one of the specified roles
 */
export function useRole(allowedRoles: UserRole[]) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  
  return useMemo(() => {
    // Return safe defaults when loading or no user role
    if (!hasHydrated || !user?.role) {
      return {
        hasRole: false,
        isLoading: !hasHydrated,
        isAuthenticated,
        user,
        currentRole: undefined,
      };
    }
    
    const hasAccess = hasRole(user.role as UserRole, allowedRoles);
    
    return {
      hasRole: hasAccess,
      isLoading: false,
      isAuthenticated,
      user,
      currentRole: user.role as UserRole,
    };
  }, [allowedRoles, hasHydrated, isAuthenticated, user]);
}

/**
 * Hook to check if user has access to a feature
 */
export function useFeatureAccess(feature: Feature) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  
  return useMemo(() => {
    // Return safe defaults when loading or no user role
    if (!hasHydrated || !user?.role) {
      return {
        hasAccess: false,
        isLoading: !hasHydrated,
        isAuthenticated,
        user,
      };
    }
    
    const hasAccess = hasFeatureAccess(user.role as UserRole, feature);
    
    return {
      hasAccess,
      isLoading: false,
      isAuthenticated,
      user,
    };
  }, [feature, hasHydrated, isAuthenticated, user]);
}

/**
 * Hook for healthcare-specific access
 */
export function useHealthcareAccess() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  
  return useMemo(() => {
    // Return safe defaults when loading or no user role
    if (!hasHydrated || !user?.role) {
      return {
        isHealthcareRole: false,
        isMedicalStaff: false,
        canCreateAlerts: false,
        canViewAlerts: false,
        canAcknowledgeAlerts: false,
        canResolveAlerts: false,
        canEscalateAlerts: false,
        canViewPatients: false,
        canManagePatients: false,
        canCreatePatients: false,
        canViewAnalytics: false,
        canManageShifts: false,
        canViewAuditLogs: false,
        isLoading: !hasHydrated,
        isAuthenticated,
        user,
      };
    }
    
    const userRole = user.role as UserRole;
    
    return {
      isHealthcareRole: isHealthcareRole(userRole),
      isMedicalStaff: isMedicalStaff(userRole),
      canCreateAlerts: hasPermission(userRole, PERMISSIONS.CREATE_ALERTS),
      canViewAlerts: hasPermission(userRole, PERMISSIONS.VIEW_ALERTS),
      canAcknowledgeAlerts: hasPermission(userRole, PERMISSIONS.ACKNOWLEDGE_ALERTS),
      canResolveAlerts: hasPermission(userRole, PERMISSIONS.RESOLVE_ALERTS),
      canEscalateAlerts: hasPermission(userRole, PERMISSIONS.ESCALATE_ALERTS),
      canViewPatients: hasPermission(userRole, PERMISSIONS.VIEW_PATIENTS),
      canManagePatients: hasPermission(userRole, PERMISSIONS.MANAGE_PATIENTS),
      canCreatePatients: hasPermission(userRole, PERMISSIONS.CREATE_PATIENTS),
      canViewAnalytics: hasPermission(userRole, PERMISSIONS.VIEW_ANALYTICS),
      canManageShifts: hasPermission(userRole, PERMISSIONS.MANAGE_SCHEDULE) || userRole === 'head_doctor',
      canViewAuditLogs: hasPermission(userRole, PERMISSIONS.VIEW_ACTIVITY_LOGS),
      isLoading: false,
      isAuthenticated,
      user,
    };
  }, [user, hasHydrated, isAuthenticated]);
}

/**
 * Hook for admin access
 */
export function useAdminAccess() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  
  return useMemo(() => {
    // Return safe defaults when loading or no user role
    if (!hasHydrated || !user?.role) {
      return {
        isAdmin: false,
        isManagement: false,
        canManageUsers: false,
        canViewAnalytics: false,
        canManageOrganization: false,
        isLoading: !hasHydrated,
        isAuthenticated,
        user,
      };
    }
    
    const userRole = user.role as UserRole;
    
    return {
      isAdmin: isAdminRole(userRole),
      isManagement: isManagementRole(userRole),
      canManageUsers: hasPermission(userRole, PERMISSIONS.MANAGE_USERS),
      canViewAnalytics: hasPermission(userRole, PERMISSIONS.VIEW_ANALYTICS),
      canManageOrganization: hasPermission(userRole, PERMISSIONS.MANAGE_ORGANIZATION),
      isLoading: false,
      isAuthenticated,
      user,
    };
  }, [user, hasHydrated, isAuthenticated]);
}

/**
 * Hook to get all user permissions and role info
 */
export function useUserAccess() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  
  return useMemo(() => {
    // Return safe defaults when loading or no user role
    if (!hasHydrated || !user?.role) {
      return {
        user,
        role: undefined,
        isAuthenticated,
        isLoading: !hasHydrated,
        
        // Role checks - all false when loading
        isHealthcareRole: false,
        isAdminRole: false,
        isManagementRole: false,
        isMedicalStaff: false,
        
        // Permission checker functions - all return false when loading
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
        hasRole: () => false,
        hasFeatureAccess: () => false,
      };
    }
    
    const userRole = user.role as UserRole;
    
    return {
      user,
      role: userRole,
      isAuthenticated,
      isLoading: false,
      
      // Role checks
      isHealthcareRole: isHealthcareRole(userRole),
      isAdminRole: isAdminRole(userRole),
      isManagementRole: isManagementRole(userRole),
      isMedicalStaff: isMedicalStaff(userRole),
      
      // Permission checker functions
      hasPermission: (permission: Permission) => hasPermission(userRole, permission),
      hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
      hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
      hasRole: (roles: UserRole[]) => hasRole(userRole, roles),
      hasFeatureAccess: (feature: Feature) => hasFeatureAccess(userRole, feature),
    };
  }, [user, hasHydrated, isAuthenticated]);
}

// Re-export types and constants for convenience
export { PERMISSIONS, ROLE_GROUPS, FEATURES } from '@/lib/auth/permissions';
export type { Permission, UserRole, Feature } from '@/lib/auth/permissions';