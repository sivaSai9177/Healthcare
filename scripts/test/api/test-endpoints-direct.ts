#!/usr/bin/env bun
import { appRouter } from '@/src/server/routers';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { hospitals } from '@/src/db/healthcare-schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/core/debug/logger';

async function testEndpointsDirectly() {
  log.info('🧪 Testing Healthcare Endpoints Directly', 'TEST');
  
  try {
    // Get test user
    const [testUser] = await db.select().from(users).where(eq(users.role, 'operator')).limit(1);
    const [hospital] = await db.select().from(hospitals).limit(1);
    
    if (!testUser || !hospital) {
      log.error('Test data not found. Run create-test-healthcare-data.ts first', 'TEST');
      return;
    }

    // Create mock context
    const ctx = {
      user: testUser,
      headers: {},
    };

    // Create caller with context
    const caller = appRouter.createCaller(ctx);

    // Test 1: Get Alerts Dashboard
    log.info('\n📊 Testing getAlertsDashboard...', 'TEST');
    try {
      const dashboard = await caller.healthcare.getAlertsDashboard();
      log.info('✅ Dashboard data:', 'TEST', {
        activeAlerts: dashboard.activeAlerts,
        todayAlerts: dashboard.todayAlerts,
        avgResponseTime: dashboard.avgResponseTime,
        recentAlertsCount: dashboard.recentAlerts.length,
      });
    } catch (error) {
      log.error('Dashboard test failed:', 'TEST', error.message);
    }

    // Test 2: Create Alert
    log.info('\n🚨 Testing createAlert...', 'TEST');
    let createdAlert;
    try {
      createdAlert = await caller.healthcare.createAlert({
        roomNumber: '505',
        alertType: 'medical_emergency',
        urgencyLevel: 3,
        description: 'Direct endpoint test',
        hospitalId: hospital.id,
      });
      log.info('✅ Alert created:', 'TEST', {
        id: createdAlert.alert.id,
        type: createdAlert.alert.alertType,
        room: createdAlert.alert.roomNumber,
        notificationsSent: createdAlert.notificationsSent,
      });
    } catch (error) {
      log.error('Create alert failed:', 'TEST', error.message);
    }

    // Test 3: Get Active Alerts
    log.info('\n📋 Testing getActiveAlerts...', 'TEST');
    try {
      const activeAlerts = await caller.healthcare.getActiveAlerts({
        hospitalId: hospital.id,
        limit: 10,
      });
      log.info('✅ Active alerts:', 'TEST', {
        total: activeAlerts.total,
        count: activeAlerts.alerts.length,
      });
      
      activeAlerts.alerts.forEach(({ alert, creator }) => {
        log.info(`  - ${alert.alertType} in room ${alert.roomNumber} (by ${creator?.name})`, 'TEST');
      });
    } catch (error) {
      log.error('Get active alerts failed:', 'TEST', error.message);
    }

    // Test 4: Get Patients List
    log.info('\n🏥 Testing getPatientsList...', 'TEST');
    try {
      const patients = await caller.patient.getPatientsList({
        hospitalId: hospital.id,
        limit: 10,
      });
      log.info('✅ Patients:', 'TEST', {
        total: patients.total,
        count: patients.patients.length,
      });
      
      patients.patients.forEach(({ patient }) => {
        log.info(`  - ${patient.name} (MRN: ${patient.mrn}) in room ${patient.roomNumber}`, 'TEST');
      });

      // Test 5: Get Patient Details
      if (patients.patients.length > 0) {
        const firstPatient = patients.patients[0].patient;
        log.info('\n👤 Testing getDetails...', 'TEST');
        const details = await caller.patient.getDetails({
          patientId: firstPatient.id,
        });
        log.info('✅ Patient details:', 'TEST', {
          name: details.name,
          careTeamSize: details.careTeam.length,
          activeAlerts: details.activeAlerts.length,
          primaryDoctor: details.primaryDoctor?.name,
          attendingNurse: details.attendingNurse?.name,
        });

        // Test 6: Record Vitals
        log.info('\n💊 Testing recordVitals...', 'TEST');
        const vitals = await caller.patient.recordVitals({
          patientId: firstPatient.id,
          heartRate: 78,
          bloodPressureSystolic: 122,
          bloodPressureDiastolic: 82,
          temperature: '98.6',
          respiratoryRate: 18,
          oxygenSaturation: 99,
          notes: 'Direct test vitals',
        });
        log.info('✅ Vitals recorded:', 'TEST', {
          id: vitals.id,
          heartRate: vitals.heartRate,
          recordedBy: testUser.name,
        });

        // Test 7: Get Vitals History
        log.info('\n📈 Testing getVitalsHistory...', 'TEST');
        const history = await caller.patient.getVitalsHistory({
          patientId: firstPatient.id,
          timeRange: '24h',
        });
        log.info('✅ Vitals history:', 'TEST', {
          records: history.history.length,
          current: history.current ? {
            heartRate: history.current.heartRate,
            recordedAt: history.current.recordedAt,
          } : null,
          statistics: history.statistics,
        });
      }
    } catch (error) {
      log.error('Patient operations failed:', 'TEST', error.message);
    }

    // Test 8: Acknowledge Alert (if we created one)
    if (createdAlert) {
      log.info('\n✅ Testing acknowledgeAlert...', 'TEST');
      
      // Switch to doctor context for acknowledgment
      const [doctor] = await db.select().from(users).where(eq(users.role, 'doctor')).limit(1);
      if (doctor) {
        const doctorCaller = appRouter.createCaller({ user: doctor, headers: {} });
        
        try {
          const ack = await doctorCaller.healthcare.acknowledgeAlert({
            alertId: createdAlert.alert.id,
            notes: 'Acknowledged via direct test',
          });
          log.info('✅ Alert acknowledged:', 'TEST', {
            alertId: ack.alertId,
            responseTime: ack.responseTimeSeconds,
            acknowledgedBy: doctor.name,
          });

          // Test 9: Get Alert Timeline
          log.info('\n📊 Testing getAlertTimeline...', 'TEST');
          const timeline = await doctorCaller.healthcare.getAlertTimeline({
            alertId: createdAlert.alert.id,
          });
          log.info('✅ Alert timeline:', 'TEST', {
            totalEvents: timeline.totalEvents,
            events: timeline.timeline.map(e => ({
              type: e.type,
              time: e.time,
              user: e.user?.name || 'System',
            })),
          });
        } catch (error) {
          log.error('Acknowledgment operations failed:', 'TEST', error.message);
        }
      }
    }

    // Test 10: Get Alert Analytics
    log.info('\n📈 Testing getAlertAnalytics...', 'TEST');
    try {
      const analytics = await caller.healthcare.getAlertAnalytics({
        hospitalId: hospital.id,
        timeRange: 'day',
      });
      log.info('✅ Analytics:', 'TEST', {
        totalAlerts: analytics.totalAlerts,
        avgResponseTime: analytics.avgResponseTime,
        byType: analytics.byType,
        byUrgency: analytics.byUrgency,
        timeSeriesLength: analytics.timeSeries.length,
      });
    } catch (error) {
      log.error('Analytics failed:', 'TEST', error.message);
    }

    log.info('\n🎉 All endpoint tests completed!', 'TEST');

  } catch (error) {
    log.error('Test suite failed:', 'TEST', error);
  }
}

// Run tests
testEndpointsDirectly()
  .then(() => {
    log.info('Test suite finished', 'TEST');
    process.exit(0);
  })
  .catch(error => {
    log.error('Unexpected error:', 'TEST', error);
    process.exit(1);
  });