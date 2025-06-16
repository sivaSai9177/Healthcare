#!/usr/bin/env bun
/**
 * Test script for unified logging system
 * Run with: bun run scripts/test-unified-logging.ts
 */

import { logger } from '../lib/core/debug/unified-logger';

console.log('🧪 Testing Unified Logging System\n');

// Test different log levels
console.log('1️⃣ Testing Log Levels:');
logger.info('This is an info message', 'SYSTEM');
logger.warn('This is a warning message', 'SYSTEM');
logger.error('This is an error message', 'ERROR');
logger.debug('This is a debug message', 'SYSTEM');

// Test AUTH logging
console.log('\n2️⃣ Testing AUTH Category:');
logger.auth.info('User authentication started');
logger.auth.login('user123', 'email');
logger.auth.logout('user123');
logger.auth.error('Authentication failed', new Error('Invalid credentials'));
logger.auth.sessionRefresh('user123', 'session456');

// Test API logging
console.log('\n3️⃣ Testing API Category:');
logger.api.request('POST', '/api/auth/sign-in', { email: 'test@example.com' });
logger.api.response('POST', '/api/auth/sign-in', 200, 150);
logger.api.error('POST', '/api/auth/sign-in', new Error('Network error'), 500);

// Test TRPC logging
console.log('\n4️⃣ Testing TRPC Category:');
logger.trpc.request('auth.signIn', 'mutation', { email: 'test@example.com' }, 'req123');
logger.trpc.success('auth.signIn', 'mutation', 120, 'req123');
logger.trpc.error('auth.signIn', 'mutation', new Error('Unauthorized'), 100, 'req123');

// Test STORE logging
console.log('\n5️⃣ Testing STORE Category:');
logger.store.update('authStore', 'setUser', { userId: 'user123' });
logger.store.error('authStore', 'setUser', new Error('State update failed'));

// Test ROUTER logging
console.log('\n6️⃣ Testing ROUTER Category:');
logger.router.navigate('/login', '/dashboard', { from: 'auth' });
logger.router.error('/dashboard', new Error('Route not found'));

// Test category filtering
console.log('\n7️⃣ Testing Category Filtering:');
console.log('Disabling AUTH category...');
logger.disableCategory('AUTH');
logger.auth.info('This should not appear if AUTH is disabled');

console.log('Re-enabling AUTH category...');
logger.enableCategory('AUTH');
logger.auth.info('This should appear now that AUTH is enabled');

// Test with metadata
console.log('\n8️⃣ Testing Rich Metadata:');
logger.auth.debug('Complex auth event', {
  userId: 'user123',
  sessionId: 'session456',
  metadata: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    timestamp: new Date().toISOString(),
    nested: {
      deep: {
        value: 'test'
      }
    }
  }
});

// Test error objects
console.log('\n9️⃣ Testing Error Objects:');
const complexError = new Error('Complex error');
(complexError as any).code = 'AUTH_FAILED';
(complexError as any).statusCode = 401;
(complexError as any).details = { reason: 'Invalid token' };

logger.error('Complex error test', 'ERROR', complexError);

// Performance test
console.log('\n🏁 Performance Test:');
const iterations = 1000;
const start = performance.now();

for (let i = 0; i < iterations; i++) {
  logger.debug(`Performance test log ${i}`, 'SYSTEM', { iteration: i });
}

const duration = performance.now() - start;
console.log(`✅ Logged ${iterations} messages in ${duration.toFixed(2)}ms`);
console.log(`📊 Average: ${(duration / iterations).toFixed(3)}ms per log`);

console.log('\n✨ Unified Logging Test Complete!');
console.log('Check the DebugPanel in your app to see all logged messages.');

// Test summary
const summary = {
  totalTests: 9,
  categories: ['AUTH', 'API', 'TRPC', 'STORE', 'ROUTER', 'SYSTEM', 'ERROR'],
  features: [
    'Log levels (info, warn, error, debug)',
    'Category-based logging',
    'Rich metadata support',
    'Error object handling',
    'Performance logging',
    'Category filtering',
    'DebugPanel integration'
  ]
};

console.log('\n📋 Test Summary:', summary);