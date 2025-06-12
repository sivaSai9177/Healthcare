import { EmailTemplate } from '../../email';

export const invitationTemplate: EmailTemplate = {
  name: 'org.invitation',
  subject: '{{inviterName}} invited you to join {{organizationName}}',
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
    .org-info { background-color: #F5F5F5; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You're Invited!</h1>
    </div>
    <div class="content">
      <p>Hi {{recipientName}},</p>
      <p><strong>{{inviterName}}</strong> has invited you to join <strong>{{organizationName}}</strong> on Hospital Alert System.</p>
      
      <div class="org-info">
        <h3 style="margin-top: 0;">Organization Details</h3>
        <p><strong>Name:</strong> {{organizationName}}</p>
        <p><strong>Your Role:</strong> {{role}}</p>
        {{#if message}}
        <p><strong>Message from {{inviterName}}:</strong><br>
        <em>{{message}}</em></p>
        {{/if}}
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{invitationUrl}}" class="button">Accept Invitation</a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        This invitation will expire in 7 days. If you have any questions, please contact {{inviterName}} or your organization administrator.
      </p>
    </div>
  </div>
</body>
</html>
  `,
  text: `You're Invited to {{organizationName}}!

Hi {{recipientName}},

{{inviterName}} has invited you to join {{organizationName}} on Hospital Alert System.

ORGANIZATION DETAILS:
- Name: {{organizationName}}
- Your Role: {{role}}

{{#if message}}
Message from {{inviterName}}:
{{message}}
{{/if}}

Accept Invitation: {{invitationUrl}}

This invitation will expire in 7 days.`,
  requiredData: ['recipientName', 'inviterName', 'organizationName', 'role', 'invitationUrl'],
};

export default invitationTemplate;