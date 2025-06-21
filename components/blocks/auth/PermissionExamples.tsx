/**
 * Examples of using the permission system
 * This file demonstrates various ways to use permission-based UI components
 */

import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { VStack } from '@/components/universal/layout';

// Import permission guards
import {
  PermissionGuard,
  RoleGuard,
  FeatureGuard,
  HealthcareOnly,
  AdminOnly,
  PERMISSIONS,
  FEATURES,
  type UserRole,
} from './PermissionGuard';

// Import hooks
import {
  usePermission,
  useHealthcareAccess,
  useFeatureAccess,
} from '@/hooks/usePermissions';

/**
 * Example 1: Using permission guards for conditional rendering
 */
export function AlertCreationExample() {
  return (
    <VStack gap={4}>
      {/* Only show create alert button to users with permission */}
      <PermissionGuard permission={PERMISSIONS.CREATE_ALERTS} showError={false}>
        <Button variant="destructive" size="lg">
          Create Emergency Alert
        </Button>
      </PermissionGuard>

      {/* Show different content based on healthcare role */}
      <HealthcareOnly>
        <Text>Welcome to the Healthcare Dashboard</Text>
      </HealthcareOnly>

      {/* Medical staff only section */}
      <HealthcareOnly requireMedicalStaff>
        <Text>Patient Management Tools</Text>
      </HealthcareOnly>
    </VStack>
  );
}

/**
 * Example 2: Using hooks for programmatic access control
 */
export function ConditionalActionsExample() {
  const { canCreateAlerts, canAcknowledgeAlerts } = useHealthcareAccess();
  const { hasAccess: canViewAnalytics } = useFeatureAccess(FEATURES.ANALYTICS);

  return (
    <VStack gap={4}>
      {/* Conditionally render based on permissions */}
      {canCreateAlerts && (
        <Button variant="destructive">Create Alert</Button>
      )}

      {canAcknowledgeAlerts && (
        <Button variant="secondary">Acknowledge Alert</Button>
      )}

      {canViewAnalytics && (
        <Button variant="outline">View Analytics</Button>
      )}
    </VStack>
  );
}

/**
 * Example 3: Role-based navigation
 */
export function NavigationExample() {
  return (
    <VStack gap={4}>
      {/* Admin only navigation item */}
      <AdminOnly showError={false}>
        <Button>System Settings</Button>
      </AdminOnly>

      {/* Management roles (admin, manager, head_doctor) */}
      <AdminOnly allowManagement showError={false}>
        <Button>Team Management</Button>
      </AdminOnly>

      {/* Specific roles */}
      <RoleGuard roles={['doctor' as UserRole, 'head_doctor' as UserRole]} showError={false}>
        <Button>Patient Records</Button>
      </RoleGuard>
    </VStack>
  );
}

/**
 * Example 4: Feature-based access control
 */
export function FeatureAccessExample() {
  return (
    <VStack gap={4}>
      <FeatureGuard feature={FEATURES.ALERTS_DASHBOARD}>
        <View>
          <Text>Alert Dashboard Content</Text>
        </View>
      </FeatureGuard>

      <FeatureGuard 
        feature={FEATURES.ANALYTICS} 
        errorMessage="You need analytics access to view this section"
      >
        <View>
          <Text>Analytics Dashboard</Text>
        </View>
      </FeatureGuard>
    </VStack>
  );
}

/**
 * Example 5: Custom fallback components
 */
export function CustomFallbackExample() {
  const CustomFallback = () => (
    <View style={{ padding: 20, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
      <Text>🔒 Premium Feature</Text>
      <Text>Upgrade your account to access this feature</Text>
    </View>
  );

  return (
    <PermissionGuard 
      permission={PERMISSIONS.VIEW_ANALYTICS}
      fallback={<CustomFallback />}
    >
      <Text>Premium Analytics Content</Text>
    </PermissionGuard>
  );
}

/**
 * Example 6: Using hooks for complex logic
 */
export function ComplexPermissionLogic() {
  const { hasPermission } = usePermission(PERMISSIONS.CREATE_ALERTS);
  const { isHealthcareRole, isMedicalStaff } = useHealthcareAccess();

  // Complex permission logic
  const canPerformAction = isHealthcareRole && (hasPermission || isMedicalStaff);

  return (
    <VStack gap={4}>
      <Text>Complex Permission Status: {canPerformAction ? 'Allowed' : 'Denied'}</Text>
      
      {canPerformAction && (
        <Button>Perform Protected Action</Button>
      )}
    </VStack>
  );
}