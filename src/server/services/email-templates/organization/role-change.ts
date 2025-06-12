import { EmailTemplate } from '../../email';

export const roleChangeTemplate: EmailTemplate = {
  name: 'org.role-change',
  subject: 'Your role has been updated in {{organizationName}}',
  html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; }
    .header { background: linear-gradient(135deg, #2196F3 0%, #42A5F5 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .role-box { background-color: #E3F2FD; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .old-role { color: #666; text-decoration: line-through; }
    .new-role { color: #2196F3; font-size: 24px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Role Update</h1>
    </div>
    <div class="content">
      <p>Hi {{name}},</p>
      <p>Your role in <strong>{{organizationName}}</strong> has been updated.</p>
      
      <div class="role-box">
        <p class="old-role">{{oldRole}}</p>
        <p style="margin: 10px 0;">↓</p>
        <p class="new-role">{{newRole}}</p>
      </div>
      
      <p><strong>Changed by:</strong> {{changedBy}}<br>
      <strong>Date:</strong> {{changeDate}}</p>
      
      {{#if reason}}
      <p><strong>Reason:</strong> {{reason}}</p>
      {{/if}}
      
      <p>Your permissions and access levels have been updated accordingly. If you have any questions about your new role, please contact your organization administrator.</p>
      
      <p style="margin-top: 30px;">
        <a href="{{dashboardUrl}}" style="color: #2196F3;">Go to Dashboard →</a>
      </p>
    </div>
  </div>
</body>
</html>
  `,
  text: `Role Update - {{organizationName}}

Hi {{name}},

Your role in {{organizationName}} has been updated.

Previous Role: {{oldRole}}
New Role: {{newRole}}

Changed by: {{changedBy}}
Date: {{changeDate}}

{{#if reason}}
Reason: {{reason}}
{{/if}}

Your permissions and access levels have been updated accordingly.

Go to Dashboard: {{dashboardUrl}}`,
  requiredData: ['name', 'organizationName', 'oldRole', 'newRole', 'changedBy', 'changeDate', 'dashboardUrl'],
};

export default roleChangeTemplate;