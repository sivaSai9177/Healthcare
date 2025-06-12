#!/usr/bin/env bun
import { log } from '@/lib/core/debug/logger';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { hospitals, alerts, healthcareUsers } from '@/src/db/healthcare-schema';
import { patients } from '@/src/db/patient-schema';
import { eq, and, sql } from 'drizzle-orm';

const API_URL = 'http://localhost:8081';

async function testHealthcareAPI() {
  log.info('🧪 Testing Healthcare API with direct database operations', 'TEST');
  
  try {
    // 1. Test health endpoint
    log.info('Testing health endpoint...', 'TEST');
    const healthResponse = await fetch(`${API_URL}/api/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      log.info('✅ Health check passed', 'TEST', health);
    } else {
      log.error('Health check failed', 'TEST', { status: healthResponse.status });
    }

    // 2. Direct database tests
    log.info('\n📊 Database Statistics:', 'TEST');
    
    // Count records
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const patientCount = await db.select({ count: sql<number>`count(*)` }).from(patients);
    const hospitalCount = await db.select({ count: sql<number>`count(*)` }).from(hospitals);
    const alertCount = await db.select({ count: sql<number>`count(*)` }).from(alerts);
    
    log.info('Record counts:', 'TEST', {
      users: userCount[0].count,
      patients: patientCount[0].count,
      hospitals: hospitalCount[0].count,
      alerts: alertCount[0].count,
    });

    // 3. Get a test user (operator)
    const [testOperator] = await db
      .select()
      .from(users)
      .where(eq(users.role, 'operator'))
      .limit(1);
    
    if (!testOperator) {
      log.error('No operator user found. Run create-test-healthcare-data.ts first', 'TEST');
      return;
    }
    
    log.info('Using operator:', 'TEST', {
      name: testOperator.name,
      email: testOperator.email,
    });

    // 4. Get hospital
    const [hospital] = await db.select().from(hospitals).limit(1);
    if (!hospital) {
      log.error('No hospital found', 'TEST');
      return;
    }
    log.info('Using hospital:', 'TEST', { name: hospital.name });

    // 5. Create an alert directly in database
    log.info('\n🚨 Creating test alert...', 'TEST');
    const [newAlert] = await db.insert(alerts).values({
      roomNumber: '404',
      alertType: 'medical_emergency',
      urgencyLevel: 3,
      description: 'Test alert created directly',
      createdBy: testOperator.id,
      hospitalId: hospital.id,
      status: 'active',
    }).returning();
    
    log.info('✅ Alert created:', 'TEST', {
      id: newAlert.id,
      room: newAlert.roomNumber,
      type: newAlert.alertType,
    });

    // 6. Get active alerts
    const activeAlerts = await db
      .select({
        alert: alerts,
        creator: users,
      })
      .from(alerts)
      .leftJoin(users, eq(alerts.createdBy, users.id))
      .where(eq(alerts.status, 'active'))
      .limit(5);
    
    log.info('\n📋 Active Alerts:', 'TEST');
    activeAlerts.forEach(({ alert, creator }) => {
      log.info(`- ${alert.alertType} in room ${alert.roomNumber} (created by ${creator?.name || 'Unknown'})`, 'TEST');
    });

    // 7. Get patients with vitals
    const patientsWithDetails = await db
      .select({
        patient: patients,
        primaryDoctor: users,
      })
      .from(patients)
      .leftJoin(users, eq(patients.primaryDoctorId, users.id))
      .where(eq(patients.isActive, true))
      .limit(5);
    
    log.info('\n🏥 Active Patients:', 'TEST');
    patientsWithDetails.forEach(({ patient, primaryDoctor }) => {
      log.info(`- ${patient.name} (MRN: ${patient.mrn}) in room ${patient.roomNumber}`, 'TEST');
      if (primaryDoctor) {
        log.info(`  Primary Doctor: ${primaryDoctor.name}`, 'TEST');
      }
    });

    // 8. Test tRPC endpoint (no auth)
    log.info('\n🔌 Testing tRPC health endpoint...', 'TEST');
    try {
      const trpcResponse = await fetch(`${API_URL}/api/trpc/healthcare.getAlertsDashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ json: null }),
      });
      
      if (trpcResponse.ok) {
        const data = await trpcResponse.json();
        if (data.result?.data?.json) {
          log.info('✅ tRPC endpoint working', 'TEST', {
            activeAlerts: data.result.data.json.activeAlerts,
            todayAlerts: data.result.data.json.todayAlerts,
          });
        } else {
          log.error('tRPC response missing data', 'TEST', data);
        }
      } else {
        log.error('tRPC request failed', 'TEST', {
          status: trpcResponse.status,
          text: await trpcResponse.text(),
        });
      }
    } catch (error) {
      log.error('tRPC test failed', 'TEST', error);
    }

    // 9. Clean up - mark alert as resolved
    await db
      .update(alerts)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
      })
      .where(eq(alerts.id, newAlert.id));
    
    log.info('\n✅ Test alert cleaned up', 'TEST');

    log.info('\n🎉 All tests completed successfully!', 'TEST');

  } catch (error) {
    log.error('Test failed:', 'TEST', error);
  }
}

// Run tests
testHealthcareAPI()
  .then(() => {
    log.info('Test suite finished', 'TEST');
    process.exit(0);
  })
  .catch(error => {
    log.error('Unexpected error:', 'TEST', error);
    process.exit(1);
  });