import { z } from 'zod';
import { 
  router, 
  adminProcedure,
  protectedProcedure
} from '../trpc';
import { TRPCError } from '@trpc/server';
import { log } from '@/lib/core/debug/logger';

// System configuration schemas
const EmailConfigSchema = z.object({
  provider: z.enum(['smtp', 'sendgrid', 'ses', 'postmark']),
  from: z.string().email(),
  replyTo: z.string().email().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpSecure: z.boolean().optional(),
  apiKey: z.string().optional(),
});

const SecurityConfigSchema = z.object({
  sessionTimeout: z.number().min(5).max(10080), // 5 minutes to 7 days
  passwordPolicy: z.object({
    minLength: z.number().min(6).max(128),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireNumbers: z.boolean(),
    requireSpecialChars: z.boolean(),
    maxAge: z.number().min(0).max(365), // days
  }),
  twoFactorRequired: z.boolean(),
  allowedEmailDomains: z.array(z.string()).optional(),
  maxLoginAttempts: z.number().min(1).max(10),
  lockoutDuration: z.number().min(1).max(1440), // minutes
});

const MaintenanceConfigSchema = z.object({
  enabled: z.boolean(),
  message: z.string().optional(),
  allowedIPs: z.array(z.string()).optional(),
  scheduledFor: z.string().datetime().optional(),
  estimatedDuration: z.number().optional(), // minutes
});

const FeatureFlagsSchema = z.object({
  enableRegistration: z.boolean(),
  enableOAuth: z.boolean(),
  enableEmailVerification: z.boolean(),
  enablePushNotifications: z.boolean(),
  enableBiometricAuth: z.boolean(),
  enableOfflineMode: z.boolean(),
  enableAnalytics: z.boolean(),
  enableDebugMode: z.boolean(),
});

const SystemConfigSchema = z.object({
  general: z.object({
    siteName: z.string(),
    siteUrl: z.string().url(),
    supportEmail: z.string().email(),
    timezone: z.string(),
    language: z.string(),
    dateFormat: z.string(),
    timeFormat: z.string(),
  }),
  email: EmailConfigSchema,
  security: SecurityConfigSchema,
  maintenance: MaintenanceConfigSchema,
  features: FeatureFlagsSchema,
  limits: z.object({
    maxFileSize: z.number(), // MB
    maxOrganizationMembers: z.number(),
    maxStoragePerOrg: z.number(), // GB
    rateLimitRequests: z.number(),
    rateLimitWindow: z.number(), // minutes
  }),
});

// In-memory storage for demo (use database in production)
let systemConfig: z.infer<typeof SystemConfigSchema> = {
  general: {
    siteName: 'Hospital Alert System',
    siteUrl: 'http://localhost:8081',
    supportEmail: 'support@hospitalalert.com',
    timezone: 'UTC',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  },
  email: {
    provider: 'smtp',
    from: 'noreply@hospitalalert.com',
    replyTo: 'support@hospitalalert.com',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@hospitalalert.com',
    smtpSecure: false,
  },
  security: {
    sessionTimeout: 30, // 30 minutes
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90, // 90 days
    },
    twoFactorRequired: false,
    maxLoginAttempts: 5,
    lockoutDuration: 30, // 30 minutes
  },
  maintenance: {
    enabled: false,
    message: '',
    allowedIPs: [],
  },
  features: {
    enableRegistration: true,
    enableOAuth: true,
    enableEmailVerification: true,
    enablePushNotifications: true,
    enableBiometricAuth: true,
    enableOfflineMode: false,
    enableAnalytics: true,
    enableDebugMode: process.env.NODE_ENV === 'development',
  },
  limits: {
    maxFileSize: 10, // 10 MB
    maxOrganizationMembers: 100,
    maxStoragePerOrg: 10, // 10 GB
    rateLimitRequests: 100,
    rateLimitWindow: 15, // 15 minutes
  },
};

export const systemRouter = router({
  // Get system configuration
  getConfig: adminProcedure
    .output(SystemConfigSchema)
    .query(async ({ ctx }) => {
      log.info('Admin fetching system config', 'SYSTEM', { 
        adminId: ctx.user.id 
      });

      return systemConfig;
    }),

  // Update general settings
  updateGeneralSettings: adminProcedure
    .input(SystemConfigSchema.shape.general)
    .mutation(async ({ input, ctx }) => {
      log.info('Admin updating general settings', 'SYSTEM', { 
        adminId: ctx.user.id,
        changes: input 
      });

      systemConfig.general = input;
      
      return {
        success: true,
        message: 'General settings updated successfully',
      };
    }),

  // Update email configuration
  updateEmailConfig: adminProcedure
    .input(EmailConfigSchema)
    .mutation(async ({ input, ctx }) => {
      log.info('Admin updating email config', 'SYSTEM', { 
        adminId: ctx.user.id,
        provider: input.provider 
      });

      // In production, validate SMTP connection
      systemConfig.email = input;
      
      return {
        success: true,
        message: 'Email configuration updated successfully',
      };
    }),

  // Update security settings
  updateSecuritySettings: adminProcedure
    .input(SecurityConfigSchema)
    .mutation(async ({ input, ctx }) => {
      log.info('Admin updating security settings', 'SYSTEM', { 
        adminId: ctx.user.id,
        changes: input 
      });

      systemConfig.security = input;
      
      return {
        success: true,
        message: 'Security settings updated successfully',
      };
    }),

  // Update maintenance mode
  updateMaintenanceMode: adminProcedure
    .input(MaintenanceConfigSchema)
    .mutation(async ({ input, ctx }) => {
      log.info('Admin updating maintenance mode', 'SYSTEM', { 
        adminId: ctx.user.id,
        enabled: input.enabled 
      });

      systemConfig.maintenance = input;
      
      return {
        success: true,
        message: 'Maintenance mode updated successfully',
      };
    }),

  // Update feature flags
  updateFeatureFlags: adminProcedure
    .input(FeatureFlagsSchema)
    .mutation(async ({ input, ctx }) => {
      log.info('Admin updating feature flags', 'SYSTEM', { 
        adminId: ctx.user.id,
        changes: input 
      });

      systemConfig.features = input;
      
      return {
        success: true,
        message: 'Feature flags updated successfully',
      };
    }),

  // Update system limits
  updateSystemLimits: adminProcedure
    .input(SystemConfigSchema.shape.limits)
    .mutation(async ({ input, ctx }) => {
      log.info('Admin updating system limits', 'SYSTEM', { 
        adminId: ctx.user.id,
        changes: input 
      });

      systemConfig.limits = input;
      
      return {
        success: true,
        message: 'System limits updated successfully',
      };
    }),

  // Test email configuration
  testEmailConfig: adminProcedure
    .input(z.object({
      to: z.string().email(),
    }))
    .mutation(async ({ input, ctx }) => {
      log.info('Admin testing email config', 'SYSTEM', { 
        adminId: ctx.user.id,
        to: input.to 
      });

      try {
        // In production, actually send test email
        // For now, simulate success
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          success: true,
          message: 'Test email sent successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send test email',
        });
      }
    }),

  // Get system health
  getSystemHealth: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };
    }),

  // Clear system cache
  clearCache: adminProcedure
    .input(z.object({
      type: z.enum(['all', 'sessions', 'api', 'static']),
    }))
    .mutation(async ({ input, ctx }) => {
      log.info('Admin clearing cache', 'SYSTEM', { 
        adminId: ctx.user.id,
        type: input.type 
      });

      // In production, clear actual caches
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: `${input.type} cache cleared successfully`,
      };
    }),

  // Export system data
  exportSystemData: adminProcedure
    .input(z.object({
      type: z.enum(['config', 'users', 'audit', 'all']),
      format: z.enum(['json', 'csv']),
    }))
    .mutation(async ({ input, ctx }) => {
      log.info('Admin exporting system data', 'SYSTEM', { 
        adminId: ctx.user.id,
        type: input.type,
        format: input.format 
      });

      // In production, generate actual export
      const exportData = {
        type: input.type,
        format: input.format,
        timestamp: new Date().toISOString(),
        data: systemConfig,
      };
      
      return {
        success: true,
        downloadUrl: `/api/exports/${Date.now()}.${input.format}`,
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      };
    }),
});

// Export type for use in client
export type SystemRouter = typeof systemRouter;