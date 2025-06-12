/**
 * Escalation Timer Service
 * Handles automatic escalation of alerts based on time and acknowledgment status
 */

import { db } from '@/src/db';
import { 
  alerts, 
  alertEscalations, 
  notificationLogs,
  healthcareAuditLogs 
} from '@/src/db/healthcare-schema';
import { users } from '@/src/db/schema';
import { eq, and, lt, or } from 'drizzle-orm';
import { 
  HEALTHCARE_ESCALATION_TIERS
} from '@/types/healthcare';
import { log } from '@/lib/core/debug/logger';
import { alertEventHelpers } from './alert-subscriptions';

// Service configuration
const ESCALATION_CHECK_INTERVAL = 60000; // Check every minute
const MAX_ESCALATION_TIER = 3; // Maximum escalation tier

interface EscalationResult {
  alertId: string;
  fromTier: number;
  toTier: number;
  notifiedUsers: string[];
  success: boolean;
  error?: string;
}

export class EscalationTimerService {
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the escalation timer service
   */
  start() {
    if (this.isRunning) {
      log.warn('Escalation timer service already running', 'ESCALATION');
      return;
    }

    log.info('Starting escalation timer service', 'ESCALATION');
    this.isRunning = true;

    // Run initial check
    this.checkAndEscalateAlerts();

    // Set up interval
    this.checkInterval = setInterval(() => {
      this.checkAndEscalateAlerts();
    }, ESCALATION_CHECK_INTERVAL);
  }

  /**
   * Stop the escalation timer service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    log.info('Stopping escalation timer service', 'ESCALATION');
    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check for alerts that need escalation and process them
   */
  private async checkAndEscalateAlerts() {
    try {
      const now = new Date();
      
      // Find alerts that need escalation
      const alertsToEscalate = await db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.status, 'active'),
            lt(alerts.nextEscalationAt, now),
            lt(alerts.escalationLevel, MAX_ESCALATION_TIER)
          )
        );

      if (alertsToEscalate.length === 0) {
        return;
      }

      log.info(`Found ${alertsToEscalate.length} alerts to escalate`, 'ESCALATION');

      // Process each alert
      const results = await Promise.allSettled(
        alertsToEscalate.map(alert => this.escalateAlert(alert))
      );

      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      log.info(`Escalation complete: ${successful} successful, ${failed} failed`, 'ESCALATION');
    } catch (error) {
      log.error('Error checking alerts for escalation', 'ESCALATION', error);
    }
  }

  /**
   * Escalate a single alert
   */
  private async escalateAlert(alert: typeof alerts.$inferSelect): Promise<EscalationResult> {
    const fromTier = alert.escalationLevel || 1;
    const toTier = fromTier + 1;

    try {
      // Get the current and next escalation tier configurations
      const currentTier = HEALTHCARE_ESCALATION_TIERS[fromTier - 1]; // 0-indexed
      const nextTier = HEALTHCARE_ESCALATION_TIERS[toTier - 1]; // 0-indexed
      
      if (!nextTier) {
        throw new Error(`No escalation tier found for tier ${toTier}`);
      }
      
      // Get role names from tier configurations
      const fromRole = currentTier?.role || 'nurse'; // Default to nurse if no current tier
      const toRole = nextTier.role;
      
      // Verification log to ensure new code is running
      log.info(`Escalating alert ${alert.id} from ${fromRole} (tier ${fromTier}) to ${toRole} (tier ${toTier})`, 'ESCALATION');

      // Begin transaction
      const escalationResult = await db.transaction(async (tx) => {
        // Update alert escalation tier and next escalation time
        const nextEscalationTime = toTier < MAX_ESCALATION_TIER
          ? new Date(Date.now() + nextTier.timeout_minutes * 60 * 1000)
          : null;

        await tx
          .update(alerts)
          .set({
            escalationLevel: toTier,
            nextEscalationAt: nextEscalationTime,
            updatedAt: new Date(),
          })
          .where(eq(alerts.id, alert.id));

        // Record escalation
        await tx.insert(alertEscalations).values({
          alertId: alert.id,
          from_role: fromRole,
          to_role: toRole,
          reason: 'timeout',
          escalatedAt: new Date(),
        });

        // Get users to notify based on role
        const rolesToNotify = toRole === 'all_staff' ? ['nurse', 'doctor', 'head_doctor'] : [toRole];
        const usersToNotify = await this.getUsersToNotify(alert.hospitalId, rolesToNotify);

        // Create notification logs
        const notificationPromises = usersToNotify.map(user =>
          tx.insert(notificationLogs).values({
            alertId: alert.id,
            userId: user.id,
            notificationType: 'escalation',
            sentAt: new Date(),
            metadata: {
              escalationTier: toTier,
              alertType: alert.alertType,
              roomNumber: alert.roomNumber,
              urgencyLevel: alert.urgencyLevel,
            },
          })
        );

        await Promise.all(notificationPromises);

        // Audit log for system-initiated escalation
        // Note: After running fix-healthcare-audit-logs.sql, userId can be null for system actions
        try {
          await tx.insert(healthcareAuditLogs).values({
            userId: null as any, // System action - no user involved
            action: 'alert_escalated',
            entityType: 'alert',
            entityId: alert.id,
            hospitalId: alert.hospitalId,
            metadata: {
              fromTier,
              toTier,
              reason: 'timeout',
              notifiedUsers: usersToNotify.map((u: any) => u.id),
              systemAction: true,
              escalatedBy: 'automatic_timeout',
            },
          });
        } catch (auditError) {
          // Fallback: If the migration hasn't been run yet, use the alert creator
          log.error('[ESCALATION] Failed to log with null userId, using creator as fallback', auditError);
          await tx.insert(healthcareAuditLogs).values({
            userId: alert.createdBy,
            action: 'alert_escalated',
            entityType: 'alert',
            entityId: alert.id,
            hospitalId: alert.hospitalId,
            metadata: {
              fromTier,
              toTier,
              reason: 'timeout',
              notifiedUsers: usersToNotify.map((u: any) => u.id),
              systemAction: true,
              escalatedBy: 'automatic_timeout',
            },
          });
        }

        return {
          alertId: alert.id,
          fromTier,
          toTier,
          notifiedUsers: usersToNotify.map(u => u.id),
          success: true,
        };
      });

      // Emit escalation event for real-time updates
      await alertEventHelpers.emitAlertEscalated(
        alert.id,
        alert.hospitalId,
        fromTier,
        toTier
      );

      // TODO: Send actual notifications (push, SMS, etc.)
      // This would integrate with your notification service

      log.info(`Alert ${alert.id} escalated from tier ${fromTier} to ${toTier}`, 'ESCALATION', {
        alertId: alert.id,
        roomNumber: alert.roomNumber,
        notifiedUsers: escalationResult.notifiedUsers.length,
      });

      return escalationResult;
    } catch (error) {
      log.error(`Failed to escalate alert ${alert.id}`, 'ESCALATION', error);
      return {
        alertId: alert.id,
        fromTier,
        toTier,
        notifiedUsers: [],
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get users to notify based on roles and hospital
   */
  private async getUsersToNotify(hospitalId: string, roles: string[]) {
    try {
      const usersToNotify = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(
          and(
            eq(users.organizationId, hospitalId),
            or(...roles.map(role => eq(users.role, role)))
          )
        );

      return usersToNotify;
    } catch (error) {
      log.error('Failed to get users to notify', 'ESCALATION', error);
      return [];
    }
  }

  /**
   * Manually trigger escalation for an alert (for testing)
   */
  async triggerEscalation(alertId: string): Promise<EscalationResult> {
    try {
      const [alert] = await db
        .select()
        .from(alerts)
        .where(eq(alerts.id, alertId))
        .limit(1);

      if (!alert) {
        throw new Error('Alert not found');
      }

      if (alert.status !== 'active') {
        throw new Error('Only active alerts can be escalated');
      }

      if (alert.currentEscalationTier >= MAX_ESCALATION_TIER) {
        throw new Error('Alert already at maximum escalation tier');
      }

      return await this.escalateAlert(alert);
    } catch (error) {
      log.error(`Failed to manually trigger escalation for alert ${alertId}`, 'ESCALATION', error);
      throw error;
    }
  }

  /**
   * Get escalation status for an alert
   */
  async getEscalationStatus(alertId: string) {
    try {
      const [alert] = await db
        .select()
        .from(alerts)
        .where(eq(alerts.id, alertId))
        .limit(1);

      if (!alert) {
        throw new Error('Alert not found');
      }

      const escalations = await db
        .select()
        .from(alertEscalations)
        .where(eq(alertEscalations.alertId, alertId))
        .orderBy(alertEscalations.escalatedAt);

      const currentTier = HEALTHCARE_ESCALATION_TIERS[alert.currentEscalationTier - 1];
      const timeUntilNextEscalation = alert.nextEscalationAt
        ? Math.max(0, alert.nextEscalationAt.getTime() - Date.now())
        : null;

      return {
        alertId,
        currentTier: alert.currentEscalationTier,
        maxTier: MAX_ESCALATION_TIER,
        currentTierConfig: currentTier,
        timeUntilNextEscalation,
        escalationHistory: escalations,
        canEscalate: alert.status === 'active' && alert.currentEscalationTier < MAX_ESCALATION_TIER,
      };
    } catch (error) {
      log.error(`Failed to get escalation status for alert ${alertId}`, 'ESCALATION', error);
      throw error;
    }
  }
}

// Export singleton instance
export const escalationTimerService = new EscalationTimerService();