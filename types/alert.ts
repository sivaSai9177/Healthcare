/**
 * Comprehensive type definitions for the Alert module
 * This file serves as the single source of truth for all alert-related types
 */

import { z } from 'zod';
import type { Alert as DBAlert, AlertAcknowledgment, AlertEscalation, AlertTimelineEvent } from '@/src/db/healthcare-schema';

// Re-export enums from healthcare types for consistency
export { 
  AlertType, 
  AlertStatus, 
  UrgencyLevel,
  UrgencyAssessment,
  ResponseAction,
  type AlertType as AlertTypeEnum,
  type AlertStatus as AlertStatusEnum,
  type UrgencyLevel as UrgencyLevelType,
  type UrgencyAssessment as UrgencyAssessmentType,
  type ResponseAction as ResponseActionType,
} from '@/types/healthcare';

// Re-export schemas
export {
  CreateAlertSchema,
  AcknowledgeAlertSchema,
  type CreateAlertInput,
  type AcknowledgeAlertInput,
} from '@/types/healthcare';

// Enhanced Alert type with all relations
export interface Alert extends DBAlert {
  // User relations
  createdByName?: string;
  acknowledgedByName?: string;
  resolvedByName?: string;
  
  // Patient relations
  patientName?: string;
  patientMRN?: string;
  
  // Computed fields
  responseTimeSeconds?: number;
  resolutionTimeSeconds?: number;
  isEscalated?: boolean;
  isOverdue?: boolean;
  timeUntilEscalation?: number | null;
  
  // Hospital info
  hospitalName?: string;
  departmentName?: string;
}

// Alert with full relations for detailed views
export interface AlertWithRelations extends Alert {
  acknowledgments: AlertAcknowledgment[];
  escalations: AlertEscalation[];
  timelineEvents: AlertTimelineEvent[];
  creator?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  acknowledgedByUser?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

// Alert list item for efficient list rendering
export interface AlertListItem {
  id: string;
  roomNumber: string;
  alertType: string;
  urgencyLevel: number;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
  createdByName: string;
  hospitalId: string;
  description?: string | null;
  acknowledgedByName?: string | null;
  acknowledgedAt?: Date | null;
  currentEscalationTier: number;
  nextEscalationAt?: Date | null;
  isHighlighted?: boolean;
}

// Alert timeline event with user info
export interface AlertTimelineEventWithUser extends AlertTimelineEvent {
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

// Alert metrics for analytics
export interface AlertMetrics {
  totalAlerts: number;
  activeAlerts: number;
  acknowledgedAlerts: number;
  resolvedAlerts: number;
  averageResponseTime: number; // in seconds
  averageResolutionTime: number; // in seconds
  escalationRate: number; // percentage
  acknowledgmentRate: number; // percentage
}

// Alert analytics data
export interface AlertAnalytics {
  summary: AlertMetrics;
  byAlertType: Record<string, {
    total: number;
    acknowledged: number;
    avgResponseTime: number;
  }>;
  byUrgency: Record<number, {
    total: number;
    acknowledged: number;
    escalated: number;
  }>;
  timeSeries: Array<{
    date: string;
    total: number;
    acknowledged: number;
    resolved: number;
    escalated: number;
  }>;
}

// WebSocket event types
export interface AlertWebSocketEvent {
  id: string;
  type: 'alert.created' | 'alert.acknowledged' | 'alert.resolved' | 'alert.escalated' | 'alert.updated';
  alertId: string;
  hospitalId: string;
  timestamp: Date;
  data?: {
    roomNumber?: string;
    alertType?: string;
    urgencyLevel?: number;
    toTier?: number;
    fromTier?: number;
    acknowledgedBy?: string;
    [key: string]: any;
  };
}

// Alert filter options
export interface AlertFilters {
  status?: 'all' | 'active' | 'acknowledged' | 'resolved';
  urgencyLevel?: number | 'all';
  alertType?: string | 'all';
  department?: string | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

// Alert sort options
export interface AlertSortOptions {
  sortBy: 'createdAt' | 'urgencyLevel' | 'acknowledgedAt' | 'roomNumber';
  sortOrder: 'asc' | 'desc';
}

// Alert pagination
export interface AlertPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextCursor?: string | null;
}

// Alert query response
export interface AlertQueryResponse {
  alerts: Alert[];
  pagination: AlertPagination;
}

// Alert action permissions
export interface AlertPermissions {
  canCreate: boolean;
  canAcknowledge: boolean;
  canResolve: boolean;
  canEscalate: boolean;
  canTransfer: boolean;
  canViewDetails: boolean;
  canViewAnalytics: boolean;
}

// Alert template for quick creation
export interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  alertType: string;
  urgencyLevel: number;
  defaultDescription?: string;
  icon?: string;
  color?: string;
  department?: string;
  isActive: boolean;
}

// Alert notification preferences
export interface AlertNotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  criticalAlertsOverrideDND: boolean;
  alertTypes: Record<string, boolean>;
  urgencyLevels: Record<number, boolean>;
}

// Type guards
export function isAlert(obj: any): obj is Alert {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.roomNumber === 'string' &&
    typeof obj.alertType === 'string' &&
    typeof obj.urgencyLevel === 'number' &&
    typeof obj.status === 'string';
}

export function isAlertWebSocketEvent(obj: any): obj is AlertWebSocketEvent {
  return obj &&
    typeof obj.type === 'string' &&
    obj.type.startsWith('alert.') &&
    typeof obj.alertId === 'string' &&
    typeof obj.hospitalId === 'string';
}

// Utility types
export type AlertUpdateInput = Partial<Pick<Alert, 
  'status' | 'acknowledgedBy' | 'acknowledgedAt' | 'resolvedAt' | 
  'escalationLevel' | 'currentEscalationTier' | 'nextEscalationAt' | 
  'handoverNotes' | 'responseMetrics'
>>;

export type AlertCreatePayload = z.infer<typeof CreateAlertSchema>;
export type AlertAcknowledgePayload = z.infer<typeof AcknowledgeAlertSchema>;

// Constants
export const ALERT_STATUS_COLORS = {
  active: '#ef4444',
  acknowledged: '#f59e0b',
  resolved: '#10b981',
} as const;

export const URGENCY_COLORS = {
  1: '#dc2626', // Critical - Red
  2: '#ea580c', // High - Orange
  3: '#f59e0b', // Medium - Yellow
  4: '#10b981', // Low - Green
  5: '#3b82f6', // Info - Blue
} as const;

export const ALERT_TYPE_ICONS = {
  cardiac_arrest: '❤️',
  code_blue: '🚨',
  fire: '🔥',
  security: '🔒',
  medical_emergency: '🏥',
} as const;