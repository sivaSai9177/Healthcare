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

      if (staff.hospitalId !== staff.userOrgId) {

      }
    });
    
    // 2. Check active alerts and their hospital assignments

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

      hospitalAlerts.forEach(alert => {

      });
    });
    
    // 3. Test organization filtering

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

    onDutyStaff.forEach(staff => {

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

    // 4. Summary

  } catch (error) {
    log.error('Test failed', 'TEST', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testAlertFlow();