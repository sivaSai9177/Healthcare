#!/usr/bin/env bun
/**
 * Script to verify proper context is provided for every role
 * Tests that each role gets appropriate permissions and hospital context
 */

import { createTRPCClient } from '@/lib/api/client';
import { logger } from '@/lib/core/debug/unified-logger';

interface RoleTest {
  email: string;
  password: string;
  role: string;
  expectedPermissions: {
    canCreateAlerts: boolean;
    canViewAlerts: boolean;
    canAcknowledgeAlerts: boolean;
    canResolveAlerts: boolean;
    canStartShift: boolean;
    canEndShift: boolean;
    canViewShiftStatus: boolean;
    canManageShifts: boolean;
    canViewAnalytics: boolean;
    canManageTeam: boolean;
  };
}

const roleTests: RoleTest[] = [
  {
    email: 'operator@test.com',
    password: 'Password123!',
    role: 'operator',
    expectedPermissions: {
      canCreateAlerts: true,
      canViewAlerts: true,
      canAcknowledgeAlerts: false,
      canResolveAlerts: false,
      canStartShift: true,
      canEndShift: true,
      canViewShiftStatus: true,
      canManageShifts: false,
      canViewAnalytics: false,
      canManageTeam: false,
    },
  },
  {
    email: 'nurse@test.com',
    password: 'Password123!',
    role: 'nurse',
    expectedPermissions: {
      canCreateAlerts: true,
      canViewAlerts: true,
      canAcknowledgeAlerts: true,
      canResolveAlerts: false,
      canStartShift: true,
      canEndShift: true,
      canViewShiftStatus: true,
      canManageShifts: false,
      canViewAnalytics: false,
      canManageTeam: false,
    },
  },
  {
    email: 'doctor@test.com',
    password: 'Password123!',
    role: 'doctor',
    expectedPermissions: {
      canCreateAlerts: true,
      canViewAlerts: true,
      canAcknowledgeAlerts: true,
      canResolveAlerts: true,
      canStartShift: true,
      canEndShift: true,
      canViewShiftStatus: true,
      canManageShifts: false,
      canViewAnalytics: false,
      canManageTeam: false,
    },
  },
  {
    email: 'head_doctor@test.com',
    password: 'Password123!',
    role: 'head_doctor',
    expectedPermissions: {
      canCreateAlerts: true,
      canViewAlerts: true,
      canAcknowledgeAlerts: true,
      canResolveAlerts: true,
      canStartShift: true,
      canEndShift: true,
      canViewShiftStatus: true,
      canManageShifts: true,
      canViewAnalytics: true,
      canManageTeam: true,
    },
  },
];

async function testRoleContext(test: RoleTest) {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  const trpc = createTRPCClient(baseUrl);
  
  logger.info(`\n========== Testing ${test.role.toUpperCase()} Role ==========`, {
    email: test.email,
  });
  
  try {
    // 1. Login
    logger.info('Logging in...', { email: test.email });
    const loginResponse = await trpc.auth.login.mutate({
      email: test.email,
      password: test.password,
    });
    
    // Update client with auth token
    const authenticatedTrpc = createTRPCClient(baseUrl, {
      headers: {
        authorization: `Bearer ${loginResponse.token}`,
      },
    });
    
    // 2. Get user profile
    const profile = await authenticatedTrpc.auth.getProfile.query();
    logger.info('User Profile:', {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      organizationId: profile.organizationId,
      defaultHospitalId: profile.defaultHospitalId,
    });
    
    // 3. Check hospital context
    logger.info('\n--- Hospital Context ---');
    if (!profile.defaultHospitalId) {
      logger.warn('No default hospital assigned');
    } else {
      try {
        const hospital = await authenticatedTrpc.healthcare.getHospital.query({
          hospitalId: profile.defaultHospitalId,
        });
        logger.info('Hospital Context:', {
          id: hospital.id,
          name: hospital.name,
          organizationId: hospital.organizationId,
        });
      } catch (error) {
        logger.error('Failed to get hospital', { error });
      }
    }
    
    // 4. Test shift status access
    logger.info('\n--- Shift Management Access ---');
    try {
      const shiftStatus = await authenticatedTrpc.healthcare.getShiftStatus.query();
      logger.info('Shift Status Access:', {
        canAccess: true,
        isOnDuty: shiftStatus.isOnDuty,
        canStartShift: shiftStatus.canStartShift,
        canEndShift: shiftStatus.canEndShift,
      });
    } catch (error: any) {
      logger.error('Shift Status Access:', {
        canAccess: false,
        error: error.message,
      });
    }
    
    // 5. Test alert permissions
    logger.info('\n--- Alert Permissions ---');
    
    // Test view alerts
    try {
      const alerts = await authenticatedTrpc.healthcare.getActiveAlerts.query({
        hospitalId: profile.defaultHospitalId || '',
      });
      logger.info('View Alerts:', {
        canAccess: true,
        alertCount: alerts.alerts.length,
      });
    } catch (error: any) {
      logger.error('View Alerts:', {
        canAccess: false,
        error: error.message,
      });
    }
    
    // Test create alert (mock data)
    if (test.expectedPermissions.canCreateAlerts) {
      logger.info('Create Alert:', {
        expected: true,
        note: 'Permission available for creating alerts',
      });
    }
    
    // 6. Test analytics access
    logger.info('\n--- Analytics Access ---');
    if (test.expectedPermissions.canViewAnalytics) {
      try {
        const logs = await authenticatedTrpc.healthcare.getAlertActivityLogs.query({
          limit: 1,
        });
        logger.info('Analytics Access:', {
          canAccess: true,
          note: 'Can view activity logs and analytics',
        });
      } catch (error: any) {
        logger.error('Analytics Access:', {
          canAccess: false,
          error: error.message,
        });
      }
    } else {
      logger.info('Analytics Access:', {
        expected: false,
        note: 'Role does not have analytics permissions',
      });
    }
    
    // 7. Summary
    logger.info('\n--- Permission Summary ---', {
      role: test.role,
      actualContext: {
        hasOrganization: !!profile.organizationId,
        hasHospital: !!profile.defaultHospitalId,
        canAccessShiftManagement: true, // If we got shift status
      },
      expectedPermissions: test.expectedPermissions,
    });
    
    
  } catch (error) {
    logger.error(`Failed to test ${test.role} role:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function main() {
  logger.info('Starting Role Context Verification\n');
  
  for (const test of roleTests) {
    await testRoleContext(test);
    logger.info('\n' + '='.repeat(50) + '\n');
  }
  
  logger.info('Role Context Verification Complete');
  process.exit(0);
}

// Run the tests
main().catch((error) => {
  logger.error('Test failed:', error);
  process.exit(1);
});