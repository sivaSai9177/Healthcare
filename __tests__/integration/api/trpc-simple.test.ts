import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  closeTestDatabase,
  seedTestDatabase,
  createTestUser,
} from '../../setup/test-db';
import { 
  createAuthenticatedClient,
  cleanupTestSessions,
} from '../../setup/test-api-client';

describe('Simple tRPC API Test', () => {
  let operatorAuth: any;
  let testOrgData: any;

  beforeAll(async () => {
    // Setup test database with real data
    await setupTestDatabase();
    testOrgData = await seedTestDatabase();

    // Create test user
    const operatorUser = await createTestUser({
      email: 'operator.simple@test.com',
      name: 'Test Operator',
      role: 'operator',
      organizationId: testOrgData.organization.id,
    });

    // Create authenticated client
    operatorAuth = await createAuthenticatedClient({
      email: operatorUser.user.email,
      password: 'Test123!',
    });
  });

  afterAll(async () => {
    await cleanupTestSessions();
    await cleanupTestDatabase();
    await closeTestDatabase();
  });

  it('should connect to API and fetch data', async () => {
    // Test a simple query
    const alerts = await operatorAuth.client.healthcare.getActiveAlerts.query({
      hospitalId: testOrgData.hospital.id,
      limit: 5,
    });

    expect(alerts).toBeDefined();
    expect(alerts).toHaveProperty('alerts');
    expect(Array.isArray(alerts.alerts)).toBe(true);
    console.log('Fetched alerts:', alerts);
  });

  it('should create an alert', async () => {
    const createData = {
      roomNumber: 'TEST-101',
      alertType: 'medical_emergency' as const,
      urgencyLevel: 3,
      description: 'Test alert from integration test',
      patientName: 'Test Patient',
      patientId: null,
      hospitalId: testOrgData.hospital.id,
    };

    const result = await operatorAuth.client.healthcare.createAlert.mutate(createData);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.alert).toBeDefined();
    expect(result.alert.roomNumber).toBe('TEST-101');
    console.log('Created alert:', result.alert);
  });
});