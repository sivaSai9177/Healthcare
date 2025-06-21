/**
 * Unified Logging Configuration
 * Central configuration for all logging components
 */

export interface LoggingConfig {
  // Service Configuration
  enabled: boolean;
  serviceUrl: string;
  batchSize: number;
  flushInterval: number;
  retryAttempts: number;
  retryDelay: number;
  
  // Log Levels
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enabledCategories: string[];
  
  // Feature Flags
  enableTRPCLogging: boolean;
  enableRouterLogging: boolean;
  enableAuthLogging: boolean;
  enableWebSocketLogging: boolean;
  enableHealthcareLogging: boolean;
  enablePerformanceLogging: boolean;
  
  // CORS Configuration
  allowedOrigins: string[];
  
  // Development
  debugMode: boolean;
  consoleOutput: boolean;
}

// Default configuration
const defaultConfig: LoggingConfig = {
  // Service Configuration
  enabled: process.env.LOGGING_SERVICE_ENABLED === 'true',
  serviceUrl: process.env.LOGGING_SERVICE_URL || 'http://localhost:3003',
  batchSize: parseInt(process.env.LOGGING_BATCH_SIZE || '50'),
  flushInterval: parseInt(process.env.LOGGING_FLUSH_INTERVAL || '5000'),
  retryAttempts: 3,
  retryDelay: 1000,
  
  // Log Levels
  logLevel: (process.env.EXPO_PUBLIC_LOG_LEVEL as any) || 'info',
  enabledCategories: ['*'], // All categories by default
  
  // Feature Flags - Read from debug store or env
  enableTRPCLogging: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  enableRouterLogging: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  enableAuthLogging: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  enableWebSocketLogging: process.env.EXPO_PUBLIC_ENABLE_WS === 'true',
  enableHealthcareLogging: true,
  enablePerformanceLogging: process.env.NODE_ENV === 'production',
  
  // CORS Configuration
  allowedOrigins: [
    'http://localhost:8081',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    ...(process.env.EXPO_PUBLIC_API_URL ? [process.env.EXPO_PUBLIC_API_URL] : []),
  ],
  
  // Development
  debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  consoleOutput: process.env.NODE_ENV !== 'production',
};

// Configuration manager
class LoggingConfigManager {
  private config: LoggingConfig;
  
  constructor() {
    this.config = { ...defaultConfig };
  }
  
  /**
   * Get current configuration
   */
  getConfig(): LoggingConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(updates: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...updates };
  }
  
  /**
   * Check if a log level is enabled
   */
  isLevelEnabled(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    const levelIndex = levels.indexOf(level);
    return levelIndex >= configLevelIndex;
  }
  
  /**
   * Check if a category is enabled
   */
  isCategoryEnabled(category: string): boolean {
    if (this.config.enabledCategories.includes('*')) return true;
    return this.config.enabledCategories.includes(category);
  }
  
  /**
   * Get CORS headers
   */
  getCORSHeaders(origin?: string): Record<string, string> {
    const isAllowed = !origin || 
                     this.config.allowedOrigins.includes('*') || 
                     this.config.allowedOrigins.includes(origin);
    
    return {
      'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : this.config.allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Batch-ID, X-Retry-Count',
      'Access-Control-Max-Age': '86400',
    };
  }
}

// Export singleton instance
export const loggingConfig = new LoggingConfigManager();

// Helper function to check if external logging is enabled
export function isExternalLoggingEnabled(): boolean {
  const config = loggingConfig.getConfig();
  return config.enabled && !!config.serviceUrl;
}

// Helper function for retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = loggingConfig.getConfig().retryAttempts,
  delay: number = loggingConfig.getConfig().retryDelay
): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) {
        console.error('Failed after all retries:', error);
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  return null;
}