#!/usr/bin/env bun
/**
 * Email Service Test Script
 * Tests all email functionality including templates, queue, and error handling
 */

import { emailService } from '../src/server/services/email';
import { healthcareNotificationService } from '../src/server/services/healthcare-notifications';
import { log } from '../lib/core/debug/logger';
import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
import dotenv from 'dotenv';
import path from 'path';

// Load .env.email file
dotenv.config({ path: path.join(process.cwd(), '.env.email') });

// Test configuration
const TEST_EMAIL = process.env.EMAIL_USER || 'test@example.com';
const TEST_USER_ID = 'test-user-123';

async function testEmailConnection() {
// TODO: Replace with structured logging - /* console.log('\n🔌 Testing Email Connection...') */;
  try {
    await emailService.initialize();
// TODO: Replace with structured logging - /* console.log('✅ Email service initialized successfully') */;
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error);
    return false;
  }
}

async function testSendSimpleEmail() {
// TODO: Replace with structured logging - /* console.log('\n📧 Testing Simple Email...') */;
  try {
    const result = await emailService.send({
      to: TEST_EMAIL,
      subject: 'Test Email - Hospital Alert System',
      text: 'This is a test email from the Hospital Alert System.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email</h2>
          <p>This is a test email from the Hospital Alert System.</p>
          <p>If you received this, the email service is working correctly!</p>
          <p style="color: #666; font-size: 12px;">
            Sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });
    
// TODO: Replace with structured logging - /* console.log('✅ Simple email sent:', result) */;
    return true;
  } catch (error) {
    console.error('❌ Failed to send simple email:', error);
    return false;
  }
}

async function testHealthcareAlertEmail() {
// TODO: Replace with structured logging - /* console.log('\n🚨 Testing Healthcare Alert Email...') */;
  try {
    // Create test alert data
    const alertData = {
      alertId: 'test-alert-123',
      roomNumber: '302',
      alertType: 'Cardiac Emergency',
      urgencyLevel: 4,
      description: 'Patient experiencing chest pain and shortness of breath',
      patientName: 'John Doe',
      patientId: 'patient-123',
      createdBy: 'nurse-456',
      createdByName: 'Jane Smith',
      hospitalId: 'hospital-789',
    };

    // Mock recipient
    const mockRecipient = {
      userId: TEST_USER_ID,
      email: TEST_EMAIL,
      phone: '+1234567890',
    };

    // Send alert notification
    const result = await emailService.sendWithTemplate({
      to: mockRecipient.email,
      template: 'healthcare.alert-notification',
      data: {
        name: 'Test Doctor',
        ...alertData,
        acknowledgeUrl: 'http://localhost:8081/alerts/test-alert-123/acknowledge',
        dashboardUrl: 'http://localhost:8081/healthcare-dashboard',
        unsubscribeUrl: 'http://localhost:8081/settings/notifications',
        createdAt: new Date().toLocaleString(),
        escalationWarning: true,
        escalationMinutes: 5,
      },
    });

// TODO: Replace with structured logging - /* console.log('✅ Healthcare alert email sent:', result) */;
    return true;
  } catch (error) {
    console.error('❌ Failed to send healthcare alert email:', error);
    return false;
  }
}

async function testEscalationEmail() {
// TODO: Replace with structured logging - /* console.log('\n⚠️  Testing Escalation Email...') */;
  try {
    const result = await emailService.sendWithTemplate({
      to: TEST_EMAIL,
      template: 'healthcare.escalation',
      data: {
        roomNumber: '215',
        escalationLevel: 2,
        alertType: 'Fall Alert',
        alertDuration: 15,
        originalUrgency: 3,
        fromRole: 'nurse',
        toRole: 'doctor',
        escalationReason: 'Alert not acknowledged within 15 minutes',
        description: 'Patient reported falling in bathroom. Possible injury.',
        acknowledgeUrl: 'http://localhost:8081/alerts/test-escalation/acknowledge',
        nextLevel: 'head_doctor',
        nextEscalationMinutes: 10,
      },
    });

// TODO: Replace with structured logging - /* console.log('✅ Escalation email sent:', result) */;
    return true;
  } catch (error) {
    console.error('❌ Failed to send escalation email:', error);
    return false;
  }
}

async function testWelcomeEmail() {
// TODO: Replace with structured logging - /* console.log('\n👋 Testing Welcome Email...') */;
  try {
    const result = await emailService.sendWithTemplate({
      to: TEST_EMAIL,
      template: 'auth.welcome',
      data: {
        name: 'Test User',
        dashboardUrl: 'http://localhost:8081',
        profileUrl: 'http://localhost:8081/settings',
        helpUrl: 'http://localhost:8081/help',
      },
    });

// TODO: Replace with structured logging - /* console.log('✅ Welcome email sent:', result) */;
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
}

async function testVerificationEmail() {
// TODO: Replace with structured logging - /* console.log('\n✉️  Testing Verification Email...') */;
  try {
    const result = await emailService.sendWithTemplate({
      to: TEST_EMAIL,
      template: 'auth.verify-email',
      data: {
        name: 'Test User',
        verificationUrl: 'http://localhost:8081/verify-email?token=test-token-123',
        expirationTime: '24 hours',
      },
    });

// TODO: Replace with structured logging - /* console.log('✅ Verification email sent:', result) */;
    return true;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    return false;
  }
}

async function testPasswordResetEmail() {
// TODO: Replace with structured logging - /* console.log('\n🔑 Testing Password Reset Email...') */;
  try {
    const result = await emailService.sendWithTemplate({
      to: TEST_EMAIL,
      template: 'auth.password-reset',
      data: {
        name: 'Test User',
        resetUrl: 'http://localhost:8081/reset-password?token=reset-token-123',
        expirationTime: '1 hour',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Test Browser)',
      },
    });

// TODO: Replace with structured logging - /* console.log('✅ Password reset email sent:', result) */;
    return true;
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return false;
  }
}

async function testBatchEmails() {
// TODO: Replace with structured logging - /* console.log('\n📬 Testing Batch Emails...') */;
  try {
    const emails = [
      {
        to: TEST_EMAIL,
        subject: 'Batch Email 1',
        text: 'This is batch email 1',
      },
      {
        to: TEST_EMAIL,
        subject: 'Batch Email 2',
        text: 'This is batch email 2',
      },
      {
        to: TEST_EMAIL,
        subject: 'Batch Email 3',
        text: 'This is batch email 3',
      },
    ];

    const results = await emailService.sendBatch(emails);
// TODO: Replace with structured logging - /* console.log('✅ Batch emails sent:', results) */;
    return true;
  } catch (error) {
    console.error('❌ Failed to send batch emails:', error);
    return false;
  }
}

async function testEmailValidation() {
// TODO: Replace with structured logging - /* console.log('\n✓ Testing Email Validation...') */;
  
  const testCases = [
    { email: 'valid@example.com', shouldPass: true },
    { email: 'invalid.email', shouldPass: false },
    { email: 'test@', shouldPass: false },
    { email: '@example.com', shouldPass: false },
    { email: 'test@example', shouldPass: false },
    { email: 'test+tag@example.com', shouldPass: true },
  ];

  let allPassed = true;
  for (const { email, shouldPass } of testCases) {
    try {
      await emailService.send({
        to: email,
        subject: 'Validation Test',
        text: 'Test',
      });
      if (!shouldPass) {
// TODO: Replace with structured logging - /* console.log(`❌ Validation failed: ${email} should have been rejected`) */;
        allPassed = false;
      } else {
// TODO: Replace with structured logging - /* console.log(`✅ Valid email accepted: ${email}`) */;
      }
    } catch (error) {
      if (shouldPass) {
// TODO: Replace with structured logging - /* console.log(`❌ Validation failed: ${email} should have been accepted`) */;
        allPassed = false;
      } else {
// TODO: Replace with structured logging - /* console.log(`✅ Invalid email rejected: ${email}`) */;
      }
    }
  }

  return allPassed;
}

async function runAllTests() {
// TODO: Replace with structured logging - /* console.log('🚀 Starting Email Service Tests...') */;
// TODO: Replace with structured logging - /* console.log('================================') */;
  
  const tests = [
    { name: 'Email Connection', fn: testEmailConnection },
    { name: 'Simple Email', fn: testSendSimpleEmail },
    { name: 'Healthcare Alert Email', fn: testHealthcareAlertEmail },
    { name: 'Escalation Email', fn: testEscalationEmail },
    { name: 'Welcome Email', fn: testWelcomeEmail },
    { name: 'Verification Email', fn: testVerificationEmail },
    { name: 'Password Reset Email', fn: testPasswordResetEmail },
    { name: 'Batch Emails', fn: testBatchEmails },
    { name: 'Email Validation', fn: testEmailValidation },
  ];

  const results: { name: string; passed: boolean }[] = [];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      console.error(`Test ${test.name} threw an error:`, error);
      results.push({ name: test.name, passed: false });
    }
  }

// TODO: Replace with structured logging - /* console.log('\n================================') */;
// TODO: Replace with structured logging - /* console.log('📊 Test Results:') */;
// TODO: Replace with structured logging - /* console.log('================================') */;
  
  let totalPassed = 0;
  for (const result of results) {
// TODO: Replace with structured logging - /* console.log(`${result.passed ? '✅' : '❌'} ${result.name}`) */;
    if (result.passed) totalPassed++;
  }

// TODO: Replace with structured logging - /* console.log('\n================================') */;
// TODO: Replace with structured logging - /* console.log(`Total: ${totalPassed}/${results.length} tests passed`) */;
  
  if (totalPassed === results.length) {
// TODO: Replace with structured logging - /* console.log('\n🎉 All tests passed! Email service is fully functional.') */;
  } else {
// TODO: Replace with structured logging - /* console.log('\n⚠️  Some tests failed. Please check the logs above.') */;
  }

  // Cleanup
  await emailService.shutdown();
  process.exit(totalPassed === results.length ? 0 : 1);
}

// Run tests
runAllTests().catch(console.error);