import { EmailTemplate } from '../../email';

export const alertNotificationTemplate: EmailTemplate = {
  name: 'healthcare.alert',
  subject: '🚨 Healthcare Alert: Room {{roomNumber}} - {{alertType}}',
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Healthcare Alert</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .alert-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      margin-top: 10px;
    }
    .content {
      padding: 30px 20px;
    }
    .alert-box {
      background-color: #FFF0F5;
      border: 2px solid #FF1493;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .alert-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #FFD1DC;
    }
    .alert-row:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    .alert-label {
      font-weight: 600;
      color: #666;
    }
    .alert-value {
      font-weight: 500;
      color: #333;
    }
    .urgency-level {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 600;
    }
    .urgency-5 { background-color: #FF0000; color: white; }
    .urgency-4 { background-color: #FF4500; color: white; }
    .urgency-3 { background-color: #FFA500; color: white; }
    .urgency-2 { background-color: #FFD700; color: #333; }
    .urgency-1 { background-color: #90EE90; color: #333; }
    .description {
      background-color: #F8F8F8;
      border-left: 4px solid #FF1493;
      padding: 15px;
      margin: 20px 0;
      font-style: italic;
    }
    .action-button {
      display: inline-block;
      background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%);
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .action-button:hover {
      opacity: 0.9;
    }
    .footer {
      background-color: #F8F8F8;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer a {
      color: #FF1493;
      text-decoration: none;
    }
    .timestamp {
      color: #999;
      font-size: 14px;
      margin-top: 10px;
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .header h1 {
        font-size: 24px;
      }
      .content {
        padding: 20px 15px;
      }
      .alert-row {
        flex-direction: column;
      }
      .alert-label {
        margin-bottom: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Healthcare Alert</h1>
      <div class="alert-badge">Immediate Attention Required</div>
    </div>
    
    <div class="content">
      <div class="alert-box">
        <div class="alert-row">
          <span class="alert-label">Room Number:</span>
          <span class="alert-value" style="font-size: 20px; color: #FF1493;">{{roomNumber}}</span>
        </div>
        
        <div class="alert-row">
          <span class="alert-label">Alert Type:</span>
          <span class="alert-value">{{alertType}}</span>
        </div>
        
        <div class="alert-row">
          <span class="alert-label">Urgency Level:</span>
          <span class="urgency-level urgency-{{urgencyLevel}}">Level {{urgencyLevel}}</span>
        </div>
        
        {{#if patientName}}
        <div class="alert-row">
          <span class="alert-label">Patient:</span>
          <span class="alert-value">{{patientName}}</span>
        </div>
        {{/if}}
        
        {{#if createdByName}}
        <div class="alert-row">
          <span class="alert-label">Reported By:</span>
          <span class="alert-value">{{createdByName}}</span>
        </div>
        {{/if}}
      </div>
      
      {{#if description}}
      <div class="description">
        <strong>Description:</strong><br>
        {{description}}
      </div>
      {{/if}}
      
      <div style="text-align: center;">
        <a href="{{acknowledgeUrl}}" class="action-button">
          Acknowledge Alert
        </a>
      </div>
      
      <div class="timestamp">
        Alert created at: {{createdAt}}
      </div>
      
      {{#if escalationWarning}}
      <div style="background-color: #FFF3CD; border: 1px solid #FFE69C; padding: 15px; margin-top: 20px; border-radius: 8px;">
        <strong style="color: #856404;">⚠️ Escalation Warning:</strong><br>
        This alert will escalate to the next level in {{escalationMinutes}} minutes if not acknowledged.
      </div>
      {{/if}}
    </div>
    
    <div class="footer">
      <p>This is an automated alert from the Hospital Alert System.</p>
      <p>
        <a href="{{dashboardUrl}}">Go to Dashboard</a> | 
        <a href="{{unsubscribeUrl}}">Manage Notifications</a>
      </p>
      <p style="margin-top: 15px; font-size: 11px; color: #999;">
        Hospital Alert System - Keeping healthcare teams connected<br>
        © 2025 Hospital Alert System. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `,
  text: `
HEALTHCARE ALERT - IMMEDIATE ATTENTION REQUIRED

Room Number: {{roomNumber}}
Alert Type: {{alertType}}
Urgency Level: {{urgencyLevel}}/5
{{#if patientName}}Patient: {{patientName}}{{/if}}
{{#if createdByName}}Reported By: {{createdByName}}{{/if}}

{{#if description}}
Description:
{{description}}
{{/if}}

ACKNOWLEDGE THIS ALERT:
{{acknowledgeUrl}}

Alert created at: {{createdAt}}

{{#if escalationWarning}}
WARNING: This alert will escalate to the next level in {{escalationMinutes}} minutes if not acknowledged.
{{/if}}

---
This is an automated alert from the Hospital Alert System.
To manage your notification preferences, visit: {{unsubscribeUrl}}
  `,
  requiredData: ['roomNumber', 'alertType', 'urgencyLevel', 'acknowledgeUrl', 'dashboardUrl', 'unsubscribeUrl', 'createdAt'],
};

export default alertNotificationTemplate;