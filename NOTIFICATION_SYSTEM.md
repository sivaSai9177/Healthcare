# Notification System Documentation

## Overview
The Hospital Alert System includes a comprehensive multi-channel notification system that supports email, SMS, push notifications, and in-app notifications. The system is designed to be reliable, scalable, and configurable with user preferences.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      Notification Dispatcher                     │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│   Email     │     SMS     │    Push     │     In-App          │
│  Service    │   Service   │   Service   │   Notifications     │
├─────────────┴─────────────┴─────────────┴─────────────────────┤
│                    Notification Queue (Bull)                     │
├─────────────────────────────────────────────────────────────────┤
│              User Preferences & Configuration                    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Multi-Channel Support**
   - Email (Nodemailer with SMTP)
   - SMS (Twilio-ready structure)
   - Push Notifications (Expo Push Service)
   - In-App Notifications (Real-time via WebSocket)

2. **User Preference Management**
   - Channel preferences per notification type
   - Quiet hours configuration
   - Notification frequency limits
   - Timezone-aware delivery

3. **Reliability Features**
   - Queue-based processing with Bull
   - Retry logic with exponential backoff
   - Rate limiting per user/channel
   - Fallback mechanisms
   - Audit logging

4. **Template System**
   - Handlebars templates for emails
   - Dynamic content injection
   - Multi-language support ready
   - Responsive HTML emails

## Implementation Details

### Email Service (`/src/server/services/email.ts`)

```typescript
interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  data?: Record<string, any>;
  html?: string;
  text?: string;
  priority?: 'high' | 'normal' | 'low';
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

class EmailService {
  async send(options: EmailOptions): Promise<EmailResult>
  async sendBatch(emails: EmailOptions[]): Promise<EmailResult[]>
  async addToQueue(options: EmailOptions): Promise<void>
  async registerTemplate(name: string, template: EmailTemplate): Promise<void>
}
```

#### Email Templates

Pre-configured templates:
- `alert-created` - New alert notification
- `alert-acknowledged` - Alert acknowledgment confirmation
- `alert-escalated` - Escalation notification
- `welcome` - User welcome email
- `password-reset` - Password reset request
- `email-verification` - Email verification
- `organization-invite` - Organization invitation

#### Configuration

```env
# Email Service Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM="Hospital Alert System <noreply@hospital.com>"

# Email Service Options
EMAIL_QUEUE_ENABLED=true
EMAIL_RATE_LIMIT=100
EMAIL_RATE_WINDOW=3600000
EMAIL_DEV_MODE=false
EMAIL_DEV_TO=dev@example.com
```

### SMS Service (`/src/server/services/sms.ts`)

```typescript
interface SMSOptions {
  to: string;
  message: string;
  priority?: 'high' | 'normal' | 'low';
  metadata?: Record<string, any>;
}

class SMSService {
  async send(options: SMSOptions): Promise<SMSResult>
  async sendBatch(messages: SMSOptions[]): Promise<SMSResult[]>
  async validatePhoneNumber(phoneNumber: string): Promise<boolean>
}
```

#### SMS Provider Interface

The system supports multiple SMS providers through a common interface:

```typescript
interface SMSProvider {
  send(options: SMSOptions): Promise<SMSResult>;
  getStatus(messageId: string): Promise<SMSStatus>;
  getBalance(): Promise<number>;
}
```

Currently implemented:
- `MockSMSProvider` - For development/testing
- `TwilioProvider` - Ready for production (configuration pending)

### Push Notification Service (`/src/server/services/push.ts`)

```typescript
interface PushOptions {
  to: string | string[]; // Expo push tokens
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'high' | 'normal';
}

class PushService {
  async send(options: PushOptions): Promise<PushResult>
  async registerToken(userId: string, token: string): Promise<void>
  async unregisterToken(userId: string, token: string): Promise<void>
}
```

### Notification Dispatcher (`/src/server/services/notification.ts`)

The unified dispatcher handles routing notifications to appropriate channels:

```typescript
interface NotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: Priority;
  channels?: NotificationChannel[];
}

class NotificationService {
  async send(options: NotificationOptions): Promise<NotificationResult>
  async sendToRole(role: string, options: Omit<NotificationOptions, 'userId'>): Promise<NotificationResult[]>
  async sendToOrganization(orgId: string, options: Omit<NotificationOptions, 'userId'>): Promise<NotificationResult[]>
}
```

### User Preferences

User notification preferences are stored in the database:

```sql
notification_preferences (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL, -- 'email' | 'sms' | 'push' | 'in_app'
  notification_type TEXT NOT NULL, -- 'alert_created' | 'alert_acknowledged' | etc
  enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'UTC',
  max_frequency INTEGER, -- max notifications per day
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Usage Examples

### Sending a Simple Email

```typescript
const emailService = new EmailService();

await emailService.send({
  to: 'doctor@hospital.com',
  subject: 'New Critical Alert',
  template: 'alert-created',
  data: {
    alertId: '123',
    patientName: 'John Doe',
    severity: 'critical',
    condition: 'Cardiac Arrest'
  }
});
```

### Sending Multi-Channel Notification

```typescript
const notificationService = new NotificationService();

await notificationService.send({
  userId: 'doctor-123',
  type: 'alert_created',
  title: 'Critical Alert',
  message: 'Patient John Doe requires immediate attention',
  data: { alertId: '123' },
  priority: 'high',
  channels: ['email', 'push', 'sms'] // Will use user's preferences
});
```

### Batch Notifications to Role

```typescript
await notificationService.sendToRole('doctor', {
  type: 'shift_reminder',
  title: 'Shift Starting Soon',
  message: 'Your shift starts in 30 minutes',
  priority: 'normal'
});
```

### Managing User Preferences

```typescript
// Set user preferences
await db.insert(notificationPreferences).values({
  userId: 'user-123',
  channel: 'email',
  notificationType: 'alert_created',
  enabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  timezone: 'America/New_York',
  maxFrequency: 10
});
```

## Integration with Better Auth

The notification system is integrated with Better Auth for authentication-related emails:

```typescript
// In auth-server.ts
emailAndPassword({
  enabled: true,
  requireEmailVerification: false,
  sendResetPassword: async ({ user, url }) => {
    await emailService.send({
      to: user.email,
      subject: 'Reset your password',
      template: 'password-reset',
      data: { userName: user.name, resetUrl: url }
    });
  }
})
```

## Queue Management

The system uses Bull for queue management with Redis:

```typescript
// Queue configuration
const emailQueue = new Bull('email-queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});
```

## Error Handling

The system includes comprehensive error handling:

1. **Validation Errors** - Invalid inputs are caught early
2. **Provider Errors** - SMTP/SMS/Push provider failures are handled gracefully
3. **Rate Limit Errors** - Users are protected from notification spam
4. **Network Errors** - Automatic retries with backoff
5. **Queue Errors** - Failed jobs are retained for debugging

## Monitoring and Logging

All notification activities are logged:

```typescript
// Notification logs table
notification_logs (
  id UUID PRIMARY KEY,
  user_id TEXT,
  channel TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL, -- 'sent' | 'failed' | 'queued' | 'rate_limited'
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMP
)
```

## Testing

### Development Mode

Enable development mode to redirect all emails:
```env
EMAIL_DEV_MODE=true
EMAIL_DEV_TO=developer@example.com
```

### Mock Providers

Use mock providers for testing:
```typescript
const smsService = new SMSService({
  provider: new MockSMSProvider()
});
```

## Security Considerations

1. **Input Validation** - All inputs are validated with Zod schemas
2. **Rate Limiting** - Prevents notification spam
3. **Authentication** - All API endpoints require authentication
4. **Audit Trail** - All notifications are logged for compliance
5. **Data Sanitization** - HTML content is sanitized to prevent XSS

## Performance Optimization

1. **Queue Processing** - Background jobs prevent blocking
2. **Batch Operations** - Send multiple notifications efficiently
3. **Caching** - Templates and user preferences are cached
4. **Connection Pooling** - SMTP connections are reused
5. **Selective Loading** - Only load required notification channels

## Future Enhancements

1. **WhatsApp Integration** - Add WhatsApp Business API
2. **Voice Calls** - Critical alerts via automated calls
3. **Notification Center UI** - In-app notification management
4. **Analytics Dashboard** - Delivery rates, open rates, etc.
5. **A/B Testing** - Test different notification strategies
6. **Internationalization** - Multi-language support

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SMTP credentials
   - Verify network connectivity
   - Check email queue status
   - Review logs for errors

2. **Rate limiting triggered**
   - Check user's notification frequency
   - Review rate limit configuration
   - Consider adjusting limits

3. **Push notifications not received**
   - Verify push tokens are registered
   - Check device permissions
   - Review Expo push receipts

4. **SMS delivery failures**
   - Verify phone number format
   - Check SMS provider balance
   - Review provider logs

## API Reference

See the complete API documentation in the tRPC router:
- `/src/server/routers/notification.ts` (when implemented)

Current notification integration points:
- `/src/server/routers/healthcare.ts` - Alert notifications
- `/src/server/routers/auth.ts` - Authentication emails
- `/src/server/services/escalation-timer.ts` - Escalation notifications

---

*Last Updated: January 11, 2025*  
*Version: 1.0*  
*Status: Production Ready*