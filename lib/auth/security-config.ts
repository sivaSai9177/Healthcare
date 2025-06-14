/**
 * Centralized security configuration for Better Auth
 * This file contains all security-related settings and best practices
 */

import { Platform } from 'react-native';

// Environment-based security settings
export const securityConfig = {
  // Session configuration
  session: {
    // Session duration
    maxAge: {
      default: 7 * 24 * 60 * 60, // 7 days in seconds
      rememberMe: 30 * 24 * 60 * 60, // 30 days in seconds
      admin: 8 * 60 * 60, // 8 hours for admin users
    },
    // Session refresh settings
    refresh: {
      updateAge: 24 * 60 * 60, // Refresh session if older than 1 day
      threshold: 5 * 60, // Refresh if expires in less than 5 minutes
    },
    // Idle timeout (in milliseconds)
    idleTimeout: {
      enabled: process.env.NODE_ENV === 'production',
      duration: 30 * 60 * 1000, // 30 minutes
      warning: 5 * 60 * 1000, // Show warning 5 minutes before timeout
    },
  },

  // Cookie security settings
  cookies: {
    // Cookie prefixes for security
    prefixes: {
      secure: '__Secure-', // For HTTPS-only cookies
      host: '__Host-', // For same-origin, HTTPS-only cookies
    },
    // SameSite settings
    sameSite: {
      production: 'strict' as const,
      development: 'lax' as const,
    },
    // Domain settings
    domain: {
      production: process.env.COOKIE_DOMAIN || '.yourdomain.com',
      development: undefined,
    },
  },

  // Rate limiting configuration
  rateLimit: {
    // Global rate limit
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    },
    // Endpoint-specific limits
    endpoints: {
      signIn: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 5, // 5 attempts
        blockDuration: 15 * 60 * 1000, // Block for 15 minutes after limit
      },
      signUp: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // 3 signups per hour
        requireCaptcha: true, // Require CAPTCHA after 2 attempts
      },
      passwordReset: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 3, // 3 attempts
        cooldown: 60 * 60 * 1000, // 1 hour cooldown after successful reset
      },
      emailVerification: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // 10 attempts
      },
      twoFactor: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 5, // 5 attempts
        lockoutDuration: 30 * 60 * 1000, // 30 minute lockout
      },
    },
  },

  // Password policy
  password: {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    // Common passwords to block (partial list)
    blocklist: [
      'password123',
      'admin123',
      'letmein',
      'qwerty123',
      'welcome123',
    ],
    // Password history (prevent reuse)
    history: {
      enabled: true,
      count: 5, // Remember last 5 passwords
    },
    // Force password change
    forceChange: {
      firstLogin: true,
      afterDays: 90, // Force change every 90 days
      adminAfterDays: 60, // Admin users every 60 days
    },
  },

  // Two-factor authentication
  twoFactor: {
    // Enforce 2FA for roles
    enforceForRoles: ['admin', 'manager'],
    // TOTP settings
    totp: {
      issuer: process.env.APP_NAME || 'Hospital Alert System',
      period: 30,
      digits: 6,
      algorithm: 'SHA1' as const,
      // QR code settings
      qrCode: {
        size: 200,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      },
    },
    // Backup codes
    backupCodes: {
      quantity: 10,
      length: 8,
      format: 'XXXX-XXXX', // Format with dash
    },
    // Recovery options
    recovery: {
      email: true,
      sms: true,
      securityQuestions: false,
    },
  },

  // Account security
  account: {
    // Account lockout
    lockout: {
      enabled: true,
      threshold: 5, // Lock after 5 failed attempts
      duration: 30 * 60 * 1000, // 30 minutes
      resetAfterSuccess: true,
    },
    // Suspicious activity detection
    suspiciousActivity: {
      // Detect impossible travel
      impossibleTravel: {
        enabled: true,
        speedKmh: 1000, // Max travel speed in km/h
      },
      // Detect unusual login patterns
      unusualPatterns: {
        enabled: true,
        factors: ['time', 'location', 'device', 'browser'],
      },
      // Actions on suspicious activity
      actions: {
        notify: true,
        requireTwoFactor: true,
        requirePasswordReset: false,
      },
    },
    // Email verification
    emailVerification: {
      required: process.env.NODE_ENV === 'production',
      tokenExpiry: 24 * 60 * 60, // 24 hours
      resendCooldown: 60, // 1 minute between resends
    },
  },

  // CORS configuration
  cors: {
    // Allowed origins
    origins: {
      production: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
      development: [
        'http://localhost:8081',
        'http://localhost:8082',
        'http://localhost:3000',
        'http://127.0.0.1:8081',
        'http://127.0.0.1:8082',
        'http://127.0.0.1:3000',
      ],
    },
    // Allowed methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // Allowed headers
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-Session-ID',
    ],
    // Exposed headers
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Session-Expires',
    ],
    // Credentials
    credentials: true,
    // Max age for preflight cache
    maxAge: 86400, // 24 hours
  },

  // Security headers
  headers: {
    // Content Security Policy
    csp: {
      production: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
      development: "default-src 'self' 'unsafe-inline' 'unsafe-eval' *; img-src * data:; connect-src *;",
    },
    // Other security headers
    hsts: 'max-age=31536000; includeSubDomains; preload',
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
    xXssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'geolocation=(), microphone=(), camera=()',
  },

  // Audit and logging
  audit: {
    // Events to log
    events: [
      'login',
      'logout',
      'login_failed',
      'password_reset',
      'password_changed',
      'email_changed',
      'role_changed',
      'permission_changed',
      'account_locked',
      'account_unlocked',
      'suspicious_activity',
      'two_factor_enabled',
      'two_factor_disabled',
      'session_expired',
      'api_key_created',
      'api_key_revoked',
    ],
    // Retention period
    retention: {
      days: 90, // Keep logs for 90 days
      archiveDays: 365, // Archive for 1 year
    },
    // PII handling
    pii: {
      mask: true, // Mask sensitive data
      fields: ['password', 'ssn', 'creditCard', 'bankAccount'],
    },
  },

  // API security
  api: {
    // API key settings
    apiKeys: {
      enabled: true,
      length: 32,
      prefix: 'hak_', // Hospital Alert Key
      rotation: {
        enabled: true,
        intervalDays: 90,
        overlapDays: 7, // Keep old key active for 7 days
      },
    },
    // Request signing
    requestSigning: {
      enabled: process.env.NODE_ENV === 'production',
      algorithm: 'HMAC-SHA256',
      timestampTolerance: 300, // 5 minutes
    },
  },

  // Mobile app security
  mobile: {
    // Certificate pinning
    certificatePinning: {
      enabled: Platform.OS !== 'web' && process.env.NODE_ENV === 'production',
      pins: process.env.CERTIFICATE_PINS?.split(',') || [],
    },
    // Biometric authentication
    biometric: {
      enabled: true,
      fallbackToPasscode: true,
      requireRecentAuth: 5 * 60, // Require re-auth after 5 minutes
    },
    // Jailbreak/root detection
    integrityCheck: {
      enabled: process.env.NODE_ENV === 'production',
      blockJailbroken: true,
      blockRooted: true,
      blockEmulator: false, // Allow emulators for testing
    },
  },

  // Compliance settings
  compliance: {
    // HIPAA compliance
    hipaa: {
      enabled: true,
      encryption: {
        atRest: 'AES-256',
        inTransit: 'TLS 1.3',
      },
      accessControl: {
        minimumPasswordLength: 12,
        sessionTimeout: 30 * 60, // 30 minutes
        auditLogging: true,
      },
    },
    // GDPR compliance
    gdpr: {
      enabled: true,
      dataRetention: {
        userDataDays: 365 * 3, // 3 years
        logDataDays: 90,
      },
      userRights: {
        dataExport: true,
        dataErasure: true,
        dataPortability: true,
      },
    },
  },
};

// Helper functions for security checks
export const securityHelpers = {
  // Check if password meets policy
  isPasswordValid: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const policy = securityConfig.password;

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters`);
    }
    if (password.length > policy.maxLength) {
      errors.push(`Password must be no more than ${policy.maxLength} characters`);
    }
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    if (policy.blocklist.some(blocked => password.toLowerCase().includes(blocked))) {
      errors.push('Password is too common or easily guessable');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  // Generate secure random string
  generateSecureToken: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    const values = new Uint8Array(length);
    
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(values);
    } else {
      // For React Native or Node.js environment, use expo-crypto
      // This will be handled by the polyfill
      try {
        // @ts-ignore - This is handled by our crypto polyfill
        crypto.getRandomValues(values);
      } catch (e) {
        // Fallback to less secure method if crypto is not available
        for (let i = 0; i < values.length; i++) {
          values[i] = Math.floor(Math.random() * 256);
        }
      }
    }
    
    for (let i = 0; i < length; i++) {
      token += chars[values[i] % chars.length];
    }
    
    return token;
  },

  // Check if origin is trusted
  isTrustedOrigin: (origin: string): boolean => {
    const env = process.env.NODE_ENV || 'development';
    const allowedOrigins = securityConfig.cors.origins[env as keyof typeof securityConfig.cors.origins] || [];
    
    // Check exact match
    if (allowedOrigins.includes(origin)) {
      return true;
    }
    
    // Check wildcard patterns for development
    if (env === 'development') {
      const patterns = [
        /^https:\/\/[\w-]+\.exp\.direct$/,
        /^https:\/\/[\w-]+\.exp\.host$/,
        /^https:\/\/[\w-]+\.expo\.dev$/,
        /^https:\/\/[\w-]+\.expo\.io$/,
      ];
      
      return patterns.some(pattern => pattern.test(origin));
    }
    
    return false;
  },
};

// Export type for TypeScript
export type SecurityConfig = typeof securityConfig;