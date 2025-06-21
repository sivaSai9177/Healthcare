#!/usr/bin/env node

/**
 * Test alert creation and escalation flow
 */

import { db } from '../src/db';
import { alerts, alertEscalations, alertTimelineEvents } from '../src/db/healthcare-schema';
import { user as users } from '../src/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { escalationTimerService } from '../src/server/services/escalation-timer';

const DEMO_HOSPITAL_ID = 'f155b026-01bd-4212-94f3-e7aedef2801d';

async function testAlertEscalation() {

  try {
    // Find an operator to create the alert
    const [operator] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, 'operator'),
          eq(users.organizationId, DEMO_HOSPITAL_ID)
        )
      )
      .limit(1);
    
    if (!operator) {
      console.error('❌ No operator found. Please run fix-user-organizations.ts first');
      return;
    }

    // Create a test alert with immediate escalation (for testing)
    const testAlert = {
      alertType: 'cardiac',
      urgencyLevel: 4, // High urgency
      roomNumber: 'TEST-101',
      patientId: 'test-patient-001',
      description: 'Test alert for escalation flow',
      status: 'active' as const,
      hospitalId: DEMO_HOSPITAL_ID,
      createdBy: operator.id,
      escalationLevel: 1,
      currentEscalationTier: 1,
      nextEscalationAt: new Date(Date.now() - 1000), // Set in the past to trigger immediate escalation
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [createdAlert] = await db
      .insert(alerts)
      .values(testAlert)
      .returning();

    // Add timeline event
    await db.insert(alertTimelineEvents).values({
      alertId: createdAlert.id,
      eventType: 'created',
      eventTime: new Date(),
      userId: operator.id,
      metadata: {
        alertType: testAlert.alertType,
        urgencyLevel: testAlert.urgencyLevel,
        roomNumber: testAlert.roomNumber,
      },
    });
    
    // Check staff by role

    const roles = ['nurse', 'doctor', 'head_doctor'];
    for (const role of roles) {
      const [{ count }] = await db
        .select({ count: users.id })
        .from(users)
        .where(
          and(
            eq(users.role, role),
            eq(users.organizationId, DEMO_HOSPITAL_ID)
          )
        );

    }
    
    // Test manual escalation

    try {
      const result = await escalationTimerService.triggerEscalation(createdAlert.id);

    } catch (error) {
      console.error('❌ Manual escalation failed:', error);
    }
    
    // Check escalation history
    const escalations = await db
      .select()
      .from(alertEscalations)
      .where(eq(alertEscalations.alertId, createdAlert.id))
      .orderBy(desc(alertEscalations.escalatedAt));

    escalations.forEach((esc, index) => {

    });
    
    // Check current alert status
    const [currentAlert] = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, createdAlert.id))
      .limit(1);

    // Test the automatic escalation timer

    escalationTimerService.start();

    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Stop the timer
    escalationTimerService.stop();

    // Final alert status
    const [finalAlert] = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, createdAlert.id))
      .limit(1);

    // Clean up - mark alert as resolved
    await db
      .update(alerts)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: operator.id,
      })
      .where(eq(alerts.id, createdAlert.id));

  } catch (error) {
    console.error('\n❌ Error testing alert escalation:', error);
  }
}

// Run the test
testAlertEscalation()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });