#!/usr/bin/env bun
/**
 * Test script for the logging service
 */

async function testLoggingService() {
  const loggingUrl = 'http://localhost:3003';

  // Test health endpoint

  try {
    const healthRes = await fetch(`${loggingUrl}/health`);
    const health = await healthRes.json();

  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
  
  // Test TRPC logging

  try {
    const trpcLog = {
      procedure: 'healthcare.getActiveAlerts',
      input: { hospitalId: 'test-hospital-123' },
      output: { alerts: [] },
      duration: 125,
      success: true,
      userId: 'user-123',
      organizationId: 'org-456',
      hospitalId: 'hospital-789',
      traceId: crypto.randomUUID(),
      metadata: {
        userRole: 'nurse',
        requestType: 'query'
      }
    };
    
    const trpcRes = await fetch(`${loggingUrl}/trpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trpcLog),
    });
    
    const trpcResult = await trpcRes.json();

  } catch (error) {
    console.error('❌ TRPC logging failed:', error);
  }
  
  // Test event logging

  try {
    const eventLog = {
      level: 'info',
      service: 'test-script',
      category: 'authentication',
      message: 'User logged in successfully',
      metadata: {
        loginMethod: 'email',
        userAgent: 'Test Script'
      },
      userId: 'user-123',
      organizationId: 'org-456',
    };
    
    const eventRes = await fetch(`${loggingUrl}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventLog),
    });
    
    const eventResult = await eventRes.json();

  } catch (error) {
    console.error('❌ Event logging failed:', error);
  }
  
  // Test performance logging

  try {
    const perfLog = {
      name: 'api.response.time',
      value: 250,
      unit: 'ms',
      tags: {
        endpoint: '/api/healthcare/alerts',
        method: 'GET',
        status: 200
      }
    };
    
    const perfRes = await fetch(`${loggingUrl}/performance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(perfLog),
    });
    
    const perfResult = await perfRes.json();

  } catch (error) {
    console.error('❌ Performance logging failed:', error);
  }
  
  // Test batch logging

  try {
    const batchLogs = {
      events: [
        {
          type: 'trpc',
          procedure: 'auth.login',
          duration: 200,
          success: true,
          traceId: crypto.randomUUID(),
        },
        {
          type: 'event',
          level: 'warn',
          service: 'test',
          message: 'Test warning',
          category: 'test',
        },
        {
          type: 'trpc',
          procedure: 'healthcare.createAlert',
          duration: 350,
          success: false,
          error: { message: 'Test error' },
          traceId: crypto.randomUUID(),
        }
      ]
    };
    
    const batchRes = await fetch(`${loggingUrl}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchLogs),
    });
    
    const batchResult = await batchRes.json();

  } catch (error) {
    console.error('❌ Batch logging failed:', error);
  }

}

// Run the test
testLoggingService().catch(console.error);