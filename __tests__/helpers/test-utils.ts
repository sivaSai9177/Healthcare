/**
 * Test utilities for healthcare integration tests
 */

import { type inferAsyncReturnType } from '@trpc/server';
import { type Session } from 'better-auth';
import { db, user as users, organization, organizationMember, hospitals } from '@/src/db';
import { eq } from 'drizzle-orm';
import { createContext } from '@/src/server/trpc';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user' | 'doctor' | 'nurse' | 'head_doctor' | 'operator';
  organizationId: string;
  defaultHospitalId?: string;
  isOnDuty?: boolean;
}

/**
 * Creates a mock user with the specified properties
 */
export async function createMockUser(userData: {
  email: string;
  role: MockUser['role'];
  organizationId: string;
  defaultHospitalId?: string;
  name?: string;
  isOnDuty?: boolean;
}): Promise<MockUser> {
  const userId = `user-${Date.now()}-${Math.random()}`;
  
  // Create user
  await db.insert(users).values({
    id: userId,
    email: userData.email,
    name: userData.name || userData.email.split('@')[0],
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  // Update user with role and organization data
  await db.update(users)
    .set({
      role: userData.role,
      organizationId: userData.organizationId,
      defaultHospitalId: userData.defaultHospitalId,
      needsProfileCompletion: false,
    })
    .where(eq(users.id, userId));
  
  // Add to organization
  await db.insert(organizationMember).values({
    id: `member-${userId}`,
    organizationId: userData.organizationId,
    userId,
    role: userData.role === 'admin' ? 'owner' : 'member',
    createdAt: new Date(),
  });
  
  // If healthcare role and on duty status specified
  if (userData.isOnDuty !== undefined && ['nurse', 'doctor', 'head_doctor'].includes(userData.role)) {
    // This would be handled by the healthcare-specific tables
    // For now, we'll store this in the return object
  }
  
  return {
    id: userId,
    email: userData.email,
    name: userData.name || userData.email.split('@')[0],
    role: userData.role,
    organizationId: userData.organizationId,
    defaultHospitalId: userData.defaultHospitalId,
    isOnDuty: userData.isOnDuty,
  };
}

/**
 * Creates a test context with authentication
 */
export async function createTestContext(
  user: MockUser
): Promise<inferAsyncReturnType<typeof createContext>> {
  const mockSession: Session = {
    id: `session-${user.id}`,
    userId: user.id,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    token: `test-token-${user.id}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  };
  
  const mockHeaders = new Headers({
    'x-forwarded-for': '127.0.0.1',
    'user-agent': 'test-agent',
  });
  
  // Create context with mock session
  const ctx = await createContext({
    headers: mockHeaders,
    session: mockSession,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  
  // Override with test user data
  return {
    ...ctx,
    userId: user.id,
    userRole: user.role,
    organizationId: user.organizationId,
    hospitalId: user.defaultHospitalId,
  };
}

/**
 * Cleans up the database for testing
 */
export async function cleanupDatabase(): Promise<void> {
  // Delete in reverse order of dependencies
  const tables = [
    'alert_timeline',
    'alerts',
    'shift_handovers',
    'healthcare_staff',
    'patients',
    'organization_members',
    'user_profiles',
    'users',
    'hospitals',
    'organizations',
  ];
  
  for (const table of tables) {
    try {
      await db.execute(`DELETE FROM ${table}`);
    } catch (error) {
      // Table might not exist, ignore
    }
  }
  
  // Ensure test organization and hospital exist
  await setupTestOrganizationAndHospital();
}

/**
 * Sets up a default test organization and hospital
 */
async function setupTestOrganizationAndHospital(): Promise<void> {
  // Create test organization
  const existingOrg = await db.select().from(organizations).where(eq(organizations.id, 'test-org')).limit(1);
  
  if (existingOrg.length === 0) {
    await db.insert(organizations).values({
      id: 'test-org',
      name: 'Test Organization',
      slug: 'test-org',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  
  // Create test hospital
  const existingHospital = await db.select().from(hospitals).where(eq(hospitals.id, 'test-hospital')).limit(1);
  
  if (existingHospital.length === 0) {
    await db.insert(hospitals).values({
      id: 'test-hospital',
      organizationId: 'test-org',
      name: 'Test Hospital',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country',
      phoneNumber: '+1-555-0123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

/**
 * Creates a mock WebSocket connection
 */
export function createMockWebSocket() {
  return {
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
    readyState: 1, // OPEN
  };
}

/**
 * Waits for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Timeout waiting for condition');
}

/**
 * Mock date utilities for consistent testing
 */
export const mockDates = {
  now: new Date('2024-01-15T10:00:00Z'),
  past: (minutes: number) => new Date(Date.now() - minutes * 60 * 1000),
  future: (minutes: number) => new Date(Date.now() + minutes * 60 * 1000),
};