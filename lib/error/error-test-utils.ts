import { useError } from '@/components/providers/ErrorProvider';
import { logger } from '@/lib/core/debug/unified-logger';

/**
 * Error Testing Utilities
 * 
 * These utilities help test various error scenarios during development.
 * Only available in __DEV__ mode.
 */

export interface ErrorScenario {
  type: 'session-timeout' | 'connection-lost' | 'unauthorized' | 'server-error' | 'rate-limit';
  message: string;
  statusCode?: number;
  retryAfter?: number;
}

const ERROR_SCENARIOS: ErrorScenario[] = [
  {
    type: 'session-timeout',
    message: 'Your session has expired. Please sign in again.',
  },
  {
    type: 'connection-lost',
    message: 'Internet connection lost. Please check your network.',
  },
  {
    type: 'unauthorized',
    message: 'You do not have permission to perform this action.',
    statusCode: 401,
  },
  {
    type: 'server-error',
    message: 'Server error occurred. Please try again later.',
    statusCode: 500,
  },
  {
    type: 'rate-limit',
    message: 'Too many requests. Please wait before trying again.',
    statusCode: 429,
    retryAfter: 60,
  },
];

/**
 * Hook for testing error scenarios
 */
export function useErrorTesting() {
  const { setError, clearError } = useError();

  const triggerError = (scenario: ErrorScenario) => {
    if (!__DEV__) {
      logger.warn('Error testing is only available in development mode');
      return;
    }

    logger.info(`Triggering test error: ${scenario.type}`);
    setError({
      type: scenario.type,
      message: scenario.message,
      statusCode: scenario.statusCode,
      retryAfter: scenario.retryAfter,
      requestId: `test-${Date.now()}`,
    });
  };

  const triggerRandomError = () => {
    const scenario = ERROR_SCENARIOS[Math.floor(Math.random() * ERROR_SCENARIOS.length)];
    triggerError(scenario);
  };

  return {
    triggerError,
    triggerRandomError,
    clearError,
    scenarios: ERROR_SCENARIOS,
  };
}

/**
 * Component that throws an error for testing error boundaries
 */
export function ErrorBomb({ 
  message = 'Test error thrown from ErrorBomb component',
  delay = 0,
}: {
  message?: string;
  delay?: number;
}) {
  if (!__DEV__) return null;

  if (delay > 0) {
    setTimeout(() => {
      throw new Error(message);
    }, delay);
    return null;
  }

  throw new Error(message);
}

/**
 * Simulate network conditions for testing
 */
export class NetworkSimulator {
  private static isOffline = false;
  private static latency = 0;
  private static errorRate = 0;

  static setOffline(offline: boolean) {
    if (!__DEV__) return;
    this.isOffline = offline;
    logger.info(`Network simulator: ${offline ? 'OFFLINE' : 'ONLINE'}`);
  }

  static setLatency(ms: number) {
    if (!__DEV__) return;
    this.latency = ms;
    logger.info(`Network simulator: ${ms}ms latency`);
  }

  static setErrorRate(rate: number) {
    if (!__DEV__) return;
    this.errorRate = Math.min(1, Math.max(0, rate));
    logger.info(`Network simulator: ${(this.errorRate * 100).toFixed(0)}% error rate`);
  }

  static async simulateRequest<T>(request: () => Promise<T>): Promise<T> {
    if (!__DEV__) return request();

    // Simulate offline
    if (this.isOffline) {
      throw new Error('Network request failed: No internet connection');
    }

    // Simulate latency
    if (this.latency > 0) {
      await new Promise(resolve => setTimeout(resolve, this.latency));
    }

    // Simulate random errors
    if (this.errorRate > 0 && Math.random() < this.errorRate) {
      const errors = [
        'Network timeout',
        'Server error: 500 Internal Server Error',
        'Connection reset',
        'DNS lookup failed',
      ];
      throw new Error(errors[Math.floor(Math.random() * errors.length)]);
    }

    return request();
  }

  static reset() {
    this.isOffline = false;
    this.latency = 0;
    this.errorRate = 0;
  }
}