import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import { log } from '@/lib/core/debug/logger';
import { db } from '@/src/db';
import { userDeviceTokens } from '@/src/db/notification-schema';
import { eq, and, inArray } from 'drizzle-orm';

// Create a new Expo SDK client
const expo = new Expo({
  maxConcurrentRequests: 10,
  retryMinTimeout: 1000,
});

export interface PushNotificationOptions {
  to: string | string[];
  title: string;
  body: string;
  data?: any;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  categoryId?: string;
  channelId?: string;
  ttl?: number;
}

export interface PushNotificationResult {
  success: boolean;
  tickets: ExpoPushTicket[];
  errors: Error[];
}

class ExpoPushNotificationService {
  /**
   * Send push notifications to one or more devices
   */
  async send(options: PushNotificationOptions): Promise<PushNotificationResult> {
    const tokens = Array.isArray(options.to) ? options.to : [options.to];
    const messages: ExpoPushMessage[] = [];
    const errors: Error[] = [];

    // Validate tokens and create messages
    for (const token of tokens) {
      if (!Expo.isExpoPushToken(token)) {
        log.warn('Invalid Expo push token', 'PUSH', { token: String(token).substring(0, 10) + '...' });
        errors.push(new Error(`Invalid push token: ${token}`));
        continue;
      }

      messages.push({
        to: token,
        title: options.title,
        body: options.body,
        data: options.data,
        sound: options.sound !== null ? options.sound : 'default',
        badge: options.badge,
        priority: options.priority || 'high',
        categoryId: options.categoryId,
        channelId: options.channelId || 'default',
        ttl: options.ttl,
      });
    }

    if (messages.length === 0) {
      return {
        success: false,
        tickets: [],
        errors: errors.length > 0 ? errors : [new Error('No valid tokens provided')],
      };
    }

    try {
      // Send notifications in chunks
      const chunks = expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          log.error('Failed to send notification chunk', 'PUSH', error);
          errors.push(error as Error);
        }
      }

      // Process tickets and mark invalid tokens
      await this.processTickets(tickets, tokens);

      return {
        success: tickets.some(ticket => ticket.status === 'ok'),
        tickets,
        errors,
      };
    } catch (error) {
      log.error('Failed to send push notifications', 'PUSH', error);
      return {
        success: false,
        tickets: [],
        errors: [error as Error],
      };
    }
  }

  /**
   * Send notifications to all active tokens for a user
   */
  async sendToUser(userId: string, options: Omit<PushNotificationOptions, 'to'>): Promise<PushNotificationResult> {
    try {
      // Get active tokens for user
      const tokens = await db
        .select({
          token: userDeviceTokens.token,
        })
        .from(userDeviceTokens)
        .where(
          and(
            eq(userDeviceTokens.userId, userId),
            eq(userDeviceTokens.active, true)
          )
        );

      if (tokens.length === 0) {
        return {
          success: false,
          tickets: [],
          errors: [new Error('No active push tokens for user')],
        };
      }

      return this.send({
        ...options,
        to: tokens.map(t => t.token),
      });
    } catch (error) {
      log.error('Failed to send push notification to user', 'PUSH', error);
      return {
        success: false,
        tickets: [],
        errors: [error as Error],
      };
    }
  }

  /**
   * Send notifications to multiple users
   */
  async sendToUsers(userIds: string[], options: Omit<PushNotificationOptions, 'to'>): Promise<PushNotificationResult> {
    try {
      // Get active tokens for all users
      const tokens = await db
        .select({
          token: userDeviceTokens.token,
          userId: userDeviceTokens.userId,
        })
        .from(userDeviceTokens)
        .where(
          and(
            inArray(userDeviceTokens.userId, userIds),
            eq(userDeviceTokens.active, true)
          )
        );

      if (tokens.length === 0) {
        return {
          success: false,
          tickets: [],
          errors: [new Error('No active push tokens for users')],
        };
      }

      log.info('Sending push notifications to users', 'PUSH', {
        userCount: userIds.length,
        tokenCount: tokens.length,
      });

      return this.send({
        ...options,
        to: tokens.map(t => t.token),
      });
    } catch (error) {
      log.error('Failed to send push notifications to users', 'PUSH', error);
      return {
        success: false,
        tickets: [],
        errors: [error as Error],
      };
    }
  }

  /**
   * Process notification tickets and handle errors
   */
  private async processTickets(tickets: ExpoPushTicket[], tokens: string[]): Promise<void> {
    try {
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const token = tokens[i];

        if (ticket.status === 'error') {
          log.error('Push notification error', 'PUSH', {
            token: token.substring(0, 10) + '...',
            error: ticket.message,
            details: ticket.details,
          });

          // Mark token as inactive if it's invalid
          if (ticket.details?.error === 'DeviceNotRegistered') {
            await this.markTokenInactive(token);
          }
        }
      }
    } catch (error) {
      log.error('Failed to process notification tickets', 'PUSH', error);
    }
  }

  /**
   * Mark a token as inactive
   */
  private async markTokenInactive(token: string): Promise<void> {
    try {
      await db
        .update(userDeviceTokens)
        .set({
          active: false,
          updatedAt: new Date(),
        })
        .where(eq(userDeviceTokens.token, token));

      log.info('Marked push token as inactive', 'PUSH', {
        token: token.substring(0, 10) + '...',
      });
    } catch (error) {
      log.error('Failed to mark token as inactive', 'PUSH', error);
    }
  }

  /**
   * Get push receipt for a ticket ID
   */
  async getReceipts(ticketIds: string[]): Promise<{ [id: string]: ExpoPushReceipt }> {
    try {
      const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);
      const receipts: { [id: string]: ExpoPushReceipt } = {};

      for (const chunk of receiptIdChunks) {
        try {
          const chunkReceipts = await expo.getPushNotificationReceiptsAsync(chunk);
          Object.assign(receipts, chunkReceipts);
        } catch (error) {
          log.error('Failed to get receipt chunk', 'PUSH', error);
        }
      }

      return receipts;
    } catch (error) {
      log.error('Failed to get push receipts', 'PUSH', error);
      return {};
    }
  }
}

// Export singleton instance
export const expoPushService = new ExpoPushNotificationService();
export const pushService = expoPushService; // Alias for compatibility

// Export function for queue worker compatibility
export const sendPushNotification = async (userId: string, notification: {
  title: string;
  body: string;
  data?: any;
}) => {
  // In a real app, you'd fetch user's push tokens from database
  // For now, this is a placeholder
  log.warn('sendPushNotification called but user tokens not implemented', 'PUSH', { userId });
  return {
    success: false,
    error: 'User push tokens not implemented',
  };
};