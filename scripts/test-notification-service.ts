#!/usr/bin/env bun

import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '../src/db/combined-schema';
import { emailService } from '../src/server/services/email';
import { smsService } from '../src/server/services/sms';
import { getEnvConfig } from '../lib/core/config/env-config';

async function testNotificationService() {
// TODO: Replace with structured logging - console.log('🔔 Testing Notification Service...\n');

  // Get database URL
  const envConfig = await getEnvConfig();
  const databaseUrl = envConfig.DATABASE_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  // Connect to database
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const db = drizzle(client, { schema });

  try {
    // Test email notifications
// TODO: Replace with structured logging - console.log('📧 Testing Email Notifications...');
    
    // Test welcome email
    const welcomeEmailResult = await emailService.sendWelcomeEmail(
      'test@example.com',
      'Test User'
    );
// TODO: Replace with structured logging - console.log('✅ Welcome email:', welcomeEmailResult ? 'Sent' : 'Failed');

    // Test alert notification
    const alertEmailResult = await emailService.sendAlertNotification({
      to: 'test@example.com',
      alert: {
        id: 'test-123',
        code: 'TEST-001',
        title: 'Test Alert',
        description: 'This is a test alert notification',
        priority: 'high',
        patientName: 'John Doe',
        location: 'Room 101'
      },
      hospitalName: 'Test Hospital'
    });
// TODO: Replace with structured logging - console.log('✅ Alert email:', alertEmailResult ? 'Sent' : 'Failed');

    // Test SMS notifications (if configured)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
// TODO: Replace with structured logging - console.log('\n📱 Testing SMS Notifications...');
      
      const smsResult = await smsService.sendAlertSMS({
        to: process.env.TEST_PHONE_NUMBER || '+1234567890',
        alert: {
          code: 'TEST-001',
          title: 'Test Alert',
          priority: 'high'
        }
      });
// TODO: Replace with structured logging - console.log('✅ SMS notification:', smsResult ? 'Sent' : 'Failed');
    } else {
// TODO: Replace with structured logging - console.log('\n⚠️  SMS notifications not configured (missing Twilio credentials)');
    }

    // Test database notification logging
// TODO: Replace with structured logging - console.log('\n💾 Testing Notification Logging...');
    
    const notification = await db.insert(schema.notifications).values({
      userId: 'test-user-id',
      type: 'alert',
      channel: 'email',
      recipient: 'test@example.com',
      subject: 'Test Alert Notification',
      content: 'This is a test notification',
      status: 'sent',
      metadata: {
        alertId: 'test-123',
        priority: 'high'
      }
    }).returning();
    
// TODO: Replace with structured logging - console.log('✅ Notification logged:', notification[0].id);

    // Fetch notification history
    const history = await db.select()
      .from(schema.notifications)
      .where(schema.eq(schema.notifications.userId, 'test-user-id'))
      .limit(5);
    
// TODO: Replace with structured logging - console.log(`\n📋 Notification History: ${history.length} records found`);
    history.forEach(n => {
// TODO: Replace with structured logging - console.log(`   - ${n.type}: ${n.subject} (${n.status}) - ${n.sentAt || 'pending'}`);
    });

// TODO: Replace with structured logging - console.log('\n✅ Notification service test completed!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

// Run the test
testNotificationService();