#!/usr/bin/env bun
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testHybridQueue() {

  try {
    // Import only what we need to avoid React Native imports
    const { HybridQueueSystem } = await import('../src/server/services/queues/hybrid-queue');

    const queue = new HybridQueueSystem();

    await queue.initialize();

    const jobId = await queue.sendNotification({
      alertId: 'test-alert-1',
      type: 'email',
      recipientId: 'test-user-1',
      recipientEmail: 'test@example.com',
      urgent: false,
    });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    const stats = await queue.getStats();

    await queue.shutdown();

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testHybridQueue();