import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '@/components/universal/typography';
import { VStack } from '@/components/universal/layout';
import { Card } from '@/components/universal/display';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import {
  usePermission,
  usePermissions,
  useRole,
  useFeatureAccess,
  useHealthcareAccess,
  useAdminAccess,
  type Permission,
  type UserRole,
  type Feature,
} from '@/hooks/usePermissions';

interface BaseGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  showError?: boolean;
  errorMessage?: string;
}

/**
 * Default fallback component for unauthorized access
 */
const DefaultUnauthorizedFallback = ({ message }: { message?: string }) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  
  return (
    <Card>
      <VStack gap={spacing[3] as any} p={spacing[4] as any} alignItems="center">
        <Text size="lg" colorTheme="mutedForeground">Access Restricted</Text>
        <Text size="sm" colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
          {message || 'You do not have permission to view this content'}
        </Text>
      </VStack>
    </Card>
  );
};

/**
 * Default loading fallback
 */
const DefaultLoadingFallback = () => {
  const theme = useTheme();
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
};

/**
 * Guard component that shows/hides content based on a single permission
 */
export function PermissionGuard({
  permission,
  children,
  fallback,
  loadingFallback,
  showError = true,
  errorMessage,
}: BaseGuardProps & { permission: Permission }) {
  const { hasPermission, isLoading, isAuthenticated } = usePermission(permission);
  
  if (isLoading) {
    return <>{loadingFallback || <DefaultLoadingFallback />}</>;
  }
  
  if (!isAuthenticated || !hasPermission) {
    if (!showError) return null;
    return <>{fallback || <DefaultUnauthorizedFallback message={errorMessage} />}</>;
  }
  
  return <>{children}</>;
}

/**
 * Guard component that shows/hides content based on multiple permissions (requires any)
 */
export function PermissionsGuard({
  permissions,
  requireAll = false,
  children,
  fallback,
  loadingFallback,
  showError = true,
  errorMessage,
}: BaseGuardProps & { permissions: Permission[]; requireAll?: boolean }) {
  const { hasAnyPermission, hasAllPermissions, isLoading, isAuthenticated } = usePermissions(permissions);
  
  if (isLoading) {
    return <>{loadingFallback || <DefaultLoadingFallback />}</>;
  }
  
  const hasAccess = requireAll ? hasAllPermissions : hasAnyPermission;
  
  if (!isAuthenticated || !hasAccess) {
    if (!showError) return null;
    return <>{fallback || <DefaultUnauthorizedFallback message={errorMessage} />}</>;
  }
  
  return <>{children}</>;
}

/**
 * Guard component that shows/hides content based on user role
 */
export function RoleGuard({
  roles,
  children,
  fallback,
  loadingFallback,
  showError = true,
  errorMessage,
}: BaseGuardProps & { roles: UserRole[] }) {
  const { hasRole, isLoading, isAuthenticated } = useRole(roles);
  
  if (isLoading) {
    return <>{loadingFallback || <DefaultLoadingFallback />}</>;
  }
  
  if (!isAuthenticated || !hasRole) {
    if (!showError) return null;
    return <>{fallback || <DefaultUnauthorizedFallback message={errorMessage} />}</>;
  }
  
  return <>{children}</>;
}

/**
 * Guard component for feature-based access control
 */
export function FeatureGuard({
  feature,
  children,
  fallback,
  loadingFallback,
  showError = true,
  errorMessage,
}: BaseGuardProps & { feature: Feature }) {
  const { hasAccess, isLoading, isAuthenticated } = useFeatureAccess(feature);
  
  if (isLoading) {
    return <>{loadingFallback || <DefaultLoadingFallback />}</>;
  }
  
  if (!isAuthenticated || !hasAccess) {
    if (!showError) return null;
    return <>{fallback || <DefaultUnauthorizedFallback message={errorMessage} />}</>;
  }
  
  return <>{children}</>;
}

/**
 * Specialized guard for healthcare features
 */
export function HealthcareOnly({
  children,
  fallback,
  loadingFallback,
  requireMedicalStaff = false,
}: BaseGuardProps & { requireMedicalStaff?: boolean }) {
  const { isHealthcareRole, isMedicalStaff, isLoading, isAuthenticated } = useHealthcareAccess();
  
  if (isLoading) {
    return <>{loadingFallback || <DefaultLoadingFallback />}</>;
  }
  
  const hasAccess = requireMedicalStaff ? isMedicalStaff : isHealthcareRole;
  
  if (!isAuthenticated || !hasAccess) {
    return <>{fallback || 
      <DefaultUnauthorizedFallback 
        message={requireMedicalStaff 
          ? "This section is only available to medical staff"
          : "This section is only available to healthcare professionals"
        } 
      />
    }</>;
  }
  
  return <>{children}</>;
}

/**
 * Specialized guard for admin features
 */
export function AdminOnly({
  children,
  fallback,
  loadingFallback,
  allowManagement = false,
}: BaseGuardProps & { allowManagement?: boolean }) {
  const { isAdmin, isManagement, isLoading, isAuthenticated } = useAdminAccess();
  
  if (isLoading) {
    return <>{loadingFallback || <DefaultLoadingFallback />}</>;
  }
  
  const hasAccess = allowManagement ? (isAdmin || isManagement) : isAdmin;
  
  if (!isAuthenticated || !hasAccess) {
    return <>{fallback || 
      <DefaultUnauthorizedFallback 
        message={allowManagement
          ? "This section is only available to administrators and managers"
          : "This section is only available to administrators"
        } 
      />
    }</>;
  }
  
  return <>{children}</>;
}

/**
 * Higher-order component for permission-based rendering
 */
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission,
  options?: {
    fallback?: React.ReactNode;
    errorMessage?: string;
  }
) {
  return function GuardedComponent(props: P) {
    return (
      <PermissionGuard 
        permission={permission} 
        fallback={options?.fallback}
        errorMessage={options?.errorMessage}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

/**
 * Higher-order component for role-based rendering
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  roles: UserRole[],
  options?: {
    fallback?: React.ReactNode;
    errorMessage?: string;
  }
) {
  return function GuardedComponent(props: P) {
    return (
      <RoleGuard 
        roles={roles} 
        fallback={options?.fallback}
        errorMessage={options?.errorMessage}
      >
        <Component {...props} />
      </RoleGuard>
    );
  };
}

// Re-export for convenience
export { PERMISSIONS, ROLE_GROUPS, FEATURES } from '@/lib/auth/permissions';
export type { Permission, UserRole, Feature } from '@/lib/auth/permissions';