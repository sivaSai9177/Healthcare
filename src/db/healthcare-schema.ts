import { pgTable, uuid, varchar, integer, timestamp, text, check, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { users, departmentEnum } from './schema';
import { sql } from 'drizzle-orm';

// Healthcare-specific user fields (extends base users table)
export const healthcareUsers = pgTable('healthcare_users', {
  userId: text('user_id').primaryKey().references(() => users.id),
  hospitalId: varchar('hospital_id', { length: 255 }).notNull(),
  licenseNumber: varchar('license_number', { length: 100 }),
  department: departmentEnum('department'),
  specialization: varchar('specialization', { length: 100 }),
  isOnDuty: boolean('is_on_duty').default(false),
  shiftStartTime: timestamp('shift_start_time'),
  shiftEndTime: timestamp('shift_end_time'),
});

// Hospitals/Organizations
export const hospitals = pgTable('hospitals', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(), // Link to parent organization
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(), // Unique hospital code within organization
  address: text('address'),
  contactInfo: jsonb('contact_info'),
  settings: jsonb('settings'),
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false), // Default hospital for the organization
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orgDefaultIdx: index('idx_hospital_org_default').on(table.organizationId, table.isDefault),
  codeIdx: index('idx_hospital_code').on(table.code),
}));

// Alert types enum
export const alertTypeEnum = pgTable('alert_type_enum', {
  value: varchar('value', { length: 50 }).primaryKey(),
});

// Alerts table
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomNumber: varchar('room_number', { length: 10 }).notNull(),
  alertType: varchar('alert_type', { length: 50 }).notNull(),
  urgencyLevel: integer('urgency_level').notNull(),
  description: text('description'),
  createdBy: text('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  targetDepartment: departmentEnum('target_department'), // Which department should handle this alert
  acknowledgedBy: text('acknowledged_by').references(() => users.id),
  acknowledgedAt: timestamp('acknowledged_at'),
  escalationLevel: integer('escalation_level').default(1),
  currentEscalationTier: integer('current_escalation_tier').default(1),
  nextEscalationAt: timestamp('next_escalation_at'),
  resolvedAt: timestamp('resolved_at'),
  hospitalId: uuid('hospital_id').references(() => hospitals.id).notNull(),
  patientId: uuid('patient_id'),
  handoverNotes: text('handover_notes'),
  responseMetrics: jsonb('response_metrics'),
}, (table) => ({
  alertTypeCheck: check('alert_type_check', sql`${table.alertType} IN ('cardiac_arrest', 'code_blue', 'fire', 'security', 'medical_emergency')`),
  urgencyLevelCheck: check('urgency_level_check', sql`${table.urgencyLevel} BETWEEN 1 AND 5`),
  statusCheck: check('status_check', sql`${table.status} IN ('active', 'acknowledged', 'resolved')`),
  targetDepartmentIdx: index('idx_alerts_target_department').on(table.targetDepartment),
  statusTargetDeptIdx: index('idx_alerts_status_target_dept').on(table.status, table.targetDepartment),
}));

// Alert escalations
export const alertEscalations = pgTable('alert_escalations', {
  id: uuid('id').primaryKey().defaultRandom(),
  alertId: uuid('alert_id').references(() => alerts.id).notNull(),
  from_role: varchar('from_role', { length: 50 }).notNull(),
  to_role: varchar('to_role', { length: 50 }).notNull(),
  escalatedAt: timestamp('escalated_at').defaultNow(),
  reason: varchar('reason', { length: 255 }),
});

// Alert acknowledgments
export const alertAcknowledgments = pgTable('alert_acknowledgments', {
  id: uuid('id').primaryKey().defaultRandom(),
  alertId: uuid('alert_id').references(() => alerts.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  acknowledgedAt: timestamp('acknowledged_at').defaultNow(),
  responseTimeSeconds: integer('response_time_seconds'),
  notes: text('notes'),
  // New fields for comprehensive acknowledgment
  urgencyAssessment: varchar('urgency_assessment', { length: 20 }),
  responseAction: varchar('response_action', { length: 20 }),
  estimatedResponseTime: integer('estimated_response_time'), // in minutes
  delegatedTo: text('delegated_to').references(() => users.id),
}, (table) => ({
  responseActionIdx: index('idx_alert_acknowledgments_response_action').on(table.responseAction),
  delegatedToIdx: index('idx_alert_acknowledgments_delegated_to').on(table.delegatedTo),
}));


// Healthcare audit logs (extends base audit logging)
export const healthcareAuditLogs = pgTable('healthcare_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
  metadata: jsonb('metadata'),
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  hospitalId: uuid('hospital_id').references(() => hospitals.id),
  severity: varchar('severity', { length: 20 }).notNull().default('info'),
}, (table) => ({
  severityCheck: check('severity_check', sql`${table.severity} IN ('info', 'warning', 'error', 'critical')`),
  entityTypeCheck: check('entity_type_check', sql`${table.entityType} IN ('alert', 'user', 'system', 'permission', 'patient', 'auth', 'audit')`),
}));

// Departments
export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  hospitalId: uuid('hospital_id').references(() => hospitals.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  headDoctorId: text('head_doctor_id').references(() => users.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Shift schedules
export const shiftSchedules = pgTable('shift_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id).notNull(),
  hospitalId: uuid('hospital_id').references(() => hospitals.id).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  shiftDate: timestamp('shift_date').notNull(),
  shiftStartTime: timestamp('shift_start_time').notNull(),
  shiftEndTime: timestamp('shift_end_time').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Alert response metrics
export const alertMetrics = pgTable('alert_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  hospitalId: uuid('hospital_id').references(() => hospitals.id).notNull(),
  date: timestamp('date').notNull(),
  alertType: varchar('alert_type', { length: 50 }).notNull(),
  totalAlerts: integer('total_alerts').default(0),
  averageResponseTime: integer('average_response_time'), // in seconds
  averageResolutionTime: integer('average_resolution_time'), // in seconds
  escalationCount: integer('escalation_count').default(0),
  acknowledgedCount: integer('acknowledged_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Patient alerts junction table (moved here after alerts table)
export const patientAlerts = pgTable('patient_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull(),
  alertId: uuid('alert_id').references(() => alerts.id).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Alert timeline events for full lifecycle tracking
export const alertTimelineEvents = pgTable('alert_timeline_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  alertId: uuid('alert_id').references(() => alerts.id).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  eventTime: timestamp('event_time').defaultNow(),
  userId: text('user_id').references(() => users.id),
  description: text('description'),
  metadata: jsonb('metadata'),
}, (table) => ({
  eventTypeCheck: check('event_type_check', sql`${table.eventType} IN ('created', 'viewed', 'acknowledged', 'escalated', 'transferred', 'resolved', 'reopened', 'commented')`),
}));

// Export all healthcare tables
export const healthcareTables = {
  healthcareUsers,
  hospitals,
  alerts,
  alertEscalations,
  alertAcknowledgments,
  healthcareAuditLogs,
  departments,
  shiftSchedules,
  alertMetrics,
  patientAlerts,
  alertTimelineEvents,
};

// Type exports for TypeScript
export type HealthcareUser = typeof healthcareUsers.$inferSelect;
export type NewHealthcareUser = typeof healthcareUsers.$inferInsert;
export type Hospital = typeof hospitals.$inferSelect;
export type NewHospital = typeof hospitals.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type AlertEscalation = typeof alertEscalations.$inferSelect;
export type NewAlertEscalation = typeof alertEscalations.$inferInsert;
export type AlertAcknowledgment = typeof alertAcknowledgments.$inferSelect;
export type NewAlertAcknowledgment = typeof alertAcknowledgments.$inferInsert;
export type HealthcareAuditLog = typeof healthcareAuditLogs.$inferSelect;
export type NewHealthcareAuditLog = typeof healthcareAuditLogs.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type ShiftSchedule = typeof shiftSchedules.$inferSelect;
export type NewShiftSchedule = typeof shiftSchedules.$inferInsert;
export type AlertMetric = typeof alertMetrics.$inferSelect;
export type NewAlertMetric = typeof alertMetrics.$inferInsert;
export type PatientAlert = typeof patientAlerts.$inferSelect;
export type NewPatientAlert = typeof patientAlerts.$inferInsert;
export type AlertTimelineEvent = typeof alertTimelineEvents.$inferSelect;
export type NewAlertTimelineEvent = typeof alertTimelineEvents.$inferInsert;