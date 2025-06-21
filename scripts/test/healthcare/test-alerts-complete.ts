#!/usr/bin/env bun
import { db } from '@/src/db';
import { alerts, healthcareUsers } from '@/src/db/healthcare-schema';
import { users } from '@/src/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

async function testAlertsComplete() {

  try {
    // Get all users with healthcare roles
    const healthcareUsersList = await db
      .select({
        userId: users.id,
        email: users.email,
        role: users.role,
        hospitalId: users.defaultHospitalId,
        organizationId: users.organizationId,
        healthcareHospitalId: healthcareUsers.hospitalId,
        department: healthcareUsers.department,
        isOnDuty: healthcareUsers.isOnDuty,
      })
      .from(users)
      .leftJoin(healthcareUsers, eq(healthcareUsers.userId, users.id))
      .where(
        or(
          eq(users.role, 'nurse'),
          eq(users.role, 'doctor'),
          eq(users.role, 'operator'),
          eq(users.role, 'head_nurse'),
          eq(users.role, 'head_doctor')
        )
      );

    for (const user of healthcareUsersList) {

      // Test hospital context resolution
      const hospitalId = user.hospitalId || user.healthcareHospitalId;

      if (!hospitalId) {

        continue;
      }
      
      // Test alerts query for this user
      const userAlerts = await db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.hospitalId, hospitalId),
            or(
              eq(alerts.status, 'active'),
              eq(alerts.status, 'acknowledged')
            )
          )
        )
        .orderBy(desc(alerts.urgencyLevel), desc(alerts.createdAt));

    }

    const allAlerts = await db
      .select({
        id: alerts.id,
        roomNumber: alerts.roomNumber,
        alertType: alerts.alertType,
        urgencyLevel: alerts.urgencyLevel,
        status: alerts.status,
        hospitalId: alerts.hospitalId,
        createdAt: alerts.createdAt,
        description: alerts.description,
      })
      .from(alerts)
      .where(
        or(
          eq(alerts.status, 'active'),
          eq(alerts.status, 'acknowledged')
        )
      )
      .orderBy(desc(alerts.createdAt));
    
    if (allAlerts.length === 0) {

    } else {
      allAlerts.forEach((alert, index) => {

        if (alert.description) {

        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

testAlertsComplete();