import React from 'react';
import { useHospitalPermissions } from '@/hooks/useHospitalPermissions';
import type { Permission, UserRole } from '@/lib/auth/permissions';

// Type-safe permission guard component
interface HospitalPermissionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireHospital?: boolean;
  requirePermission?: Permission;
  requireRole?: UserRole[];
  requireCreateAlert?: boolean;
  requireResolveAlert?: boolean;
  requirePatientAccess?: boolean;
}

export function HospitalPermissionGuard({
  children,
  fallback = null,
  requireHospital = false,
  requirePermission,
  requireRole,
  requireCreateAlert = false,
  requireResolveAlert = false,
  requirePatientAccess = false,
}: HospitalPermissionGuardProps) {
  const permissions = useHospitalPermissions();
  
  // Check hospital requirement
  if (requireHospital && !permissions.hasHospitalAssigned) {
    return <>{fallback}</>;
  }
  
  // Check basic permission
  if (requirePermission && !permissions.hasPermission(requirePermission)) {
    return <>{fallback}</>;
  }
  
  // Check role requirement
  if (requireRole && !permissions.hasRole(requireRole)) {
    return <>{fallback}</>;
  }
  
  // Check hospital-specific permissions
  if (requireCreateAlert && !permissions.canCreateAlert()) {
    return <>{fallback}</>;
  }
  
  if (requireResolveAlert && !permissions.canResolveAlert()) {
    return <>{fallback}</>;
  }
  
  if (requirePatientAccess && !permissions.canAccessPatients()) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}