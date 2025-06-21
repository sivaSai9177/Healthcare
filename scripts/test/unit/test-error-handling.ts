#!/usr/bin/env bun

/**
 * Test script for error handling in the frontend
 * This script simulates various error scenarios to test the error boundaries and enhanced hooks
 */

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../src/server/routers';
import { logger } from '../lib/core/debug/unified-logger';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Create TRPC client
const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      headers: () => ({
        'Content-Type': 'application/json',
      }),
    }),
  ],
});

interface TestCase {
  name: string;
  description: string;
  test: () => Promise<void>;
  expectedError?: string;
}

const testCases: TestCase[] = [
  {
    name: 'Network Error',
    description: 'Simulate network disconnection',
    test: async () => {
      logger.info('Simulating network error by calling non-existent endpoint');
      // This will fail with a network error
      const badClient = createTRPCProxyClient<AppRouter>({
        links: [
          httpBatchLink({
            url: 'http://localhost:9999/api/trpc', // Non-existent port
          }),
        ],
      });
      await badClient.healthcare.getActiveAlerts.query({ hospitalId: 'test' });
    },
    expectedError: 'fetch failed',
  },
  {
    name: 'Authentication Error',
    description: 'Access protected endpoint without authentication',
    test: async () => {
      logger.info('Attempting to access protected endpoint without auth');
      await trpc.healthcare.getActiveAlerts.query({ hospitalId: 'test' });
    },
    expectedError: 'UNAUTHORIZED',
  },
  {
    name: 'Hospital Assignment Error',
    description: 'Access healthcare data without hospital assignment',
    test: async () => {
      logger.info('Simulating missing hospital assignment');
      // First login
      const session = await trpc.auth.signInWithPassword.mutate({
        email: 'test@example.com',
        password: 'password123',
      });
      
      // Create authenticated client
      const authClient = createTRPCProxyClient<AppRouter>({
        links: [
          httpBatchLink({
            url: `${API_URL}/api/trpc`,
            headers: () => ({
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.token}`,
            }),
          }),
        ],
      });
      
      // Try to access alerts without hospital
      await authClient.healthcare.getActiveAlerts.query({ hospitalId: '' });
    },
    expectedError: 'Hospital assignment required',
  },
  {
    name: 'Rate Limit Error',
    description: 'Trigger rate limiting by making too many requests',
    test: async () => {
      logger.info('Making rapid requests to trigger rate limit');
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          trpc.auth.signInWithPassword.mutate({
            email: `test${i}@example.com`,
            password: 'wrong',
          }).catch(() => {})
        );
      }
      await Promise.all(promises);
      
      // This one should be rate limited
      await trpc.auth.signInWithPassword.mutate({
        email: 'test@example.com',
        password: 'password',
      });
    },
    expectedError: 'Too many requests',
  },
  {
    name: 'Validation Error',
    description: 'Send invalid data to trigger validation error',
    test: async () => {
      logger.info('Sending invalid data');
      await trpc.auth.signInWithPassword.mutate({
        email: 'not-an-email',
        password: '',
      });
    },
    expectedError: 'Invalid email',
  },
  {
    name: 'Server Error',
    description: 'Simulate internal server error',
    test: async () => {
      logger.info('Triggering server error');
      // This should cause a server error due to invalid input
      await trpc.healthcare.acknowledgeAlert.mutate({
        alertId: 'non-existent-id',
        notes: 'test',
      });
    },
    expectedError: 'INTERNAL_SERVER_ERROR',
  },
];

async function runTests() {
  logger.info('Starting error handling tests', 'TEST');
  logger.info('API URL:', API_URL);
  
  const results = {
    passed: 0,
    failed: 0,
    errors: [] as { test: string; error: any }[],
  };
  
  for (const testCase of testCases) {
    logger.info(`\n${'='.repeat(50)}`);
    logger.info(`Running: ${testCase.name}`);
    logger.info(`Description: ${testCase.description}`);
    
    try {
      await testCase.test();
      // If we expected an error but didn't get one, it's a failure
      if (testCase.expectedError) {
        logger.error(`FAILED: Expected error containing "${testCase.expectedError}" but no error was thrown`);
        results.failed++;
        results.errors.push({ test: testCase.name, error: 'No error thrown' });
      } else {
        logger.success(`PASSED: ${testCase.name}`);
        results.passed++;
      }
    } catch (error: any) {
      // Check if this is an expected error
      if (testCase.expectedError) {
        const errorMessage = error.message || error.toString();
        if (errorMessage.includes(testCase.expectedError)) {
          logger.success(`PASSED: Got expected error - ${errorMessage}`);
          results.passed++;
        } else {
          logger.error(`FAILED: Expected error containing "${testCase.expectedError}" but got "${errorMessage}"`);
          results.failed++;
          results.errors.push({ test: testCase.name, error: errorMessage });
        }
      } else {
        logger.error(`FAILED: Unexpected error - ${error.message}`);
        results.failed++;
        results.errors.push({ test: testCase.name, error });
      }
    }
  }
  
  // Summary
  logger.info(`\n${'='.repeat(50)}`);
  logger.info('TEST SUMMARY', 'TEST');
  logger.info(`Total tests: ${testCases.length}`);
  logger.success(`Passed: ${results.passed}`);
  logger.error(`Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    logger.error('\nFailed tests:');
    results.errors.forEach(({ test, error }) => {
      logger.error(`- ${test}: ${error}`);
    });
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Instructions for manual testing
logger.info('\nERROR HANDLING TEST SCENARIOS', 'TEST');
logger.info('This script tests various error scenarios');
logger.info('\nTo manually test in the app:');
logger.info('1. Disconnect network to test offline mode');
logger.info('2. Clear session to test auth errors');
logger.info('3. Remove hospital assignment to test profile incomplete');
logger.info('4. Make rapid requests to test rate limiting');
logger.info('5. Send malformed data to test validation');
logger.info('\nStarting automated tests...\n');

// Run the tests
runTests().catch((error) => {
  logger.error('Test script failed:', error);
  process.exit(1);
});