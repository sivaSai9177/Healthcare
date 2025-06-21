import { AlertType, UrgencyLevel, ALERT_TYPE_CONFIG, URGENCY_LEVEL_CONFIG } from '@/types/healthcare';

// Alert type weights for priority calculation
const ALERT_TYPE_WEIGHTS: Record<AlertType, number> = {
  cardiac_arrest: 10,
  code_blue: 9,
  fire: 8,
  medical_emergency: 7,
  security: 6,
};

/**
 * Calculate alert priority based on type and urgency
 * Higher number = higher priority
 */
export function getAlertPriority(alertType: AlertType, urgencyLevel: UrgencyLevel): number {
  const typeWeight = ALERT_TYPE_WEIGHTS[alertType] || 1;
  return urgencyLevel * typeWeight;
}

/**
 * Get escalation time in minutes based on urgency level
 */
export function calculateEscalationTime(urgencyLevel: UrgencyLevel): number {
  const config = URGENCY_LEVEL_CONFIG[urgencyLevel];
  return config?.escalationMinutes || 15; // Default to 15 minutes
}

/**
 * Format alert message for display
 */
export function formatAlertMessage(alert: {
  alertType: AlertType;
  roomNumber: string;
  urgencyLevel: UrgencyLevel;
}): string {
  const typeLabel = alert.alertType.replace(/_/g, ' ').toUpperCase();
  const urgencyLabel = URGENCY_LEVEL_CONFIG[alert.urgencyLevel]?.label || 'Unknown';
  return `${typeLabel} - Room ${alert.roomNumber} (${urgencyLabel})`;
}

/**
 * Check if an alert is high priority
 * @param threshold - Priority threshold (default: 25)
 */
export function isHighPriorityAlert(
  alertType: AlertType,
  urgencyLevel: UrgencyLevel,
  threshold: number = 25
): boolean {
  return getAlertPriority(alertType, urgencyLevel) > threshold;
}

/**
 * Get response time target in minutes based on urgency
 */
export function getResponseTimeTarget(urgencyLevel: UrgencyLevel): number {
  const targets: Record<UrgencyLevel, number> = {
    1: 30,  // Low: 30 minutes
    2: 20,  // Medium-Low: 20 minutes
    3: 10,  // Moderate: 10 minutes
    4: 5,   // High: 5 minutes
    5: 2,   // Critical: 2 minutes
  };
  return targets[urgencyLevel] || 10;
}

/**
 * Calculate time remaining for escalation
 */
export function getTimeToEscalation(
  createdAt: Date,
  urgencyLevel: UrgencyLevel,
  currentTime: Date = new Date()
): {
  minutes: number;
  isOverdue: boolean;
  percentage: number;
} {
  const escalationMinutes = calculateEscalationTime(urgencyLevel);
  const elapsedMinutes = (currentTime.getTime() - createdAt.getTime()) / (1000 * 60);
  const remainingMinutes = escalationMinutes - elapsedMinutes;
  
  return {
    minutes: Math.max(0, Math.floor(remainingMinutes)),
    isOverdue: remainingMinutes < 0,
    percentage: Math.min(100, (elapsedMinutes / escalationMinutes) * 100),
  };
}

/**
 * Get alert severity for styling/display
 */
export function getAlertSeverity(urgencyLevel: UrgencyLevel): 'low' | 'medium' | 'high' | 'critical' {
  if (urgencyLevel <= 1) return 'low';
  if (urgencyLevel <= 2) return 'medium';
  if (urgencyLevel <= 4) return 'high';
  return 'critical';
}

/**
 * Validate alert creation input
 */
export function validateAlertInput(input: {
  roomNumber?: string;
  alertType?: string;
  urgencyLevel?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.roomNumber || input.roomNumber.trim().length === 0) {
    errors.push('Room number is required');
  }

  if (!input.alertType || !(input.alertType in ALERT_TYPE_CONFIG)) {
    errors.push('Valid alert type is required');
  }

  if (!input.urgencyLevel || input.urgencyLevel < 1 || input.urgencyLevel > 5) {
    errors.push('Urgency level must be between 1 and 5');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}