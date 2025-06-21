import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useHospitalStore } from '@/lib/stores/hospital-store';
import {
  hasPermission,
  hasRole,
  canAccessHospital,
  canManageHospital,
  canCreateAlertInHospital,
  canResolveAlertInHospital,
  canAccessPatientInHospital,
  type Permission,
  type UserRole,
  type HospitalContext,
} from '@/lib/auth/permissions';

export function useHospitalPermissions() {
  const { user, hasHydrated } = useAuth();
  const { currentHospital, isLoading: hospitalLoading } = useHospitalStore();

  // Default safe context when data is not loaded
  const defaultContext: HospitalContext = {
    userRole: undefined,
    userHospitalId: undefined,
    targetHospitalId: undefined,
    userOrganizationId: undefined,
    targetOrganizationId: undefined,
  };

  const context = useMemo<HospitalContext>(() => {
    // Return default context if data is not loaded
    if (!hasHydrated || !user) {
      return defaultContext;
    }

    return {
      userRole: user?.role as UserRole | undefined,
      userHospitalId: user?.defaultHospitalId || currentHospital?.id,
      targetHospitalId: currentHospital?.id || user?.defaultHospitalId,
      userOrganizationId: user?.organizationId || undefined,
      targetOrganizationId: currentHospital?.organizationId || user?.organizationId,
    };
  }, [user, currentHospital, hasHydrated]);

  return useMemo(() => {
    // Return safe defaults when data is loading
    if (!hasHydrated || hospitalLoading) {
      return {
        // Basic permission checks - all false when loading
        hasPermission: () => false,
        hasRole: () => false,
        
        // Hospital-specific permissions - all false when loading
        canAccessCurrentHospital: () => false,
        canManageCurrentHospital: () => false,
        canCreateAlert: () => false,
        canResolveAlert: () => false,
        canAccessPatients: () => false,
        
        // Check permissions for a specific hospital
        canAccessHospital: () => false,
        
        // User info
        userRole: undefined,
        userHospitalId: undefined,
        currentHospitalId: undefined,
        
        // Helper flags
        isHealthcareUser: false,
        hasHospitalAssigned: false,
        
        // Loading state
        isLoading: true,
      };
    }

    return {
      // Basic permission checks with null safety
      hasPermission: (permission: Permission) => 
        user?.role ? hasPermission(user.role as UserRole, permission) : false,
      hasRole: (roles: UserRole[]) => 
        user?.role ? hasRole(user.role as UserRole, roles) : false,
      
      // Hospital-specific permissions
      canAccessCurrentHospital: () => canAccessHospital(context),
      canManageCurrentHospital: () => canManageHospital(context),
      canCreateAlert: () => canCreateAlertInHospital(context),
      canResolveAlert: () => canResolveAlertInHospital(context),
      canAccessPatients: () => canAccessPatientInHospital(context),
      
      // Check permissions for a specific hospital
      canAccessHospital: (hospitalId: string, organizationId: string) => 
        canAccessHospital({
          ...context,
          targetHospitalId: hospitalId,
          targetOrganizationId: organizationId,
        }),
      
      // User info
      userRole: user?.role as UserRole | undefined,
      userHospitalId: user?.defaultHospitalId || currentHospital?.id,
      currentHospitalId: currentHospital?.id,
      
      // Helper flags
      isHealthcareUser: !!user && ['doctor', 'nurse', 'operator', 'head_doctor'].includes(user.role),
      hasHospitalAssigned: !!(user?.defaultHospitalId || currentHospital?.id),
      
      // Loading state
      isLoading: false,
    };
  }, [context, user, currentHospital, hasHydrated, hospitalLoading]);
}