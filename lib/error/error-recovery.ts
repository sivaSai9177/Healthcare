import { logger } from '@/lib/core/debug/unified-logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  factor: 2,
  onRetry: () => {},
  shouldRetry: (error) => {
    // Retry on network errors and 5xx status codes
    const message = error.message.toLowerCase();
    const errorName = error.name?.toLowerCase() || '';
    
    // Don't retry connectivity check errors
    const connectivityUrls = [
      'clients3.google.com/generate_204',
      'connectivitycheck.gstatic.com',
      'captive.apple.com',
    ];
    const isConnectivityCheck = connectivityUrls.some(url => 
      message.includes(url.toLowerCase())
    );
    if (isConnectivityCheck) {
      return false;
    }
    
    return (
      message.includes('network') ||
      message.includes('fetch failed') ||
      message.includes('timeout') ||
      errorName === 'aborterror' || // Include AbortError for retry
      message.includes('aborted') ||
      (message.includes('50') && (message.includes('status') || message.includes('error')))
    );
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === opts.maxRetries || !opts.shouldRetry(lastError)) {
        throw lastError;
      }
      
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.factor, attempt),
        opts.maxDelay
      );
      
      logger.warn(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms`, {
        error: lastError.message,
      });
      
      opts.onRetry(attempt + 1, lastError);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export class NetworkRecovery {
  private static instance: NetworkRecovery;
  private isOnline = true;
  private offlineQueue: (() => Promise<any>)[] = [];
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  static getInstance(): NetworkRecovery {
    if (!NetworkRecovery.instance) {
      NetworkRecovery.instance = new NetworkRecovery();
    }
    return NetworkRecovery.instance;
  }

  private constructor() {
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    if (typeof window !== 'undefined' && 'addEventListener' in window) {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  private handleOnline() {
    logger.info('Network connection restored');
    this.isOnline = true;
    this.notifyListeners(true);
    this.processOfflineQueue();
  }

  private handleOffline() {
    logger.warn('Network connection lost');
    this.isOnline = false;
    this.notifyListeners(false);
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(listener => listener(isOnline));
  }

  private async processOfflineQueue() {
    logger.info(`Processing ${this.offlineQueue.length} queued operations`);
    
    while (this.offlineQueue.length > 0) {
      const operation = this.offlineQueue.shift()!;
      try {
        await operation();
      } catch (error) {
        logger.error('Failed to process queued operation:', error);
      }
    }
  }

  public onNetworkChange(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public queueForOffline<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOnline) {
      return operation();
    }
    
    return new Promise((resolve, reject) => {
      this.offlineQueue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      logger.info('Operation queued for offline execution');
    });
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }
}

// Circuit breaker pattern for preventing repeated failures
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold = 5,
    private timeout = 60000, // 1 minute
    private resetTimeout = 120000 // 2 minutes
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
        logger.info('Circuit breaker entering half-open state');
      } else {
        throw new Error('Circuit breaker is open - service unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === 'half-open') {
      logger.info('Circuit breaker closing after successful request');
    }
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
      logger.error(`Circuit breaker opened after ${this.failures} failures`);
      
      // Auto-reset after timeout
      setTimeout(() => {
        this.reset();
      }, this.resetTimeout);
    }
  }

  reset() {
    this.failures = 0;
    this.state = 'closed';
    logger.info('Circuit breaker reset');
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}