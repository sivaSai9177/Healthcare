import { z } from 'zod';
import { log } from '@/lib/core/debug/logger';
import { db } from '@/src/db';
import { 
  notificationPreferences, 
  notificationLogs,
  notificationQueue,
  userDeviceTokens 
} from '@/src/db/notification-schema';
import { users } from '@/src/db/schema';
import { eq, and, or, lte } from 'drizzle-orm';
import { emailService } from './email-index';
import type { EmailOptions } from './email-mock';
import { smsService, SMSOptions } from './sms';
import { expoPushService } from './push-notifications';
import { generateUUID } from '@/lib/core/crypto';

// Notification types enum
export enum NotificationType {
  // Healthcare
  ALERT_CREATED = 'alert.created',
  ALERT_ESCALATED = 'alert.escalated',
  ALERT_ACKNOWLEDGED = 'alert.acknowledged',
  ALERT_RESOLVED = 'alert.resolved',
  SHIFT_SUMMARY = 'shift.summary',
  
  // Authentication
  AUTH_VERIFY_EMAIL = 'auth.verify_email',
  AUTH_RESET_PASSWORD = 'auth.reset_password',
  AUTH_MAGIC_LINK = 'auth.magic_link',
  AUTH_TWO_FACTOR = 'auth.two_factor',
  
  // Organization
  ORG_INVITATION = 'org.invitation',
  ORG_ROLE_CHANGE = 'org.role_change',
  ORG_MEMBER_REMOVED = 'org.member_removed',
  
  // System
  SYSTEM_MAINTENANCE = 'system.maintenance',
  SYSTEM_SECURITY = 'system.security',
}

export enum Priority {
  CRITICAL = 'critical',  // All channels, bypass preferences
  HIGH = 'high',         // Preferred channels, immediate
  MEDIUM = 'medium',     // Preferred channels, can batch
  LOW = 'low'           // Email only, can delay
}

export enum Channel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

// Validation schemas
const NotificationRecipientSchema = z.object({
  userId: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  pushTokens: z.array(z.string()).optional(),
  preferences: z.any().optional(), // Will be loaded from DB
});

const NotificationDataSchema = z.record(z.any());

const NotificationSchema = z.object({
  id: z.string().default(() => generateUUID()),
  type: z.nativeEnum(NotificationType),
  recipient: NotificationRecipientSchema,
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  channels: z.array(z.nativeEnum(Channel)).optional(),
  data: NotificationDataSchema,
  metadata: z.record(z.any()).optional(),
  organizationId: z.string().optional(),
  scheduledFor: z.date().optional(),
  expiresAt: z.date().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationRecipient = z.infer<typeof NotificationRecipientSchema>;

export interface NotificationResult {
  notificationId: string;
  results: ChannelResult[];
  errors: Error[];
  success: boolean;
}

export interface ChannelResult {
  channel: Channel;
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

interface UserPreferences {
  email: ChannelPreferences;
  sms: ChannelPreferences;
  push: ChannelPreferences;
  quietHours?: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
    timezone: string;
  };
  frequency?: {
    [key: string]: 'instant' | 'batch' | 'daily';
  };
}

interface ChannelPreferences {
  enabled: boolean;
  types: {
    [key: string]: boolean;
  };
}

// Channel configuration for different notification types
const CHANNEL_CONFIG: Record<NotificationType, {
  defaultChannels: Channel[];
  requiredData?: string[];
  ttl?: number; // Time to live in ms
}> = {
  // Healthcare - Critical alerts use all channels
  [NotificationType.ALERT_CREATED]: {
    defaultChannels: [Channel.PUSH, Channel.EMAIL, Channel.SMS],
    requiredData: ['alertId', 'roomNumber', 'alertType'],
    ttl: 3600000, // 1 hour
  },
  [NotificationType.ALERT_ESCALATED]: {
    defaultChannels: [Channel.PUSH, Channel.EMAIL, Channel.SMS],
    requiredData: ['alertId', 'escalationLevel'],
    ttl: 1800000, // 30 minutes
  },
  [NotificationType.ALERT_ACKNOWLEDGED]: {
    defaultChannels: [Channel.PUSH, Channel.IN_APP],
    requiredData: ['alertId', 'acknowledgedBy'],
  },
  [NotificationType.ALERT_RESOLVED]: {
    defaultChannels: [Channel.IN_APP],
    requiredData: ['alertId', 'resolvedBy'],
  },
  [NotificationType.SHIFT_SUMMARY]: {
    defaultChannels: [Channel.EMAIL],
    requiredData: ['shiftStart', 'shiftEnd', 'statistics'],
  },
  
  // Authentication - Email required
  [NotificationType.AUTH_VERIFY_EMAIL]: {
    defaultChannels: [Channel.EMAIL],
    requiredData: ['verificationUrl', 'token'],
    ttl: 86400000, // 24 hours
  },
  [NotificationType.AUTH_RESET_PASSWORD]: {
    defaultChannels: [Channel.EMAIL],
    requiredData: ['resetUrl', 'token'],
    ttl: 3600000, // 1 hour
  },
  [NotificationType.AUTH_MAGIC_LINK]: {
    defaultChannels: [Channel.EMAIL],
    requiredData: ['magicLink'],
    ttl: 900000, // 15 minutes
  },
  [NotificationType.AUTH_TWO_FACTOR]: {
    defaultChannels: [Channel.EMAIL, Channel.SMS],
    requiredData: ['code'],
    ttl: 300000, // 5 minutes
  },
  
  // Organization
  [NotificationType.ORG_INVITATION]: {
    defaultChannels: [Channel.EMAIL],
    requiredData: ['invitationUrl', 'organizationName', 'inviterName'],
    ttl: 604800000, // 7 days
  },
  [NotificationType.ORG_ROLE_CHANGE]: {
    defaultChannels: [Channel.EMAIL, Channel.PUSH],
    requiredData: ['oldRole', 'newRole', 'changedBy'],
  },
  [NotificationType.ORG_MEMBER_REMOVED]: {
    defaultChannels: [Channel.EMAIL],
    requiredData: ['organizationName', 'reason'],
  },
  
  // System
  [NotificationType.SYSTEM_MAINTENANCE]: {
    defaultChannels: [Channel.EMAIL, Channel.PUSH],
    requiredData: ['maintenanceStart', 'maintenanceEnd'],
  },
  [NotificationType.SYSTEM_SECURITY]: {
    defaultChannels: [Channel.EMAIL, Channel.SMS],
    requiredData: ['securityEvent', 'action'],
  },
};

class NotificationService {
  private batchQueue: Map<string, Notification[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout | number> = new Map();
  private readonly BATCH_DELAY = 60000; // 1 minute

  constructor() {
    // Process queued notifications periodically
    this.startQueueProcessor();
  }

  // Main send method
  async send(notification: Notification): Promise<NotificationResult> {
    const startTime = Date.now();
    
    try {
      // Validate notification
      const validated = NotificationSchema.parse(notification);
      
      // Check if notification is expired
      if (validated.expiresAt && validated.expiresAt < new Date()) {
        throw new Error('Notification has expired');
      }
      
      // Load user preferences and contact info
      const recipient = await this.enrichRecipient(validated.recipient);
      validated.recipient = recipient;
      
      // Determine channels to use
      const channels = await this.determineChannels(validated);
      
      // Check if should batch
      if (this.shouldBatch(validated)) {
        return await this.addToBatch(validated);
      }
      
      // Send immediately
      const result = await this.sendImmediate(validated, channels);
      
      // Log performance
      log.info('Notification sent', 'NOTIFICATION', {
        notificationId: validated.id,
        type: validated.type,
        channels: channels,
        duration: Date.now() - startTime,
      });
      
      return result;
    } catch (error) {
      log.error('Failed to send notification', 'NOTIFICATION', error);
      
      // Add to retry queue if critical
      if (notification.priority === Priority.CRITICAL) {
        await this.addToRetryQueue(notification, error);
      }
      
      return {
        notificationId: notification.id || 'unknown',
        results: [],
        errors: [error as Error],
        success: false,
      };
    }
  }

  // Send multiple notifications
  async sendBatch(notifications: Notification[]): Promise<NotificationResult[]> {
    // Group by recipient for efficiency
    const grouped = this.groupByRecipient(notifications);
    const results: NotificationResult[] = [];
    
    for (const [userId, userNotifications] of grouped) {
      // Process user's notifications
      for (const notification of userNotifications) {
        const result = await this.send(notification);
        results.push(result);
      }
      
      // Small delay between users
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return results;
  }

  // Enrich recipient with database info
  private async enrichRecipient(recipient: NotificationRecipient): Promise<NotificationRecipient> {
    try {
      // Get user details
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, recipient.userId))
        .limit(1);
      
      if (!user) {
        throw new Error(`User not found: ${recipient.userId}`);
      }
      
      // Get user preferences
      const preferences = await this.getUserPreferences(recipient.userId);
      
      // Get push tokens
      const tokens = await db
        .select({
          token: userDeviceTokens.token,
          platform: userDeviceTokens.platform,
        })
        .from(userDeviceTokens)
        .where(
          and(
            eq(userDeviceTokens.userId, recipient.userId),
            eq(userDeviceTokens.active, true)
          )
        );
      
      return {
        ...recipient,
        email: recipient.email || user.email || undefined,
        pushTokens: tokens.map(t => t.token),
        preferences,
      };
    } catch (error) {
      log.error('Failed to enrich recipient', 'NOTIFICATION', error);
      return recipient;
    }
  }

  // Get user notification preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const prefs = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
      
      if (prefs.length === 0) {
        return null; // Use defaults
      }
      
      // Build preferences object
      const preferences: UserPreferences = {
        email: { enabled: true, types: {} },
        sms: { enabled: true, types: {} },
        push: { enabled: true, types: {} },
      };
      
      for (const pref of prefs) {
        const channel = pref.channel as keyof UserPreferences;
        if (channel in preferences) {
          preferences[channel].enabled = preferences[channel].enabled && pref.enabled;
          preferences[channel].types[pref.notificationType] = pref.enabled;
        }
      }
      
      // Check for quiet hours
      const quietHoursPref = prefs.find(p => p.quietHoursStart && p.quietHoursEnd);
      if (quietHoursPref && quietHoursPref.quietHoursStart && quietHoursPref.quietHoursEnd) {
        preferences.quietHours = {
          enabled: true,
          start: quietHoursPref.quietHoursStart.toISOString(),
          end: quietHoursPref.quietHoursEnd.toISOString(),
          timezone: quietHoursPref.timezone || 'UTC',
        };
      }
      
      return preferences;
    } catch (error) {
      log.error('Failed to get user preferences', 'NOTIFICATION', error);
      return null;
    }
  }

  // Update user preferences
  async updateUserPreferences(
    userId: string, 
    channel: Channel, 
    type: NotificationType, 
    enabled: boolean
  ): Promise<void> {
    try {
      await db
        .insert(notificationPreferences)
        .values({
          userId,
          channel,
          notificationType: type,
          enabled,
        })
        .onConflictDoUpdate({
          target: [
            notificationPreferences.userId,
            notificationPreferences.channel,
            notificationPreferences.notificationType,
          ],
          set: {
            enabled,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      log.error('Failed to update user preferences', 'NOTIFICATION', error);
      throw error;
    }
  }

  // Determine which channels to use
  private async determineChannels(notification: Notification): Promise<Channel[]> {
    // If channels explicitly specified, use those
    if (notification.channels && notification.channels.length > 0) {
      return notification.channels;
    }
    
    const config = CHANNEL_CONFIG[notification.type];
    const defaultChannels = config?.defaultChannels || [Channel.EMAIL];
    
    // Critical notifications use all available channels
    if (notification.priority === Priority.CRITICAL) {
      const availableChannels: Channel[] = [];
      
      if (notification.recipient.email) {
        availableChannels.push(Channel.EMAIL);
      }
      if (notification.recipient.phone && smsService.isConfigured()) {
        availableChannels.push(Channel.SMS);
      }
      if (notification.recipient.pushTokens && notification.recipient.pushTokens.length > 0) {
        availableChannels.push(Channel.PUSH);
      }
      
      return availableChannels.length > 0 ? availableChannels : defaultChannels;
    }
    
    // Check user preferences
    const prefs = notification.recipient.preferences as UserPreferences | null;
    if (!prefs) {
      return defaultChannels;
    }
    
    // Check quiet hours
    if (this.isInQuietHours(prefs.quietHours)) {
      // Only critical notifications during quiet hours
      if (notification.priority !== Priority.HIGH) {
        return []; // Defer to later
      }
    }
    
    // Filter channels based on preferences
    const enabledChannels = defaultChannels.filter(channel => {
      const channelPrefs = prefs[channel as keyof UserPreferences];
      if (typeof channelPrefs === 'object' && 'enabled' in channelPrefs) {
        return channelPrefs.enabled && 
               (channelPrefs.types[notification.type] !== false);
      }
      return true;
    });
    
    // Ensure at least one channel for important notifications
    if (enabledChannels.length === 0 && notification.priority >= Priority.HIGH) {
      if (notification.recipient.email) {
        return [Channel.EMAIL];
      }
    }
    
    return enabledChannels;
  }

  // Check if current time is in quiet hours
  private isInQuietHours(quietHours?: UserPreferences['quietHours']): boolean {
    if (!quietHours?.enabled) return false;
    
    try {
      const now = new Date();
      const start = new Date(`1970-01-01T${quietHours.start}:00`);
      const end = new Date(`1970-01-01T${quietHours.end}:00`);
      const currentTime = new Date(`1970-01-01T${now.toTimeString().slice(0, 5)}:00`);
      
      if (start <= end) {
        return currentTime >= start && currentTime <= end;
      } else {
        // Spans midnight
        return currentTime >= start || currentTime <= end;
      }
    } catch {
      return false;
    }
  }

  // Check if notification should be batched
  private shouldBatch(notification: Notification): boolean {
    // Never batch critical notifications
    if (notification.priority === Priority.CRITICAL || notification.priority === Priority.HIGH) {
      return false;
    }
    
    // Check user frequency preference
    const prefs = notification.recipient.preferences as UserPreferences | null;
    if (prefs?.frequency?.[notification.type] === 'batch') {
      return true;
    }
    
    // Batch low priority notifications
    return notification.priority === Priority.LOW;
  }

  // Add notification to batch queue
  private async addToBatch(notification: Notification): Promise<NotificationResult> {
    const batchKey = `${notification.recipient.userId}:${notification.type}`;
    
    if (!this.batchQueue.has(batchKey)) {
      this.batchQueue.set(batchKey, []);
      
      // Set timer to send batch
      const timer = setTimeout(() => {
        this.sendBatchedNotifications(batchKey);
      }, this.BATCH_DELAY);
      
      this.batchTimers.set(batchKey, timer);
    }
    
    this.batchQueue.get(batchKey)!.push(notification);
    
    return {
      notificationId: notification.id,
      results: [{
        channel: Channel.EMAIL,
        success: true,
        messageId: `batched-${notification.id}`,
        timestamp: new Date(),
      }],
      errors: [],
      success: true,
    };
  }

  // Send batched notifications
  private async sendBatchedNotifications(batchKey: string): Promise<void> {
    const notifications = this.batchQueue.get(batchKey);
    if (!notifications || notifications.length === 0) return;
    
    try {
      // Merge notifications into summary
      const summary = this.createBatchSummary(notifications);
      
      // Send as single notification
      await this.sendImmediate(summary, [Channel.EMAIL]);
      
      // Mark all as sent
      for (const notification of notifications) {
        await this.logNotification(notification, [{
          channel: Channel.EMAIL,
          success: true,
          messageId: `batch-${batchKey}`,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      log.error('Failed to send batched notifications', 'NOTIFICATION', error);
    } finally {
      // Clean up
      this.batchQueue.delete(batchKey);
      const timer = this.batchTimers.get(batchKey);
      if (timer) {
        clearTimeout(timer as any);
        this.batchTimers.delete(batchKey);
      }
    }
  }

  // Create summary of batched notifications
  private createBatchSummary(notifications: Notification[]): Notification {
    const first = notifications[0];
    
    return {
      id: `batch-${Date.now()}`,
      type: first.type,
      recipient: first.recipient,
      priority: Priority.LOW,
      channels: [Channel.EMAIL],
      data: {
        notifications: notifications.map(n => n.data),
        count: notifications.length,
        summary: true,
      },
      metadata: {
        batchedAt: new Date(),
        originalIds: notifications.map(n => n.id),
      },
    };
  }

  // Send notification immediately
  private async sendImmediate(
    notification: Notification, 
    channels: Channel[]
  ): Promise<NotificationResult> {
    const results: ChannelResult[] = [];
    const errors: Error[] = [];
    
    // Send to each channel
    for (const channel of channels) {
      try {
        const result = await this.sendViaChannel(channel, notification);
        results.push(result);
        
        // If one channel succeeds for critical, that's enough
        if (notification.priority === Priority.CRITICAL && result.success) {
          break;
        }
      } catch (error) {
        errors.push(error as Error);
        log.error(`Failed to send via ${channel}`, 'NOTIFICATION', error);
        
        // Try fallback channel
        const fallback = this.getFallbackChannel(channel, notification);
        if (fallback && !channels.includes(fallback)) {
          try {
            const fallbackResult = await this.sendViaChannel(fallback, notification);
            results.push(fallbackResult);
          } catch (fallbackError) {
            errors.push(fallbackError as Error);
          }
        }
      }
    }
    
    // Log notification
    await this.logNotification(notification, results);
    
    return {
      notificationId: notification.id,
      results,
      errors,
      success: results.some(r => r.success),
    };
  }

  // Send via specific channel
  private async sendViaChannel(
    channel: Channel, 
    notification: Notification
  ): Promise<ChannelResult> {
    const startTime = Date.now();
    
    try {
      switch (channel) {
        case Channel.EMAIL:
          return await this.sendEmail(notification);
          
        case Channel.SMS:
          return await this.sendSMS(notification);
          
        case Channel.PUSH:
          return await this.sendPush(notification);
          
        case Channel.IN_APP:
          return await this.sendInApp(notification);
          
        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }
    } finally {
      log.debug(`Channel ${channel} took ${Date.now() - startTime}ms`, 'NOTIFICATION');
    }
  }

  // Send email notification
  private async sendEmail(notification: Notification): Promise<ChannelResult> {
    if (!notification.recipient.email) {
      throw new Error('Recipient email not available');
    }
    
    const emailOptions: EmailOptions = {
      to: notification.recipient.email,
      subject: this.getSubject(notification),
      template: this.getEmailTemplate(notification.type),
      data: notification.data,
      priority: notification.priority === Priority.CRITICAL ? 'high' : 
                notification.priority === Priority.LOW ? 'low' : 'normal',
      userId: notification.recipient.userId,
      organizationId: notification.organizationId,
      notificationType: notification.type,
      metadata: notification.metadata,
    };
    
    const result = await emailService.send(emailOptions);
    
    return {
      channel: Channel.EMAIL,
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      timestamp: result.timestamp,
    };
  }

  // Send SMS notification
  private async sendSMS(notification: Notification): Promise<ChannelResult> {
    if (!notification.recipient.phone) {
      throw new Error('Recipient phone not available');
    }
    
    if (!smsService.isConfigured()) {
      throw new Error('SMS service not configured');
    }
    
    const message = this.getSMSMessage(notification);
    
    const smsOptions: SMSOptions = {
      to: notification.recipient.phone,
      message,
      priority: notification.priority === Priority.CRITICAL ? 'high' : 'normal',
      userId: notification.recipient.userId,
      organizationId: notification.organizationId,
      notificationType: notification.type,
      metadata: notification.metadata,
    };
    
    const result = await smsService.send(smsOptions);
    
    return {
      channel: Channel.SMS,
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      timestamp: result.timestamp,
    };
  }

  // Send push notification
  private async sendPush(notification: Notification): Promise<ChannelResult> {
    if (!notification.recipient.pushTokens || notification.recipient.pushTokens.length === 0) {
      throw new Error('No push tokens available');
    }
    
    try {
      const title = this.getPushTitle(notification);
      const body = this.getPushBody(notification);
      
      // Send via Expo push service
      const result = await expoPushService.send({
        to: notification.recipient.pushTokens,
        title,
        body,
        data: {
          ...notification.data,
          notificationId: notification.id,
          type: notification.type,
        },
        priority: notification.priority === Priority.CRITICAL ? 'high' : 'default',
        sound: 'default',
        badge: notification.type === NotificationType.ALERT_CREATED ? 1 : undefined,
        categoryId: this.getCategoryId(notification.type),
        ttl: CHANNEL_CONFIG[notification.type]?.ttl,
      });
      
      return {
        channel: Channel.PUSH,
        success: result.success,
        messageId: notification.id,
        error: result.errors.length > 0 ? result.errors[0].message : undefined,
        timestamp: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  // Get category ID for interactive notifications
  private getCategoryId(type: NotificationType): string | undefined {
    const categoryMap: Record<NotificationType, string> = {
      [NotificationType.ALERT_CREATED]: 'alert',
      [NotificationType.ALERT_ESCALATED]: 'alert',
      [NotificationType.ORG_INVITATION]: 'invitation',
      // Add more as needed
    } as any;
    
    return categoryMap[type];
  }

  // Send in-app notification
  private async sendInApp(notification: Notification): Promise<ChannelResult> {
    // In-app notifications are handled by WebSocket/real-time system
    // This is a placeholder for the integration
    
    try {
      // Emit event via WebSocket
      const { alertEventHelpers } = await import('./alert-subscriptions');
      
      if (notification.type === NotificationType.ALERT_CREATED && notification.data.alertId) {
        await alertEventHelpers.emitAlertCreated({
          id: notification.data.alertId,
          hospitalId: notification.organizationId,
          ...notification.data,
        });
      }
      
      return {
        channel: Channel.IN_APP,
        success: true,
        messageId: notification.id,
        timestamp: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  // Get email template name
  private getEmailTemplate(type: NotificationType): string {
    const templateMap: Record<NotificationType, string> = {
      [NotificationType.ALERT_CREATED]: 'healthcare.alert',
      [NotificationType.ALERT_ESCALATED]: 'healthcare.escalation',
      [NotificationType.SHIFT_SUMMARY]: 'healthcare.shift-summary',
      [NotificationType.AUTH_VERIFY_EMAIL]: 'auth.verify',
      [NotificationType.AUTH_RESET_PASSWORD]: 'auth.reset',
      [NotificationType.AUTH_MAGIC_LINK]: 'auth.magic-link',
      [NotificationType.ORG_INVITATION]: 'org.invitation',
      [NotificationType.ORG_ROLE_CHANGE]: 'org.role-change',
      // Default
      [NotificationType.ALERT_ACKNOWLEDGED]: 'general',
      [NotificationType.ALERT_RESOLVED]: 'general',
      [NotificationType.AUTH_TWO_FACTOR]: 'general',
      [NotificationType.ORG_MEMBER_REMOVED]: 'general',
      [NotificationType.SYSTEM_MAINTENANCE]: 'general',
      [NotificationType.SYSTEM_SECURITY]: 'general',
    };
    
    return templateMap[type] || 'general';
  }

  // Get notification subject
  private getSubject(notification: Notification): string {
    const subjectMap: Record<NotificationType, string> = {
      [NotificationType.ALERT_CREATED]: `🚨 Alert: Room ${notification.data.roomNumber}`,
      [NotificationType.ALERT_ESCALATED]: `⚠️ Alert Escalated: Room ${notification.data.roomNumber}`,
      [NotificationType.ALERT_ACKNOWLEDGED]: `✅ Alert Acknowledged`,
      [NotificationType.ALERT_RESOLVED]: `✓ Alert Resolved`,
      [NotificationType.SHIFT_SUMMARY]: `📊 Shift Summary`,
      [NotificationType.AUTH_VERIFY_EMAIL]: `Verify your email`,
      [NotificationType.AUTH_RESET_PASSWORD]: `Reset your password`,
      [NotificationType.AUTH_MAGIC_LINK]: `Your login link`,
      [NotificationType.AUTH_TWO_FACTOR]: `Your verification code`,
      [NotificationType.ORG_INVITATION]: `Invitation to join ${notification.data.organizationName}`,
      [NotificationType.ORG_ROLE_CHANGE]: `Your role has been updated`,
      [NotificationType.ORG_MEMBER_REMOVED]: `Organization membership update`,
      [NotificationType.SYSTEM_MAINTENANCE]: `Scheduled maintenance`,
      [NotificationType.SYSTEM_SECURITY]: `Security alert`,
    };
    
    return subjectMap[notification.type] || 'Notification';
  }

  // Get SMS message
  private getSMSMessage(notification: Notification): string {
    const messageMap: Record<NotificationType, (data: any) => string> = {
      [NotificationType.ALERT_CREATED]: (data) => 
        `ALERT: Room ${data.roomNumber} - ${data.alertType}. Respond at app.`,
      [NotificationType.ALERT_ESCALATED]: (data) => 
        `URGENT: Alert escalated to Level ${data.escalationLevel}. Room ${data.roomNumber}`,
      [NotificationType.AUTH_TWO_FACTOR]: (data) => 
        `Your verification code: ${data.code}. Valid for 5 minutes.`,
      [NotificationType.SYSTEM_SECURITY]: (data) =>
        `Security Alert: ${data.securityEvent}. Action required: ${data.action}`,
      // Add more as needed
    } as any;
    
    const getMessage = messageMap[notification.type];
    if (getMessage) {
      return getMessage(notification.data);
    }
    
    return `You have a new ${notification.type} notification. Check the app for details.`;
  }

  // Get push notification title
  private getPushTitle(notification: Notification): string {
    const titleMap: Record<NotificationType, string> = {
      [NotificationType.ALERT_CREATED]: '🚨 New Alert',
      [NotificationType.ALERT_ESCALATED]: '⚠️ Alert Escalated',
      [NotificationType.ALERT_ACKNOWLEDGED]: 'Alert Acknowledged',
      [NotificationType.ALERT_RESOLVED]: 'Alert Resolved',
      [NotificationType.AUTH_VERIFY_EMAIL]: 'Verify Email',
      [NotificationType.ORG_INVITATION]: 'New Invitation',
      [NotificationType.ORG_ROLE_CHANGE]: 'Role Updated',
      [NotificationType.SYSTEM_MAINTENANCE]: 'Maintenance Notice',
      [NotificationType.SYSTEM_SECURITY]: 'Security Alert',
      // Defaults
      [NotificationType.SHIFT_SUMMARY]: 'Shift Summary',
      [NotificationType.AUTH_RESET_PASSWORD]: 'Password Reset',
      [NotificationType.AUTH_MAGIC_LINK]: 'Login Link',
      [NotificationType.AUTH_TWO_FACTOR]: 'Verification Code',
      [NotificationType.ORG_MEMBER_REMOVED]: 'Membership Update',
    };
    
    return titleMap[notification.type] || 'Notification';
  }

  // Get push notification body
  private getPushBody(notification: Notification): string {
    const bodyMap: Record<NotificationType, (data: any) => string> = {
      [NotificationType.ALERT_CREATED]: (data) =>
        `Room ${data.roomNumber}: ${data.alertType}`,
      [NotificationType.ALERT_ESCALATED]: (data) =>
        `Alert in room ${data.roomNumber} escalated to level ${data.escalationLevel}`,
      [NotificationType.ORG_INVITATION]: (data) =>
        `${data.inviterName} invited you to join ${data.organizationName}`,
      [NotificationType.ORG_ROLE_CHANGE]: (data) =>
        `Your role changed from ${data.oldRole} to ${data.newRole}`,
      // Add more as needed
    } as any;
    
    const getBody = bodyMap[notification.type];
    if (getBody) {
      return getBody(notification.data);
    }
    
    return 'Tap to view details';
  }

  // Get fallback channel
  private getFallbackChannel(failedChannel: Channel, notification: Notification): Channel | null {
    // Fallback strategy
    const fallbackMap: Record<Channel, Channel | null> = {
      [Channel.SMS]: Channel.EMAIL,
      [Channel.PUSH]: Channel.EMAIL,
      [Channel.EMAIL]: null, // No fallback for email
      [Channel.IN_APP]: Channel.PUSH,
    };
    
    return fallbackMap[failedChannel];
  }

  // Log notification
  private async logNotification(
    notification: Notification, 
    results: ChannelResult[]
  ): Promise<void> {
    try {
      for (const result of results) {
        await db.insert(notificationLogs).values({
          notificationId: notification.id,
          userId: notification.recipient.userId,
          organizationId: notification.organizationId,
          channel: result.channel,
          type: notification.type,
          status: result.success ? 'sent' : 'failed',
          sentAt: result.success ? result.timestamp : null,
          failedAt: result.success ? null : result.timestamp,
          error: result.error,
          metadata: {
            messageId: result.messageId,
            priority: notification.priority,
            ...notification.metadata,
          },
        });
      }
    } catch (error) {
      log.error('Failed to log notification', 'NOTIFICATION', error);
    }
  }

  // Add to retry queue
  private async addToRetryQueue(notification: Notification, error: any): Promise<void> {
    try {
      await db.insert(notificationQueue).values({
        userId: notification.recipient.userId,
        channel: notification.channels?.[0] || Channel.EMAIL,
        type: notification.type,
        priority: notification.priority,
        scheduledFor: notification.scheduledFor,
        payload: notification as any,
        error: error?.message || 'Unknown error',
        status: 'pending',
        nextAttemptAt: new Date(Date.now() + 60000), // Retry in 1 minute
      });
    } catch (error) {
      log.error('Failed to add to retry queue', 'NOTIFICATION', error);
    }
  }

  // Process notification queue
  private async startQueueProcessor(): Promise<void> {
    setInterval(async () => {
      try {
        // Get pending notifications
        const pending = await db
          .select()
          .from(notificationQueue)
          .where(
            and(
              eq(notificationQueue.status, 'pending'),
              or(
                lte(notificationQueue.nextAttemptAt, new Date()),
                lte(notificationQueue.scheduledFor, new Date())
              )
            )
          )
          .limit(10);
        
        for (const item of pending) {
          try {
            // Update status
            await db
              .update(notificationQueue)
              .set({ status: 'processing' })
              .where(eq(notificationQueue.id, item.id));
            
            // Send notification
            const notification = item.payload as Notification;
            const result = await this.send(notification);
            
            if (result.success) {
              // Mark as completed
              await db
                .update(notificationQueue)
                .set({
                  status: 'completed',
                  processedAt: new Date(),
                })
                .where(eq(notificationQueue.id, item.id));
            } else {
              // Update retry
              const attempts = parseInt(item.attempts || '0') + 1;
              const maxAttempts = parseInt(item.maxAttempts || '3');
              
              if (attempts >= maxAttempts) {
                await db
                  .update(notificationQueue)
                  .set({
                    status: 'failed',
                    attempts: attempts.toString(),
                  })
                  .where(eq(notificationQueue.id, item.id));
              } else {
                await db
                  .update(notificationQueue)
                  .set({
                    status: 'pending',
                    attempts: attempts.toString(),
                    lastAttemptAt: new Date(),
                    nextAttemptAt: new Date(Date.now() + Math.pow(2, attempts) * 60000),
                  })
                  .where(eq(notificationQueue.id, item.id));
              }
            }
          } catch (error) {
            log.error('Failed to process queued notification', 'NOTIFICATION', error);
          }
        }
      } catch (error) {
        log.error('Queue processor error', 'NOTIFICATION', error);
      }
    }, 30000); // Every 30 seconds
  }

  // Group notifications by recipient
  private groupByRecipient(notifications: Notification[]): Map<string, Notification[]> {
    const grouped = new Map<string, Notification[]>();
    
    for (const notification of notifications) {
      const userId = notification.recipient.userId;
      if (!grouped.has(userId)) {
        grouped.set(userId, []);
      }
      grouped.get(userId)!.push(notification);
    }
    
    return grouped;
  }

  // Get notification statistics
  async getStats(timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      // This would be implemented with proper aggregation queries
      return {
        sent: 0,
        delivered: 0,
        failed: 0,
        pending: 0,
        byChannel: {},
        byType: {},
      };
    } catch (error) {
      log.error('Failed to get notification stats', 'NOTIFICATION', error);
      return null;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types
export type { NotificationService };