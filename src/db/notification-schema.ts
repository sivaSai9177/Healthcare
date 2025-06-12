import { pgTable, text, timestamp, boolean, uuid, json, index, unique } from 'drizzle-orm/pg-core';
import { users } from './schema';

// User notification preferences
export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  channel: text('channel').notNull(), // email, sms, push
  notificationType: text('notification_type').notNull(), // alert.created, auth.verify, etc.
  enabled: boolean('enabled').notNull().default(true),
  quietHoursStart: timestamp('quiet_hours_start'),
  quietHoursEnd: timestamp('quiet_hours_end'),
  timezone: text('timezone').default('UTC'),
  frequency: text('frequency').default('instant'), // instant, batch, daily
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  userChannelTypeUnique: unique().on(table.userId, table.channel, table.notificationType),
  userIdIdx: index('idx_notification_preferences_user_id').on(table.userId),
}));

// Notification delivery logs
export const notificationLogs = pgTable('notification_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  notificationId: text('notification_id').notNull(),
  userId: text('user_id').references(() => users.id),
  organizationId: text('organization_id'),
  channel: text('channel').notNull(), // email, sms, push, in_app
  type: text('type').notNull(), // notification type
  status: text('status').notNull().default('pending'), // pending, sent, delivered, failed, bounced
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  failedAt: timestamp('failed_at'),
  readAt: timestamp('read_at'),
  error: text('error'),
  metadata: json('metadata'), // Additional data like messageId, subject, etc.
  retryCount: text('retry_count').default('0'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  userIdIdx: index('idx_notification_logs_user_id').on(table.userId),
  statusIdx: index('idx_notification_logs_status').on(table.status),
  createdAtIdx: index('idx_notification_logs_created_at').on(table.createdAt),
  channelTypeIdx: index('idx_notification_logs_channel_type').on(table.channel, table.type),
}));

// Email verification tokens (for Better Auth integration)
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  email: text('email').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  tokenIdx: index('idx_email_verification_token').on(table.token),
  userIdIdx: index('idx_email_verification_user_id').on(table.userId),
}));

// Password reset tokens
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  tokenIdx: index('idx_password_reset_token').on(table.token),
  userIdIdx: index('idx_password_reset_user_id').on(table.userId),
}));

// Notification templates (for dynamic content)
export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  channel: text('channel').notNull(),
  type: text('type').notNull(),
  subject: text('subject'), // For emails
  content: text('content').notNull(), // HTML/text content
  variables: json('variables'), // Required variables
  metadata: json('metadata'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  nameIdx: index('idx_notification_templates_name').on(table.name),
  channelTypeIdx: index('idx_notification_templates_channel_type').on(table.channel, table.type),
}));

// Notification queue (for failed/scheduled notifications)
export const notificationQueue = pgTable('notification_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id),
  channel: text('channel').notNull(),
  type: text('type').notNull(),
  priority: text('priority').notNull().default('normal'), // critical, high, normal, low
  scheduledFor: timestamp('scheduled_for'),
  attempts: text('attempts').default('0'),
  maxAttempts: text('max_attempts').default('3'),
  lastAttemptAt: timestamp('last_attempt_at'),
  nextAttemptAt: timestamp('next_attempt_at'),
  payload: json('payload').notNull(),
  error: text('error'),
  status: text('status').notNull().default('pending'), // pending, processing, completed, failed
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  processedAt: timestamp('processed_at'),
}, (table) => ({
  statusIdx: index('idx_notification_queue_status').on(table.status),
  scheduledForIdx: index('idx_notification_queue_scheduled').on(table.scheduledFor),
  priorityIdx: index('idx_notification_queue_priority').on(table.priority),
}));

// User device tokens (for push notifications)
export const userDeviceTokens = pgTable('user_device_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  platform: text('platform').notNull(), // ios, android, web
  deviceId: text('device_id'),
  deviceName: text('device_name'),
  active: boolean('active').notNull().default(true),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  userIdIdx: index('idx_user_device_tokens_user_id').on(table.userId),
  tokenIdx: index('idx_user_device_tokens_token').on(table.token),
  userTokenUnique: unique().on(table.userId, table.token),
}));