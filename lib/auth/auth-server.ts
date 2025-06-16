/**
 * Server-safe Better Auth configuration
 * This file is used for API routes and server-side code
 * No React Native or browser dependencies
 */

// Ensure environment variables are loaded
import 'dotenv/config';
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy, organization, admin, magicLink, twoFactor, passkey, bearer } from "better-auth/plugins";
import { db } from "@/src/db";
import * as schema from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { emailService } from "@/src/server/services/email-index";
import { notificationService, NotificationType, Priority } from "@/src/server/services/notifications";
import crypto from "crypto";

// Import unified logger
import { logger } from '@/lib/core/debug/unified-logger';

// Server-safe base URL configuration with validation
const getBaseURL = () => {
  const url = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:8081/api/auth';
  
  // Validate URL format in production
  if (process.env.NODE_ENV === 'production') {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') {
        logger.auth.warn('Using non-HTTPS URL in production');
      }
    } catch (e) {
      logger.auth.error('Invalid BETTER_AUTH_BASE_URL', { url });
    }
  }
  
  return url;
};

const getTrustedOrigins = () => {
  const origins = [
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:3000",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:8082",
    "http://127.0.0.1:3000",
  ];
  
  // Add production origins from environment
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()));
  }
  
  if (process.env.NODE_ENV === "development") {
    origins.push(
      "https://*.exp.direct",
      "https://*.exp.host",
      "https://*.expo.dev",
      "https://*.expo.io"
    );
    
    const localIP = process.env.LOCAL_IP || "192.168.1.101";
    origins.push(
      `http://${localIP}:8081`,
      `http://${localIP}:8082`,
      `http://${localIP}:3000`,
      `http://${localIP}:19000`,
      `http://${localIP}:19001`,
      `http://${localIP}:19002`
    );
  }

  return origins;
};

// Debug environment variables on load
if (process.env.NODE_ENV === 'development') {
  logger.system.info('Auth server environment variables', {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'NOT SET',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
    BETTER_AUTH_BASE_URL: process.env.BETTER_AUTH_BASE_URL || 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
  });
  
  // Validate OAuth configuration
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    logger.auth.info('Google OAuth configured', {
      redirectURI: `${process.env.BETTER_AUTH_BASE_URL || "http://localhost:8081/api/auth"}/callback/google`
    });
    
    // Check if client ID looks valid
    if (!process.env.GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com')) {
      logger.auth.warn('Google Client ID doesn\'t match expected format');
    }
  }
}

// Security headers middleware
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https: wss:;",
  }),
};

export const auth = betterAuth({
  baseURL: getBaseURL(),
  secret: process.env.BETTER_AUTH_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('BETTER_AUTH_SECRET is required in production');
    }
    return "dev-secret-key-not-for-production";
  })(),
  
  // Security configuration
  ...(process.env.NODE_ENV === "development" ? {
    // Development-specific settings
    disableCsrf: true, // Only for tunnel URLs in dev
  } : {
    // Production security settings
    secureCookies: true,
    cookiePrefix: '__Secure-', // Cookie prefix for secure cookies
  }),
  
  // Advanced security options
  advanced: {
    generateId: () => crypto.randomUUID(), // Use crypto UUID for session IDs
    crossSubDomainCookies: {
      enabled: process.env.ENABLE_CROSS_SUBDOMAIN === 'true',
      domain: process.env.COOKIE_DOMAIN || '.yourdomain.com',
    },
    disableWebAuthnPasswordless: false, // Enable WebAuthn for passwordless
    disableGeneratedOAuthRedirect: false,
  },
  
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        scope: ["openid", "email", "profile"],
      },
    }),
  },
  
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "guest", // Changed from "user" to "guest" to match profile completion logic
      },
      organizationId: {
        type: "string",
        required: false,
      },
      needsProfileCompletion: {
        type: "boolean",
        required: true,
        defaultValue: true, // All new users need profile completion
      },
    },
  },
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.EXPO_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'true',
    sendResetPassword: async ({ user, url }) => {
      logger.auth.info('Password reset link generated', { email: user.email, url });
      
      // Send password reset email using our notification service
      await notificationService.send({
        type: NotificationType.AUTH_RESET_PASSWORD,
        recipient: {
          userId: user.id,
          email: user.email,
        },
        priority: Priority.HIGH,
        data: {
          name: user.name || user.email,
          resetUrl: url,
          expirationTime: '1 hour',
          ipAddress: 'System Generated',
          userAgent: 'Hospital Alert System',
        },
      });
    },
    sendVerificationEmail: async ({ user, url }) => {
      logger.auth.info('Email verification link generated', { email: user.email, url });
      
      // Send verification email using our notification service
      await notificationService.send({
        type: NotificationType.AUTH_VERIFY_EMAIL,
        recipient: {
          userId: user.id,
          email: user.email,
        },
        priority: Priority.HIGH,
        data: {
          name: user.name || user.email,
          verificationUrl: url,
          expirationTime: '24 hours',
        },
      });
    },
  },
  
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...schema },
  }),
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day - refresh session if older than this
    // Disable cookie cache to avoid issues with OAuth
    cookieCache: {
      enabled: false,
    },
    // Session security
    storeSessionInDatabase: true, // Store sessions in DB for better control
    // Enable session fingerprinting for additional security
    enableSessionFingerprinting: process.env.NODE_ENV === 'production',
  },
  
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-better-auth.session_token' : 'better-auth.session_token',
      httpOnly: true, // Always httpOnly for security
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Strict in production
      secure: process.env.NODE_ENV === 'production', // Secure in production
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      domain: process.env.COOKIE_DOMAIN || (process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined),
      // Additional security attributes
      ...(process.env.NODE_ENV === 'production' && {
        priority: 'high', // Cookie priority hint
        partitioned: true, // CHIPS - Cookies Having Independent Partitioned State
      }),
    },
    sessionRefreshToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-better-auth.refresh_token' : 'better-auth.refresh_token',
      httpOnly: true, // Always HttpOnly
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      // No domain for __Host- prefixed cookies
      ...(process.env.NODE_ENV !== 'production' && {
        domain: undefined,
      }),
    },
    state: {
      name: 'better-auth.state',
      httpOnly: true, // Make state cookie HttpOnly
      sameSite: 'lax', // Lax for OAuth redirects
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    },
    csrf: {
      name: process.env.NODE_ENV === 'production' ? '__Host-better-auth.csrf' : 'better-auth.csrf',
      httpOnly: true, // CSRF token should be HttpOnly
      sameSite: 'strict', // Strict for CSRF protection
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    },
    // Additional cookie for remember me functionality
    rememberMe: {
      name: 'better-auth.remember',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 90, // 90 days
    },
  },
  
  plugins: [
    // Note: expo() plugin removed as it causes server-side issues
    bearer(), // Enable Bearer token authentication for mobile
    oAuthProxy(),
    // multiSession removed - it was causing cookie naming issues
    organization({
      allowUserToCreateOrganization: true,
      membershipLimits: {
        'free': 5,
        'pro': 50,
        'enterprise': -1,
      },
      // Organization security settings
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
      requireEmailVerification: true,
    }),
    admin({
      defaultRole: 'user',
      adminUserIds: process.env.ADMIN_USER_IDS?.split(',') || [],
      // Admin security settings
      requireTwoFactor: process.env.NODE_ENV === 'production',
    }),
    magicLink({
      sendMagicLink: async ({ email, url, token }) => {
        logger.auth.info('Magic link generated', { email, url });
        
        // Find user by email to get userId
        const [user] = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, email))
          .limit(1);
        
        // Send magic link email using our notification service
        await notificationService.send({
          type: NotificationType.AUTH_MAGIC_LINK,
          recipient: {
            userId: user?.id || 'anonymous',
            email: email,
          },
          priority: Priority.HIGH,
          data: {
            name: user?.name || email,
            magicLinkUrl: url,
            expirationTime: '10 minutes',
            // Add security notice
            securityNote: 'If you did not request this link, please ignore this email.',
          },
        });
      },
      // Magic link security settings
      expiresIn: 60 * 10, // 10 minutes
      requestLimit: {
        window: 60 * 60, // 1 hour
        max: 5, // 5 requests per hour
      },
    }),
    // Two-factor authentication plugin
    ...(process.env.ENABLE_TWO_FACTOR === 'true' ? [twoFactor({
      issuer: process.env.APP_NAME || 'Hospital Alert System',
      // Custom TOTP settings
      totpOptions: {
        period: 30,
        digits: 6,
        algorithm: 'SHA1',
      },
      // Backup codes
      backupCodes: {
        quantity: 10,
        length: 8,
      },
      // Force 2FA for certain roles
      forceTwoFactor: (user) => {
        const userRole = (user as any).role;
        return userRole === 'admin' || userRole === 'manager';
      },
    })] : []),
    // Passkey/WebAuthn support
    ...(process.env.ENABLE_PASSKEYS === 'true' ? [passkey({
      rpName: process.env.APP_NAME || 'Hospital Alert System',
      rpID: process.env.RP_ID || 'localhost',
      origin: process.env.BETTER_AUTH_BASE_URL || 'http://localhost:8081',
      // Passkey settings
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        residentKey: 'preferred',
        requireResidentKey: false,
      },
    })] : []),
  ],
  
  // Use static array to avoid the async function issue
  trustedOrigins: getTrustedOrigins(),
  
  cors: {
    origin: (origin: string) => {
      const staticOrigins = getTrustedOrigins();
      if (staticOrigins.includes(origin)) {
        return true;
      }
      
      const tunnelPatterns = [
        /^https:\/\/[\w-]+\.exp\.direct$/,
        /^https:\/\/[\w-]+\.exp\.host$/,
        /^https:\/\/[\w-]+\.expo\.dev$/,
        /^https:\/\/[\w-]+\.expo\.io$/,
      ];
      
      return tunnelPatterns.some(pattern => pattern.test(origin));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
  
  rateLimit: {
    enabled: true,
    window: 15 * 60 * 1000, // 15 minutes in milliseconds
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable legacy headers
    storage: process.env.NODE_ENV === 'production' ? 'database' : 'memory', // Use DB in production
    // Custom rate limits per endpoint
    customRules: [
      {
        path: '/sign-in',
        window: 5 * 60 * 1000, // 5 minutes
        max: 10, // 10 attempts per 5 minutes - increased to handle logout-login flow
        skipSuccessfulRequests: true, // Don't count successful logins toward limit
      },
      {
        path: '/sign-up',
        window: 60 * 60 * 1000, // 1 hour
        max: 3, // 3 signups per hour
      },
      {
        path: '/forgot-password',
        window: 15 * 60 * 1000, // 15 minutes
        max: 3, // 3 attempts per 15 minutes
      },
      {
        path: '/verify-email',
        window: 60 * 60 * 1000, // 1 hour
        max: 10, // 10 attempts per hour
      },
      {
        path: '/sign-out',
        window: 60 * 1000, // 1 minute
        max: 20, // 20 signouts per minute - generous limit
        clearOnSuccess: true, // Clear rate limit counters after successful signout
      },
    ],
    // Skip rate limiting for certain conditions
    skip: (req) => {
      // Skip for health checks
      if (req.url.includes('/health')) return true;
      // Skip for static assets
      if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico)$/)) return true;
      return false;
    },
    // Custom key generator for rate limiting
    keyGenerator: (req) => {
      // Use a combination of IP and user ID if authenticated
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 req.headers.get('x-real-ip') || 
                 'unknown';
      const userId = req.headers.get('x-user-id');
      return userId ? `${ip}:${userId}` : ip;
    },
  },
  
  logger: {
    level: process.env.NODE_ENV === "production" ? "error" : "debug",
    disabled: false,
  },
  
  onError: (error: any, request: Request) => {
    logger.auth.error('Authentication error', error);
    
    // Log additional context for debugging
    const errorContext = {
      message: error.message,
      code: error.code,
      status: error.status,
      path: new URL(request.url).pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip'),
    };
    
    logger.auth.error('Auth error details', errorContext);
    
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      // Would send to Sentry or similar monitoring service
      // sentryCapture(error, errorContext);
    }
    
    // Rate limit specific error handling
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      return {
        message: 'Too many requests. Please try again later.',
        status: 429,
        retryAfter: error.retryAfter || 60,
      };
    }
    
    // Handle specific error types with appropriate messages
    const errorMessages = {
      INVALID_CREDENTIALS: 'Invalid email or password',
      EMAIL_NOT_VERIFIED: 'Please verify your email address',
      ACCOUNT_LOCKED: 'Account temporarily locked due to suspicious activity',
      SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
      INVALID_TOKEN: 'Invalid or expired token',
    };
    
    if (process.env.NODE_ENV === "production") {
      return {
        message: errorMessages[error.code] || "An error occurred during authentication",
        status: error.status || 500,
      };
    }
    
    return {
      message: error.message,
      status: error.status || 500,
      code: error.code,
    };
  },
  
  callbacks: {
    session: {
      async fetchSession({ session, user }) {
        logger.auth.debug('Fetching session', {
          sessionId: session?.id,
          userId: user?.id,
          userEmail: user?.email,
        });
        
        // Add session security checks
        if (session && process.env.NODE_ENV === 'production') {
          // Check session age and force re-authentication if too old
          const sessionAge = Date.now() - new Date(session.createdAt).getTime();
          const maxSessionAge = 60 * 60 * 24 * 30 * 1000; // 30 days
          
          if (sessionAge > maxSessionAge) {
            logger.auth.info('Session too old, forcing re-authentication', {
              sessionId: session.id,
              sessionAge: sessionAge / 1000 / 60 / 60 / 24, // days
            });
            return { session: null, user: null };
          }
          
          // Check for suspicious activity
          const currentIp = session.ipAddress;
          const lastIp = (session as any).lastIpAddress;
          if (lastIp && currentIp !== lastIp) {
            logger.auth.info('IP address changed during session', {
              sessionId: session.id,
              currentIp,
              lastIp,
            });
            // Could force re-authentication or send security alert
          }
        }
        
        return { session, user };
      }
    },
    signOut: {
      async before({ user, session }) {
        logger.auth.debug('Sign-out initiated', {
          userId: user?.id,
          sessionId: session?.id,
          isOAuthSession: !!(session as any)?.provider,
          provider: (session as any)?.provider,
        });
        
        // Clean up OAuth-specific session data to prevent JSON parsing errors
        if (session && (session as any)?.provider) {
          logger.auth.info('OAuth session sign-out detected', {
            provider: (session as any).provider,
            userId: user?.id
          });
          
          // Return clean objects without circular references or non-serializable data
          return {
            user: user ? {
              id: user.id,
              email: user.email,
              name: user.name
            } : undefined,
            session: session ? {
              id: session.id,
              userId: session.userId
            } : undefined
          };
        }
        
        return { user, session };
      },
      async after({ user }) {
        logger.auth.info('Sign-out completed', {
          userId: user?.id,
        });
        
        // Clean user object for OAuth sessions
        if (user && (user as any)?.accounts?.some((acc: any) => acc.provider === 'google')) {
          return {
            user: {
              id: user.id,
              email: user.email,
              name: user.name
            }
          };
        }
        
        return { user };
      }
    },
    signIn: {
      async before({ user, isNewUser }) {
        // Enhanced logging for OAuth callback debugging
        logger.auth.debug('Sign-in initiated', {
          userId: user?.id, 
          email: user?.email,
          isNewUser,
          existingRole: user?.role,
          existingNeedsProfileCompletion: user?.needsProfileCompletion,
        });
        
        if (isNewUser) {
          logger.auth.info('New OAuth user detected, setting guest role', {
            userId: user?.id,
            email: user?.email,
            beforeRole: user?.role,
            beforeNeedsProfileCompletion: user?.needsProfileCompletion
          });
          
          user.role = 'guest';
          user.needsProfileCompletion = true;
          
          logger.auth.debug('Guest role applied', {
            userId: user?.id,
            afterRole: user?.role,
            afterNeedsProfileCompletion: user?.needsProfileCompletion
          });
        }
        
        return { user };
      },
      async after({ user, session, request }) {
        const isOAuthCallback = request.url.includes('/callback/google');
        
        logger.auth.info('Sign-in completed', {
          userId: user?.id,
          userRole: user?.role,
          userNeedsProfileCompletion: user?.needsProfileCompletion,
          sessionId: session?.id,
          isOAuthCallback,
        });
        
        const userAgent = request.headers.get('user-agent') || '';
        const isMobileOAuth = userAgent.includes('Expo') || userAgent.includes('okhttp');
        
        if (isMobileOAuth && session) {
          return {
            redirect: true,
            url: `/api/auth/mobile-oauth-success?token=${session.token}`,
          };
        }
        
        // For web OAuth, redirect to auth-callback page
        if (!isMobileOAuth && session) {
          logger.auth.info('Web OAuth successful, redirecting to auth-callback', {
            userId: user?.id,
            needsProfileCompletion: user?.needsProfileCompletion,
            role: user?.role
          });
          
          // Add a delay parameter to ensure session is properly saved before redirect
          // This helps with the timing issue where the session might not be immediately available
          return {
            redirect: true,
            url: '/auth-callback?oauth=true&delay=500',
          };
        }
        
        return { user, session };
      },
    },
  },
});

export type Auth = typeof auth;

// Helper function to apply security headers to responses
export function withSecurityHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  
  return newResponse;
}

// Session security utilities
export const sessionSecurity = {
  // Validate session fingerprint
  validateFingerprint: (session: any, request: Request): boolean => {
    if (process.env.NODE_ENV !== 'production') return true;
    
    const currentFingerprint = generateFingerprint(request);
    const sessionFingerprint = session.fingerprint;
    
    return currentFingerprint === sessionFingerprint;
  },
  
  // Generate session fingerprint from request
  generateFingerprint: (request: Request): string => {
    const userAgent = request.headers.get('user-agent') || '';
    const acceptLanguage = request.headers.get('accept-language') || '';
    const acceptEncoding = request.headers.get('accept-encoding') || '';
    
    // Create a fingerprint from stable request characteristics
    const data = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
    
    // Hash the fingerprint data
    return crypto.createHash('sha256').update(data).digest('hex');
  },
  
  // Check for session anomalies
  checkAnomalies: (session: any, request: Request): { suspicious: boolean; reasons: string[] } => {
    const reasons: string[] = [];
    
    // Check IP address changes
    const currentIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 'unknown';
    if (session.ipAddress && session.ipAddress !== currentIp) {
      reasons.push('IP address changed');
    }
    
    // Check user agent changes
    const currentUA = request.headers.get('user-agent') || '';
    if (session.userAgent && session.userAgent !== currentUA) {
      reasons.push('User agent changed');
    }
    
    // Check for impossible travel (simplified version)
    if (session.lastActivity) {
      const timeDiff = Date.now() - new Date(session.lastActivity).getTime();
      const locationChanged = session.ipAddress !== currentIp;
      
      // If location changed in less than 5 minutes, it might be suspicious
      if (locationChanged && timeDiff < 5 * 60 * 1000) {
        reasons.push('Impossible travel detected');
      }
    }
    
    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  },
};

// Export helper to generate fingerprint
const generateFingerprint = sessionSecurity.generateFingerprint;

// Advanced session management hooks
export const sessionHooks = {
  // Before creating a session
  beforeCreate: async (user: any, request: Request) => {
    // Add session metadata
    const metadata = {
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      fingerprint: generateFingerprint(request),
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    
    return metadata;
  },
  
  // After session is created
  afterCreate: async (session: any, user: any) => {
    // Log session creation for audit
    logger.auth.info('Session created', {
      sessionId: session.id,
      userId: user.id,
      userEmail: user.email,
    });
  },
  
  // Before destroying a session
  beforeDestroy: async (session: any) => {
    // Log session destruction
    logger.auth.info('Session destroyed', {
      sessionId: session.id,
      userId: session.userId,
    });
  },
};