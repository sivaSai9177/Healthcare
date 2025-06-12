// Mock email service for React Native environment
import { log } from '@/lib/core/debug/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  html?: string;
  text?: string;
  data?: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class MockEmailService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    log.info('EMAIL', 'Mock email service initialized for React Native');
    this.isInitialized = true;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    log.info('EMAIL', 'Mock email send:', { to: options.to, subject: options.subject });
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    log.info('EMAIL', 'Mock welcome email:', { email, name });
    return true;
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    log.info('EMAIL', 'Mock password reset email:', { email });
    return true;
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    log.info('EMAIL', 'Mock verification email:', { email });
    return true;
  }

  async sendAlertNotification(data: any): Promise<boolean> {
    log.info('EMAIL', 'Mock alert notification:', data);
    return true;
  }

  async sendEscalationWarning(data: any): Promise<boolean> {
    log.info('EMAIL', 'Mock escalation warning:', data);
    return true;
  }

  async sendShiftSummary(data: any): Promise<boolean> {
    log.info('EMAIL', 'Mock shift summary:', data);
    return true;
  }

  async sendOrganizationInvite(data: any): Promise<boolean> {
    log.info('EMAIL', 'Mock organization invite:', data);
    return true;
  }

  async sendRoleChangeNotification(data: any): Promise<boolean> {
    log.info('EMAIL', 'Mock role change notification:', data);
    return true;
  }

  getQueueStats() {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }

  async clearQueue(): Promise<void> {
    log.info('EMAIL', 'Mock queue cleared');
  }

  async retryFailedJobs(): Promise<void> {
    log.info('EMAIL', 'Mock retry failed jobs');
  }

  async shutdown(): Promise<void> {
    log.info('EMAIL', 'Mock email service shutdown');
  }
}

export const emailService = new MockEmailService();
emailService.initialize().catch(err => {
  log.error('EMAIL', 'Failed to initialize mock email service', err);
});