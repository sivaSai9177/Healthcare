import { log } from '@/lib/core/debug/logger';
import { z } from 'zod';
import { db } from '@/src/db';
import { notificationLogs } from '@/src/db/notification-schema';

// SMS validation schemas
const PhoneNumberSchema = z.string().regex(
  /^\+?[1-9]\d{1,14}$/,
  'Invalid phone number format. Use E.164 format (e.g., +1234567890)'
);

const SMSOptionsSchema = z.object({
  to: PhoneNumberSchema,
  message: z.string().min(1).max(1600), // SMS character limit
  priority: z.enum(['high', 'normal']).default('normal'),
  // Tracking fields
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  notificationType: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  // Advanced options for future
  mediaUrl: z.string().url().optional(), // For MMS
  statusCallback: z.string().url().optional(),
  maxPrice: z.number().optional(),
  validityPeriod: z.number().optional(),
});

export type SMSOptions = z.infer<typeof SMSOptionsSchema>;

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
  segments?: number;
  timestamp: Date;
}

export interface SMSProvider {
  send(options: SMSOptions): Promise<SMSResult>;
  getBalance(): Promise<number>;
  validateNumber(phone: string): Promise<boolean>;
}

// Rate limiting for SMS (more strict due to cost)
interface SMSRateLimit {
  perUser: { max: number; window: number };
  perOrganization: { max: number; window: number };
  global: { max: number; window: number };
}

class SMSService {
  private provider: SMSProvider | null = null;
  private _isConfigured = false;
  private rateLimits: Map<string, { count: number; resetAt: Date }> = new Map();
  
  // Configurable rate limits
  private limits: SMSRateLimit = {
    perUser: { max: 10, window: 3600000 }, // 10 per hour
    perOrganization: { max: 100, window: 3600000 }, // 100 per hour
    global: { max: 1000, window: 3600000 }, // 1000 per hour
  };

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Check if Twilio credentials are configured
    const hasCredentials = Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
    );

    if (hasCredentials) {
      // Future: Initialize Twilio provider
      // this.provider = new TwilioProvider(credentials);
      // this._isConfigured = true;
      log.info('SMS service detected Twilio credentials (implementation pending)', 'SMS');
    } else {
      log.info('SMS service running in mock mode (no Twilio credentials)', 'SMS');
    }

    // For now, use mock provider
    this.provider = new MockSMSProvider();
    this._isConfigured = false;
  }

  // Check if SMS is properly configured
  isConfigured(): boolean {
    return this._isConfigured;
  }

  // Validate phone number format
  validateNumber(phone: string): boolean {
    try {
      PhoneNumberSchema.parse(phone);
      return true;
    } catch {
      return false;
    }
  }

  // Format phone number to E.164
  formatNumber(phone: string, defaultCountryCode = '+1'): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (!phone.startsWith('+')) {
      if (cleaned.length === 10) {
        // Assume US number
        cleaned = '1' + cleaned;
      }
      return defaultCountryCode.replace(/\D/g, '') + cleaned;
    }
    
    return '+' + cleaned;
  }

  // Check rate limits
  private checkRateLimit(key: string, limit: { max: number; window: number }): boolean {
    const now = new Date();
    const info = this.rateLimits.get(key);
    
    if (!info || info.resetAt < now) {
      this.rateLimits.set(key, {
        count: 1,
        resetAt: new Date(now.getTime() + limit.window),
      });
      return true;
    }
    
    if (info.count >= limit.max) {
      return false;
    }
    
    info.count++;
    return true;
  }

  // Calculate SMS segments
  private calculateSegments(message: string): number {
    const length = message.length;
    
    // GSM 7-bit encoding
    if (this.isGSM7Bit(message)) {
      if (length <= 160) return 1;
      return Math.ceil(length / 153); // Multi-part messages
    }
    
    // Unicode encoding
    if (length <= 70) return 1;
    return Math.ceil(length / 67); // Multi-part Unicode messages
  }

  // Check if message uses only GSM 7-bit characters
  private isGSM7Bit(text: string): boolean {
    const gsm7BitRegex = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-.\/:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà\s\n\r]*$/;
    return gsm7BitRegex.test(text);
  }

  // Estimate cost (placeholder for actual pricing)
  private estimateCost(segments: number, destination: string): number {
    // Basic cost estimation (would be provider-specific)
    const baseRate = 0.01; // $0.01 per segment
    const internationalMultiplier = destination.startsWith('+1') ? 1 : 1.5;
    return segments * baseRate * internationalMultiplier;
  }

  // Main send method
  async send(options: SMSOptions): Promise<SMSResult> {
    try {
      // Validate options
      SMSOptionsSchema.parse(options);

      // Check if service is available
      if (!this.provider) {
        throw new Error('SMS service not initialized');
      }

      // Format phone number
      const formattedTo = this.formatNumber(options.to);
      if (!this.validateNumber(formattedTo)) {
        throw new Error(`Invalid phone number: ${options.to}`);
      }

      // Check rate limits
      const rateLimitKeys = [
        { key: `user:${options.userId}`, limit: this.limits.perUser },
        { key: `org:${options.organizationId}`, limit: this.limits.perOrganization },
        { key: 'global', limit: this.limits.global },
      ].filter(({ key }) => key !== 'user:undefined' && key !== 'org:undefined');

      for (const { key, limit } of rateLimitKeys) {
        if (!this.checkRateLimit(key, limit)) {
          throw new Error(`SMS rate limit exceeded for ${key}`);
        }
      }

      // Calculate message details
      const segments = this.calculateSegments(options.message);
      const estimatedCost = this.estimateCost(segments, formattedTo);

      // Check cost limits
      if (options.maxPrice && estimatedCost > options.maxPrice) {
        throw new Error(`Estimated cost ${estimatedCost} exceeds max price ${options.maxPrice}`);
      }

      // Send via provider
      const result = await this.provider.send({
        ...options,
        to: formattedTo,
      });

      // Log to database
      await this.logSMS({
        ...options,
        to: formattedTo,
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId,
        error: result.error,
        segments,
        cost: result.cost || estimatedCost,
      });

      log.info('SMS sent', 'SMS', {
        to: this.maskPhoneNumber(formattedTo),
        segments,
        messageId: result.messageId,
      });

      return {
        ...result,
        segments,
        cost: result.cost || estimatedCost,
      };
    } catch (error) {
      log.error('Failed to send SMS', 'SMS', error);
      
      // Log failure
      await this.logSMS({
        ...options,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  // Send bulk SMS
  async sendBatch(messages: SMSOptions[]): Promise<SMSResult[]> {
    const results: SMSResult[] = [];
    
    // Process with rate limiting
    for (const message of messages) {
      try {
        const result = await this.send(message);
        results.push(result);
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }
    
    return results;
  }

  // Log SMS to database
  private async logSMS(data: any): Promise<void> {
    try {
      await db.insert(notificationLogs).values({
        channel: 'sms',
        type: data.notificationType || 'general',
        userId: data.userId,
        organizationId: data.organizationId,
        status: data.status,
        sentAt: data.status === 'sent' ? new Date() : null,
        failedAt: data.status === 'failed' ? new Date() : null,
        error: data.error,
        metadata: {
          to: this.maskPhoneNumber(data.to),
          messageId: data.messageId,
          segments: data.segments,
          cost: data.cost,
          priority: data.priority,
          ...data.metadata,
        },
      });
    } catch (error) {
      log.error('Failed to log SMS', 'SMS', error);
    }
  }

  // Mask phone number for logs
  private maskPhoneNumber(phone: string): string {
    if (phone.length <= 4) return '****';
    return phone.substring(0, 3) + '*'.repeat(phone.length - 6) + phone.substring(phone.length - 3);
  }

  // Get provider balance (for monitoring)
  async getBalance(): Promise<number | null> {
    if (!this.provider) return null;
    
    try {
      return await this.provider.getBalance();
    } catch (error) {
      log.error('Failed to get SMS balance', 'SMS', error);
      return null;
    }
  }

  // Get usage statistics
  async getUsageStats(timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      // Query notification logs for SMS usage
      // This would be implemented with proper database queries
      return {
        sent: 0,
        failed: 0,
        cost: 0,
        segments: 0,
      };
    } catch (error) {
      log.error('Failed to get SMS usage stats', 'SMS', error);
      return null;
    }
  }
}

// Mock SMS Provider for development/testing
class MockSMSProvider implements SMSProvider {
  async send(options: SMSOptions): Promise<SMSResult> {
    log.info('Mock SMS Provider: Would send SMS', 'SMS_MOCK', {
      to: options.to,
      messageLength: options.message.length,
      priority: options.priority,
    });

    // Simulate random success/failure for testing
    const success = Math.random() > 0.1; // 90% success rate
    
    if (!success) {
      return {
        success: false,
        error: 'Mock provider simulated failure',
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cost: 0.01,
      segments: Math.ceil(options.message.length / 160),
      timestamp: new Date(),
    };
  }

  async getBalance(): Promise<number> {
    return 100.00; // Mock balance
  }

  async validateNumber(phone: string): Promise<boolean> {
    // Basic validation in mock mode
    return /^\+?[1-9]\d{1,14}$/.test(phone);
  }
}

// Export singleton instance
export const smsService = new SMSService();

// Export types
export type { SMSService };