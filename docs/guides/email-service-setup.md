# Email Service Setup Guide

This guide covers the email service configuration for the Hospital Alert System using Nodemailer and Google SMTP.

## SMTP Configuration

The project uses Google SMTP for sending emails. The credentials are configured through environment variables.

### Google App Password Setup

We're using a Google App-specific password for SMTP authentication:

- **App Name**: Hospital App
- **App Password**: `jysd otcy vvrb jxrw`

### Environment Variables

Add these to your `.env` file:

```env
# Email Service Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=jysd otcy vvrb jxrw
EMAIL_FROM="Hospital Alert System <noreply@hospitalalert.com>"
```

## Better Auth Email Plugins

The project uses Better Auth's email plugins for authentication flows:

### 1. Magic Link Authentication
- Documentation: https://www.better-auth.com/docs/plugins/magic-link
- Use case: Passwordless login via email
- Implementation: Send secure login links that expire after use

### 2. Email OTP (One-Time Password)
- Documentation: https://www.better-auth.com/docs/plugins/email-otp
- Use case: Two-factor authentication and verification
- Implementation: Send 6-digit codes for verification

### 3. Two-Factor Authentication (2FA)
- Documentation: https://www.better-auth.com/docs/plugins/2fa
- Use case: Enhanced security for sensitive accounts
- Implementation: TOTP-based 2FA with email fallback

## Implementation Plan

### Phase 1: Core Email Service
1. Create `src/server/services/email.ts` with Nodemailer configuration
2. Implement email templates system
3. Add email queue for reliability

### Phase 2: Authentication Emails
1. Implement forgot password flow
2. Add email verification for new accounts
3. Enable magic link login option
4. Add OTP verification

### Phase 3: Healthcare Alerts
1. Critical alert notifications
2. Escalation notifications
3. Shift handover summaries
4. Daily/weekly reports

## Email Templates

### Authentication Templates
- Welcome email
- Email verification
- Password reset
- Magic link login
- OTP code
- 2FA setup confirmation

### Healthcare Templates
- Alert notification
- Escalation warning
- Alert acknowledgment
- Shift summary
- Performance report

### Organization Templates
- Invitation to join
- Role change notification
- Member removal
- Organization settings update

## Security Considerations

1. **Rate Limiting**: Implement rate limits for email sending
2. **Template Injection**: Sanitize all user inputs in templates
3. **Link Security**: Use signed URLs for magic links
4. **Expiration**: Set appropriate expiration times for OTPs and links
5. **Audit Logging**: Log all email sends for compliance

## Testing

### Development Testing
- Use Ethereal Email for development (https://ethereal.email/)
- Log emails to console in development mode
- Create preview endpoints for templates

### Production Monitoring
- Track email delivery rates
- Monitor bounce rates
- Handle unsubscribes
- Implement feedback loops

## Next Steps

1. Create the email service implementation
2. Configure Better Auth plugins
3. Design email templates
4. Implement queue system
5. Add monitoring and analytics

---

*Last Updated: January 11, 2025*