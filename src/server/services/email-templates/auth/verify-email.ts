import { EmailTemplate } from '../../email';

export const verifyEmailTemplate: EmailTemplate = {
  name: 'auth.verify',
  subject: 'Verify your email address',
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
    .code { background-color: #f5f5f5; padding: 20px; border-radius: 4px; font-size: 24px; letter-spacing: 4px; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verify Your Email</h1>
    </div>
    <div class="content">
      <p>Hi {{name}},</p>
      <p>Please verify your email address to complete your registration.</p>
      
      {{#if verificationUrl}}
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
      </p>
      <p style="color: #666; font-size: 14px;">Or copy and paste this link: {{verificationUrl}}</p>
      {{/if}}
      
      {{#if code}}
      <p>Alternatively, enter this verification code:</p>
      <div class="code">{{code}}</div>
      {{/if}}
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
  `,
  text: `Verify Your Email

Hi {{name}},

Please verify your email address to complete your registration.

{{#if verificationUrl}}
Click here to verify: {{verificationUrl}}
{{/if}}

{{#if code}}
Or enter this verification code: {{code}}
{{/if}}

This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.

Best regards,
Hospital Alert System Team`,
  requiredData: ['name'],
};

export default verifyEmailTemplate;