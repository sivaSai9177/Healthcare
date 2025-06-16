#!/usr/bin/env bun
import { db } from '@/src/db';
import { alerts, healthcareUsers } from '@/src/db/healthcare-schema';
import { user } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/core/debug/logger';

async function testAlertFlow() {
  log.info('Testing alert management flow with organizations...', 'TEST');
  
  try {
    // 1. Check healthcare users and their organizations
    console.log('\n1. Healthcare Users and Organizations:');
    console.log('=====================================');
    
    const healthcareStaff = await db
      .select({
        userId: healthcareUsers.userId,
        hospitalId: healthcareUsers.hospitalId,
        isOnDuty: healthcareUsers.isOnDuty,
        department: healthcareUsers.department,
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        userOrgId: user.organizationId,
      })
      .from(healthcareUsers)
      .innerJoin(user, eq(healthcareUsers.userId, user.id));
    
    healthcareStaff.forEach(staff => {
      console.log(`\n${staff.userName} (${staff.userEmail})`);
      console.log(`  Role: ${staff.userRole}`);
      console.log(`  Hospital ID: ${staff.hospitalId}`);
      console.log(`  User Org ID: ${staff.userOrgId}`);
      console.log(`  Department: ${staff.department}`);
      console.log(`  On Duty: ${staff.isOnDuty ? 'Yes' : 'No'}`);
      
      if (staff.hospitalId !== staff.userOrgId) {
        console.log('  ⚠️  WARNING: Hospital ID does not match User Organization ID!');
      }
    });
    
    // 2. Check active alerts and their hospital assignments
    console.log('\n\n2. Active Alerts by Organization:');
    console.log('=================================');
    
    const activeAlerts = await db
      .select()
      .from(alerts)
      .where(eq(alerts.status, 'active'));
    
    const alertsByHospital = activeAlerts.reduce((acc, alert) => {
      const hospitalId = alert.hospitalId;
      if (!acc[hospitalId]) {
        acc[hospitalId] = [];
      }
      acc[hospitalId].push(alert);
      return acc;
    }, {} as Record<string, typeof activeAlerts>);
    
    Object.entries(alertsByHospital).forEach(([hospitalId, hospitalAlerts]) => {
      console.log(`\nHospital ${hospitalId}:`);
      console.log(`  Active alerts: ${hospitalAlerts.length}`);
      hospitalAlerts.forEach(alert => {
        console.log(`    - Room ${alert.roomNumber}: ${alert.alertType} (Level ${alert.urgencyLevel})`);
      });
    });
    
    // 3. Test organization filtering
    console.log('\n\n3. Organization Filtering Test:');
    console.log('==============================');
    
    const testHospitalId = 'f155b026-01bd-4212-94f3-e7aedef2801d'; // Default hospital
    
    // Get on-duty staff for specific hospital
    const onDutyStaff = await db
      .select({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })
      .from(healthcareUsers)
      .innerJoin(user, eq(healthcareUsers.userId, user.id))
      .where(
        and(
          eq(healthcareUsers.hospitalId, testHospitalId),
          eq(healthcareUsers.isOnDuty, true)
        )
      );
    
    console.log(`\nOn-duty staff for hospital ${testHospitalId}:`);
    onDutyStaff.forEach(staff => {
      console.log(`  - ${staff.name} (${staff.role})`);
    });
    
    // Get alerts for specific hospital
    const hospitalAlerts = await db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.hospitalId, testHospitalId),
          eq(alerts.status, 'active')
        )
      );
    
    console.log(`\nActive alerts for hospital ${testHospitalId}: ${hospitalAlerts.length}`);
    
    // 4. Summary
    console.log('\n\n4. Summary:');
    console.log('===========');
    console.log(`✅ Healthcare users have matching organization IDs: ${
      healthcareStaff.every(s => s.hospitalId === s.userOrgId) ? 'Yes' : 'No'
    }`);
    console.log(`✅ Alerts are properly assigned to hospitals: ${
      activeAlerts.every(a => a.hospitalId) ? 'Yes' : 'No'
    }`);
    console.log(`✅ Organization filtering works correctly: ${
      onDutyStaff.length > 0 ? 'Yes' : 'No staff on duty'
    }`);
    
  } catch (error) {
    log.error('Test failed', 'TEST', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testAlertFlow();