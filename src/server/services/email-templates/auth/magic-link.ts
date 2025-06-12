import { EmailTemplate } from '../../email';

export const magicLinkTemplate: EmailTemplate = {
  name: 'auth.magic-link',
  subject: '🔑 Your login link for Hospital Alert System',
  html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px; }
    .button { display: inline-block; background-color: #4CAF50; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
    .button:hover { background-color: #45A049; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
    .security-notice { background-color: #E8F5E9; padding: 15px; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Magic Link Login</h1>
    </div>
    <div class="content">
      <p>Hi {{name}},</p>
      <p>You requested a magic link to log in to the Hospital Alert System. Click the button below to access your account:</p>
      
      <div style="text-align: center;">
        <a href="{{magicLinkUrl}}" class="button">Log In to Your Account</a>
      </div>
      
      <div class="security-notice">
        <strong>⏱️ This link expires in {{expirationTime}}</strong><br>
        For security reasons, this magic link will only work once and expires shortly.
      </div>
      
      <p>If you didn't request this login link, you can safely ignore this email. No one can access your account without clicking the link above.</p>
      
      <p style="color: #666; font-size: 14px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <span style="word-break: break-all;">{{magicLinkUrl}}</span>
      </p>
    </div>
    <div class="footer">
      <p>This is an automated message from Hospital Alert System.</p>
    </div>
  </div>
</body>
</html>
  `,
  text: `Magic Link Login - Hospital Alert System

Hi {{name}},

You requested a magic link to log in to the Hospital Alert System.

Click here to log in: {{magicLinkUrl}}

This link expires in {{expirationTime}} and can only be used once.

If you didn't request this login link, you can safely ignore this email.

If you have trouble with the link, copy and paste it into your browser.`,
  requiredData: ['name', 'magicLinkUrl', 'expirationTime'],
};

export default magicLinkTemplate;