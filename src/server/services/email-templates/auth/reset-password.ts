import { EmailTemplate } from '../../email';

export const resetPasswordTemplate: EmailTemplate = {
  name: 'auth.reset',
  subject: 'Reset your password',
  html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; }
    .header { background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .button { display: inline-block; background-color: #FF1493; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; }
    .warning { background-color: #FFF3CD; border: 1px solid #FFE69C; padding: 15px; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hi {{name}},</p>
      <p>We received a request to reset your password for your Hospital Alert System account.</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{resetUrl}}" class="button">Reset Password</a>
      </p>
      
      <div class="warning">
        <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
      </div>
      
      <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        For security, this password reset link can only be used once.
      </p>
    </div>
  </div>
</body>
</html>
  `,
  text: `Password Reset Request

Hi {{name}},

We received a request to reset your password for your Hospital Alert System account.

Click here to reset your password: {{resetUrl}}

IMPORTANT: This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email or contact support if you have concerns.

For security, this password reset link can only be used once.

Best regards,
Hospital Alert System Team`,
  requiredData: ['name', 'resetUrl'],
};

export default resetPasswordTemplate;