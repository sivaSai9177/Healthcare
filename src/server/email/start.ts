#!/usr/bin/env tsx
/**
 * Email Service Entry Point
 * Starts the email service for healthcare alerts using Bun
 */

import { createEmailService, EmailService } from './service';

// Simple console logger for Docker environment
const log = {
  info: (message: string, context?: string, data?: any) => {

  },
  error: (message: string, context?: string, error?: any) => {
    console.error(`[ERROR] [${context || 'EMAIL'}] ${message}`, error || '');
  }
};

// Initialize email service
let emailService: EmailService;

try {
  emailService = createEmailService();
  log.info('Email service initialized', 'EMAIL_START');
} catch (error) {
  log.error('Failed to initialize email service', 'EMAIL_START', error);
  process.exit(1);
}

// Start the server
const port = parseInt(process.env.EMAIL_SERVICE_PORT || '3001', 10);

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    
    // Health check endpoint
    if (url.pathname === '/health' && method === 'GET') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        service: 'email', 
        timestamp: new Date().toISOString() 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // Send test email endpoint
    if (url.pathname === '/test' && method === 'POST') {
      try {
        const body = await req.json();
        const { to } = body;
        
        if (!to) {
          return new Response(JSON.stringify({ error: 'Missing "to" field' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400
          });
        }
        
        await emailService.sendTestEmail(to);
        return new Response(JSON.stringify({ success: true, message: 'Test email sent' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        });
      } catch (error) {
        log.error('Failed to send test email', 'EMAIL_API', error);
        return new Response(JSON.stringify({ error: 'Failed to send test email' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }
    
    // Send alert notification endpoint
    if (url.pathname === '/alert' && method === 'POST') {
      try {
        const data = await req.json();
        
        // Validate required fields
        const requiredFields = ['to', 'alertId', 'patientName', 'roomNumber', 'urgency', 'message', 'hospitalName', 'createdAt'];
        for (const field of requiredFields) {
          if (!data[field]) {
            return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
              headers: { 'Content-Type': 'application/json' },
              status: 400
            });
          }
        }
        
        // Convert createdAt string to Date
        data.createdAt = new Date(data.createdAt);
        
        await emailService.sendAlertNotification(data);
        return new Response(JSON.stringify({ success: true, message: 'Alert notification sent' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        });
      } catch (error) {
        log.error('Failed to send alert notification', 'EMAIL_API', error);
        return new Response(JSON.stringify({ error: 'Failed to send alert notification' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }
    
    // Send escalation notification endpoint
    if (url.pathname === '/escalation' && method === 'POST') {
      try {
        const data = await req.json();
        
        // Validate required fields
        const requiredFields = ['to', 'alertId', 'patientName', 'roomNumber', 'urgency', 'message', 'hospitalName', 'escalationLevel', 'previousAssignee', 'timeElapsed'];
        for (const field of requiredFields) {
          if (!data[field]) {
            return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
              headers: { 'Content-Type': 'application/json' },
              status: 400
            });
          }
        }
        
        // Ensure 'to' is an array
        if (!Array.isArray(data.to)) {
          data.to = [data.to];
        }
        
        await emailService.sendEscalationNotification(data);
        return new Response(JSON.stringify({ success: true, message: 'Escalation notification sent' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        });
      } catch (error) {
        log.error('Failed to send escalation notification', 'EMAIL_API', error);
        return new Response(JSON.stringify({ error: 'Failed to send escalation notification' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }
    
    // Default response
    return new Response('Healthcare Alert Email Service', { status: 200 });
  }
});

log.info(`Email service listening on port ${server.port}`, 'EMAIL_START');
log.info('Endpoints:', 'EMAIL_START', {
  health: `http://localhost:${server.port}/health`,
  test: `http://localhost:${server.port}/test`,
  alert: `http://localhost:${server.port}/alert`,
  escalation: `http://localhost:${server.port}/escalation`
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully', 'EMAIL_START');
  emailService.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  log.info('SIGINT received, shutting down gracefully', 'EMAIL_START');
  emailService.close();
  process.exit(0);
});