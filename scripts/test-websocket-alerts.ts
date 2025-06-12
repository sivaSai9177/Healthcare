#!/usr/bin/env bun

/**
 * Test WebSocket Alert Subscriptions
 * Tests the real-time alert system with WebSocket connections
 */

import { createTRPCProxyClient, createWSClient, wsLink } from '@trpc/client';
import type { AppRouter } from '../src/server/routers';
import { log } from '../lib/core/debug/logger';
import { db } from '../src/db';
import { alerts } from '../src/db/healthcare-schema';
import { eq } from 'drizzle-orm';

const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'ws://localhost:3001/api/trpc';
const TEST_HOSPITAL_ID = process.env.TEST_HOSPITAL_ID || 'e60ef641-92bd-449b-b68c-2e16c1bd8326';

async function testWebSocketAlerts() {
  log.info('🔌 Testing WebSocket Alert System', 'WS_TEST');
  
  try {
    // Create WebSocket client
    const wsClient = createWSClient({
      url: WEBSOCKET_URL,
      connectionParams: async () => {
        // In a real app, this would include the auth token
        return {
          authorization: 'Bearer test-token',
        };
      },
    });
    
    // Create tRPC client
    const trpc = createTRPCProxyClient<AppRouter>({
      links: [
        wsLink({
          client: wsClient,
        }),
      ],
    });
    
    log.info('📡 Connecting to WebSocket server...', 'WS_TEST', { url: WEBSOCKET_URL });
    
    // Subscribe to alerts
    const alertSubscription = await trpc.healthcare.subscribeToAlerts.subscribe(
      { hospitalId: TEST_HOSPITAL_ID },
      {
        onData: (event) => {
          log.info('🚨 Alert event received!', 'WS_TEST', {
            type: event.type,
            alertId: event.alertId,
            data: event.data,
          });
        },
        onError: (err) => {
          log.error('❌ Subscription error', 'WS_TEST', err);
        },
        onStarted: () => {
          log.info('✅ Alert subscription started', 'WS_TEST');
        },
        onStopped: () => {
          log.info('🛑 Alert subscription stopped', 'WS_TEST');
        },
      }
    );
    
    // Subscribe to metrics
    const metricsSubscription = await trpc.healthcare.subscribeToMetrics.subscribe(
      { hospitalId: TEST_HOSPITAL_ID, interval: 3000 },
      {
        onData: (metrics) => {
          log.info('📊 Metrics update received!', 'WS_TEST', metrics);
        },
        onError: (err) => {
          log.error('❌ Metrics subscription error', 'WS_TEST', err);
        },
        onStarted: () => {
          log.info('✅ Metrics subscription started', 'WS_TEST');
        },
      }
    );
    
    // Wait a bit for subscriptions to establish
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a test alert to trigger the subscription
    log.info('🆕 Creating test alert...', 'WS_TEST');
    
    const [testAlert] = await db.insert(alerts).values({
      roomNumber: '999',
      alertType: 'medical_emergency',
      urgencyLevel: 5,
      description: 'WebSocket test alert',
      createdBy: '00000000-0000-0000-0000-000000000000', // System user
      hospitalId: TEST_HOSPITAL_ID,
      status: 'active',
      currentEscalationTier: 1,
      nextEscalationAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    }).returning();
    
    log.info('✅ Test alert created', 'WS_TEST', {
      alertId: testAlert.id,
      roomNumber: testAlert.roomNumber,
    });
    
    // Wait for events to be received
    log.info('⏳ Waiting for WebSocket events...', 'WS_TEST');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Clean up test alert
    log.info('🧹 Cleaning up test alert...', 'WS_TEST');
    await db.delete(alerts).where(eq(alerts.id, testAlert.id));
    
    // Unsubscribe
    log.info('👋 Unsubscribing...', 'WS_TEST');
    alertSubscription.unsubscribe();
    metricsSubscription.unsubscribe();
    
    // Close WebSocket connection
    wsClient.close();
    
    log.info('✅ WebSocket test completed successfully!', 'WS_TEST');
    
  } catch (error) {
    log.error('❌ WebSocket test failed', 'WS_TEST', error);
    process.exit(1);
  }
}

// Run the test
testWebSocketAlerts();