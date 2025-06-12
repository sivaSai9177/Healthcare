import { EmailTemplate } from '../../email';

export const shiftSummaryTemplate: EmailTemplate = {
  name: 'healthcare.shift-summary',
  subject: '📊 Shift Summary - {{shiftDate}}',
  html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; }
    .header { background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .stat-box { background-color: #F5F5F5; padding: 20px; border-radius: 8px; margin: 10px 0; }
    .stat-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .stat-label { color: #666; }
    .stat-value { font-weight: bold; font-size: 18px; }
    .alert-list { margin: 20px 0; }
    .alert-item { background-color: #FFF; border: 1px solid #E0E0E0; padding: 15px; margin: 10px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Shift Summary</h1>
      <p style="margin: 10px 0 0 0;">{{shiftStart}} - {{shiftEnd}}</p>
    </div>
    <div class="content">
      <p>Hi {{name}},</p>
      <p>Here's your shift summary for {{shiftDate}}:</p>
      
      <div class="stat-box">
        <h3 style="margin-top: 0;">Overview</h3>
        <div class="stat-row">
          <span class="stat-label">Total Alerts:</span>
          <span class="stat-value">{{statistics.totalAlerts}}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Acknowledged:</span>
          <span class="stat-value" style="color: #4CAF50;">{{statistics.acknowledged}}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Resolved:</span>
          <span class="stat-value" style="color: #2196F3;">{{statistics.resolved}}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Escalated:</span>
          <span class="stat-value" style="color: #FF9800;">{{statistics.escalated}}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Avg Response Time:</span>
          <span class="stat-value">{{statistics.avgResponseTime}} min</span>
        </div>
      </div>
      
      {{#if topAlerts}}
      <div class="alert-list">
        <h3>Notable Alerts</h3>
        {{#each topAlerts}}
        <div class="alert-item">
          <strong>Room {{this.roomNumber}}</strong> - {{this.alertType}}<br>
          <span style="color: #666; font-size: 14px;">
            {{this.time}} | Response: {{this.responseTime}} min | Status: {{this.status}}
          </span>
        </div>
        {{/each}}
      </div>
      {{/if}}
      
      {{#if handoverNotes}}
      <div style="background-color: #E3F2FD; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Handover Notes</h3>
        <p>{{handoverNotes}}</p>
      </div>
      {{/if}}
      
      <p style="margin-top: 30px;">
        <a href="{{dashboardUrl}}" style="color: #4CAF50;">View Full Dashboard →</a>
      </p>
    </div>
  </div>
</body>
</html>
  `,
  text: `Shift Summary - {{shiftDate}}

Hi {{name}},

Here's your shift summary for {{shiftStart}} - {{shiftEnd}}:

OVERVIEW:
- Total Alerts: {{statistics.totalAlerts}}
- Acknowledged: {{statistics.acknowledged}}
- Resolved: {{statistics.resolved}}
- Escalated: {{statistics.escalated}}
- Avg Response Time: {{statistics.avgResponseTime}} min

{{#if topAlerts}}
NOTABLE ALERTS:
{{#each topAlerts}}
- Room {{this.roomNumber}} - {{this.alertType}}
  {{this.time}} | Response: {{this.responseTime}} min | Status: {{this.status}}
{{/each}}
{{/if}}

{{#if handoverNotes}}
HANDOVER NOTES:
{{handoverNotes}}
{{/if}}

View Full Dashboard: {{dashboardUrl}}`,
  requiredData: ['name', 'shiftDate', 'shiftStart', 'shiftEnd', 'statistics', 'dashboardUrl'],
};

export default shiftSummaryTemplate;