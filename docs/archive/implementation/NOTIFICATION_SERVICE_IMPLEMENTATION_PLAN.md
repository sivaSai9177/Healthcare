# Notification Service Implementation Plan

**Created:** January 11, 2025  
**Status:** In Progress  
**Priority:** High

## Overview

This document outlines the implementation plan for a unified notification service that integrates email, SMS, and push notifications for the Healthcare Alert System.

## Current Status

### ✅ Already Implemented
- Push notification service (`/lib/ui/notifications/service.ts`)
- WebSocket real-time alerts
- Notification Center UI
- Email configuration in `.env.email`

### 🚧 In Progress
- Email Service implementation

### ❌ Not Started
- SMS Service (Optional)
- Unified Notification Dispatcher
- Better Auth email plugins
- User preference management

## Implementation Phases

### Phase 1: Core Email Service (2-3 hours) 🚧

**Status:** In Progress

#### 1.1 Create Email Service (`/src/server/services/email.ts`)
- [ ] Nodemailer configuration with Google SMTP
- [ ] HTML and text template support
- [ ] Rate limiting (100 emails per hour)
- [ ] Retry logic for failed sends
- [ ] Email queue using Bull

```typescript
// Key interfaces to implement
interface EmailService {
  sendEmail(options: EmailOptions): Promise<EmailResult>
  sendBulk(emails: EmailOptions[]): Promise<EmailResult[]>
  addToQueue(email: EmailOptions): Promise<string>
  getQueueStatus(): Promise<QueueStatus>
}
```

#### 1.2 Email Templates System (`/src/server/services/email-templates/`)
- [ ] Base template with hospital branding
- [ ] Authentication templates
  - [ ] Welcome email
  - [ ] Email verification
  - [ ] Password reset
  - [ ] Magic link login
- [ ] Healthcare templates
  - [ ] Alert notification
  - [ ] Escalation warning
  - [ ] Shift summary
  - [ ] Performance report
- [ ] Organization templates
  - [ ] Invitation to join
  - [ ] Role change notification

#### 1.3 Email Queue Implementation
- [ ] Queue for background processing
- [ ] Priority levels for critical alerts
- [ ] Batch sending capability
- [ ] Failed email retry with exponential backoff

### Phase 2: SMS Service Integration (Future Implementation) 📱

**Status:** Deferred - Will implement later

#### 2.1 Create SMS Service (`/src/server/services/sms.ts`)
- [ ] Twilio integration (skeleton code only for now)
- [ ] Phone number validation
- [ ] SMS templates for critical alerts
- [ ] Rate limiting and cost control
- [ ] Fallback to email if SMS fails

#### 2.2 SMS Templates
- [ ] Alert notifications (160 char limit)
- [ ] Escalation warnings
- [ ] Two-factor authentication codes

**Note:** We will create the SMS service structure and interfaces but leave the actual Twilio implementation for later. This allows the notification system to support SMS without blocking on Twilio setup.

### Phase 3: Unified Notification Service (2-3 hours) 🔄

**Status:** Not Started

#### 3.1 Create Notification Dispatcher (`/src/server/services/notifications.ts`)
- [ ] Channel selection logic (email, SMS, push)
- [ ] User preference management
- [ ] Priority-based routing
- [ ] Delivery tracking and analytics
- [ ] Integration with existing WebSocket alerts

```typescript
// Core notification interface
interface NotificationService {
  send(notification: Notification): Promise<NotificationResult>
  sendBatch(notifications: Notification[]): Promise<NotificationResult[]>
  getUserPreferences(userId: string): Promise<UserPreferences>
  updateUserPreferences(userId: string, prefs: UserPreferences): Promise<void>
}
```

#### 3.2 Database Schema Updates
- [ ] Create `notification_preferences` table
- [ ] Create `notification_logs` table
- [ ] Add email/phone verification status to users

```sql
-- notification_preferences table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id),
  channel TEXT NOT NULL, -- email, sms, push
  notification_type TEXT NOT NULL, -- alert, escalation, summary
  enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.3 Integration with Healthcare System
- [ ] Hook into alert creation/escalation
- [ ] Send notifications based on user role
- [ ] Batch notifications for shift summaries
- [ ] Emergency override for critical alerts

### Phase 4: Better Auth Email Integration (1-2 hours) 🔐

**Status:** Not Started

#### 4.1 Configure Better Auth Plugins
- [ ] Enable email verification in auth.ts
- [ ] Add password reset flow
- [ ] Implement magic link authentication
- [ ] Configure email OTP for 2FA

#### 4.2 Update Authentication Flows
- [ ] Add email verification to registration
- [ ] Implement forgot password screens
- [ ] Add resend verification option
- [ ] Handle email change flow

### Phase 5: Testing and Documentation (1 hour) 🧪

**Status:** Not Started

#### 5.1 Create Test Scripts
- [ ] Email service tests
- [ ] SMS service tests (if implemented)
- [ ] Notification routing tests
- [ ] Queue processing tests

#### 5.2 Update Documentation
- [ ] API documentation
- [ ] User preference guide
- [ ] Email template guide
- [ ] Monitoring guide

## Implementation Checklist

### Immediate Tasks (Today)
1. [ ] Copy email configuration from `.env.email` to `.env`
2. [ ] Create `/src/server/services/email.ts`
3. [ ] Install required packages: `nodemailer`, `bull`, `handlebars`
4. [ ] Create basic email service with send functionality
5. [ ] Test email sending with Gmail SMTP

### Tomorrow's Tasks
1. [ ] Implement email templates
2. [ ] Create notification dispatcher
3. [ ] Add database schema for preferences
4. [ ] Integrate with alert system
5. [ ] Configure Better Auth email plugins

## Code Structure

```
/src/server/services/
  ├── email.ts                    # Email service
  ├── sms.ts                      # SMS service (optional)
  ├── notifications.ts            # Unified dispatcher
  ├── email-templates/
  │   ├── base.tsx               # Base template
  │   ├── auth/
  │   │   ├── welcome.tsx
  │   │   ├── verify-email.tsx
  │   │   └── reset-password.tsx
  │   ├── healthcare/
  │   │   ├── alert.tsx
  │   │   ├── escalation.tsx
  │   │   └── shift-summary.tsx
  │   └── organization/
  │       ├── invitation.tsx
  │       └── role-change.tsx
  └── queues/
      ├── email-queue.ts
      └── notification-queue.ts
```

## Environment Variables

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=saipramod.sirigiri@gmail.com
EMAIL_PASS=jysd otcy vvrb jxrw
EMAIL_FROM="Hospital Alert System <saipramod.sirigiri@gmail.com>"

# Email Service Options
EMAIL_QUEUE_ENABLED=true
EMAIL_RATE_LIMIT=100
EMAIL_RATE_WINDOW=3600000

# Twilio Configuration (optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

# Notification Settings
NOTIFICATION_QUEUE_ENABLED=true
NOTIFICATION_RATE_LIMIT=100
NOTIFICATION_BATCH_SIZE=50
```

## Key Decisions

1. **Email First**: Focus on email implementation first as it's required for auth flows
2. **SMS Optional**: SMS can be added later if needed for critical alerts
3. **Queue System**: Use Bull for reliable background processing
4. **Template Engine**: Use React Email or Handlebars for templates
5. **Rate Limiting**: Implement per-user and per-organization limits

## Success Criteria

- [ ] Can send emails via Gmail SMTP
- [ ] Email templates render correctly
- [ ] Queue processes emails reliably
- [ ] Notifications route to correct channels
- [ ] User preferences are respected
- [ ] Critical alerts bypass preferences
- [ ] Better Auth email flows work
- [ ] All notifications are logged

## Next Steps

1. Start with Phase 1.1 - Create basic email service
2. Test SMTP connection with provided credentials
3. Implement one template as proof of concept
4. Add queue system for reliability
5. Integrate with one alert type for testing

---

**Note:** This is a living document. Update the checkboxes as tasks are completed.