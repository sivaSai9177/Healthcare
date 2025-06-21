#!/usr/bin/env bun
import { db } from '@/src/db';
import { alerts } from '@/src/db/healthcare-schema';
import { users } from '@/src/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

async function testAlertsAPI() {

  try {
    // Get the test user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'nagarajarao.sirigiri@gmail.com'))
      .limit(1);
    
    if (!user || !user.defaultHospitalId) {

      return;
    }

    // Simulate the getActiveAlerts query
    const hospitalId = user.defaultHospitalId;
    const activeAlerts = await db
      .select({
        id: alerts.id,
        alertType: alerts.alertType,
        urgencyLevel: alerts.urgencyLevel,
        roomNumber: alerts.roomNumber,
        patientId: alerts.patientId,
        description: alerts.description,
        status: alerts.status,
        hospitalId: alerts.hospitalId,
        createdAt: alerts.createdAt,
        createdBy: alerts.createdBy,
        acknowledgedBy: alerts.acknowledgedBy,
        acknowledgedAt: alerts.acknowledgedAt,
        currentEscalationTier: alerts.currentEscalationTier,
        nextEscalationAt: alerts.nextEscalationAt,
        escalationLevel: alerts.escalationLevel,
        resolvedAt: alerts.resolvedAt,
      })
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

    activeAlerts.forEach((alert, index) => {

    });
    
    if (activeAlerts.length === 0) {

    } else {

    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

testAlertsAPI();