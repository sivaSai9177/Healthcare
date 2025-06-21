#!/usr/bin/env bun
/**
 * Standalone Email Service
 * No React Native imports - pure Node.js/Bun service
 */

const port = parseInt(process.env.EMAIL_SERVICE_PORT || '3001', 10);

// Simple logger that doesn't import React Native
const log = {
  info: (message: string, data?: any) => {

  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  }
};

// Mock email service for now (real implementation would use nodemailer)
const emailService = {
  sendTestEmail: async (to: string) => {
    log.info(`Sending test email to ${to}`);
    // In production, this would use nodemailer or similar
    return Promise.resolve();
  },
  sendAlertNotification: async (data: any) => {
    log.info(`Sending alert notification`, data);
    return Promise.resolve();
  },
  sendEscalationNotification: async (data: any) => {
    log.info(`Sending escalation notification`, data);
    return Promise.resolve();
  },
  close: () => {
    log.info('Email service closing');
  }
};

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    
    // CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    // Handle OPTIONS
    if (method === 'OPTIONS') {
      return new Response(null, { headers, status: 204 });
    }
    
    // Health check endpoint
    if (url.pathname === '/health' && method === 'GET') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        service: 'email', 
        timestamp: new Date().toISOString(),
        note: 'Standalone service without React Native imports'
      }), {
        headers,
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
            headers,
            status: 400
          });
        }
        
        await emailService.sendTestEmail(to);
        return new Response(JSON.stringify({ success: true, message: 'Test email sent (mock)' }), {
          headers,
          status: 200
        });
      } catch (error) {
        log.error('Failed to send test email', error);
        return new Response(JSON.stringify({ error: 'Failed to send test email' }), {
          headers,
          status: 500
        });
      }
    }
    
    // Send alert notification endpoint
    if (url.pathname === '/alert' && method === 'POST') {
      try {
        const data = await req.json();
        await emailService.sendAlertNotification(data);
        return new Response(JSON.stringify({ success: true, message: 'Alert notification sent (mock)' }), {
          headers,
          status: 200
        });
      } catch (error) {
        log.error('Failed to send alert notification', error);
        return new Response(JSON.stringify({ error: 'Failed to send alert notification' }), {
          headers,
          status: 500
        });
      }
    }
    
    // Send escalation notification endpoint
    if (url.pathname === '/escalation' && method === 'POST') {
      try {
        const data = await req.json();
        await emailService.sendEscalationNotification(data);
        return new Response(JSON.stringify({ success: true, message: 'Escalation notification sent (mock)' }), {
          headers,
          status: 200
        });
      } catch (error) {
        log.error('Failed to send escalation notification', error);
        return new Response(JSON.stringify({ error: 'Failed to send escalation notification' }), {
          headers,
          status: 500
        });
      }
    }
    
    // Default response
    return new Response(JSON.stringify({
      service: 'Healthcare Alert Email Service (Standalone)',
      endpoints: {
        health: '/health',
        test: '/test',
        alert: '/alert',
        escalation: '/escalation'
      }
    }), { headers, status: 200 });
  }
});

log.info(`Email service (standalone) listening on port ${server.port}`);
log.info('Available endpoints:', {
  health: `http://localhost:${server.port}/health`,
  test: `http://localhost:${server.port}/test`,
  alert: `http://localhost:${server.port}/alert`,
  escalation: `http://localhost:${server.port}/escalation`
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully');
  emailService.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  log.info('SIGINT received, shutting down gracefully');
  emailService.close();
  process.exit(0);
});