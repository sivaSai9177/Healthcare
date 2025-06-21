#!/usr/bin/env bun

/**
 * Test tRPC WebSocket Subscriptions
 * Tests the real-time alert system with tRPC WebSocket integration
 */

import { createTRPCProxyClient, httpBatchLink, splitLink, wsLink, createWSClient } from '@trpc/client';
import type { AppRouter } from '../src/server/routers';
import { log } from '../lib/core/debug/logger';
import { db } from '../src/db';
import { alerts } from '../src/db/healthcare-schema';
import { eq } from 'drizzle-orm';

const HTTP_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';
const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3002/api/trpc';
const TEST_HOSPITAL_ID = process.env.TEST_HOSPITAL_ID || 'e60ef641-92bd-449b-b68c-2e16c1bd8326';

// Test user token (you'll need to get this from a real login session)
const TEST_TOKEN = process.env.TEST_AUTH_TOKEN || '';

async function testTRPCWebSocket() {
  log.info('🔌 Testing tRPC WebSocket System', 'WS_TEST');
  
  try {
    // Create WebSocket client
    const wsClient = createWSClient({
      url: WS_URL,
      connectionParams: async () => {
        // Pass auth token in connection params
        return {
          authorization: TEST_TOKEN ? `Bearer ${TEST_TOKEN}` : '',
        };
      },
      onOpen: () => {
        log.info('WebSocket connection opened', 'WS_TEST');
      },
      onClose: () => {
        log.info('WebSocket connection closed', 'WS_TEST');
      },
      onError: (error) => {
        log.error('WebSocket connection error', 'WS_TEST', error);
      },
    });
    
    // Create tRPC client with split link for subscriptions
    const trpc = createTRPCProxyClient<AppRouter>({
      links: [
        splitLink({
          condition: (op) => op.type === 'subscription',
          true: wsLink({
            client: wsClient,
          }),
          false: httpBatchLink({
            url: `${HTTP_URL}/api/trpc`,
            headers: () => ({
              authorization: TEST_TOKEN ? `Bearer ${TEST_TOKEN}` : '',
            }),
          }),
        }),
      ],
    });
    
    log.info('📡 Connecting to tRPC server...', 'WS_TEST', { 
      httpUrl: `${HTTP_URL}/api/trpc`,
      wsUrl: WS_URL 
    });
    
    // Subscribe to alerts
    log.info('🚨 Subscribing to alerts...', 'WS_TEST');
    
    const alertSubscription = await new Promise<any>((resolve, reject) => {
      let subscription: any;
      
      const timer = setTimeout(() => {
        reject(new Error('Subscription timeout'));
      }, 10000);
      
      subscription = trpc.healthcare.subscribeToAlerts.subscribe(
        { hospitalId: TEST_HOSPITAL_ID },
        {
          onData: (event) => {
            clearTimeout(timer);
            log.info('🚨 Alert event received!', 'WS_TEST', {
              type: event.type,
              alertId: event.alertId,
              data: event.data,
              timestamp: event.timestamp,
            });
            resolve(subscription);
          },
          onError: (err) => {
            clearTimeout(timer);
            log.error('❌ Subscription error', 'WS_TEST', err);
            reject(err);
          },
          onStarted: () => {
            log.info('✅ Alert subscription started', 'WS_TEST');
            
            // Create a test alert after subscription starts
            setTimeout(async () => {
              await createTestAlert();
            }, 2000);
          },
          onStopped: () => {
            log.info('🛑 Alert subscription stopped', 'WS_TEST');
          },
        }
      );
    });
    
    // Wait for more events
    log.info('⏳ Waiting for more events...', 'WS_TEST');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test metrics subscription
    log.info('📊 Testing metrics subscription...', 'WS_TEST');
    
    const metricsSubscription = trpc.healthcare.subscribeToMetrics.subscribe(
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
    
    // Wait for metrics updates
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Unsubscribe
    log.info('👋 Unsubscribing...', 'WS_TEST');
    alertSubscription.unsubscribe();
    metricsSubscription.unsubscribe();
    
    // Close WebSocket connection
    wsClient.close();
    
    log.info('✅ tRPC WebSocket test completed successfully!', 'WS_TEST');
    process.exit(0);
    
  } catch (error) {
    log.error('❌ tRPC WebSocket test failed', 'WS_TEST', error);
    process.exit(1);
  }
}

async function createTestAlert() {
  try {
    log.info('🆕 Creating test alert...', 'WS_TEST');
    
    const [testAlert] = await db.insert(alerts).values({
      roomNumber: '999',
      alertType: 'medical_emergency',
      urgencyLevel: 5,
      description: 'tRPC WebSocket test alert',
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
    
    // Clean up after 3 seconds
    setTimeout(async () => {
      await db.delete(alerts).where(eq(alerts.id, testAlert.id));
      log.info('🧹 Test alert cleaned up', 'WS_TEST');
    }, 3000);
    
  } catch (error) {
    log.error('Failed to create test alert', 'WS_TEST', error);
  }
}

// Run the test
testTRPCWebSocket();