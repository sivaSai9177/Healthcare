import { z } from 'zod';

// Healthcare User Roles
export const HealthcareUserRole = z.enum([
  'operator',
  'doctor', 
  'nurse',
  'head_doctor',
  'admin'
]);

export type HealthcareUserRole = z.infer<typeof HealthcareUserRole>;

// Alert Types
export const AlertType = z.enum([
  'cardiac_arrest',
  'code_blue',
  'fire',
  'security',
  'medical_emergency'
]);

export type AlertType = z.infer<typeof AlertType>;

// Urgency Levels
export const UrgencyLevel = z.union([
  z.literal(1), // Critical
  z.literal(2), // High
  z.literal(3), // Medium
  z.literal(4), // Low
  z.literal(5), // Information
]);

export type UrgencyLevel = z.infer<typeof UrgencyLevel>;

// Alert Status
export const AlertStatus = z.enum([
  'active',
  'acknowledged',
  'resolved'
]);

export type AlertStatus = z.infer<typeof AlertStatus>;
export type UrgencyAssessment = z.infer<typeof UrgencyAssessment>;
export type ResponseAction = z.infer<typeof ResponseAction>;

// Notification Types
export const NotificationType = z.enum([
  'push',
  'sms',
  'email',
  'in_app'
]);

export type NotificationType = z.infer<typeof NotificationType>;

// Department Types
export type DepartmentType = 
  | 'emergency'
  | 'cardiology'
  | 'orthopedics'
  | 'pediatrics'
  | 'obstetrics'
  | 'neurology'
  | 'oncology'
  | 'radiology'
  | 'pathology'
  | 'psychiatry'
  | 'general';

// Department Configuration
export const DEPARTMENT_CONFIG: Record<DepartmentType, { icon: string; color: string; label: string }> = {
  emergency: {
    icon: '🚨',
    color: '#FF0000',
    label: 'Emergency'
  },
  cardiology: {
    icon: '❤️',
    color: '#E91E63',
    label: 'Cardiology'
  },
  orthopedics: {
    icon: '🦴',
    color: '#795548',
    label: 'Orthopedics'
  },
  pediatrics: {
    icon: '👶',
    color: '#4CAF50',
    label: 'Pediatrics'
  },
  obstetrics: {
    icon: '🤰',
    color: '#FF69B4',
    label: 'Obstetrics'
  },
  neurology: {
    icon: '🧠',
    color: '#9C27B0',
    label: 'Neurology'
  },
  oncology: {
    icon: '🎗️',
    color: '#FF9800',
    label: 'Oncology'
  },
  radiology: {
    icon: '📷',
    color: '#607D8B',
    label: 'Radiology'
  },
  pathology: {
    icon: '🔬',
    color: '#00BCD4',
    label: 'Pathology'
  },
  psychiatry: {
    icon: '🧘',
    color: '#3F51B5',
    label: 'Psychiatry'
  },
  general: {
    icon: '🏥',
    color: '#2196F3',
    label: 'General'
  }
};

// Gender Types
export type Gender = 'male' | 'female' | 'other';

// Healthcare Role Permissions
export const healthcareRolePermissions: Record<HealthcareUserRole, string[]> = {
  admin: ['*'], // Admin can access everything
  head_doctor: ['view_patients', 'acknowledge_alerts', 'view_analytics', 'manage_users', 'manage_departments'],
  doctor: ['view_patients', 'acknowledge_alerts', 'view_alerts'],
  nurse: ['acknowledge_alerts', 'view_alerts', 'view_tasks'],
  operator: ['create_alerts', 'view_alerts', 'view_logs'],
};

// Escalation Configuration
export interface EscalationConfig {
  role: HealthcareUserRole;
  timeout_minutes: number;
  next_tier: HealthcareUserRole | 'all_staff';
  notification_template: string;
}

export const HEALTHCARE_ESCALATION_TIERS: EscalationConfig[] = [
  { 
    role: 'nurse', 
    timeout_minutes: 2, 
    next_tier: 'doctor', 
    notification_template: 'tier_1_escalation' 
  },
  { 
    role: 'doctor', 
    timeout_minutes: 3, 
    next_tier: 'head_doctor', 
    notification_template: 'tier_2_escalation' 
  },
  { 
    role: 'head_doctor', 
    timeout_minutes: 2, 
    next_tier: 'all_staff', 
    notification_template: 'tier_3_escalation' 
  }
];

// Alert Type Configuration
export const ALERT_TYPE_CONFIG = {
  cardiac_arrest: {
    label: 'Cardiac Arrest',
    defaultUrgency: 1,
    color: '#FF0000',
    icon: '🚨',
    sound: 'critical',
    requiresConfirmation: true,
  },
  code_blue: {
    label: 'Code Blue',
    defaultUrgency: 2,
    color: '#0000FF',
    icon: '🚑',
    sound: 'urgent',
    requiresConfirmation: true,
  },
  fire: {
    label: 'Fire Emergency',
    defaultUrgency: 1,
    color: '#FF4500',
    icon: '🔥',
    sound: 'critical',
    requiresConfirmation: true,
  },
  security: {
    label: 'Security Alert',
    defaultUrgency: 2,
    color: '#800080',
    icon: '🔒',
    sound: 'urgent',
    requiresConfirmation: true,
  },
  medical_emergency: {
    label: 'Medical Emergency',
    defaultUrgency: 3,
    color: '#FFA500',
    icon: '⚕️',
    sound: 'normal',
    requiresConfirmation: false,
  },
};

// Urgency Level Configuration
export const URGENCY_LEVEL_CONFIG = {
  1: { label: 'Critical', color: '#FF0000', textColor: '#FFFFFF', escalationMinutes: 5 },
  2: { label: 'High', color: '#FF4500', textColor: '#FFFFFF', escalationMinutes: 10 },
  3: { label: 'Moderate', color: '#FFA500', textColor: '#000000', escalationMinutes: 15 },
  4: { label: 'Low', color: '#32CD32', textColor: '#000000', escalationMinutes: 30 },
  5: { label: 'Information', color: '#4169E1', textColor: '#FFFFFF', escalationMinutes: 60 },
};

// Healthcare-specific validation schemas

/**
 * Schema for creating a new alert
 * @property roomNumber - The room number where the alert originates (e.g., "302", "ICU-1")
 * @property alertType - Type of alert (cardiac_arrest, code_blue, fire, security, medical_emergency)
 * @property urgencyLevel - Urgency level from 1 (Critical) to 5 (Information)
 * @property description - Optional additional context for the alert (max 500 chars)
 * @property hospitalId - UUID of the hospital/organization creating the alert
 */
export const CreateAlertSchema = z.object({
  roomNumber: z.string()
    .min(1, "Room number is required")
    .max(10, "Room number cannot exceed 10 characters")
    .regex(/^[A-Z0-9]{1,4}(-[A-Z0-9]{1,3})?$/i, "Invalid room format (e.g., 302, ICU-1)"),
  alertType: AlertType,
  urgencyLevel: UrgencyLevel,
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  hospitalId: z.string().uuid("Invalid hospital ID format"),
  targetDepartment: z.string().optional(), // Optional department targeting
});

// Urgency Assessment Options
export const UrgencyAssessment = z.enum([
  'maintain',
  'increase', 
  'decrease'
]);

// Response Action Options
export const ResponseAction = z.enum([
  'responding',      // Responding immediately
  'delayed',         // Responding with delay
  'delegating',      // Delegating to another staff member
  'monitoring'       // Monitoring remotely
]);

/**
 * Schema for acknowledging an alert
 * @property alertId - UUID of the alert being acknowledged
 * @property urgencyAssessment - Assessment of urgency (maintain, increase, decrease)
 * @property responseAction - Action being taken (responding, delayed, delegating, monitoring)
 * @property estimatedResponseTime - Time in minutes (1-999), required for responding/delayed actions
 * @property delegateTo - UUID of user to delegate to, required for delegating action
 * @property notes - Optional notes about the acknowledgment (max 500 chars)
 */
export const AcknowledgeAlertSchema = z.object({
  alertId: z.string().uuid("Invalid alert ID format"),
  urgencyAssessment: UrgencyAssessment,
  responseAction: ResponseAction,
  estimatedResponseTime: z.number()
    .min(1, "Response time must be at least 1 minute")
    .max(999, "Response time cannot exceed 999 minutes")
    .optional(),
  delegateTo: z.string().uuid("Invalid user ID format").optional(),
  notes: z.string()
    .min(1, "Notes cannot be empty")
    .max(500, "Notes cannot exceed 500 characters")
    .optional(),
}).refine(
  (data) => {
    // Validate required fields based on response action
    if ((data.responseAction === 'responding' || data.responseAction === 'delayed') && !data.estimatedResponseTime) {
      return false;
    }
    if (data.responseAction === 'delegating' && !data.delegateTo) {
      return false;
    }
    return true;
  },
  {
    message: "Missing required fields for selected response action",
    path: ["responseAction"],
  }
);

/**
 * Schema for updating a user's healthcare role
 * @property userId - UUID of the user to update
 * @property role - New healthcare role (operator, doctor, nurse, head_doctor, admin)
 * @property hospitalId - UUID of the hospital/organization
 * @property department - Department assignment (required for medical roles)
 * @property licenseNumber - Medical license number (required for medical roles)
 */
export const UpdateUserRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  role: HealthcareUserRole,
  hospitalId: z.string().uuid("Invalid hospital ID format"),
  department: z.string()
    .min(2, "Department name must be at least 2 characters")
    .optional(),
  licenseNumber: z.string()
    .min(5, "License number must be at least 5 characters")
    .max(15, "License number cannot exceed 15 characters")
    .optional(),
}).refine(
  (data) => {
    // Medical roles require department and license
    const medicalRoles = ['doctor', 'nurse', 'head_doctor'];
    if (medicalRoles.includes(data.role)) {
      return !!(data.department && data.licenseNumber);
    }
    return true;
  },
  {
    message: "Medical roles require department and license number",
    path: ["role"],
  }
);

/**
 * Schema for healthcare user profile
 * @property hospitalId - UUID of the hospital/organization
 * @property licenseNumber - Medical license number (5-15 characters)
 * @property department - Department assignment (e.g., Emergency, ICU, Cardiology)
 * @property specialization - Optional area of specialization
 * @property isOnDuty - Whether the user is currently on duty
 */
export const HealthcareProfileSchema = z.object({
  hospitalId: z.string().uuid("Invalid hospital ID format"),
  licenseNumber: z.string()
    .min(5, "License number must be at least 5 characters")
    .max(15, "License number cannot exceed 15 characters")
    .regex(/^[A-Z0-9]+$/i, "License number can only contain letters and numbers"),
  department: z.string()
    .min(2, "Department is required")
    .max(50, "Department name is too long"),
  specialization: z.string()
    .max(100, "Specialization is too long")
    .optional(),
  isOnDuty: z.boolean().default(false),
});

// Type exports
export type CreateAlertInput = z.infer<typeof CreateAlertSchema>;
export type AcknowledgeAlertInput = z.infer<typeof AcknowledgeAlertSchema>;
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
export type HealthcareProfileInput = z.infer<typeof HealthcareProfileSchema>;

// Response schemas for API validation

/**
 * Schema for alert creation response
 */
export const CreateAlertResponseSchema = z.object({
  success: z.boolean(),
  alert: z.object({
    id: z.string().uuid(),
    roomNumber: z.string(),
    alertType: AlertType,
    urgencyLevel: UrgencyLevel,
    status: AlertStatus,
    createdAt: z.date(),
    hospitalId: z.string().uuid(),
  }),
});

/**
 * Schema for alert acknowledgment response
 */
export const AcknowledgeAlertResponseSchema = z.object({
  success: z.boolean(),
  responseTimeSeconds: z.number().positive(),
});

/**
 * Schema for active alerts query response
 */
export const ActiveAlertsResponseSchema = z.object({
  alerts: z.array(z.object({
    id: z.string().uuid(),
    alertType: AlertType,
    urgencyLevel: UrgencyLevel,
    roomNumber: z.string(),
    patientId: z.string().uuid().nullable(),
    patientName: z.string().nullable(),
    description: z.string().nullable(),
    status: AlertStatus,
    hospitalId: z.string().uuid(),
    createdAt: z.date(),
    createdBy: z.string(),
    acknowledgedBy: z.string().nullable(),
    acknowledgedAt: z.date().nullable(),
    currentEscalationTier: z.number(),
    nextEscalationAt: z.date().nullable(),
    escalationLevel: z.number(),
    resolvedAt: z.date().nullable(),
  })),
  total: z.number().nonnegative(),
});

// Re-export common types
export type { Alert, AlertWithRelations } from './common';

// Re-export utility functions
export {
  getAlertPriority,
  calculateEscalationTime,
  formatAlertMessage,
  isHighPriorityAlert,
  getResponseTimeTarget,
  getTimeToEscalation,
  getAlertSeverity,
  validateAlertInput,
} from '@/lib/healthcare/alert-utils';