#!/usr/bin/env bun
import { config } from 'dotenv';
import { log } from '../lib/core/debug/unified-logger';
import { initializeQueues, queues, hybridQueue } from '../src/server/services/queues';

// Load environment variables
config({ path: '.env.local' });

async function testHybridQueue() {
  try {
    log.info('Starting hybrid queue system test...', 'TEST');

    // Initialize the queue system
    await initializeQueues();
    log.info('Queue system initialized', 'TEST');

    // Test 1: Send a standard notification
    log.info('Test 1: Sending standard notification', 'TEST');
    const standardJobId = await hybridQueue.sendNotification({
      alertId: 'test-alert-1',
      type: 'email',
      recipientId: 'test-user-1',
      recipientEmail: 'test@example.com',
      urgent: false,
    });
    log.info('Standard notification queued', 'TEST', { jobId: standardJobId });

    // Test 2: Send an urgent notification
    log.info('Test 2: Sending urgent notification', 'TEST');
    const urgentJobId = await hybridQueue.sendNotification({
      alertId: 'test-alert-2',
      type: 'push',
      recipientId: 'test-user-2',
      urgent: true,
    });
    log.info('Urgent notification queued', 'TEST', { jobId: urgentJobId });

    // Test 3: Use the convenience method for alerts
    log.info('Test 3: Sending alert via convenience method', 'TEST');
    const alertJobId = await queues.sendAlert({
      alertId: 'test-alert-3',
      type: 'email',
      recipientId: 'test-user-3',
      recipientEmail: 'nurse@hospital.com',
    });
    log.info('Alert queued via convenience method', 'TEST', { jobId: alertJobId });

    // Wait a bit for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Get queue statistics
    log.info('Test 4: Getting queue statistics', 'TEST');
    const stats = await queues.getStats();
    log.info('Queue statistics', 'TEST', stats);

    // Success
    log.info('All tests completed successfully!', 'TEST');

    // Shutdown
    await hybridQueue.shutdown();
    log.info('Queue system shut down', 'TEST');

  } catch (error) {
    log.error('Test failed', 'TEST', { error });
    process.exit(1);
  }
}

// Run the test
testHybridQueue().catch(console.error);