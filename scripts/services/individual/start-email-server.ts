#!/usr/bin/env bun

import nodemailer, { createTransport } from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const envPath = join(process.cwd(), '.env.email');
let EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@hospital-alert-system.com';
let EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
let EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
let EMAIL_USER = process.env.EMAIL_USER || '';
let EMAIL_PASS = process.env.EMAIL_PASS || '';

try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      if (key === 'EMAIL_FROM') EMAIL_FROM = value.trim();
      if (key === 'EMAIL_HOST') EMAIL_HOST = value.trim();
      if (key === 'EMAIL_PORT') EMAIL_PORT = parseInt(value.trim());
      if (key === 'EMAIL_USER') EMAIL_USER = value.trim();
      if (key === 'EMAIL_PASS') EMAIL_PASS = value.trim();
    }
  });
} catch (error) {
// TODO: Replace with structured logging - /* console.log('⚠️  No .env.email file found, using environment variables or defaults') */;
}

// TODO: Replace with structured logging - /* console.log('📧 Starting Email Server Test...\n') */;

// Create transporter
const transporter = createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test email configuration
async function testEmailServer() {
  try {
// TODO: Replace with structured logging - /* console.log('🔍 Testing email configuration...') */;
// TODO: Replace with structured logging - /* console.log(`   Host: ${EMAIL_HOST}:${EMAIL_PORT}`) */;
// TODO: Replace with structured logging - /* console.log(`   User: ${EMAIL_USER}`) */;
// TODO: Replace with structured logging - /* console.log(`   From: ${EMAIL_FROM}\n`) */;

    // Verify connection
    await transporter.verify();
// TODO: Replace with structured logging - /* console.log('✅ Email server connection verified!') */;

    // Send test email
// TODO: Replace with structured logging - /* console.log('\n📨 Sending test email...') */;
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_USER, // Send to self for testing
      subject: 'Hospital Alert System - Test Email',
      text: 'This is a test email from the Hospital Alert System.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0284c7;">Hospital Alert System</h2>
          <p>This is a test email to verify your email configuration.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Configuration Details:<br>
            - SMTP Host: ${EMAIL_HOST}<br>
            - SMTP Port: ${EMAIL_PORT}<br>
            - From Address: ${EMAIL_FROM}
          </p>
        </div>
      `
    });

// TODO: Replace with structured logging - /* console.log('✅ Test email sent successfully!') */;
// TODO: Replace with structured logging - /* console.log(`   Message ID: ${info.messageId}`) */;
// TODO: Replace with structured logging - /* console.log(`   Accepted: ${info.accepted.join(', ') */}`);

    // Keep server running
// TODO: Replace with structured logging - /* console.log('\n🚀 Email server is ready for notifications!') */;
// TODO: Replace with structured logging - /* console.log('   Press Ctrl+C to stop the server.\n') */;

    // Simple HTTP server for webhook testing
    const server = Bun.serve({
      port: 3001,
      fetch(req) {
        const url = new URL(req.url);
        
        if (url.pathname === '/health') {
          return new Response('Email server is running', { status: 200 });
        }
        
        if (url.pathname === '/send-test') {
          transporter.sendMail({
            from: EMAIL_FROM,
            to: EMAIL_USER,
            subject: 'Test Alert Notification',
            text: 'This is a test alert notification.',
            html: `
              <div style="font-family: Arial, sans-serif;">
                <h3 style="color: #dc2626;">🚨 Test Alert</h3>
                <p>This is a test alert notification sent at ${new Date().toLocaleString()}</p>
              </div>
            `
          }).then(() => {
// TODO: Replace with structured logging - /* console.log('📤 Test notification sent') */;
          }).catch(err => {
            console.error('❌ Failed to send test notification:', err.message);
          });
          
          return new Response('Test email sent', { status: 200 });
        }
        
        return new Response('Email notification server', { status: 200 });
      }
    });

// TODO: Replace with structured logging - /* console.log(`📡 HTTP server running at http://localhost:${server.port}`) */;
// TODO: Replace with structured logging - /* console.log('   GET /health - Check server status') */;
// TODO: Replace with structured logging - /* console.log('   GET /send-test - Send test notification\n') */;

  } catch (error: any) {
    console.error('❌ Email server error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check your email credentials in .env.email');
    console.error('2. Ensure you have enabled "Less secure app access" or use an App Password');
    console.error('3. Check your firewall settings for SMTP port access');
    process.exit(1);
  }
}

// Run the test
testEmailServer();