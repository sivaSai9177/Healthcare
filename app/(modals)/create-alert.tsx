import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import {
  Text,
  VStack,
  HStack,
  Button,
} from '@/components/universal';
import { AlertCreationFormSimplified } from '@/components/blocks/healthcare';
import { useAuth } from '@/hooks/useAuth';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';
import { useHealthcareAccess } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/blocks/auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { logger } from '@/lib/core/debug/unified-logger';
import { useHospitalStore } from '@/lib/stores/hospital-store';
import { useHospitalPermissions } from '@/hooks/useHospitalPermissions';

export default function CreateAlertModal() {
  const { spacing } = useSpacing();
  const { user } = useAuth();
  const theme = useTheme();
  const { currentHospital } = useHospitalStore();
  const hospitalPermissions = useHospitalPermissions();
  const useHealthcareAccessResult = useHealthcareAccess();
  const permissionsLoading = 'isLoading' in useHealthcareAccessResult ? useHealthcareAccessResult.isLoading : false;
  
  // Debug logging
  React.useEffect(() => {
    logger.healthcare.info('CreateAlertModal mounted', {
      user: user,
      organizationId: user?.organizationId,
      defaultHospitalId: user?.defaultHospitalId,
      currentHospitalId: currentHospital?.id,
      currentHospital: currentHospital,
      hospitalStoreState: {
        hasCurrentHospital: !!currentHospital,
        currentHospitalName: currentHospital?.name,
      },
      permissions: {
        canCreateAlerts: hospitalPermissions.canCreateAlert(),
        hasHospitalAssigned: hospitalPermissions.hasHospitalAssigned,
        userRole: hospitalPermissions.userRole,
        userHospitalId: hospitalPermissions.userHospitalId,
        currentHospitalId: hospitalPermissions.currentHospitalId,
      },
      permissionsLoading,
    });
  }, [user, currentHospital, hospitalPermissions, permissionsLoading]);
  
  const handleClose = () => {
    router.back();
  };
  
  // Get the hospital ID from either current hospital or user's default
  const hospitalId = currentHospital?.id || user?.defaultHospitalId;
  
  // Check if user has hospital assignment
  if (!hospitalId) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, padding: spacing[6] as any }}>
        <VStack gap={spacing[6] as any} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text size="base" weight="semibold">Hospital Assignment Required</Text>
          <Text colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
            You need to be assigned to a hospital to create alerts.
          </Text>
          <VStack gap={spacing[3] as any}>
            <Button 
              onPress={() => {
                router.back();
                router.push('/(tabs)/settings' as any);
              }}
            >
              Complete Your Profile
            </Button>
            <Button 
              onPress={handleClose}
              variant="outline"
            >
              Cancel
            </Button>
          </VStack>
        </VStack>
      </View>
    );
  }

  // Check permissions with hospital context
  if (!permissionsLoading && !hospitalPermissions.canCreateAlert()) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, padding: spacing[6] as any }}>
        <VStack gap={spacing[6] as any} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text size="base" weight="semibold">Permission Denied</Text>
          <Text colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
            You don&apos;t have permission to create alerts in this hospital.
          </Text>
          <Button onPress={handleClose} variant="outline">
            Go Back
          </Button>
        </VStack>
      </View>
    );
  }

  return (
    <PermissionGuard permission={PERMISSIONS.CREATE_ALERTS}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            padding: spacing[6] as any,
            paddingBottom: spacing[8] as any,
          }}
          showsVerticalScrollIndicator={false}
        >
          <VStack gap={spacing[6] as any}>
            {/* Header */}
            <VStack gap={spacing[3] as any} alignItems="center">
              <Text size="2xl" weight="bold">
                Create Emergency Alert
              </Text>
              <Text size="sm" colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
                Send an alert to medical staff for immediate response
              </Text>
            </VStack>

            {/* Alert Creation Form */}
            <AlertCreationFormSimplified 
              hospitalId={hospitalId} 
              onSuccess={handleClose}
            />

            {/* Close Button */}
            <HStack justifyContent="center">
              <Button
                variant="outline"
                onPress={handleClose}
                size="default"
                style={{ minWidth: 120 }}
              >
                Close
              </Button>
            </HStack>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
    </PermissionGuard>
  );
}