import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/src/db/schema';
import * as healthcareSchema from '@/src/db/healthcare-schema';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';

// Test database configuration
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 
  'postgresql://postgres:postgres@localhost:5432/hospital_alert_test';

let testDb: ReturnType<typeof drizzle> | null = null;
let testSql: ReturnType<typeof postgres> | null = null;

/**
 * Initialize test database connection
 */
export async function setupTestDatabase() {
  if (testDb) return testDb;

  try {
    // Create connection
    testSql = postgres(TEST_DATABASE_URL, {
      max: 1,
      onnotice: () => {}, // Suppress notices in tests
    });

    // Initialize drizzle
    testDb = drizzle(testSql, {
      schema: { ...schema, ...healthcareSchema },
    });

    // Run migrations if needed
    if (process.env.RUN_MIGRATIONS === 'true') {
      await migrate(testDb, { migrationsFolder: './drizzle' });
    }

    return testDb;
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

/**
 * Clean up test database - remove all data but keep schema
 */
export async function cleanupTestDatabase() {
  if (!testDb) return;

  try {
    // Disable foreign key checks temporarily
    await testDb.execute(sql`SET session_replication_role = 'replica'`);

    // Get all table names
    const tables = [
      // Auth tables
      'users',
      'sessions',
      'accounts',
      'verifications',
      
      // Organization tables
      'organizations',
      'organizationMembers',
      'organizationInvites',
      'organizationSettings',
      
      // Healthcare tables
      'hospitals',
      'departments',
      'patients',
      'alerts',
      'alertAssignments',
      'alertAcknowledgments',
      'alertEscalations',
      'alertHistory',
      'shifts',
      'shiftAssignments',
      'activityLogs',
      
      // Other tables
      'auditLogs',
      'pushSubscriptions',
    ];

    // Truncate all tables
    for (const table of tables) {
      try {
        await testDb.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
      } catch (error) {
        // Table might not exist, ignore
      }
    }

    // Re-enable foreign key checks
    await testDb.execute(sql`SET session_replication_role = 'origin'`);
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
  }
}

/**
 * Seed test database with minimal data
 */
export async function seedTestDatabase() {
  if (!testDb) throw new Error('Test database not initialized');

  // Create test organization
  const [testOrg] = await testDb.insert(schema.organizations).values({
    id: 'test-org-1',
    name: 'Test Hospital',
    slug: 'test-hospital',
    type: 'hospital',
    settings: {},
    metadata: {},
  }).returning();

  // Create test hospital
  const [testHospital] = await testDb.insert(healthcareSchema.hospitals).values({
    id: 'test-hospital-1',
    organizationId: testOrg.id,
    name: 'Test Hospital',
    code: 'TH001',
    address: '123 Test St',
    phone: '+1234567890',
    email: 'test@hospital.com',
    timezone: 'America/New_York',
    settings: {},
  }).returning();

  // Create test departments
  const [emergencyDept] = await testDb.insert(healthcareSchema.departments).values({
    id: 'test-dept-emergency',
    hospitalId: testHospital.id,
    name: 'Emergency',
    code: 'ER',
    floor: '1',
    building: 'Main',
  }).returning();

  const [icuDept] = await testDb.insert(healthcareSchema.departments).values({
    id: 'test-dept-icu',
    hospitalId: testHospital.id,
    name: 'Intensive Care Unit',
    code: 'ICU',
    floor: '3',
    building: 'Main',
  }).returning();

  return {
    organization: testOrg,
    hospital: testHospital,
    departments: {
      emergency: emergencyDept,
      icu: icuDept,
    },
  };
}

/**
 * Close test database connection
 */
export async function closeTestDatabase() {
  if (testSql) {
    await testSql.end();
    testSql = null;
    testDb = null;
  }
}

/**
 * Create test user with organization membership
 */
export async function createTestUser(options: {
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  organizationId: string;
  hospitalId?: string;
  departmentIds?: string[];
}) {
  if (!testDb) throw new Error('Test database not initialized');

  // Create user
  const [user] = await testDb.insert(schema.users).values({
    id: `test-user-${Date.now()}`,
    email: options.email,
    name: options.name,
    emailVerified: true,
    role: options.role,
    settings: {},
    metadata: {},
  }).returning();

  // Create organization membership
  await testDb.insert(schema.organizationMembers).values({
    id: `test-member-${Date.now()}`,
    organizationId: options.organizationId,
    userId: user.id,
    role: options.role,
    permissions: getDefaultPermissions(options.role),
    settings: {},
  });

  // Create healthcare user record if hospital provided
  if (options.hospitalId) {
    await testDb.insert(healthcareSchema.healthcareUsers).values({
      id: `test-healthcare-user-${Date.now()}`,
      userId: user.id,
      hospitalId: options.hospitalId,
      role: mapToHealthcareRole(options.role),
      departmentIds: options.departmentIds || [],
      specialization: 'General',
      licenseNumber: `TEST-${Date.now()}`,
      isAvailable: true,
      settings: {},
    });
  }

  // Create session
  const [session] = await testDb.insert(schema.sessions).values({
    id: `test-session-${Date.now()}`,
    userId: user.id,
    token: `test-token-${Date.now()}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    ipAddress: '127.0.0.1',
    userAgent: 'Test Runner',
  }).returning();

  return { user, session };
}

// Helper functions
function getDefaultPermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    admin: ['*'],
    manager: ['read:*', 'write:*', 'delete:own'],
    operator: ['read:*', 'write:alerts', 'write:patients'],
    viewer: ['read:*'],
  };
  return permissions[role] || ['read:*'];
}

function mapToHealthcareRole(role: string): string {
  const roleMap: Record<string, string> = {
    admin: 'doctor',
    manager: 'nurse',
    operator: 'nurse',
    viewer: 'staff',
  };
  return roleMap[role] || 'staff';
}

// Export test database instance getter
export function getTestDb() {
  if (!testDb) throw new Error('Test database not initialized');
  return testDb;
}