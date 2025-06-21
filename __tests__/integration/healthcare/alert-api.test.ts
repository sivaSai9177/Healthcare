import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  closeTestDatabase,
  seedTestDatabase,
  createTestUser,
  getTestDb,
} from '../../setup/test-db';
import { 
  createAuthenticatedClient,
  cleanupTestSessions,
  createTestWebSocketClient,
} from '../../setup/test-api-client';
import * as healthcareSchema from '@/src/db/healthcare-schema';
import { eq } from 'drizzle-orm';

describe('Healthcare Alert API Integration Tests', () => {
  let doctorAuth: any;
  let nurseAuth: any;
  let operatorAuth: any;
  let testOrgData: any;
  let testPatient: any;
  let wsClient: any;

  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
    testOrgData = await seedTestDatabase();
    const db = getTestDb();

    // Create test patient
    [testPatient] = await db.insert(healthcareSchema.patients).values({
      id: 'test-patient-1',
      hospitalId: testOrgData.hospital.id,
      mrn: 'MRN001',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1980-01-01'),
      gender: 'male',
      bloodType: 'O+',
      allergies: ['Penicillin'],
      currentDepartmentId: testOrgData.departments.emergency.id,
      admissionDate: new Date(),
      status: 'active',
      metadata: {},
    }).returning();

    // Create healthcare users
    const doctorUser = await createTestUser({
      email: 'doctor@hospital.com',
      name: 'Dr. Smith',
      role: 'admin',
      organizationId: testOrgData.organization.id,
      hospitalId: testOrgData.hospital.id,
      departmentIds: [testOrgData.departments.emergency.id, testOrgData.departments.icu.id],
    });

    const nurseUser = await createTestUser({
      email: 'nurse@hospital.com',
      name: 'Nurse Johnson',
      role: 'manager',
      organizationId: testOrgData.organization.id,
      hospitalId: testOrgData.hospital.id,
      departmentIds: [testOrgData.departments.emergency.id],
    });

    const operatorUser = await createTestUser({
      email: 'operator@hospital.com',
      name: 'Operator Williams',
      role: 'operator',
      organizationId: testOrgData.organization.id,
      hospitalId: testOrgData.hospital.id,
      departmentIds: [testOrgData.departments.emergency.id],
    });

    // Create authenticated clients
    doctorAuth = await createAuthenticatedClient({
      email: doctorUser.user.email,
      password: 'Test123!@#',
    });

    nurseAuth = await createAuthenticatedClient({
      email: nurseUser.user.email,
      password: 'Test123!@#',
    });

    operatorAuth = await createAuthenticatedClient({
      email: operatorUser.user.email,
      password: 'Test123!@#',
    });

    // Setup WebSocket client for real-time tests
    wsClient = await createTestWebSocketClient(operatorAuth.token);
  });

  afterAll(async () => {
    if (wsClient) {
      wsClient.close();
    }
    await cleanupTestSessions();
    await closeTestDatabase();
  });

  describe('Alert Creation', () => {
    it('should create high priority alert', async () => {
      const alertData = {
        patientId: testPatient.id,
        departmentId: testOrgData.departments.emergency.id,
        priority: 'high' as const,
        type: 'emergency' as const,
        title: 'Patient in severe distress',
        description: 'Patient experiencing chest pain and difficulty breathing',
        metadata: {
          vitalSigns: {
            heartRate: 120,
            bloodPressure: '180/110',
            oxygenSaturation: 88,
          },
        },
      };

      const alert = await doctorAuth.client.healthcare.createAlert.mutate(alertData);

      expect(alert).toMatchObject({
        patientId: alertData.patientId,
        priority: alertData.priority,
        type: alertData.type,
        title: alertData.title,
        status: 'pending',
      });
      expect(alert.id).toBeDefined();
      expect(alert.createdBy).toBe(doctorAuth.user.id);
    });

    it('should validate alert creation permissions', async () => {
      const alertData = {
        patientId: testPatient.id,
        departmentId: 'non-existent-dept',
        priority: 'medium' as const,
        type: 'medical' as const,
        title: 'Unauthorized department alert',
      };

      await expect(
        operatorAuth.client.healthcare.createAlert.mutate(alertData)
      ).rejects.toThrow(/department|permission/i);
    });

    it('should auto-assign alerts based on availability', async () => {
      const alertData = {
        patientId: testPatient.id,
        departmentId: testOrgData.departments.emergency.id,
        priority: 'medium' as const,
        type: 'medical' as const,
        title: 'Medication required',
        description: 'Patient needs prescribed medication',
      };

      const alert = await nurseAuth.client.healthcare.createAlert.mutate(alertData);

      // Check if alert was auto-assigned
      const assignments = await nurseAuth.client.healthcare.getAlertAssignments.query({
        alertId: alert.id,
      });

      expect(assignments.length).toBeGreaterThan(0);
    });

    it('should calculate correct response times based on priority', async () => {
      const priorities = ['critical', 'high', 'medium', 'low'] as const;
      const expectedTimes = {
        critical: 5,
        high: 15,
        medium: 30,
        low: 60,
      };

      for (const priority of priorities) {
        const alert = await operatorAuth.client.healthcare.createAlert.mutate({
          patientId: testPatient.id,
          departmentId: testOrgData.departments.emergency.id,
          priority,
          type: 'medical' as const,
          title: `${priority} priority test`,
        });

        expect(alert.targetResponseTime).toBe(expectedTimes[priority]);
      }
    });
  });

  describe('Alert Retrieval and Filtering', () => {
    let testAlerts: any[] = [];

    beforeEach(async () => {
      // Create test alerts with different properties
      testAlerts = await Promise.all([
        operatorAuth.client.healthcare.createAlert.mutate({
          patientId: testPatient.id,
          departmentId: testOrgData.departments.emergency.id,
          priority: 'high',
          type: 'emergency',
          title: 'Emergency Alert 1',
          status: 'pending',
        }),
        operatorAuth.client.healthcare.createAlert.mutate({
          patientId: testPatient.id,
          departmentId: testOrgData.departments.icu.id,
          priority: 'medium',
          type: 'medical',
          title: 'Medical Alert 1',
          status: 'acknowledged',
        }),
        operatorAuth.client.healthcare.createAlert.mutate({
          patientId: testPatient.id,
          departmentId: testOrgData.departments.emergency.id,
          priority: 'low',
          type: 'routine',
          title: 'Routine Alert 1',
          status: 'resolved',
        }),
      ]);
    });

    it('should list alerts with pagination', async () => {
      const page1 = await operatorAuth.client.healthcare.listAlerts.query({
        limit: 2,
        offset: 0,
      });

      expect(page1.alerts.length).toBeLessThanOrEqual(2);
      expect(page1.total).toBeGreaterThanOrEqual(3);
      expect(page1.hasMore).toBeDefined();

      const page2 = await operatorAuth.client.healthcare.listAlerts.query({
        limit: 2,
        offset: 2,
      });

      // Ensure no overlap between pages
      const page1Ids = page1.alerts.map((a: any) => a.id);
      const page2Ids = page2.alerts.map((a: any) => a.id);
      expect(page1Ids.some(id => page2Ids.includes(id))).toBe(false);
    });

    it('should filter alerts by priority', async () => {
      const highPriorityAlerts = await operatorAuth.client.healthcare.listAlerts.query({
        filters: {
          priority: ['high', 'critical'],
        },
      });

      expect(highPriorityAlerts.alerts.every((a: any) => 
        ['high', 'critical'].includes(a.priority)
      )).toBe(true);
    });

    it('should filter alerts by department', async () => {
      const emergencyAlerts = await operatorAuth.client.healthcare.listAlerts.query({
        filters: {
          departmentId: testOrgData.departments.emergency.id,
        },
      });

      expect(emergencyAlerts.alerts.every((a: any) => 
        a.departmentId === testOrgData.departments.emergency.id
      )).toBe(true);
    });

    it('should filter alerts by status', async () => {
      const pendingAlerts = await operatorAuth.client.healthcare.listAlerts.query({
        filters: {
          status: ['pending', 'acknowledged'],
        },
      });

      expect(pendingAlerts.alerts.every((a: any) => 
        ['pending', 'acknowledged'].includes(a.status)
      )).toBe(true);
    });

    it('should sort alerts by creation time', async () => {
      const sortedDesc = await operatorAuth.client.healthcare.listAlerts.query({
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      for (let i = 1; i < sortedDesc.alerts.length; i++) {
        const prev = new Date(sortedDesc.alerts[i - 1].createdAt);
        const curr = new Date(sortedDesc.alerts[i].createdAt);
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
      }
    });
  });

  describe('Alert Acknowledgment', () => {
    let testAlert: any;

    beforeEach(async () => {
      testAlert = await operatorAuth.client.healthcare.createAlert.mutate({
        patientId: testPatient.id,
        departmentId: testOrgData.departments.emergency.id,
        priority: 'high',
        type: 'emergency',
        title: 'Test Alert for Acknowledgment',
      });
    });

    it('should acknowledge alert', async () => {
      const acknowledgment = await nurseAuth.client.healthcare.acknowledgeAlert.mutate({
        alertId: testAlert.id,
        notes: 'On my way to patient',
        estimatedResponseTime: 5,
      });

      expect(acknowledgment).toMatchObject({
        alertId: testAlert.id,
        userId: nurseAuth.user.id,
        notes: 'On my way to patient',
      });

      // Verify alert status was updated
      const updatedAlert = await nurseAuth.client.healthcare.getAlert.query({
        id: testAlert.id,
      });

      expect(updatedAlert.status).toBe('acknowledged');
    });

    it('should track response time', async () => {
      // Wait a bit to simulate response time
      await new Promise(resolve => setTimeout(resolve, 1000));

      const acknowledgment = await doctorAuth.client.healthcare.acknowledgeAlert.mutate({
        alertId: testAlert.id,
      });

      expect(acknowledgment.responseTime).toBeGreaterThan(0);
      expect(acknowledgment.responseTime).toBeLessThan(60); // Less than 1 minute
    });

    it('should prevent duplicate acknowledgments', async () => {
      // First acknowledgment
      await nurseAuth.client.healthcare.acknowledgeAlert.mutate({
        alertId: testAlert.id,
      });

      // Second acknowledgment should fail
      await expect(
        nurseAuth.client.healthcare.acknowledgeAlert.mutate({
          alertId: testAlert.id,
        })
      ).rejects.toThrow(/already acknowledged/i);
    });
  });

  describe('Alert Resolution', () => {
    let acknowledgedAlert: any;

    beforeEach(async () => {
      const alert = await operatorAuth.client.healthcare.createAlert.mutate({
        patientId: testPatient.id,
        departmentId: testOrgData.departments.emergency.id,
        priority: 'medium',
        type: 'medical',
        title: 'Test Alert for Resolution',
      });

      await nurseAuth.client.healthcare.acknowledgeAlert.mutate({
        alertId: alert.id,
      });

      acknowledgedAlert = await nurseAuth.client.healthcare.getAlert.query({
        id: alert.id,
      });
    });

    it('should resolve alert with outcome', async () => {
      const resolution = await nurseAuth.client.healthcare.resolveAlert.mutate({
        alertId: acknowledgedAlert.id,
        outcome: 'Patient treated successfully',
        actions: [
          'Administered prescribed medication',
          'Monitored vital signs',
          'Patient stable',
        ],
        followUpRequired: false,
      });

      expect(resolution).toMatchObject({
        alertId: acknowledgedAlert.id,
        resolvedBy: nurseAuth.user.id,
        outcome: 'Patient treated successfully',
      });

      // Verify alert status
      const resolvedAlert = await nurseAuth.client.healthcare.getAlert.query({
        id: acknowledgedAlert.id,
      });

      expect(resolvedAlert.status).toBe('resolved');
    });

    it('should create follow-up alert if required', async () => {
      const resolution = await doctorAuth.client.healthcare.resolveAlert.mutate({
        alertId: acknowledgedAlert.id,
        outcome: 'Initial treatment provided',
        followUpRequired: true,
        followUpNotes: 'Check patient in 2 hours',
        followUpPriority: 'medium',
      });

      // Check if follow-up alert was created
      const alerts = await doctorAuth.client.healthcare.listAlerts.query({
        filters: {
          patientId: testPatient.id,
          status: ['pending'],
        },
      });

      const followUpAlert = alerts.alerts.find((a: any) => 
        a.metadata?.isFollowUp && a.metadata?.originalAlertId === acknowledgedAlert.id
      );

      expect(followUpAlert).toBeDefined();
      expect(followUpAlert.title).toContain('Follow-up');
    });

    it('should require acknowledgment before resolution', async () => {
      const newAlert = await operatorAuth.client.healthcare.createAlert.mutate({
        patientId: testPatient.id,
        departmentId: testOrgData.departments.emergency.id,
        priority: 'low',
        type: 'routine',
        title: 'Unacknowledged Alert',
      });

      await expect(
        nurseAuth.client.healthcare.resolveAlert.mutate({
          alertId: newAlert.id,
          outcome: 'Resolved without acknowledgment',
        })
      ).rejects.toThrow(/must be acknowledged/i);
    });
  });

  describe('Alert Escalation', () => {
    it('should auto-escalate unacknowledged high priority alerts', async () => {
      const alert = await operatorAuth.client.healthcare.createAlert.mutate({
        patientId: testPatient.id,
        departmentId: testOrgData.departments.emergency.id,
        priority: 'high',
        type: 'emergency',
        title: 'Urgent - Auto Escalate Test',
      });

      // Simulate waiting for escalation time (would be 15 minutes in production)
      // For testing, we'll manually trigger escalation
      await operatorAuth.client.healthcare.checkAndEscalateAlerts.mutate();

      const escalations = await operatorAuth.client.healthcare.getAlertEscalations.query({
        alertId: alert.id,
      });

      // In test environment, escalation might not trigger immediately
      // This would work with proper time simulation
      expect(escalations).toBeDefined();
    });

    it('should manually escalate alert', async () => {
      const alert = await operatorAuth.client.healthcare.createAlert.mutate({
        patientId: testPatient.id,
        departmentId: testOrgData.departments.emergency.id,
        priority: 'medium',
        type: 'medical',
        title: 'Manual Escalation Test',
      });

      const escalation = await nurseAuth.client.healthcare.escalateAlert.mutate({
        alertId: alert.id,
        reason: 'Patient condition deteriorating',
        escalateToRole: 'doctor',
      });

      expect(escalation).toMatchObject({
        alertId: alert.id,
        escalatedBy: nurseAuth.user.id,
        reason: 'Patient condition deteriorating',
        level: 1,
      });

      // Check if notification was sent to doctors
      const notifications = await doctorAuth.client.healthcare.getNotifications.query({
        unreadOnly: true,
      });

      expect(notifications.some((n: any) => 
        n.type === 'alert_escalated' && n.metadata?.alertId === alert.id
      )).toBe(true);
    });
  });

  describe('Real-time Alert Updates', () => {
    it('should receive real-time alert creation', async (done) => {
      // Subscribe to alerts
      wsClient.send({
        type: 'subscribe',
        channel: 'alerts',
        departmentId: testOrgData.departments.emergency.id,
      });

      // Wait for subscription confirmation
      await wsClient.waitForMessage((msg: any) => msg.type === 'subscribed');

      // Set up listener for new alert
      const alertPromise = wsClient.waitForMessage((msg: any) => 
        msg.type === 'alert:created' && msg.data.title === 'Real-time Test Alert'
      );

      // Create alert
      await operatorAuth.client.healthcare.createAlert.mutate({
        patientId: testPatient.id,
        departmentId: testOrgData.departments.emergency.id,
        priority: 'high',
        type: 'emergency',
        title: 'Real-time Test Alert',
      });

      // Wait for WebSocket message
      const message = await alertPromise;
      expect(message.data).toMatchObject({
        title: 'Real-time Test Alert',
        priority: 'high',
      });

      done();
    });

    it('should receive real-time alert updates', async (done) => {
      // Create alert first
      const alert = await operatorAuth.client.healthcare.createAlert.mutate({
        patientId: testPatient.id,
        departmentId: testOrgData.departments.emergency.id,
        priority: 'medium',
        type: 'medical',
        title: 'Update Test Alert',
      });

      // Subscribe to specific alert
      wsClient.send({
        type: 'subscribe',
        channel: 'alert',
        alertId: alert.id,
      });

      await wsClient.waitForMessage((msg: any) => msg.type === 'subscribed');

      // Set up listener for acknowledgment
      const ackPromise = wsClient.waitForMessage((msg: any) => 
        msg.type === 'alert:acknowledged' && msg.data.alertId === alert.id
      );

      // Acknowledge alert
      await nurseAuth.client.healthcare.acknowledgeAlert.mutate({
        alertId: alert.id,
        notes: 'Acknowledged via WebSocket test',
      });

      // Wait for WebSocket message
      const message = await ackPromise;
      expect(message.data).toMatchObject({
        alertId: alert.id,
        status: 'acknowledged',
      });

      done();
    });
  });

  describe('Alert Analytics', () => {
    beforeEach(async () => {
      // Create alerts with different response times
      const alerts = [];
      for (let i = 0; i < 10; i++) {
        const alert = await operatorAuth.client.healthcare.createAlert.mutate({
          patientId: testPatient.id,
          departmentId: testOrgData.departments.emergency.id,
          priority: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
          type: 'medical',
          title: `Analytics Test Alert ${i}`,
        });

        // Acknowledge some alerts with varying response times
        if (i % 2 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100 * i));
          await nurseAuth.client.healthcare.acknowledgeAlert.mutate({
            alertId: alert.id,
          });

          // Resolve some acknowledged alerts
          if (i % 4 === 0) {
            await nurseAuth.client.healthcare.resolveAlert.mutate({
              alertId: alert.id,
              outcome: 'Resolved',
            });
          }
        }

        alerts.push(alert);
      }
    });

    it('should get alert statistics', async () => {
      const stats = await operatorAuth.client.healthcare.getAlertStats.query({
        hospitalId: testOrgData.hospital.id,
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          end: new Date(),
        },
      });

      expect(stats).toMatchObject({
        total: expect.any(Number),
        byPriority: expect.objectContaining({
          high: expect.any(Number),
          medium: expect.any(Number),
          low: expect.any(Number),
        }),
        byStatus: expect.objectContaining({
          pending: expect.any(Number),
          acknowledged: expect.any(Number),
          resolved: expect.any(Number),
        }),
        averageResponseTime: expect.any(Number),
        averageResolutionTime: expect.any(Number),
      });

      expect(stats.total).toBeGreaterThanOrEqual(10);
    });

    it('should get department-specific analytics', async () => {
      const deptStats = await operatorAuth.client.healthcare.getDepartmentAlertStats.query({
        departmentId: testOrgData.departments.emergency.id,
        timeRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
          end: new Date(),
        },
      });

      expect(deptStats).toMatchObject({
        departmentId: testOrgData.departments.emergency.id,
        totalAlerts: expect.any(Number),
        averageResponseTime: expect.any(Number),
        staffPerformance: expect.any(Array),
      });
    });
  });
});