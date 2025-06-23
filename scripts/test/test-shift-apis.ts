#!/usr/bin/env ts-node

import { TRPCError } from '@trpc/server';
import { appRouter } from '../../src/server/routers/_app';
import { db } from '../../src/server/db';
import { users, healthcareProfiles, shiftLogs } from '../../src/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { serverLogger as log } from '../../src/server/services/server-logger';

/**
 * Test script for shift management APIs
 * Tests all shift-related endpoints with different user roles
 */

async function createTestContext(role: string, hospitalId?: string) {
  // Find a test user with the specified role
  const [testUser] = await db
    .select()
    .from(users)
    .where(eq(users.role, role))
    .limit(1);

  if (!testUser) {
    throw new Error(`No test user found with role: ${role}`);
  }

  // Get healthcare profile if applicable
  let healthcareProfile = null;
  if (['doctor', 'nurse', 'head_doctor', 'operator'].includes(role)) {
    [healthcareProfile] = await db
      .select()
      .from(healthcareProfiles)
      .where(eq(healthcareProfiles.userId, testUser.id))
      .limit(1);
  }

  return {
    user: testUser,
    session: { user: testUser, expires: new Date(Date.now() + 3600000).toISOString() },
    hospitalContext: healthcareProfile ? {
      userHospitalId: healthcareProfile.hospitalId,
      departmentId: healthcareProfile.departmentId,
      isHealthcareStaff: true,
    } : null,
  };
}

async function testShiftAPIs() {
  console.log('🧪 Testing Shift Management APIs...\n');

  try {
    // Test 1: Get shift status for a doctor
    console.log('1️⃣ Testing getShiftStatus for doctor...');
    const doctorCtx = await createTestContext('doctor');
    
    try {
      const shiftStatus = await appRouter.healthcare.getShiftStatus({
        ctx: doctorCtx as any,
        input: undefined,
        type: 'query',
      });
      
      console.log('✅ Shift status retrieved:', {
        isOnDuty: shiftStatus.isOnDuty,
        canStartShift: shiftStatus.canStartShift,
        canEndShift: shiftStatus.canEndShift,
        shiftDurationHours: shiftStatus.shiftDurationHours,
      });
    } catch (error: any) {
      console.log('❌ Failed to get shift status:', error.message);
    }

    // Test 2: Start shift
    console.log('\n2️⃣ Testing toggleOnDuty (start shift)...');
    try {
      const startShiftResult = await appRouter.healthcare.toggleOnDuty({
        ctx: doctorCtx as any,
        input: { isOnDuty: true },
        type: 'mutation',
      });
      
      console.log('✅ Shift started:', {
        isOnDuty: startShiftResult.isOnDuty,
        message: startShiftResult.message,
      });
    } catch (error: any) {
      console.log('❌ Failed to start shift:', error.message);
    }

    // Test 3: Get on-duty staff
    console.log('\n3️⃣ Testing getOnDutyStaff...');
    if (doctorCtx.hospitalContext?.userHospitalId) {
      try {
        const onDutyStaff = await appRouter.healthcare.getOnDutyStaff({
          ctx: doctorCtx as any,
          input: { hospitalId: doctorCtx.hospitalContext.userHospitalId },
          type: 'query',
        });
        
        console.log('✅ On-duty staff retrieved:', {
          total: onDutyStaff.total,
          byDepartment: Object.keys(onDutyStaff.byDepartment),
          doctorsOnDuty: onDutyStaff.doctors.length,
          nursesOnDuty: onDutyStaff.nurses.length,
        });
      } catch (error: any) {
        console.log('❌ Failed to get on-duty staff:', error.message);
      }
    }

    // Test 4: End shift without handover (should fail if active alerts)
    console.log('\n4️⃣ Testing toggleOnDuty (end shift without handover)...');
    try {
      const endShiftResult = await appRouter.healthcare.toggleOnDuty({
        ctx: doctorCtx as any,
        input: { isOnDuty: false },
        type: 'mutation',
      });
      
      console.log('✅ Shift ended without handover:', endShiftResult);
    } catch (error: any) {
      if (error.message.includes('handover')) {
        console.log('⚠️ Handover required (expected):', error.message);
      } else {
        console.log('❌ Failed to end shift:', error.message);
      }
    }

    // Test 5: End shift with handover
    console.log('\n5️⃣ Testing toggleOnDuty (end shift with handover)...');
    try {
      const endShiftWithHandover = await appRouter.healthcare.toggleOnDuty({
        ctx: doctorCtx as any,
        input: { 
          isOnDuty: false,
          handoverNotes: 'All patients stable. No critical issues. Regular monitoring continues.'
        },
        type: 'mutation',
      });
      
      console.log('✅ Shift ended with handover:', {
        isOnDuty: endShiftWithHandover.isOnDuty,
        message: endShiftWithHandover.message,
        shiftDuration: endShiftWithHandover.shiftDuration,
      });
    } catch (error: any) {
      console.log('❌ Failed to end shift with handover:', error.message);
    }

    // Test 6: Test with nurse role
    console.log('\n6️⃣ Testing shift APIs with nurse role...');
    const nurseCtx = await createTestContext('nurse');
    
    try {
      const nurseShiftStatus = await appRouter.healthcare.getShiftStatus({
        ctx: nurseCtx as any,
        input: undefined,
        type: 'query',
      });
      
      console.log('✅ Nurse shift status:', {
        isOnDuty: nurseShiftStatus.isOnDuty,
        role: nurseCtx.user.role,
      });
    } catch (error: any) {
      console.log('❌ Failed to get nurse shift status:', error.message);
    }

    // Test 7: Test unauthorized access (user without healthcare role)
    console.log('\n7️⃣ Testing unauthorized access...');
    try {
      const regularUserCtx = await createTestContext('user');
      
      const unauthorizedResult = await appRouter.healthcare.getShiftStatus({
        ctx: regularUserCtx as any,
        input: undefined,
        type: 'query',
      });
      
      console.log('❌ Unauthorized access succeeded (should have failed):', unauthorizedResult);
    } catch (error: any) {
      if (error.code === 'FORBIDDEN') {
        console.log('✅ Unauthorized access blocked (expected):', error.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Clean up: Get active shifts and end them
    console.log('\n🧹 Cleaning up active shifts...');
    const activeShifts = await db
      .select()
      .from(shiftLogs)
      .where(and(
        eq(shiftLogs.endTime, null as any),
        eq(shiftLogs.isActive, true)
      ))
      .limit(5);
    
    console.log(`Found ${activeShifts.length} active shifts to clean up`);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }

  console.log('\n✨ Shift API tests completed!\n');
}

// Run the tests
testShiftAPIs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });