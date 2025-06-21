#!/usr/bin/env bun
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { userDeviceTokens } from '@/src/db/notification-schema';
import { notificationService, NotificationType, Priority } from '@/src/server/services/notifications';
import { expoPushService } from '@/src/server/services/push-notifications';
import { eq } from 'drizzle-orm';

async function testPushNotifications() {

  try {
    // 1. Get a test user

    const [testUser] = await db
      .select()
      .from(users)
      .where(eq(users.role, 'doctor'))
      .limit(1);

    if (!testUser) {
      console.error('❌ No doctor user found. Please run healthcare setup first.');
      process.exit(1);
    }

    // 2. Add a test push token (Expo push token format)

    const testToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'; // This is a test token
    
    await db.insert(userDeviceTokens).values({
      userId: testUser.id,
      token: testToken,
      platform: 'ios',
      deviceName: 'Test iPhone',
      active: true,
    }).onConflictDoNothing();

    // 3. Test direct push service

    const directResult = await expoPushService.sendToUser(testUser.id, {
      title: '🧪 Test Direct Push',
      body: 'This is a direct push notification test',
      data: { test: true, timestamp: Date.now() },
    });

    // 4. Test notification service (full flow)

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

    if (result.success) {

    } else {

    }

    // 5. Test batch notifications

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

    // 6. Clean up test token

    await db
      .delete(userDeviceTokens)
      .where(eq(userDeviceTokens.token, testToken));

  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the test
testPushNotifications();