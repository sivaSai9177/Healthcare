/**
 * Healthcare Notification Integration
 * Connects the healthcare alert system with the notification service
 */

import { notificationService, NotificationType, Priority } from './notifications';
import { db } from '@/src/db';
import { alerts, healthcareUsers } from '@/src/db/healthcare-schema';
import { users } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/core/debug/logger';

interface AlertNotificationData {
  alertId: string;
  roomNumber: string;
  alertType: string;
  urgencyLevel: number;
  description?: string;
  patientName?: string;
  patientId?: string;
  createdBy: string;
  createdByName?: string;
  hospitalId: string;
}

export class HealthcareNotificationService {
  private readonly BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';

  /**
   * Send notifications when a new alert is created
   */
  async notifyAlertCreated(data: AlertNotificationData): Promise<void> {
    try {
      // Get recipients based on alert urgency and department
      const recipients = await this.getAlertRecipients(data);
      
      if (recipients.length === 0) {
        log.warn('No recipients found for alert', 'HEALTHCARE_NOTIFY', { alertId: data.alertId });
        return;
      }

      // Prepare notification data
      const notificationData = {
        ...data,
        acknowledgeUrl: `${this.BASE_URL}/alerts/${data.alertId}/acknowledge`,
        dashboardUrl: `${this.BASE_URL}/healthcare-dashboard`,
        unsubscribeUrl: `${this.BASE_URL}/settings/notifications`,
        createdAt: new Date().toLocaleString(),
        escalationWarning: data.urgencyLevel >= 4,
        escalationMinutes: this.getEscalationMinutes(data.urgencyLevel),
      };

      // Send notifications to all recipients
      const notifications = recipients.map(recipient => ({
        type: NotificationType.ALERT_CREATED,
        recipient: {
          userId: recipient.userId,
          email: recipient.email,
          phone: recipient.phone,
        },
        priority: this.getPriority(data.urgencyLevel),
        data: notificationData,
        organizationId: data.hospitalId,
      }));

      await notificationService.sendBatch(notifications);
      
      log.info('Alert notifications sent', 'HEALTHCARE_NOTIFY', {
        alertId: data.alertId,
        recipientCount: recipients.length,
      });
    } catch (error) {
      log.error('Failed to send alert notifications', 'HEALTHCARE_NOTIFY', error);
    }
  }

  /**
   * Send notifications when an alert is escalated
   */
  async notifyAlertEscalated(
    alertId: string,
    fromRole: string,
    toRole: string,
    escalationLevel: number
  ): Promise<void> {
    try {
      // Get alert details
      const [alert] = await db
        .select({
          alert: alerts,
          creatorName: users.name,
        })
        .from(alerts)
        .leftJoin(users, eq(alerts.createdBy, users.id))
        .where(eq(alerts.id, alertId))
        .limit(1);

      if (!alert) {
        log.error('Alert not found for escalation', 'HEALTHCARE_NOTIFY', { alertId });
        return;
      }

      // Get recipients for the escalated role
      const recipients = await this.getEscalationRecipients(
        alert.alert.hospitalId,
        toRole,
        escalationLevel
      );

      const alertDuration = Math.floor(
        (Date.now() - alert.alert.createdAt.getTime()) / 60000
      );

      const notificationData = {
        alertId,
        roomNumber: alert.alert.roomNumber,
        alertType: alert.alert.alertType,
        urgencyLevel: alert.alert.urgencyLevel,
        originalUrgency: alert.alert.urgencyLevel,
        escalationLevel,
        alertDuration,
        fromRole,
        toRole,
        escalationReason: `Alert not acknowledged within ${alertDuration} minutes`,
        description: alert.alert.description,
        acknowledgeUrl: `${this.BASE_URL}/alerts/${alertId}/acknowledge`,
        nextLevel: this.getNextEscalationRole(toRole),
        nextEscalationMinutes: this.getEscalationMinutes(escalationLevel + 1),
      };

      const notifications = recipients.map(recipient => ({
        type: NotificationType.ALERT_ESCALATED,
        recipient: {
          userId: recipient.userId,
          email: recipient.email,
          phone: recipient.phone,
        },
        priority: Priority.CRITICAL, // Escalations are always critical
        data: notificationData,
        organizationId: alert.alert.hospitalId,
      }));

      await notificationService.sendBatch(notifications);

      log.info('Escalation notifications sent', 'HEALTHCARE_NOTIFY', {
        alertId,
        toRole,
        recipientCount: recipients.length,
      });
    } catch (error) {
      log.error('Failed to send escalation notifications', 'HEALTHCARE_NOTIFY', error);
    }
  }

  /**
   * Send shift summary emails
   */
  async sendShiftSummary(
    userId: string,
    shiftStart: Date,
    shiftEnd: Date
  ): Promise<void> {
    try {
      // Get user details
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || !user.email) {
        log.warn('User not found or no email for shift summary', 'HEALTHCARE_NOTIFY', { userId });
        return;
      }

      // Get shift statistics
      const stats = await this.getShiftStatistics(userId, shiftStart, shiftEnd);

      // Get notable alerts
      const topAlerts = await this.getTopAlerts(userId, shiftStart, shiftEnd);

      const notificationData = {
        name: user.name,
        shiftDate: shiftStart.toLocaleDateString(),
        shiftStart: shiftStart.toLocaleTimeString(),
        shiftEnd: shiftEnd.toLocaleTimeString(),
        statistics: stats,
        topAlerts,
        dashboardUrl: `${this.BASE_URL}/healthcare-dashboard`,
      };

      await notificationService.send({
        type: NotificationType.SHIFT_SUMMARY,
        recipient: {
          userId: user.id,
          email: user.email,
        },
        priority: Priority.LOW,
        data: notificationData,
      });

      log.info('Shift summary sent', 'HEALTHCARE_NOTIFY', { userId });
    } catch (error) {
      log.error('Failed to send shift summary', 'HEALTHCARE_NOTIFY', error);
    }
  }

  /**
   * Get recipients for a new alert
   */
  private async getAlertRecipients(data: AlertNotificationData): Promise<any[]> {
    try {
      // Base query for healthcare users
      let query = db
        .select({
          userId: healthcareUsers.userId,
          email: users.email,
          phone: users.phoneNumber,
          role: users.role,
          department: healthcareUsers.department,
          isOnDuty: healthcareUsers.isOnDuty,
        })
        .from(healthcareUsers)
        .innerJoin(users, eq(healthcareUsers.userId, users.id))
        .where(
          and(
            eq(healthcareUsers.hospitalId, data.hospitalId),
            eq(healthcareUsers.isOnDuty, true)
          )
        );

      const recipients = await query;

      // Filter based on urgency level
      if (data.urgencyLevel >= 4) {
        // Critical alerts go to all on-duty staff
        return recipients;
      } else if (data.urgencyLevel >= 3) {
        // High urgency goes to doctors and head doctors
        return recipients.filter(r => 
          r.role === 'doctor' || r.role === 'head_doctor'
        );
      } else {
        // Lower urgency goes to assigned department
        return recipients.filter(r => 
          r.departmentId === data.patientId // Assuming patient department
        );
      }
    } catch (error) {
      log.error('Failed to get alert recipients', 'HEALTHCARE_NOTIFY', error);
      return [];
    }
  }

  /**
   * Get recipients for escalation
   */
  private async getEscalationRecipients(
    hospitalId: string,
    toRole: string,
    escalationLevel: number
  ): Promise<any[]> {
    try {
      const recipients = await db
        .select({
          userId: healthcareUsers.userId,
          email: users.email,
          phone: users.phoneNumber,
        })
        .from(healthcareUsers)
        .innerJoin(users, eq(healthcareUsers.userId, users.id))
        .where(
          and(
            eq(healthcareUsers.hospitalId, hospitalId),
            eq(users.role, toRole),
            eq(healthcareUsers.isOnDuty, true)
          )
        );

      // For highest escalation, also notify head doctors even if off duty
      if (escalationLevel >= 3) {
        const headDoctors = await db
          .select({
            userId: healthcareUsers.userId,
            email: users.email,
            phone: users.phoneNumber,
          })
          .from(healthcareUsers)
          .innerJoin(users, eq(healthcareUsers.userId, users.id))
          .where(
            and(
              eq(healthcareUsers.hospitalId, hospitalId),
              eq(users.role, 'head_doctor')
            )
          );

        return [...recipients, ...headDoctors];
      }

      return recipients;
    } catch (error) {
      log.error('Failed to get escalation recipients', 'HEALTHCARE_NOTIFY', error);
      return [];
    }
  }

  /**
   * Get shift statistics
   */
  private async getShiftStatistics(
    _userId: string,
    _shiftStart: Date,
    _shiftEnd: Date
  ): Promise<any> {
    try {
      // TODO: Implement with actual queries
      // This is a placeholder implementation
      const stats = {
        totalAlerts: 15,
        acknowledged: 12,
        resolved: 10,
        escalated: 2,
        avgResponseTime: 3.5,
      };
      return stats;
    } catch (error) {
      log.error('Failed to get shift statistics', 'HEALTHCARE_NOTIFY', error);
      return {
        totalAlerts: 0,
        acknowledged: 0,
        resolved: 0,
        escalated: 0,
        avgResponseTime: 0,
      };
    }
  }

  /**
   * Get top alerts for shift
   */
  private async getTopAlerts(
    _userId: string,
    _shiftStart: Date,
    _shiftEnd: Date,
    _limit = 5
  ): Promise<any[]> {
    try {
      // TODO: Implement with actual queries
      // This is a placeholder implementation
      const alerts = [
        {
          roomNumber: '302',
          alertType: 'Cardiac Emergency',
          time: '10:30 AM',
          responseTime: 2,
          status: 'Resolved',
        },
        {
          roomNumber: '215',
          alertType: 'Fall Alert',
          time: '2:15 PM',
          responseTime: 5,
          status: 'Escalated',
        },
      ];
      return alerts;
    } catch (error) {
      log.error('Failed to get top alerts', 'HEALTHCARE_NOTIFY', error);
      return [];
    }
  }

  /**
   * Helper methods
   */
  private getPriority(urgencyLevel: number): Priority {
    if (urgencyLevel >= 5) return Priority.CRITICAL;
    if (urgencyLevel >= 3) return Priority.HIGH;
    if (urgencyLevel >= 2) return Priority.MEDIUM;
    return Priority.LOW;
  }

  private getEscalationMinutes(level: number): number {
    const escalationTimes = [5, 10, 15, 30, 60]; // Minutes per level
    return escalationTimes[Math.min(level - 1, escalationTimes.length - 1)];
  }

  private getNextEscalationRole(currentRole: string): string {
    const escalationChain: Record<string, string> = {
      'nurse': 'doctor',
      'doctor': 'head_doctor',
      'head_doctor': 'administration',
      'administration': 'emergency_contact',
    };
    return escalationChain[currentRole] || 'emergency_contact';
  }
}

// Export singleton instance
export const healthcareNotificationService = new HealthcareNotificationService();