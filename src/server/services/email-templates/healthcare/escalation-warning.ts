import { EmailTemplate } from '../../email';

export const escalationWarningTemplate: EmailTemplate = {
  name: 'healthcare.escalation',
  subject: '⚠️ URGENT: Alert Escalated - Room {{roomNumber}}',
  html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; }
    .header { background: linear-gradient(135deg, #FF4500 0%, #FF6347 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .alert-box { background-color: #FFEBEE; border: 2px solid #FF4500; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; background-color: #FF4500; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; }
    .escalation-info { background-color: #FFF3E0; padding: 15px; border-left: 4px solid #FF6347; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ ALERT ESCALATED</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Immediate Response Required</p>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2 style="margin-top: 0; color: #FF4500;">Room {{roomNumber}} - Level {{escalationLevel}} Alert</h2>
        <p><strong>Alert Type:</strong> {{alertType}}</p>
        <p><strong>Duration:</strong> {{alertDuration}} minutes unacknowledged</p>
        <p><strong>Original Urgency:</strong> Level {{originalUrgency}}</p>
      </div>
      
      <div class="escalation-info">
        <h3 style="margin-top: 0;">Escalation Details:</h3>
        <p><strong>From:</strong> {{fromRole}}</p>
        <p><strong>To:</strong> {{toRole}}</p>
        <p><strong>Reason:</strong> {{escalationReason}}</p>
      </div>
      
      {{#if description}}
      <p><strong>Alert Description:</strong><br>{{description}}</p>
      {{/if}}
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{acknowledgeUrl}}" class="button">Acknowledge Alert Now</a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        <strong>Next Escalation:</strong> This alert will escalate to {{nextLevel}} in {{nextEscalationMinutes}} minutes if not acknowledged.
      </p>
    </div>
  </div>
</body>
</html>
  `,
  text: `ALERT ESCALATED - IMMEDIATE RESPONSE REQUIRED

Room {{roomNumber}} - Level {{escalationLevel}} Alert

Alert Type: {{alertType}}
Duration: {{alertDuration}} minutes unacknowledged
Original Urgency: Level {{originalUrgency}}

ESCALATION DETAILS:
From: {{fromRole}}
To: {{toRole}}
Reason: {{escalationReason}}

{{#if description}}
Alert Description:
{{description}}
{{/if}}

ACKNOWLEDGE NOW: {{acknowledgeUrl}}

Next Escalation: This alert will escalate to {{nextLevel}} in {{nextEscalationMinutes}} minutes if not acknowledged.`,
  requiredData: ['roomNumber', 'escalationLevel', 'alertType', 'alertDuration', 'fromRole', 'toRole', 'acknowledgeUrl'],
};

export default escalationWarningTemplate;