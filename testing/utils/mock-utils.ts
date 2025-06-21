/**
 * Mock test utilities for healthcare integration tests
 */

import { type inferAsyncReturnType } from '@trpc/server';
import { type Session } from 'better-auth';
import { createTRPCContext } from '@/src/server/trpc';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user' | 'doctor' | 'nurse' | 'head_doctor' | 'operator';
  organizationId: string;
  defaultHospitalId?: string;
  isOnDuty?: boolean;
}

// Store mock users in memory
const mockUsers: Map<string, MockUser> = new Map();

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
  
  const user: MockUser = {
    id: userId,
    email: userData.email,
    name: userData.name || userData.email.split('@')[0],
    role: userData.role,
    organizationId: userData.organizationId,
    defaultHospitalId: userData.defaultHospitalId,
    isOnDuty: userData.isOnDuty,
  };
  
  mockUsers.set(userId, user);
  
  return user;
}

/**
 * Creates a test context with authentication
 */
export async function createTestContext(
  user: MockUser
): Promise<inferAsyncReturnType<typeof createTRPCContext>> {
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
  
  // Create mock context
  const ctx = {
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
    userId: user.id,
    userRole: user.role,
    organizationId: user.organizationId,
    hospitalId: user.defaultHospitalId,
  };
  
  return ctx as any;
}

/**
 * Cleans up the test data
 */
export async function cleanupDatabase(): Promise<void> {
  mockUsers.clear();
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