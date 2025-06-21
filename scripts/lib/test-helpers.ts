#!/usr/bin/env bun
/**
 * Test Helper Utilities
 * 
 * Common functions for testing scripts:
 * - API testing helpers
 * - Database seeding
 * - Mock data generation
 * - Assertion helpers
 */

import { faker } from '@faker-js/faker';
import { logger } from './logger';
import { ScriptError } from './error-handler';
import { TEST_USERS, HEALTHCARE_ROLES, USER_ROLES } from '../config/constants';
import { config } from '../config/environment';

interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  headers: Record<string, string>;
}

/**
 * Make API request with error handling
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const contentType = response.headers.get('content-type');
    let data: T | undefined;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    logger.error(`API request failed: ${error.message}`);
    throw new ScriptError(`Failed to make request to ${url}: ${error.message}`);
  }
}

/**
 * tRPC request helper
 */
export async function trpcRequest<T = any>(
  procedure: string,
  input?: any,
  options: {
    baseUrl?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const baseUrl = options.baseUrl || config.apiUrl;
  const url = `${baseUrl}/api/trpc/${procedure}`;
  
  const response = await apiRequest<{ result: { data: T } }>(url, {
    method: 'POST',
    headers: options.headers,
    body: JSON.stringify({
      json: input,
    }),
  });
  
  if (!response.ok) {
    throw new ScriptError(
      `tRPC request failed: ${response.error || response.status}`
    );
  }
  
  return response.data?.result?.data as T;
}

/**
 * Authenticate and get session token
 */
export async function authenticate(
  email: string,
  password: string
): Promise<string> {
  const response = await apiRequest('/api/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new ScriptError(`Authentication failed: ${response.error}`);
  }
  
  // Extract session token from cookies
  const cookies = response.headers['set-cookie'];
  const sessionCookie = cookies?.match(/better-auth.session=([^;]+)/)?.[1];
  
  if (!sessionCookie) {
    throw new ScriptError('No session cookie received');
  }
  
  return sessionCookie;
}

/**
 * Create authenticated request headers
 */
export function authHeaders(sessionToken: string): Record<string, string> {
  return {
    'Cookie': `better-auth.session=${sessionToken}`,
  };
}

/**
 * Generate test user data
 */
export function generateTestUser(overrides?: Partial<any>) {
  return {
    email: faker.internet.email().toLowerCase(),
    password: 'Test123!',
    name: faker.person.fullName(),
    phoneNumber: faker.phone.number(),
    ...overrides,
  };
}

/**
 * Generate test organization data
 */
export function generateTestOrganization(overrides?: Partial<any>) {
  return {
    name: faker.company.name(),
    code: faker.string.alphanumeric(8).toUpperCase(),
    type: 'healthcare',
    settings: {
      alertEscalationTime: faker.number.int({ min: 10, max: 60 }),
      shiftDuration: faker.number.int({ min: 6, max: 12 }),
      timezone: faker.location.timeZone(),
    },
    ...overrides,
  };
}

/**
 * Generate test patient data
 */
export function generateTestPatient(overrides?: Partial<any>) {
  return {
    medicalRecordNumber: `MRN-${faker.string.numeric(8)}`,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    dateOfBirth: faker.date.past({ years: 80 }).toISOString(),
    gender: faker.helpers.arrayElement(['male', 'female', 'other']),
    roomNumber: faker.string.alphanumeric(4).toUpperCase(),
    bedNumber: faker.string.numeric(2),
    admissionDate: faker.date.recent({ days: 30 }).toISOString(),
    diagnosis: faker.lorem.sentence(),
    allergies: faker.helpers.arrayElements(
      ['Penicillin', 'Aspirin', 'Latex', 'Peanuts', 'None'],
      faker.number.int({ min: 0, max: 3 })
    ),
    ...overrides,
  };
}

/**
 * Generate test alert data
 */
export function generateTestAlert(overrides?: Partial<any>) {
  const priorities = ['low', 'medium', 'high', 'critical'];
  const types = ['patient_fall', 'medication_due', 'vital_signs', 'emergency'];
  
  return {
    type: faker.helpers.arrayElement(types),
    priority: faker.helpers.arrayElement(priorities),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    metadata: {
      location: `Room ${faker.string.alphanumeric(4)}`,
      timestamp: new Date().toISOString(),
    },
    ...overrides,
  };
}

/**
 * Wait for condition with timeout
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    message?: string;
  } = {}
): Promise<void> {
  const { timeout = 30000, interval = 1000, message = 'Waiting for condition' } = options;
  
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new ScriptError(`Timeout: ${message}`);
}

/**
 * Assert response status
 */
export function assertStatus(
  response: ApiResponse,
  expectedStatus: number
): void {
  if (response.status !== expectedStatus) {
    throw new ScriptError(
      `Expected status ${expectedStatus}, got ${response.status}\n` +
      `Response: ${JSON.stringify(response.data, null, 2)}`
    );
  }
}

/**
 * Assert response contains data
 */
export function assertData<T>(
  response: ApiResponse<T>,
  key?: keyof T
): T {
  if (!response.data) {
    throw new ScriptError('Response contains no data');
  }
  
  if (key && !(key in response.data)) {
    throw new ScriptError(`Response missing expected key: ${String(key)}`);
  }
  
  return response.data;
}

/**
 * Create test context with cleanup
 */
export function createTestContext() {
  const cleanup: (() => Promise<void>)[] = [];
  
  return {
    addCleanup: (fn: () => Promise<void>) => {
      cleanup.push(fn);
    },
    
    cleanup: async () => {
      for (const fn of cleanup.reverse()) {
        try {
          await fn();
        } catch (error) {
          logger.warn(`Cleanup failed: ${error.message}`);
        }
      }
    },
  };
}

/**
 * Measure API performance
 */
export async function measureApiPerformance(
  name: string,
  request: () => Promise<ApiResponse>
): Promise<{
  duration: number;
  response: ApiResponse;
}> {
  const start = Date.now();
  
  try {
    const response = await request();
    const duration = Date.now() - start;
    
    logger.info(`${name}: ${duration}ms (${response.status})`);
    
    return { duration, response };
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${name}: ${duration}ms (failed)`);
    throw error;
  }
}

/**
 * Batch test data creation
 */
export async function createTestData<T>(
  count: number,
  generator: () => T,
  creator: (data: T) => Promise<any>,
  options: {
    batchSize?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<any[]> {
  const { batchSize = 10, onProgress } = options;
  const results: any[] = [];
  
  for (let i = 0; i < count; i += batchSize) {
    const batch = Array(Math.min(batchSize, count - i))
      .fill(null)
      .map(() => generator());
    
    const batchResults = await Promise.all(
      batch.map(data => creator(data))
    );
    
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress(results.length, count);
    }
  }
  
  return results;
}

/**
 * Get predefined test user credentials
 */
export function getTestUser(role: keyof typeof TEST_USERS) {
  const user = TEST_USERS[role];
  
  if (!user) {
    throw new ScriptError(`Unknown test user role: ${role}`);
  }
  
  return user;
}

/**
 * Validate API health
 */
export async function checkApiHealth(baseUrl?: string): Promise<boolean> {
  try {
    const response = await apiRequest(
      `${baseUrl || config.apiUrl}/api/health`,
      { method: 'GET' }
    );
    
    return response.ok;
  } catch {
    return false;
  }
}