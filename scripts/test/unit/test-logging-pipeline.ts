#!/usr/bin/env bun
/**
 * Test script to verify logging pipeline is working
 */

// Set up module alias
import moduleAlias from 'module-alias';
import path from 'path';
moduleAlias.addAlias('@', path.resolve(__dirname, '..'));

// Direct imports to avoid React Native dependencies
const { logger } = require('../lib/core/debug/logger');
const { trpcLogger } = require('../lib/core/debug/trpc-logger-enhanced');

async function testLoggingPipeline() {

  // Test 1: Direct unified logger

  logger.info('Test info message', 'TEST_SCRIPT', { test: true });
  logger.warn('Test warning message', 'TEST_SCRIPT', { warning: 'This is a test' });
  logger.error('Test error message', 'TEST_SCRIPT', new Error('Test error'));
  
  // Test 2: Auth logging

  logger.auth.login('Test login event', { userId: 'test-123', provider: 'email' });
  logger.auth.error('Test auth error', new Error('Auth test error'));
  
  // Test 3: API logging

  logger.api.request('Test API request', { endpoint: '/test', method: 'GET' });
  logger.api.response('Test API response', { endpoint: '/test', status: 200 });
  
  // Test 4: tRPC logger

  const mockCtx = {
    session: {
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        role: 'user'
      }
    }
  };
  
  trpcLogger.logRequestStart('test.procedure', 'query', mockCtx, { input: 'test' }, 'test-request-id');
  
  // Wait a moment for async logs to be sent
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  trpcLogger.logRequestSuccess('test.procedure', 'query', { result: 'success' }, 123, 'test-request-id');
  
  // Test auth event
  trpcLogger.logAuthEvent('login_attempt', 'auth.login', mockCtx, { 
    provider: 'email',
    success: true 
  });
  
  // Force flush logs

  trpcLogger.stopBatchTimer();

}

testLoggingPipeline().catch(console.error);