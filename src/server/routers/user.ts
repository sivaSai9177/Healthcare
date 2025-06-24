import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { db } from '@/src/db';
import { user as userTable, userPreferences } from '@/src/db/schema';
import { userDeviceTokens } from '@/src/db/notification-schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/core/debug/logger';

export const userRouter = router({
  // DEBUG: Update own role (remove in production)
  debugUpdateOwnRole: protectedProcedure
    .input(z.object({
      role: z.enum(['user', 'admin', 'manager', 'guest', 'operator', 'doctor', 'nurse', 'head_doctor'])
    }))
    .mutation(async ({ ctx, input }) => {
      // Only allow in development
      if (process.env.NODE_ENV === 'production') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This endpoint is disabled in production'
        });
      }
      
      log.warn('DEBUG: User changing own role', 'USER', {
        userId: ctx.user.id,
        oldRole: (ctx.user as any).role,
        newRole: input.role
      });
      
      const [updatedUser] = await db
        .update(userTable)
        .set({ 
          role: input.role,
          updatedAt: new Date()
        })
        .where(eq(userTable.id, ctx.user.id))
        .returning();
      
      return {
        success: true,
        user: updatedUser
      };
    }),
  // Get user email preferences
  getEmailPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Try to get existing preferences
        const [prefs] = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, ctx.user.id))
          .limit(1);

        if (prefs) {
          return {
            preferences: prefs.emailPreferences ? JSON.parse(prefs.emailPreferences) : {},
            updatedAt: prefs.updatedAt,
          };
        }

        // Return default preferences if none exist
        const defaultPreferences: Record<string, boolean> = {
          // Account (required)
          account_security: true,
          account_login: true,
          account_changes: true,
          // Alerts
          alert_critical: true,
          alert_assigned: true,
          alert_escalation: true,
          alert_resolved: false,
          // Team
          team_invites: true,
          team_announcements: true,
          team_shift: true,
          // Reports
          report_weekly: false,
          report_monthly: false,
          report_performance: false,
          // Marketing
          marketing_features: false,
          marketing_tips: false,
          marketing_newsletter: false,
        };

        return {
          preferences: defaultPreferences,
          updatedAt: new Date(),
        };
      } catch (error) {
        log.error('Failed to get email preferences', 'USER', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get email preferences',
        });
      }
    }),

  // Update user email preferences
  updateEmailPreferences: protectedProcedure
    .input(z.object({
      preferences: z.record(z.boolean()),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if preferences already exist
        const [existing] = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, ctx.user.id))
          .limit(1);

        if (existing) {
          // Update existing preferences
          await db
            .update(userPreferences)
            .set({
              emailPreferences: JSON.stringify(input.preferences),
              updatedAt: new Date(),
            })
            .where(eq(userPreferences.userId, ctx.user.id));
        } else {
          // Create new preferences
          await db
            .insert(userPreferences)
            .values({
              userId: ctx.user.id,
              emailPreferences: JSON.stringify(input.preferences),
              notificationPreferences: JSON.stringify({}),
              updatedAt: new Date(),
            });
        }

        log.info('Email preferences updated', 'USER', {
          userId: ctx.user.id,
        });

        return {
          success: true,
          preferences: input.preferences,
        };
      } catch (error) {
        log.error('Failed to update email preferences', 'USER', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update email preferences',
        });
      }
    }),

  // Get user preferences (all preferences)
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const [prefs] = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, ctx.user.id))
          .limit(1);

        if (!prefs) {
          // Create default preferences
          const [newPrefs] = await db
            .insert(userPreferences)
            .values({
              userId: ctx.user.id,
              emailPreferences: JSON.stringify({
                alerts: true,
                updates: true,
                marketing: false,
              }),
              notificationPreferences: JSON.stringify({
                push: true,
                sms: false,
                soundPreferences: {
                  enabled: true,
                  volume: 0.8,
                  quietHoursEnabled: false,
                  quietHoursStart: '22:00',
                  quietHoursEnd: '07:00',
                  criticalOverride: true,
                  sounds: {
                    cardiac_arrest: { enabled: true, soundFile: 'critical', vibrate: true },
                    code_blue: { enabled: true, soundFile: 'urgent', vibrate: true },
                    fire: { enabled: true, soundFile: 'critical', vibrate: true },
                    security: { enabled: true, soundFile: 'alert', vibrate: true },
                    medical_emergency: { enabled: true, soundFile: 'urgent', vibrate: true },
                  },
                },
              }),
            })
            .returning();

          return newPrefs;
        }

        return prefs;
      } catch (error) {
        log.error('Failed to get user preferences', 'USER', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get preferences',
        });
      }
    }),

  // Update user preferences
  updatePreferences: protectedProcedure
    .input(z.object({
      emailPreferences: z.string().optional(),
      notificationPreferences: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [existing] = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, ctx.user.id))
          .limit(1);

        if (!existing) {
          // Create new preferences
          const [newPrefs] = await db
            .insert(userPreferences)
            .values({
              userId: ctx.user.id,
              emailPreferences: input.emailPreferences || JSON.stringify({
                alerts: true,
                updates: true,
                marketing: false,
              }),
              notificationPreferences: input.notificationPreferences || JSON.stringify({
                push: true,
                sms: false,
              }),
            })
            .returning();

          return newPrefs;
        }

        // Update existing preferences
        const [updated] = await db
          .update(userPreferences)
          .set({
            ...(input.emailPreferences && { emailPreferences: input.emailPreferences }),
            ...(input.notificationPreferences && { notificationPreferences: input.notificationPreferences }),
            updatedAt: new Date(),
          })
          .where(eq(userPreferences.userId, ctx.user.id))
          .returning();

        log.info('User preferences updated', 'USER', {
          userId: ctx.user.id,
          fieldsUpdated: Object.keys(input),
        });

        return updated;
      } catch (error) {
        log.error('Failed to update user preferences', 'USER', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update preferences',
        });
      }
    }),

  // Get user notification preferences
  getNotificationPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const [prefs] = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, ctx.user.id))
          .limit(1);

        if (prefs) {
          return {
            preferences: prefs.notificationPreferences ? JSON.parse(prefs.notificationPreferences) : {},
            updatedAt: prefs.updatedAt,
          };
        }

        // Return default preferences
        return {
          preferences: {
            push_enabled: false,
            push_critical: true,
            push_assigned: true,
            push_escalation: true,
            push_shift_reminder: true,
            push_quiet_hours: false,
            push_quiet_start: '22:00',
            push_quiet_end: '07:00',
          },
          updatedAt: new Date(),
        };
      } catch (error) {
        log.error('Failed to get notification preferences', 'USER', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get notification preferences',
        });
      }
    }),

  // Update user notification preferences
  updateNotificationPreferences: protectedProcedure
    .input(z.object({
      preferences: z.record(z.any()),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const [existing] = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, ctx.user.id))
          .limit(1);

        if (existing) {
          await db
            .update(userPreferences)
            .set({
              notificationPreferences: JSON.stringify(input.preferences),
              updatedAt: new Date(),
            })
            .where(eq(userPreferences.userId, ctx.user.id));
        } else {
          await db
            .insert(userPreferences)
            .values({
              userId: ctx.user.id,
              emailPreferences: JSON.stringify({}),
              notificationPreferences: JSON.stringify(input.preferences),
              updatedAt: new Date(),
            });
        }

        log.info('Notification preferences updated', 'USER', {
          userId: ctx.user.id,
        });

        return {
          success: true,
          preferences: input.preferences,
        };
      } catch (error) {
        log.error('Failed to update notification preferences', 'USER', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update notification preferences',
        });
      }
    }),

  // Register push notification token
  registerPushToken: protectedProcedure
    .input(z.object({
      token: z.string(),
      platform: z.enum(['ios', 'android', 'web']),
      deviceId: z.string().optional(),
      deviceName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if token already exists for this user
        const [existingToken] = await db
          .select()
          .from(userDeviceTokens)
          .where(
            and(
              eq(userDeviceTokens.userId, ctx.user.id),
              eq(userDeviceTokens.token, input.token)
            )
          )
          .limit(1);

        if (existingToken) {
          // Update existing token
          await db
            .update(userDeviceTokens)
            .set({
              active: true,
              lastUsedAt: new Date(),
              updatedAt: new Date(),
              platform: input.platform,
              deviceId: input.deviceId,
              deviceName: input.deviceName,
            })
            .where(eq(userDeviceTokens.id, existingToken.id));

          log.info('Push token updated', 'USER', {
            userId: ctx.user.id,
            tokenId: existingToken.id,
            platform: input.platform,
          });

          return {
            success: true,
            tokenId: existingToken.id,
          };
        }

        // Create new token
        const [newToken] = await db
          .insert(userDeviceTokens)
          .values({
            userId: ctx.user.id,
            token: input.token,
            platform: input.platform,
            deviceId: input.deviceId,
            deviceName: input.deviceName,
            active: true,
            lastUsedAt: new Date(),
          })
          .returning();

        log.info('Push token registered', 'USER', {
          userId: ctx.user.id,
          tokenId: newToken.id,
          platform: input.platform,
        });

        return {
          success: true,
          tokenId: newToken.id,
        };
      } catch (error) {
        log.error('Failed to register push token', 'USER', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to register push token',
        });
      }
    }),

  // Unregister push notification token
  unregisterPushToken: protectedProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Mark token as inactive
        await db
          .update(userDeviceTokens)
          .set({
            active: false,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userDeviceTokens.userId, ctx.user.id),
              eq(userDeviceTokens.token, input.token)
            )
          );

        log.info('Push token unregistered', 'USER', {
          userId: ctx.user.id,
          token: input.token.substring(0, 10) + '...',
        });

        return {
          success: true,
        };
      } catch (error) {
        log.error('Failed to unregister push token', 'USER', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to unregister push token',
        });
      }
    }),

  // Get user's push tokens
  getPushTokens: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const tokens = await db
          .select({
            id: userDeviceTokens.id,
            token: userDeviceTokens.token,
            platform: userDeviceTokens.platform,
            deviceId: userDeviceTokens.deviceId,
            deviceName: userDeviceTokens.deviceName,
            active: userDeviceTokens.active,
            lastUsedAt: userDeviceTokens.lastUsedAt,
            createdAt: userDeviceTokens.createdAt,
          })
          .from(userDeviceTokens)
          .where(eq(userDeviceTokens.userId, ctx.user.id));

        return {
          tokens,
          activeCount: tokens.filter(t => t.active).length,
        };
      } catch (error) {
        log.error('Failed to get push tokens', 'USER', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get push tokens',
        });
      }
    }),

  // Delete user account
  deleteAccount: protectedProcedure
    .input(z.object({
      password: z.string(),
      confirmation: z.literal('DELETE'),
    }))
    .mutation(async ({ input, ctx }) => {
      const { auditService, AuditAction, AuditOutcome, auditHelpers } = await import('../services/audit');
      const context = auditHelpers.extractContext(ctx.req, ctx.session);
      
      try {
        // Verify password
        const { auth } = await import('@/lib/auth/auth-server');
        const signInResponse = await auth.api.signInEmail({
          body: {
            email: ctx.user.email,
            password: input.password,
          },
        });

        if (!signInResponse) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid password',
          });
        }

        // TODO: Check if user owns any organizations
        // If yes, they need to transfer ownership first

        // Soft delete user
        await db
          .update(userTable)
          .set({
            deletedAt: new Date(),
            email: `deleted_${ctx.user.id}_${ctx.user.email}`, // Prevent email reuse
            updatedAt: new Date(),
          })
          .where(eq(userTable.id, ctx.user.id));

        // Log account deletion
        await auditService.logUserManagement(
          AuditAction.USER_DELETED,
          AuditOutcome.SUCCESS,
          ctx.user.id,
          context,
          { email: ctx.user.email },
          null
        );

        log.info('User account deleted', 'USER', {
          userId: ctx.user.id,
          email: ctx.user.email,
        });

        return {
          success: true,
          message: 'Account deleted successfully',
        };
      } catch (error: any) {
        // Log failed deletion attempt
        await auditService.logUserManagement(
          AuditAction.USER_DELETED,
          AuditOutcome.FAILURE,
          ctx.user.id,
          context,
          null,
          { error: error.message }
        );

        if (error instanceof TRPCError) throw error;

        log.error('Failed to delete account', 'USER', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete account',
        });
      }
    }),
});