import { EmailTemplate } from '../../email';

export const welcomeTemplate: EmailTemplate = {
  name: 'auth.welcome',
  subject: 'Welcome to Hospital Alert System!',
  html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .button { display: inline-block; background-color: #FF1493; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome, {{name}}!</h1>
    </div>
    <div class="content">
      <p>Thank you for joining the Hospital Alert System. Your account has been created successfully.</p>
      <p>You're now part of a platform that helps healthcare teams respond faster to critical situations.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{loginUrl}}" class="button">Get Started</a>
      </p>
    </div>
  </div>
</body>
</html>
  `,
  text: `Welcome to Hospital Alert System!

Hi {{name}},

Thank you for joining the Hospital Alert System. Your account has been created successfully.

You're now part of a platform that helps healthcare teams respond faster to critical situations.

Get started: {{loginUrl}}

Best regards,
Hospital Alert System Team`,
  requiredData: ['name', 'loginUrl'],
};

export default welcomeTemplate;