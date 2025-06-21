import {
  getUnifiedEnvConfig,
  getApiUrl,
  getAuthUrl,
  getAuthBaseUrl,
  isOAuthSafe,
  getDatabaseUrl,
  getWebSocketUrl,
  isWebSocketEnabled,
  getRedisUrl,
  getLoggingConfig,
  getPostHogConfig,
  getEmailConfig,
} from '@/lib/core/config/unified-env';

// Mock environment variables
const mockEnv = {
  EXPO_PUBLIC_API_URL: 'https://api.test.com',
  EXPO_PUBLIC_AUTH_URL: 'https://auth.test.com',
  EXPO_PUBLIC_WS_URL: 'wss://ws.test.com',
  EXPO_PUBLIC_ENABLE_WEBSOCKET: 'true',
  DATABASE_URL: 'postgres://user:pass@localhost/testdb',
  REDIS_URL: 'redis://localhost:6379',
  EXPO_PUBLIC_ENABLE_LOGGING: 'true',
  EXPO_PUBLIC_LOG_LEVEL: 'debug',
  EXPO_PUBLIC_POSTHOG_KEY: 'test-posthog-key',
  EXPO_PUBLIC_POSTHOG_HOST: 'https://posthog.test.com',
  EMAIL_FROM: 'test@example.com',
  EMAIL_SERVER: 'smtp://test:pass@smtp.test.com',
};

describe('unified-env', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = process.env;
    // Set mock env
    process.env = { ...mockEnv };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('getUnifiedEnvConfig', () => {
    it('returns complete environment configuration', () => {
      const config = getUnifiedEnvConfig();
      
      expect(config).toHaveProperty('api');
      expect(config).toHaveProperty('auth');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('redis');
      expect(config).toHaveProperty('websocket');
      expect(config).toHaveProperty('logging');
      expect(config).toHaveProperty('posthog');
      expect(config).toHaveProperty('email');
    });

    it('uses default values when env vars are missing', () => {
      process.env = {};
      const config = getUnifiedEnvConfig();
      
      expect(config.api.url).toBe('http://localhost:3000');
      expect(config.auth.url).toBe('http://localhost:3000');
      expect(config.websocket.enabled).toBe(false);
      expect(config.logging.enabled).toBe(false);
    });
  });

  describe('getApiUrl', () => {
    it('returns API URL from environment', () => {
      expect(getApiUrl()).toBe('https://api.test.com');
    });

    it('returns default URL when not set', () => {
      delete process.env.EXPO_PUBLIC_API_URL;
      expect(getApiUrl()).toBe('http://localhost:3000');
    });

    it('removes trailing slash', () => {
      process.env.EXPO_PUBLIC_API_URL = 'https://api.test.com/';
      expect(getApiUrl()).toBe('https://api.test.com');
    });
  });

  describe('getAuthUrl', () => {
    it('returns Auth URL from environment', () => {
      expect(getAuthUrl()).toBe('https://auth.test.com');
    });

    it('falls back to API URL when not set', () => {
      delete process.env.EXPO_PUBLIC_AUTH_URL;
      expect(getAuthUrl()).toBe('https://api.test.com');
    });

    it('handles OAuth-safe URLs for mobile', () => {
      process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.100:3000';
      delete process.env.EXPO_PUBLIC_AUTH_URL;
      const url = getAuthUrl();
      expect(url).toContain('192.168.1.100');
    });
  });

  describe('getAuthBaseUrl', () => {
    it('returns Auth base URL for Better Auth', () => {
      expect(getAuthBaseUrl()).toBe('https://auth.test.com');
    });
  });

  describe('isOAuthSafe', () => {
    it('returns true for HTTPS URLs', () => {
      expect(isOAuthSafe()).toBe(true);
    });

    it('returns true for localhost', () => {
      process.env.EXPO_PUBLIC_AUTH_URL = 'http://localhost:3000';
      expect(isOAuthSafe()).toBe(true);
    });

    it('returns true for IP addresses', () => {
      process.env.EXPO_PUBLIC_AUTH_URL = 'http://192.168.1.100:3000';
      expect(isOAuthSafe()).toBe(true);
    });

    it('returns false for non-secure URLs', () => {
      process.env.EXPO_PUBLIC_AUTH_URL = 'http://example.com';
      expect(isOAuthSafe()).toBe(false);
    });
  });

  describe('getDatabaseUrl', () => {
    it('returns database URL from environment', () => {
      expect(getDatabaseUrl()).toBe('postgres://user:pass@localhost/testdb');
    });

    it('returns default URL when not set', () => {
      delete process.env.DATABASE_URL;
      expect(getDatabaseUrl()).toBe('postgres://postgres:postgres@localhost:5432/hospital_system');
    });
  });

  describe('getWebSocketUrl', () => {
    it('returns WebSocket URL from environment', () => {
      expect(getWebSocketUrl()).toBe('wss://ws.test.com');
    });

    it('derives from API URL when not set', () => {
      delete process.env.EXPO_PUBLIC_WS_URL;
      process.env.EXPO_PUBLIC_API_URL = 'https://api.test.com';
      expect(getWebSocketUrl()).toBe('wss://api.test.com');
    });

    it('handles HTTP to WS conversion', () => {
      delete process.env.EXPO_PUBLIC_WS_URL;
      process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
      expect(getWebSocketUrl()).toBe('ws://localhost:3000');
    });
  });

  describe('isWebSocketEnabled', () => {
    it('returns true when enabled', () => {
      expect(isWebSocketEnabled()).toBe(true);
    });

    it('returns false when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_WEBSOCKET = 'false';
      expect(isWebSocketEnabled()).toBe(false);
    });

    it('returns false by default', () => {
      delete process.env.EXPO_PUBLIC_ENABLE_WEBSOCKET;
      expect(isWebSocketEnabled()).toBe(false);
    });
  });

  describe('getRedisUrl', () => {
    it('returns Redis URL from environment', () => {
      expect(getRedisUrl()).toBe('redis://localhost:6379');
    });

    it('returns default URL when not set', () => {
      delete process.env.REDIS_URL;
      expect(getRedisUrl()).toBe('redis://localhost:6379');
    });
  });

  describe('getLoggingConfig', () => {
    it('returns logging configuration', () => {
      const config = getLoggingConfig();
      expect(config.enabled).toBe(true);
      expect(config.level).toBe('debug');
      expect(config.categories).toEqual([
        'auth',
        'api',
        'trpc',
        'healthcare',
        'websocket',
        'storage',
      ]);
    });

    it('returns default configuration when not set', () => {
      delete process.env.EXPO_PUBLIC_ENABLE_LOGGING;
      delete process.env.EXPO_PUBLIC_LOG_LEVEL;
      
      const config = getLoggingConfig();
      expect(config.enabled).toBe(false);
      expect(config.level).toBe('info');
    });
  });

  describe('getPostHogConfig', () => {
    it('returns PostHog configuration', () => {
      const config = getPostHogConfig();
      expect(config.apiKey).toBe('test-posthog-key');
      expect(config.host).toBe('https://posthog.test.com');
      expect(config.enabled).toBe(true);
    });

    it('disables when API key is missing', () => {
      delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
      const config = getPostHogConfig();
      expect(config.enabled).toBe(false);
    });
  });

  describe('getEmailConfig', () => {
    it('returns email configuration', () => {
      const config = getEmailConfig();
      expect(config.from).toBe('test@example.com');
      expect(config.server).toBe('smtp://test:pass@smtp.test.com');
    });

    it('returns default configuration when not set', () => {
      delete process.env.EMAIL_FROM;
      delete process.env.EMAIL_SERVER;
      
      const config = getEmailConfig();
      expect(config.from).toBe('noreply@hospital-system.com');
      expect(config.server).toBe('');
    });
  });
});