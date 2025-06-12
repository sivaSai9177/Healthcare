#!/usr/bin/env bun
import { db } from '../src/db';
import { users, sessions } from '../src/db/schema';
import { hospitals, healthcareUsers } from '../src/db/healthcare-schema';
import { patients } from '../src/db/patient-schema';
import { eq } from 'drizzle-orm';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../src/server/routers';
import superjson from 'superjson';

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:8081';
const TEST_EMAIL = 'test.operator@hospital.com';
const TEST_PASSWORD = 'password123';

// Create tRPC client
const api = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      transformer: superjson,
      headers: async () => {
        return {};
      },
    }),
  ],
});

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
  const color = {
    success: colors.green,
    error: colors.red,
    info: colors.blue,
    warning: colors.yellow,
  }[type];
// TODO: Replace with structured logging - console.log(`${color}${message}${colors.reset}`);
}

async function testHealthcareAPIs() {
  try {
    log('🏥 Starting Healthcare API Tests...', 'info');
    
    // First, ensure we have a test hospital
    log('\n📍 Setting up test hospital...', 'info');
    let [hospital] = await db.select().from(hospitals).limit(1);
    
    if (!hospital) {
      [hospital] = await db.insert(hospitals).values({
        name: 'Test General Hospital',
        address: '123 Medical Center Dr',
        contactInfo: {
          phone: '555-0123',
          email: 'admin@testhospital.com',
        },
        settings: {},
      }).returning();
      log('✅ Created test hospital', 'success');
    } else {
      log('✅ Using existing hospital: ' + hospital.name, 'success');
    }

    // Create or get test user with operator role
    log('\n👤 Setting up test operator user...', 'info');
    let [testUser] = await db.select().from(users).where(eq(users.email, TEST_EMAIL));
    
    if (!testUser) {
      // Create user with auth endpoint
      const signupResult = await api.auth.signUp.mutate({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: 'Test Operator',
        role: 'operator',
      });
      
      testUser = signupResult.user;
      log('✅ Created test operator user', 'success');
      
      // Add healthcare user record
      await db.insert(healthcareUsers).values({
        userId: testUser.id,
        hospitalId: hospital.id,
        department: 'Emergency',
      });
    } else {
      log('✅ Using existing operator user', 'success');
    }

    // Login to get session
    log('\n🔐 Logging in...', 'info');
    const loginResult = await api.auth.login.mutate({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    const sessionToken = loginResult.token;
    log('✅ Login successful, token received', 'success');

    // Create authenticated client
    const authenticatedApi = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
          transformer: superjson,
          headers: async () => ({
            authorization: `Bearer ${sessionToken}`,
          }),
        }),
      ],
    });

    // Test 1: Create a patient
    log('\n🏥 Test 1: Creating a patient...', 'info');
    const patientData = {
      mrn: `MRN${Date.now()}`,
      name: 'John Test Patient',
      dateOfBirth: new Date('1970-01-01'),
      gender: 'male' as const,
      bloodType: 'O+' as const,
      roomNumber: '302',
      bedNumber: 'A',
      admissionDate: new Date(),
      primaryDiagnosis: 'Cardiac monitoring',
      allergies: ['Penicillin', 'Aspirin'],
      medications: [
        { name: 'Metoprolol', dosage: '50mg', frequency: 'Twice daily' },
        { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily' },
      ],
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '555-0124',
      },
      flags: {
        dnr: false,
        fallRisk: true,
        allergyAlert: true,
      },
    };

    let createdPatient;
    try {
      createdPatient = await authenticatedApi.patient.createPatient.mutate(patientData);
      log(`✅ Patient created: ${createdPatient.name} (MRN: ${createdPatient.mrn})`, 'success');
    } catch (error) {
      log(`❌ Failed to create patient: ${error.message}`, 'error');
      throw error;
    }

    // Test 2: Get patient details
    log('\n🏥 Test 2: Getting patient details...', 'info');
    try {
      const patientDetails = await authenticatedApi.patient.getDetails.query({
        patientId: createdPatient.id,
      });
      log(`✅ Patient details retrieved:`, 'success');
      log(`   Name: ${patientDetails.name}`, 'info');
      log(`   Room: ${patientDetails.roomNumber}`, 'info');
      log(`   Active Alerts: ${patientDetails.activeAlerts.length}`, 'info');
      log(`   Care Team: ${patientDetails.careTeam.length} members`, 'info');
    } catch (error) {
      log(`❌ Failed to get patient details: ${error.message}`, 'error');
    }

    // Test 3: Record vitals
    log('\n🏥 Test 3: Recording patient vitals...', 'info');
    const vitalsData = {
      patientId: createdPatient.id,
      heartRate: 72,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      temperature: '36.8',
      respiratoryRate: 16,
      oxygenSaturation: 98,
      pain: 2,
      notes: 'Patient stable, normal vitals',
    };

    try {
      const recordedVitals = await authenticatedApi.patient.recordVitals.mutate(vitalsData);
      log('✅ Vitals recorded successfully', 'success');
      
      // Test critical vitals
      const criticalVitals = {
        patientId: createdPatient.id,
        heartRate: 150, // Critical high
        bloodPressureSystolic: 190, // Critical high
        bloodPressureDiastolic: 120, // Critical high
        temperature: '40.5', // Critical high fever
        oxygenSaturation: 85, // Critical low
      };
      
      await authenticatedApi.patient.recordVitals.mutate(criticalVitals);
      log('⚠️  Critical vitals recorded (should trigger alerts)', 'warning');
    } catch (error) {
      log(`❌ Failed to record vitals: ${error.message}`, 'error');
    }

    // Test 4: Create an alert
    log('\n🚨 Test 4: Creating an alert...', 'info');
    const alertData = {
      roomNumber: '302',
      alertType: 'cardiac_arrest' as const,
      urgencyLevel: 5,
      description: 'Patient experiencing cardiac arrest',
      hospitalId: hospital.id,
      patientId: createdPatient.id,
    };

    let createdAlert;
    try {
      createdAlert = await authenticatedApi.healthcare.createAlert.mutate(alertData);
      log(`✅ Alert created: ${createdAlert.alert.alertType} in room ${createdAlert.alert.roomNumber}`, 'success');
    } catch (error) {
      log(`❌ Failed to create alert: ${error.message}`, 'error');
    }

    // Test 5: Get active alerts
    log('\n🚨 Test 5: Getting active alerts...', 'info');
    try {
      const activeAlerts = await authenticatedApi.healthcare.getActiveAlerts.query({
        hospitalId: hospital.id,
        limit: 10,
        offset: 0,
      });
      log(`✅ Active alerts retrieved: ${activeAlerts.total} alerts`, 'success');
      activeAlerts.alerts.forEach(alert => {
        log(`   - ${alert.alert.alertType} in room ${alert.alert.roomNumber} (Urgency: ${alert.alert.urgencyLevel})`, 'info');
      });
    } catch (error) {
      log(`❌ Failed to get active alerts: ${error.message}`, 'error');
    }

    // Create a doctor user for acknowledgment tests
    log('\n👤 Creating doctor user for acknowledgment...', 'info');
    const doctorEmail = `doctor.${Date.now()}@hospital.com`;
    const doctorResult = await api.auth.signUp.mutate({
      email: doctorEmail,
      password: TEST_PASSWORD,
      name: 'Dr. Test Doctor',
      role: 'doctor',
    });
    
    await db.insert(healthcareUsers).values({
      userId: doctorResult.user.id,
      hospitalId: hospital.id,
      department: 'Emergency',
      specialization: 'Emergency Medicine',
    });

    // Login as doctor
    const doctorLogin = await api.auth.login.mutate({
      email: doctorEmail,
      password: TEST_PASSWORD,
    });

    const doctorApi = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
          transformer: superjson,
          headers: async () => ({
            authorization: `Bearer ${doctorLogin.token}`,
          }),
        }),
      ],
    });

    // Test 6: Acknowledge alert
    if (createdAlert) {
      log('\n🚨 Test 6: Acknowledging alert...', 'info');
      try {
        const acknowledgment = await doctorApi.healthcare.acknowledgeAlert.mutate({
          alertId: createdAlert.alert.id,
          notes: 'Responding to cardiac arrest, ETA 2 minutes',
        });
        log(`✅ Alert acknowledged with response time: ${acknowledgment.responseTimeSeconds}s`, 'success');
      } catch (error) {
        log(`❌ Failed to acknowledge alert: ${error.message}`, 'error');
      }

      // Test 7: Get alert timeline
      log('\n📊 Test 7: Getting alert timeline...', 'info');
      try {
        const timeline = await doctorApi.healthcare.getAlertTimeline.query({
          alertId: createdAlert.alert.id,
        });
        log(`✅ Alert timeline retrieved: ${timeline.totalEvents} events`, 'success');
        timeline.timeline.forEach(event => {
          log(`   - ${event.type} at ${new Date(event.time).toLocaleTimeString()} by ${event.user?.name || 'System'}`, 'info');
        });
      } catch (error) {
        log(`❌ Failed to get alert timeline: ${error.message}`, 'error');
      }
    }

    // Test 8: Get patient vitals history
    log('\n📊 Test 8: Getting vitals history...', 'info');
    try {
      const vitalsHistory = await authenticatedApi.patient.getVitalsHistory.query({
        patientId: createdPatient.id,
        timeRange: '24h',
      });
      log(`✅ Vitals history retrieved: ${vitalsHistory.history.length} records`, 'success');
      if (vitalsHistory.statistics) {
        log('   Statistics:', 'info');
        log(`   - Heart Rate: ${vitalsHistory.statistics.heartRate?.min}-${vitalsHistory.statistics.heartRate?.max} (avg: ${vitalsHistory.statistics.heartRate?.avg?.toFixed(1)})`, 'info');
      }
    } catch (error) {
      log(`❌ Failed to get vitals history: ${error.message}`, 'error');
    }

    // Test 9: Assign care team
    log('\n👥 Test 9: Assigning care team...', 'info');
    try {
      const assignment = await authenticatedApi.patient.assignToCareTeam.mutate({
        patientId: createdPatient.id,
        userId: doctorResult.user.id,
        role: 'primary_doctor',
        notes: 'Primary care physician for cardiac monitoring',
      });
      log('✅ Care team member assigned successfully', 'success');
    } catch (error) {
      log(`❌ Failed to assign care team: ${error.message}`, 'error');
    }

    // Test 10: Get analytics
    log('\n📈 Test 10: Getting alert analytics...', 'info');
    try {
      const analytics = await authenticatedApi.healthcare.getAlertAnalytics.query({
        hospitalId: hospital.id,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endDate: new Date(),
        groupBy: 'day',
      });
      log('✅ Analytics retrieved:', 'success');
      log(`   - Total Alerts: ${analytics.summary.totalAlerts}`, 'info');
      log(`   - Acknowledgment Rate: ${analytics.summary.acknowledgmentRate.toFixed(1)}%`, 'info');
      log(`   - Avg Response Time: ${analytics.summary.avgResponseTime}s`, 'info');
    } catch (error) {
      log(`❌ Failed to get analytics: ${error.message}`, 'error');
    }

    // Test 11: Bulk acknowledge (create multiple alerts first)
    log('\n🚨 Test 11: Testing bulk acknowledge...', 'info');
    try {
      // Create 3 more alerts
      const alertIds = [];
      for (let i = 0; i < 3; i++) {
        const alert = await authenticatedApi.healthcare.createAlert.mutate({
          roomNumber: `30${i + 3}`,
          alertType: 'medical_emergency' as const,
          urgencyLevel: 3,
          description: `Test alert ${i + 1}`,
          hospitalId: hospital.id,
        });
        alertIds.push(alert.alert.id);
      }

      // Bulk acknowledge
      const bulkResult = await doctorApi.healthcare.bulkAcknowledgeAlerts.mutate({
        alertIds,
        notes: 'Bulk acknowledgment during rounds',
      });
      log(`✅ Bulk acknowledge: ${bulkResult.summary.succeeded}/${bulkResult.summary.total} succeeded`, 'success');
    } catch (error) {
      log(`❌ Failed bulk acknowledge: ${error.message}`, 'error');
    }

    // Clean up - discharge patient
    log('\n🏥 Cleaning up: Discharging patient...', 'info');
    try {
      await authenticatedApi.patient.dischargePatient.mutate({
        patientId: createdPatient.id,
        dischargeNotes: 'Test completed, patient discharged',
        dischargeDiagnosis: 'Test diagnosis - resolved',
      });
      log('✅ Patient discharged successfully', 'success');
    } catch (error) {
      log(`❌ Failed to discharge patient: ${error.message}`, 'error');
    }

    log('\n✅ All Healthcare API tests completed!', 'success');
    
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
testHealthcareAPIs().then(() => {
  log('\n🎉 Healthcare API test suite finished!', 'success');
  process.exit(0);
}).catch(error => {
  log('\n💥 Unexpected error:', 'error');
  console.error(error);
  process.exit(1);
});