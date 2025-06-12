import { z } from 'zod';
import { 
  router, 
  protectedProcedure, 
  createPermissionProcedure,
  adminProcedure 
} from '../trpc';
import { db } from '@/src/db';
import { 
  alerts, 
  alertEscalations, 
  alertAcknowledgments,
  healthcareAuditLogs,
  healthcareUsers,
  alertTimelineEvents
} from '@/src/db/healthcare-schema';
import { users } from '@/src/db/schema';
import { eq, and, desc, or, gte, lte, asc, sql } from 'drizzle-orm';
import { 
  CreateAlertSchema, 
  AcknowledgeAlertSchema,
  UpdateUserRoleSchema,
  HealthcareProfileSchema,
  HEALTHCARE_ESCALATION_TIERS
} from '@/types/healthcare';
import { log } from '@/lib/core/debug/logger';
import { escalationTimerService } from '../services/escalation-timer';
import { 
  alertEventHelpers,
  trackedHospitalAlerts,
  subscribeToHospitalAlerts
} from '../services/alert-subscriptions';

// Create permission-based procedures for healthcare roles
const operatorProcedure = createPermissionProcedure('create_alerts');
const doctorProcedure = createPermissionProcedure('acknowledge_alerts');
const viewAlertsProcedure = createPermissionProcedure('view_alerts');

export const healthcareRouter = router({
  // Create a new alert (operators only)
  createAlert: operatorProcedure
    .input(CreateAlertSchema)
    .mutation(async ({ input, ctx }) => {
      const { roomNumber, alertType, urgencyLevel, description, hospitalId } = input;
      
      try {
        // Create the alert
        const [newAlert] = await db.insert(alerts).values({
          roomNumber,
          alertType,
          urgencyLevel,
          description,
          createdBy: ctx.user.id,
          hospitalId,
          status: 'active',
          // Set escalation timer based on urgency
          nextEscalationAt: new Date(Date.now() + HEALTHCARE_ESCALATION_TIERS[0].timeout_minutes * 60 * 1000),
        }).returning();

        // Log the alert creation
        await db.insert(healthcareAuditLogs).values({
          userId: ctx.user.id,
          action: 'alert_created',
          entityType: 'alert',
          entityId: newAlert.id,
          hospitalId,
          metadata: {
            alertType,
            urgencyLevel,
            roomNumber,
          },
          ipAddress: ctx.headers?.['x-forwarded-for'] || ctx.headers?.['x-real-ip'],
          userAgent: ctx.headers?.['user-agent'],
        });

        // Emit alert created event
        await alertEventHelpers.emitAlertCreated(newAlert);

        log.info('Alert created', 'HEALTHCARE', {
          alertId: newAlert.id,
          alertType,
          urgencyLevel,
          roomNumber,
          createdBy: ctx.user.id,
        });

        return {
          success: true,
          alert: newAlert,
        };
      } catch (error) {
        log.error('Failed to create alert', 'HEALTHCARE', error);
        throw new Error('Failed to create alert');
      }
    }),

  // Get active alerts (based on user role)
  getActiveAlerts: viewAlertsProcedure
    .input(z.object({
      hospitalId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      const { hospitalId, limit, offset } = input;
      
      try {
        // Get active alerts for the hospital
        const activeAlerts = await db
          .select({
            alert: alerts,
            creator: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
            acknowledgedBy: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
          })
          .from(alerts)
          .leftJoin(users, eq(alerts.createdBy, users.id))
          .leftJoin(users, eq(alerts.acknowledgedBy, users.id))
          .where(
            and(
              eq(alerts.hospitalId, hospitalId),
              or(
                eq(alerts.status, 'active'),
                eq(alerts.status, 'acknowledged')
              )
            )
          )
          .orderBy(desc(alerts.urgencyLevel), desc(alerts.createdAt))
          .limit(limit)
          .offset(offset);

        return {
          alerts: activeAlerts,
          total: activeAlerts.length,
        };
      } catch (error) {
        log.error('Failed to fetch active alerts', 'HEALTHCARE', error);
        throw new Error('Failed to fetch active alerts');
      }
    }),

  // Acknowledge an alert (doctors and nurses)
  acknowledgeAlert: doctorProcedure
    .input(AcknowledgeAlertSchema)
    .mutation(async ({ input, ctx }) => {
      const { 
        alertId, 
        urgencyAssessment, 
        responseAction, 
        estimatedResponseTime, 
        delegateTo,
        notes 
      } = input;
      
      try {
        // Validate required fields based on response action
        if ((responseAction === 'responding' || responseAction === 'delayed') && !estimatedResponseTime) {
          throw new Error('Estimated response time is required for this action');
        }
        
        if (responseAction === 'delegating' && !delegateTo) {
          throw new Error('Delegate recipient is required for delegation');
        }

        // Get the alert
        const [alert] = await db
          .select()
          .from(alerts)
          .where(eq(alerts.id, alertId))
          .limit(1);

        if (!alert) {
          throw new Error('Alert not found');
        }

        if (alert.status !== 'active') {
          throw new Error('Alert is not active');
        }

        // Calculate response time
        const responseTimeSeconds = Math.floor(
          (Date.now() - alert.createdAt.getTime()) / 1000
        );

        // Determine new urgency level based on assessment
        let newUrgencyLevel = alert.urgencyLevel;
        if (urgencyAssessment === 'increase' && alert.urgencyLevel > 1) {
          newUrgencyLevel = alert.urgencyLevel - 1; // Lower number = higher urgency
        } else if (urgencyAssessment === 'decrease' && alert.urgencyLevel < 5) {
          newUrgencyLevel = alert.urgencyLevel + 1; // Higher number = lower urgency
        }

        // Update alert status and urgency
        await db
          .update(alerts)
          .set({
            status: 'acknowledged',
            acknowledgedBy: ctx.user.id,
            acknowledgedAt: new Date(),
            urgencyLevel: newUrgencyLevel,
          })
          .where(eq(alerts.id, alertId));

        // Create acknowledgment record with extended data
        const [acknowledgment] = await db.insert(alertAcknowledgments).values({
          alertId,
          userId: ctx.user.id,
          responseTimeSeconds,
          notes,
          urgencyAssessment,
          responseAction,
          estimatedResponseTime: estimatedResponseTime || null,
          delegatedTo: delegateTo || null,
        }).returning();

        // Create timeline event
        await db.insert(alertTimelineEvents).values({
          alertId,
          eventType: 'acknowledged',
          userId: ctx.user.id,
          description: `Alert acknowledged by ${ctx.user.name || ctx.user.email}`,
          metadata: {
            responseAction,
            urgencyAssessment,
            estimatedResponseTime,
            delegateTo,
            responseTimeSeconds,
          },
        });

        // If urgency was changed, create another timeline event
        if (newUrgencyLevel !== alert.urgencyLevel) {
          await db.insert(alertTimelineEvents).values({
            alertId,
            eventType: 'urgency_changed',
            userId: ctx.user.id,
            description: `Urgency ${urgencyAssessment === 'increase' ? 'increased' : 'decreased'} from Level ${alert.urgencyLevel} to Level ${newUrgencyLevel}`,
            metadata: {
              previousUrgency: alert.urgencyLevel,
              newUrgency: newUrgencyLevel,
              reason: urgencyAssessment,
            },
          });
        }

        // Cancel escalation timer since alert is acknowledged
        await escalationTimerService.cancelEscalation(alertId);

        // Log the acknowledgment
        await db.insert(healthcareAuditLogs).values({
          userId: ctx.user.id,
          action: 'alert_acknowledged',
          entityType: 'alert',
          entityId: alertId,
          hospitalId: alert.hospitalId,
          metadata: {
            responseTimeSeconds,
            escalationLevel: alert.escalationLevel,
          },
          ipAddress: ctx.headers?.['x-forwarded-for'] || ctx.headers?.['x-real-ip'],
          userAgent: ctx.headers?.['user-agent'],
        });

        // Emit alert acknowledged event
        await alertEventHelpers.emitAlertAcknowledged(
          alertId,
          alert.hospitalId,
          ctx.user.id
        );

        log.info('Alert acknowledged', 'HEALTHCARE', {
          alertId,
          acknowledgedBy: ctx.user.id,
          responseTimeSeconds,
        });

        return {
          success: true,
          responseTimeSeconds,
        };
      } catch (error) {
        log.error('Failed to acknowledge alert', 'HEALTHCARE', error);
        throw error;
      }
    }),

  // Resolve an alert
  resolveAlert: doctorProcedure
    .input(z.object({
      alertId: z.string().uuid(),
      resolution: z.string().min(10, "Resolution notes must be at least 10 characters"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { alertId, resolution } = input;
      
      try {
        // Update alert status
        const [resolvedAlert] = await db
          .update(alerts)
          .set({
            status: 'resolved',
            resolvedAt: new Date(),
            description: resolution,
          })
          .where(
            and(
              eq(alerts.id, alertId),
              eq(alerts.status, 'acknowledged')
            )
          )
          .returning();

        if (!resolvedAlert) {
          throw new Error('Alert not found or not acknowledged');
        }

        // Log the resolution
        await db.insert(healthcareAuditLogs).values({
          userId: ctx.user.id,
          action: 'alert_resolved',
          entityType: 'alert',
          entityId: alertId,
          hospitalId: resolvedAlert.hospitalId,
          metadata: {
            resolution,
            totalTimeSeconds: Math.floor(
              (resolvedAlert.resolvedAt.getTime() - resolvedAlert.createdAt.getTime()) / 1000
            ),
          },
          ipAddress: ctx.headers?.['x-forwarded-for'] || ctx.headers?.['x-real-ip'],
          userAgent: ctx.headers?.['user-agent'],
        });

        // Emit alert resolved event
        await alertEventHelpers.emitAlertResolved(
          alertId,
          resolvedAlert.hospitalId,
          ctx.user.id,
          resolution
        );

        return {
          success: true,
          alert: resolvedAlert,
        };
      } catch (error) {
        log.error('Failed to resolve alert', 'HEALTHCARE', error);
        throw error;
      }
    }),

  // Get alert history
  getAlertHistory: viewAlertsProcedure
    .input(z.object({
      hospitalId: z.string().uuid(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      const { hospitalId, startDate, endDate, limit, offset } = input;
      
      try {
        let query = db
          .select()
          .from(alerts)
          .where(eq(alerts.hospitalId, hospitalId));

        if (startDate) {
          query = query.where(gte(alerts.createdAt, startDate));
        }

        if (endDate) {
          query = query.where(lte(alerts.createdAt, endDate));
        }

        const alertHistory = await query
          .orderBy(desc(alerts.createdAt))
          .limit(limit)
          .offset(offset);

        return {
          alerts: alertHistory,
          total: alertHistory.length,
        };
      } catch (error) {
        log.error('Failed to fetch alert history', 'HEALTHCARE', error);
        throw new Error('Failed to fetch alert history');
      }
    }),

  // Update user healthcare profile
  updateHealthcareProfile: protectedProcedure
    .input(HealthcareProfileSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if healthcare user record exists
        const existing = await db
          .select()
          .from(healthcareUsers)
          .where(eq(healthcareUsers.userId, ctx.user.id))
          .limit(1);

        if (existing.length > 0) {
          // Update existing record
          await db
            .update(healthcareUsers)
            .set(input)
            .where(eq(healthcareUsers.userId, ctx.user.id));
        } else {
          // Create new record
          await db.insert(healthcareUsers).values({
            userId: ctx.user.id,
            ...input,
          });
        }

        return {
          success: true,
        };
      } catch (error) {
        log.error('Failed to update healthcare profile', 'HEALTHCARE', error);
        throw new Error('Failed to update healthcare profile');
      }
    }),

  // Admin: Update user role
  updateUserRole: adminProcedure
    .input(UpdateUserRoleSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId, role } = input;
      
      try {
        // Update user role
        await db
          .update(users)
          .set({ role })
          .where(eq(users.id, userId));

        // Log the role change
        await db.insert(healthcareAuditLogs).values({
          userId: ctx.user.id,
          action: 'role_changed',
          entityType: 'user',
          entityId: userId,
          hospitalId: input.hospitalId,
          metadata: {
            newRole: role,
            changedBy: ctx.user.id,
          },
          ipAddress: ctx.headers?.['x-forwarded-for'] || ctx.headers?.['x-real-ip'],
          userAgent: ctx.headers?.['user-agent'],
        });

        return {
          success: true,
        };
      } catch (error) {
        log.error('Failed to update user role', 'HEALTHCARE', error);
        throw new Error('Failed to update user role');
      }
    }),

  // Get user's current on-duty status
  getOnDutyStatus: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const [healthcareUser] = await db
          .select()
          .from(healthcareUsers)
          .where(eq(healthcareUsers.userId, ctx.user.id))
          .limit(1);

        return {
          isOnDuty: healthcareUser?.isOnDuty || false,
          shiftStartTime: healthcareUser?.shiftStartTime,
          shiftEndTime: healthcareUser?.shiftEndTime,
        };
      } catch (error) {
        log.error('Failed to get on-duty status', 'HEALTHCARE', error);
        throw new Error('Failed to get on-duty status');
      }
    }),

  // Toggle on-duty status
  toggleOnDuty: protectedProcedure
    .input(z.object({
      isOnDuty: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const now = new Date();
        
        await db
          .update(healthcareUsers)
          .set({
            isOnDuty: input.isOnDuty,
            shiftStartTime: input.isOnDuty ? now : null,
            shiftEndTime: input.isOnDuty ? null : now,
          })
          .where(eq(healthcareUsers.userId, ctx.user.id));

        return {
          success: true,
          isOnDuty: input.isOnDuty,
        };
      } catch (error) {
        log.error('Failed to toggle on-duty status', 'HEALTHCARE', error);
        throw new Error('Failed to toggle on-duty status');
      }
    }),

  // Get escalation status for an alert
  getEscalationStatus: viewAlertsProcedure
    .input(z.object({
      alertId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      try {
        const status = await escalationTimerService.getEscalationStatus(input.alertId);
        return status;
      } catch (error) {
        log.error('Failed to get escalation status', 'HEALTHCARE', error);
        throw new Error('Failed to get escalation status');
      }
    }),

  // Get single alert details
  getAlert: viewAlertsProcedure
    .input(z.object({
      alertId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      try {
        const [alert] = await db
          .select({
            id: alerts.id,
            alertType: alerts.alertType,
            urgencyLevel: alerts.urgencyLevel,
            roomNumber: alerts.roomNumber,
            patientName: alerts.patientName,
            patientId: alerts.patientId,
            description: alerts.description,
            status: alerts.status,
            hospitalId: alerts.hospitalId,
            createdAt: alerts.createdAt,
            createdBy: alerts.createdBy,
            acknowledgedBy: alerts.acknowledgedBy,
            acknowledgedAt: alerts.acknowledgedAt,
            resolvedBy: alerts.resolvedBy,
            resolvedAt: alerts.resolvedAt,
            creatorName: users.name,
          })
          .from(alerts)
          .leftJoin(users, eq(alerts.createdBy, users.id))
          .where(eq(alerts.id, input.alertId))
          .limit(1);

        if (!alert) {
          throw new Error('Alert not found');
        }

        return alert;
      } catch (error) {
        log.error('Failed to get alert', 'HEALTHCARE', error);
        throw new Error('Failed to get alert details');
      }
    }),

  // Get on-duty staff
  getOnDutyStaff: viewAlertsProcedure
    .input(z.object({
      hospitalId: z.string().uuid(),
      role: z.enum(['doctor', 'nurse', 'head_doctor']).optional(),
    }))
    .query(async ({ input }) => {
      try {
        let query = db
          .select({
            userId: healthcareUsers.userId,
            name: users.name,
            role: healthcareUsers.role,
            departmentId: healthcareUsers.departmentId,
            isOnDuty: healthcareUsers.isOnDuty,
          })
          .from(healthcareUsers)
          .innerJoin(users, eq(healthcareUsers.userId, users.id))
          .where(
            and(
              eq(healthcareUsers.hospitalId, input.hospitalId),
              eq(healthcareUsers.isOnDuty, true)
            )
          );

        const staff = await query;
        
        return {
          staff: input.role 
            ? staff.filter(s => s.role === input.role)
            : staff,
          total: staff.length,
        };
      } catch (error) {
        log.error('Failed to get on-duty staff', 'HEALTHCARE', error);
        throw new Error('Failed to get on-duty staff');
      }
    }),

  // Get escalation history for an alert
  getEscalationHistory: viewAlertsProcedure
    .input(z.object({
      alertId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      try {
        const escalations = await db
          .select({
            escalation: alertEscalations,
            alertInfo: {
              id: alerts.id,
              roomNumber: alerts.roomNumber,
              alertType: alerts.alertType,
            },
          })
          .from(alertEscalations)
          .leftJoin(alerts, eq(alertEscalations.alertId, alerts.id))
          .where(eq(alertEscalations.alertId, input.alertId))
          .orderBy(desc(alertEscalations.escalatedAt));

        return {
          escalations,
          total: escalations.length,
        };
      } catch (error) {
        log.error('Failed to get escalation history', 'HEALTHCARE', error);
        throw new Error('Failed to get escalation history');
      }
    }),

  // Manually trigger escalation (admin only)
  triggerEscalation: adminProcedure
    .input(z.object({
      alertId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await escalationTimerService.triggerEscalation(input.alertId);
        
        // Log manual escalation
        await db.insert(healthcareAuditLogs).values({
          userId: ctx.user.id,
          action: 'manual_escalation',
          entityType: 'alert',
          entityId: input.alertId,
          hospitalId: ctx.user.organizationId,
          metadata: result,
          ipAddress: ctx.headers?.['x-forwarded-for'] || ctx.headers?.['x-real-ip'],
          userAgent: ctx.headers?.['user-agent'],
        });

        return result;
      } catch (error) {
        log.error('Failed to trigger manual escalation', 'HEALTHCARE', error);
        throw error;
      }
    }),

  // Get active escalations summary for dashboard
  getActiveEscalations: viewAlertsProcedure
    .input(z.object({
      hospitalId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      try {
        // Get all active alerts with their escalation status
        const activeAlerts = await db
          .select({
            id: alerts.id,
            roomNumber: alerts.roomNumber,
            alertType: alerts.alertType,
            urgencyLevel: alerts.urgencyLevel,
            currentEscalationTier: alerts.currentEscalationTier,
            nextEscalationAt: alerts.nextEscalationAt,
            createdAt: alerts.createdAt,
            acknowledgedAt: alerts.acknowledgedAt,
          })
          .from(alerts)
          .where(
            and(
              eq(alerts.hospitalId, input.hospitalId),
              eq(alerts.status, 'active')
            )
          )
          .orderBy(desc(alerts.currentEscalationTier), desc(alerts.urgencyLevel));

        // Calculate time until next escalation for each alert
        const alertsWithTiming = activeAlerts.map(alert => {
          const timeUntilEscalation = alert.nextEscalationAt
            ? Math.max(0, alert.nextEscalationAt.getTime() - Date.now())
            : null;

          return {
            ...alert,
            timeUntilEscalation,
            isOverdue: timeUntilEscalation === 0,
            minutesUntilEscalation: timeUntilEscalation ? Math.ceil(timeUntilEscalation / 60000) : null,
          };
        });

        // Group by escalation tier
        const byTier = alertsWithTiming.reduce((acc, alert) => {
          const tier = alert.currentEscalationTier;
          if (!acc[tier]) {
            acc[tier] = [];
          }
          acc[tier].push(alert);
          return acc;
        }, {} as Record<number, typeof alertsWithTiming>);

        return {
          totalActive: activeAlerts.length,
          byTier,
          overdue: alertsWithTiming.filter(a => a.isOverdue).length,
          nextEscalationIn5Minutes: alertsWithTiming.filter(
            a => a.minutesUntilEscalation && a.minutesUntilEscalation <= 5
          ).length,
        };
      } catch (error) {
        log.error('Failed to get active escalations', 'HEALTHCARE', error);
        throw new Error('Failed to get active escalations');
      }
    }),

  // Get metrics for dashboard
  getMetrics: viewAlertsProcedure
    .input(z.object({
      timeRange: z.enum(['1h', '6h', '24h', '7d']).default('24h'),
      department: z.string().default('all'),
    }))
    .query(async ({ input }) => {
      try {
        // Mock metrics data (in a real app, this would aggregate from database)
        const activeAlerts = Math.floor(Math.random() * 10) + 5;
        const staffOnline = Math.floor(Math.random() * 20) + 15;
        
        const metrics = {
          // Primary metrics
          activeAlerts,
          alertsTrend: Math.random() > 0.5 ? Math.floor(Math.random() * 20) - 10 : 0,
          alertCapacity: 50,
          
          // Response times
          avgResponseTime: parseFloat((Math.random() * 5 + 1).toFixed(1)),
          
          // Staff metrics
          staffOnline,
          totalStaff: 30,
          minStaffRequired: 15,
          
          // Alert breakdown
          criticalAlerts: Math.floor(activeAlerts * 0.2),
          urgentAlerts: Math.floor(activeAlerts * 0.3),
          standardAlerts: Math.floor(activeAlerts * 0.5),
          resolvedToday: Math.floor(Math.random() * 20) + 10,
          
          // Department stats
          departmentStats: [
            { id: 'emergency', name: 'Emergency', alerts: 3, responseRate: 0.95 },
            { id: 'icu', name: 'ICU', alerts: 2, responseRate: 0.98 },
            { id: 'cardiology', name: 'Cardiology', alerts: 1, responseRate: 0.92 },
            { id: 'general', name: 'General', alerts: 4, responseRate: 0.88 },
          ],
        };
        
        log.info('Metrics fetched', 'HEALTHCARE', {
          timeRange: input.timeRange,
          department: input.department,
        });
        
        return metrics;
      } catch (error) {
        log.error('Failed to fetch metrics', 'HEALTHCARE', error);
        throw new Error('Failed to fetch metrics');
      }
    }),
    
  // Get alert timeline - full lifecycle events
  getAlertTimeline: viewAlertsProcedure
    .input(z.object({
      alertId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      try {
        // Get the main alert details
        const [alert] = await db
          .select({
            alert: alerts,
            creator: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
            acknowledgedBy: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
          })
          .from(alerts)
          .leftJoin(users, eq(alerts.createdBy, users.id))
          .leftJoin(users, eq(alerts.acknowledgedBy, users.id))
          .where(eq(alerts.id, input.alertId))
          .limit(1);

        if (!alert) {
          throw new Error('Alert not found');
        }

        // Get all timeline events
        const timelineEvents = await db
          .select({
            event: alertTimelineEvents,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
              role: users.role,
            },
          })
          .from(alertTimelineEvents)
          .leftJoin(users, eq(alertTimelineEvents.userId, users.id))
          .where(eq(alertTimelineEvents.alertId, input.alertId))
          .orderBy(asc(alertTimelineEvents.eventTime));

        // Get all acknowledgments
        const acknowledgments = await db
          .select({
            acknowledgment: alertAcknowledgments,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
              role: users.role,
            },
          })
          .from(alertAcknowledgments)
          .leftJoin(users, eq(alertAcknowledgments.userId, users.id))
          .where(eq(alertAcknowledgments.alertId, input.alertId))
          .orderBy(asc(alertAcknowledgments.acknowledgedAt));

        // Get all escalations
        const escalations = await db
          .select()
          .from(alertEscalations)
          .where(eq(alertEscalations.alertId, input.alertId))
          .orderBy(asc(alertEscalations.escalatedAt));

        // Combine into a unified timeline
        const timeline = [
          // Created event
          {
            type: 'created',
            time: alert.alert.createdAt,
            user: alert.creator,
            data: {
              roomNumber: alert.alert.roomNumber,
              alertType: alert.alert.alertType,
              urgencyLevel: alert.alert.urgencyLevel,
              description: alert.alert.description,
            },
          },
          // Timeline events
          ...timelineEvents.map(e => ({
            type: e.event.eventType,
            time: e.event.eventTime,
            user: e.user,
            data: {
              description: e.event.description,
              metadata: e.event.metadata,
            },
          })),
          // Acknowledgments
          ...acknowledgments.map(a => ({
            type: 'acknowledged',
            time: a.acknowledgment.acknowledgedAt,
            user: a.user,
            data: {
              responseTimeSeconds: a.acknowledgment.responseTimeSeconds,
              notes: a.acknowledgment.notes,
            },
          })),
          // Escalations
          ...escalations.map(e => ({
            type: 'escalated',
            time: e.escalatedAt,
            user: null,
            data: {
              fromRole: e.from_role,
              toRole: e.to_role,
              reason: e.reason,
            },
          })),
          // Resolved event
          ...(alert.alert.resolvedAt ? [{
            type: 'resolved',
            time: alert.alert.resolvedAt,
            user: alert.acknowledgedBy,
            data: {
              description: alert.alert.description,
            },
          }] : []),
        ].sort((a, b) => a.time.getTime() - b.time.getTime());

        return {
          alert: alert.alert,
          timeline,
          totalEvents: timeline.length,
          responseTime: alert.alert.acknowledgedAt 
            ? Math.floor((alert.alert.acknowledgedAt.getTime() - alert.alert.createdAt.getTime()) / 1000)
            : null,
          resolutionTime: alert.alert.resolvedAt
            ? Math.floor((alert.alert.resolvedAt.getTime() - alert.alert.createdAt.getTime()) / 1000)
            : null,
        };
      } catch (error) {
        log.error('Failed to fetch alert timeline', 'HEALTHCARE', error);
        throw error;
      }
    }),

  // Bulk acknowledge alerts
  bulkAcknowledgeAlerts: doctorProcedure
    .input(z.object({
      alertIds: z.array(z.string().uuid()),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const results = [];
        
        for (const alertId of input.alertIds) {
          try {
            // Get the alert
            const [alert] = await db
              .select()
              .from(alerts)
              .where(eq(alerts.id, alertId))
              .limit(1);

            if (!alert || alert.status !== 'active') {
              results.push({
                alertId,
                success: false,
                error: 'Alert not found or not active',
              });
              continue;
            }

            // Calculate response time
            const responseTimeSeconds = Math.floor(
              (Date.now() - alert.createdAt.getTime()) / 1000
            );

            // Update alert status
            await db
              .update(alerts)
              .set({
                status: 'acknowledged',
                acknowledgedBy: ctx.user.id,
                acknowledgedAt: new Date(),
              })
              .where(eq(alerts.id, alertId));

            // Create acknowledgment record
            await db.insert(alertAcknowledgments).values({
              alertId,
              userId: ctx.user.id,
              responseTimeSeconds,
              notes: input.notes,
            });

            // Create timeline event
            await db.insert(alertTimelineEvents).values({
              alertId,
              eventType: 'acknowledged',
              userId: ctx.user.id,
              description: `Bulk acknowledged with ${input.alertIds.length - 1} other alerts`,
              metadata: {
                bulkOperation: true,
                totalAlerts: input.alertIds.length,
              },
            });

            results.push({
              alertId,
              success: true,
              responseTimeSeconds,
            });
          } catch (error) {
            results.push({
              alertId,
              success: false,
              error: error.message,
            });
          }
        }

        // Log bulk operation
        await db.insert(healthcareAuditLogs).values({
          userId: ctx.user.id,
          action: 'bulk_alert_acknowledged',
          entityType: 'alert',
          entityId: input.alertIds[0], // Use first alert ID as reference
          hospitalId: ctx.user.organizationId || ctx.user.hospitalId,
          metadata: {
            alertIds: input.alertIds,
            successCount: results.filter(r => r.success).length,
            failureCount: results.filter(r => !r.success).length,
          },
          ipAddress: ctx.headers?.['x-forwarded-for'] || ctx.headers?.['x-real-ip'],
          userAgent: ctx.headers?.['user-agent'],
        });

        return {
          results,
          summary: {
            total: input.alertIds.length,
            succeeded: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
          },
        };
      } catch (error) {
        log.error('Failed to bulk acknowledge alerts', 'HEALTHCARE', error);
        throw error;
      }
    }),

  // Transfer alert to another user
  transferAlert: doctorProcedure
    .input(z.object({
      alertId: z.string().uuid(),
      toUserId: z.string().uuid(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Get the alert
        const [alert] = await db
          .select()
          .from(alerts)
          .where(eq(alerts.id, input.alertId))
          .limit(1);

        if (!alert) {
          throw new Error('Alert not found');
        }

        if (alert.acknowledgedBy !== ctx.user.id) {
          throw new Error('You can only transfer alerts you have acknowledged');
        }

        // Update alert with new acknowledged user
        await db
          .update(alerts)
          .set({
            acknowledgedBy: input.toUserId,
            handoverNotes: input.reason,
          })
          .where(eq(alerts.id, input.alertId));

        // Create timeline event
        await db.insert(alertTimelineEvents).values({
          alertId: input.alertId,
          eventType: 'transferred',
          userId: ctx.user.id,
          description: input.reason,
          metadata: {
            fromUserId: ctx.user.id,
            toUserId: input.toUserId,
          },
        });

        // Log the transfer
        await db.insert(healthcareAuditLogs).values({
          userId: ctx.user.id,
          action: 'alert_transferred',
          entityType: 'alert',
          entityId: input.alertId,
          hospitalId: alert.hospitalId,
          metadata: {
            fromUserId: ctx.user.id,
            toUserId: input.toUserId,
            reason: input.reason,
          },
          ipAddress: ctx.headers?.['x-forwarded-for'] || ctx.headers?.['x-real-ip'],
          userAgent: ctx.headers?.['user-agent'],
        });

        // Emit transfer event
        await alertEventHelpers.emitAlertUpdated(
          input.alertId,
          alert.hospitalId,
          {
            transferred: true,
            fromUserId: ctx.user.id,
            toUserId: input.toUserId,
          }
        );

        return {
          success: true,
          transferredTo: input.toUserId,
        };
      } catch (error) {
        log.error('Failed to transfer alert', 'HEALTHCARE', error);
        throw error;
      }
    }),

  // Get alert analytics
  getAlertAnalytics: viewAlertsProcedure
    .input(z.object({
      hospitalId: z.string().uuid(),
      startDate: z.date(),
      endDate: z.date(),
      groupBy: z.enum(['day', 'week', 'month']).default('day'),
    }))
    .query(async ({ input }) => {
      try {
        // Get alerts within date range
        const alertsInRange = await db
          .select()
          .from(alerts)
          .where(
            and(
              eq(alerts.hospitalId, input.hospitalId),
              gte(alerts.createdAt, input.startDate),
              lte(alerts.createdAt, input.endDate)
            )
          );

        // Calculate metrics
        const totalAlerts = alertsInRange.length;
        const acknowledgedAlerts = alertsInRange.filter(a => a.acknowledgedAt).length;
        const resolvedAlerts = alertsInRange.filter(a => a.resolvedAt).length;
        const escalatedAlerts = alertsInRange.filter(a => a.escalationLevel > 1).length;

        // Calculate average response times
        const responseTimes = alertsInRange
          .filter(a => a.acknowledgedAt)
          .map(a => (a.acknowledgedAt!.getTime() - a.createdAt.getTime()) / 1000);
        
        const avgResponseTime = responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0;

        // Group by alert type
        const byAlertType = alertsInRange.reduce((acc, alert) => {
          if (!acc[alert.alertType]) {
            acc[alert.alertType] = {
              total: 0,
              acknowledged: 0,
              avgResponseTime: 0,
              responseTimes: [],
            };
          }
          acc[alert.alertType].total++;
          if (alert.acknowledgedAt) {
            acc[alert.alertType].acknowledged++;
            const responseTime = (alert.acknowledgedAt.getTime() - alert.createdAt.getTime()) / 1000;
            acc[alert.alertType].responseTimes.push(responseTime);
          }
          return acc;
        }, {} as Record<string, any>);

        // Calculate average response times by type
        Object.keys(byAlertType).forEach(type => {
          const times = byAlertType[type].responseTimes;
          byAlertType[type].avgResponseTime = times.length > 0
            ? times.reduce((a: number, b: number) => a + b, 0) / times.length
            : 0;
          delete byAlertType[type].responseTimes; // Clean up temporary array
        });

        // Group by urgency level
        const byUrgency = alertsInRange.reduce((acc, alert) => {
          if (!acc[alert.urgencyLevel]) {
            acc[alert.urgencyLevel] = {
              total: 0,
              acknowledged: 0,
              escalated: 0,
            };
          }
          acc[alert.urgencyLevel].total++;
          if (alert.acknowledgedAt) acc[alert.urgencyLevel].acknowledged++;
          if (alert.escalationLevel > 1) acc[alert.urgencyLevel].escalated++;
          return acc;
        }, {} as Record<number, any>);

        // Time series data
        const timeSeries = await generateTimeSeries(
          alertsInRange,
          input.startDate,
          input.endDate,
          input.groupBy
        );

        return {
          summary: {
            totalAlerts,
            acknowledgedAlerts,
            resolvedAlerts,
            escalatedAlerts,
            acknowledgmentRate: totalAlerts > 0 ? (acknowledgedAlerts / totalAlerts) * 100 : 0,
            resolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0,
            escalationRate: totalAlerts > 0 ? (escalatedAlerts / totalAlerts) * 100 : 0,
            avgResponseTime: Math.round(avgResponseTime),
          },
          byAlertType,
          byUrgency,
          timeSeries,
        };
      } catch (error) {
        log.error('Failed to fetch alert analytics', 'HEALTHCARE', error);
        throw error;
      }
    }),

  // Get active alerts with more details
  getActiveAlertsDetailed: viewAlertsProcedure
    .input(z.object({
      includeResolved: z.boolean().default(false),
    }))
    .query(async ({ ctx }) => {
      try {
        // Mock enhanced alert data
        const mockAlerts = [
          {
            id: 'alert-1',
            roomNumber: '302',
            alertType: 'cardiac' as const,
            urgency: 5,
            description: 'Patient experiencing chest pain',
            status: 'active' as const,
            createdAt: new Date(Date.now() - 5 * 60 * 1000),
            createdBy: 'user-1',
            createdByName: 'Operator Smith',
            hospitalId: 'hospital-1',
            acknowledged: false,
            acknowledgedAt: null,
            acknowledgedBy: null,
            acknowledgedByName: null,
            resolved: false,
            resolvedAt: null,
            resolvedBy: null,
            resolvedByName: null,
          },
          {
            id: 'alert-2',
            roomNumber: '215',
            alertType: 'fall' as const,
            urgency: 3,
            description: 'Patient fall detected',
            status: 'acknowledged' as const,
            createdAt: new Date(Date.now() - 15 * 60 * 1000),
            createdBy: 'user-2',
            createdByName: 'Operator Johnson',
            hospitalId: 'hospital-1',
            acknowledged: true,
            acknowledgedAt: new Date(Date.now() - 10 * 60 * 1000),
            acknowledgedBy: 'user-3',
            acknowledgedByName: 'Nurse Davis',
            resolved: false,
            resolvedAt: null,
            resolvedBy: null,
            resolvedByName: null,
          },
        ];
        
        const alerts = mockAlerts.filter(alert => 
          !alert.resolved || input.includeResolved
        );
        
        return {
          alerts,
          total: alerts.length,
        };
      } catch (error) {
        log.error('Failed to fetch active alerts', 'HEALTHCARE', error);
        throw new Error('Failed to fetch active alerts');
      }
    }),

  // Subscribe to alerts (real-time implementation)
  subscribeToAlerts: viewAlertsProcedure
    .input(z.object({
      hospitalId: z.string().uuid(),
      lastEventId: z.string().optional(), // For reconnection support
    }).optional())
    .subscription(async function* ({ input, ctx }) {
      const hospitalId = input?.hospitalId || ctx.user.organizationId || ctx.user.hospitalId;
      
      if (!hospitalId) {
        throw new Error('Hospital ID is required for alert subscription');
      }
      
      log.info('Alert subscription started', 'HEALTHCARE', {
        userId: ctx.user.id,
        hospitalId,
      });
      
      // Use the tracked subscription for reconnection support
      const subscription = trackedHospitalAlerts(hospitalId, input?.lastEventId);
      
      try {
        for await (const event of subscription) {
          // Transform the event for the client
          yield {
            id: `event-${Date.now()}`,
            type: event.type,
            alertId: event.alertId,
            hospitalId: event.hospitalId,
            timestamp: event.timestamp,
            data: event.data,
          };
        }
      } catch (error) {
        log.error('Alert subscription error', 'HEALTHCARE', error);
        throw error;
      } finally {
        log.info('Alert subscription ended', 'HEALTHCARE', {
          userId: ctx.user.id,
          hospitalId,
        });
      }
    }),
    
  // Subscribe to metrics (real-time implementation) 
  subscribeToMetrics: viewAlertsProcedure
    .input(z.object({
      hospitalId: z.string().uuid(),
      interval: z.number().min(1000).max(60000).default(5000), // Update interval in ms
    }).optional())
    .subscription(async function* ({ input, ctx }) {
      const hospitalId = input?.hospitalId || ctx.user.organizationId || ctx.user.hospitalId;
      const interval = input?.interval || 5000;
      
      if (!hospitalId) {
        throw new Error('Hospital ID is required for metrics subscription');
      }
      
      log.info('Metrics subscription started', 'HEALTHCARE', {
        userId: ctx.user.id,
        hospitalId,
        interval,
      });
      
      try {
        while (true) {
          // Fetch real metrics from database
          const [activeAlertsCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(alerts)
            .where(
              and(
                eq(alerts.hospitalId, hospitalId),
                or(
                  eq(alerts.status, 'active'),
                  eq(alerts.status, 'acknowledged')
                )
              )
            );
          
          const [staffOnlineCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(healthcareUsers)
            .where(
              and(
                eq(healthcareUsers.hospitalId, hospitalId),
                eq(healthcareUsers.isOnDuty, true)
              )
            );
          
          // Calculate response rate (last hour)
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const [recentAlerts] = await db
            .select({
              total: sql<number>`count(*)`,
              acknowledged: sql<number>`count(case when acknowledged_at is not null then 1 end)`
            })
            .from(alerts)
            .where(
              and(
                eq(alerts.hospitalId, hospitalId),
                gte(alerts.createdAt, oneHourAgo)
              )
            );
          
          const responseRate = recentAlerts.total > 0 
            ? (recentAlerts.acknowledged / recentAlerts.total) 
            : 1;
          
          // Get critical alerts count
          const [criticalCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(alerts)
            .where(
              and(
                eq(alerts.hospitalId, hospitalId),
                eq(alerts.status, 'active'),
                gte(alerts.urgencyLevel, 4)
              )
            );
          
          yield {
            timestamp: new Date(),
            activeAlerts: activeAlertsCount.count || 0,
            criticalAlerts: criticalCount.count || 0,
            staffOnline: staffOnlineCount.count || 0,
            responseRate: parseFloat(responseRate.toFixed(2)),
            avgResponseTime: await calculateAvgResponseTime(hospitalId, oneHourAgo),
          };
          
          // Wait for next update
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      } catch (error) {
        log.error('Metrics subscription error', 'HEALTHCARE', error);
        throw error;
      } finally {
        log.info('Metrics subscription ended', 'HEALTHCARE', {
          userId: ctx.user.id,
          hospitalId,
        });
      }
    }),
    
  // Acknowledge patient alert (for patient card)
  acknowledgePatientAlert: doctorProcedure
    .input(z.object({
      alertId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // In a real app, this would update the database
        log.info('Patient alert acknowledged', 'HEALTHCARE', {
          alertId: input.alertId,
          userId: ctx.user.id,
        });
        
        return {
          success: true,
          alertId: input.alertId,
          acknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: ctx.user.id,
        };
      } catch (error) {
        log.error('Failed to acknowledge patient alert', 'HEALTHCARE', error);
        throw new Error('Failed to acknowledge patient alert');
      }
    }),
});

// Helper function to generate time series data
async function generateTimeSeries(
  alerts: any[],
  startDate: Date,
  endDate: Date,
  groupBy: 'day' | 'week' | 'month'
) {
  const timeSeries: Record<string, any> = {};
  
  // Initialize buckets based on groupBy
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = getTimeKey(current, groupBy);
    timeSeries[key] = {
      date: new Date(current),
      total: 0,
      acknowledged: 0,
      resolved: 0,
      escalated: 0,
      avgResponseTime: 0,
      responseTimes: [],
    };
    
    // Increment based on groupBy
    if (groupBy === 'day') {
      current.setDate(current.getDate() + 1);
    } else if (groupBy === 'week') {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }
  
  // Populate data
  alerts.forEach(alert => {
    const key = getTimeKey(alert.createdAt, groupBy);
    if (timeSeries[key]) {
      timeSeries[key].total++;
      if (alert.acknowledgedAt) {
        timeSeries[key].acknowledged++;
        const responseTime = (alert.acknowledgedAt.getTime() - alert.createdAt.getTime()) / 1000;
        timeSeries[key].responseTimes.push(responseTime);
      }
      if (alert.resolvedAt) timeSeries[key].resolved++;
      if (alert.escalationLevel > 1) timeSeries[key].escalated++;
    }
  });
  
  // Calculate averages
  Object.values(timeSeries).forEach((bucket: any) => {
    if (bucket.responseTimes.length > 0) {
      bucket.avgResponseTime = bucket.responseTimes.reduce((a: number, b: number) => a + b, 0) / bucket.responseTimes.length;
    }
    delete bucket.responseTimes; // Clean up
  });
  
  return Object.values(timeSeries).sort((a: any, b: any) => a.date.getTime() - b.date.getTime());
}

function getTimeKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  if (groupBy === 'day') {
    return date.toISOString().split('T')[0];
  } else if (groupBy === 'week') {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().split('T')[0];
  } else {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}

// Helper function to calculate average response time
async function calculateAvgResponseTime(hospitalId: string, since: Date): Promise<number> {
  const result = await db
    .select({
      avgSeconds: sql<number>`
        avg(
          extract(epoch from (acknowledged_at - created_at))
        )
      `
    })
    .from(alerts)
    .where(
      and(
        eq(alerts.hospitalId, hospitalId),
        gte(alerts.createdAt, since),
        sql`acknowledged_at is not null`
      )
    );
  
  return Math.round(result[0]?.avgSeconds || 0);
}