#!/usr/bin/env bun
/**
 * Test PostHog Integration
 * Verifies that PostHog is properly configured and receiving events
 */

import { posthogService } from '@/src/server/analytics/posthog-service';
import { logger } from '@/lib/core/debug/unified-logger';

async function testPostHogIntegration() {

  // Check if PostHog is enabled
  if (!posthogService.isEnabled()) {
    console.error('❌ PostHog is not enabled. Check your environment variables:');

    return;
  }

  // Test user identification

  const testUserId = `test-user-${Date.now()}`;
  await posthogService.identify(testUserId, {
    email: 'test@example.com',
    name: 'Test User',
    role: 'tester',
    createdAt: new Date().toISOString(),
  });

  // Test event tracking

  const events = [
    { event: 'test_event', properties: { category: 'test', value: 1 } },
    { event: 'button_clicked', properties: { button_name: 'test_button', screen: 'test_screen' } },
    { event: 'page_viewed', properties: { page: '/test', duration: 1500 } },
  ];

  for (const { event, properties } of events) {
    await posthogService.capture(event, testUserId, properties);

  }

  // Test API performance tracking

  await posthogService.trackApiPerformance(
    'test.procedure',
    125,
    true,
    testUserId
  );

  // Test error tracking

  await posthogService.trackError(
    new Error('Test error message'),
    { context: 'test_script', severity: 'low' },
    testUserId
  );

  // Test feature usage tracking

  await posthogService.trackFeatureUsage(
    'test_feature',
    'activated',
    testUserId,
    { test_metadata: 'value' }
  );

  // Test batch capture

  const batchEvents = [
    { event: 'batch_event_1', distinctId: testUserId, properties: { index: 1 } },
    { event: 'batch_event_2', distinctId: testUserId, properties: { index: 2 } },
    { event: 'batch_event_3', distinctId: testUserId, properties: { index: 3 } },
  ];
  await posthogService.batchCapture(batchEvents);

  // Flush events

  await posthogService.flush();

  // Summary

  // Shutdown
  await posthogService.shutdown();
}

// Run the test
testPostHogIntegration().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});