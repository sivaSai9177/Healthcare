# Email Service Setup Guide

The Healthcare Alert System uses Nodemailer for sending email notifications about alerts, escalations, and system events.

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Email Service Configuration
EMAIL_HOST=smtp.gmail.com          # Your SMTP server
EMAIL_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
EMAIL_USER=your-email@gmail.com    # Your email username
EMAIL_PASS=your-app-password       # Your email password or app-specific password
EMAIL_FROM=noreply@healthcare.com  # From address for emails
EMAIL_SERVICE_PORT=3001            # Port for email service API
```

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** in your Google Account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and generate a password
   - Use this password for `EMAIL_PASS`

### Other SMTP Providers

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

#### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-ses-username
EMAIL_PASS=your-ses-password
```

#### Outlook/Office365
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

## Running the Email Service

### Local Development

```bash
# Run directly with Bun
bun run src/server/email/start.ts

# Or use the npm script
bun run server:email
```

### Docker

```bash
# Start email service with Docker
docker-compose -f docker-compose.local.yml up -d email-local

# View logs
docker-compose -f docker-compose.local.yml logs -f email-local
```

## API Endpoints

The email service exposes the following endpoints:

### Health Check
```bash
GET http://localhost:3001/health
```

### Send Test Email
```bash
POST http://localhost:3001/test
Content-Type: application/json

{
  "to": "recipient@example.com"
}
```

### Send Alert Notification
```bash
POST http://localhost:3001/alert
Content-Type: application/json

{
  "to": "nurse@hospital.com",
  "alertId": "alert-123",
  "patientName": "John Doe",
  "roomNumber": "101",
  "urgency": "high",
  "message": "Patient requires immediate attention",
  "hospitalName": "City General Hospital",
  "createdAt": "2024-01-20T10:30:00Z"
}
```

### Send Escalation Notification
```bash
POST http://localhost:3001/escalation
Content-Type: application/json

{
  "to": ["doctor@hospital.com", "manager@hospital.com"],
  "alertId": "alert-123",
  "patientName": "John Doe",
  "roomNumber": "101",
  "urgency": "critical",
  "message": "Patient requires immediate attention",
  "hospitalName": "City General Hospital",
  "escalationLevel": 2,
  "previousAssignee": "Nurse Sarah",
  "timeElapsed": "15 minutes"
}
```

## Testing

```bash
# Run the email service test
bun run test:email
```

## Email Templates

The service includes professional HTML email templates for:

1. **Alert Notifications** - Sent when new alerts are created
2. **Escalation Notifications** - Sent when alerts are escalated
3. **Test Emails** - For verifying email configuration

Templates feature:
- Responsive design
- Color-coded urgency levels
- Clear call-to-action buttons
- Professional healthcare branding

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify your email credentials
   - For Gmail, ensure you're using an app-specific password
   - Check if your account has 2FA enabled

2. **Connection Timeout**
   - Check firewall settings
   - Verify SMTP port is correct
   - Try using port 465 with secure: true

3. **Emails Not Sending**
   - Check the service logs: `docker logs myexpo-email-local`
   - Verify SMTP settings match your provider
   - Test with a simple SMTP client first

### Debug Mode

Set environment variable for detailed logging:
```env
DEBUG=email:*
LOG_LEVEL=debug
```

## Security Best Practices

1. **Never commit credentials** - Use environment variables
2. **Use app-specific passwords** - Don't use your main account password
3. **Enable TLS/SSL** - Use secure connections for SMTP
4. **Rate limiting** - Implement rate limits in production
5. **SPF/DKIM** - Configure for production domains

## Integration with Healthcare System

The email service is automatically integrated with:

- **Alert Creation** - Notifies assigned staff
- **Alert Escalation** - Notifies next level when timeouts occur
- **Shift Changes** - Notifies staff of handovers
- **System Events** - Critical system notifications

## Production Deployment

For production, consider:

1. **Dedicated email service** (SendGrid, AWS SES, Postmark)
2. **Email queuing** with retry logic
3. **Bounce handling** and delivery tracking
4. **Template versioning** for A/B testing
5. **Unsubscribe management** for compliance