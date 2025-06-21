#!/usr/bin/env bun

/**
 * Test Email Service in Docker
 * Tests the email service endpoints
 */

import { log } from '../lib/core/debug/unified-logger';

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3001';

async function testEmailService() {
  log.info('Testing Email Service', 'TEST_EMAIL', {
    url: EMAIL_SERVICE_URL,
  });

  try {
    // Test health endpoint
    log.info('Testing health endpoint...', 'TEST_EMAIL');
    const healthResponse = await fetch(`${EMAIL_SERVICE_URL}/health`);
    const healthData = await healthResponse.json();
    log.info('Health check result', 'TEST_EMAIL', healthData);

    // Test sending a test email
    log.info('Sending test email...', 'TEST_EMAIL');
    const testResponse = await fetch(`${EMAIL_SERVICE_URL}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'test@healthcare.local',
      }),
    });

    if (!testResponse.ok) {
      const error = await testResponse.text();
      throw new Error(`Test email failed: ${error}`);
    }

    const testResult = await testResponse.json();
    log.info('Test email sent', 'TEST_EMAIL', testResult);

    // Test alert notification
    log.info('Testing alert notification...', 'TEST_EMAIL');
    const alertResponse = await fetch(`${EMAIL_SERVICE_URL}/alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'nurse@healthcare.local',
        alertId: 'test-alert-123',
        patientName: 'John Doe',
        roomNumber: '101',
        urgency: 'high',
        message: 'Patient requires immediate attention',
        hospitalName: 'City General Hospital',
        createdAt: new Date().toISOString(),
      }),
    });

    if (!alertResponse.ok) {
      const error = await alertResponse.text();
      throw new Error(`Alert notification failed: ${error}`);
    }

    const alertResult = await alertResponse.json();
    log.info('Alert notification sent', 'TEST_EMAIL', alertResult);

    // Test escalation notification
    log.info('Testing escalation notification...', 'TEST_EMAIL');
    const escalationResponse = await fetch(`${EMAIL_SERVICE_URL}/escalation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: ['doctor@healthcare.local', 'manager@healthcare.local'],
        alertId: 'test-alert-123',
        patientName: 'John Doe',
        roomNumber: '101',
        urgency: 'critical',
        message: 'Patient requires immediate attention',
        hospitalName: 'City General Hospital',
        escalationLevel: 2,
        previousAssignee: 'Nurse Sarah',
        timeElapsed: '15 minutes',
      }),
    });

    if (!escalationResponse.ok) {
      const error = await escalationResponse.text();
      throw new Error(`Escalation notification failed: ${error}`);
    }

    const escalationResult = await escalationResponse.json();
    log.info('Escalation notification sent', 'TEST_EMAIL', escalationResult);

    log.info('✅ All email service tests passed!', 'TEST_EMAIL');
    
    if (EMAIL_SERVICE_URL.includes('mailhog')) {
      log.info('📧 Check Mailhog UI to see emails:', 'TEST_EMAIL', {
        url: 'http://localhost:8025',
      });
    }

  } catch (error) {
    log.error('Email service test failed', 'TEST_EMAIL', error);
    process.exit(1);
  }
}

// Run the test
testEmailService();