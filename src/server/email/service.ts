/**
 * Email Service
 * Handles email sending for healthcare alerts and notifications
 */

import nodemailer from 'nodemailer';
import type { SendMailOptions } from 'nodemailer';

// Simple console logger for Docker environment
const log = {
  info: (message: string, context?: string, data?: any) => {

  },
  error: (message: string, context?: string, error?: any) => {
    console.error(`[ERROR] [${context || 'EMAIL'}] ${message}`, error || '');
  }
};

export interface EmailConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface AlertEmailData {
  to: string;
  alertId: string;
  patientName: string;
  roomNumber: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  hospitalName: string;
  createdAt: Date;
}

export interface EscalationEmailData {
  to: string[];
  alertId: string;
  patientName: string;
  roomNumber: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  hospitalName: string;
  escalationLevel: number;
  previousAssignee: string;
  timeElapsed: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure ?? false,
      auth: config.auth,
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      log.info('Email service connected successfully', 'EMAIL', {
        host: this.config.host,
        port: this.config.port,
      });
    } catch (error) {
      log.error('Email service connection failed', 'EMAIL', error);
    }
  }

  async sendAlertNotification(data: AlertEmailData): Promise<void> {
    const urgencyColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626',
    };

    const urgencyEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Healthcare Alert Notification</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f5;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .card {
              background: white;
              border-radius: 12px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background-color: ${urgencyColors[data.urgency]};
              color: white;
              padding: 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .urgency-badge {
              display: inline-block;
              background: rgba(255, 255, 255, 0.2);
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 500;
              margin-top: 8px;
            }
            .content {
              padding: 32px 24px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 500;
              color: #6b7280;
            }
            .info-value {
              color: #111827;
              font-weight: 500;
            }
            .message-box {
              background: #f9fafb;
              border-left: 4px solid ${urgencyColors[data.urgency]};
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .message-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .action-button {
              display: inline-block;
              background-color: ${urgencyColors[data.urgency]};
              color: white;
              text-decoration: none;
              padding: 12px 32px;
              border-radius: 8px;
              font-weight: 500;
              margin-top: 24px;
            }
            .footer {
              text-align: center;
              padding: 24px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <h1>${urgencyEmoji[data.urgency]} Healthcare Alert</h1>
                <span class="urgency-badge">${data.urgency.toUpperCase()} URGENCY</span>
              </div>
              
              <div class="content">
                <div class="info-row">
                  <span class="info-label">Patient</span>
                  <span class="info-value">${data.patientName}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Room</span>
                  <span class="info-value">${data.roomNumber}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Hospital</span>
                  <span class="info-value">${data.hospitalName}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Alert ID</span>
                  <span class="info-value">#${data.alertId}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Time</span>
                  <span class="info-value">${data.createdAt.toLocaleString()}</span>
                </div>
                
                <div class="message-box">
                  <div class="message-label">Alert Message</div>
                  <div>${data.message}</div>
                </div>
                
                <div style="text-align: center;">
                  <a href="${process.env.APP_URL}/alerts/${data.alertId}" class="action-button">
                    View Alert Details
                  </a>
                </div>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from the Healthcare Alert System</p>
                <p>Please do not reply to this email</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions: SendMailOptions = {
      from: `Healthcare Alerts <${this.config.from}>`,
      to: data.to,
      subject: `${urgencyEmoji[data.urgency]} ${data.urgency.toUpperCase()} Alert - ${data.patientName} - Room ${data.roomNumber}`,
      html,
      text: `
Healthcare Alert Notification

Urgency: ${data.urgency.toUpperCase()}
Patient: ${data.patientName}
Room: ${data.roomNumber}
Hospital: ${data.hospitalName}
Alert ID: #${data.alertId}
Time: ${data.createdAt.toLocaleString()}

Message:
${data.message}

View alert details: ${process.env.APP_URL}/alerts/${data.alertId}

This is an automated notification from the Healthcare Alert System.
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      log.info('Alert email sent', 'EMAIL', {
        messageId: info.messageId,
        to: data.to,
        alertId: data.alertId,
      });
    } catch (error) {
      log.error('Failed to send alert email', 'EMAIL', {
        error,
        to: data.to,
        alertId: data.alertId,
      });
      throw error;
    }
  }

  async sendEscalationNotification(data: EscalationEmailData): Promise<void> {
    const urgencyColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626',
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Alert Escalation Notice</title>
          <style>
            /* Same styles as above */
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f5;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .card {
              background: white;
              border-radius: 12px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .escalation-header {
              background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
              color: white;
              padding: 24px;
              text-align: center;
            }
            .escalation-header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .escalation-badge {
              display: inline-block;
              background: rgba(255, 255, 255, 0.2);
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 500;
              margin-top: 8px;
            }
            .content {
              padding: 32px 24px;
            }
            .warning-box {
              background: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 24px;
              text-align: center;
            }
            .warning-box strong {
              color: #d97706;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="escalation-header">
                <h1>⚠️ ALERT ESCALATION</h1>
                <span class="escalation-badge">LEVEL ${data.escalationLevel} ESCALATION</span>
              </div>
              
              <div class="content">
                <div class="warning-box">
                  <strong>URGENT:</strong> This alert has been escalated after ${data.timeElapsed} without acknowledgment
                </div>
                
                <div class="info-row">
                  <span class="info-label">Patient</span>
                  <span class="info-value">${data.patientName}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Room</span>
                  <span class="info-value">${data.roomNumber}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Hospital</span>
                  <span class="info-value">${data.hospitalName}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Alert Urgency</span>
                  <span class="info-value" style="color: ${urgencyColors[data.urgency]}; font-weight: bold;">
                    ${data.urgency.toUpperCase()}
                  </span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Previously Assigned To</span>
                  <span class="info-value">${data.previousAssignee}</span>
                </div>
                
                <div class="message-box">
                  <div class="message-label">Original Alert Message</div>
                  <div>${data.message}</div>
                </div>
                
                <div style="text-align: center;">
                  <a href="${process.env.APP_URL}/alerts/${data.alertId}" class="action-button" style="background: #dc2626;">
                    Acknowledge Alert Immediately
                  </a>
                </div>
              </div>
              
              <div class="footer">
                <p>⚠️ This is an escalated alert requiring immediate attention</p>
                <p>Please acknowledge this alert as soon as possible</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions: SendMailOptions = {
      from: `Healthcare Alerts - URGENT <${this.config.from}>`,
      to: data.to,
      subject: `⚠️ ESCALATED: ${data.urgency.toUpperCase()} Alert - ${data.patientName} - Room ${data.roomNumber}`,
      priority: 'high',
      html,
      text: `
ALERT ESCALATION NOTICE

WARNING: This alert has been escalated after ${data.timeElapsed} without acknowledgment

Escalation Level: ${data.escalationLevel}
Patient: ${data.patientName}
Room: ${data.roomNumber}
Hospital: ${data.hospitalName}
Alert Urgency: ${data.urgency.toUpperCase()}
Previously Assigned To: ${data.previousAssignee}

Original Alert Message:
${data.message}

IMMEDIATE ACTION REQUIRED

Acknowledge alert: ${process.env.APP_URL}/alerts/${data.alertId}

This is an escalated alert requiring immediate attention.
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      log.info('Escalation email sent', 'EMAIL', {
        messageId: info.messageId,
        to: data.to.join(', '),
        alertId: data.alertId,
        escalationLevel: data.escalationLevel,
      });
    } catch (error) {
      log.error('Failed to send escalation email', 'EMAIL', {
        error,
        to: data.to.join(', '),
        alertId: data.alertId,
        escalationLevel: data.escalationLevel,
      });
      throw error;
    }
  }

  async sendTestEmail(to: string): Promise<void> {
    const mailOptions: SendMailOptions = {
      from: this.config.from,
      to,
      subject: 'Healthcare Alert System - Test Email',
      text: 'This is a test email from the Healthcare Alert System. If you received this, the email service is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Healthcare Alert System</h2>
          <p>This is a test email from the Healthcare Alert System.</p>
          <p>If you received this, the email service is working correctly!</p>
          <hr />
          <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      log.info('Test email sent', 'EMAIL', {
        messageId: info.messageId,
        to,
      });
    } catch (error) {
      log.error('Failed to send test email', 'EMAIL', { error, to });
      throw error;
    }
  }

  async close(): Promise<void> {
    this.transporter.close();
    log.info('Email service closed', 'EMAIL');
  }
}

// Export a factory function
export function createEmailService(config?: Partial<EmailConfig>): EmailService {
  const finalConfig: EmailConfig = {
    host: config?.host || process.env.EMAIL_HOST || 'localhost',
    port: config?.port || parseInt(process.env.EMAIL_PORT || '1025', 10),
    secure: config?.secure || process.env.EMAIL_SECURE === 'true',
    auth: config?.auth || (process.env.EMAIL_USER && process.env.EMAIL_PASS ? {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    } : undefined),
    from: config?.from || process.env.EMAIL_FROM || 'noreply@healthcare-alerts.local',
  };

  return new EmailService(finalConfig);
}