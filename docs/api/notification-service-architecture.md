# Notification Service Architecture

## Overview

The notification service provides a unified interface for sending notifications through multiple channels (email, SMS, push) with intelligent routing, user preferences, and delivery tracking.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  Healthcare Alerts  │  Auth Events  │  Organization Events      │
└──────────┬──────────┴───────┬───────┴────────┬─────────────────┘
           │                  │                 │
           ▼                  ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Unified Notification Service                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • Channel Selection  • User Preferences               │    │
│  │  • Priority Routing   • Delivery Tracking              │    │
│  │  • Template Rendering • Rate Limiting                  │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────┬───────────────┬───────────────┬──────────────────────┘
          │               │               │
          ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│Email Service│ │ SMS Service │ │Push Service │
│  (Active)   │ │  (Future)   │ │  (Active)   │
└─────────────┘ └─────────────┘ └─────────────┘
```

## Core Components

### 1. Notification Service (`/src/server/services/notifications.ts`)

The central dispatcher that coordinates all notification delivery.

```typescript
interface Notification {
  id: string
  type: NotificationType
  recipient: NotificationRecipient
  priority: Priority
  channels: Channel[]
  data: NotificationData
  metadata?: Record<string, any>
}

interface NotificationRecipient {
  userId: string
  email?: string
  phone?: string
  pushToken?: string
  preferences?: UserPreferences
}

enum NotificationType {
  ALERT_CREATED = 'alert.created',
  ALERT_ESCALATED = 'alert.escalated',
  ALERT_ACKNOWLEDGED = 'alert.acknowledged',
  AUTH_VERIFY_EMAIL = 'auth.verify_email',
  AUTH_RESET_PASSWORD = 'auth.reset_password',
  ORG_INVITATION = 'org.invitation',
  ORG_ROLE_CHANGE = 'org.role_change',
  SHIFT_SUMMARY = 'shift.summary'
}

enum Priority {
  CRITICAL = 'critical',  // All channels, bypass preferences
  HIGH = 'high',         // Preferred channels, immediate
  MEDIUM = 'medium',     // Preferred channels, can batch
  LOW = 'low'           // Email only, can delay
}

enum Channel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}
```

### 2. Email Service (`/src/server/services/email.ts`)

Handles email delivery with templates, queuing, and tracking.

```typescript
interface EmailService {
  // Send single email
  send(options: EmailOptions): Promise<EmailResult>
  
  // Send multiple emails
  sendBatch(emails: EmailOptions[]): Promise<EmailResult[]>
  
  // Add to queue for background processing
  queue(options: EmailOptions, priority?: number): Promise<string>
  
  // Get queue statistics
  getQueueStats(): Promise<QueueStats>
  
  // Verify email configuration
  verifyConnection(): Promise<boolean>
}

interface EmailOptions {
  to: string | string[]
  subject: string
  template?: string
  html?: string
  text?: string
  data?: Record<string, any>
  attachments?: Attachment[]
  headers?: Record<string, string>
  priority?: 'high' | 'normal' | 'low'
  scheduledFor?: Date
}
```

### 3. SMS Service (`/src/server/services/sms.ts`)

Skeleton implementation for future SMS support.

```typescript
interface SMSService {
  // Send SMS (placeholder - returns mock success)
  send(options: SMSOptions): Promise<SMSResult>
  
  // Validate phone number format
  validateNumber(phone: string): boolean
  
  // Check if SMS is configured
  isConfigured(): boolean
}

interface SMSOptions {
  to: string
  message: string
  priority?: 'high' | 'normal'
}

// Initial implementation will be a mock that logs and returns success
class MockSMSService implements SMSService {
  async send(options: SMSOptions): Promise<SMSResult> {
    log.info('SMS Service (Mock)', 'Would send SMS', options);
    return { success: true, messageId: 'mock-' + Date.now() };
  }
  
  validateNumber(phone: string): boolean {
    return /^\+?[1-9]\d{1,14}$/.test(phone);
  }
  
  isConfigured(): boolean {
    return false; // Not configured until Twilio is set up
  }
}
```

### 4. Template System

Email templates using React Email or Handlebars.

```typescript
interface EmailTemplate {
  name: string
  subject: string | ((data: any) => string)
  html: string | ((data: any) => string)
  text?: string | ((data: any) => string)
  requiredData?: string[]
}

// Template registry
const templates = new Map<string, EmailTemplate>([
  ['alert.created', alertCreatedTemplate],
  ['auth.verify', verifyEmailTemplate],
  ['org.invitation', invitationTemplate],
  // ... more templates
]);
```

## User Preferences

### Database Schema

```sql
-- User notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, channel, notification_type)
);

-- Notification delivery logs
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  channel TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL, -- pending, sent, delivered, failed
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
```

### Preference Management

```typescript
interface UserPreferences {
  email: ChannelPreferences
  sms: ChannelPreferences
  push: ChannelPreferences
  quietHours?: {
    enabled: boolean
    start: string // "22:00"
    end: string   // "08:00"
    timezone: string
  }
  frequency?: {
    [NotificationType]: 'instant' | 'batch' | 'daily'
  }
}

interface ChannelPreferences {
  enabled: boolean
  types: {
    [NotificationType]: boolean
  }
}
```

## Notification Flow

### 1. Alert Creation Flow

```typescript
// When an alert is created
async function handleAlertCreated(alert: Alert) {
  // 1. Determine recipients
  const recipients = await getAlertRecipients(alert);
  
  // 2. Create notifications
  const notifications = recipients.map(recipient => ({
    type: NotificationType.ALERT_CREATED,
    recipient,
    priority: alert.urgencyLevel >= 4 ? Priority.CRITICAL : Priority.HIGH,
    channels: determineChannels(recipient, alert),
    data: {
      alertId: alert.id,
      roomNumber: alert.roomNumber,
      alertType: alert.alertType,
      description: alert.description,
    }
  }));
  
  // 3. Send via notification service
  await notificationService.sendBatch(notifications);
}
```

### 2. Channel Selection Logic

```typescript
function determineChannels(
  recipient: NotificationRecipient,
  notification: { priority: Priority, type: NotificationType }
): Channel[] {
  const channels: Channel[] = [];
  
  // Critical alerts use all available channels
  if (notification.priority === Priority.CRITICAL) {
    if (recipient.email) channels.push(Channel.EMAIL);
    if (recipient.phone && smsService.isConfigured()) channels.push(Channel.SMS);
    if (recipient.pushToken) channels.push(Channel.PUSH);
    return channels;
  }
  
  // Check user preferences
  const prefs = recipient.preferences;
  if (prefs?.email.enabled && prefs.email.types[notification.type]) {
    channels.push(Channel.EMAIL);
  }
  if (prefs?.sms.enabled && prefs.sms.types[notification.type] && recipient.phone) {
    channels.push(Channel.SMS);
  }
  if (prefs?.push.enabled && prefs.push.types[notification.type] && recipient.pushToken) {
    channels.push(Channel.PUSH);
  }
  
  // Default to email if no preferences
  if (channels.length === 0 && recipient.email) {
    channels.push(Channel.EMAIL);
  }
  
  return channels;
}
```

## Queue System

Using Bull for reliable background processing:

```typescript
import Bull from 'bull';

// Email queue with Redis
const emailQueue = new Bull('email-notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Process emails
emailQueue.process(async (job) => {
  const { email } = job.data;
  return await emailService.send(email);
});

// Monitor queue events
emailQueue.on('failed', (job, err) => {
  log.error('Email job failed', 'QUEUE', { jobId: job.id, error: err });
});
```

## Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
interface RateLimits {
  perUser: {
    emails: { max: 50, window: '1h' },
    sms: { max: 10, window: '1h' },
    push: { max: 100, window: '1h' },
  },
  perOrganization: {
    emails: { max: 1000, window: '1d' },
    sms: { max: 100, window: '1d' },
  },
  global: {
    emails: { max: 10000, window: '1h' },
  }
}
```

## Error Handling

Comprehensive error handling with fallback strategies:

```typescript
async function sendNotificationWithFallback(
  notification: Notification
): Promise<NotificationResult> {
  const results: ChannelResult[] = [];
  const errors: Error[] = [];
  
  for (const channel of notification.channels) {
    try {
      const result = await sendViaChannel(channel, notification);
      results.push(result);
      
      // If one channel succeeds for critical, that's enough
      if (notification.priority === Priority.CRITICAL && result.success) {
        break;
      }
    } catch (error) {
      errors.push(error);
      log.error(`Failed to send via ${channel}`, 'NOTIFICATION', error);
      
      // Try fallback channel
      const fallback = getFallbackChannel(channel, notification);
      if (fallback) {
        try {
          const fallbackResult = await sendViaChannel(fallback, notification);
          results.push(fallbackResult);
        } catch (fallbackError) {
          errors.push(fallbackError);
        }
      }
    }
  }
  
  return {
    notificationId: notification.id,
    results,
    errors,
    success: results.some(r => r.success),
  };
}
```

## Monitoring and Analytics

Track notification performance:

```typescript
interface NotificationMetrics {
  sent: number
  delivered: number
  failed: number
  opened: number
  clicked: number
  averageDeliveryTime: number
  channelBreakdown: {
    [Channel]: {
      sent: number
      delivered: number
      failed: number
    }
  }
}

// Dashboard queries
async function getNotificationMetrics(
  timeRange: TimeRange
): Promise<NotificationMetrics> {
  // Query notification_logs table
  // Aggregate by status and channel
  // Calculate delivery rates
}
```

## Security Considerations

1. **Email Security**
   - SPF/DKIM configuration
   - Encrypted SMTP connections
   - Template injection prevention
   - Rate limiting per user

2. **SMS Security**
   - Phone number validation
   - Message content filtering
   - Cost controls
   - Fraud detection

3. **Data Protection**
   - Encrypt sensitive data in logs
   - PII handling compliance
   - Audit trail for all notifications
   - Data retention policies

## Testing Strategy

1. **Unit Tests**
   - Service methods
   - Template rendering
   - Channel selection logic
   - Rate limiting

2. **Integration Tests**
   - Email delivery
   - Queue processing
   - Database operations
   - Preference management

3. **E2E Tests**
   - Alert notification flow
   - Auth email flows
   - Preference updates
   - Delivery tracking

## Implementation Timeline

1. **Week 1: Core Services**
   - Email service with templates
   - Basic notification dispatcher
   - Database schema

2. **Week 2: Integration**
   - Healthcare alert integration
   - Auth email flows
   - User preferences

3. **Week 3: Polish**
   - Queue optimization
   - Monitoring dashboard
   - Documentation

## Future Enhancements

1. **Advanced Features**
   - Rich notifications (images, actions)
   - Notification scheduling
   - A/B testing for templates
   - Analytics dashboard

2. **Additional Channels**
   - WhatsApp integration
   - Slack notifications
   - Microsoft Teams
   - Voice calls for critical alerts

3. **Machine Learning**
   - Optimal send time prediction
   - Channel preference learning
   - Engagement optimization
   - Anomaly detection