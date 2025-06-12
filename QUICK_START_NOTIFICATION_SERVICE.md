# Quick Start: Notification Service Implementation

## 🚀 Immediate Setup Steps

### 1. Copy Email Configuration
```bash
# Copy email settings to main .env file
cat .env.email >> .env
```

### 2. Install Required Packages
```bash
bun add nodemailer @types/nodemailer bull @types/bull handlebars @types/handlebars
```

### 3. Create File Structure
```bash
# Create directories
mkdir -p src/server/services/email-templates/auth
mkdir -p src/server/services/email-templates/healthcare
mkdir -p src/server/services/email-templates/organization
mkdir -p src/server/services/queues

# Create service files
touch src/server/services/email.ts
touch src/server/services/sms.ts
touch src/server/services/notifications.ts
touch src/server/services/queues/email-queue.ts
```

## 📝 Implementation Order

### Step 1: Email Service (Start Here)
Create `/src/server/services/email.ts`:

```typescript
import nodemailer from 'nodemailer';
import { log } from '@/lib/core/debug/logger';

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    log.error('Email service connection failed', 'EMAIL', error);
  } else {
    log.info('Email service ready', 'EMAIL');
  }
});

export const emailService = {
  async send(options: EmailOptions): Promise<EmailResult> {
    // Implementation here
  }
};
```

### Step 2: SMS Service Skeleton
Create `/src/server/services/sms.ts`:

```typescript
// Mock SMS service for future Twilio integration
export const smsService = {
  async send(options: SMSOptions): Promise<SMSResult> {
    log.info('SMS Service (Mock)', 'Would send SMS', options);
    return { success: true, messageId: 'mock-' + Date.now() };
  },
  
  isConfigured(): boolean {
    return false; // Not configured until Twilio is set up
  }
};
```

### Step 3: First Email Template
Create `/src/server/services/email-templates/healthcare/alert-notification.ts`:

```typescript
export const alertNotificationTemplate = {
  subject: '🚨 Healthcare Alert: Room {{roomNumber}}',
  html: `
    <h2>New Healthcare Alert</h2>
    <p><strong>Room:</strong> {{roomNumber}}</p>
    <p><strong>Type:</strong> {{alertType}}</p>
    <p><strong>Priority:</strong> {{urgencyLevel}}/5</p>
    <p><strong>Description:</strong> {{description}}</p>
    <hr>
    <p>Please acknowledge this alert in the Hospital Alert System.</p>
  `,
  text: `
    New Healthcare Alert
    Room: {{roomNumber}}
    Type: {{alertType}}
    Priority: {{urgencyLevel}}/5
    Description: {{description}}
    
    Please acknowledge this alert in the Hospital Alert System.
  `
};
```

### Step 4: Test Email Sending
Create `/scripts/test-email-service.ts`:

```typescript
#!/usr/bin/env bun

import { emailService } from '../src/server/services/email';

async function testEmail() {
  try {
    const result = await emailService.send({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<h1>Test Email</h1><p>This is a test email from the Hospital Alert System.</p>',
      text: 'Test Email - This is a test email from the Hospital Alert System.'
    });
    
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

testEmail();
```

## 🔧 Environment Variables

Add to your `.env` file:
```env
# Email Configuration (already in .env.email)
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

# Development Options
EMAIL_DEV_MODE=false
EMAIL_DEV_TO=dev@example.com
```

## 📋 Today's Checklist

- [ ] Copy email config to .env
- [ ] Install npm packages
- [ ] Create email service with basic send function
- [ ] Create SMS service skeleton
- [ ] Create one email template
- [ ] Test email sending
- [ ] Verify Gmail SMTP connection
- [ ] Create notification dispatcher interface
- [ ] Hook up one alert type to email

## 🎯 Success Criteria

1. **Email Service Works**
   - Can send test email via Gmail SMTP
   - Connection verified on startup
   - Proper error handling

2. **Template System Ready**
   - At least one template renders
   - Variables replaced correctly
   - Both HTML and text versions

3. **Integration Started**
   - One healthcare alert triggers email
   - Notification logged to database
   - Error handling in place

## 🚨 Common Issues & Solutions

### Gmail Authentication Failed
- Make sure app password is correct
- Check 2FA is enabled on Gmail account
- Verify EMAIL_USER matches the account

### Connection Timeout
- Check firewall allows port 587
- Try different network
- Test with telnet: `telnet smtp.gmail.com 587`

### Template Not Rendering
- Check Handlebars syntax
- Verify all variables provided
- Test with simple template first

## 📞 Next Steps

After email service is working:
1. Add email queue with Bull
2. Implement rate limiting
3. Create more templates
4. Add Better Auth integration
5. Create unified notification dispatcher

---

**Remember:** Focus on getting basic email sending working first, then add complexity!