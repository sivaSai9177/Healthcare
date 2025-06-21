/**
 * PostHog Analytics Service
 * Server-side analytics tracking with Bun runtime
 */

import { PostHog } from 'posthog-node';
// Use console logging instead of unified logger to avoid LogCategory type issues
const logger = {
  info: (message: string, category: string, data?: any) => {

  },
  debug: (message: string, category: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {

    }
  },
  error: (message: string, category: string, error?: any) => {
    console.error(`[${category}] ${message}`, error || '');
  }
};

interface PostHogEvent {
  event: string;
  distinctId: string;
  properties?: Record<string, any>;
}

interface PostHogIdentify {
  distinctId: string;
  properties?: Record<string, any>;
}

export class PostHogService {
  private client: PostHog | null = null;
  private enabled: boolean;
  private queue: PostHogEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.enabled = process.env.POSTHOG_ENABLED === 'true' && !!process.env.POSTHOG_API_KEY;
    
    if (this.enabled) {
      try {
        this.client = new PostHog(process.env.POSTHOG_API_KEY!, {
          host: process.env.POSTHOG_API_HOST || 'https://app.posthog.com',
          flushAt: 20,
          flushInterval: 10000, // 10 seconds
        });
        
        logger.info('PostHog analytics initialized', 'POSTHOG', {
          host: process.env.POSTHOG_API_HOST,
        });

        // Start flush timer
        this.startFlushTimer();
      } catch (error) {
        logger.error('Failed to initialize PostHog', 'POSTHOG', error);
        this.enabled = false;
      }
    } else {
      logger.info('PostHog analytics disabled', 'POSTHOG');
    }
  }

  /**
   * Track an event
   */
  async capture(event: string, distinctId: string, properties?: Record<string, any>) {
    if (!this.client || !this.enabled) return;

    try {
      this.client.capture({
        distinctId,
        event,
        properties: {
          ...properties,
          $lib: 'hospital-alert-system',
          $lib_version: '1.0.0',
          runtime: 'bun',
          server_side: true,
        },
        timestamp: new Date(),
      });

      logger.debug('PostHog event captured', 'POSTHOG', { event, distinctId });
    } catch (error) {
      logger.error('PostHog capture failed', 'POSTHOG', error);
    }
  }

  /**
   * Identify a user
   */
  async identify(distinctId: string, properties?: Record<string, any>) {
    if (!this.client || !this.enabled) return;

    try {
      this.client.identify({
        distinctId,
        properties: {
          ...properties,
          identified_at: new Date().toISOString(),
        },
      });

      logger.debug('PostHog user identified', 'POSTHOG', { distinctId });
    } catch (error) {
      logger.error('PostHog identify failed', 'POSTHOG', error);
    }
  }

  /**
   * Create an alias for a user
   */
  async alias(distinctId: string, alias: string) {
    if (!this.client || !this.enabled) return;

    try {
      this.client.alias({
        distinctId,
        alias,
      });

      logger.debug('PostHog alias created', 'POSTHOG', { distinctId, alias });
    } catch (error) {
      logger.error('PostHog alias failed', 'POSTHOG', error);
    }
  }

  /**
   * Track API performance
   */
  async trackApiPerformance(
    procedure: string,
    duration: number,
    success: boolean,
    userId?: string
  ) {
    await this.capture(
      'api_call',
      userId || 'anonymous',
      {
        procedure,
        duration,
        success,
        performance_rating: duration < 100 ? 'fast' : 
                          duration < 500 ? 'normal' : 'slow',
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Track errors
   */
  async trackError(
    error: Error | string,
    context: Record<string, any>,
    userId?: string
  ) {
    await this.capture(
      'error_occurred',
      userId || 'anonymous',
      {
        error_message: error instanceof Error ? error.message : error,
        error_stack: error instanceof Error ? error.stack : undefined,
        context,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(
    feature: string,
    action: string,
    userId: string,
    metadata?: Record<string, any>
  ) {
    await this.capture(
      `feature_${feature}_${action}`,
      userId,
      {
        feature,
        action,
        ...metadata,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Batch capture events
   */
  async batchCapture(events: PostHogEvent[]) {
    if (!this.client || !this.enabled) return;

    for (const event of events) {
      await this.capture(event.event, event.distinctId, event.properties);
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer() {
    if (!this.client) return;

    this.flushTimer = setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  /**
   * Flush pending events
   */
  async flush() {
    if (!this.client) return;

    try {
      await this.client.flush();
      logger.debug('PostHog events flushed', 'POSTHOG');
    } catch (error) {
      logger.error('PostHog flush failed', 'POSTHOG', error);
    }
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.client) {
      try {
        await this.client.shutdown();
        logger.info('PostHog service shutdown complete', 'POSTHOG');
      } catch (error) {
        logger.error('PostHog shutdown failed', 'POSTHOG', error);
      }
    }
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
export const posthogService = new PostHogService();

// Ensure proper shutdown
process.on('SIGTERM', async () => {
  await posthogService.shutdown();
});

process.on('SIGINT', async () => {
  await posthogService.shutdown();
});

// Export convenience functions
export const trackEvent = posthogService.capture.bind(posthogService);
export const identifyUser = posthogService.identify.bind(posthogService);
export const trackApiPerformance = posthogService.trackApiPerformance.bind(posthogService);
export const trackError = posthogService.trackError.bind(posthogService);
export const trackFeatureUsage = posthogService.trackFeatureUsage.bind(posthogService);