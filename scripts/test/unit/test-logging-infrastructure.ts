#!/usr/bin/env bun
/**
 * Test script for logging infrastructure
 * Tests the entire logging pipeline including Docker service
 */

import 'module-alias/register';
import path from 'path';
import moduleAlias from 'module-alias';

// Set up module alias
moduleAlias.addAlias('@', path.resolve(__dirname, '..'));

async function testLoggingInfrastructure() {

  // Test 1: Check if logging service is running

  try {
    const healthResponse = await fetch('http://localhost:3003/health');
    if (healthResponse.ok) {
      const health = await healthResponse.json();

    } else {
      console.error('❌ Logging service health check failed:', healthResponse.status);
      return;
    }
  } catch (error) {
    console.error('❌ Cannot connect to logging service at http://localhost:3003');
    console.error('   Make sure Docker is running: docker-compose -f docker-compose.local.yml up -d logging-local');
    return;
  }

  // Test 2: Send direct log to service

  try {
    const logResponse = await fetch('http://localhost:3003/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'info',
        message: 'Test log from infrastructure test',
        service: 'test',
        category: 'infrastructure',
        metadata: { timestamp: new Date().toISOString() }
      }),
    });
    
    if (logResponse.ok) {

    } else {
      console.error('❌ Direct log submission failed:', logResponse.status);
    }
  } catch (error) {
    console.error('❌ Error sending direct log:', error);
  }

  // Test 3: Send batch logs

  try {
    const batchResponse = await fetch('http://localhost:3003/log/batch', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Batch-ID': 'test-batch-123',
        'X-Retry-Count': '0'
      },
      body: JSON.stringify({
        events: [
          {
            level: 'info',
            message: 'Batch log 1',
            service: 'test',
            category: 'batch'
          },
          {
            level: 'warn',
            message: 'Batch log 2',
            service: 'test',
            category: 'batch'
          },
          {
            level: 'error',
            message: 'Batch log 3',
            service: 'test',
            category: 'batch',
            error: 'Test error message'
          }
        ]
      }),
    });
    
    if (batchResponse.ok) {
      const result = await batchResponse.json();

    } else {
      console.error('❌ Batch log submission failed:', batchResponse.status);
    }
  } catch (error) {
    console.error('❌ Error sending batch logs:', error);
  }

  // Test 4: Check CORS headers

  try {
    const corsResponse = await fetch('http://localhost:3003/health', {
      headers: { 'Origin': 'http://localhost:8081' }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers'),
    };

  } catch (error) {
    console.error('❌ Error checking CORS headers:', error);
  }

  // Test 5: Test tRPC logger (simulated)

  try {
    const trpcEvent = {
      type: 'trpc',
      procedure: 'test.procedure',
      input: { test: true },
      userId: 'test-user-123',
      traceId: 'test-trace-123',
      timestamp: new Date().toISOString(),
      metadata: {
        userRole: 'user',
        requestType: 'query',
      }
    };
    
    const trpcResponse = await fetch('http://localhost:3003/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trpcEvent),
    });
    
    if (trpcResponse.ok) {

    } else {
      console.error('❌ tRPC log simulation failed:', trpcResponse.status);
    }
  } catch (error) {
    console.error('❌ Error sending tRPC log:', error);
  }

  // Test 6: Get stats

  try {
    const statsResponse = await fetch('http://localhost:3003/stats');
    if (statsResponse.ok) {
      const stats = await statsResponse.json();

    } else {
      console.error('❌ Failed to get stats:', statsResponse.status);
    }
  } catch (error) {
    console.error('❌ Error getting stats:', error);
  }

  // Test 7: Query logs

  try {
    const queryResponse = await fetch('http://localhost:3003/logs?category=all&limit=5');
    if (queryResponse.ok) {
      const logs = await queryResponse.json();

      // Display first few logs
      logs.logs.slice(0, 3).forEach((log: any, index: number) => {

      });
    } else {
      console.error('❌ Failed to query logs:', queryResponse.status);
    }
  } catch (error) {
    console.error('❌ Error querying logs:', error);
  }

}

// Run the test
testLoggingInfrastructure().catch(console.error);