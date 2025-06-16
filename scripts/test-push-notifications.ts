#!/usr/bin/env bun
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { userDeviceTokens } from '@/src/db/notification-schema';
import { notificationService, NotificationType, Priority } from '@/src/server/services/notifications';
import { expoPushService } from '@/src/server/services/push-notifications';
import { eq } from 'drizzle-orm';

async function testPushNotifications() {
  console.log('🔔 Testing Push Notification System\n');

  try {
    // 1. Get a test user
    console.log('1. Finding test user...');
    const [testUser] = await db
      .select()
      .from(users)
      .where(eq(users.role, 'doctor'))
      .limit(1);

    if (!testUser) {
      console.error('❌ No doctor user found. Please run healthcare setup first.');
      process.exit(1);
    }

    console.log(`✅ Found user: ${testUser.email}\n`);

    // 2. Add a test push token (Expo push token format)
    console.log('2. Adding test push token...');
    const testToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'; // This is a test token
    
    await db.insert(userDeviceTokens).values({
      userId: testUser.id,
      token: testToken,
      platform: 'ios',
      deviceName: 'Test iPhone',
      active: true,
    }).onConflictDoNothing();

    console.log('✅ Test push token added\n');

    // 3. Test direct push service
    console.log('3. Testing direct push service...');
    const directResult = await expoPushService.sendToUser(testUser.id, {
      title: '🧪 Test Direct Push',
      body: 'This is a direct push notification test',
      data: { test: true, timestamp: Date.now() },
    });

    console.log('Direct push result:', directResult);
    console.log('✅ Direct push test completed\n');

    // 4. Test notification service (full flow)
    console.log('4. Testing full notification service...');
    
    const notification = {
      id: `test-${Date.now()}`,
      type: NotificationType.ALERT_CREATED,
      recipient: {
        userId: testUser.id,
      },
      priority: Priority.HIGH,
      data: {
        alertId: 'test-alert-123',
        roomNumber: '101',
        alertType: 'Code Blue',
        urgencyLevel: 'critical',
        description: 'Test alert for push notifications',
      },
      organizationId: 'test-hospital',
    };

    const result = await notificationService.send(notification);
    
    console.log('Notification service result:', {
      success: result.success,
      channels: result.results.map(r => `${r.channel}: ${r.success ? '✅' : '❌'}`),
      errors: result.errors.map(e => e.message),
    });

    if (result.success) {
      console.log('✅ Notification sent successfully!\n');
    } else {
      console.log('❌ Notification failed\n');
    }

    // 5. Test batch notifications
    console.log('5. Testing batch notifications...');
    
    const batchNotifications = [
      {
        id: `batch-1-${Date.now()}`,
        type: NotificationType.ALERT_ESCALATED,
        recipient: { userId: testUser.id },
        priority: Priority.CRITICAL,
        data: {
          alertId: 'test-alert-456',
          roomNumber: '202',
          escalationLevel: 2,
        },
      },
      {
        id: `batch-2-${Date.now()}`,
        type: NotificationType.SHIFT_SUMMARY,
        recipient: { userId: testUser.id },
        priority: Priority.LOW,
        data: {
          shiftStart: new Date(Date.now() - 8 * 60 * 60 * 1000),
          shiftEnd: new Date(),
          statistics: {
            alertsHandled: 5,
            averageResponseTime: 120,
          },
        },
      },
    ];

    const batchResults = await notificationService.sendBatch(batchNotifications);
    
    console.log('Batch results:', batchResults.map((r, i) => ({
      notification: i + 1,
      success: r.success,
      channels: r.results.length,
    })));

    console.log('✅ Batch test completed\n');

    // 6. Clean up test token
    console.log('6. Cleaning up...');
    await db
      .delete(userDeviceTokens)
      .where(eq(userDeviceTokens.token, testToken));

    console.log('✅ Cleanup completed\n');
    console.log('🎉 All push notification tests completed!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the test
testPushNotifications();